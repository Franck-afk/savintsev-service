"use client";

import { Button } from "@/components/ui/button";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

interface AdminUserFormProps {
  data: UserFormData;
  onChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
  savingLabel: string;
  showPassword?: boolean;
  passwordPlaceholder?: string;
}

export function AdminUserForm({
  data, onChange, onSubmit, error, saving, onCancel,
  submitLabel, savingLabel, showPassword = true, passwordPlaceholder = "Минимум 6 символов",
}: AdminUserFormProps) {
  const update = (field: keyof UserFormData, value: string) => onChange({ ...data, [field]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <AuthInput id={`name-${data.role}`} label="Имя" type="text" value={data.name}
        onChange={(e) => update("name", e.target.value)} placeholder="Имя" required />

      <AuthInput id={`email-${data.role}`} label="Email" type="email" value={data.email}
        onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" required />

      {showPassword && (
        <AuthInput id={`password-${data.role}`} label="Пароль" type="password" value={data.password}
          onChange={(e) => update("password", e.target.value)} placeholder={passwordPlaceholder}
          required={submitLabel === "Создать"} />
      )}

      <AuthInput id={`phone-${data.role}`} label="Телефон" type="tel" value={data.phone}
        onChange={(e) => update("phone", e.target.value)} placeholder="+7 (999) 123-45-67" />

      <div className="space-y-2">
        <label className="text-sm font-medium">Роль</label>
        <Select value={data.role} onValueChange={(value) => update("role", value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Master">Мастер</SelectItem>
            <SelectItem value="Client">Клиент</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" /> {savingLabel}</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
