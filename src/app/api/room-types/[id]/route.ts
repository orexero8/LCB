import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.bedLayoutLabel !== undefined) data.bedLayoutLabel = body.bedLayoutLabel;

  const roomType = await prisma.roomType.update({
    where: { id },
    data,
  });

  return Response.json({ roomType });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  // Unlink rooms before deleting the type
  await prisma.room.updateMany({ where: { roomTypeId: id }, data: { roomTypeId: null } });
  await prisma.roomType.delete({ where: { id } });

  return Response.json({ success: true });
}
