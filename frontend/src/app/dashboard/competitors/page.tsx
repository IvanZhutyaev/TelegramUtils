"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDashboard,
  getCompetitors,
  addCompetitor,
  getBenchmark,
  getAdsTracker,
  getAudienceOverlap,
  type DashboardData,
  type CompetitorOut,
  type BenchmarkData,
  type AdsActivity,
  type AudienceOverlapItem,
} from "@/lib/api";

export default function CompetitorsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorOut[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [ads, setAds] = useState<AdsActivity[]>([]);
  const [overlaps, setOverlaps] = useState<AudienceOverlapItem[]>([]);
  const [addUsername, setAddUsername] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => {
        setDashboard(d);
        if (d.channels.length > 0 && !channelId) {
          const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("channel_id") : null;
          setChannelId(q ? parseInt(q, 10) : d.channels[0].id);
        }
      })
      .catch(() => setError("Войдите в аккаунт"));
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    getCompetitors(channelId).then(setCompetitors).catch(() => {});
    getBenchmark(channelId).then(setBenchmark).catch(() => {});
    getAdsTracker(channelId).then((r) => setAds(r.activities)).catch(() => {});
    getAudienceOverlap(channelId).then((r) => setOverlaps(r.overlaps)).catch(() => {});
  }, [channelId]);

  const handleAdd = async () => {
    if (!channelId || !addUsername.trim()) return;
    setLoading(true);
    try {
      const c = await addCompetitor(channelId, addUsername.trim(), addTitle.trim() || undefined);
      setCompetitors((prev) => [...prev, c]);
      setAddUsername("");
      setAddTitle("");
      if (benchmark) getBenchmark(channelId).then(setBenchmark);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка добавления");
    } finally {
      setLoading(false);
    }
  };

  if (error && !dashboard) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-400">{error}</p>
        <Link href="/login" className="text-growthkit-primary mt-2 inline-block">Войти</Link>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </main>
    );
  }

  const currentChannel = dashboard.channels.find((c) => c.id === channelId) || dashboard.channels[0];

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard" className="text-growthkit-primary mb-4 inline-block">← Дашборд</Link>
      <h1 className="text-2xl font-bold mb-6">Конкурентный анализ</h1>

      {dashboard.channels.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-gray-400 mr-2">Канал:</label>
          <select
            value={channelId ?? ""}
            onChange={(e) => setChannelId(parseInt(e.target.value, 10))}
            className="bg-growthkit-card border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            {dashboard.channels.map((c) => (
              <option key={c.id} value={c.id}>{c.title || c.username || `#${c.id}`}</option>
            ))}
          </select>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Добавить конкурента</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">@username</label>
            <input
              type="text"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              placeholder="channel_username"
              className="bg-growthkit-card border border-gray-700 rounded-lg px-3 py-2 text-white w-48"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Название (необяз.)</label>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="Название канала"
              className="bg-growthkit-card border border-gray-700 rounded-lg px-3 py-2 text-white w-48"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50"
          >
            {loading ? "..." : "Добавить"}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Бенчмаркинг</h2>
        {benchmark ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
              <div className="text-sm text-gray-400">Ваши подписчики</div>
              <div className="text-xl font-semibold">{benchmark.your_subscribers.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
              <div className="text-sm text-gray-400">Среднее по нише</div>
              <div className="text-xl font-semibold">{benchmark.niche_avg_subscribers.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
              <div className="text-sm text-gray-400">Ваш ER</div>
              <div className="text-xl font-semibold">{(benchmark.your_er_estimate * 100).toFixed(2)}%</div>
            </div>
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700">
              <div className="text-sm text-gray-400">ER ниши</div>
              <div className="text-xl font-semibold">{(benchmark.niche_avg_er * 100).toFixed(2)}%</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Добавьте конкурентов для бенчмарка</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Список конкурентов ({competitors.length})</h2>
        <ul className="space-y-2">
          {competitors.length === 0 ? (
            <li className="text-gray-400">Пока нет добавленных конкурентов</li>
          ) : (
            competitors.map((c) => (
              <li key={c.id} className="p-3 rounded-lg bg-growthkit-card border border-gray-700 flex justify-between items-center">
                <span>@{c.telegram_username ?? "—"} {c.title && `· ${c.title}`}</span>
                <span className="text-growthkit-primary text-sm">
                  {c.subscribers_count != null ? `${c.subscribers_count.toLocaleString()} подп.` : "—"}
                  {c.er_estimate != null ? ` · ER ${(c.er_estimate * 100).toFixed(1)}%` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Трекер рекламы конкурентов</h2>
        {ads.length === 0 ? (
          <p className="text-gray-400">Обнаруженные рекламные активности появятся здесь</p>
        ) : (
          <ul className="space-y-2">
            {ads.map((a) => (
              <li key={a.id} className="p-3 rounded-lg bg-growthkit-card border border-gray-700 text-sm">
                {a.description ?? "Рекламная активность"} · {new Date(a.detected_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Пересечение аудитории («украденные подписчики»)</h2>
        {overlaps.length === 0 ? (
          <p className="text-gray-400">Данные о пересечении с конкурентами появятся после сбора статистики</p>
        ) : (
          <ul className="space-y-2">
            {overlaps.map((o) => (
              <li key={o.competitor_id} className="p-3 rounded-lg bg-growthkit-card border border-gray-700 flex justify-between">
                <span>@{o.competitor_username ?? "—"} {o.competitor_title && `· ${o.competitor_title}`}</span>
                <span className="text-gray-400 text-sm">
                  {o.overlap_estimate != null ? `Пересечение: ${o.overlap_estimate}` : "—"}
                  {o.came_from_you_estimate != null ? ` · от вас: ${o.came_from_you_estimate}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
