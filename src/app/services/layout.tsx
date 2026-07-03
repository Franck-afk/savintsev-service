import { auth } from "@/shared/config/auth";
import { MainLayout } from "@/widgets/layout";
import Link from "next/link";
import { Wrench } from "lucide-react";

export default async function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="size-5" />
              </div>
              <span className="text-lg font-bold">Шинный Мастер</span>
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Войти
            </Link>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <MainLayout
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        avatarUrl: session.user.avatarUrl,
      }}
    >
      {children}
    </MainLayout>
  );
}
