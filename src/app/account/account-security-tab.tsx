"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle, Trash2, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function PasswordInput({ id, label, value, onChange, show, setShow, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 pr-9 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (form.newPassword !== form.confirmPassword) { setError("Новые пароли не совпадают"); return; }
    if (form.newPassword.length < 6) { setError("Новый пароль минимум 6 символов"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка");
      else { setSuccess("Пароль успешно изменён"); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    } catch { setError("Ошибка при смене пароля"); }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: deletePassword }) });
      if (res.ok) router.push("/auth/login");
      else { const data = await res.json(); setError(data.error || "Ошибка"); }
    } catch { setError("Ошибка при удалении"); }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold"><Lock className="size-4" /> Смена пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-2.5">
            {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {success && <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-500 flex items-center gap-1.5"><CheckCircle className="size-3.5" />{success}</div>}
            <PasswordInput id="current-password" label="Текущий пароль" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} show={showCurrent} setShow={setShowCurrent} placeholder="Введите текущий пароль" />
            <PasswordInput id="new-password" label="Новый пароль" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} show={showNew} setShow={setShowNew} placeholder="Минимум 6 символов" />
            <PasswordInput id="confirm-password" label="Подтвердите новый пароль" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} show={showConfirm} setShow={setShowConfirm} placeholder="Повторите новый пароль" />
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <><Loader2 className="size-3.5 animate-spin" /> Изменение...</> : "Изменить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-destructive"><AlertTriangle className="size-4" /> Удаление аккаунта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Это действие необратимо. Все ваши данные, заказы и история будут удалены.</p>
          {!deleteConfirm ? (
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)} className="gap-1.5">
              <Trash2 className="size-3.5" /> Удалить аккаунт
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg bg-destructive/10 p-3">
              <p className="text-xs font-medium text-destructive">Вы уверены? Введите пароль для подтверждения</p>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Ваш пароль"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/30" />
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting || !deletePassword} className="gap-1.5">
                  {deleting ? <><Loader2 className="size-3.5 animate-spin" /> Удаление...</> : "Подтвердить удаление"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDeleteConfirm(false); setDeletePassword(""); }}>Отмена</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
