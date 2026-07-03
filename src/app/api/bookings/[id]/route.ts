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
