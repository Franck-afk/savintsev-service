"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { Loader2, Save } from "lucide-react";

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface DaySchedule {
  day: string;
  start: string;
  end: string;
  enabled: boolean;
}

const defaultWeek: DaySchedule[] = dayNames.map((day) => ({
  day,
  start: "09:00",
  end: "18:00",
  enabled: day !== "Вс",
}));

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "Шинный мастер",
    address: "",
    phone: "",
  });
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultWeek);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setForm({ name: data.name, address: data.address || "", phone: data.phone || "" });
        if (Array.isArray(data.schedule) && data.schedule.length > 0) {
          setSchedule(data.schedule);
        }
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  const toggleDay = (index: number) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const updateTime = (index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          schedule: schedule.filter((d) => d.enabled).map((d) => ({ day: d.day, start: d.start, end: d.end })),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки компании</h1>
        <p className="text-muted-foreground">Управление информацией о компании</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthInput id="name" label="Название компании" type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" />

          <AuthInput id="address" label="Адрес" type="text" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="г. Москва, ул. Примерная, 123" />

          <AuthInput id="phone" label="Телефон" type="tel" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (999) 123-45-67" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>График работы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((day, i) => (
            <div key={day.day} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  day.enabled
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.day}
              </button>

              {day.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.start}
                    onChange={(e) => updateTime(i, "start", e.target.value)}
                    className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-muted-foreground">—</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(e) => updateTime(i, "end", e.target.value)}
                    className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Выходной</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
        {success && (
          <span className="text-sm text-green-600">Сохранено</span>
        )}
      </div>
    </div>
  );
}
