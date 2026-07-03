import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

const serviceTypes = [
  { value: "mounting", label: "Шиномонтаж" },
  { value: "storage", label: "Хранение шин" },
  { value: "repair", label: "Ремонт дисков" },
  { value: "balancing", label: "Балансировка" },
  { value: "puncture", label: "Ремонт прокола" },
  { value: "seasonal", label: "Сезонная замена" },
  { value: "other", label: "Другое" },
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const where = role === "Client" ? { userId } : {};

  const include: Record<string, unknown> = {
    user: { select: { name: true, email: true } },
  };
  if (role !== "Client") {
    include.master = { select: { name: true, email: true } };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { serviceType, carInfo, tireSize, phone, visitDate, description, masterId, price } = body;

    const title = `${serviceType ? serviceTypes.find((s: { value: string; label: string }) => s.value === serviceType)?.label || serviceType : "Новый заказ"}${carInfo ? ` — ${carInfo}` : ""}`;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          title,
          description: description?.trim() || null,
          serviceType: serviceType || null,
          carInfo: carInfo || null,
          tireSize: tireSize || null,
          phone: phone || null,
          visitDate: visitDate ? new Date(visitDate) : null,
          userId: session.user.id,
          masterId: masterId || null,
          price: price || null,
        },
        include: { user: { select: { name: true, email: true } } },
      });

      if (masterId) {
        const user = session.user;

        await tx.message.create({
          data: {
            content: `Новый заказ: ${title}`,
            senderId: user.id,
            receiverId: masterId,
            orderId: order.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: masterId,
            orderId: order.id,
            type: "new_order",
            message: `Новый заказ от ${user.name || user.email}: ${title}`,
          },
        });
      }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Ошибка при создании заказа" }, { status: 500 });
  }
}
