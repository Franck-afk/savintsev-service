import { requireRole } from "@/shared/lib/auth-helpers";
import { NewTireClient } from "./new-tire-client";

export default async function NewTirePage() {
  await requireRole(["Owner", "Master"]);
  return <NewTireClient />;
}
