import { NextResponse } from "next/server";
import { auth } from "@/shared/config/auth";
import { uploadToCloudinary } from "@/shared/lib/cloudinary";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip", "application/x-rar-compressed",
]);
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не предоставлен" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (максимум 10 МБ)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Тип файла не поддерживается" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "";
    const uniqueName = `chat/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isImage = file.type.startsWith("image/");

    const result = await uploadToCloudinary(
      buffer,
      "chat",
      uniqueName,
      isImage ? "image" : "raw"
    );

    const sanitizedName = file.name.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, "_");

    return NextResponse.json({
      url: result.url,
      name: sanitizedName || file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("Upload error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Ошибка загрузки: ${message}` }, { status: 500 });
  }
}
