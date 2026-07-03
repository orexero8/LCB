import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const now = new Date();
  const todayStartDate = todayStart();
  const todayEndDate = todayEnd();

  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const totalRooms = await prisma.room.count();
  const occupiedRooms = await prisma.room.count({ where: { status: "OCCUPIED" } });
  const reservedRooms = await prisma.room.count({ where: { status: "RESERVED" } });

  const occupancyRate = totalRooms > 0 ? ((occupiedRooms + reservedRooms) / totalRooms) * 100 : 0;

  const todayBookings = await prisma.booking.findMany({
    where: { createdAt: { gte: todayStartDate, lte: todayEndDate }, status: { not: "CANCELLED" } },
  });
  const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const todayCashRevenue = todayBookings.filter((b) => b.paymentMethod === "CASH").reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const todayTpeRevenue = todayBookings.filter((b) => b.paymentMethod === "TPE").reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const todayPartnerRevenue = todayBookings.filter((b) => b.paymentMethod === "PARTNER").reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const todayCheckIns = await prisma.booking.count({
    where: { checkIn: { gte: todayStartDate, lte: todayEndDate }, status: { not: "CANCELLED" } },
  });
  const todayCheckOuts = await prisma.checkoutAlert.count({
    where: { checkedOutAt: { gte: todayStartDate, lte: todayEndDate } },
  });

  const weekRevenue = await prisma.booking.aggregate({
    where: { createdAt: { gte: weekAgo }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
  });
  const monthRevenue = await prisma.booking.aggregate({
    where: { createdAt: { gte: monthAgo }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
  });

  const monthBookings = await prisma.booking.findMany({
    where: { createdAt: { gte: monthAgo }, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "asc" },
  });

  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().split("T")[0]] = 0;
  }
  for (const b of monthBookings) {
    const day = b.createdAt.toISOString().split("T")[0];
    if (day in dayMap) dayMap[day] += Number(b.totalAmount);
  }
  const chartData = Object.entries(dayMap).map(([date, revenue]) => ({ date, revenue }));

  return Response.json({
    today: {
      revenue: todayRevenue,
      cashRevenue: todayCashRevenue,
      tpeRevenue: todayTpeRevenue,
      partnerRevenue: todayPartnerRevenue,
      checkIns: todayCheckIns,
      checkOuts: todayCheckOuts,
    },
    weekRevenue: weekRevenue._sum.totalAmount ? Number(weekRevenue._sum.totalAmount) : 0,
    monthRevenue: monthRevenue._sum.totalAmount ? Number(monthRevenue._sum.totalAmount) : 0,
    occupancy: {
      rate: Math.round(occupancyRate * 10) / 10,
      occupied: occupiedRooms,
      reserved: reservedRooms,
      total: totalRooms,
    },
    chart: chartData,
  });
}
