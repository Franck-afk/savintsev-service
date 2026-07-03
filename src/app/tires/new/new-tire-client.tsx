"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export function NewTireClient() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [season, setSeason] = useState("Summer");
  const [quantity, setQuantity] = useState(4);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [ownerQuery, setOwnerQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ownerQuery.trim()) { setSearchResults([]); return; }
    let ignore = false;
    setSearching(true);
    fetch(`/api/users/search?q=${encodeURIComponent(ownerQuery)}`)
      .then((res) => res.json())
      .then((data) => { if (!ignore) setSearchResults(data); })
      .catch(() => {})
      .finally(() => { if (!ignore) setSearching(false); });
    return () => { ignore = true; };
  }, [ownerQuery]);

  const handleSubmit = async () => {
    if (!brand || !size || !selectedOwner) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand, model: model || undefined, size, season, quantity, location: location || undefined,
          notes: notes || undefined, ownerId: selectedOwner.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Ошибка");
        return;
      }

      router.push("/tires");
    } catch {
      setError("Ошибка сети");
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <PackageSearch className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Приём шин на хранение</h1>
          <p className="text-muted-foreground">Заполните информацию о шинах</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Клиент *</label>
          {selectedOwner ? (
            <div className="mt-1 flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedOwner.name || "Без имени"}</p>
                <p className="text-xs text-muted-foreground">{selectedOwner.email} {selectedOwner.phone ? `• ${selectedOwner.phone}` : ""}</p>
              </div>
              <button onClick={() => { setSelectedOwner(null); setOwnerQuery(""); }} className="text-xs text-destructive hover:underline">
                Изменить
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={ownerQuery}
                onChange={(e) => setOwnerQuery(e.target.value)}
                placeholder="Поиск клиента по имени или email..."
                className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {ownerQuery && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                  {searching ? (
                    <div className="flex justify-center p-3"><Loader2 className="size-4 animate-spin" /></div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedOwner(u)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {(u.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name || "Без имени"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">Ничего не найдено</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Бренд *</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)}
              placeholder="Michelin, Bridgestone..."
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Модель</label>
            <input value={model} onChange={(e) => setModel(e.target.value)}
              placeholder="X-Ice, Alpin..."
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Размер *</label>
            <input value={size} onChange={(e) => setSize(e.target.value)}
              placeholder="205/55R16"
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Сезон</label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Summer">Летние</SelectItem>
                <SelectItem value="Winter">Зимние</SelectItem>
                <SelectItem value="AllSeason">Всесезонные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Количество</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Место на складе</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Стеллаж A, полка 3"
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Примечания</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Состояние шин, повреждения..."
            className="mt-1 flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={!brand || !size || !selectedOwner || submitting} className="w-full">
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {submitting ? "Сохранение..." : "Принять шины на хранение"}
        </Button>
      </div>
    </div>
  );
}
