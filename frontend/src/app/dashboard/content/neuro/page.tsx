"use client";

import { useState } from "react";
import Link from "next/link";
import { smartSandwich, reputationTemplates, massPersonalReply } from "@/lib/api";

export default function NeurocommentingPage() {
  const [postContext, setPostContext] = useState("");
  const [sandwich, setSandwich] = useState<{ first: string; second: string; third: string } | null>(null);
  const [sandwichLoading, setSandwichLoading] = useState(false);

  const [negativeComment, setNegativeComment] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [baseComment, setBaseComment] = useState("");
  const [replyCount, setReplyCount] = useState(5);
  const [replies, setReplies] = useState<string[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const handleSandwich = async () => {
    if (!postContext.trim()) return;
    setSandwichLoading(true);
    setSandwich(null);
    try {
      const res = await smartSandwich(postContext.trim());
      setSandwich(res.comments);
    } catch (e) {
      setSandwich({ first: "Ошибка", second: "", third: "" });
    } finally {
      setSandwichLoading(false);
    }
  };

  const handleReputation = async () => {
    if (!negativeComment.trim()) return;
    setTemplatesLoading(true);
    setTemplates([]);
    try {
      const res = await reputationTemplates(negativeComment.trim());
      setTemplates(res.templates);
    } catch (e) {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleMassReply = async () => {
    if (!baseComment.trim()) return;
    setRepliesLoading(true);
    setReplies([]);
    try {
      const res = await massPersonalReply(baseComment.trim(), replyCount);
      setReplies(res.replies);
    } catch (e) {
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard/content" className="text-growthkit-primary mb-4 inline-block">← Контент</Link>
      <h1 className="text-2xl font-bold mb-6">Нейрокомментинг 2.0</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Умный сэндвич</h2>
        <p className="text-sm text-gray-400 mb-2">Стратегия вовлечения: первый комментарий (вопрос), второй (развитие), третий (резюме).</p>
        <div className="max-w-xl space-y-4">
          <textarea
            value={postContext}
            onChange={(e) => setPostContext(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
            placeholder="Контекст поста или его текст"
          />
          <button onClick={handleSandwich} disabled={sandwichLoading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {sandwichLoading ? "..." : "Сгенерировать стратегию"}
          </button>
          {sandwich && (
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700 space-y-3">
              <div><span className="text-gray-400 text-sm">1. Вопрос:</span> <span>{sandwich.first}</span></div>
              <div><span className="text-gray-400 text-sm">2. Развитие:</span> <span>{sandwich.second}</span></div>
              <div><span className="text-gray-400 text-sm">3. Резюме:</span> <span>{sandwich.third}</span></div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Менеджер репутации</h2>
        <p className="text-sm text-gray-400 mb-2">Шаблоны дипломатичных ответов на негативный комментарий.</p>
        <div className="max-w-xl space-y-4">
          <textarea
            value={negativeComment}
            onChange={(e) => setNegativeComment(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
            placeholder="Текст негативного комментария"
          />
          <button onClick={handleReputation} disabled={templatesLoading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {templatesLoading ? "..." : "Получить шаблоны"}
          </button>
          {templates.length > 0 && (
            <ul className="p-4 rounded-xl bg-growthkit-card border border-gray-700 space-y-2">
              {templates.map((t, i) => (
                <li key={i} className="text-sm">{t}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Массовый персональный ответ</h2>
        <p className="text-sm text-gray-400 mb-2">Уникальные ответы на похожие комментарии под одним постом.</p>
        <div className="max-w-xl space-y-4">
          <input
            type="text"
            value={baseComment}
            onChange={(e) => setBaseComment(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
            placeholder="Тема или пример комментария"
          />
          <div>
            <label className="text-sm text-gray-400 mr-2">Количество вариантов:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={replyCount}
              onChange={(e) => setReplyCount(parseInt(e.target.value, 10) || 5)}
              className="w-20 px-2 py-1 rounded bg-growthkit-card border border-gray-700 text-white"
            />
          </div>
          <button onClick={handleMassReply} disabled={repliesLoading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {repliesLoading ? "..." : "Сгенерировать ответы"}
          </button>
          {replies.length > 0 && (
            <ul className="p-4 rounded-xl bg-growthkit-card border border-gray-700 space-y-2">
              {replies.map((r, i) => (
                <li key={i} className="text-sm">{r}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
