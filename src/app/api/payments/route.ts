import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role: string }).role;
  if (role !== "Owner" && role !== "Master") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json({ error: "orderId и amount обязательны" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const existing = await prisma.payment.findFirst({
      where: { orderId, status: "pending" },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sbpPayload = `https://qr.nspk.ru/${paymentId}?amount=${amount}&currency=643&comment=Заказ+${order.title}`;

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method: "sbp",
        status: "pending",
        qrData: sbpPayload,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { price: amount },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Ошибка при создании платежа" }, { status: 500 });
  }
}
