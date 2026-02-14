"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, type DashboardData } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Войдите в аккаунт"));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-400">{error}</p>
        <Link href="/login" className="text-growthkit-primary mt-2 inline-block">
          Войти
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-xl font-bold text-growthkit-primary">
          GrowthKit
        </Link>
        <span className="text-sm text-gray-400">Тариф: {data.tariff}</span>
      </header>
      <h2 className="text-2xl font-semibold mb-4">Мои каналы</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.channels.length === 0 ? (
          <p className="text-gray-400">Подключите канал в настройках</p>
        ) : (
          data.channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/dashboard/channel/${ch.id}`}
              className="block p-4 rounded-xl bg-growthkit-card border border-gray-700 hover:border-growthkit-primary transition"
            >
              <div className="font-medium">{ch.title || ch.username || `Канал #${ch.id}`}</div>
              {ch.username && (
                <div className="text-sm text-gray-400">@{ch.username}</div>
              )}
              {ch.subscribers_count != null && (
                <div className="text-sm text-growthkit-primary mt-1">
                  {ch.subscribers_count.toLocaleString()} подписчиков
                </div>
              )}
            </Link>
          ))
        )}
      </div>
      <nav className="mt-8 flex gap-4">
        <Link
          href="/dashboard/content"
          className="px-4 py-2 rounded-lg bg-growthkit-primary text-white"
        >
          Генератор постов
        </Link>
      </nav>
    </main>
  );
}
