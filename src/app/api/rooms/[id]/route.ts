import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await props.params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name || null;
  if (body.roomNumber !== undefined) data.roomNumber = parseInt(body.roomNumber);
  if (body.floorId !== undefined) data.floorId = body.floorId;
  if (body.roomTypeId !== undefined) data.roomTypeId = body.roomTypeId;
  if (body.bedLayout !== undefined) data.bedLayout = body.bedLayout;
  if (body.pricePerNight !== undefined) data.pricePerNight = parseFloat(body.pricePerNight);
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.status !== undefined) data.status = body.status;

  const room = await prisma.room.update({
    where: { id },
    data,
    include: { floor: true, roomType: true },
  });

  return Response.json({ room });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await props.params;
  await prisma.room.delete({ where: { id } });
  return Response.json({ success: true });
}
