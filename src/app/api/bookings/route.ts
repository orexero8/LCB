import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (q) {
    where.OR = [
      { bookingRef: { contains: q, mode: "insensitive" } },
      { bookingGuests: { some: { client: { nom: { contains: q, mode: "insensitive" } } } } },
      { bookingGuests: { some: { client: { prenom: { contains: q, mode: "insensitive" } } } } },
      { bookingGuests: { some: { client: { phone: { contains: q } } } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      where.createdAt.lte = d;
    }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        bookingRooms: { include: { room: true } },
        bookingGuests: { include: { client: true }, where: { isPrimary: true }, take: 1 },
        receptionist: { select: { name: true } },
        partner: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  const data = bookings.map((b) => {
    const nights = Math.ceil(
      (b.checkOut.getTime() - b.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: b.id,
      bookingRef: b.bookingRef,
      guestName: [b.bookingGuests[0]?.client?.nom, b.bookingGuests[0]?.client?.prenom].filter(Boolean).join(" ") || "N/A",
      guestPhone: b.bookingGuests[0]?.client?.phone || "",
      roomNumbers: b.bookingRooms.map((br) => br.room.roomNumber).join(", "),
      checkIn: b.checkIn.toISOString().split("T")[0],
      checkOut: b.checkOut.toISOString().split("T")[0],
      nights,
      totalAmount: Number(b.totalAmount),
      status: b.status,
      paymentMethod: b.paymentMethod,
      receptionist: b.receptionist.name,
      partner: b.partner?.name || null,
      createdAt: b.createdAt.toISOString(),
    };
  });

  return Response.json({ bookings: data, total, page, limit, pages: Math.ceil(total / limit) });
}

function generateBookingRef(): string {
  const now = new Date();
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LCB-${yymmdd}-${rand}`;
}

export async function POST(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const {
      roomIds,
      checkIn,
      checkOut,
      client,
      isMarried,
      acte,
      childrenAges,
      additionalGuests,
      discountCode,
      discountAmount,
      notes,
      paymentMethod,
      partnerId,
    } = body;

    if (!roomIds?.length || !checkIn || !checkOut || !client?.nom || !client?.prenom) {
      return Response.json({ error: "Missing required fields: roomIds, checkIn, checkOut, client.nom, client.prenom" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return Response.json({ error: "La date d'arrivée ne peut pas être dans le passé" }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return Response.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
    });
    if (rooms.length !== roomIds.length) {
      return Response.json({ error: "One or more rooms not found" }, { status: 404 });
    }

    const alreadyBooked = await prisma.bookingRoom.findFirst({
      where: {
        roomId: { in: roomIds },
        booking: {
          status: "ACTIVE",
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      },
    });
    if (alreadyBooked) {
      return Response.json({ error: "One or more rooms are already booked for these dates" }, { status: 409 });
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalBeforeDiscount = rooms.reduce((sum, r) => sum + Number(r.pricePerNight) * nights, 0);

    let childrenCharge = 0;
    if (childrenAges?.length) {
      const basePrice = Number(rooms[0]?.pricePerNight || 0);
      childrenCharge = childrenAges.reduce((sum: number, child: any) => {
        const age = typeof child === "number" ? child : child.age;
        if (age < 3) return sum;
        if (age <= 12) return sum + basePrice * 0.5 * nights;
        return sum + basePrice * nights;
      }, 0);
    }

    let discount = parseFloat(discountAmount || 0);

    // If a discount code was provided, validate it server-side
    if (discountCode) {
      try {
        const validCode = await prisma.discount.findUnique({ where: { code: discountCode.toUpperCase() } });
        if (validCode && validCode.isActive) {
          const now = new Date();
          if (now >= validCode.validFrom && now <= validCode.validUntil) {
            if (validCode.maxUses === 0 || validCode.usedCount < validCode.maxUses) {
              const calcDiscount = validCode.type === "PERCENTAGE"
                ? Math.round((totalBeforeDiscount * Number(validCode.value)) / 100)
                : Number(validCode.value);
              discount = Math.min(calcDiscount, totalBeforeDiscount);
              await prisma.discount.update({
                where: { id: validCode.id },
                data: { usedCount: { increment: 1 } },
              });
            }
          }
        }
      } catch {
        // Silently fall back to client-provided discount amount
      }
    }

    const totalAmount = Math.max(0, totalBeforeDiscount + childrenCharge - discount);

    const bookingRef = generateBookingRef();

    let clientRecord;
    if (client.id) {
      clientRecord = await prisma.client.findUnique({ where: { id: client.id } });
      if (!clientRecord) {
        return Response.json({ error: "Client not found" }, { status: 404 });
      }
      await prisma.client.update({
        where: { id: client.id },
        data: {
          nom: client.nom,
          prenom: client.prenom,
          maidenName: client.maidenName || null,
          dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth) : null,
          profession: client.profession || null,
          address: client.address || null,
          nationality: client.nationality || null,
          email: client.email || null,
          phone: client.phone,
          idDocument: client.idDocument,
          idDeliveryDate: client.idDeliveryDate ? new Date(client.idDeliveryDate) : null,
          idDeliveryPlace: client.idDeliveryPlace || null,
          idAuthority: client.idAuthority || null,
          wilaya: client.wilaya,
          gender: client.gender,
        },
      });
    } else {
      clientRecord = await prisma.client.create({
        data: {
          nom: client.nom,
          prenom: client.prenom,
          maidenName: client.maidenName || null,
          dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth) : null,
          profession: client.profession || null,
          address: client.address || null,
          nationality: client.nationality || null,
          email: client.email || null,
          phone: client.phone || "",
          idDocument: client.idDocument || "",
          idDeliveryDate: client.idDeliveryDate ? new Date(client.idDeliveryDate) : null,
          idDeliveryPlace: client.idDeliveryPlace || null,
          idAuthority: client.idAuthority || null,
          wilaya: client.wilaya || "",
          gender: client.gender || "MALE",
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        discountCode: discountCode || null,
        discountAmount: discount,
        notes: notes || null,
        childrenCharge,
        totalAmount,
        paymentMethod,
        partnerId: partnerId || null,
        status: "ACTIVE",
        isMarried: isMarried || false,
        acte: acte || null,
        isGroup: roomIds.length > 1,
        receptionistId: auth.payload.userId,
        bookingRooms: {
          create: rooms.map((room) => ({
            roomId: room.id,
            priceAtBooking: Number(room.pricePerNight),
          })),
        },
        bookingGuests: {
          create: [
            { client: { connect: { id: clientRecord.id } }, isPrimary: true },
            ...(additionalGuests?.length
              ? additionalGuests.map((g: any) => ({
                  client: {
                    create: {
                      nom: g.nom,
                      prenom: g.prenom,
                      maidenName: g.maidenName || null,
                      dateOfBirth: g.dateOfBirth ? new Date(g.dateOfBirth) : null,
                      profession: g.profession || null,
                      address: g.address || null,
                      email: g.email || null,
                      phone: g.phone || "",
                      idDocument: g.idDocument || "",
                      idDeliveryDate: g.idDeliveryDate ? new Date(g.idDeliveryDate) : null,
                      idDeliveryPlace: g.idDeliveryPlace || null,
                      idAuthority: g.idAuthority || null,
                      nationality: g.nationality || null,
                      wilaya: g.wilaya || "",
                      gender: g.gender || "MALE",
                    },
                  },
                  isPrimary: false,
                }))
              : []),
          ],
        },
        ...(childrenAges?.length
          ? {
              childrenAges: {
                create: childrenAges.map((child: any) => {
                  const nom = typeof child === "string" ? child : child.nom || "";
                  const prenom = typeof child === "string" ? "" : child.prenom || "";
                  const age = typeof child === "number" ? child : child.age;
                  const id = typeof child === "object" ? child : {};
                  return {
                    nom: nom || `Enfant`,
                    prenom: prenom || `(${age} ans)`,
                    age,
                    dateOfBirth: id.dateOfBirth ? new Date(id.dateOfBirth) : null,
                    wilaya: id.wilaya || null,
                    idDocument: id.idDocument || null,
                    idDeliveryDate: id.idDeliveryDate ? new Date(id.idDeliveryDate) : null,
                    idDeliveryPlace: id.idDeliveryPlace || null,
                    idAuthority: id.idAuthority || null,
                  };
                }),
              },
            }
          : {}),
      },
      include: {
        bookingRooms: { include: { room: true } },
        bookingGuests: { include: { client: true } },
        childrenAges: true,
      },
    });

    await prisma.room.updateMany({
      where: { id: { in: roomIds } },
      data: { status: "RESERVED" },
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create booking";
    console.error("Booking creation error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
