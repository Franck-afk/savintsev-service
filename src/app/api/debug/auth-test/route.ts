import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/api/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "iprabis@gmail.com" },
      select: { id: true, email: true, name: true, role: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare("12345678", user.password);

    return NextResponse.json({
      user: { ...user, password: user.password.substring(0, 10) + "..." },
      isValid,
      bcryptVersion: "bcryptjs",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
