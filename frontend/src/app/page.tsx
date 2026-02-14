"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-growthkit-primary mb-2">
        GrowthKit
      </h1>
      <p className="text-gray-400 mb-8">
        Ваш стратег и двигатель роста в Telegram
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-growthkit-primary text-white font-medium hover:opacity-90"
        >
          Войти через Telegram
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-growthkit-card"
        >
          Дашборд
        </Link>
      </div>
    </main>
  );
}
