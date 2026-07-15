import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/api/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "iprabis@gmail.com" },
      select: { id: true, email: true, name: true, role: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    const test1 = await bcrypt.compare("12345678", user.password);
    const test2 = await bcrypt.compare("12345678", "$2a$12$VgL9gE1Hb6kR8xZ6O4qK8O4qK8O4qK8O4qK8O4qK8O4qK8O4qK8O4");

    const genHash = await bcrypt.hash("12345678", 12);
    const test3 = await bcrypt.compare("12345678", genHash);

    return NextResponse.json({
      user: { ...user, password: user.password },
      tests: { test1, test2, test3 },
      genHash,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
