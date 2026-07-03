"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Loader2, Check } from "lucide-react";
import type { Area, Point } from "react-easy-crop";

interface AvatarCropProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrop: (blob: Blob) => void;
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        400,
        400
      );

      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/jpeg", 0.9);
    };
    image.src = imageSrc;
  });
}

export function AvatarCropDialog({ open, onOpenChange, onCrop }: AvatarCropProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!preview || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(preview, croppedAreaPixels);
      onCrop(blob);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <Camera className="size-4" />
            Обрезка фото
          </DialogTitle>
        </DialogHeader>

        {!preview ? (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-muted-foreground/50">
            <Camera className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Выберите фото</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP до 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-lg bg-muted">
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-2">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-center text-xs text-muted-foreground">
                Перетаскивайте фото и используйте ползунок для масштаба
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>Отмена</Button>
              <Button size="sm" onClick={handleCrop} disabled={saving} className="gap-1.5">
                {saving ? <><Loader2 className="size-3.5 animate-spin" /> Сохранение...</> : <><Check className="size-3.5" /> Применить</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
