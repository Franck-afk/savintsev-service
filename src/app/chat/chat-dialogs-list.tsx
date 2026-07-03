"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2, Search, X, Trash2, FileText, Table, File } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatAvatar } from "./chat-avatar";
import { formatTime } from "./chat-utils";
import type { Dialog as DialogType, Interlocutor } from "./chat.types";

interface DialogsListProps {
  dialogs: DialogType[];
  activeDialog: DialogType | null;
  loadingDialogs: boolean;
  onlineUsers: Set<string>;
  onlineCount: number;
  userRole: string;
  onOpenDialog: (dialog: DialogType) => void;
  onStartDialog: (user: Interlocutor) => void;
  onDeleteDialog: (dialog: DialogType) => void;
  onConfirmMaster: () => void;
  onConfirmAll: () => void;
  mobileShowChat: boolean;
}

export function DialogsList({
  dialogs, activeDialog, loadingDialogs, onlineUsers, onlineCount,
  userRole, onOpenDialog, onStartDialog, onDeleteDialog,
  onConfirmMaster, onConfirmAll, mobileShowChat,
}: DialogsListProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Interlocutor[]>([]);
  const [searching, setSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DialogType | null>(null);

  useEffect(() => {
    if (!searchOpen) return;
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const params = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery)}` : "";
        const res = await fetch(`/api/users/search${params}`);
        if (res.ok && !cancelled) setSearchResults(await res.json());
      } catch { /* ignore */ }
      if (!cancelled) setSearching(false);
    })();
    return () => { cancelled = true; };
  }, [searchOpen, searchQuery]);

  const handleStartDialog = (user: Interlocutor) => {
    onStartDialog(user);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className={`flex w-full lg:w-96 shrink-0 flex-col border-r border-border ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Диалоги</h2>
            <span className="text-[10px] text-green-500/60">{onlineCount}</span>
          </div>
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80">
                + Новый диалог
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый диалог</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск пользователей..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button key={user.id} onClick={() => handleStartDialog(user)} className="flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                      <ChatAvatar src={user.avatarUrl} name={user.name} className="size-9" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{user.name || "Пользователь"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <span className={`text-xs ${onlineUsers.has(user.id) ? "text-green-500" : "text-muted-foreground"}`}>
                          {onlineUsers.has(user.id) ? "Онлайн" : "не в сети"}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Ничего не найдено</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Owner toolbar */}
      {userRole === "Owner" && (
        <div className="space-y-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Очистка</span>
            <div className="ml-2 flex gap-1.5">
              <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive/70 transition-colors hover:text-destructive hover:bg-destructive/10" onClick={onConfirmMaster}>
                <Trash2 className="size-3.5" /> диалоги мастеров
              </button>
              <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive/70 transition-colors hover:text-destructive hover:bg-destructive/10" onClick={onConfirmAll}>
                <Trash2 className="size-3.5" /> все диалоги
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Экспорт</span>
            <div className="ml-2 flex gap-1.5">
              <a href="/api/chat/export?format=txt" download className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary/70 transition-colors hover:text-primary hover:bg-primary/10">
                <FileText className="size-3.5" /> TXT
              </a>
              <a href="/api/chat/export?format=xlsx" download className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary/70 transition-colors hover:text-primary hover:bg-primary/10">
                <Table className="size-3.5" /> Excel
              </a>
              <a href="/api/chat/export?format=pdf" download className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary/70 transition-colors hover:text-primary hover:bg-primary/10">
                <File className="size-3.5" /> PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Dialog list */}
      <div className="flex-1 overflow-y-auto">
        {loadingDialogs ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : dialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <MessageSquare className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Нет диалогов</p>
          </div>
        ) : (
          dialogs.map((dialog) => {
            const isActive = activeDialog?.interlocutor.id === dialog.interlocutor.id && activeDialog?.order?.id === dialog.order?.id;
            return (
              <div key={dialog.interlocutor.id + (dialog.order?.id || "")} className="group relative flex items-center border-b border-border transition-colors hover:bg-muted/50">
                <button onClick={() => onOpenDialog(dialog)} className={`flex flex-1 items-center gap-3 p-4 text-left ${isActive ? "bg-muted" : ""}`}>
                  <ChatAvatar src={dialog.interlocutor.avatarUrl} name={dialog.interlocutor.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-medium">{dialog.interlocutor.name || "Пользователь"}</p>
                        <span className={`shrink-0 text-xs ${onlineUsers.has(dialog.interlocutor.id) ? "text-green-500" : "text-muted-foreground"}`}>
                          {onlineUsers.has(dialog.interlocutor.id) ? "Онлайн" : "не в сети"}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">{formatTime(dialog.lastTime)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{dialog.lastMessage}</p>
                    {dialog.order && <p className="mt-0.5 truncate text-xs text-secondary-foreground/70">Заказ: {dialog.order.title}</p>}
                  </div>
                  {dialog.unread > 0 && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">{dialog.unread}</div>
                  )}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(dialog); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Удалить диалог">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}
        title={`Удалить диалог с ${confirmDelete?.interlocutor.name || "пользователем"}?`}
        message="Все сообщения в этом диалоге будут безвозвратно удалены."
        onConfirm={() => { if (confirmDelete) { onDeleteDialog(confirmDelete); setConfirmDelete(null); } }}
      />
    </div>
  );
}
