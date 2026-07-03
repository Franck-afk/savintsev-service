"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OrderPhotoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  index: number;
  onIndexChange: (index: number) => void;
}

export function OrderPhotoViewer({ open, onOpenChange, photos, index, onIndexChange }: OrderPhotoViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[90vw] sm:max-h-[90vh] p-0 bg-black/95">
        <DialogHeader className="sr-only">
          <DialogTitle>Фото заказа</DialogTitle>
          <DialogDescription>Просмотр фото</DialogDescription>
        </DialogHeader>
        <div className="relative flex h-full min-h-[70vh] items-center justify-center p-4">
          {photos[index] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[index]} alt="" className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button onClick={() => onIndexChange(index > 0 ? index - 1 : photos.length - 1)} className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm text-white/70">{index + 1} / {photos.length}</span>
              <button onClick={() => onIndexChange(index < photos.length - 1 ? index + 1 : 0)} className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
