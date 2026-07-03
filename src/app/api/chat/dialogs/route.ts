import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role && !["Client", "Master", "Owner"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role) {
    const users = await prisma.user.findMany({
      where: { role: role as "Client" | "Master" | "Owner" },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await prisma.message.deleteMany({
      where: {
        OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
      },
    });
  } else {
    await prisma.message.deleteMany();
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
      order: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const interlocutorKeys = new Map<string, { interlocutorId: string; orderId: string | null }>();
  for (const msg of messages) {
    const interlocutor = msg.senderId === userId ? msg.receiver : msg.sender;
    const key = interlocutor.id + (msg.orderId ? `-${msg.orderId}` : "");
    if (!interlocutorKeys.has(key)) {
      interlocutorKeys.set(key, { interlocutorId: interlocutor.id, orderId: msg.orderId || null });
    }
  }

  const unreadCounts = await Promise.all(
    Array.from(interlocutorKeys.values()).map(({ interlocutorId, orderId }) =>
      prisma.message.count({
        where: {
          senderId: interlocutorId,
          receiverId: userId,
          readAt: null,
          ...(orderId ? { orderId } : {}),
        },
      }).then((count) => ({ key: interlocutorId + (orderId ? `-${orderId}` : ""), count }))
    )
  );
  const unreadMap = new Map(unreadCounts.map(({ key, count }) => [key, count]));

  const dialogsMap = new Map<string, {
    interlocutor: { id: string; name: string | null; avatarUrl: string | null };
    lastMessage: string;
    lastTime: string;
    order?: { id: string; title: string } | null;
    unread: number;
  }>();

  for (const msg of messages) {
    const interlocutor = msg.senderId === userId ? msg.receiver : msg.sender;
    const key = interlocutor.id + (msg.orderId ? `-${msg.orderId}` : "");

    if (!dialogsMap.has(key)) {
      const atts = msg.attachments as { name: string }[] | null;
      const lastMessage =
        msg.content ||
        (atts && atts.length > 0
          ? `📎 ${atts[0].name}`
          : "");

      dialogsMap.set(key, {
        interlocutor: {
          id: interlocutor.id,
          name: interlocutor.name,
          avatarUrl: interlocutor.avatarUrl,
        },
        lastMessage,
        lastTime: msg.createdAt.toISOString(),
        order: msg.order,
        unread: unreadMap.get(key) || 0,
      });
    }
  }

  const dialogs = Array.from(dialogsMap.values()).sort(
    (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
  );

  return NextResponse.json(dialogs);
}
