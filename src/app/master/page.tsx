import { requireRole } from "@/shared/lib/auth-helpers";
import { MasterClient } from "./master-client";

export default async function MasterPage() {
  const session = await requireRole(["Master", "Owner"]);
  return <MasterClient userId={session.user.id} role={session.user.role} />;
}
