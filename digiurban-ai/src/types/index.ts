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
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  finishReason?: string;
}
