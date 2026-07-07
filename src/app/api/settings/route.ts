import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

async function getOrCreate() {
  try {
    let settings = await prisma.hotelSetting.findUnique({ where: { id: DEFAULT_ID } });
    if (!settings) {
      settings = await prisma.hotelSetting.create({ data: { id: DEFAULT_ID } });
    }
    return settings;
  } catch {
    return null;
  }
}

export async function GET() {
  const settings = await getOrCreate();
  return Response.json({ settings: settings || {} });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const allowed = [
    "hotelName", "hotelAddress", "hotelPhone", "hotelWhatsApp", "hotelEmail",
    "logoUrl", "checkInTime", "checkOutTime", "cancellationPolicy", "footerMessage",
    "currencySymbol", "rc", "nif", "nis",
  ];
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  try {
    const settings = await prisma.hotelSetting.upsert({
      where: { id: DEFAULT_ID },
      update: data,
      create: { id: DEFAULT_ID, ...data },
    });
    return Response.json({ settings });
  } catch {
    return Response.json({ settings: data });
  }
}
