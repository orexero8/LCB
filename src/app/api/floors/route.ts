import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const floors = await prisma.floor.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { rooms: true } } },
  });

  return Response.json({ floors });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!name || typeof name !== "string") {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const maxOrder = await prisma.floor.aggregate({ _max: { sortOrder: true } });
    const nextOrder = sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const floor = await prisma.floor.create({
      data: { name, sortOrder: nextOrder },
    });

    return Response.json({ floor }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
