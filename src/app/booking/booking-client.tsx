"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { services } from "@/shared/constants/services";

interface Master {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface SlotsResponse {
  slots: string[];
  startTime: string;
  endTime: string;
}

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const serviceTypes = [
  { value: "mounting", label: "Шиномонтаж" },
  { value: "storage", label: "Хранение шин" },
  { value: "repair", label: "Ремонт дисков" },
  { value: "balancing", label: "Балансировка" },
  { value: "puncture", label: "Ремонт прокола" },
  { value: "seasonal", label: "Сезонное хранение" },
  { value: "other", label: "Другое" },
];

export function BookingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") || "mounting";
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [title, setTitle] = useState("");
  const [carInfo, setCarInfo] = useState("");
  const [tireSize, setTireSize] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState(initialService);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/masters")
      .then((res) => res.json())
      .then(setMasters)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedMaster || !selectedDate) { setSlots(null); return; }
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/schedule/slots?masterId=${selectedMaster}&date=${selectedDate}`)
      .then((res) => res.json())
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedMaster, selectedDate]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const handleSubmit = async () => {
    if (!selectedMaster || !selectedDate || !selectedTime || !title) return;
    setSubmitting(true);
    setError("");
    const visitDate = new Date(`${selectedDate}T${selectedTime}:00`);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, serviceType, carInfo, tireSize, phone: phone || undefined, visitDate: visitDate.toISOString(), masterId: selectedMaster, price: services.find((s) => s.id === serviceType)?.priceFrom || null }),
      });
      if (!res.ok) { const err = await res.json(); setError(err.error || "Ошибка"); setSubmitting(false); return; }
      const order = await res.json();
      await fetch("/api/schedule/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId: selectedMaster, orderId: order.id, date: visitDate.toISOString() }),
      });
      setSuccess(true);
    } catch { setError("Ошибка сети"); }
    setSubmitting(false);
  };

  const selectedMasterName = masters.find((m) => m.id === selectedMaster)?.name || "Мастер";
  const canSubmit = selectedMaster && selectedDate && selectedTime && title && !submitting;

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle className="mx-auto size-16 text-green-500" />
        <h1 className="mt-6 text-2xl font-bold">Запись подтверждена!</h1>
        <p className="mt-2 text-muted-foreground">{selectedMasterName}, {selectedDate} в {selectedTime}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => router.push("/orders")}>Мои заказы</Button>
          <Button variant="outline" onClick={() => router.push("/booking")}>Записаться ещё</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Запись на сервис</h1>
        <p className="text-muted-foreground">Выберите мастера, дату и время</p>
      </div>

      {/* Selected summary */}
      {(selectedMaster || selectedDate || selectedTime) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Вы выбрали:</span>
          {selectedMaster && <Badge variant="secondary">{selectedMasterName}</Badge>}
          {selectedDate && <Badge variant="secondary">{selectedDate}</Badge>}
          {selectedTime && <Badge variant="secondary">{selectedTime}</Badge>}
          {selectedMaster && selectedDate && selectedTime && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedMaster(null); setSelectedDate(null); setSelectedTime(null); setSlots(null); }}>
              Сбросить
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Master + Calendar */}
        <div className="space-y-6">
          {/* Step 1: Master */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                Мастер
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {masters.map((master) => (
                  <button
                    key={master.id}
                    onClick={() => { setSelectedMaster(master.id); setSelectedDate(null); setSelectedTime(null); }}
                    className={`flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all ${
                      selectedMaster === master.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="relative size-20 overflow-hidden rounded-full">
                      {master.avatarUrl ? (
                        <Image src={master.avatarUrl} alt={master.name || "Мастер"} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                          {(master.name || "?")[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{master.name || "Мастер"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Calendar */}
          {selectedMaster && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  Дата
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-sm">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-medium">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map((d) => (
                      <div key={d} className="py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isPast = date < today;
                      const isSelected = selectedDate === date.toISOString().split("T")[0];
                      return (
                        <button
                          key={day}
                          disabled={isPast}
                          onClick={() => { setSelectedDate(date.toISOString().split("T")[0]); setSelectedTime(null); }}
                          className={`size-9 rounded-lg text-sm font-medium transition-all ${
                            isPast ? "text-muted-foreground/30 cursor-not-allowed" :
                            isSelected ? "bg-primary text-primary-foreground shadow-sm" :
                            "hover:bg-muted text-foreground"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Time + Form */}
        <div className="space-y-6">
          {/* Step 3: Time slots */}
          {selectedMaster && selectedDate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                  Время
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
                ) : slots && slots.slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.slots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-all ${
                          selectedTime === time
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Нет свободных слотов на эту дату</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Form */}
          {selectedMaster && selectedDate && selectedTime && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</span>
                  Детали заказа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Тип услуги</label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((st) => (
                        <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Название заказа *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Замена резины"
                    className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Автомобиль</label>
                    <input value={carInfo} onChange={(e) => setCarInfo(e.target.value)} placeholder="Марка, модель, год"
                      className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Размер шин</label>
                    <input value={tireSize} onChange={(e) => setTireSize(e.target.value)} placeholder="R13, R15, 205/55R16..."
                      className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 123-45-67"
                    className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Дополнительные пожелания..."
                    className="mt-1 flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Запись...</> : "Записаться"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
