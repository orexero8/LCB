import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    // Set all rooms to AVAILABLE
    await prisma.room.updateMany({ data: { status: "AVAILABLE" } });

    // Close any active shifts
    const activeShifts = await prisma.shiftReport.findMany({ where: { status: "ACTIVE" } });
    for (const shift of activeShifts) {
      const shiftBookings = await prisma.booking.findMany({
        where: {
          receptionistId: shift.userId,
          createdAt: { gte: shift.startedAt },
          status: "ACTIVE",
        },
      });
      const cashCollected = shiftBookings
        .filter((b) => b.paymentMethod === "CASH")
        .reduce((s, b) => s + Number(b.totalAmount), 0);
      const expenses = await prisma.expense.findMany({ where: { shiftReportId: shift.id } });
      const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const expectedCash = Number(shift.startingCash) + cashCollected - expTotal;

      await prisma.shiftReport.update({
        where: { id: shift.id },
        data: {
          status: "CLOSED",
          endedAt: new Date(),
          endingCash: 0,
          expectedCash,
          cashDifference: -expectedCash,
          cashCollected,
          tpeCollected: 0,
          partnerCollected: 0,
        },
      });
    }

    // Cancel all pre-reservations
    await prisma.preReservation.deleteMany();

    return Response.json({ success: true, closedShifts: activeShifts.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Reset failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
