import { redirect } from "next/navigation";
import { prisma } from "@/shared/api/prisma";

export default async function Home() {
  try {
    const userCount = await prisma.user.count();
    redirect(userCount === 0 ? "/auth/seed" : "/auth/register");
  } catch {
    redirect("/auth/register");
  }
}
