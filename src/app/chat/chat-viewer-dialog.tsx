"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, FileText, Download } from "lucide-react";
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
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!att || !open) { setTextContent(null); return; }
    if (att.type === "text/plain" || att.name?.endsWith(".txt")) {
      setLoadingText(true);
      fetch(att.url).then(r => r.text()).then(setTextContent).catch(() => setTextContent(null)).finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [att, open]);

  if (!att) return null;
  const isImage = att.type.startsWith("image/");
  const isText = att.type === "text/plain" || att.name?.endsWith(".txt");

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
              ) : isText ? (
                <div className="w-full max-w-4xl">
                  {loadingText ? (
                    <div className="flex items-center justify-center h-[65vh] text-white/50">Загрузка...</div>
                  ) : textContent !== null ? (
                    <pre className="h-[65vh] w-full overflow-auto rounded-lg bg-white/5 p-4 text-sm text-white/90 whitespace-pre-wrap font-mono">
                      {textContent}
                    </pre>
                  ) : (
                    <iframe src={att.url} title={att.name} className="h-[65vh] w-full rounded-lg bg-white" />
                  )}
                </div>
              ) : (
                <div className="flex w-full max-w-4xl flex-col items-center gap-3">
                  <iframe src={att.url} title={att.name} className="h-[65vh] w-full rounded-lg" style={{ backgroundColor: "var(--card)" }} />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const a = document.createElement("a");
              a.href = att.url;
              a.download = att.name;
              a.click();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <Download className="size-4" />
            Скачать {att.name}
          </button>

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
