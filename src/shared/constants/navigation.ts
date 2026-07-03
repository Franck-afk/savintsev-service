import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
  Wrench,
  User,
  CalendarDays,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const navigation: Record<string, NavItem[]> = {
  Client: [
    { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { name: "Услуги", href: "/services", icon: Wrench },
    { name: "Запись", href: "/booking", icon: CalendarDays },
    { name: "Мои заказы", href: "/orders", icon: ClipboardList },
    { name: "Мои шины", href: "/tires", icon: PackageSearch },
    { name: "Чат", href: "/chat", icon: MessageSquare },
    { name: "Аккаунт", href: "/account", icon: User },
  ],
  Master: [
    { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { name: "Услуги", href: "/services", icon: Wrench },
    { name: "Расписание", href: "/master/schedule", icon: CalendarDays },
    { name: "Заказы", href: "/orders", icon: ClipboardList },
    { name: "Склад шин", href: "/tires", icon: PackageSearch },
    { name: "Чат", href: "/chat", icon: MessageSquare },
    { name: "Мои работы", href: "/master", icon: Wrench },
    { name: "Аккаунт", href: "/account", icon: User },
  ],
  Owner: [
    { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { name: "Услуги", href: "/services", icon: Wrench },
    { name: "Расписание", href: "/master/schedule", icon: CalendarDays },
    { name: "Заказы", href: "/orders", icon: ClipboardList },
    { name: "Чат", href: "/chat", icon: MessageSquare },
    { name: "Склад шин", href: "/tires", icon: PackageSearch },
    { name: "Сотрудники", href: "/admin/users", icon: Users },
    { name: "Отчёты", href: "/reports", icon: BarChart3 },
    { name: "Аккаунт", href: "/account", icon: User },
    { name: "Настройки", href: "/settings", icon: Settings },
  ],
};
