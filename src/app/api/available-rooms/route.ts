import { getAvailableRooms } from "@/lib/room-service";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const checkIn = url.searchParams.get("checkIn") || undefined;
  const checkOut = url.searchParams.get("checkOut") || undefined;

  const rooms = await getAvailableRooms({ checkIn, checkOut });

  return Response.json({ rooms, count: rooms.length });
}
