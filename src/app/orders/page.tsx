import { requireSession } from "@/shared/lib/auth-helpers";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const session = await requireSession();
  const role = session.user.role;

  return <OrdersClient role={role} />;
}
