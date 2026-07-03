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

  const hours = await prisma.workingHours.findMany({
    where: masterId ? { masterId } : {},
    orderBy: [{ masterId: "asc" }, { dayOfWeek: "asc" }],
  });

  return NextResponse.json(hours);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Owner" && session.user.role !== "Master") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { dayOfWeek, startTime, endTime } = body;

  if (dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, and endTime are required" }, { status: 400 });
  }

  const masterId = session.user.role === "Owner"
    ? (body.masterId || session.user.id)
    : session.user.id;

  const hours = await prisma.workingHours.upsert({
    where: { masterId_dayOfWeek: { masterId, dayOfWeek } },
    update: { startTime, endTime },
    create: { masterId, dayOfWeek, startTime, endTime },
  });

  return NextResponse.json(hours);
}
