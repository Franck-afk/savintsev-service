import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { OnlineProvider } from "@/features/chat/ui/online-provider";
import { ThemeInit } from "./theme-init";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme");
  const isDark = themeCookie?.value === "dark";

  return (
    <html lang="ru" suppressHydrationWarning className={`h-full antialiased ${inter.variable} ${isDark ? "dark" : ""}`}>
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
