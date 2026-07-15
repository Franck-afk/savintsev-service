"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle, XCircle, Copy, CreditCard } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  qrData: string | null;
  paidAt: string | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderTitle: string;
  price: number;
  paid: boolean;
  onPaid: () => void;
}

export function PaymentDialog({ open, onOpenChange, orderId, orderTitle, price, paid, onPaid }: PaymentDialogProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amountRub, setAmountRub] = useState(price > 0 ? (price / 100).toString() : "");

  const handleCreate = async () => {
    const amountKopecks = Math.round(parseFloat(amountRub) * 100);
    if (!amountKopecks || amountKopecks <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: amountKopecks }),
      });
      if (res.ok) setPayment(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!payment) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (res.ok) {
        setPayment((prev) => prev ? { ...prev, status: "Paid", paidAt: new Date().toISOString() } : prev);
        onPaid();
      }
    } catch { /* ignore */ }
    setConfirming(false);
  };

  const handleCancel = async () => {
    if (!payment) return;
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setPayment(null);
        onOpenChange(false);
      }
    } catch { /* ignore */ }
  };

  const handleCopy = () => {
    if (payment?.qrData) {
      navigator.clipboard.writeText(payment.qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setPayment(null);
      setAmountRub(price > 0 ? (price / 100).toString() : "");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Оплата СБП
          </DialogTitle>
          <DialogDescription>{orderTitle}</DialogDescription>
        </DialogHeader>

        {paid ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="size-12 text-green-500" />
            <p className="text-sm font-medium text-green-600">Оплачено</p>
          </div>
        ) : payment?.status === "Paid" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="size-12 text-green-500" />
            <p className="text-sm font-medium text-green-600">Оплата подтверждена</p>
          </div>
        ) : payment ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
              <QRCodeSVG
                value={payment.qrData || ""}
                size={200}
                level="M"
                includeMargin
              />
              <div className="text-center">
                <p className="text-2xl font-bold">{(payment.amount / 100).toFixed(2)} ₽</p>
                <p className="text-xs text-muted-foreground">Сумма к оплате</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Статус:</span>
                <Badge variant="outline">Ожидает оплаты</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Заказ:</span>
                <span className="truncate max-w-[180px]">{orderTitle}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                {copied ? <CheckCircle className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Скопировано" : "Ссылка"}
              </Button>
              <Button size="sm" className="flex-1" onClick={handleConfirm} disabled={confirming}>
                {confirming ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                Подтвердить
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={handleCancel}>
              <XCircle className="size-3.5" /> Отменить платёж
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Сумма, ₽</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amountRub}
                onChange={(e) => setAmountRub(e.target.value)}
                placeholder="0.00"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-2xl font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={loading || !amountRub || parseFloat(amountRub) <= 0}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {loading ? "Генерация..." : "Сформировать QR-код СБП"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
