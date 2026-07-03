export type OrderStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";

export interface Order {
  id: string;
  title: string;
  description: string | null;
  status: OrderStatus;
  currentStage: number;
  serviceType: string | null;
  carInfo: string | null;
  tireSize: string | null;
  phone: string | null;
  visitDate: string | null;
  photos: string[];
  masterId: string | null;
  userId: string;
  createdAt: Date;
  user?: { name: string | null; email: string | null };
  master?: { name: string | null; email: string | null };
}

export interface OrderBrief {
  id: string;
  title: string;
  status: OrderStatus;
}
