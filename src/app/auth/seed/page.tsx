"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { AuthLayout } from "@/widgets/auth/auth-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Loader2, CheckCircle2 } from "lucide-react";

function SeedForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasOwner, setHasOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasOwner) {
          setHasOwner(true);
          router.push("/auth/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, secret }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Ошибка");
        setLoading(false);
        return;
      }

      setSuccess(true);

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/auth/login");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Ошибка при создании");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasOwner) {
    return null;
  }

  if (success) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-green-500 text-white">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-2xl">Готово!</CardTitle>
            <CardDescription>Аккаунт владельца создан. Переход в панель управления...</CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Crown className="size-6" />
          </div>
          <CardTitle className="text-2xl">Первоначальная настройка</CardTitle>
          <CardDescription>Создайте учётную запись владельца системы</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <AuthInput
              id="name"
              label="Имя"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
            <AuthInput
              id="email"
              label="Email"
              type="email"
              variant="seed"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@email.com"
              required
            />
            <AuthInput
              id="password"
              label="Пароль"
              type="password"
              variant="seed"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              required
            />
            <AuthInput
              id="secret"
              label="Секретный ключ"
              type="password"
              variant="seed"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Ключ из .env (SEED_SECRET)"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Создание...
                </>
              ) : (
                "Создать владельца"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default function SeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <SeedForm />
    </Suspense>
  );
}
