"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready: () => void;
        close: () => void;
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (tg) tg.ready();
  }, []);

  const handleTelegramLogin = async () => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const body = tg?.initData
      ? { init_data: tg.initData }
      : {
          id: 12345,
          first_name: "Test",
          username: "testuser",
          auth_date: Math.floor(Date.now() / 1000),
          hash: "mock",
        };
    const res = await fetch(`${apiUrl}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("growthkit_token", data.access_token);
      router.push("/dashboard");
    } else {
      const msg = await res.text();
      alert(tg?.initData ? "Ошибка входа" : "Для входа откройте Mini App из бота в Telegram.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-6">Вход в GrowthKit</h1>
      <button
        onClick={handleTelegramLogin}
        className="px-6 py-3 rounded-lg bg-growthkit-primary text-white font-medium"
      >
        Войти через Telegram
      </button>
    </main>
  );
}

