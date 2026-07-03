import { prisma } from "./prisma";

export interface AvailableRoomsFilter {
  checkIn?: string;
  checkOut?: string;
}

export async function getAvailableRooms(filter: AvailableRoomsFilter) {
  const where: any = { status: "AVAILABLE" };

  if (filter.checkIn && filter.checkOut) {
    const checkIn = new Date(filter.checkIn);
    const checkOut = new Date(filter.checkOut);
    const bookedRoomIds = (
      await prisma.bookingRoom.findMany({
        where: {
          booking: {
            status: "ACTIVE",
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
        select: { roomId: true },
      })
    ).map((br) => br.roomId);
    if (bookedRoomIds.length > 0) {
      where.id = { notIn: bookedRoomIds };
    }
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      floor: true,
      roomType: true,
    },
    orderBy: [{ floor: { sortOrder: "asc" } }, { roomNumber: "asc" }],
  });

  return rooms;
}
