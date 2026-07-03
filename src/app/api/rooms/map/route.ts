import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

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
}
