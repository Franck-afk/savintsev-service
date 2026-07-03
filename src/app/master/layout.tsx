import { requireSession } from "@/shared/lib/auth-helpers";
import { MainLayout } from "@/widgets/layout";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

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
