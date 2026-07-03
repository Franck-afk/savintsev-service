"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label,
} from "recharts";
import { Users, Package, Wrench, ClipboardList } from "lucide-react";

interface DashboardData {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  mastersCount: number;
  clientsCount: number;
  totalRevenue: number;
  ordersByStatus: { name: string; value: number; color: string }[];
  ordersByMonth: { month: string; total: number; completed: number; cancelled: number }[];
  ordersByService: { name: string; count: number; revenue: number }[];
  topMasters: { name: string; orders: number; completed: number }[];
  tiresStored: number;
  tiresIssued: number;
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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

export function OwnerDashboard({ data }: { data: DashboardData }) {
  const completionRate = data.totalOrders > 0
    ? Math.round((data.completedOrders / data.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Всего заказов"
          value={data.totalOrders}
          subtitle={`${data.activeOrders} активных`}
          icon={ClipboardList}
          color="#6366f1"
        />
        <KpiCard
          title="Выполнение"
          value={`${completionRate}%`}
          subtitle={`${data.completedOrders} завершено`}
          icon={Wrench}
          color="#22c55e"
        />
        <KpiCard
          title="Мастера"
          value={data.mastersCount}
          subtitle={`${data.topMasters.length} с заказами`}
          icon={Users}
          color="#06b6d4"
        />
        <KpiCard
          title="Клиенты"
          value={data.clientsCount}
          subtitle={`${data.tiresStored} шин на хранении`}
          icon={Package}
          color="#8b5cf6"
        />
      </div>

      {/* Row 1: Donut + Monthly */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Статусы заказов">
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

        <ChartCard title="Заказы по месяцам">
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

      {/* Row 2: Services + Masters */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Horizontal bar: services */}
        <ChartCard title="Услуги">
          {data.ordersByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, data.ordersByService.length * 44)}>
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
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Нет данных
            </div>
          )}
        </ChartCard>

        {/* Masters with progress bars */}
        <ChartCard title="Загрузка мастеров">
          {data.topMasters.length > 0 ? (
            <div className="space-y-4">
              {data.topMasters.map((master) => {
                const rate = master.orders > 0 ? Math.round((master.completed / master.orders) * 100) : 0;
                const barColor = rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={master.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{master.name}</span>
                      <span className="text-muted-foreground">
                        {master.completed}/{master.orders} <span className="text-xs">({rate}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${rate}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Нет данных
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
