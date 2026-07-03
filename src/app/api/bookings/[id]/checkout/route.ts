import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(_request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { bookingRooms: true },
  });
  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "ACTIVE") {
    return Response.json({ error: "Booking is not active" }, { status: 400 });
  }

  const roomIds = booking.bookingRooms.map((br) => br.roomId);

  await prisma.booking.update({
    where: { id },
    data: { status: "CHECKED_OUT" },
  });

  await prisma.room.updateMany({
    where: { id: { in: roomIds } },
    data: { status: "AVAILABLE" },
  });

  return Response.json({ success: true });
}
