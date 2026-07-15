"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

interface Master {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "давно";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

export function OnlineMastersWidget() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasters = () => {
      fetch("/api/users/online-masters")
        .then((r) => r.ok && r.json())
        .then((data) => {
          if (data) setMasters(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchMasters();
    const interval = setInterval(fetchMasters, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const online = masters.filter((m) => m.isOnline);
  const offline = masters.filter((m) => !m.isOnline);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="size-4" />
          Мастера
          <Badge variant="secondary" className="ml-auto">
            {online.length} онлайн
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {masters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет доступных мастеров
          </p>
        ) : (
          <div className="space-y-3">
            {online.length > 0 && (
              <div className="space-y-2">
                {online.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-green-500/5 p-2">
                    <div className="relative size-9 shrink-0">
                      {m.avatarUrl ? (
                        <Image src={m.avatarUrl} alt="" fill className="object-cover rounded-full" />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-green-500/20 text-sm font-medium text-green-600">
                          {getInitials(m.name || "?")}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name || "Без имени"}</p>
                      <p className="text-xs text-green-600">Онлайн</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {offline.length > 0 && (
              <div className="space-y-2">
                {offline.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg p-2 opacity-60">
                    <div className="relative size-9 shrink-0">
                      {m.avatarUrl ? (
                        <Image src={m.avatarUrl} alt="" fill className="object-cover rounded-full" />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          {getInitials(m.name || "?")}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name || "Без имени"}</p>
                      <p className="text-xs text-muted-foreground">Был(а) {timeAgo(m.lastSeen)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
