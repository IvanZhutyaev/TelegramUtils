"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDashboard,
  getPartnerScout,
  createNegotiation,
  listNegotiations,
  acceptNegotiation,
  declineNegotiation,
  type DashboardData,
  type ScoutChannel,
  type NegotiationOut,
} from "@/lib/api";

export default function PartnersPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [scoutResults, setScoutResults] = useState<ScoutChannel[]>([]);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [sent, setSent] = useState<NegotiationOut[]>([]);
  const [received, setReceived] = useState<NegotiationOut[]>([]);
  const [toUsername, setToUsername] = useState("");
  const [proposedText, setProposedText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => {
        setDashboard(d);
        if (d.channels.length > 0 && !channelId) setChannelId(d.channels[0].id);
      })
      .catch(() => setError("Войдите в аккаунт"));
  }, [channelId]);

  useEffect(() => {
    listNegotiations("sent").then((r) => setSent(r.items)).catch(() => {});
    listNegotiations("received").then((r) => setReceived(r.items)).catch(() => {});
  }, []);

  const runScout = async () => {
    if (!channelId) return;
    setScoutLoading(true);
    setScoutResults([]);
    try {
      const list = await getPartnerScout(channelId, 10);
      setScoutResults(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка скаута");
    } finally {
      setScoutLoading(false);
    }
  };

  const sendOffer = async () => {
    if (!channelId || !toUsername.trim()) return;
    setSubmitLoading(true);
    setError(null);
    try {
      const req = await createNegotiation(channelId, toUsername.trim(), proposedText.trim() || undefined);
      setSent((prev) => [req, ...prev]);
      setToUsername("");
      setProposedText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await acceptNegotiation(id);
      setReceived((prev) => prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await declineNegotiation(id);
      setReceived((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
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

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard" className="text-growthkit-primary mb-4 inline-block">← Дашборд</Link>
      <h1 className="text-2xl font-bold mb-6">Пиар и нетворкинг</h1>

      {dashboard.channels.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-gray-400 mr-2">Ваш канал:</label>
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

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">AI Скаут</h2>
        <p className="text-sm text-gray-400 mb-2">Подбор релевантных каналов для пиара (по вашей нише).</p>
        <button
          onClick={runScout}
          disabled={scoutLoading || !channelId}
          className="px-4 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50 mb-4"
        >
          {scoutLoading ? "Сканируем..." : "Запустить скаут"}
        </button>
        {scoutResults.length > 0 && (
          <ul className="space-y-2">
            {scoutResults.map((s, i) => (
              <li key={i} className="p-3 rounded-lg bg-growthkit-card border border-gray-700 flex justify-between items-center">
                <span>@{s.username} · {s.title ?? ""}</span>
                <span className="text-growthkit-primary text-sm">
                  {s.subscribers_count != null ? `${s.subscribers_count.toLocaleString()} подп.` : ""}
                  {s.er_estimate != null ? ` ER ${(s.er_estimate * 100).toFixed(1)}%` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Отправить предложение о бартере</h2>
        <p className="text-sm text-gray-400 mb-2">Переговорный бот: предложение отправится каналу (при наличии GrowthKit — в список входящих).</p>
        <div className="max-w-md space-y-2">
          <input
            type="text"
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
            placeholder="@username канала"
            className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
          />
          <textarea
            value={proposedText}
            onChange={(e) => setProposedText(e.target.value)}
            rows={2}
            placeholder="Текст предложения (необяз.)"
            className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
          />
          <button
            onClick={sendOffer}
            disabled={submitLoading || !channelId || !toUsername.trim()}
            className="px-4 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50"
          >
            {submitLoading ? "..." : "Отправить"}
          </button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Отправленные предложения</h2>
        {sent.length === 0 ? (
          <p className="text-gray-400">Пока нет</p>
        ) : (
          <ul className="space-y-2">
            {sent.map((r) => (
              <li key={r.id} className="p-3 rounded-lg bg-growthkit-card border border-gray-700">
                <span className="text-growthkit-primary">→ @{r.to_channel_username}</span>
                <span className="text-gray-400 ml-2">({r.status})</span>
                {r.proposed_text && <p className="text-sm mt-1">{r.proposed_text}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Входящие предложения</h2>
        {received.length === 0 ? (
          <p className="text-gray-400">Пока нет</p>
        ) : (
          <ul className="space-y-2">
            {received.map((r) => (
              <li key={r.id} className="p-3 rounded-lg bg-growthkit-card border border-gray-700">
                <span>@{r.to_channel_username} ← {r.from_channel_title ?? r.from_channel_id}</span>
                {r.proposed_text && <p className="text-sm mt-1">{r.proposed_text}</p>}
                <span className="text-gray-400 text-sm">{r.status}</span>
                {r.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleAccept(r.id)} className="px-2 py-1 rounded bg-green-600 text-white text-sm">Принять</button>
                    <button onClick={() => handleDecline(r.id)} className="px-2 py-1 rounded bg-red-600 text-white text-sm">Отклонить</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-red-400 mt-4">{error}</p>}
    </main>
  );
}
