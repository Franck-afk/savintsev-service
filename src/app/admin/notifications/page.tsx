"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  userId: string;
  orderId: string | null;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  order: { id: string; title: string; status: string } | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
      }
    } catch { /* ignore */ }
  };

  const unread = notifications.filter((n) => !n.readAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-primary" />
          <h1 className="text-2xl font-bold">Уведомления</h1>
          {unread.length > 0 && (
            <Badge variant="default" className="rounded-full">{unread.length}</Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Нет уведомлений
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors ${!n.readAt ? "border-primary/30 bg-primary/[0.02]" : ""}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 py-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.readAt && <span className="size-2 rounded-full bg-primary shrink-0" />}
                    <CardTitle className="text-sm font-medium">
                      {n.message}
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.order && (
                    <Link href={`/orders?orderId=${n.order.id}`}>
                      <Button variant="outline" size="sm">
                        Заказ #{n.order.id.slice(0, 8)}
                      </Button>
                    </Link>
                  )}
                  {!n.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => markAsRead(n.id)}
                    >
                      <CheckCheck className="size-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
