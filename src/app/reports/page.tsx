import { prisma } from "@/shared/api/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  Pending: "Ожидает",
  InProgress: "В работе",
  Completed: "Завершён",
  Cancelled: "Отменён",
};

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500/15 text-yellow-600",
  InProgress: "bg-blue-500/15 text-blue-600",
  Completed: "bg-green-500/15 text-green-600",
  Cancelled: "bg-red-500/15 text-red-600",
};

export default async function ReportsPage() {
  const [
    clientsCount,
    statusGroups,
    masterMsgs,
    monthlyOrders,
    ordersPerClient,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "Client" } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: { orderId: { not: null }, sender: { role: "Master" } },
      _count: { orderId: true },
    }),
    prisma.order.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({ by: ["userId"], _count: true }),
  ]);

  const masters = await prisma.user.findMany({
    where: { id: { in: masterMsgs.map((m) => m.senderId) } },
    select: { id: true, name: true, email: true },
  });
  const masterMap = Object.fromEntries(masters.map((m) => [m.id, m.name || m.email]));

  const masterData = masterMsgs
    .map((m) => ({
      name: masterMap[m.senderId] || "Неизвестно",
      count: m._count.orderId,
    }))
    .sort((a, b) => b.count - a.count);

  const monthlyMap: Record<string, { total: number; completed: number }> = {};
  for (const order of monthlyOrders) {
    const key = order.createdAt.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
    if (!monthlyMap[key]) monthlyMap[key] = { total: 0, completed: 0 };
    monthlyMap[key].total++;
    if (order.status === "Completed") monthlyMap[key].completed++;
  }
  const monthlyData = Object.entries(monthlyMap).slice(0, 6);

  const totalClientOrders = ordersPerClient.reduce((s, c) => s + c._count, 0);
  const avgOrdersPerClient = clientsCount > 0 ? (totalClientOrders / clientsCount).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Отчёты</h1>
        <p className="text-muted-foreground">Статистика и аналитика бизнеса</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Заказы по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusGroups.map((g) => (
                <div key={g.status} className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColors[g.status] || ""}`}>
                    {statusLabels[g.status] || g.status}
                  </span>
                  <span className="text-sm font-medium">{g._count}</span>
                </div>
              ))}
              {statusGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Заказы по мастерам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {masterData.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-sm">{m.name}</span>
                  <span className="text-sm font-medium">{m.count}</span>
                </div>
              ))}
              {masterData.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Заказы по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map(([month, data]) => (
                <div key={month} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">{month}</span>
                    <span className="ml-2 text-xs text-muted-foreground">(завершено: {data.completed})</span>
                  </div>
                  <span className="text-sm font-medium">{data.total}</span>
                </div>
              ))}
              {monthlyData.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активность клиентов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего клиентов</span>
              <span className="text-lg font-bold">{clientsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Заказов на клиента (среднее)</span>
              <span className="text-lg font-bold">{avgOrdersPerClient}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего заказов от клиентов</span>
              <span className="text-lg font-bold">{totalClientOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
