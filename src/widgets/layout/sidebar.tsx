"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";
import { navigation, type NavItem } from "@/shared/constants/navigation";

interface SidebarProps { role: string; isOpen?: boolean; onClose?: () => void; }

export function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items: NavItem[] = navigation[role] || navigation.Client;

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-sidebar transition-transform duration-200",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Wrench className="size-4" />
            </div>
            <span className="text-lg font-semibold">Шинный Мастер</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
