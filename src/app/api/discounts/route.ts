import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const discounts = await prisma.discount.findMany({ orderBy: { code: "asc" } });
  return Response.json({ discounts });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { code, type, value, minAmount, validFrom, validUntil, maxUses, isActive } = body;

    if (!code || !value || !validFrom || !validUntil) {
      return Response.json({ error: "Missing required fields: code, value, validFrom, validUntil" }, { status: 400 });
    }

    const existing = await prisma.discount.findUnique({ where: { code } });
    if (existing) {
      return Response.json({ error: "Discount code already exists" }, { status: 409 });
    }

    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        type: type || "FIXED",
        value,
        minAmount: minAmount || 0,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUses: maxUses || 0,
        isActive: isActive !== false,
      },
    });

    return Response.json({ discount }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create discount";
    return Response.json({ error: msg }, { status: 500 });
  }
}
