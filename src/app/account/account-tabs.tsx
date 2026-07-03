"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Mail, Phone, Calendar, ChevronRight } from "lucide-react";
import { SecurityTab } from "./account-security-tab";

interface AccountTabsProps {
  name: string; email: string; phone: string | null; createdAt: string;
}

type Tab = "profile" | "security";

const sidebarItems: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Профиль", icon: User },
  { id: "security", label: "Безопасность", icon: Shield },
];

export function AccountTabs({ name, email, phone, createdAt }: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const createdDate = new Date(createdAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <aside className="shrink-0 lg:w-48 lg:sticky lg:top-4">
        <nav className="flex gap-0.5 rounded-lg bg-muted/50 p-0.5 lg:flex-col lg:gap-0 lg:rounded-lg lg:p-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} data-active={isActive}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all lg:flex-none lg:justify-start lg:px-2.5 data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm text-muted-foreground hover:text-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="ml-auto hidden size-3.5 lg:block" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {activeTab === "profile" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold"><User className="size-4" /> Личная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { icon: User, label: "Имя", value: name },
                { icon: Mail, label: "Email", value: email },
                ...(phone ? [{ icon: Phone, label: "Телефон", value: phone }] : []),
                { icon: Calendar, label: "Дата регистрации", value: createdDate },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 shrink-0"><Icon className="size-3.5 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}
