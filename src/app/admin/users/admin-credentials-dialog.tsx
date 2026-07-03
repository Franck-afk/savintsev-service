"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
}

export function CredentialsDialog({ open, onOpenChange, email, password }: CredentialsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Аккаунт создан</DialogTitle>
          <DialogDescription>Передайте эти данные сотруднику для входа</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <code className="text-sm font-medium">{email}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Пароль:</span>
              <code className="text-sm font-medium">{password}</code>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => {
            navigator.clipboard.writeText(`Email: ${email}\nПароль: ${password}\n\nВход: ${window.location.origin}/auth/login`);
          }}>
            Копировать данные для входа
          </Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
