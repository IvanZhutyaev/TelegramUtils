"use client";

import { useState } from "react";
import Link from "next/link";
import { generatePost, viralHypothesis, repurposeContent } from "@/lib/api";

export default function ContentGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [styleHint, setStyleHint] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viralTopic, setViralTopic] = useState("");
  const [viralNiche, setViralNiche] = useState("");
  const [viralResult, setViralResult] = useState<string | null>(null);
  const [viralLoading, setViralLoading] = useState(false);

  const [sourceText, setSourceText] = useState("");
  const [targetFormat, setTargetFormat] = useState("thread");
  const [repurposeResult, setRepurposeResult] = useState<string | null>(null);
  const [repurposeLoading, setRepurposeLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generatePost(topic.trim(), styleHint.trim() || undefined);
      setResult(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleViral = async () => {
    if (!viralTopic.trim()) return;
    setViralLoading(true);
    setViralResult(null);
    try {
      const res = await viralHypothesis(viralTopic.trim(), viralNiche.trim() || undefined);
      setViralResult(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setViralLoading(false);
    }
  };

  const handleRepurpose = async () => {
    if (!sourceText.trim()) return;
    setRepurposeLoading(true);
    setRepurposeResult(null);
    try {
      const res = await repurposeContent(sourceText.trim(), targetFormat);
      setRepurposeResult(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRepurposeLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard" className="text-growthkit-primary mb-4 inline-block">← Дашборд</Link>
      <div className="flex gap-4 mb-6">
        <Link href="/dashboard/content/neuro" className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-growthkit-card">
          Нейрокомментинг 2.0
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">AI-автопилот контента</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Генератор поста</h2>
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Тема поста</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
              placeholder="Например: советы по тайм-менеджменту"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Стиль (необязательно)</label>
            <input
              type="text"
              value={styleHint}
              onChange={(e) => setStyleHint(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
              placeholder="Коротко, с юмором"
            />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {loading ? "Генерация..." : "Сгенерировать"}
          </button>
          {result && (
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700 mt-4">
              <div className="text-sm text-gray-400 mb-2">Результат</div>
              <p className="whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Генератор вирусных гипотез</h2>
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Тема</label>
            <input
              type="text"
              value={viralTopic}
              onChange={(e) => setViralTopic(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
              placeholder="Тема канала или поста"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ниша (необяз.)</label>
            <input
              type="text"
              value={viralNiche}
              onChange={(e) => setViralNiche(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
            />
          </div>
          <button onClick={handleViral} disabled={viralLoading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {viralLoading ? "..." : "Получить формулу виральности"}
          </button>
          {viralResult && (
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700 mt-4">
              <p className="whitespace-pre-wrap">{viralResult}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Переработчик контента</h2>
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Исходный текст поста</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-growthkit-card border border-gray-700 text-white"
              placeholder="Вставьте длинный пост..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Формат</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="bg-growthkit-card border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="thread">Ветка твитов / постов</option>
              <option value="stories">Сторис (слайды)</option>
              <option value="teaser">Видео-тизер</option>
              <option value="article">Статья (вступление)</option>
            </select>
          </div>
          <button onClick={handleRepurpose} disabled={repurposeLoading} className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50">
            {repurposeLoading ? "..." : "Переработать"}
          </button>
          {repurposeResult && (
            <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700 mt-4">
              <p className="whitespace-pre-wrap">{repurposeResult}</p>
            </div>
          )}
        </div>
      </section>

      {error && <p className="text-red-400">{error}</p>}
    </main>
  );
}
