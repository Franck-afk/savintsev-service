"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { Mail, Phone, Calendar, Settings, Shield, Pencil } from "lucide-react";

interface Stats {
  total: number
  completed: number
  inProgress: number
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ClientAccountPage() {
  const { data: session, update } = useSession();
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0 });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = session?.user;
  const name = user?.name || "Пользователь";
  const email = user?.email || "";
  const phone = user?.phone || "";

  const [form, setForm] = useState({ name, phone });

  useEffect(() => {
    fetch("/api/account/stats")
      .then((r) => r.ok && r.json())
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await update();
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-gradient-to-b from-card to-background border p-8 md:p-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
          <div className={`flex size-28 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg ring-4 ring-primary/10 ${getAvatarColor(name)}`}>
            {getInitials(name)}
          </div>

          <div className="flex flex-col items-center gap-4 md:items-start md:gap-3">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-4" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <Shield className="size-3.5" />
                Клиент
              </Badge>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-5 py-3">
              <div className="text-center">
                <p className="text-lg font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Всего заявок</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{stats.completed}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Выполнено</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">В работе</p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Pencil className="size-4" />
                  Редактировать профиль
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="size-5" />
                    Редактировать профиль
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <AuthInput
                    id="edit-name"
                    label="Имя"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ваше имя"
                  />
                  <AuthInput
                    id="edit-phone"
                    label="Телефон"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7 (999) 999-99-99"
                  />
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Mail className="size-4" />
                      Email нельзя изменить
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="size-3.5" />
        {user?.createdAt
          ? `Зарегистрирован: ${new Date(user.createdAt).toLocaleDateString("ru-RU")}`
          : "Дата регистрации недоступна"}
      </div>
    </div>
  );
}
