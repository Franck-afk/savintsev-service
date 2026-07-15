import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";
import { getStages, isLastStage } from "@/shared/constants/service-stages";

const serviceTypes = [
  { value: "mounting", label: "Шиномонтаж" },
  { value: "storage", label: "Хранение шин" },
  { value: "repair", label: "Ремонт дисков" },
  { value: "balancing", label: "Балансировка" },
  { value: "puncture", label: "Ремонт прокола" },
  { value: "seasonal", label: "Сезонная замена" },
  { value: "other", label: "Другое" },
];

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (order.userId !== session.user.id && session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Client") {
    return NextResponse.json({ error: "Только клиент может редактировать заказ" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Можно редактировать только свои заказы" }, { status: 403 });
  }

  if (order.status !== "Pending") {
    return NextResponse.json({ error: "Нельзя редактировать заказ в работе" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { serviceType, carInfo, tireSize, phone, visitDate, description, masterId } = body;

    const title = `${serviceType ? serviceTypes.find((s) => s.value === serviceType)?.label || serviceType : "Новый заказ"}${carInfo ? ` — ${carInfo}` : ""}`;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        title,
        serviceType: serviceType || null,
        carInfo: carInfo || null,
        tireSize: tireSize || null,
        phone: phone || null,
        visitDate: visitDate ? new Date(visitDate) : null,
        description: description?.trim() || null,
        masterId: masterId || null,
      },
      include: {
        user: { select: { name: true, email: true } },
        master: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Ошибка при обновлении заказа" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Master" && session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (order.status === "Completed" || order.status === "Cancelled") {
    return NextResponse.json({ error: "Заказ уже завершён" }, { status: 400 });
  }

  if (action === "advance") {
    const stages = getStages(order.serviceType);
    const nextStage = order.currentStage + 1;
    const { price } = body;

    if (nextStage >= stages.length) {
      return NextResponse.json({ error: "Все этапы уже пройдены" }, { status: 400 });
    }

    const isLast = isLastStage(order.serviceType, nextStage);
    const isFirstAdvance = order.status === "Pending" && nextStage > 0;

    const [updated, payment] = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          currentStage: nextStage,
          status: isLast ? "Completed" : isFirstAdvance ? "InProgress" : order.status,
          ...(order.masterId !== session.user.id ? { masterId: session.user.id } : {}),
          ...(isLast && price ? { price } : {}),
        },
        include: { user: { select: { name: true, email: true } } },
      });

      let paymentRecord = null;

      if (isLast) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: "order_completed",
            message: `Заказ «${updatedOrder.title}» завершён`,
          },
        });

        if (price && price > 0) {
          const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const sbpPayload = `https://qr.nspk.ru/${paymentId}?amount=${price}&currency=643&comment=Заказ+${encodeURIComponent(updatedOrder.title)}`;

          paymentRecord = await tx.payment.create({
            data: {
              orderId: order.id,
              amount: price,
              method: "SBP",
              status: "Pending",
              qrData: sbpPayload,
            },
          });
        }
      }

      return [updatedOrder, paymentRecord] as const;
    });

    return NextResponse.json({ ...updated, payment });
  }

  if (action === "cancel") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "Cancelled" },
      include: { user: { select: { name: true, email: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        type: "order_cancelled",
        message: `Заказ «${updated.title}» отменён`,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
}
