"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pingedRef = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    const goOffline = () => {
      navigator.sendBeacon("/api/chat/offline");
    };

    const ping = () => {
      fetch("/api/chat/ping", { method: "POST" }).catch(() => {});
    };

    if (!pingedRef.current) {
      ping();
      pingedRef.current = true;
    }

    const interval = setInterval(ping, 15000);

    window.addEventListener("beforeunload", goOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", goOffline);
    };
  }, [session?.user]);

  return <>{children}</>;
}
