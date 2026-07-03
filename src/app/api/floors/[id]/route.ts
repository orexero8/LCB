import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await props.params;
  const body = await request.json();
  const { name, sortOrder, isActive } = body;

  const floor = await prisma.floor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return Response.json({ floor });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await props.params;

  const roomCount = await prisma.room.count({ where: { floorId: id } });
  if (roomCount > 0) {
    return Response.json(
      { error: `Cannot delete floor with ${roomCount} room(s). Deactivate it instead.` },
      { status: 400 }
    );
  }

  await prisma.floor.delete({ where: { id } });
  return Response.json({ success: true });
}
