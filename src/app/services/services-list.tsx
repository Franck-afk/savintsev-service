"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Wrench, Warehouse, Hammer, Gauge, Plug, RefreshCw } from "lucide-react";
import { services } from "@/shared/constants/services";

const iconMap: Record<string, typeof Wrench> = {
  mounting: Wrench,
  storage: Warehouse,
  repair: Hammer,
  balancing: Gauge,
  puncture: Plug,
  seasonal: RefreshCw,
};

export function ServicesList({ role }: { role?: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const Icon = iconMap[service.id] || Wrench;
        return (
          <Card key={service.id} className="flex flex-col transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-lg">{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="mb-4 text-sm text-muted-foreground">{service.description}</p>

              <div className="mb-4 space-y-1.5">
                {service.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                <div>
                  <p className="text-lg font-bold text-primary">{service.price}</p>
                  <p className="text-xs text-muted-foreground">{service.duration}</p>
                </div>
                {role === "Client" && (
                  <Link href={`/booking?service=${service.id}`}>
                    <Button size="sm">Записаться</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
