import { requireSession } from "@/shared/lib/auth-helpers";
import { MainLayout } from "@/widgets/layout";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (session.user?.role !== "Owner") {
    redirect("/dashboard");
  }

  return (
    <MainLayout
      user={{
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        role: session.user?.role,
        avatarUrl: session.user?.avatarUrl,
      }}
    >
      {children}
    </MainLayout>
  );
}
