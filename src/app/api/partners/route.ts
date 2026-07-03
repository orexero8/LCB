import { prisma } from "@/lib/prisma";

export async function GET() {
  const partners = await prisma.partner.findMany({ orderBy: { name: "asc" } });
  return Response.json({ partners });
}

export async function POST(request: Request) {
  const body = await request.json();
  const partner = await prisma.partner.create({
    data: {
      name: body.name,
      logoUrl: body.logoUrl || null,
      contactPhone: body.contactPhone || null,
      commissionRate: body.commissionRate ?? 10,
      isActive: body.isActive !== false,
    },
  });
  return Response.json({ partner }, { status: 201 });
}
