import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import logger from '../utils/logger';
import {
  ChatCompletionResult,
  ChatMessageInput,
  ChatResponseFormat,
  ChatThinkingMode,
  ModelToolCall,
  ModelToolDefinition,
} from '../types';

type InferenceProfile = 'interactive' | 'rag' | 'draft' | 'tool' | 'structured';

interface LlamaCppChatChoice {
  index?: number;
  message?: {
    role?: string;
    content?: string | null;
    tool_calls?: ModelToolCall[];
  };
  delta?: {
    content?: string | null;
    tool_calls?: ModelToolCall[];
  };
  finish_reason?: string | null;
}

interface LlamaCppUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface LlamaCppChatResponse {
  model?: string;
  choices?: LlamaCppChatChoice[];
  usage?: LlamaCppUsage;
  error?: { message?: string } | string;
}

interface LlamaCppEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string } | string;
}

interface ChatRequestOptions {
  think?: ChatThinkingMode;
  profile?: InferenceProfile;
  format?: ChatResponseFormat;
  tools?: ModelToolDefinition[];
  allowFallback?: boolean;
  maxTokens?: number;
  maxContextTokens?: number;
}

interface ChatStreamCallbacks {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
}

function normalizeToolCalls(toolCalls: unknown): ModelToolCall[] | undefined {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return undefined;

  const normalized: ModelToolCall[] = [];

  for (const item of toolCalls) {
      if (!item || typeof item !== 'object') continue;
      const raw = item as Record<string, unknown>;
      const fn = raw.function && typeof raw.function === 'object'
        ? (raw.function as Record<string, unknown>)
        : {};
      const name = typeof fn.name === 'string' ? fn.name : '';
      if (!name) continue;

      normalized.push({
        id: typeof raw.id === 'string' ? raw.id : undefined,
        type: 'function' as const,
        function: {
          name,
          arguments:
            typeof fn.arguments === 'string'
              ? fn.arguments
              : fn.arguments && typeof fn.arguments === 'object'
                ? (fn.arguments as Record<string, unknown>)
              : {},
        },
      });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (payload?.error?.message) return String(payload.error.message);
    if (typeof payload?.error === 'string') return payload.error;
    if (typeof payload?.message === 'string') return payload.message;
    if (error.code === 'ECONNABORTED') return 'Tempo limite ao consultar o llama.cpp';
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      return 'Servico llama.cpp indisponivel no momento';
    }
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}

function resolveThinkingEnabled(think?: ChatThinkingMode): boolean {
  if (think === true || think === 'medium' || think === 'high') {
    return true;
  }

  if (think === false || think === 'low') {
    return false;
  }

  return config.llamaCppThinkingDefault;
}

function applyQwenThinkingSwitch(
  messages: ChatMessageInput[],
  thinkingEnabled: boolean,
): ChatMessageInput[] {
  if (thinkingEnabled || !config.llamaCppNoThinkPromptSwitch) {
    return messages;
  }

  let lastUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') {
      lastUserIndex = index;
      break;
    }
  }
  if (lastUserIndex < 0) {
    return messages;
  }

  return messages.map((message, index) => {
    if (index !== lastUserIndex || message.content.includes('/no_think')) {
      return message;
    }

    return {
      ...message,
      content: `${message.content}\n\n/no_think`,
    };
  });
}

export class LlamaCppServiceError extends Error {
  constructor(message: string, public statusCode = 502) {
    super(message);
    this.name = 'LlamaCppServiceError';
  }
}

export class LlamaCppService {
  private readonly client: AxiosInstance;
  private readonly embeddingsClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.llamaCppBaseUrl,
      timeout: config.llamaCppTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });
    this.embeddingsClient = axios.create({
      baseURL: config.embeddingsBaseUrl,
      timeout: config.embeddingsTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async warmup(): Promise<void> {
    if (!config.llamaCppWarmupEnabled) return;

    try {
      await this.chat([{ role: 'user', content: config.llamaCppWarmupPrompt }], config.llamaCppModel, {
        profile: 'interactive',
        maxTokens: 8,
      });
      logger.info('llama.cpp model warmed up', { model: config.llamaCppModel });
    } catch (error) {
      logger.warn('llama.cpp warmup failed', {
        model: config.llamaCppModel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async chat(
    messages: ChatMessageInput[],
    model = config.llamaCppModel,
    requestOptions?: ChatRequestOptions,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = this.buildPayload(messages, model, requestOptions, false);

    try {
      const response = await this.client.post<LlamaCppChatResponse>('/v1/chat/completions', payload, {
        timeout: this.resolveTimeout(requestOptions?.profile),
      });
      const errorMessage = this.readPayloadError(response.data);
      if (errorMessage) throw new LlamaCppServiceError(errorMessage, 502);

      const choice = response.data.choices?.[0];
      const content = (choice?.message?.content || '').trim();
      const toolCalls = normalizeToolCalls(choice?.message?.tool_calls);
      if (!content && !toolCalls?.length) {
        throw new LlamaCppServiceError('Resposta vazia do modelo de IA', 502);
      }

      return this.buildResult({
        content,
        model: response.data.model || model,
        usage: response.data.usage,
        latencyMs: Date.now() - startedAt,
        finishReason: choice?.finish_reason || undefined,
        toolCalls,
      });
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async chatStream(
    messages: ChatMessageInput[],
    model = config.llamaCppModel,
    requestOptions?: ChatRequestOptions,
    callbacks?: ChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = this.buildPayload(messages, model, requestOptions, true);

    try {
      const response = await this.client.post<NodeJS.ReadableStream>(
        '/v1/chat/completions',
        payload,
        {
          timeout: this.resolveTimeout(requestOptions?.profile),
          responseType: 'stream',
        },
      );

      const stream = response.data as AsyncIterable<Buffer>;
      let buffer = '';
      const contentParts: string[] = [];
      let finishReason: string | undefined;
      let firstOutputAt: number | undefined;

      const processLine = (rawLine: string): void => {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) return;

        const payloadText = line.slice(5).trim();
        if (!payloadText || payloadText === '[DONE]') return;

        let chunk: LlamaCppChatResponse;
        try {
          chunk = JSON.parse(payloadText) as LlamaCppChatResponse;
        } catch {
          return;
        }

        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          if (firstOutputAt === undefined) firstOutputAt = Date.now();
          contentParts.push(delta);
          callbacks?.onContentDelta?.(delta);
        }

        finishReason = chunk.choices?.[0]?.finish_reason || finishReason;
      };

      for await (const data of stream) {
        buffer += data.toString('utf8');
        let lineBreakIndex = buffer.indexOf('\n');
        while (lineBreakIndex >= 0) {
          const line = buffer.slice(0, lineBreakIndex);
          buffer = buffer.slice(lineBreakIndex + 1);
          processLine(line);
          lineBreakIndex = buffer.indexOf('\n');
        }
      }

      if (buffer.trim()) processLine(buffer);

      const content = contentParts.join('').trim();
      if (!content) {
        throw new LlamaCppServiceError('Resposta vazia do modelo de IA', 502);
      }

      return this.buildResult({
        content,
        model,
        latencyMs: Date.now() - startedAt,
        firstTokenLatencyMs: firstOutputAt ? firstOutputAt - startedAt : undefined,
        finishReason,
      });
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async embed(input: string | string[], model = config.embeddingsModel): Promise<number[][]> {
    const inputs = (Array.isArray(input) ? input : [input]).map((item) => item.trim()).filter(Boolean);
    if (!inputs.length) return [];

    try {
      const response = await this.embeddingsClient.post<LlamaCppEmbeddingResponse>('/v1/embeddings', {
        model,
        input: inputs,
      }, { timeout: config.embeddingsTimeoutMs });

      const errorMessage = this.readPayloadError(response.data);
      if (errorMessage) throw new LlamaCppServiceError(errorMessage, 502);

      return (response.data.data || [])
        .map((item) => item.embedding)
        .filter((item): item is number[] => Array.isArray(item));
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async testConnection(): Promise<void> {
    await this.client.get('/health', { timeout: 5_000 }).catch(async () => {
      await this.client.get('/v1/models', { timeout: 5_000 });
    });
  }

  getRuntimeStatus(): Record<string, unknown> {
    return {
      baseUrl: config.llamaCppBaseUrl,
      model: config.llamaCppModel,
      warmupEnabled: config.llamaCppWarmupEnabled,
      timeoutMs: config.llamaCppTimeoutMs,
      numCtx: config.llamaCppNumCtx,
      maxTokens: config.llamaCppMaxTokens,
      embeddingsEnabled: config.embeddingsEnabled,
      embeddingsBaseUrl: config.embeddingsBaseUrl,
      embeddingsModel: config.embeddingsModel,
    };
  }

  private buildPayload(
    messages: ChatMessageInput[],
    model: string,
    requestOptions: ChatRequestOptions | undefined,
    stream: boolean,
  ): Record<string, unknown> {
    const profile = requestOptions?.profile || 'draft';
    const thinkingEnabled = resolveThinkingEnabled(requestOptions?.think);
    const preparedMessages = applyQwenThinkingSwitch(messages, thinkingEnabled);
    const maxTokens =
      requestOptions?.maxTokens ??
      (profile === 'interactive'
        ? config.llamaCppFastMaxTokens
        : profile === 'rag'
          ? config.llamaCppRagMaxTokens
          : profile === 'tool' || profile === 'structured'
            ? Math.min(config.llamaCppMaxTokens, 180)
            : config.llamaCppMaxTokens);

    const payload: Record<string, unknown> = {
      model,
      stream,
      messages: preparedMessages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.toolName ? { tool_name: message.toolName } : {}),
        ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
        ...(message.toolCalls?.length ? { tool_calls: message.toolCalls } : {}),
      })),
      temperature: config.llamaCppTemperature,
      top_p: config.llamaCppTopP,
      max_tokens: Math.max(16, Math.min(maxTokens, config.llamaCppMaxTokens)),
      chat_template_kwargs: {
        enable_thinking: thinkingEnabled,
      },
    };

    if (requestOptions?.format === 'json') {
      payload.response_format = { type: 'json_object' };
    } else if (requestOptions?.format && typeof requestOptions.format === 'object') {
      payload.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'digiurban_response',
          schema: requestOptions.format,
        },
      };
    }

    if (requestOptions?.tools?.length) {
      payload.tools = requestOptions.tools;
    }

    return payload;
  }

  private buildResult(params: {
    content: string;
    model: string;
    usage?: LlamaCppUsage;
    latencyMs: number;
    firstTokenLatencyMs?: number;
    finishReason?: string;
    toolCalls?: ModelToolCall[];
  }): ChatCompletionResult {
    const inputTokens = params.usage?.prompt_tokens ?? 0;
    const outputTokens = params.usage?.completion_tokens ?? 0;
    const totalTokens = params.usage?.total_tokens ?? inputTokens + outputTokens;
    const tokensPerSecond =
      outputTokens > 0 && params.latencyMs > 0 ? outputTokens / (params.latencyMs / 1000) : undefined;

    return {
      content: params.content,
      model: params.model,
      inputTokens,
      outputTokens,
      totalTokens,
      latencyMs: params.latencyMs,
      firstTokenLatencyMs: params.firstTokenLatencyMs,
      totalDurationMs: params.latencyMs,
      tokensPerSecond,
      finishReason: params.finishReason,
      toolCalls: params.toolCalls,
    };
  }

  private resolveTimeout(profile?: InferenceProfile): number {
    return profile === 'interactive' ? config.llamaCppFastTimeoutMs : config.llamaCppTimeoutMs;
  }

  private readPayloadError(payload: LlamaCppChatResponse | LlamaCppEmbeddingResponse): string | undefined {
    if (!payload.error) return undefined;
    return typeof payload.error === 'string' ? payload.error : payload.error.message;
  }

  private normalizeError(error: unknown): LlamaCppServiceError {
    if (error instanceof LlamaCppServiceError) return error;
    const message = extractErrorMessage(error);
    const statusCode = /tempo limite/i.test(message) ? 504 : /indisponivel|refused|reset|notfound/i.test(message) ? 503 : 502;
    return new LlamaCppServiceError(message, statusCode);
  }
}

export const llamaCppService = new LlamaCppService();
