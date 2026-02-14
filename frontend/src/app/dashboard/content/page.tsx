"use client";

import { useState } from "react";
import Link from "next/link";
import { generatePost } from "@/lib/api";

export default function ContentGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [styleHint, setStyleHint] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen p-8">
      <Link href="/dashboard" className="text-growthkit-primary mb-4 inline-block">
        ← Дашборд
      </Link>
      <h1 className="text-2xl font-bold mb-6">AI-генератор постов</h1>
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
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-growthkit-primary text-white disabled:opacity-50"
        >
          {loading ? "Генерация..." : "Сгенерировать"}
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {result && (
          <div className="p-4 rounded-xl bg-growthkit-card border border-gray-700 mt-4">
            <div className="text-sm text-gray-400 mb-2">Результат</div>
            <p className="whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </main>
  );
}
