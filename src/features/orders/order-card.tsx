import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Clock, User, Car, Ruler, Calendar, Trash2, Loader2, Camera, X, CreditCard, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { RepairProgress } from "./repair-progress";
import { MasterActions } from "./master-actions";
import { EditOrderDialog } from "./edit-order-dialog";
import { OrderPhotoViewer } from "./order-photo-viewer";
import { PaymentDialog } from "./payment-dialog";
import { isLastStage } from "@/shared/constants/service-stages";
import { getSocket } from "@/shared/api/socket-client";
import { useSession } from "next-auth/react";
export interface Order {
  id: string;
  title: string;
  description?: string | null;
  status: "Pending" | "InProgress" | "Completed" | "Cancelled";
  serviceType?: string | null;
  carInfo?: string | null;
  tireSize?: string | null;
  phone?: string | null;
  visitDate?: string | null;
  photos?: string[];
  currentStage?: number;
  masterId?: string | null;
  userId?: string;
  price?: number | null;
  paidAt?: string | null;
  createdAt: Date;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  master?: {
    name?: string | null;
    email?: string | null;
  };
}

const serviceLabels: Record<string, string> = {
  mounting: "Шиномонтаж",
  storage: "Хранение шин",
  repair: "Ремонт дисков",
  balancing: "Балансировка",
  puncture: "Ремонт прокола",
  seasonal: "Сезонная замена",
  other: "Другое",
};

const statusConfig: Record<
  Order["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  Pending: { label: "Ожидает", variant: "secondary" },
  InProgress: { label: "В работе", variant: "default" },
  Completed: { label: "Завершён", variant: "outline" },
  Cancelled: { label: "Отменён", variant: "destructive" },
};

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  role?: string;
  onUpdated?: () => void;
}

export function OrderCard({ order, onClick, onDelete, role, onUpdated }: OrderCardProps) {
  const { data: session } = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(order.photos || []);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const status = statusConfig[order.status];
  const isMaster = role === "Master" || role === "Owner";
  const isClient = role === "Client";
  const nextStage = (order.currentStage ?? 0) + 1;
  const orderIsLastStage = order.status !== "Completed" && order.status !== "Cancelled" && isLastStage(order.serviceType, nextStage);

  useEffect(() => {
    if (!session?.user?.id || !isClient) return;
    const socket = getSocket(session.user.id);
    const handler = (data: { orderId: string; amount: number; qrData: string | null; id: string }) => {
      if (data.orderId === order.id) {
        setPaymentOpen(true);
      }
    };
    socket.on("payment-created", handler);
    return () => { socket.off("payment-created", handler); };
  }, [session?.user?.id, isClient, order.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/orders/${order.id}/photos`, { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setPhotos((prev) => [...prev, url]);
        onUpdated?.();
      }
    } catch { /* ignore */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePhotoDelete = async (url: string) => {
    const res = await fetch(`/api/orders/${order.id}/photos?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    if (res.ok) setPhotos((prev) => prev.filter((p) => p !== url));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        if (session?.user?.id && order.userId) {
          const socket = getSocket(session.user.id);
          socket.emit("order-deleted", { orderId: order.id, ownerId: order.userId });
        }
        onDelete?.(order.id);
      }
    } catch { /* ignore */ }
    setDeleting(false);
  };

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Удалить заказ"
        message="Вы уверены, что хотите удалить этот заказ?"
        onConfirm={handleDelete}
      />
      <Card
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">{order.title}</CardTitle>
            {order.serviceType && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {serviceLabels[order.serviceType] || order.serviceType}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isClient && order.status === "Pending" && (
              <EditOrderDialog order={order} onUpdated={onUpdated ?? (() => {})} />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              </Button>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
      <CardContent className="space-y-3">
        {order.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {order.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {order.carInfo && (
            <span className="flex items-center gap-1">
              <Car className="size-3" />
              {order.carInfo}
            </span>
          )}
          {order.tireSize && (
            <span className="flex items-center gap-1">
              <Ruler className="size-3" />
              {order.tireSize}
            </span>
          )}
          {order.visitDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(order.visitDate).toLocaleDateString("ru-RU")}
              <Clock className="size-3" />
              {new Date(order.visitDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {order.phone && (role === "Owner" || role === "Master") && (
            <span className="flex items-center gap-1">
              <span className="text-xs">📞</span>
              {order.phone}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(order.createdAt).toLocaleDateString("ru-RU")}
          </span>
          {order.user && (
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {order.user.name || order.user.email}
            </span>
          )}
          {order.master && (role === "Owner") && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <span className="text-muted-foreground">Мастер:</span>{" "}
              {order.master.name || order.master.email}
            </span>
          )}
        </div>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {photos.map((url, i) => (
              <div key={url} className="group relative">
                <button onClick={() => { setViewerIndex(i); setViewerOpen(true); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-16 rounded-lg object-cover border border-border" />
                </button>
                {(isMaster || isClient) && (
                  <button
                    onClick={() => handlePhotoDelete(url)}
                    className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {isMaster && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={uploading}
              className="gap-1 text-xs"
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
              {uploading ? "Загрузка..." : "Фото"}
            </Button>
          </div>
        )}
        {order.status !== "Cancelled" && (
          <div className="border-t pt-3">
            <RepairProgress serviceType={order.serviceType} currentStage={order.currentStage ?? 0} />
          </div>
        )}
        {isMaster && order.status === "Completed" && (
          <div className="border-t pt-3">
            <Button
              variant={order.paidAt ? "ghost" : "outline"}
              size="sm"
              className={`w-full gap-1.5 ${order.paidAt ? "text-green-600" : ""}`}
              onClick={(e) => { e.stopPropagation(); setPaymentOpen(true); }}
            >
              {order.paidAt ? (
                <><CheckCircle className="size-3.5" /> Оплачено</>
              ) : (
                <><CreditCard className="size-3.5" /> Оплата СБП</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
      {isMaster && order.status !== "Completed" && order.status !== "Cancelled" && (
        <CardFooter className="border-t px-6 py-3">
          <MasterActions
            orderId={order.id}
            ownerId={order.userId ?? ""}
            status={order.status}
            isLastStage={orderIsLastStage}
            onUpdated={onUpdated ?? (() => {})}
          />
        </CardFooter>
      )}
    </Card>

    <OrderPhotoViewer open={viewerOpen} onOpenChange={setViewerOpen} photos={photos} index={viewerIndex} onIndexChange={setViewerIndex} />
    <PaymentDialog
      open={paymentOpen}
      onOpenChange={setPaymentOpen}
      orderId={order.id}
      orderTitle={order.title}
      price={order.price ?? 0}
      paid={!!order.paidAt}
      onPaid={onUpdated ?? (() => {})}
    />
    </>
  );
}
