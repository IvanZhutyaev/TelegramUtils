"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactECharts from "echarts-for-react";
import {
  getChannelAnalytics,
  getChannelHeatmap,
  getChannelPsychographic,
  type ChannelStats,
  type HeatmapData,
  type PsychographicData,
} from "@/lib/api";

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function ChannelAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [psychographic, setPsychographic] = useState<PsychographicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const cid = parseInt(id, 10);
    getChannelAnalytics(cid).then(setStats).catch(() => setError("Не удалось загрузить данные"));
    getChannelHeatmap(cid).then(setHeatmap).catch(() => {});
    getChannelPsychographic(cid).then(setPsychographic).catch(() => {});
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
      <div className="rounded-xl bg-growthkit-card border border-gray-700 p-4 h-80 mb-8">
        <ReactECharts option={option} style={{ height: "100%" }} />
      </div>

      {heatmap && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">HeatMap активности</h2>
          <p className="text-sm text-gray-400 mb-2">
            Лучшее время для поста: {heatmap.best_post_hour_utc}:00 UTC. Для ответов на комментарии: {heatmap.best_reply_hour_utc}:00 UTC.
          </p>
          <div className="rounded-xl bg-growthkit-card border border-gray-700 p-4 h-80">
            <ReactECharts
              option={{
                tooltip: {},
                grid: { left: 48, right: 24, top: 24, bottom: 32 },
                xAxis: { type: "category", data: DAYS, axisLabel: { color: "#9ca3af" } },
                yAxis: { type: "category", data: Array.from({ length: 24 }, (_, i) => `${i}:00`), axisLabel: { color: "#9ca3af" } },
                visualMap: {
                  min: 0,
                  max: Math.max(...heatmap.cells.map((c) => c.score), 1),
                  inRange: { color: ["#161b22", "#0088cc"] },
                  textStyle: { color: "#e6edf3" },
                },
                series: [{
                  type: "heatmap",
                  data: heatmap.cells.map((c) => [c.day_of_week, c.hour_utc, c.score.toFixed(1)]),
                }],
              }}
              style={{ height: "100%" }}
            />
          </div>
        </section>
      )}

      {psychographic && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Психографический портрет аудитории</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-growthkit-card border border-gray-700 p-4">
              <h3 className="text-sm text-gray-400 mb-2">Эмоции в комментариях</h3>
              <ReactECharts
                option={{
                  color: ["#0088cc", "#22c55e", "#eab308", "#94a3b8", "#f43f5e"],
                  series: [{
                    type: "pie",
                    radius: "70%",
                    data: Object.entries(psychographic.emotions).map(([n, v]) => ({ name: n, value: Math.round(v * 100) })),
                    label: { color: "#e6edf3" },
                  }],
                }}
                style={{ height: 220 }}
              />
            </div>
            <div className="rounded-xl bg-growthkit-card border border-gray-700 p-4">
              <h3 className="text-sm text-gray-400 mb-2">Типажи подписчиков</h3>
              <ReactECharts
                option={{
                  color: ["#0088cc"],
                  xAxis: { type: "category", data: Object.keys(psychographic.types), axisLabel: { color: "#9ca3af" } },
                  yAxis: { type: "value", axisLabel: { color: "#9ca3af" } },
                  series: [{
                    type: "bar",
                    data: Object.values(psychographic.types).map((v) => (v * 100).toFixed(1)),
                  }],
                }}
                style={{ height: 220 }}
              />
            </div>
          </div>
        </section>
      )}

      <div className="flex gap-4 mt-6">
        <Link
          href={`/dashboard/competitors?channel_id=${stats.channel_id}`}
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-growthkit-card"
        >
          Конкуренты и бенчмарк
        </Link>
      </div>
    </main>
  );
}
