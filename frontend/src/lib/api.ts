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

export function viralHypothesis(topic: string, niche?: string): Promise<{ text: string; generated_at: string }> {
  return api<{ text: string; generated_at: string }>("/api/v1/content/viral-hypothesis", {
    method: "POST",
    body: JSON.stringify({ topic, niche }),
  });
}

export function repurposeContent(sourceText: string, targetFormat: string): Promise<{ text: string; target_format: string; generated_at: string }> {
  return api("/api/v1/content/repurpose", {
    method: "POST",
    body: JSON.stringify({ source_text: sourceText, target_format: targetFormat }),
  });
}

export function smartSandwich(postContext: string): Promise<{ comments: { first: string; second: string; third: string }; generated_at: string }> {
  return api("/api/v1/content/smart-sandwich", {
    method: "POST",
    body: JSON.stringify({ post_context: postContext }),
  });
}

export function reputationTemplates(negativeComment: string): Promise<{ templates: string[]; generated_at: string }> {
  return api("/api/v1/content/reputation-templates", {
    method: "POST",
    body: JSON.stringify({ negative_comment: negativeComment }),
  });
}

export function massPersonalReply(baseComment: string, count?: number): Promise<{ replies: string[]; generated_at: string }> {
  return api("/api/v1/content/mass-personal-reply", {
    method: "POST",
    body: JSON.stringify({ base_comment: baseComment, count: count ?? 5 }),
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

export interface ScoutChannel {
  username: string;
  title: string | null;
  subscribers_count: number | null;
  er_estimate: number | null;
  relevance_score: number;
}

export function getPartnerScout(channelId: number, limit?: number): Promise<ScoutChannel[]> {
  const q = limit != null ? `&limit=${limit}` : "";
  return api<ScoutChannel[]>(`/api/v1/partners/scout?channel_id=${channelId}${q}`);
}

export interface NegotiationOut {
  id: number;
  from_channel_id: number;
  to_channel_username: string;
  proposed_text: string | null;
  status: string;
  created_at: string;
  from_channel_title?: string | null;
}

export function createNegotiation(fromChannelId: number, toChannelUsername: string, proposedText?: string): Promise<NegotiationOut> {
  return api<NegotiationOut>("/api/v1/partners/negotiation", {
    method: "POST",
    body: JSON.stringify({ from_channel_id: fromChannelId, to_channel_username: toChannelUsername, proposed_text: proposedText || null }),
  });
}

export function listNegotiations(direction: "sent" | "received"): Promise<{ items: NegotiationOut[]; direction: string }> {
  return api<{ items: NegotiationOut[]; direction: string }>(`/api/v1/partners/negotiation?direction=${direction}`);
}

export function acceptNegotiation(requestId: number): Promise<{ status: string }> {
  return api(`/api/v1/partners/negotiation/${requestId}/accept`, { method: "POST" });
}

export function declineNegotiation(requestId: number): Promise<{ status: string }> {
  return api(`/api/v1/partners/negotiation/${requestId}/decline`, { method: "POST" });
}
