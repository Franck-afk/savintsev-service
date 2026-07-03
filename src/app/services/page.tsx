import { requireSession } from "@/shared/lib/auth-helpers";
import { ServicesList } from "./services-list";

export const metadata = {
  title: "Наши услуги — Шинный Мастер",
};

export default async function ServicesPage() {
  const session = await requireSession();
  const role = session.user?.role || "Client";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Наши услуги</h1>
        <p className="text-muted-foreground">
          Полный спектр услуг для шин и дисков вашего автомобиля
        </p>
      </div>

      <ServicesList role={role} />
    </div>
  );
}
