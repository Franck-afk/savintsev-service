import Image from "next/image";
import { Trash2, FileText } from "lucide-react";
import { isEmojiOnly, formatFileSize } from "./chat-utils";
import type { Message, Attachment } from "./chat.types";

interface ChatMessageProps {
  msg: Message;
  isMine: boolean;
  canDelete: boolean;
  onDelete: (msgId: string) => void;
  onOpenViewer: (attachments: Attachment[], index: number) => void;
}

export function ChatMessage({ msg, isMine, canDelete, onDelete, onOpenViewer }: ChatMessageProps) {
  const onlyEmoji = msg.content && isEmojiOnly(msg.content);

  return (
    <div className={`group flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {canDelete && (
        <button
          onClick={() => onDelete(msg.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Удалить сообщение"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      <div
        className={`max-w-[70%] px-4 py-2.5 ${
          onlyEmoji
            ? ""
            : isMine
              ? "bg-secondary text-secondary-foreground rounded-2xl rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md"
        } ${isMine ? "text-right" : "text-left"}`}
      >
        {msg.content && (
          <p className={`whitespace-pre-wrap break-words ${onlyEmoji ? "text-4xl leading-relaxed" : "text-sm"}`}>
            {msg.content}
          </p>
        )}

        {msg.attachments?.length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
            {msg.attachments.map((att, i) => (
              <div key={i}>
                {att.type.startsWith("image/") ? (
                  <button onClick={() => onOpenViewer(msg.attachments, i)} className="text-left">
                    <Image
                      src={att.url}
                      alt={att.name}
                      width={200}
                      height={200}
                      className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenViewer(msg.attachments, i)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${
                      isMine
                        ? "bg-primary/15 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground border border-border"
                    }`}
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <span className="opacity-60">({formatFileSize(att.size)})</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-1 text-[10px] text-muted-foreground">
          {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
