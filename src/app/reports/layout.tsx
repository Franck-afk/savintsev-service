import { requireRole } from "@/shared/lib/auth-helpers";
import { MainLayout } from "@/widgets/layout";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["Owner"]);

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
