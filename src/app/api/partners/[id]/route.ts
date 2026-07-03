import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const partner = await prisma.partner.update({
    where: { id },
    data: {
      name: body.name,
      logoUrl: body.logoUrl ?? undefined,
      contactPhone: body.contactPhone ?? undefined,
      commissionRate: body.commissionRate ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });
  return Response.json({ partner });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.partner.delete({ where: { id } });
  return Response.json({ success: true });
}
