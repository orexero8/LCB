import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { loginLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      lastLogin: u.loginLogs[0]?.createdAt.toISOString() || null,
    })),
  });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { email, phone, password, name, role } = body;

    if (!password || !name) {
      return Response.json({ error: "Missing required fields: password, name" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) {
      return Response.json({ error: "Name already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email: email || null, phone: phone || null, passwordHash, name, role: role || "RECEPTIONIST" },
    });

    return Response.json({
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, isActive: user.isActive },
    }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create user";
    return Response.json({ error: msg }, { status: 500 });
  }
}
