"use client";

import Image from "next/image";
import { X, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Attachment } from "./chat.types";

interface ViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: Attachment[];
  index: number;
  onIndexChange: (index: number) => void;
}

export function ViewerDialog({ open, onOpenChange, attachments, index, onIndexChange }: ViewerDialogProps) {
  const att = attachments[index];
  if (!att) return null;
  const isImage = att.type.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[90vw] sm:max-h-[90vh] p-0 bg-black/95">
        <DialogHeader className="sr-only">
          <DialogTitle>Просмотр файла</DialogTitle>
          <DialogDescription>Просмотр вложения</DialogDescription>
        </DialogHeader>
        <div className="relative flex h-full min-h-[80vh] flex-col items-center justify-center p-4">
          <div className="flex w-full flex-col items-center gap-4">
            <div className={`w-full ${isImage ? "" : "flex-1"} flex items-center justify-center`}>
              {isImage ? (
                <Image src={att.url} alt={att.name} width={1200} height={800} className="max-h-[75vh] max-w-full rounded-lg object-contain" />
              ) : (
                <div className="flex w-full max-w-4xl flex-col items-center gap-3">
                  <iframe src={att.url} title={att.name} className="h-[65vh] w-full rounded-lg" style={{ backgroundColor: "var(--card)" }} />
                  <a href={att.url} download={att.name} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
                    <FileText className="size-4" />
                    Скачать {att.name}
                  </a>
                </div>
              )}
            </div>
          </div>

          {attachments.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button onClick={() => onIndexChange(index > 0 ? index - 1 : attachments.length - 1)} className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm text-white/70">{index + 1} / {attachments.length}</span>
              <button onClick={() => onIndexChange(index < attachments.length - 1 ? index + 1 : 0)} className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
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
