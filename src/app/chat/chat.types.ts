export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Interlocutor {
  id: string;
  name: string | null;
  email?: string;
  avatarUrl: string | null;
}

export interface Dialog {
  interlocutor: Interlocutor;
  lastMessage: string;
  lastTime: string;
  order?: { id: string; title: string } | null;
  unread: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  orderId?: string | null;
  attachments: Attachment[];
  createdAt: string;
  sender: { id: string; name: string | null };
}
