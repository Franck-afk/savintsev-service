"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard } from "@/features/orders";
import { NewOrderDialog } from "./new-order-dialog";
import { ClipboardList } from "lucide-react";
import { getSocket } from "@/shared/api/socket-client";
import { useSession } from "next-auth/react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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

const statusTabs = [
  { value: "all", label: "Все" },
  { value: "Pending", label: "Ожидают" },
  { value: "InProgress", label: "В работе" },
  { value: "Completed", label: "Завершённые" },
  { value: "Cancelled", label: "Отменённые" },
];

const PAGE_SIZE = 20;

export function OrdersClient({ role }: { role: string }) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (activeTab !== "all") params.set("status", activeTab);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data.map((o: { createdAt: string }) => ({ ...o, createdAt: new Date(o.createdAt) })));
        setTotalPages(json.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Заказы</h1>
          <p className="text-muted-foreground">
            {role === "Client" ? "Ваши заявки" : "Все заказы"}
          </p>
        </div>
        {role === "Client" && <NewOrderDialog onCreated={fetchOrders} />}
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <ClipboardList className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {activeTab === "all"
              ? "У вас пока нет заказов"
              : "Нет заказов в этом статусе"}
          </p>
          {role === "Client" && activeTab === "all" && (
            <p className="text-sm text-muted-foreground">
              Создайте первый заказ!
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                role={role}
                onDelete={(id) => setOrders((prev) => prev.filter((o) => o.id !== id))}
                onUpdated={fetchOrders}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text="Назад"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          isActive={page === item}
                          onClick={() => setPage(item)}
                          className="cursor-pointer"
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                <PaginationItem>
                  <PaginationNext
                    text="Далее"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
