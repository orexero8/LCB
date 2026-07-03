import { prisma } from "@/lib/prisma";
import { requireReceptionist } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireReceptionist(request);
  if (!auth.authorized) return auth.response;

  const shift = await prisma.shiftReport.findFirst({
    where: { userId: auth.payload.userId, status: "ACTIVE" },
    include: {
      expenses: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!shift) {
    return Response.json({ shift: null });
  }

  const shiftBookings = await prisma.booking.findMany({
    where: {
      receptionistId: auth.payload.userId,
      createdAt: { gte: shift.startedAt },
      status: "ACTIVE",
    },
  });

  const cashCollected = shiftBookings
    .filter((b) => b.paymentMethod === "CASH")
    .reduce((s, b) => s + Number(b.totalAmount), 0);
  const tpeCollected = shiftBookings
    .filter((b) => b.paymentMethod === "TPE")
    .reduce((s, b) => s + Number(b.totalAmount), 0);
  const partnerCollected = shiftBookings
    .filter((b) => b.paymentMethod === "PARTNER")
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  return Response.json({
    shift: {
      ...shift,
      startingCash: Number(shift.startingCash),
      endingCash: shift.endingCash ? Number(shift.endingCash) : null,
      expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
      cashDifference: shift.cashDifference ? Number(shift.cashDifference) : null,
      cashCollected,
      tpeCollected,
      partnerCollected,
      expenses: shift.expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
    },
  });
}

export async function POST(request: Request) {
  const auth = requireReceptionist(request);
  if (!auth.authorized) return auth.response;

  const existing = await prisma.shiftReport.findFirst({
    where: { userId: auth.payload.userId, status: "ACTIVE" },
  });
  if (existing) {
    return Response.json({ error: "An active shift already exists" }, { status: 409 });
  }

  try {
    const body = await request.json();
    const { startingCash } = body;

    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) {
      return Response.json({ error: "startingCash is required and must be >= 0" }, { status: 400 });
    }

    const shift = await prisma.shiftReport.create({
      data: {
        userId: auth.payload.userId,
        startedAt: new Date(),
        startingCash: cash,
        status: "ACTIVE",
      },
    });

    return Response.json({
      shift: { ...shift, startingCash: Number(shift.startingCash) },
    }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
