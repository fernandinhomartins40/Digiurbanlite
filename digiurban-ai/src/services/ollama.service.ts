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

interface OllamaDurations {
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

interface OllamaChatResponse extends OllamaDurations {
  model?: string;
  message?: {
    role?: string;
    content?: string;
    thinking?: string;
    tool_calls?: ModelToolCall[];
  };
  done?: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

interface OllamaChatStreamChunk extends OllamaDurations {
  model?: string;
  message?: {
    role?: string;
    content?: string;
    thinking?: string;
    tool_calls?: ModelToolCall[];
  };
  done?: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

interface OllamaEmbedResponse {
  embeddings?: number[][];
  embedding?: number[];
}

type InferenceProfile = 'interactive' | 'rag' | 'draft' | 'tool' | 'structured';

interface ChatAttemptOptions {
  model: string;
  timeoutMs: number;
  maxTokens: number;
  maxContextTokens: number;
  think: ChatThinkingMode;
  profile: InferenceProfile;
  source: 'primary' | 'fallback';
}

export interface ChatRequestOptions {
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

type ModelRuntimeStats = {
  requests: number;
  successes: number;
  failures: number;
  lastLatencyMs?: number;
  lastTokensPerSecond?: number;
  lastProfile?: string;
  lastUsedAt?: string;
  lastError?: string;
};

type RuntimeStats = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackRequests: number;
  skippedPrimaryRequests: number;
  circuitTrips: number;
  lastPrimaryFailureAt?: string;
  lastPrimaryFailureReason?: string;
  lastSuccessAt?: string;
  primaryCircuitOpenUntil?: string;
  models: Record<string, ModelRuntimeStats>;
};

function nsToMs(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value / 1_000_000;
}

function inferFirstTokenLatencyMs(durations?: OllamaDurations): number | undefined {
  const loadMs = nsToMs(durations?.load_duration) ?? 0;
  const promptEvalMs = nsToMs(durations?.prompt_eval_duration) ?? 0;
  const combined = loadMs + promptEvalMs;
  return combined > 0 ? combined : undefined;
}

function extractThinkingFromContent(rawContent: string): { content: string; thinking?: string } {
  const content = (rawContent || '').trim();
  if (!content) {
    return { content: '' };
  }

  const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
  const thinkingParts: string[] = [];

  let match: RegExpExecArray | null = null;
  while ((match = thinkingRegex.exec(content)) !== null) {
    const extracted = (match[1] || '').trim();
    if (extracted) {
      thinkingParts.push(extracted);
    }
  }

  const sanitizedContent = content.replace(thinkingRegex, '').trim();
  const mergedThinking = thinkingParts.length > 0 ? thinkingParts.join('\n\n') : undefined;

  return {
    content: sanitizedContent,
    thinking: mergedThinking,
  };
}

function mergeThinking(...parts: Array<string | undefined>): string | undefined {
  const merged = parts
    .map((part) => (part || '').trim())
    .filter((part) => part.length > 0)
    .join('\n\n');

  return merged.length > 0 ? merged : undefined;
}

function cloneToolCall(call: ModelToolCall): ModelToolCall {
  return {
    id: call.id,
    type: call.type,
    function: {
      name: call.function?.name || '',
      arguments:
        typeof call.function?.arguments === 'string'
          ? call.function.arguments
          : { ...(call.function?.arguments || {}) },
    },
  };
}

function mergeArguments(
  current: Record<string, unknown> | string,
  incoming: Record<string, unknown> | string,
): Record<string, unknown> | string {
  if (typeof current === 'string' || typeof incoming === 'string') {
    return `${typeof current === 'string' ? current : JSON.stringify(current)}${
      typeof incoming === 'string' ? incoming : JSON.stringify(incoming)
    }`;
  }

  return {
    ...current,
    ...incoming,
  };
}

function normalizeToolCalls(toolCalls: unknown): ModelToolCall[] | undefined {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return undefined;
  }

  const normalized: ModelToolCall[] = [];

  for (const item of toolCalls) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const raw = item as Record<string, unknown>;
    const fn =
      raw.function && typeof raw.function === 'object'
        ? (raw.function as Record<string, unknown>)
        : undefined;

    const name = typeof fn?.name === 'string' ? fn.name : '';
    const args =
      typeof fn?.arguments === 'string'
        ? fn.arguments
        : fn?.arguments && typeof fn.arguments === 'object' && !Array.isArray(fn.arguments)
          ? (fn.arguments as Record<string, unknown>)
          : {};

    if (!name) {
      continue;
    }

    normalized.push({
      id: typeof raw.id === 'string' ? raw.id : undefined,
      type: 'function',
      function: {
        name,
        arguments: args,
      },
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function mergeToolCallDeltas(
  current: ModelToolCall[],
  incoming: ModelToolCall[] | undefined,
): ModelToolCall[] {
  if (!incoming?.length) {
    return current;
  }

  const merged = current.map((item) => cloneToolCall(item));

  incoming.forEach((item, index) => {
    const targetIndex =
      item.id != null ? merged.findIndex((existing) => existing.id === item.id) : index;
    const existing = targetIndex >= 0 ? merged[targetIndex] : undefined;

    if (!existing) {
      merged.push(cloneToolCall(item));
      return;
    }

    existing.type = item.type || existing.type;
    existing.function.name = item.function?.name || existing.function.name;
    existing.function.arguments = mergeArguments(
      existing.function.arguments,
      item.function?.arguments ?? {},
    );
  });

  return merged;
}

function buildResultFromPayload(params: {
  model: string;
  rawContent: string;
  directThinking?: string;
  includeThinking?: boolean;
  toolCalls?: ModelToolCall[];
  promptEvalCount?: number;
  evalCount?: number;
  doneReason?: string;
  durations?: OllamaDurations;
  latencyMs: number;
  firstTokenLatencyMs?: number;
}): ChatCompletionResult {
  const extracted = extractThinkingFromContent(params.rawContent);
  const content = extracted.content;
  const thinking =
    params.includeThinking === false
      ? undefined
      : mergeThinking(params.directThinking, extracted.thinking);
  const toolCalls = normalizeToolCalls(params.toolCalls);

  if (!content && !toolCalls?.length) {
    throw new OllamaServiceError('Resposta vazia do modelo de IA', 502);
  }

  const inputTokens = params.promptEvalCount ?? 0;
  const outputTokens = params.evalCount ?? 0;
  const totalTokens = inputTokens + outputTokens;

  const totalDurationMs = nsToMs(params.durations?.total_duration);
  const loadDurationMs = nsToMs(params.durations?.load_duration);
  const promptEvalDurationMs = nsToMs(params.durations?.prompt_eval_duration);
  const evalDurationMs = nsToMs(params.durations?.eval_duration);
  const tokensPerSecond =
    typeof params.evalCount === 'number' &&
    typeof params.durations?.eval_duration === 'number' &&
    params.durations.eval_duration > 0
      ? params.evalCount / (params.durations.eval_duration / 1_000_000_000)
      : undefined;

  return {
    content,
    model: params.model,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs: params.latencyMs,
    thinking,
    firstTokenLatencyMs:
      params.firstTokenLatencyMs ?? inferFirstTokenLatencyMs(params.durations),
    totalDurationMs,
    loadDurationMs,
    promptEvalDurationMs,
    evalDurationMs,
    tokensPerSecond,
    finishReason: params.doneReason,
    toolCalls,
  };
}

export class OllamaService {
  private readonly client: AxiosInstance;

  private readonly runtimeStats: RuntimeStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbackRequests: 0,
    skippedPrimaryRequests: 0,
    circuitTrips: 0,
    models: {},
  };

  private primaryFailureCount = 0;

  private primaryCircuitOpenUntil = 0;

  private primaryRewarmInFlight = false;

  constructor() {
    this.client = axios.create({
      baseURL: config.ollamaBaseUrl,
      timeout: config.ollamaTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async warmup(): Promise<void> {
    if (!config.ollamaWarmupEnabled) {
      return;
    }

    const models = Array.from(
      new Set(
        (config.ollamaWarmupModels.length ? config.ollamaWarmupModels : [config.ollamaModel])
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );

    for (const model of models) {
      await this.warmupModel(model);
    }
  }

  async chat(
    messages: ChatMessageInput[],
    model?: string,
    requestOptions?: ChatRequestOptions,
  ): Promise<ChatCompletionResult> {
    return this.executeWithFallbackStrategy(
      messages,
      model,
      requestOptions,
      (attempt) => this.executeChat(messages, attempt, requestOptions),
      () => true,
    );
  }

  async chatStream(
    messages: ChatMessageInput[],
    model?: string,
    requestOptions?: ChatRequestOptions,
    callbacks?: ChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    let hasOutput = false;

    const wrappedCallbacks: ChatStreamCallbacks = {
      onThinkingDelta: (delta) => {
        if (delta.trim()) {
          hasOutput = true;
        }
        callbacks?.onThinkingDelta?.(delta);
      },
      onContentDelta: (delta) => {
        if (delta.trim()) {
          hasOutput = true;
        }
        callbacks?.onContentDelta?.(delta);
      },
    };

    return this.executeWithFallbackStrategy(
      messages,
      model,
      requestOptions,
      (attempt) => this.executeChatStream(messages, attempt, requestOptions, wrappedCallbacks),
      () => !hasOutput,
    );
  }

  async embed(
    input: string | string[],
    model = config.embeddingsModel,
    requestOptions?: {
      keepAlive?: string;
      timeoutMs?: number;
    },
  ): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    const normalizedInputs = inputs.map((item) => item.trim()).filter(Boolean);
    if (!normalizedInputs.length) {
      return [];
    }

    const payload: Record<string, unknown> = {
      model,
      input: normalizedInputs,
    };

    const keepAlive = requestOptions?.keepAlive ?? config.embeddingsKeepAlive;
    if (keepAlive) {
      payload.keep_alive = keepAlive;
    }

    const response = await this.client.post<OllamaEmbedResponse>('/api/embed', payload, {
      timeout: requestOptions?.timeoutMs ?? config.embeddingsTimeoutMs,
    });

    if (Array.isArray(response.data?.embeddings)) {
      return response.data.embeddings.filter((item): item is number[] => Array.isArray(item));
    }

    if (Array.isArray(response.data?.embedding)) {
      return [response.data.embedding];
    }

    return [];
  }

  getRuntimeStatus(): Record<string, unknown> {
    return {
      primaryModel: config.ollamaModel,
      fallbackModel: config.ollamaFallbackModel,
      keepAlive: config.ollamaKeepAlive,
      warmupModels: config.ollamaWarmupModels,
      circuitBreaker: {
        isOpen: this.isPrimaryCircuitOpen(),
        failureCount: this.primaryFailureCount,
        openUntil:
          this.primaryCircuitOpenUntil > 0
            ? new Date(this.primaryCircuitOpenUntil).toISOString()
            : undefined,
        threshold: config.ollamaCircuitBreakerFailures,
        cooldownMs: config.ollamaCircuitBreakerCooldownMs,
      },
      stats: this.runtimeStats,
    };
  }

  private async executeWithFallbackStrategy(
    messages: ChatMessageInput[],
    explicitModel: string | undefined,
    requestOptions: ChatRequestOptions | undefined,
    runner: (attempt: ChatAttemptOptions) => Promise<ChatCompletionResult>,
    canRetry: () => boolean,
  ): Promise<ChatCompletionResult> {
    const normalizedExplicitModel = explicitModel?.trim();
    const selectedModel = normalizedExplicitModel || config.ollamaModel;
    const profile = requestOptions?.profile || 'draft';
    const selectedThink = this.resolveThinkingMode(requestOptions?.think, profile);
    const allowFallback = requestOptions?.allowFallback !== false;
    const fallbackModel = config.ollamaFallbackModel.trim();
    const selectedModelIsFallback =
      fallbackModel.length > 0 && selectedModel === fallbackModel;
    const fallbackAllowedForSelection =
      !normalizedExplicitModel || normalizedExplicitModel === config.ollamaModel;
    const attemptedModels: string[] = [];
    const shouldBypassPrimary =
      !selectedModelIsFallback &&
      fallbackAllowedForSelection &&
      allowFallback &&
      fallbackModel.length > 0 &&
      fallbackModel !== selectedModel &&
      this.isPrimaryCircuitOpen();

    this.runtimeStats.totalRequests += 1;

    if (shouldBypassPrimary) {
      this.runtimeStats.skippedPrimaryRequests += 1;
      logger.warn('Primary model circuit breaker open, using fallback directly', {
        primaryModel: selectedModel,
        fallbackModel,
        profile,
      });
    }

    if (selectedModelIsFallback) {
      const fallbackSelectedAttempt = this.resolveAttemptOptions({
        model: selectedModel,
        source: 'fallback',
        think: selectedThink,
        profile,
        requestOptions,
      });
      attemptedModels.push(fallbackSelectedAttempt.model);

      try {
        const result = await runner(fallbackSelectedAttempt);
        this.recordSuccess(
          fallbackSelectedAttempt.model,
          fallbackSelectedAttempt.profile,
          result,
        );
        return {
          ...result,
          profile,
          attemptedModels,
          usedFallback: true,
          circuitBreakerOpen: this.isPrimaryCircuitOpen(),
        };
      } catch (selectedFallbackError) {
        const normalizedSelectedFallbackError = this.normalizeError(
          selectedFallbackError,
          fallbackSelectedAttempt,
        );
        this.recordFailure(
          fallbackSelectedAttempt.model,
          fallbackSelectedAttempt.profile,
          normalizedSelectedFallbackError instanceof Error
            ? normalizedSelectedFallbackError.message
            : String(normalizedSelectedFallbackError),
        );
        throw this.attachAttemptMetadata(
          normalizedSelectedFallbackError,
          attemptedModels,
        );
      }
    }

    if (!shouldBypassPrimary) {
      const primaryAttempt = this.resolveAttemptOptions({
        model: selectedModel,
        source: 'primary',
        think: selectedThink,
        profile,
        requestOptions,
      });
      attemptedModels.push(primaryAttempt.model);

      try {
        const result = await runner(primaryAttempt);
        this.onPrimarySuccess(result, primaryAttempt);
        return {
          ...result,
          profile,
          attemptedModels,
          usedFallback: false,
          circuitBreakerOpen: this.isPrimaryCircuitOpen(),
        };
      } catch (primaryError) {
        const normalizedPrimaryError = this.normalizeError(primaryError, primaryAttempt);
        this.onPrimaryFailure(normalizedPrimaryError, primaryAttempt);

        const shouldRetryWithFallback =
          allowFallback &&
          fallbackAllowedForSelection &&
          fallbackModel.length > 0 &&
          fallbackModel !== selectedModel &&
          this.isRetryableError(primaryError) &&
          canRetry();

        if (!shouldRetryWithFallback) {
          throw this.attachAttemptMetadata(normalizedPrimaryError, attemptedModels);
        }

        logger.warn('Primary Ollama model failed, retrying with fallback model', {
          primaryModel: selectedModel,
          fallbackModel,
          profile,
          reason:
            normalizedPrimaryError instanceof Error
              ? normalizedPrimaryError.message
              : String(normalizedPrimaryError),
        });
      }
    }

    const fallbackAttempt = this.resolveAttemptOptions({
      model: fallbackModel,
      source: 'fallback',
      think: selectedThink,
      profile,
      requestOptions,
    });
    attemptedModels.push(fallbackAttempt.model);
    this.runtimeStats.fallbackRequests += 1;

    try {
      const result = await runner(fallbackAttempt);
      this.recordSuccess(fallbackAttempt.model, fallbackAttempt.profile, result);
      this.rewarmPrimaryInBackground(selectedModel, normalizedExplicitModel);
      return {
        ...result,
        profile,
        attemptedModels,
        usedFallback: true,
        circuitBreakerOpen: this.isPrimaryCircuitOpen(),
      };
    } catch (fallbackError) {
      const normalizedFallbackError = this.normalizeError(fallbackError, fallbackAttempt);
      this.recordFailure(
        fallbackAttempt.model,
        fallbackAttempt.profile,
        normalizedFallbackError instanceof Error
          ? normalizedFallbackError.message
          : String(normalizedFallbackError),
      );
      this.rewarmPrimaryInBackground(selectedModel, normalizedExplicitModel);
      throw this.attachAttemptMetadata(normalizedFallbackError, attemptedModels);
    }
  }

  private resolveAttemptOptions(params: {
    model: string;
    source: 'primary' | 'fallback';
    think: ChatThinkingMode;
    profile: InferenceProfile;
    requestOptions?: ChatRequestOptions;
  }): ChatAttemptOptions {
    const fastProfile = params.profile === 'interactive';
    const baseTimeoutMs =
      params.source === 'fallback'
        ? fastProfile
          ? config.ollamaFallbackFastTimeoutMs
          : config.ollamaRetryTimeoutMs
        : fastProfile
          ? config.ollamaFastTimeoutMs
          : config.ollamaTimeoutMs;
    const baseMaxTokens =
      params.profile === 'tool' || params.profile === 'structured'
        ? Math.min(config.ollamaMaxTokens, 180)
        : params.profile === 'rag'
          ? Math.min(config.ollamaMaxTokens, config.ollamaRagMaxTokens)
        : params.profile === 'draft'
          ? Math.min(config.ollamaMaxTokens, config.ollamaDraftMaxTokens)
        : fastProfile
          ? config.ollamaFastMaxTokens
          : config.ollamaMaxTokens;
    const baseContextTokens =
      params.profile === 'rag'
        ? Math.min(config.ollamaNumCtx, config.ollamaRagNumCtx)
        : params.profile === 'draft'
          ? Math.min(config.ollamaNumCtx, Math.max(config.ollamaFastNumCtx, 2048))
        : fastProfile
          ? config.ollamaFastNumCtx
          : config.ollamaNumCtx;

    return {
      model: params.model,
      timeoutMs: Math.max(5_000, params.requestOptions?.maxTokens ? baseTimeoutMs : baseTimeoutMs),
      maxTokens: Math.max(
        32,
        Math.min(params.requestOptions?.maxTokens ?? baseMaxTokens, config.ollamaMaxTokens),
      ),
      maxContextTokens: Math.max(
        512,
        Math.min(
          params.requestOptions?.maxContextTokens ?? baseContextTokens,
          config.ollamaNumCtx,
        ),
      ),
      think: params.think,
      profile: params.profile,
      source: params.source,
    };
  }

  private resolveThinkingMode(
    requested: ChatThinkingMode | undefined,
    profile: InferenceProfile,
  ): ChatThinkingMode {
    if (requested !== undefined) {
      return requested;
    }

    if (profile === 'tool' || profile === 'structured' || profile === 'interactive') {
      return false;
    }

    return config.ollamaThinking;
  }

  private buildPayload(
    messages: ChatMessageInput[],
    attempt: ChatAttemptOptions,
    params: {
      stream: boolean;
      format?: ChatResponseFormat;
      tools?: ModelToolDefinition[];
    },
  ) {
    const options: Record<string, number> = {
      temperature: config.ollamaTemperature,
      top_p: config.ollamaTopP,
      num_ctx: attempt.maxContextTokens,
      num_predict: attempt.maxTokens,
    };

    if (typeof config.ollamaTopK === 'number') {
      options.top_k = config.ollamaTopK;
    }
    if (typeof config.ollamaMinP === 'number') {
      options.min_p = config.ollamaMinP;
    }
    if (typeof config.ollamaRepeatPenalty === 'number') {
      options.repeat_penalty = config.ollamaRepeatPenalty;
    }
    if (typeof config.ollamaNumThread === 'number') {
      options.num_thread = config.ollamaNumThread;
    }
    if (typeof config.ollamaNumBatch === 'number') {
      options.num_batch = config.ollamaNumBatch;
    }
    if (typeof config.ollamaNumGpu === 'number') {
      options.num_gpu = config.ollamaNumGpu;
    }
    if (typeof config.ollamaMainGpu === 'number') {
      options.main_gpu = config.ollamaMainGpu;
    }

    const payload: Record<string, unknown> = {
      model: attempt.model,
      stream: params.stream,
      think: attempt.think,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.thinking ? { thinking: msg.thinking } : {}),
        ...(msg.toolName ? { tool_name: msg.toolName } : {}),
        ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
        ...(msg.toolCalls?.length ? { tool_calls: msg.toolCalls } : {}),
      })),
      options,
    };

    const keepAlive =
      attempt.source === 'fallback' ? config.ollamaFallbackKeepAlive : config.ollamaKeepAlive;
    if (keepAlive) {
      payload.keep_alive = keepAlive;
    }

    if (params.format) {
      payload.format = params.format;
    }

    if (params.tools?.length) {
      payload.tools = params.tools;
    }

    return payload;
  }

  private async warmupModel(model: string): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.executeChat(
        [{ role: 'user', content: config.ollamaWarmupPrompt }],
        {
          model,
          timeoutMs: Math.max(config.ollamaWarmupTimeoutMs, 15_000),
          maxTokens: 12,
          maxContextTokens: Math.min(config.ollamaFastNumCtx, 1024),
          think: config.ollamaWarmupThink,
          profile: 'interactive',
          source: 'primary',
        },
        { profile: 'interactive' },
      );

      logger.info('Ollama model warmed up', {
        model,
        latencyMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.warn('Ollama model warmup failed', {
        model,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async executeChat(
    messages: ChatMessageInput[],
    attempt: ChatAttemptOptions,
    requestOptions?: ChatRequestOptions,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = this.buildPayload(messages, attempt, {
      stream: false,
      format: requestOptions?.format,
      tools: requestOptions?.tools,
    });

    const response = await this.client.post<OllamaChatResponse>('/api/chat', payload, {
      timeout: attempt.timeoutMs,
    });

    const body = response.data;
    if (body?.error) {
      throw new OllamaServiceError(body.error, 503);
    }

    return buildResultFromPayload({
      model: body.model || attempt.model,
      rawContent: body?.message?.content || '',
      directThinking: body?.message?.thinking?.trim(),
      includeThinking: attempt.think !== false,
      toolCalls: body?.message?.tool_calls,
      promptEvalCount: body.prompt_eval_count,
      evalCount: body.eval_count,
      doneReason: body.done_reason,
      durations: body,
      latencyMs: Date.now() - startedAt,
    });
  }

  private async executeChatStream(
    messages: ChatMessageInput[],
    attempt: ChatAttemptOptions,
    requestOptions?: ChatRequestOptions,
    callbacks?: ChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const allowThinking = attempt.think !== false;
    const payload = this.buildPayload(messages, attempt, {
      stream: true,
      format: requestOptions?.format,
      tools: requestOptions?.tools,
    });

    const response = await this.client.post<NodeJS.ReadableStream>('/api/chat', payload, {
      timeout: attempt.timeoutMs,
      responseType: 'stream',
    });

    const stream = response.data as AsyncIterable<Buffer>;
    let buffer = '';
    let lastChunk: OllamaChatStreamChunk | undefined;
    const contentParts: string[] = [];
    const thinkingParts: string[] = [];
    let toolCalls: ModelToolCall[] = [];
    let firstOutputAt: number | undefined;

    const processLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let chunk: OllamaChatStreamChunk;
      try {
        chunk = JSON.parse(trimmed) as OllamaChatStreamChunk;
      } catch {
        return;
      }

      if (chunk.error) {
        throw new OllamaServiceError(chunk.error, 503);
      }

      const now = Date.now();

      const thinkingDelta = chunk.message?.thinking;
      if (allowThinking && thinkingDelta) {
        if (firstOutputAt === undefined) {
          firstOutputAt = now;
        }
        thinkingParts.push(thinkingDelta);
        callbacks?.onThinkingDelta?.(thinkingDelta);
      }

      const contentDelta = chunk.message?.content;
      if (contentDelta) {
        if (firstOutputAt === undefined) {
          firstOutputAt = now;
        }
        contentParts.push(contentDelta);
        callbacks?.onContentDelta?.(contentDelta);
      }

      const normalizedToolCalls = normalizeToolCalls(chunk.message?.tool_calls);
      if (normalizedToolCalls?.length) {
        if (firstOutputAt === undefined) {
          firstOutputAt = now;
        }
        toolCalls = mergeToolCallDeltas(toolCalls, normalizedToolCalls);
      }

      if (chunk.done) {
        lastChunk = chunk;
      }
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

    if (buffer.trim()) {
      processLine(buffer);
    }

    const rawContent = contentParts.join('').trim();
    const streamThinking = thinkingParts.join('').trim();

    return buildResultFromPayload({
      model: lastChunk?.model || attempt.model,
      rawContent,
      directThinking: streamThinking,
      includeThinking: allowThinking,
      toolCalls,
      promptEvalCount: lastChunk?.prompt_eval_count,
      evalCount: lastChunk?.eval_count,
      doneReason: lastChunk?.done_reason,
      durations: lastChunk,
      latencyMs: Date.now() - startedAt,
      firstTokenLatencyMs:
        typeof firstOutputAt === 'number' ? firstOutputAt - startedAt : undefined,
    });
  }

  private onPrimarySuccess(result: ChatCompletionResult, attempt: ChatAttemptOptions): void {
    this.primaryFailureCount = 0;
    this.primaryCircuitOpenUntil = 0;
    this.recordSuccess(attempt.model, attempt.profile, result);
  }

  private onPrimaryFailure(error: unknown, attempt: ChatAttemptOptions): void {
    const message = error instanceof Error ? error.message : String(error);
    this.recordFailure(attempt.model, attempt.profile, message);

    if (!this.isRetryableError(error)) {
      return;
    }

    this.primaryFailureCount += 1;
    this.runtimeStats.lastPrimaryFailureAt = new Date().toISOString();
    this.runtimeStats.lastPrimaryFailureReason = message;

    if (this.primaryFailureCount >= Math.max(1, config.ollamaCircuitBreakerFailures)) {
      this.primaryCircuitOpenUntil = Date.now() + Math.max(10_000, config.ollamaCircuitBreakerCooldownMs);
      this.runtimeStats.primaryCircuitOpenUntil = new Date(this.primaryCircuitOpenUntil).toISOString();
      this.runtimeStats.circuitTrips += 1;

      logger.warn('Primary model circuit breaker opened', {
        model: attempt.model,
        cooldownMs: config.ollamaCircuitBreakerCooldownMs,
        profile: attempt.profile,
      });
    }
  }

  private recordSuccess(
    model: string,
    profile: InferenceProfile,
    result: ChatCompletionResult,
  ): void {
    this.runtimeStats.successfulRequests += 1;
    this.runtimeStats.lastSuccessAt = new Date().toISOString();
    const stats = this.ensureModelStats(model);
    stats.requests += 1;
    stats.successes += 1;
    stats.lastLatencyMs = result.latencyMs;
    stats.lastTokensPerSecond = result.tokensPerSecond;
    stats.lastProfile = profile;
    stats.lastUsedAt = new Date().toISOString();
  }

  private recordFailure(model: string, profile: InferenceProfile, errorMessage: string): void {
    this.runtimeStats.failedRequests += 1;
    const stats = this.ensureModelStats(model);
    stats.requests += 1;
    stats.failures += 1;
    stats.lastProfile = profile;
    stats.lastUsedAt = new Date().toISOString();
    stats.lastError = errorMessage;
  }

  private ensureModelStats(model: string): ModelRuntimeStats {
    if (!this.runtimeStats.models[model]) {
      this.runtimeStats.models[model] = {
        requests: 0,
        successes: 0,
        failures: 0,
      };
    }

    return this.runtimeStats.models[model];
  }

  private isPrimaryCircuitOpen(): boolean {
    if (this.primaryCircuitOpenUntil <= 0) {
      return false;
    }

    if (Date.now() >= this.primaryCircuitOpenUntil) {
      this.primaryCircuitOpenUntil = 0;
      this.primaryFailureCount = 0;
      this.runtimeStats.primaryCircuitOpenUntil = undefined;
      return false;
    }

    return true;
  }

  private rewarmPrimaryInBackground(selectedModel: string, explicitModel?: string): void {
    if (
      explicitModel ||
      selectedModel !== config.ollamaModel ||
      this.isPrimaryCircuitOpen() ||
      this.primaryRewarmInFlight
    ) {
      return;
    }

    this.primaryRewarmInFlight = true;

    setTimeout(() => {
      this.warmupModel(config.ollamaModel)
        .catch((error) => {
          logger.warn('Failed to rewarm primary model after fallback', {
            model: config.ollamaModel,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          this.primaryRewarmInFlight = false;
        });
    }, 0);
  }

  private normalizeError(error: unknown, attempt: ChatAttemptOptions): Error {
    if (error instanceof OllamaServiceError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const responseStatus = error.response?.status;
      const responseData = error.response?.data;

      if (error.code === 'ECONNABORTED') {
        logger.warn('Ollama request timed out', {
          model: attempt.model,
          timeoutMs: attempt.timeoutMs,
          profile: attempt.profile,
        });
        return new OllamaServiceError('Tempo limite ao consultar o modelo de IA', 504);
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET'
      ) {
        logger.warn('Ollama service unavailable', {
          model: attempt.model,
          code: error.code,
          profile: attempt.profile,
        });
        return new OllamaServiceError('Servico de IA indisponivel no momento', 503);
      }

      if (responseStatus === 404) {
        return new OllamaServiceError('Modelo de IA nao encontrado no Ollama', 502);
      }

      if (typeof responseStatus === 'number' && responseStatus >= 500) {
        logger.warn('Ollama returned server-side error', {
          model: attempt.model,
          status: responseStatus,
          profile: attempt.profile,
          error:
            responseData && typeof responseData === 'object'
              ? JSON.stringify(responseData)
              : String(responseData ?? ''),
        });
        return new OllamaServiceError('Servico de IA sobrecarregado no momento', 503);
      }

      if (typeof responseStatus === 'number' && responseStatus >= 400) {
        logger.warn('Ollama rejected request payload', {
          model: attempt.model,
          status: responseStatus,
          profile: attempt.profile,
          error:
            responseData && typeof responseData === 'object'
              ? JSON.stringify(responseData)
              : String(responseData ?? ''),
        });
        return new OllamaServiceError('Requisicao invalida para o modelo de IA', 502);
      }
    }

    logger.error('Ollama chat completion failed', {
      model: attempt.model,
      profile: attempt.profile,
      error: error instanceof Error ? error.message : String(error),
    });
    return new OllamaServiceError('Falha inesperada ao consultar o modelo de IA', 500);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof OllamaServiceError) {
      return error.statusCode >= 503;
    }

    if (!axios.isAxiosError(error)) {
      return false;
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET'
    ) {
      return true;
    }

    return typeof error.response?.status === 'number' && error.response.status >= 500;
  }

  private attachAttemptMetadata(error: Error, attemptedModels: string[]): Error {
    const target = error as Error & { attemptedModels?: string[] };
    target.attemptedModels = attemptedModels;
    return target;
  }
}

export class OllamaServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'OllamaServiceError';
    this.statusCode = statusCode;
  }
}

export const ollamaService = new OllamaService();
