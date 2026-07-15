"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label,
} from "recharts";
import { ClipboardList, Wrench, CheckCircle, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { OnlineMastersWidget } from "@/widgets/online-masters";

interface RoleDashboardData {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  ordersByStatus: { name: string; value: number; color: string }[];
  ordersByMonth: { month: string; total: number; completed: number; cancelled: number }[];
  ordersByService: { name: string; count: number; revenue: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  InProgress: "#3b82f6",
  Completed: "#22c55e",
  Cancelled: "#ef4444",
};

const SERVICE_COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "13px",
};

function KpiCard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string; value: number | string; subtitle: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className="flex size-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="size-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CustomBarLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  if (value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 6} fill="hsl(var(--foreground))" textAnchor="middle" fontSize={12} fontWeight={600}>
      {value}
    </text>
  );
}

export function RoleDashboard({ data, role }: { data: RoleDashboardData; role: string }) {
  const completionRate = data.totalOrders > 0
    ? Math.round((data.completedOrders / data.totalOrders) * 100)
    : 0;

  const masterLabel = role === "Master" ? "Мои работы" : "Мои заказы";

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={masterLabel}
          value={data.totalOrders}
          subtitle={`${data.activeOrders} активных`}
          icon={ClipboardList}
          color="#6366f1"
        />
        <KpiCard
          title="Выполнение"
          value={`${completionRate}%`}
          subtitle={`${data.completedOrders} завершено`}
          icon={CheckCircle}
          color="#22c55e"
        />
        <KpiCard
          title="Ожидают"
          value={data.pendingOrders}
          subtitle="назначенных"
          icon={Clock}
          color="#f59e0b"
        />
        <KpiCard
          title="В работе"
          value={data.activeOrders - data.pendingOrders}
          subtitle="в процессе"
          icon={Wrench}
          color="#3b82f6"
        />
      </div>

      {/* Row 1: Donut + Monthly */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Статусы">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.ordersByStatus.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                    ))}
                    <Label
                      value={data.totalOrders}
                      position="center"
                      style={{ fontSize: "24px", fontWeight: 700, fill: "hsl(var(--foreground))" }}
                    />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {data.ordersByStatus.map((item) => {
                const pct = data.totalOrders > 0 ? Math.round((item.value / data.totalOrders) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || "#8884d8" }} />
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                    <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="По месяцам">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ordersByMonth} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} cursor={false} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" name="Всего" fill="#6366f1" radius={[4, 4, 0, 0]} label={<CustomBarLabel />} />
              <Bar dataKey="completed" name="Завершено" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Services + Quick action */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="По услугам">
            {data.ordersByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(180, data.ordersByService.length * 44)}>
                <BarChart data={data.ordersByService} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={false} />
                  <Bar dataKey="count" name="Заказов" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}>
                    {data.ordersByService.map((_, i) => (
                      <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            )}
          </ChartCard>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {role === "Client" && (
                <>
                  <Link href="/booking" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    <ClipboardList className="size-4 text-muted-foreground" />
                    Записаться на сервис
                  </Link>
                  <Link href="/orders" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    <Wrench className="size-4 text-muted-foreground" />
                    Мои заказы
                  </Link>
                  <Link href="/chat" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    Написать мастеру
                  </Link>
                </>
              )}
            {role === "Master" && (
              <>
                <Link href="/orders" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <ClipboardList className="size-4 text-muted-foreground" />
                  Все заказы
                </Link>
                <Link href="/master" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Wrench className="size-4 text-muted-foreground" />
                  Мои работы
                </Link>
                <Link href="/master/schedule" className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Clock className="size-4 text-muted-foreground" />
                  Расписание
                </Link>
              </>
            )}
          </CardContent>
        </Card>
        {role === "Client" && <OnlineMastersWidget />}
        </div>
      </div>
    </div>
  );
}
