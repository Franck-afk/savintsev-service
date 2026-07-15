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
      steps.push("Added isVisible");
    } catch (e: any) {
      steps.push(`isVisible err: ${e.message?.substring(0, 200)}`);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP`);
      steps.push("Added lastSeen");
    } catch (e: any) {
      steps.push(`lastSeen err: ${e.message?.substring(0, 200)}`);
    }

    const hash = await bcrypt.hash("12345678", 12);

    const rows = await prisma.$queryRawUnsafe<{id: string, email: string, password: string}[]>(
      `SELECT id, email, password FROM users`
    );

    const results = [];
    for (const row of rows) {
      const match = await bcrypt.compare("12345678", row.password);
      if (!match) {
        await prisma.$executeRawUnsafe(
          `UPDATE users SET password = $1 WHERE id = $2`,
          hash, row.id
        );
        results.push({ email: row.email, updated: true });
      } else {
        results.push({ email: row.email, updated: false });
      }
    }

    return NextResponse.json({ steps, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
