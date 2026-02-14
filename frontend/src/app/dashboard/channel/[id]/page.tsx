"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactECharts from "echarts-for-react";
import { getChannelAnalytics, type ChannelStats } from "@/lib/api";

export default function ChannelAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getChannelAnalytics(parseInt(id, 10))
      .then(setStats)
      .catch(() => setError("Не удалось загрузить данные"));
  }, [id]);

  if (error || !id) {
    return (
      <main className="min-h-screen p-8">
        {error && <p className="text-red-400">{error}</p>}
        <Link href="/dashboard" className="text-growthkit-primary mt-2 inline-block">
          Назад к дашборду
        </Link>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-gray-400">Загрузка...</div>
      </main>
    );
  }

  const option = {
    xAxis: { type: "category", data: ["Неделя назад", "Сейчас"] },
    yAxis: { type: "value" },
    series: [
      {
        data: [
          stats.subscribers_count != null ? stats.subscribers_count - (stats.growth_7d || 0) : 0,
          stats.subscribers_count ?? 0,
        ],
        type: "line",
        smooth: true,
      },
    ],
    backgroundColor: "transparent",
    textStyle: { color: "#e6edf3" },
  };

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard" className="text-growthkit-primary mb-4 inline-block">
        ← Дашборд
      </Link>
      <h1 className="text-2xl font-bold mb-6">Аналитика канала #{stats.channel_id}</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
          <div className="text-sm text-gray-400">Подписчиков</div>
          <div className="text-2xl font-semibold">{stats.subscribers_count?.toLocaleString() ?? "—"}</div>
        </div>
        <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
          <div className="text-sm text-gray-400">Рост за 7 дней</div>
          <div className="text-2xl font-semibold">{stats.growth_7d != null ? `+${stats.growth_7d}` : "—"}</div>
        </div>
        <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
          <div className="text-sm text-gray-400">ER (оценка)</div>
          <div className="text-2xl font-semibold">{stats.er_estimate != null ? `${(stats.er_estimate * 100).toFixed(2)}%` : "—"}</div>
        </div>
      </div>
      <div className="rounded-xl bg-growthkit-card border border-gray-700 p-4 h-80">
        <ReactECharts option={option} style={{ height: "100%" }} />
      </div>
    </main>
  );
}
