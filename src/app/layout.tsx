import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { OnlineProvider } from "@/features/chat/ui/online-provider";
import { ThemeInit } from "./theme-init";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Шинный Мастер",
  description: "Система управления шиномонтажем",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={`h-full antialiased ${nunito.variable}`}>
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        <SessionProvider>
          <OnlineProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </OnlineProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
