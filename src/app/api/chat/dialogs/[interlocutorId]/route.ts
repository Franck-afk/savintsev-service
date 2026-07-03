import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ interlocutorId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { interlocutorId } = await params;
  if (!interlocutorId) {
    return NextResponse.json({ error: "interlocutorId required" }, { status: 400 });
  }

  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: interlocutorId },
        { senderId: interlocutorId, receiverId: session.user.id },
      ],
    },
  });

  return NextResponse.json({ success: true });
}
