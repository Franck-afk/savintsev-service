"use client";

import { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface TabItem {
  id: string
  label: string
  icon: LucideIcon
}

interface TabbedLayoutProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (id: string) => void
  children: ReactNode
}

export function TabbedLayout({ tabs, activeTab, onTabChange, children }: TabbedLayoutProps) {
  return (
    <div className="flex gap-10">
      <aside className="hidden w-64 shrink-0 md:block">
        <nav className="space-y-1.5 sticky top-24">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3.5 rounded-xl px-5 py-3.5 text-sm font-medium transition-all text-left ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className={`flex size-8 items-center justify-center rounded-lg ${isActive ? "bg-white/15" : "bg-muted"}`}>
                  <Icon className="size-4" />
                </div>
                <span>{tab.label}</span>
                {isActive && <ChevronRight className="size-4 ml-auto opacity-70" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {children}

        <div className="mt-6 flex gap-2 md:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
