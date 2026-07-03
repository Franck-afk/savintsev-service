import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twentySecAgo = new Date(Date.now() - 20_000);
  const onlineUsers = await prisma.user.findMany({
    where: { lastSeen: { gte: twentySecAgo } },
    select: { id: true },
  });

  return NextResponse.json(onlineUsers.map((u) => u.id));
}
