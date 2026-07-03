import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { senderId } = await request.json();

  if (!senderId || typeof senderId !== "string") {
    return NextResponse.json({ error: "senderId required" }, { status: 400 });
  }

  await prisma.message.updateMany({
    where: {
      senderId,
      receiverId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
