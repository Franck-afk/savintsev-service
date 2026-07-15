import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

async function checkOwner() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "Owner") {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await checkOwner())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, createdAt: true, password: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  if (!(await checkOwner())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, phone, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, пароль и роль обязательны" }, { status: 400 });
    }

    if (!["Master", "Client"].includes(role)) {
      return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null, phone: phone || null, role },
      select: { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Ошибка при создании" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await checkOwner())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, email, name, phone, role, password } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!existing) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (existing.role === "Owner") {
      return NextResponse.json({ error: "Нельзя редактировать владельца" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (email) data.email = email;
    if (name !== undefined) data.name = name || null;
    if (phone !== undefined) data.phone = phone || null;
    if (role && ["Master", "Client"].includes(role)) data.role = role;
    if (password && password.length >= 6) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Ошибка при обновлении" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkOwner())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (user.role === "Owner") {
      return NextResponse.json({ error: "Нельзя удалить владельца" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Ошибка при удалении" }, { status: 500 });
  }
}
