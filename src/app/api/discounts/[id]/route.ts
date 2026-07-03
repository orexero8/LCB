import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { code, type, value, minAmount, validFrom, validUntil, maxUses, isActive } = body;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Discount not found" }, { status: 404 });
    }

    if (code && code.toUpperCase() !== existing.code) {
      const dup = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });
      if (dup) {
        return Response.json({ error: "Discount code already exists" }, { status: 409 });
      }
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value }),
        ...(minAmount !== undefined && { minAmount }),
        ...(validFrom !== undefined && { validFrom: new Date(validFrom) }),
        ...(validUntil !== undefined && { validUntil: new Date(validUntil) }),
        ...(maxUses !== undefined && { maxUses }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return Response.json({ discount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update discount";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Discount not found" }, { status: 404 });
    }

    await prisma.discount.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete discount";
    return Response.json({ error: msg }, { status: 500 });
  }
}
