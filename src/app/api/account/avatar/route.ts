import { auth } from "@/shared/config/auth";
import { prisma } from "@/shared/api/prisma";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/shared/lib/cloudinary";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (максимум 5 МБ)" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Только изображения (JPEG, PNG, GIF, WebP)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `avatar-${session.user.id}-${Date.now()}`;

    const result = await uploadToCloudinary(buffer, "avatars", filename, "image");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: result.url },
    });

    return NextResponse.json({ avatarUrl: result.url });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
