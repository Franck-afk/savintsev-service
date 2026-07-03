import { requireSession } from "@/shared/lib/auth-helpers";
import { TiresClient } from "./tires-client";

export default async function TiresPage() {
  const session = await requireSession();
  return <TiresClient role={session.user.role} />;
}
