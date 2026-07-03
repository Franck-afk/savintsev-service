import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";

const UPDATABLE_FIELDS = ["brand", "model", "size", "season", "quantity", "location", "notes", "status", "photoUrl"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const tire = await prisma.tire.findUnique({ where: { id } });
  if (!tire) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role === "Client" && tire.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  if (data.status === "Issued") {
    data.issueDate = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
  }

  const updated = await prisma.tire.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.tire.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
