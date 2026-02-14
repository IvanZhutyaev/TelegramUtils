const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("growthkit_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface DashboardData {
  channels: { id: number; title: string | null; username: string | null; subscribers_count: number | null }[];
  tariff: string;
}

export function getDashboard(): Promise<DashboardData> {
  return api<DashboardData>("/api/v1/analytics/dashboard");
}

export interface ChannelStats {
  channel_id: number;
  subscribers_count: number | null;
  growth_7d: number | null;
  er_estimate: number | null;
  period_days: number;
}

export function getChannelAnalytics(channelId: number): Promise<ChannelStats> {
  return api<ChannelStats>(`/api/v1/analytics/channel/${channelId}`);
}

export function generatePost(topic: string, styleHint?: string): Promise<{ text: string; generated_at: string }> {
  return api<{ text: string; generated_at: string }>("/api/v1/content/generate-post", {
    method: "POST",
    body: JSON.stringify({ topic, style_hint: styleHint }),
  });
}
