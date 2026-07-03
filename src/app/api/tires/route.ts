import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const where: Record<string, unknown> = {};

  if (session.user.role === "Client") {
    where.ownerId = session.user.id;
  } else if (ownerId) {
    where.ownerId = ownerId;
  }

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { brand: { contains: search, mode: "insensitive" } },
      { size: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const tires = await prisma.tire.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, phone: session.user.role !== "Client" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tires);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "Client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { brand, model, size, season, quantity, location, notes, ownerId } = body;

  if (!brand || !size || !ownerId) {
    return NextResponse.json({ error: "brand, size, and ownerId are required" }, { status: 400 });
  }

  const tire = await prisma.tire.create({
    data: {
      brand, model, size,
      season: season || "Summer",
      quantity: quantity || 4,
      location, notes,
      ownerId,
    },
  });

  return NextResponse.json(tire);
}
