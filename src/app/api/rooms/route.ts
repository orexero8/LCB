import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const rooms = await prisma.room.findMany({
    orderBy: [{ floor: { sortOrder: "asc" } }, { roomNumber: "asc" }],
    include: {
      floor: true,
      roomType: true,
    },
  });

  return Response.json({ rooms });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, roomNumber, floorId, roomTypeId, bedLayout, pricePerNight, photoUrl, notes } = body;

    if (!roomNumber || !floorId || !bedLayout || pricePerNight === undefined) {
      return Response.json(
        { error: "roomNumber, floorId, bedLayout, and pricePerNight are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.room.findFirst({ where: { roomNumber, floorId } });
    if (existing) {
      return Response.json({ error: `Room ${roomNumber} already exists on this floor` }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        name: name || null,
        roomNumber: parseInt(roomNumber),
        floorId,
        roomTypeId,
        bedLayout,
        pricePerNight: parseFloat(pricePerNight),
        photoUrl: photoUrl || null,
        notes: notes || null,
      },
      include: { floor: true, roomType: true },
    });

    return Response.json({ room }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
