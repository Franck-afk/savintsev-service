import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/api/prisma";
import { rateLimit, getClientIp } from "@/shared/lib/rate-limit";

const SEED_SECRET = process.env.SEED_SECRET;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`setup:${ip}`, 3, 300000);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много попыток" }, { status: 429 });
  }

  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: "Система уже настроена. Войдите в систему." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, name, secret } = body;

    if (!SEED_SECRET || !secret || secret !== SEED_SECRET) {
      return NextResponse.json(
        { error: "Неверный секрет" },
        { status: 403 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 8 символов" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "Owner",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Ошибка при создании" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (!SEED_SECRET || !secret || secret !== SEED_SECRET) {
      return NextResponse.json({ hasOwner: true });
    }
    const count = await prisma.user.count();
    return NextResponse.json({ hasOwner: count > 0 });
  } catch {
    return NextResponse.json({ hasOwner: true });
  }
}
