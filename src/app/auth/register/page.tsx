"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { AuthLayout } from "@/widgets/auth/auth-layout";
import { notifySuccess, notifyError } from "@/shared/lib/notifications";
import { Wrench, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      notifyError("Пароли не совпадают");
      setError("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 6) {
      notifyError("Пароль должен быть не менее 6 символов");
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (!consent) {
      setError("Необходимо дать согласие на обработку персональных данных");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name, email: formData.email,
          phone: formData.phone, password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        notifyError(data.error || "Ошибка при регистрации");
        setError(data.error || "Ошибка при регистрации");
        setLoading(false);
        return;
      }

      notifySuccess("Аккаунт создан. Войдите в систему.");
      router.push("/auth/login");
    } catch {
      notifyError("Ошибка при регистрации");
      setError("Ошибка при регистрации");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт клиента</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <AuthInput id="name" label="Имя" name="name" type="text" value={formData.name}
              onChange={handleChange} placeholder="Ваше имя" required />

            <AuthInput id="email" label="Email" name="email" type="email" variant="register" value={formData.email}
              onChange={handleChange} placeholder="your@email.com" required />

            <AuthInput id="phone" label="Телефон" name="phone" type="tel" value={formData.phone}
              onChange={handleChange} placeholder="+7 (999) 123-45-67" />

            <AuthInput id="password" label="Пароль" name="password" type="password" variant="register" value={formData.password}
              onChange={handleChange} placeholder="Минимум 6 символов" required />

            <AuthInput id="confirmPassword" label="Подтвердите пароль" name="confirmPassword"
              type="password" variant="register" value={formData.confirmPassword}
              onChange={handleChange} placeholder="Повторите пароль" required />

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
              />
              <span>
                Даю согласие на обработку{" "}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  персональных данных
                </Link>{" "}
                в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={loading || !consent}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> Регистрация...</> : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">Войти</Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
