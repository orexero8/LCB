import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { code, totalAmount } = body;

    if (!code) {
      return Response.json({ error: "Discount code is required" }, { status: 400 });
    }

    const discount = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });

    if (!discount) {
      return Response.json({ valid: false, error: "Invalid discount code" });
    }

    if (!discount.isActive) {
      return Response.json({ valid: false, error: "Discount code is no longer active" });
    }

    const now = new Date();
    const from = new Date(discount.validFrom);
    const until = new Date(discount.validUntil);
    if (now < from || now > until) {
      return Response.json({ valid: false, error: "Discount code has expired or not yet valid" });
    }

    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return Response.json({ valid: false, error: "Discount code has reached maximum usage" });
    }

    const amount = Number(totalAmount || 0);
    const minAmount = Number(discount.minAmount);
    if (amount < minAmount) {
      return Response.json({ valid: false, error: `Minimum order amount of ${minAmount.toLocaleString()} DA required` });
    }

    const value = Number(discount.value);
    let discountAmount = discount.type === "PERCENTAGE"
      ? Math.round((amount * value) / 100)
      : value;

    discountAmount = Math.min(discountAmount, amount);

    return Response.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: Number(discount.value),
        discountAmount,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to validate discount";
    return Response.json({ error: msg }, { status: 500 });
  }
}
