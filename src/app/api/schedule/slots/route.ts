import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const masterId = searchParams.get("masterId");
  const dateStr = searchParams.get("date");

  if (!masterId || !dateStr) {
    return NextResponse.json({ error: "masterId and date are required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayOfWeek = date.getDay();

  const workingHours = await prisma.workingHours.findUnique({
    where: { masterId_dayOfWeek: { masterId, dayOfWeek } },
  });

  const startStr = workingHours?.startTime || "09:00";
  const endStr = workingHours?.endTime || "18:00";

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedSlots = await prisma.timeSlot.findMany({
    where: {
      masterId,
      date: { gte: dayStart, lte: dayEnd },
    },
    select: { date: true, duration: true },
  });

  const bookedTimes = new Set(
    bookedSlots.map((s) => {
      const d = new Date(s.date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    })
  );

  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: string[] = [];
  const now = new Date();
  const today = now.toDateString() === date.toDateString();

  for (let m = startMinutes; m + 60 <= endMinutes; m += 60) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

    if (today) {
      const slotDate = new Date(date);
      slotDate.setHours(h, min, 0, 0);
      if (slotDate <= now) continue;
    }

    if (!bookedTimes.has(timeStr)) {
      slots.push(timeStr);
    }
  }

  return NextResponse.json({ slots, startTime: startStr, endTime: endStr });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { masterId, orderId, date: dateStr } = body;

  if (!masterId || !orderId || !dateStr) {
    return NextResponse.json({ error: "masterId, orderId, and date are required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, masterId: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const role = (session.user as { role: string }).role;
  if (role === "Client" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }
  if (role === "Master" && order.masterId !== session.user.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const existing = await prisma.timeSlot.findUnique({
    where: { masterId_date: { masterId, date } },
  });
  if (existing) {
    return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
  }

  const timeSlot = await prisma.timeSlot.create({
    data: { masterId, orderId, date },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { visitDate: date, masterId },
  });

  return NextResponse.json(timeSlot);
}
