import { requireSession } from "@/shared/lib/auth-helpers";
import { prisma } from "@/shared/api/prisma";
import { Badge } from "@/components/ui/badge";
import { AccountEditDialog } from "./edit-dialog";
import { AccountTabs } from "./account-tabs";
import { Shield, Mail, Phone, Calendar } from "lucide-react";
import Image from "next/image";

const roleLabels: Record<string, string> = {
  Owner: "Владелец",
  Master: "Мастер",
  Client: "Клиент",
};

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  Owner: "default",
  Master: "secondary",
  Client: "outline",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

const avatarGradients: Record<string, string> = {
  Owner: "from-amber-500 to-amber-600",
  Master: "from-sky-500 to-sky-600",
  Client: "from-primary to-primary/80",
};

async function getStats(role: string, userId: string) {
  if (role === "Client") {
    const [total, completed, inProgress] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: "Completed" } }),
      prisma.order.count({ where: { userId, status: "InProgress" } }),
    ]);
    return { total, completed, inProgress };
  }

  if (role === "Master") {
    const [total, completed, inProgress] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "Completed" } }),
      prisma.order.count({ where: { status: "InProgress" } }),
    ]);
    return { total, completed, inProgress };
  }

  if (role === "Owner") {
    const [total, completed, masters, clients] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "Completed" } }),
      prisma.user.count({ where: { role: "Master" } }),
      prisma.user.count({ where: { role: "Client" } }),
    ]);
    return { total, completed, masters, clients };
  }

  return {};
}

export default async function AccountPage() {
  const session = await requireSession();
  const { role, id } = session.user!;
  const dbUser = await prisma.user.findUnique({ where: { id } });
  if (!dbUser) throw new Error("User not found");

  const stats = await getStats(role, id);
  const name = dbUser.name || "Пользователь";
  const email = dbUser.email;
  const phone = dbUser.phone;
  const createdAt = dbUser.createdAt.toISOString();
  const avatarUrl = dbUser.avatarUrl;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-xl bg-gradient-to-b from-card to-background border p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-5">
          <div className="relative size-16 shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover rounded-full shadow-sm ring-2 ring-primary/10" />
            ) : (
              <div className={`flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white shadow-sm ring-2 ring-primary/10 ${avatarGradients[role] || "from-primary to-primary/80"}`}>
                {getInitials(name)}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2.5 md:items-start md:gap-2">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                {name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground md:justify-start">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            <Badge variant={roleColors[role] || "outline"} className="gap-1 px-2.5 py-0.5 text-xs">
              <Shield className="size-3" />
              {roleLabels[role] || role}
            </Badge>

            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-center">
                <p className="text-sm font-bold">{("total" in stats ? stats.total : 0) as number}</p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {role === "Owner" ? "Заказов" : "Всего заявок"}
                </p>
              </div>
              <div className="h-6 w-px bg-border" />
              {("completed" in stats ? stats.completed : 0) as number >= 0 && (
                <div className="text-center">
                  <p className="text-sm font-bold text-green-500">{("completed" in stats ? stats.completed : 0) as number}</p>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {role === "Owner" ? "Завершено" : "Выполнено"}
                  </p>
                </div>
              )}
              {role !== "Owner" && "inProgress" in stats && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-amber-500">{stats.inProgress as number}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">В работе</p>
                  </div>
                </>
              )}
              {role === "Owner" && "masters" in stats && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-sky-500">{stats.masters as number}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">Мастеров</p>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple-500">{stats.clients as number}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">Клиентов</p>
                  </div>
                </>
              )}
            </div>

            <AccountEditDialog name={name} phone={phone} avatarUrl={avatarUrl} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="size-3" />
          Зарегистрирован: {new Date(createdAt).toLocaleDateString("ru-RU", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </div>
      </div>

      {role !== "Owner" && (
        <AccountTabs
          name={name}
          email={email}
          phone={phone}
          createdAt={createdAt}
        />
      )}
    </div>
  );
}
