"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, Smile, Paperclip, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { ChatAvatar } from "./chat-avatar";
import { ChatMessage } from "./chat-message";
import type { Dialog, Message, Attachment } from "./chat.types";

interface MessagePanelProps {
  activeDialog: Dialog;
  messages: Message[];
  loadingMessages: boolean;
  userId: string;
  userRole: string;
  onlineUsers: Set<string>;
  onBack: () => void;
  onSend: (text: string, attachments: Attachment[]) => Promise<void>;
  onDelete: (msgId: string) => void;
  onOpenViewer: (attachments: Attachment[], index: number) => void;
}

export function MessagePanel({
  activeDialog, messages, loadingMessages, userId, userRole,
  onlineUsers, onBack, onSend, onDelete, onOpenViewer,
}: MessagePanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const updateTheme = () => setTheme(document.documentElement.classList.contains("dark") ? Theme.DARK : Theme.LIGHT);
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if ((!text.trim() && pendingAttachments.length === 0) || sending) return;
    setSending(true);
    await onSend(text.trim(), pendingAttachments);
    setText("");
    setPendingAttachments([]);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
        if (res.ok) { const data: Attachment = await res.json(); setPendingAttachments((prev) => [...prev, data]); }
      } catch { /* ignore */ }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <button onClick={onBack} className="lg:hidden -ml-1 rounded-lg p-1.5 hover:bg-muted"><ArrowLeft className="size-5" /></button>
        <ChatAvatar src={activeDialog.interlocutor.avatarUrl} name={activeDialog.interlocutor.name} className="size-9" />
        <div>
          <p className="text-sm font-medium">{activeDialog.interlocutor.name || "Пользователь"}</p>
          <span className={`text-xs ${onlineUsers.has(activeDialog.interlocutor.id) ? "text-green-500" : "text-muted-foreground"}`}>
            {onlineUsers.has(activeDialog.interlocutor.id) ? "Онлайн" : "не в сети"}
          </span>
          {activeDialog.order && <p className="text-xs text-muted-foreground">Заказ: {activeDialog.order.title}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center"><p className="text-sm text-muted-foreground">Начните диалог</p></div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === userId}
                canDelete={userRole === "Owner" || msg.senderId === userId}
                onDelete={onDelete}
                onOpenViewer={onOpenViewer}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        {pendingAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs">
                {att.type.startsWith("image/") ? <ImageIcon className="size-3.5 shrink-0" /> : <FileText className="size-3.5 shrink-0" />}
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.url !== att.url))} className="ml-1 text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative flex-1 flex items-end gap-1">
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Напишите сообщение..." rows={1}
              className="min-h-[40px] max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 pr-20 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5">
              <Button variant="ghost" size="icon-xs" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </Button>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" className="hidden" onChange={handleFileSelect} />
              <div className="relative">
                <Button variant="ghost" size="icon-xs" type="button" onClick={() => setShowEmojiPicker((prev) => !prev)}>
                  <Smile className="size-4" />
                </Button>
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-10 right-0 z-50">
                    <EmojiPicker onEmojiClick={(data: EmojiClickData) => { setText((prev) => prev + data.emoji); setShowEmojiPicker(false); }} theme={theme} width={280} height={350} searchDisabled skinTonesDisabled />
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button size="icon" onClick={handleSend} disabled={(!text.trim() && pendingAttachments.length === 0) || sending} className="shrink-0">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
