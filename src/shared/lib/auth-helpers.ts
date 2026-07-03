import { redirect } from "next/navigation";
import { auth } from "@/shared/config/auth";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireSession();

  const userRole = session.user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }

  return session;
}
