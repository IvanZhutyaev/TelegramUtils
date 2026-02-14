import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowthKit — Ваш стратег и двигатель роста в Telegram",
  description: "Командный центр для роста канала: аналитика, AI-контент, пиар",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
