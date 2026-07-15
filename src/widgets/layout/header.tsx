"use client";

import { signOut } from "next-auth/react";
import { disconnectSocket } from "@/shared/api/socket-client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/features/navigation/theme-toggle";
import { NotificationBell } from "@/features/notifications";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const roleLabels: Record<string, string> = {
  Client: "Клиент",
  Master: "Мастер",
  Owner: "Владелец",
};

interface HeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    avatarUrl?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <Sidebar role={user.role || "Client"} />
        </SheetContent>
      </Sheet>

      <div className="relative ml-4 hidden w-full max-w-md md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Поиск заказов, клиентов..."
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {user.id && <NotificationBell role={user.role} />}

        <ThemeToggle />

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{user.name || "Пользователь"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          {user.avatarUrl ? (
            <div className="relative size-8 shrink-0">
              <Image src={user.avatarUrl} alt="" fill className="rounded-full object-cover" />
            </div>
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
              {(user.name || "П")[0]}
            </div>
          )}

          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {roleLabels[user.role || ""] || user.role || "Клиент"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              disconnectSocket();
              await fetch("/api/chat/offline", { method: "POST" }).catch(() => {});
              signOut({ redirect: false }).then(() => { window.location.href = "/auth/login"; });
            }}
          >
            <LogOut className="size-5" />
            <span className="sr-only">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
