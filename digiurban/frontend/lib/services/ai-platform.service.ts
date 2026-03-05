import { getFullApiUrl } from '@/lib/api-config';

export interface AiConversation {
  id: string;
  title: string | null;
  userId: string;
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
  createdAt: string;
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
      body?.details || body?.error || body?.message || `Falha na requisição (${response.status})`;
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

  async sendMessage(conversationId: string, input: {
    content: string;
    model?: string;
    extraInstruction?: string;
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
    extraInstruction?: string;
  }): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    contextSources: number;
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
