import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const bookingGuests = await prisma.bookingGuest.findMany({
    where: { clientId: id },
    include: {
      booking: {
        include: {
          bookingRooms: { include: { room: true } },
          receptionist: { select: { name: true } },
        },
      },
    },
    orderBy: { booking: { createdAt: "desc" } },
  });

  const bookings = bookingGuests.map((bg) => ({
    id: bg.bookingId,
    bookingRef: bg.booking.bookingRef,
    roomNumbers: bg.booking.bookingRooms.map((br) => br.room.roomNumber).join(", "),
    checkIn: bg.booking.checkIn.toISOString().split("T")[0],
    checkOut: bg.booking.checkOut.toISOString().split("T")[0],
    totalAmount: Number(bg.booking.totalAmount),
    status: bg.booking.status,
    paymentMethod: bg.booking.paymentMethod,
    receptionist: bg.booking.receptionist.name,
    createdAt: bg.booking.createdAt.toISOString(),
  }));

  return Response.json({ bookings });
}
