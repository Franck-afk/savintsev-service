import { auth } from "@/shared/config/auth";
import { prisma } from "@/shared/api/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const total = await prisma.order.count({ where: { userId } });
  const completed = await prisma.order.count({ where: { userId, status: "Completed" } });
  const inProgress = await prisma.order.count({ where: { userId, status: "InProgress" } });

  return NextResponse.json({ total, completed, inProgress });
}
