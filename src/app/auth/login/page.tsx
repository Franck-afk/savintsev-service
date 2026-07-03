"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { AuthLayout } from "@/widgets/auth/auth-layout";
import { notifySuccess, notifyError } from "@/shared/lib/notifications";
import { Wrench, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        notifyError("Неверный email или пароль");
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }

      notifySuccess("Успешный вход");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      notifyError("Ошибка при входе");
      setError("Ошибка при входе");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wrench className="size-6" />
        </div>
        <CardTitle className="text-2xl">Вход в систему</CardTitle>
        <CardDescription>Войдите в свой аккаунт</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <AuthInput
            id="email"
            label="Email"
            type="email"
            variant="login"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <AuthInput
            id="password"
            label="Пароль"
            type="password"
            variant="login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Вход...</> : "Войти"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">Зарегистрироваться</Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<Loader2 className="size-8 animate-spin text-primary" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
