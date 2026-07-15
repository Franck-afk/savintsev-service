import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role: string }).role;
  if (role !== "Owner" && role !== "Master") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: "Платёж не найден" }, { status: 404 });
    }

    if (action === "confirm") {
      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: "Paid",
          paidAt: new Date(),
          confirmedBy: session.user.id,
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paidAt: new Date(), status: "Paid" },
      });

      return NextResponse.json(updated);
    }

    if (action === "cancel") {
      const updated = await prisma.payment.update({
        where: { id },
        data: { status: "Cancelled" },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Ошибка при обновлении платежа" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: { select: { id: true, title: true, userId: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "Платёж не найден" }, { status: 404 });
    }

    const role = (session.user as { role: string }).role;
    if (role === "Client" && payment.order.userId !== session.user.id) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
