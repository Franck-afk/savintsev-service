"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthInput } from "@/features/auth/ui/auth-input";
import { AvatarCropDialog } from "@/features/account/avatar-crop";
import { Settings, Mail, Pencil, Camera, Loader2, Check } from "lucide-react";

interface EditDialogProps {
  name: string
  phone: string | null
  avatarUrl: string | null
}

export function AccountEditDialog({ name: initialName, phone: initialPhone, avatarUrl }: EditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => { setSaved(false); setOpen(false); router.refresh(); }, 800);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCrop = useCallback(async (blob: Blob) => {
    setUploading(true);
    setCropOpen(false);
    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setUploading(false);
    }
  }, [router]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Редактировать
          </Button>
        </DialogTrigger>
        <DialogContent className="p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Settings className="size-4" />
              Редактировать профиль
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-border">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" />
                  ) : (
                    <Camera className="size-5 text-muted-foreground" />
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Фото профиля</p>
                <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP до 5MB</p>
              </div>
              <Button variant="outline" size="xs" onClick={() => setCropOpen(true)} disabled={uploading}>
                {uploading ? "Загрузка..." : "Загрузить"}
              </Button>
            </div>

            <AuthInput
              id="edit-name"
              label="Имя"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
            />
            <AuthInput
              id="edit-phone"
              label="Телефон"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 999-99-99"
            />
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                Email нельзя изменить
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || saved} className="gap-1.5 min-w-[100px]">
                {saved ? <><Check className="size-3.5" /> Сохранено</> : saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AvatarCropDialog open={cropOpen} onOpenChange={setCropOpen} onCrop={handleCrop} />
    </>
  );
}
