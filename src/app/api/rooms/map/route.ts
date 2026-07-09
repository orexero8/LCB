import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const auth = requireAnyUser(request);
    if (!auth.authorized) return auth.response;

    // Auto-checkout: rooms past checkOut date become AVAILABLE after 12:00 noon
    try {
      const now = new Date();
      const expiredBookings = await prisma.booking.findMany({
        where: { status: "ACTIVE", checkOut: { lt: now } },
        include: { bookingRooms: true },
      });
      for (const b of expiredBookings) {
        const checkoutTime = new Date(b.checkOut);
        checkoutTime.setHours(12, 0, 0, 0);
        if (now >= checkoutTime) {
          await prisma.booking.update({
            where: { id: b.id },
            data: { status: "CHECKED_OUT" },
          });
          await prisma.room.updateMany({
            where: { id: { in: b.bookingRooms.map((br) => br.roomId) } },
            data: { status: "AVAILABLE" },
          });
        }
      }
    } catch (e) {
      console.error("Auto-checkout error:", e);
    }

    const floors = await prisma.floor.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        rooms: {
          orderBy: { roomNumber: "asc" },
          include: { roomType: true, floor: true },
        },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: { status: "ACTIVE" },
      include: {
        bookingRooms: {
          include: { room: true },
        },
        bookingGuests: {
          include: { client: true },
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    const bookingByRoomId: Record<string, {
      guestName: string;
      checkIn: string;
      checkOut: string;
      bookingId: string;
      bookingRef: string;
    }> = {};

    for (const booking of bookings) {
      for (const br of booking.bookingRooms) {
        const guest = booking.bookingGuests[0];
        bookingByRoomId[br.roomId] = {
          guestName: [guest?.client?.nom, guest?.client?.prenom].filter(Boolean).join(" ") || "Guest",
          checkIn: booking.checkIn.toISOString().split("T")[0],
          checkOut: booking.checkOut.toISOString().split("T")[0],
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
        };
      }
    }

    const floorsWithBookings = floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        pricePerNight: Number(room.pricePerNight),
        currentBooking: bookingByRoomId[room.id] || null,
      })),
    }));

    const totalRooms = floorsWithBookings.reduce(
      (sum, f) => sum + f.rooms.length, 0
    );
    const statusCounts = floorsWithBookings.reduce(
      (acc, f) => {
        for (const room of f.rooms) {
          acc[room.status] = (acc[room.status] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Response.json({
      floors: floorsWithBookings,
      totalRooms,
      statusCounts,
    });
  } catch (error) {
    console.error("Room map error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
