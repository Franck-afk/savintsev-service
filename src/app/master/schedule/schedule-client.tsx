"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, User as UserIcon, Wrench, Loader2, CalendarDays } from "lucide-react";

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const serviceLabels: Record<string, string> = {
  mounting: "Шиномонтаж", storage: "Хранение", repair: "Ремонт дисков",
  balancing: "Балансировка", puncture: "Ремонт прокола", seasonal: "Сезонное", other: "Другое",
};

interface AppointedOrder {
  id: string;
  title: string;
  serviceType: string | null;
  carInfo: string | null;
  tireSize: string | null;
  phone: string | null;
  status: string;
  user: { name: string | null; phone: string | null };
  timeSlot: { date: string; duration: number };
}

export function ScheduleClient({ userId, role }: { userId: string; role: string }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [orders, setOrders] = useState<AppointedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAppointments = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const params = role === "Master"
        ? `?masterId=${userId}&date=${date}`
        : `?date=${date}`;
      const res = await fetch(`/api/orders/appointments${params}`);
      if (res.ok) setOrders(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [role, userId]);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate, fetchAppointments]);

  const today = new Date().toISOString().split("T")[0];
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Расписание</h1>
          <p className="text-muted-foreground">Записи клиентов по датам</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Calendar */}
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between rounded-t-xl bg-muted/30 px-4 py-3">
            <button onClick={prevMonth} className="p-1 hover:text-foreground text-muted-foreground">
              <ChevronLeft className="size-5" />
            </button>
            <span className="font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1 hover:text-foreground text-muted-foreground">
              <ChevronRight className="size-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-t border-border">
            {dayNames.map((d) => (
              <div key={d} className="border-b border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateStr = date.toISOString().split("T")[0];
              const isPast = date < now;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative px-2 py-3 text-sm transition-colors ${
                    isPast ? "text-muted-foreground/30" :
                    isSelected ? "bg-primary text-primary-foreground font-medium" :
                    "hover:bg-accent"
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">
              {selectedDate === today ? "Сегодня" : new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-12 text-center">
              <CalendarDays className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Нет записей на этот день</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders
                .sort((a, b) => new Date(a.timeSlot.date).getTime() - new Date(b.timeSlot.date).getTime())
                .map((order) => {
                  const time = new Date(order.timeSlot.date);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{order.title}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserIcon className="size-3" />
                            {order.user.name || "Клиент"}
                          </span>
                          {order.serviceType && (
                            <span className="flex items-center gap-1">
                              <Wrench className="size-3" />
                              {serviceLabels[order.serviceType] || order.serviceType}
                            </span>
                          )}
                          {order.carInfo && <span>{order.carInfo}</span>}
                          {order.tireSize && <span>{order.tireSize}</span>}
                          {order.phone && <span>{order.phone}</span>}
                        </div>
                      </div>
                      <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === "Pending" ? "bg-amber-100 text-amber-700" :
                        order.status === "InProgress" ? "bg-blue-100 text-blue-700" :
                        order.status === "Completed" ? "bg-green-100 text-green-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {order.status === "Pending" ? "Ожидает" :
                         order.status === "InProgress" ? "В работе" :
                         order.status === "Completed" ? "Готово" : "Отменён"}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
