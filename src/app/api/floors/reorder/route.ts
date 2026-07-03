import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return Response.json({ error: "Order array is required" }, { status: 400 });
  }

  await prisma.$transaction(
    order.map((id: string, index: number) =>
      prisma.floor.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  return Response.json({ success: true });
}
