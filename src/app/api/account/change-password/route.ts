import { auth } from "@/shared/config/auth";
import { prisma } from "@/shared/api/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/shared/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { allowed } = rateLimit(`change-password:${session.user.id}:${ip}`, 5, 300000);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 5 минут" }, { status: 429 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Новый пароль минимум 6 символов" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true });
}
