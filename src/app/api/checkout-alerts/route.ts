import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(_request: Request) {
  const auth = requireAnyUser(_request);
  if (!auth.authorized) return auth.response;

  const alerts = await prisma.checkoutAlert.findMany({
    where: { ready: false },
    include: {
      booking: {
        include: {
          bookingRooms: { include: { room: { include: { floor: true } } } },
          bookingGuests: { include: { client: true }, where: { isPrimary: true }, take: 1 },
        },
      },
      room: { include: { floor: true } },
    },
    orderBy: { checkedOutAt: "desc" },
  });

  const formatted = alerts.map((alert) => ({
    id: alert.id,
    bookingId: alert.bookingId,
    checkedOutAt: alert.checkedOutAt.toISOString(),
    roomNumber: alert.room.roomNumber,
    roomId: alert.room.id,
    floorName: alert.room.floor?.name || "",
    guestName: [alert.booking.bookingGuests[0]?.client?.nom, alert.booking.bookingGuests[0]?.client?.prenom].filter(Boolean).join(" ") || "N/A",
    bookingRef: alert.booking.bookingRef,
    roomCount: alert.booking.bookingRooms.length,
  }));

  return Response.json({ alerts: formatted, count: formatted.length });
}
