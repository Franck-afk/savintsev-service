import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";

export async function GET() {
  const masters = await prisma.user.findMany({
    where: { role: "Master", isVisible: true },
    select: { id: true, name: true, email: true, avatarUrl: true, lastSeen: true },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const result = masters.map((m) => ({
    ...m,
    isOnline: m.lastSeen ? now - new Date(m.lastSeen).getTime() < 30_000 : false,
  }));

  return NextResponse.json(result);
}
