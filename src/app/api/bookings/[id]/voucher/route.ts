import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";
import { ensureSettingsColumns } from "@/lib/ensure-settings-columns";

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

  let settings = null;
  try { await ensureSettingsColumns(); settings = await prisma.hotelSetting.findUnique({ where: { id: "default" } }); } catch { /* ignore */ }

  return Response.json({
    voucher: {
      bookingRef: booking.bookingRef,
      guestName: [primaryGuest?.nom, primaryGuest?.prenom].filter(Boolean).join(" ") || "N/A",
      guestPhone: primaryGuest?.phone || "",
      isMarried: booking.isMarried,
      acte: booking.acte,
      allGuests,
      checkIn: booking.checkIn.toISOString().split("T")[0],
      checkOut: booking.checkOut.toISOString().split("T")[0],
      rooms: booking.bookingRooms.map((br) => ({
        roomNumber: br.room.roomNumber,
        floor: br.room.floor.name,
        type: br.room.roomType?.name || br.room.bedLayout,
        bedLayout: br.room.bedLayout,
        priceAtBooking: Number(br.priceAtBooking),
      })),
      childrenCharge: Number(booking.childrenCharge),
      childrenAges: booking.childrenAges.map((c) => c.age),
      totalAmount: Number(booking.totalAmount),
      discountAmount: Number(booking.discountAmount),
      discountCode: booking.discountCode,
      paymentMethod: booking.paymentMethod,
      partner: booking.partner
        ? { name: booking.partner.name, contactPhone: booking.partner.contactPhone }
        : null,
      receptionist: booking.receptionist.name,
      createdAt: booking.createdAt.toISOString(),
      hotel: settings
        ? {
            name: settings.hotelName,
            address: settings.hotelAddress,
            phone: settings.hotelPhone,
            whatsapp: settings.hotelWhatsApp,
            email: settings.hotelEmail,
            logoUrl: settings.logoUrl,
            checkInTime: settings.checkInTime,
            checkOutTime: settings.checkOutTime,
            footerMessage: settings.footerMessage,
            currencySymbol: settings.currencySymbol,
          }
        : null,
    },
  });
}
