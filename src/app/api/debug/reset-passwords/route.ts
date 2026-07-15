import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/api/prisma";

export const dynamic = "force-dynamic";

const RESET_KEY = "shinny-master-reset-2026";

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    if (key !== RESET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hash = await bcrypt.hash("12345678", 12);

    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true },
    });

    const results = [];
    for (const user of users) {
      const match = await bcrypt.compare("12345678", user.password);
      if (!match) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hash },
        });
        results.push({ email: user.email, updated: true });
      } else {
        results.push({ email: user.email, updated: false });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
