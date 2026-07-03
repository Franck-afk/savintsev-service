import { requireSession } from "@/shared/lib/auth-helpers";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const session = await requireSession();

  return <ChatClient userId={session.user.id} userRole={session.user.role} />;
}
