import { requireSession } from "@/shared/lib/auth-helpers";
import { prisma } from "@/shared/api/prisma";
import { OwnerDashboard } from "./owner-dashboard";
import { RoleDashboard } from "./role-dashboard";

const serviceLabels: Record<string, string> = {
  mounting: "Шиномонтаж",
  storage: "Хранение шин",
  repair: "Ремонт дисков",
  balancing: "Балансировка",
  puncture: "Ремонт прокола",
  seasonal: "Сезонная замена",
  other: "Другое",
};

async function getOwnerData() {
  const [
    totalOrders, activeOrders, completedOrders, cancelledOrders, pendingOrders,
    mastersCount, clientsCount, tiresStored, tiresIssued,
    ordersByStatusRaw, monthlyOrders, ordersByServiceRaw, allMasters,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["Pending", "InProgress"] } } }),
    prisma.order.count({ where: { status: "Completed" } }),
    prisma.order.count({ where: { status: "Cancelled" } }),
    prisma.order.count({ where: { status: "Pending" } }),
    prisma.user.count({ where: { role: "Master" } }),
    prisma.user.count({ where: { role: "Client" } }),
    prisma.tire.count({ where: { status: "Stored" } }),
    prisma.tire.count({ where: { status: "Issued" } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.findMany({ select: { createdAt: true, status: true, serviceType: true }, orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({ by: ["serviceType"], _count: true, where: { serviceType: { not: null } } }),
    prisma.user.findMany({ where: { role: "Master" }, select: { id: true, name: true, email: true } }),
  ]);

  const statusLabels: Record<string, string> = { Pending: "Ожидает", InProgress: "В работе", Completed: "Завершено", Cancelled: "Отменено" };
  const ordersByStatus = ordersByStatusRaw.map((g) => ({ name: statusLabels[g.status] || g.status, value: g._count, color: "" }));

  const monthlyMap: Record<string, { total: number; completed: number; cancelled: number }> = {};
  for (const order of monthlyOrders) {
    const key = order.createdAt.toLocaleDateString("ru-RU", { year: "numeric", month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { total: 0, completed: 0, cancelled: 0 };
    monthlyMap[key].total++;
    if (order.status === "Completed") monthlyMap[key].completed++;
    if (order.status === "Cancelled") monthlyMap[key].cancelled++;
  }
  const ordersByMonth = Object.entries(monthlyMap).slice(0, 6).map(([month, d]) => ({ month, ...d }));

  const ordersByService = ordersByServiceRaw.map((g) => ({
    name: serviceLabels[g.serviceType || "other"] || g.serviceType || "Другое", count: g._count, revenue: 0,
  }));

  const masterStats = await Promise.all(
    allMasters.map(async (master) => {
      const [orders, completed] = await Promise.all([
        prisma.order.count({ where: { masterId: master.id } }),
        prisma.order.count({ where: { masterId: master.id, status: "Completed" } }),
      ]);
      return { name: master.name || master.email || "Мастер", orders, completed };
    })
  );
  const topMasters = masterStats.sort((a, b) => b.orders - a.orders).slice(0, 8);

  return { totalOrders, activeOrders, completedOrders, cancelledOrders, pendingOrders, mastersCount, clientsCount, totalRevenue: 0, ordersByStatus, ordersByMonth, ordersByService, topMasters, tiresStored, tiresIssued };
}

async function getRoleData(userId: string, role: string) {
  const whereClause = role === "Master" ? { masterId: userId } : { userId };

  const [totalOrders, activeOrders, completedOrders, cancelledOrders, pendingOrders, ordersByStatusRaw, monthlyOrders, ordersByServiceRaw] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.count({ where: { ...whereClause, status: { in: ["Pending", "InProgress"] } } }),
    prisma.order.count({ where: { ...whereClause, status: "Completed" } }),
    prisma.order.count({ where: { ...whereClause, status: "Cancelled" } }),
    prisma.order.count({ where: { ...whereClause, status: "Pending" } }),
    prisma.order.groupBy({ by: ["status"], _count: true, where: whereClause }),
    prisma.order.findMany({ where: whereClause, select: { createdAt: true, status: true, serviceType: true }, orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({ by: ["serviceType"], _count: true, where: { ...whereClause, serviceType: { not: null } } }),
  ]);

  const statusLabels: Record<string, string> = { Pending: "Ожидает", InProgress: "В работе", Completed: "Завершено", Cancelled: "Отменено" };
  const ordersByStatus = ordersByStatusRaw.map((g) => ({ name: statusLabels[g.status] || g.status, value: g._count, color: "" }));

  const monthlyMap: Record<string, { total: number; completed: number; cancelled: number }> = {};
  for (const order of monthlyOrders) {
    const key = order.createdAt.toLocaleDateString("ru-RU", { year: "numeric", month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { total: 0, completed: 0, cancelled: 0 };
    monthlyMap[key].total++;
    if (order.status === "Completed") monthlyMap[key].completed++;
    if (order.status === "Cancelled") monthlyMap[key].cancelled++;
  }
  const ordersByMonth = Object.entries(monthlyMap).slice(0, 6).map(([month, d]) => ({ month, ...d }));

  const ordersByService = ordersByServiceRaw.map((g) => ({
    name: serviceLabels[g.serviceType || "other"] || g.serviceType || "Другое", count: g._count, revenue: 0,
  }));

  return { totalOrders, activeOrders, completedOrders, cancelledOrders, pendingOrders, ordersByStatus, ordersByMonth, ordersByService };
}

export default async function DashboardPage() {
  const session = await requireSession();
  const role = session.user?.role || "Client";
  const userId = session.user?.id || "";

  if (role === "Owner") {
    const data = await getOwnerData();
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Дашборд</h1>
          <p className="text-muted-foreground">Добро пожаловать, {session.user?.name || "Пользователь"}</p>
        </div>
        <OwnerDashboard data={data} />
      </div>
    );
  }

  const data = await getRoleData(userId, role);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">Добро пожаловать, {session.user?.name || "Пользователь"}</p>
      </div>
      <RoleDashboard data={data} role={role} />
    </div>
  );
}
