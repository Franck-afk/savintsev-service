import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";

export async function GET() {
  const masters = await prisma.user.findMany({
    where: { role: "Master", isVisible: true },
    select: { id: true, name: true, avatarUrl: true, lastSeen: true },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const result = masters.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl,
    isOnline: m.lastSeen ? now - new Date(m.lastSeen).getTime() < 30_000 : false,
    lastSeen: m.lastSeen?.toISOString() || null,
  }));

  return NextResponse.json(result);
}
