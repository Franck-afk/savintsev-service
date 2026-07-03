import { requireRole } from "@/shared/lib/auth-helpers";
import { UsersList } from "./users-list";

export const metadata = {
  title: "Пользователи — Шинный Мастер",
};

export default async function UsersPage() {
  await requireRole(["Owner", "Master"]);
  return <UsersList />;
}
