import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { bookingRooms: true },
  });
  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return Response.json({ error: "Booking is already cancelled" }, { status: 400 });
  }
  if (booking.status === "CHECKED_OUT") {
    return Response.json({ error: "Cannot cancel a checked-out booking" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { reasonCategory, reasonText, calledBack } = body;

    if (!reasonCategory?.trim()) {
      return Response.json({ error: "reasonCategory is required" }, { status: 400 });
    }
    if (!reasonText?.trim()) {
      return Response.json({ error: "reasonText is required" }, { status: 400 });
    }

    const existing = await prisma.cancellation.findUnique({
      where: { bookingId: id },
    });
    if (existing) {
      return Response.json({ error: "Cancellation already exists for this booking" }, { status: 409 });
    }

    await prisma.cancellation.create({
      data: {
        bookingId: id,
        reasonCategory: reasonCategory.trim(),
        reasonText: reasonText.trim(),
        cancelledBy: auth.payload.userId,
        calledBack: calledBack === true,
      },
    });

    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const roomIds = booking.bookingRooms.map((br) => br.roomId);
    await prisma.room.updateMany({
      where: { id: { in: roomIds } },
      data: { status: "AVAILABLE" },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
