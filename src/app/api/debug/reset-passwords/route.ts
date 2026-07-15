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

    const steps: string[] = [];

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true`);
      steps.push("Added isVisible column");
    } catch (e: any) {
      steps.push(`isVisible: ${e.message}`);
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

    return NextResponse.json({ steps, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
