import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { email, phone, password, name, role, isActive } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (name && name !== existing.name) {
      const dup = await prisma.user.findFirst({ where: { name } });
      if (dup) return Response.json({ error: "Name already in use" }, { status: 409 });
    }

    const data: any = {};
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return Response.json({
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, isActive: user.isActive },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update user";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (existing.role === "ADMIN") {
      return Response.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete user";
    return Response.json({ error: msg }, { status: 500 });
  }
}
