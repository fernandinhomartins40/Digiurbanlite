/** Chamadas do painel DigiBot (/api/admin/digibot) */

export interface BotMenuItem {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface BotConfig {
  botName: string;
  welcomeMessage: string;
  farewellMessage: string;
  tone: 'simples' | 'formal';
  aiCallsPerConversation: number;
  menu: BotMenuItem[];
  human: { hours: string; waitMessage: string; outOfHoursMessage: string; maxWaitMinutes: number; noAttendantMessage: string };
}

export interface BotSettingsResponse {
  published: BotConfig;
  draft: BotConfig | null;
  version: number;
  publishedAt: string;
  versions: Array<{ id: string; version: number; createdAt: string }>;
}

export interface BotOverview {
  status: { botOnline: boolean; aiAvailable: boolean; aiCredits: number | null };
  week: { conversations: number; protocolsOpened: number; handovers: number; resolvedByBot: number; notUnderstood: number };
  unansweredOpen: number;
  topUnanswered: Array<{ id: string; text: string; count: number }>;
}

export interface BotFaq {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  isActive: boolean;
  order: number;
}

export interface BotServiceWithTerms {
  id: string;
  name: string;
  category: string | null;
  department: { name: string } | null;
  terms: Array<{ id: string; term: string }>;
}

export interface BotUnanswered {
  id: string;
  text: string;
  count: number;
  lastSeenAt: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
}

export interface BotTestResult {
  services: Array<{ id: string; name: string; department: string | null; score: number }>;
  faq: { id: string; question: string; answer: string } | null;
}

/** Itens que não podem ser desligados (o servidor também garante) */
export const ESSENTIAL_MENU = ['solicitar_servico', 'consultar_protocolo'];

export async function digibotApi<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/digibot${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data as T;
}
