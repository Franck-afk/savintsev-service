"use client";

import { useState, useCallback, useEffect } from "react";
import { OrderCard } from "@/features/orders";
import { Wrench, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { getSocket } from "@/shared/api/socket-client";
import { useSession } from "next-auth/react";

interface Order {
  id: string;
  title: string;
  description?: string | null;
  status: "Pending" | "InProgress" | "Completed" | "Cancelled";
  serviceType?: string | null;
  carInfo?: string | null;
  tireSize?: string | null;
  phone?: string | null;
  visitDate?: string | null;
  currentStage?: number;
  masterId?: string | null;
  userId?: string;
  createdAt: Date;
  user?: { name?: string | null; email?: string | null };
  master?: { name?: string | null; email?: string | null };
}

const tabs = [
  { value: "active", label: "Активные", icon: ClipboardList },
  { value: "completed", label: "Завершённые", icon: CheckCircle },
  { value: "cancelled", label: "Отменённые", icon: XCircle },
];

export function MasterClient({ userId, role }: { userId: string; role: string }) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const fetchOrders = useCallback(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((o: { createdAt: string }) => ({ ...o, createdAt: new Date(o.createdAt) }));
        if (role === "Master") {
          setOrders(mapped.filter((o: Order) => o.masterId === userId));
        } else {
          setOrders(mapped);
        }
      })
      .catch(() => {});
  }, [role, userId]);

  useEffect(() => {
    fetchOrders();
    setLoading(false);
  }, [fetchOrders]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const socket = getSocket(session.user.id);
    const handler = (data: { orderId: string; currentStage: number; status: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderId
            ? { ...o, currentStage: data.currentStage, status: data.status as Order["status"] }
            : o
        )
      );
    };
    socket.on("order-stage-refreshed", handler);

    const removeHandler = (orderId: string) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    };
    socket.on("order-removed", removeHandler);

    return () => {
      socket.off("order-stage-refreshed", handler);
      socket.off("order-removed", removeHandler);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const hasActive = orders.some(
      (o) => o.status === "Pending" || o.status === "InProgress"
    );
    if (!hasActive) return;
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const filtered = orders.filter((o) => {
    if (activeTab === "active") return o.status === "Pending" || o.status === "InProgress";
    if (activeTab === "completed") return o.status === "Completed";
    if (activeTab === "cancelled") return o.status === "Cancelled";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Мои работы</h1>
          <p className="text-muted-foreground">
            Управление этапами ремонта
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Wrench className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Нет заказов</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              role={role}
              onUpdated={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}
