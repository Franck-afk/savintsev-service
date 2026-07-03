import { requireRole } from "@/shared/lib/auth-helpers";
import { ScheduleClient } from "./schedule-client";

export default async function MasterSchedulePage() {
  const session = await requireRole(["Master", "Owner"]);
  return <ScheduleClient userId={session.user.id} role={session.user.role} />;
}
