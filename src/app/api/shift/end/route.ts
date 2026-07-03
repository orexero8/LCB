import { prisma } from "@/lib/prisma";
import { requireReceptionist } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = requireReceptionist(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { endingCash, declaredCash, declaredTpe, declaredPartner } = body;
    const ending = parseFloat(endingCash);
    if (isNaN(ending) || ending < 0) {
      return Response.json({ error: "endingCash is required and must be >= 0" }, { status: 400 });
    }

    const shift = await prisma.shiftReport.findFirst({
      where: { userId: auth.payload.userId, status: "ACTIVE" },
      include: { expenses: true },
    });
    if (!shift) {
      return Response.json({ error: "No active shift" }, { status: 404 });
    }

    const now = new Date();
    const shiftStart = shift.startedAt;

    const shiftBookings = await prisma.booking.findMany({
      where: {
        receptionistId: auth.payload.userId,
        createdAt: { gte: shiftStart, lte: now },
      },
    });

    const cashCollected = shiftBookings.filter((b) => b.paymentMethod === "CASH").reduce((s, b) => s + Number(b.totalAmount), 0);
    const tpeCollected = shiftBookings.filter((b) => b.paymentMethod === "TPE").reduce((s, b) => s + Number(b.totalAmount), 0);
    const partnerCollected = shiftBookings.filter((b) => b.paymentMethod === "PARTNER").reduce((s, b) => s + Number(b.totalAmount), 0);

    const totalExpenses = shift.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expectedCashTotal = Number(shift.startingCash) - totalExpenses + cashCollected;
    const cashDiff = ending - expectedCashTotal;

    const updated = await prisma.shiftReport.update({
      where: { id: shift.id },
      data: {
        endedAt: now,
        endingCash: ending,
        expectedCash: expectedCashTotal,
        cashDifference: cashDiff,
        cashCollected,
        tpeCollected,
        partnerCollected,
        declaredCash: declaredCash ?? ending,
        declaredTpe: declaredTpe ?? tpeCollected,
        declaredPartner: declaredPartner ?? partnerCollected,
        status: "CLOSED",
      },
    });

    return Response.json({
      shift: {
        ...updated,
        startingCash: Number(updated.startingCash),
        endingCash: Number(updated.endingCash),
        expectedCash: Number(updated.expectedCash),
        cashDifference: Number(updated.cashDifference),
        cashCollected: Number(updated.cashCollected),
        tpeCollected: Number(updated.tpeCollected),
        partnerCollected: Number(updated.partnerCollected),
        declaredCash: Number(updated.declaredCash),
        declaredTpe: Number(updated.declaredTpe),
        declaredPartner: Number(updated.declaredPartner),
      },
    });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
