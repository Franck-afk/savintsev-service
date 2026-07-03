"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation, type NavItem } from "@/shared/constants/navigation";

interface NavigationPanelProps { role: string; }

export function NavigationPanel({ role }: NavigationPanelProps) {
  const pathname = usePathname();
  const items: NavItem[] = navigation[role] || navigation.Client;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
