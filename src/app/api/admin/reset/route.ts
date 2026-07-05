import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

async function performReset() {
  // Wipe all transactional data in FK-safe order
  await prisma.preReservation.deleteMany();
  await prisma.checkoutAlert.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.childAge.deleteMany();
  await prisma.bookingGuest.deleteMany();
  await prisma.bookingRoom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shiftReport.deleteMany();
  await prisma.loginLog.deleteMany();

  // Reset rooms to available
  await prisma.room.updateMany({ data: { status: "AVAILABLE" } });

  return 0;
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const closed = await performReset();
    return Response.json({ success: true, closedShifts: closed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Reset failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
