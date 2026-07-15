"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { getSocket } from "@/shared/api/socket-client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Socket } from "socket.io-client";
import { DialogsList } from "./chat-dialogs-list";
import { MessagePanel } from "./chat-message-panel";
import { ViewerDialog } from "./chat-viewer-dialog";
import type { Dialog, Message, Interlocutor, Attachment } from "./chat.types";

export function ChatClient({ userId, userRole }: { userId: string; userRole: string }) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeDialog, setActiveDialog] = useState<Dialog | null>(null);
  const [loadingDialogs, setLoadingDialogs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [onlineCount, setOnlineCount] = useState(0);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerAttachments, setViewerAttachments] = useState<Attachment[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [confirmMaster, setConfirmMaster] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const activeDialogRef = useRef<Dialog | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchDialogs = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/dialogs", { cache: "no-store" });
      if (res.ok) setDialogs(await res.json());
    } catch { /* ignore */ }
    setLoadingDialogs(false);
  }, []);

  const fetchMessages = useCallback(async (interlocutorId: string, orderId?: string) => {
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams({ userId: interlocutorId });
      if (orderId) params.set("orderId", orderId);
      const res = await fetch(`/api/chat/messages?${params}`);
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
    setLoadingMessages(false);
  }, []);

  useEffect(() => { fetchDialogs(); }, [fetchDialogs]);
  useEffect(() => { activeDialogRef.current = activeDialog; }, [activeDialog]);

  useEffect(() => {
    socketRef.current = getSocket(userId);
    const msgHandler = async (msg: Message) => {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      if (activeDialogRef.current?.interlocutor.id === msg.senderId) {
        fetch("/api/chat/messages/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId: msg.senderId }) }).catch(() => {});
      }
      fetchDialogs();
    };
    const dialogRemovedHandler = (interlocutorId: string) => {
      setDialogs((prev) => prev.filter((d) => d.interlocutor.id !== interlocutorId));
      if (activeDialogRef.current?.interlocutor.id === interlocutorId) setActiveDialog(null);
    };
    socketRef.current.on("new-message", msgHandler);
    socketRef.current.on("dialog-removed", dialogRemovedHandler);
    socketRef.current.on("dialogs-refresh", fetchDialogs);
    return () => {
      socketRef.current?.off("new-message", msgHandler);
      socketRef.current?.off("dialog-removed", dialogRemovedHandler);
      socketRef.current?.off("dialogs-refresh", fetchDialogs);
    };
  }, [userId, fetchDialogs]);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        await fetch("/api/chat/ping", { method: "POST" }).catch(() => {});
        const res = await fetch("/api/chat/online");
        if (res.ok) { const ids: string[] = await res.json(); setOnlineCount(ids.length); setOnlineUsers(new Set(ids)); }
      } catch { /* ignore */ }
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 8000);
    return () => clearInterval(interval);
  }, []);

  const startDialog = (user: Interlocutor) => {
    const exists = dialogs.find((d) => d.interlocutor.id === user.id && !d.order);
    if (exists) { setActiveDialog(exists); fetchMessages(exists.interlocutor.id); return; }
    const newDialog: Dialog = { interlocutor: user, lastMessage: "", lastTime: new Date().toISOString(), unread: 0 };
    setDialogs((prev) => [newDialog, ...prev]);
    setActiveDialog(newDialog);
    fetchMessages(user.id);
  };

  const openDialog = (dialog: Dialog) => {
    setMobileShowChat(true);
    setActiveDialog(dialog);
    setDialogs((prev) => prev.map((d) => d.interlocutor.id === dialog.interlocutor.id && d.order?.id === dialog.order?.id ? { ...d, unread: 0 } : d));
    fetchMessages(dialog.interlocutor.id, dialog.order?.id);
    fetch("/api/chat/messages/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId: dialog.interlocutor.id }) }).catch(() => {});
  };

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!activeDialog) return;
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeDialog.interlocutor.id, content: text, orderId: activeDialog.order?.id, attachments }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);
        fetchDialogs();
        socketRef.current?.emit("send-message", msg);
      }
    } catch { /* ignore */ }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try { const res = await fetch(`/api/chat/messages/${msgId}`, { method: "DELETE" }); if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== msgId)); } catch { /* ignore */ }
  };

  const handleDeleteDialog = async (dialog: Dialog) => {
    const id = dialog.interlocutor.id;
    if (activeDialog?.interlocutor.id === id) setActiveDialog(null);
    setDialogs((prev) => prev.filter((d) => d.interlocutor.id !== id));
    try { await fetch(`/api/chat/dialogs/${id}`, { method: "DELETE" }); socketRef.current?.emit("dialog-deleted", { deletedBy: userId, notifyUserId: id }); } catch { /* ignore */ }
  };

  const openViewer = (attachments: Attachment[], index: number) => { setViewerAttachments(attachments); setViewerIndex(index); setViewerOpen(true); };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-xl border border-border bg-card">
      <DialogsList
        dialogs={dialogs} activeDialog={activeDialog} loadingDialogs={loadingDialogs}
        onlineUsers={onlineUsers} onlineCount={onlineCount} userRole={userRole}
        onOpenDialog={openDialog} onStartDialog={startDialog} onDeleteDialog={handleDeleteDialog}
        onConfirmMaster={() => setConfirmMaster(true)} onConfirmAll={() => setConfirmAll(true)}
        mobileShowChat={mobileShowChat}
      />

      <div className={`flex flex-1 flex-col ${mobileShowChat ? "flex" : "hidden lg:flex"}`}>
        {!activeDialog ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <MessageSquare className="size-16 text-muted-foreground/20" />
            <p className="text-muted-foreground">Выберите диалог</p>
          </div>
        ) : (
          <MessagePanel
            activeDialog={activeDialog} messages={messages} loadingMessages={loadingMessages}
            userId={userId} userRole={userRole} onlineUsers={onlineUsers}
            onBack={() => setMobileShowChat(false)} onSend={handleSend} onDelete={handleDeleteMessage} onOpenViewer={openViewer}
          />
        )}
      </div>

      <ViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} attachments={viewerAttachments} index={viewerIndex} onIndexChange={setViewerIndex} />

      <ConfirmDialog open={confirmMaster} onOpenChange={setConfirmMaster} title="Очистить диалоги мастеров" message="Все переписки с мастерами будут безвозвратно удалены."
        onConfirm={() => { fetch("/api/chat/dialogs?role=Master", { method: "DELETE" }).then((res) => { if (res.ok) { fetchDialogs(); socketRef.current?.emit("dialogs-cleared"); } }).catch(() => {}); }} />
      <ConfirmDialog open={confirmAll} onOpenChange={setConfirmAll} title="Очистить все диалоги" message="Все переписки всех пользователей будут безвозвратно удалены."
        onConfirm={() => { fetch("/api/chat/dialogs", { method: "DELETE" }).then((res) => { if (res.ok) { fetchDialogs(); socketRef.current?.emit("dialogs-cleared"); } }).catch(() => {}); }} />
    </div>
  );
}
