"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Plus, Search, Loader2, Snowflake, Sun, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const seasonLabels: Record<string, string> = {
  Winter: "Зимние", Summer: "Летние", AllSeason: "Всесезонные",
};
const seasonIcons: Record<string, typeof Snowflake> = {
  Winter: Snowflake, Summer: Sun, AllSeason: Layers,
};
const statusLabels: Record<string, string> = {
  Stored: "На хранении", Issued: "Выданы",
};

interface Tire {
  id: string;
  brand: string;
  model: string | null;
  size: string;
  season: string;
  quantity: number;
  receiptDate: string;
  issueDate: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  owner: { id: string; name: string | null; phone: string | null };
}

export function TiresClient({ role }: { role: string }) {
  const router = useRouter();
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchTires = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/tires?${params}`);
      if (res.ok) setTires(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { fetchTires(); }, [fetchTires]);

  useEffect(() => {
    const timer = setTimeout(fetchTires, 300);
    return () => clearTimeout(timer);
  }, [fetchTires]);

  const handleIssue = async (id: string) => {
    try {
      await fetch(`/api/tires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Issued" }),
      });
      fetchTires();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Склад шин</h1>
            <p className="text-muted-foreground">
              {role === "Client" ? "Ваши шины на хранении" : "Учёт хранения шин"}
            </p>
          </div>
        </div>
        {role !== "Client" && (
          <Button onClick={() => router.push("/tires/new")}>
            <Plus className="mr-2 size-4" />Принять шины
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по бренду, размеру, месту..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="Stored">На хранении</SelectItem>
            <SelectItem value="Issued">Выданы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : tires.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-12 text-center">
          <PackageSearch className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Шины не найдены</p>
          {role !== "Client" && (
            <Button variant="outline" onClick={() => router.push("/tires/new")}>
              Принять шины на хранение
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tires.map((tire) => {
            const SeasonIcon = seasonIcons[tire.season] || Sun;
            return (
              <div
                key={tire.id}
                className="rounded-xl border border-border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{tire.brand} {tire.model || ""}</p>
                    <p className="text-sm text-muted-foreground">{tire.size}</p>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${
                    tire.status === "Stored" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {statusLabels[tire.status]}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <SeasonIcon className="size-3.5" />
                    {seasonLabels[tire.season]}
                  </span>
                  <span className="flex items-center gap-1">
                    <PackageSearch className="size-3.5" />
                    {tire.quantity} шт.
                  </span>
                </div>

                {tire.location && (
                  <p className="text-xs text-muted-foreground">
                    Место: {tire.location}
                  </p>
                )}

                <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                  <p>{tire.owner.name || "Клиент"} {tire.owner.phone ? `• ${tire.owner.phone}` : ""}</p>
                  <p>Приняты: {new Date(tire.receiptDate).toLocaleDateString("ru-RU")}</p>
                </div>

                {tire.status === "Stored" && role !== "Client" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleIssue(tire.id)}
                  >
                    Отметить выдачу
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
