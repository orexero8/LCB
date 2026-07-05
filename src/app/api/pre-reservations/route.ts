import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const preReservations = await prisma.preReservation.findMany({
      include: {
        room: { select: { roomNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = preReservations.map((pr) => ({
      id: pr.id,
      guestName: pr.guestName,
      phone: pr.phone,
      roomId: pr.roomId,
      roomNumber: pr.room.roomNumber,
      checkIn: pr.checkIn.toISOString().split("T")[0],
      checkOut: pr.checkOut.toISOString().split("T")[0],
      notes: pr.notes,
      createdAt: pr.createdAt.toISOString(),
    }));

    return Response.json({ preReservations: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch pre-reservations";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { guestName, phone, roomId, checkIn, checkOut, notes } = body;

    if (!guestName || !phone || !roomId || !checkIn || !checkOut) {
      return Response.json({ error: "Missing required fields: guestName, phone, roomId, checkIn, checkOut" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const preReservation = await prisma.preReservation.create({
      data: {
        guestName,
        phone,
        roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        notes: notes || null,
      },
    });

    return Response.json({ preReservation }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create pre-reservation";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    const existing = await prisma.preReservation.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Pre-reservation not found" }, { status: 404 });
    }

    await prisma.preReservation.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete pre-reservation";
    return Response.json({ error: msg }, { status: 500 });
  }
}
