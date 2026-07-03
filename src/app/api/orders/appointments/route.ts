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

  if (!dateStr) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    visitDate: { gte: dayStart, lte: dayEnd },
    timeSlot: { isNot: null },
  };

  if (masterId) {
    where.masterId = masterId;
  } else if (session.user.role === "Master") {
    where.masterId = session.user.id;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, phone: true } },
      timeSlot: { select: { date: true, duration: true } },
    },
    orderBy: { visitDate: "asc" },
  });

  return NextResponse.json(orders);
}
