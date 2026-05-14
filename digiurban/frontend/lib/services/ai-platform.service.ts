import { getFullApiUrl } from '@/lib/api-config';

export interface AiConversation {
  id: string;
  title: string | null;
  userId: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface AiMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  model?: string | null;
  totalTokens: number;
  metadata?: AiMessageMetadata | null;
  createdAt: string;
}

export interface AiMessageAttachment {
  name: string;
  mimeType?: string;
  size?: number;
  contentText?: string;
}

export interface AiMessageMetadata {
  attachments?: AiMessageAttachment[];
  thinking?: string;
  thinkingStatus?: 'processing' | 'completed';
  thinkEnabled?: boolean;
  chatMode?: 'free' | 'rag';
  experience?: 'fast' | 'contextual' | 'quality';
  finishReason?: string;
  contextSources?: string[];
  routeKind?: string;
  deterministicResponse?: boolean;
  performance?: AiPerformanceMetrics;
  webSearch?: AiWebSearchMetadata;
  interactiveCards?: AiInteractiveCard[];
}

export interface AiInteractiveCard {
  type: 'metric_grid' | 'record_list' | 'action_grid';
  title: string;
  subtitle?: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'slate';
  items: Array<{
    label: string;
    value: string | number;
    description?: string;
    href?: string;
    status?: string;
  }>;
  actions?: Array<{
    label: string;
    href?: string;
    prompt?: string;
    variant?: 'primary' | 'secondary';
  }>;
}

export interface AiPerformanceMetrics {
  latencyMs?: number;
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalDurationMs?: number;
  evalDurationMs?: number;
  tokensPerSecond?: number;
}

export interface AiWebSearchMetadata {
  enabled?: boolean;
  provider?: string;
  resultCount?: number;
  sources?: Array<{
    title: string;
    url: string;
    source?: string;
  }>;
}

export interface AiStreamEvent {
  type: 'start' | 'thinking_delta' | 'content_delta' | 'done' | 'error';
  data?: any;
  error?: string;
}

export interface AiKnowledgeSource {
  id: string;
  name: string;
  type: 'SYSTEM_TABLE' | 'SQL_QUERY' | 'MANUAL_TEXT' | 'HTTP_ENDPOINT';
  isActive: boolean;
  lastIngestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiPlan {
  id: string;
  name: string;
  planType: 'INTERNAL' | 'MUNICIPALITY';
  requestLimitPerMinute: number;
  monthlyBudgetTokens: number;
  inputTokenLimit: number;
  outputTokenLimit: number;
  isActive: boolean;
}

export interface AiApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface AiUsageSummary {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
  totalRequests: number;
}

export interface AiProviderSettings {
  provider: 'LLAMACPP';
  fallbackProvider: 'LLAMACPP' | null;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled: boolean;
  updatedAt?: string | null;
}

export interface AiProviderModel {
  id: string;
  name: string;
  huggingFaceId?: string;
  isOpenSource?: boolean;
  contextLength?: number;
  promptPrice?: string;
  completionPrice?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getFullApiUrl(`/api/ai${path}`), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (Array.isArray(body?.details) ? body.details[0]?.message : body?.details) ||
      body?.error ||
      body?.message ||
      `Falha na requisicao (${response.status})`;
    throw new Error(errorMessage);
  }

  return body as T;
}

export const aiPlatformService = {
  async health(): Promise<{ status: string }> {
    return request('/health');
  },

  async listConversations(): Promise<AiConversation[]> {
    const payload = await request<{ data: AiConversation[] }>('/conversations');
    return payload.data || [];
  },

  async createConversation(input?: { title?: string }): Promise<AiConversation> {
    const payload = await request<{ data: AiConversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(input || {}),
    });
    return payload.data;
  },

  async getConversation(conversationId: string): Promise<AiConversation & { messages: AiMessage[] }> {
    const payload = await request<{ data: AiConversation & { messages: AiMessage[] } }>(
      `/conversations/${conversationId}`,
    );
    return payload.data;
  },

  async updateConversation(
    conversationId: string,
    input: { title?: string; isArchived?: boolean },
  ): Promise<AiConversation> {
    const payload = await request<{ data: AiConversation }>(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await request(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },

  async sendMessage(conversationId: string, input: {
    content: string;
    model?: string;
    think?: boolean;
    mode?: 'free' | 'rag';
    experience?: 'fast' | 'contextual' | 'quality';
    webSearch?: boolean;
    extraInstruction?: string;
    attachments?: AiMessageAttachment[];
  }): Promise<{
    conversationId: string;
    assistantMessage: AiMessage;
    contextSources: number;
  }> {
    const payload = await request<{
      data: {
        conversationId: string;
        assistantMessage: AiMessage;
        contextSources: number;
      };
    }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async complete(input: {
    prompt: string;
    model?: string;
    think?: boolean;
    mode?: 'free' | 'rag';
    experience?: 'fast' | 'contextual' | 'quality';
    webSearch?: boolean;
    extraInstruction?: string;
  }): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    thinking?: string;
    totalDurationMs?: number;
    loadDurationMs?: number;
    promptEvalDurationMs?: number;
    evalDurationMs?: number;
    tokensPerSecond?: number;
    contextSources: number;
    routeKind?: string;
    deterministicResponse?: boolean;
  }> {
    const payload = await request<{ data: any }>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async usageSummary(): Promise<AiUsageSummary> {
    const payload = await request<{ data: AiUsageSummary }>('/usage/summary');
    return payload.data;
  },

  async getProviderSettings(): Promise<AiProviderSettings> {
    const payload = await request<{ data: AiProviderSettings }>('/provider/settings');
    return payload.data;
  },

  async updateProviderSettings(input: {
    provider: 'LLAMACPP';
    fallbackProvider?: 'LLAMACPP' | null;
    fastModel?: string | null;
    contextualModel?: string | null;
    qualityModel?: string | null;
    fallbackFastModel?: string | null;
    fallbackContextualModel?: string | null;
    fallbackQualityModel?: string | null;
    isEnabled?: boolean;
  }): Promise<AiProviderSettings> {
    const payload = await request<{ data: AiProviderSettings }>('/provider/settings', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async testProvider(input: {
    provider: 'LLAMACPP';
  }): Promise<{
    provider: 'LLAMACPP';
    ok: boolean;
    message: string;
    modelsChecked?: number;
  }> {
    const payload = await request<{ data: any }>('/provider/test', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async listProviderModels(input: {
    provider: 'LLAMACPP';
    openSourceOnly?: boolean;
  }): Promise<AiProviderModel[]> {
    const payload = await request<{ data: AiProviderModel[] }>('/provider/models', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data || [];
  },

  async streamMessage(
    conversationId: string,
    input: {
      content: string;
      model?: string;
      think?: boolean;
      mode?: 'free' | 'rag';
      experience?: 'fast' | 'contextual' | 'quality';
      webSearch?: boolean;
      extraInstruction?: string;
      attachments?: AiMessageAttachment[];
    },
    handlers: {
      onEvent?: (event: AiStreamEvent) => void;
      onThinkingDelta?: (delta: string) => void;
      onContentDelta?: (delta: string) => void;
    } = {},
  ): Promise<{
    conversationId: string;
    assistantMessage: AiMessage;
    contextSources: number;
  }> {
    const response = await fetch(getFullApiUrl(`/api/ai/conversations/${conversationId}/messages/stream`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => null);
      const errorMessage =
        (Array.isArray(body?.details) ? body.details[0]?.message : body?.details) ||
        body?.error ||
        body?.message ||
        `Falha no stream da IA (${response.status})`;
      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let donePayload:
      | {
          conversationId: string;
          assistantMessage: AiMessage;
          contextSources: number;
        }
      | null = null;

    const processLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let event: AiStreamEvent;
      try {
        event = JSON.parse(trimmed) as AiStreamEvent;
      } catch {
        return;
      }

      handlers.onEvent?.(event);

      if (event.type === 'thinking_delta') {
        const delta = typeof event.data?.delta === 'string' ? event.data.delta : '';
        if (delta) handlers.onThinkingDelta?.(delta);
      }

      if (event.type === 'content_delta') {
        const delta = typeof event.data?.delta === 'string' ? event.data.delta : '';
        if (delta) handlers.onContentDelta?.(delta);
      }

      if (event.type === 'error') {
        throw new Error(event.error || 'Falha durante stream da IA');
      }

      if (event.type === 'done' && event.data) {
        donePayload = event.data;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let breakIndex = buffer.indexOf('\n');
      while (breakIndex >= 0) {
        const line = buffer.slice(0, breakIndex);
        buffer = buffer.slice(breakIndex + 1);
        processLine(line);
        breakIndex = buffer.indexOf('\n');
      }
    }

    if (buffer.trim()) {
      processLine(buffer);
    }

    if (!donePayload) {
      throw new Error('Stream finalizado sem payload de resposta');
    }

    return donePayload;
  },

  async listKnowledgeSources(): Promise<AiKnowledgeSource[]> {
    const payload = await request<{ data: AiKnowledgeSource[] }>('/knowledge/sources');
    return payload.data || [];
  },

  async bootstrapSystemKnowledge(): Promise<{
    created: number;
    updated: number;
    ingestedSources: number;
  }> {
    const payload = await request<{ data: any }>('/knowledge/bootstrap/system', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return payload.data;
  },

  async ingestKnowledgeSource(sourceId: string): Promise<{
    sourceId: string;
    chunks: number;
    ingestedAt: string;
  }> {
    const payload = await request<{ data: any }>(`/knowledge/sources/${sourceId}/ingest`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return payload.data;
  },

  async listPlans(): Promise<AiPlan[]> {
    const payload = await request<{ data: AiPlan[] }>('/tokens/plans');
    return payload.data || [];
  },

  async createPlan(input: {
    name: string;
    planType?: 'INTERNAL' | 'MUNICIPALITY';
    requestLimitPerMinute?: number;
    monthlyBudgetTokens?: number;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
  }): Promise<AiPlan> {
    const payload = await request<{ data: AiPlan }>('/tokens/plans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async listApiKeys(): Promise<AiApiKey[]> {
    const payload = await request<{ data: AiApiKey[] }>('/tokens/keys');
    return payload.data || [];
  },

  async createApiKey(input: {
    planId: string;
    name: string;
    expiresAt?: string;
    allowedIps?: string[];
  }): Promise<AiApiKey & { rawKey: string }> {
    const payload = await request<{ data: AiApiKey & { rawKey: string } }>('/tokens/keys', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload.data;
  },

  async revokeApiKey(keyId: string): Promise<AiApiKey> {
    const payload = await request<{ data: AiApiKey }>(`/tokens/keys/${keyId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return payload.data;
  },
};
