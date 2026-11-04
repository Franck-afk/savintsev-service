export type SocketRole = "Client" | "Master" | "Owner";

export interface OrderEventAccess {
  userId: string;
  masterId: string | null;
  status: string;
}

export function canEmitOrderStageUpdate(
  actorId: string,
  actorRole: SocketRole,
  order: OrderEventAccess,
): boolean {
  if (actorRole === "Owner") return true;
  if (actorRole === "Master") return order.masterId === actorId;
  return order.userId === actorId && order.status === "Pending";
}

export function canEmitOrderDeletion(
  actorId: string,
  actorRole: SocketRole,
  ownerId: string,
): boolean {
  return actorRole === "Owner" || actorId === ownerId;
}

export function canEmitDialogDeletion(actorId: string, deletedBy: string): boolean {
  return actorId === deletedBy;
}

export function canEmitPaymentNotice(
  actorId: string,
  actorRole: SocketRole,
  masterId: string | null,
): boolean {
  return actorRole === "Owner" || (actorRole === "Master" && masterId === actorId);
}
