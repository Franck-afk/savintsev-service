"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { Pencil, Loader2, CalendarIcon } from "lucide-react";
import type { Order } from "./order-card";
import { getSocket } from "@/shared/api/socket-client";
import { useSession } from "next-auth/react";

interface Master {
  id: string;
  name: string | null;
  email: string;
}

const serviceTypes = [
  { value: "mounting", label: "Шиномонтаж" },
  { value: "storage", label: "Хранение шин" },
  { value: "repair", label: "Ремонт дисков" },
  { value: "balancing", label: "Балансировка" },
  { value: "puncture", label: "Ремонт прокола" },
  { value: "seasonal", label: "Сезонная замена" },
  { value: "other", label: "Другое" },
];

interface EditOrderDialogProps {
  order: Order;
  onUpdated: () => void;
}

export function EditOrderDialog({ order, onUpdated }: EditOrderDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [masterId, setMasterId] = useState(order.masterId ?? "");
  const [serviceType, setServiceType] = useState(order.serviceType ?? "");
  const [carInfo, setCarInfo] = useState(order.carInfo ?? "");
  const [tireSize, setTireSize] = useState(order.tireSize ?? "");
  const [phone, setPhone] = useState(order.phone ?? "");
  const [visitDate, setVisitDate] = useState<Date | undefined>(
    order.visitDate ? new Date(order.visitDate) : undefined
  );
  const [description, setDescription] = useState(order.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (open) {
      fetch("/api/users/masters")
        .then((res) => res.json())
        .then((data) => { if (!ignore) setMasters(data); })
        .catch(() => {});
    }
    return () => { ignore = true; };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          carInfo,
          tireSize,
          phone,
          visitDate: visitDate ? visitDate.toISOString() : null,
          description,
          masterId: masterId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка");
        return;
      }

      const updated = await res.json();
      if (session?.user?.id && order.userId) {
        const socket = getSocket(session.user.id);
        socket.emit("order-stage-updated", {
          orderId: order.id,
          ownerId: order.userId,
          currentStage: updated.currentStage ?? 0,
          status: updated.status,
        });
      }

      setOpen(false);
      onUpdated();
    } catch {
      setError("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать заказ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Тип услуги</label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AuthInput
              id="edit-car"
              label="Автомобиль"
              type="text"
              value={carInfo}
              onChange={(e) => setCarInfo(e.target.value)}
              placeholder="Марка / модель"
            />
            <AuthInput
              id="edit-tire"
              label="Размер шин"
              type="text"
              value={tireSize}
              onChange={(e) => setTireSize(e.target.value)}
              placeholder="Например: 205/55 R16"
            />
          </div>

          <AuthInput
            id="edit-phone"
            label="Телефон"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Желаемая дата визита</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-left font-normal"
                >
                  <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                  {visitDate ? (
                    format(visitDate, "d MMMM yyyy", { locale: ru })
                  ) : (
                    <span className="text-muted-foreground">Выберите дату</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={setVisitDate}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Мастер</label>
            <Select value={masterId} onValueChange={setMasterId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите мастера" />
              </SelectTrigger>
              <SelectContent>
                {masters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-desc" className="text-sm font-medium">
              Комментарий
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация..."
              className="h-20 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Сохранение...</> : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
