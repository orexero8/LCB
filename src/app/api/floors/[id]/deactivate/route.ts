import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { id } = await props.params;

  const floor = await prisma.floor.findUnique({ where: { id } });
  if (!floor) {
    return Response.json({ error: "Floor not found" }, { status: 404 });
  }

  const updated = await prisma.floor.update({
    where: { id },
    data: { isActive: !floor.isActive },
  });

  return Response.json({ floor: updated });
}
