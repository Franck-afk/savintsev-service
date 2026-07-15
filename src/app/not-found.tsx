import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-xl font-semibold">Страница не найдена</h2>
      <p className="text-sm text-muted-foreground">
        запрашиваемая страница не существует
      </p>
      <Link href="/dashboard">
        <Button variant="outline">На главную</Button>
      </Link>
    </div>
  );
}
