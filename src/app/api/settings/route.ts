import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

async function getOrCreate() {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({ data: {} });
  }
  return settings;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getOrCreate();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, address, phone, schedule } = body;

    const existing = await getOrCreate();

    const updated = await prisma.companySettings.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(schedule !== undefined && { schedule }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Ошибка при сохранении" }, { status: 500 });
  }
}
