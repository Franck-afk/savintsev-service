"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ArrowRight, XCircle, CreditCard } from "lucide-react";
import { getSocket } from "@/shared/api/socket-client";
import { useSession } from "next-auth/react";

interface MasterActionsProps {
  orderId: string;
  ownerId: string;
  status: string;
  isLastStage: boolean;
  onUpdated: () => void;
}

export function MasterActions({ orderId, ownerId, status, isLastStage, onUpdated }: MasterActionsProps) {
  const { data: session } = useSession();
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceRub, setPriceRub] = useState("");

  if (status === "Completed" || status === "Cancelled") return null;

  const emitStageUpdate = (newStage: number, newStatus: string) => {
    if (!session?.user?.id) return;
    const socket = getSocket(session.user.id);
    socket.emit("order-stage-updated", {
      orderId,
      ownerId,
      currentStage: newStage,
      status: newStatus,
    });
  };

  const emitPaymentCreated = (payment: { id: string; amount: number; qrData: string | null; orderId: string }) => {
    if (!session?.user?.id) return;
    const socket = getSocket(session.user.id);
    socket.emit("payment-created", {
      ...payment,
      ownerId,
    });
  };

  const doAdvance = async (priceKopecks?: number) => {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance", price: priceKopecks }),
      });
      if (res.ok) {
        const data = await res.json();
        emitStageUpdate(data.currentStage, data.status);
        if (data.payment) {
          emitPaymentCreated(data.payment);
        }
        onUpdated();
      }
    } catch { /* ignore */ }
    setAdvancing(false);
  };

  const handleAdvance = () => {
    if (isLastStage) {
      setPriceRub("");
      setPriceOpen(true);
    } else {
      doAdvance();
    }
  };

  const handlePriceConfirm = async () => {
    const amount = Math.round(parseFloat(priceRub) * 100);
    if (!amount || amount <= 0) return;
    await doAdvance(amount);
    setPriceOpen(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        onUpdated();
      }
    } catch { /* ignore */ }
    setCancelling(false);
  };

  return (
    <>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Отменить заказ"
        message="Вы уверены, что хотите отменить этот заказ? Клиент получит уведомление."
        onConfirm={handleCancel}
      />
      <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Стоимость работ
            </DialogTitle>
            <DialogDescription>Укажите сумму для оплаты клиентом</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Сумма, ₽</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={priceRub}
                onChange={(e) => setPriceRub(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-2xl font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === "Enter") handlePriceConfirm(); }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPriceOpen(false)}>
                Отмена
              </Button>
              <Button size="sm" className="flex-1" onClick={handlePriceConfirm} disabled={advancing || !priceRub || parseFloat(priceRub) <= 0}>
                {advancing ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
                Завершить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleAdvance}
          disabled={advancing}
          className="gap-1.5"
        >
          {advancing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ArrowRight className="size-3.5" />
          )}
          {isLastStage ? "Завершить" : "Далее"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCancelOpen(true)}
          disabled={cancelling}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          {cancelling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <XCircle className="size-3.5" />
          )}
          Отменить
        </Button>
      </div>
    </>
  );
}
