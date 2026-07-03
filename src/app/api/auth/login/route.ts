import { prisma } from "@/lib/prisma";
import { signToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return Response.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({ where: { name, isActive: true } });

    if (!user) {
      await prisma.loginLog.create({ data: { userId: "00000000-0000-0000-0000-000000000000", email: name, success: false } });
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      await prisma.loginLog.create({ data: { userId: user.id, email: user.email || name, success: false } });
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;
    await prisma.loginLog.create({ data: { userId: user.id, email: user.email || name, ip, userAgent, success: true } });

    const token = signToken({
      userId: user.id,
      email: user.email || name,
      role: user.role,
      name: user.name,
    });

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
