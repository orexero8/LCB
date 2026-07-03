import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const roomTypes = await prisma.roomType.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json({ roomTypes });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const { name, bedLayoutLabel } = body;

  if (!name || !bedLayoutLabel) {
    return Response.json({ error: "name and bedLayoutLabel are required" }, { status: 400 });
  }

  const existing = await prisma.roomType.findFirst({ where: { name } });
  if (existing) {
    return Response.json({ error: "Room type with this name already exists" }, { status: 409 });
  }

  const roomType = await prisma.roomType.create({
    data: { name, bedLayoutLabel },
  });

  return Response.json({ roomType }, { status: 201 });
}
