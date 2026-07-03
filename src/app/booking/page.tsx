import { Suspense } from "react";
import { requireRole } from "@/shared/lib/auth-helpers";
import { BookingClient } from "./booking-client";
import { Loader2 } from "lucide-react";

export default async function BookingPage() {
  await requireRole(["Client"]);
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <BookingClient />
    </Suspense>
  );
}
