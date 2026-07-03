import { prisma } from "@/lib/prisma";
import { requireAnyUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (q && q.length >= 2) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { prenom: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { idDocument: { contains: q } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      bookingGuests: {
        include: {
          booking: { select: { totalAmount: true, createdAt: true } },
        },
        orderBy: { booking: { createdAt: "desc" } },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    take: q ? 20 : 50,
  });

  const data = clients.map((c) => ({
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    maidenName: c.maidenName,
    dateOfBirth: c.dateOfBirth?.toISOString() || null,
    profession: c.profession,
    address: c.address,
    nationality: c.nationality,
    email: c.email,
    phone: c.phone,
    idDocument: c.idDocument,
    wilaya: c.wilaya,
    gender: c.gender,
    createdAt: c.createdAt.toISOString(),
    bookingCount: c.bookingGuests.length,
    totalSpent: c.bookingGuests.reduce((s, bg) => s + Number(bg.booking.totalAmount), 0),
    lastBooking: c.bookingGuests[0]?.booking.createdAt.toISOString() || null,
  }));

  return Response.json({ clients: data });
}

export async function POST(request: Request) {
  const auth = requireAnyUser(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { nom, prenom, maidenName, dateOfBirth, profession, address, nationality, email, phone, idDocument, wilaya, gender } = body;

    if (!nom || !prenom) {
      return Response.json({ error: "nom and prenom are required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        nom,
        prenom,
        maidenName: maidenName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        profession: profession || null,
        address: address || null,
        nationality: nationality || null,
        email: email || null,
        phone: phone || "",
        idDocument: idDocument || "",
        wilaya: wilaya || "",
        gender: gender || "MALE",
      },
    });

    return Response.json({ client }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
