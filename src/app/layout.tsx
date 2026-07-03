import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { OnlineProvider } from "@/features/chat/ui/online-provider";
import { ThemeInit } from "./theme-init";
import "./globals.css";

export const dynamic = "force-dynamic";

const gilroy = localFont({
  src: [
    { path: "../shared/fonts/Gilroy-Regular.woff2", weight: "400", style: "normal" },
    { path: "../shared/fonts/Gilroy-Medium.woff2", weight: "500", style: "normal" },
    { path: "../shared/fonts/Gilroy-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../shared/fonts/Gilroy-Bold.woff2", weight: "700", style: "normal" },
    { path: "../shared/fonts/Gilroy-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
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
    <html lang="ru" suppressHydrationWarning className={`h-full antialiased ${gilroy.variable} ${isDark ? "dark" : ""}`}>
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
