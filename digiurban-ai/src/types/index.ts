import { Request } from 'express';
import { AiApiKey } from '@prisma/client';

export interface AuthenticatedProxyRequest extends Request {
  auth: {
    tenantId: string;
    userId: string;
    userName?: string;
    departmentId?: string;
    viaServiceToken: boolean;
  };
}

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKeyAuth: {
    tenantId: string;
    apiKey: AiApiKey;
    ipAddress?: string;
  };
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  thinking?: string;
  toolName?: string;
  toolCallId?: string;
  toolCalls?: ModelToolCall[];
}

export interface StructuredOutputSchema {
  [key: string]: unknown;
}

export type ChatThinkingMode = boolean | 'low' | 'medium' | 'high';

export type ChatResponseFormat = 'json' | StructuredOutputSchema;

export type AiExperience = 'fast' | 'contextual' | 'quality';
export type AiProviderId = 'LLAMACPP';

export type InferenceRouteKind =
  | 'free_short'
  | 'free_draft'
  | 'context_navigation'
  | 'context_metrics'
  | 'context_documents'
  | 'web_lookup'
  | 'quality';

export interface ModelToolCall {
  id?: string;
  type?: 'function';
  function: {
    name: string;
    arguments: Record<string, unknown> | string;
  };
}

export interface ModelToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: StructuredOutputSchema;
  };
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  thinking?: string;
  firstTokenLatencyMs?: number;
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalDurationMs?: number;
  evalDurationMs?: number;
  tokensPerSecond?: number;
  finishReason?: string;
  toolCalls?: ModelToolCall[];
  profile?: string;
  attemptedModels?: string[];
  usedFallback?: boolean;
  circuitBreakerOpen?: boolean;
  routeKind?: InferenceRouteKind;
  deterministicResponse?: boolean;
}
