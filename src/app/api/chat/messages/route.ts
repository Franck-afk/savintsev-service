import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const interlocutorId = searchParams.get("userId");
  const orderId = searchParams.get("orderId");

  if (!interlocutorId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    OR: [
      { senderId: session.user.id, receiverId: interlocutorId },
      { senderId: interlocutorId, receiverId: session.user.id },
    ],
  };

  if (orderId) {
    where.orderId = orderId;
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { receiverId, content, orderId, attachments } = body;

    if (!receiverId || (!content && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: "receiverId и content/attachments обязательны" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) {
      return NextResponse.json({ error: "Получатель не найден" }, { status: 404 });
    }

    if (content && content.length > 5000) {
      return NextResponse.json({ error: "Сообщение слишком длинное" }, { status: 400 });
    }

    if (attachments && attachments.length > 10) {
      return NextResponse.json({ error: "Слишком много вложений" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content || "",
        senderId: session.user.id,
        receiverId,
        orderId: orderId || null,
        attachments: attachments || [],
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Ошибка при отправке" }, { status: 500 });
  }
}
