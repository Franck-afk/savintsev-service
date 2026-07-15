import { redirect } from "next/navigation";
import { auth } from "@/shared/config/auth";

export async function requireSession() {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/auth/login");
  }

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
