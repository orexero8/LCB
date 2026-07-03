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
  });

  if (!shift) {
    return Response.json({ expenses: [], totalExpenses: 0 });
  }

  const expenses = shift.expenses.map((e) => ({
    ...e,
    amount: Number(e.amount),
  }));

  return Response.json({
    expenses,
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  });
}

export async function POST(request: Request) {
  const auth = requireReceptionist(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { amount, category, description } = body;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: "amount must be > 0" }, { status: 400 });
    }
    if (!category?.trim()) {
      return Response.json({ error: "category is required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return Response.json({ error: "description is required" }, { status: 400 });
    }

    const shift = await prisma.shiftReport.findFirst({
      where: { userId: auth.payload.userId, status: "ACTIVE" },
    });
    if (!shift) {
      return Response.json({ error: "No active shift" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        shiftReportId: shift.id,
        amount: parsedAmount,
        category: category.trim(),
        description: description.trim(),
        photoUrl: body.photoUrl || null,
      },
    });

    return Response.json({ expense: { ...expense, amount: Number(expense.amount) } }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
