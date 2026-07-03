export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "Client" | "Master" | "Owner";
  phone: string | null;
  avatarUrl: string | null;
  lastSeen: Date | null;
  createdAt: Date;
}

export interface UserBrief {
  id: string;
  name: string | null;
  email?: string;
  avatarUrl: string | null;
}
