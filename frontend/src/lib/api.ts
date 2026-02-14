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

export interface HeatmapCell {
  hour_utc: number;
  day_of_week: number;
  posts_count: number;
  avg_views: number;
  avg_reactions: number;
  score: number;
}

export interface HeatmapData {
  channel_id: number;
  cells: HeatmapCell[];
  best_post_hour_utc: number;
  best_reply_hour_utc: number;
}

export function getChannelHeatmap(channelId: number): Promise<HeatmapData> {
  return api<HeatmapData>(`/api/v1/analytics/channel/${channelId}/heatmap`);
}

export interface PsychographicData {
  emotions: Record<string, number>;
  types: Record<string, number>;
  sample_comments_count: number;
}

export function getChannelPsychographic(channelId: number): Promise<PsychographicData> {
  return api<PsychographicData>(`/api/v1/analytics/channel/${channelId}/psychographic`);
}

export interface CompetitorOut {
  id: number;
  channel_id: number;
  telegram_username: string | null;
  title: string | null;
  subscribers_count: number | null;
  er_estimate: number | null;
  created_at: string;
}

export function getCompetitors(channelId?: number): Promise<CompetitorOut[]> {
  const q = channelId != null ? `?channel_id=${channelId}` : "";
  return api<CompetitorOut[]>(`/api/v1/competitors${q}`);
}

export function addCompetitor(channelId: number, telegramUsername: string, title?: string): Promise<CompetitorOut> {
  return api<CompetitorOut>("/api/v1/competitors", {
    method: "POST",
    body: JSON.stringify({ channel_id: channelId, telegram_username: telegramUsername, title }),
  });
}

export interface BenchmarkData {
  channel_id: number;
  your_subscribers: number;
  your_er_estimate: number;
  niche_avg_subscribers: number;
  niche_avg_er: number;
  competitors_count: number;
}

export function getBenchmark(channelId: number): Promise<BenchmarkData> {
  return api<BenchmarkData>(`/api/v1/competitors/benchmark?channel_id=${channelId}`);
}

export interface AdsActivity {
  id: number;
  competitor_id: number;
  detected_at: string;
  description: string | null;
}

export function getAdsTracker(channelId: number, competitorId?: number): Promise<{ activities: AdsActivity[] }> {
  const q = competitorId != null ? `&competitor_id=${competitorId}` : "";
  return api<{ activities: AdsActivity[] }>(`/api/v1/competitors/ads-tracker?channel_id=${channelId}${q}`);
}

export interface AudienceOverlapItem {
  competitor_id: number;
  competitor_username: string | null;
  competitor_title: string | null;
  overlap_estimate: number | null;
  came_from_you_estimate: number | null;
}

export function getAudienceOverlap(channelId: number): Promise<{ channel_id: number; overlaps: AudienceOverlapItem[] }> {
  return api<{ channel_id: number; overlaps: AudienceOverlapItem[] }>(`/api/v1/competitors/audience-overlap?channel_id=${channelId}`);
}
