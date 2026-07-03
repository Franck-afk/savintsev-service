import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const where = q
    ? {
        id: { not: session.user.id },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : { id: { not: session.user.id } };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
    take: 50,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
