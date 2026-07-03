import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const yesterday = new Date(Date.now() - 86400000);

  const [cancellations, pendingCheckouts, rooms, totalRooms] = await Promise.all([
    prisma.cancellation.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { bookingRef: true } },
        cancelledByUser: { select: { name: true } },
      },
    }),
    prisma.checkoutAlert.findMany({
      where: { ready: false },
      include: {
        room: { select: { roomNumber: true } },
        booking: {
          select: { bookingRef: true },
        },
      },
      orderBy: { checkedOutAt: "desc" },
    }),
    prisma.room.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.room.count(),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const r of rooms) {
    statusCounts[r.status] = r._count;
  }

  const lastWeek = new Date(Date.now() - 7 * 86400000);
  const recentBookingsCount = await prisma.booking.count({
    where: { createdAt: { gte: lastWeek } },
  });
  const recentCancellationsCount = await prisma.cancellation.count({
    where: { createdAt: { gte: lastWeek } },
  });

  return Response.json({
    stats: { totalRooms, statusCounts },
    pendingCheckouts: pendingCheckouts.map((a) => ({
      id: a.id,
      roomNumber: a.room.roomNumber,
      checkedOutAt: a.checkedOutAt.toISOString(),
      bookingRef: a.booking.bookingRef,
    })),
    cancellations: cancellations.map((c) => ({
      id: c.id,
      bookingRef: c.booking.bookingRef,
      reasonCategory: c.reasonCategory,
      reasonText: c.reasonText,
      cancelledBy: c.cancelledByUser.name,
      calledBack: c.calledBack,
      createdAt: c.createdAt.toISOString(),
    })),
    recentBookingsCount,
    recentCancellationsCount,
  });
}
