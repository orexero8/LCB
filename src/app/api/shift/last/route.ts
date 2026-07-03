import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const last = await prisma.shiftReport.findFirst({
    where: { status: "CLOSED" },
    orderBy: { endedAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  if (!last) return Response.json({ last: null });

  return Response.json({
    last: {
      userName: last.user.name,
      endedAt: last.endedAt?.toISOString() || null,
      endingCash: Number(last.endingCash),
      expectedCash: Number(last.expectedCash),
      cashDifference: Number(last.cashDifference),
    },
  });
}
