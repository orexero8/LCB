import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingRooms: {
        include: { room: { include: { floor: true, roomType: true } } },
      },
      bookingGuests: { include: { client: true } },
      childrenAges: true,
      partner: true,
      receptionist: true,
      preReservation: { select: { id: true } },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const primaryGuest = booking.bookingGuests.find((g) => g.isPrimary)?.client;
  const allGuests = booking.bookingGuests.map((g) => ({
    nom: g.client.nom,
    prenom: g.client.prenom,
    maidenName: g.client.maidenName,
    dateOfBirth: g.client.dateOfBirth?.toISOString().split("T")[0] || null,
    profession: g.client.profession,
    address: g.client.address,
    nationality: g.client.nationality,
    email: g.client.email,
    idDocument: g.client.idDocument,
    idDeliveryDate: g.client.idDeliveryDate?.toISOString().split("T")[0] || null,
    idDeliveryPlace: g.client.idDeliveryPlace,
    idAuthority: g.client.idAuthority,
    phone: g.client.phone,
    wilaya: g.client.wilaya,
    isPrimary: g.isPrimary,
  }));

  const settings = await prisma.hotelSetting.findUnique({ where: { id: "default" } });

  const nights = Math.ceil(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Response.json({
    booking: {
      id: booking.id,
      bookingRef: booking.bookingRef,
      checkIn: booking.checkIn.toISOString().split("T")[0],
      checkOut: booking.checkOut.toISOString().split("T")[0],
      nights,
      status: booking.status,
      isMarried: booking.isMarried,
      acte: booking.acte,
      totalAmount: Number(booking.totalAmount),
      discountAmount: Number(booking.discountAmount),
      discountCode: booking.discountCode,
      paymentMethod: booking.paymentMethod,
      notes: booking.notes,
      fromPreReservation: !!booking.preReservation,
      createdAt: booking.createdAt.toISOString(),
      primaryGuest: primaryGuest
        ? {
            nom: primaryGuest.nom,
            prenom: primaryGuest.prenom,
            maidenName: primaryGuest.maidenName,
            dateOfBirth: primaryGuest.dateOfBirth?.toISOString().split("T")[0] || null,
            profession: primaryGuest.profession,
            address: primaryGuest.address,
            nationality: primaryGuest.nationality,
            email: primaryGuest.email,
            phone: primaryGuest.phone,
            idDocument: primaryGuest.idDocument,
            idDeliveryDate: primaryGuest.idDeliveryDate?.toISOString().split("T")[0] || null,
            idDeliveryPlace: primaryGuest.idDeliveryPlace,
            idAuthority: primaryGuest.idAuthority,
            wilaya: primaryGuest.wilaya,
            gender: primaryGuest.gender,
          }
        : null,
      allGuests,
      rooms: booking.bookingRooms.map((br) => ({
        roomNumber: br.room.roomNumber,
        floor: br.room.floor.name,
        type: br.room.roomType?.name || br.room.bedLayout,
        bedLayout: br.room.bedLayout,
        priceAtBooking: Number(br.priceAtBooking),
      })),
      childrenCharge: Number(booking.childrenCharge),
      children: booking.childrenAges.map((c) => ({
        nom: c.nom,
        prenom: c.prenom,
        age: c.age,
        dateOfBirth: c.dateOfBirth?.toISOString().split("T")[0] || null,
        wilaya: c.wilaya,
        idDocument: c.idDocument,
        idDeliveryDate: c.idDeliveryDate?.toISOString().split("T")[0] || null,
        idDeliveryPlace: c.idDeliveryPlace,
        idAuthority: c.idAuthority,
      })),
      partner: booking.partner
        ? { name: booking.partner.name, contactPhone: booking.partner.contactPhone }
        : null,
      receptionist: booking.receptionist.name,
      hotel: settings
        ? {
            name: settings.hotelName,
            address: settings.hotelAddress,
            phone: settings.hotelPhone,
            whatsapp: settings.hotelWhatsApp,
            email: settings.hotelEmail,
            logoUrl: settings.logoUrl,
          }
        : null,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { checkOut, notes, guestNom, guestPrenom, guestPhone, guestIdDocument, guestIdDeliveryDate, guestIdDeliveryPlace, guestIdAuthority } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingGuests: { where: { isPrimary: true }, include: { client: true } },
        bookingRooms: true,
      },
    });

    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut);
    if (notes !== undefined) updateData.notes = notes;

    if (checkOut !== undefined) {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights > 0) {
        const totalPrice = booking.bookingRooms.reduce(
          (sum, br) => sum + Number(br.priceAtBooking) * nights,
          0
        );
        updateData.totalAmount = totalPrice;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.booking.update({ where: { id }, data: updateData });
    }

    if (booking.bookingGuests[0]?.client) {
      const clientUpdate: any = {};
      if (guestNom !== undefined) clientUpdate.nom = guestNom;
      if (guestPrenom !== undefined) clientUpdate.prenom = guestPrenom;
      if (guestPhone !== undefined) clientUpdate.phone = guestPhone;
      if (guestIdDocument !== undefined) clientUpdate.idDocument = guestIdDocument;
      if (guestIdDeliveryDate !== undefined) clientUpdate.idDeliveryDate = guestIdDeliveryDate ? new Date(guestIdDeliveryDate) : null;
      if (guestIdDeliveryPlace !== undefined) clientUpdate.idDeliveryPlace = guestIdDeliveryPlace;
      if (guestIdAuthority !== undefined) clientUpdate.idAuthority = guestIdAuthority;

      if (Object.keys(clientUpdate).length > 0) {
        await prisma.client.update({
          where: { id: booking.bookingGuests[0].client.id },
          data: clientUpdate,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update booking";
    return Response.json({ error: msg }, { status: 500 });
  }
}
