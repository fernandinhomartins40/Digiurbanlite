import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import logger from '../utils/logger';
import { ChatCompletionResult, ChatMessageInput } from '../types';

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
  };
  done?: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

interface ChatAttemptOptions {
  model: string;
  timeoutMs: number;
  maxTokens: number;
  maxContextTokens: number;
  think: boolean;
}

interface ChatRequestOptions {
  think?: boolean;
}

interface ChatStreamCallbacks {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
}

function nsToMs(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value / 1_000_000;
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

function buildResultFromPayload(params: {
  model: string;
  rawContent: string;
  directThinking?: string;
  promptEvalCount?: number;
  evalCount?: number;
  doneReason?: string;
  durations?: OllamaDurations;
  latencyMs: number;
}): ChatCompletionResult {
  const extracted = extractThinkingFromContent(params.rawContent);
  const content = extracted.content;
  const thinking = mergeThinking(params.directThinking, extracted.thinking);

  if (!content) {
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
    totalDurationMs,
    loadDurationMs,
    promptEvalDurationMs,
    evalDurationMs,
    tokensPerSecond,
    finishReason: params.doneReason,
  };
}

export class OllamaService {
  private readonly client: AxiosInstance;

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
      new Set([config.ollamaModel, config.ollamaFallbackModel].map((item) => item.trim()).filter(Boolean)),
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
    const selectedModel = model || config.ollamaModel;
    const selectedThink =
      typeof requestOptions?.think === 'boolean' ? requestOptions.think : config.ollamaThinking;

    return this.executeWithRetry(
      selectedModel,
      selectedThink,
      model,
      (attempt) => this.executeChat(messages, attempt),
      () => true,
    );
  }

  async chatStream(
    messages: ChatMessageInput[],
    model?: string,
    requestOptions?: ChatRequestOptions,
    callbacks?: ChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const selectedModel = model || config.ollamaModel;
    const selectedThink =
      typeof requestOptions?.think === 'boolean' ? requestOptions.think : config.ollamaThinking;
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

    return this.executeWithRetry(
      selectedModel,
      selectedThink,
      model,
      (attempt) => this.executeChatStream(messages, attempt, wrappedCallbacks),
      () => !hasOutput,
    );
  }

  private async executeWithRetry(
    selectedModel: string,
    selectedThink: boolean,
    explicitModel: string | undefined,
    runner: (attempt: ChatAttemptOptions) => Promise<ChatCompletionResult>,
    canRetry: () => boolean,
  ): Promise<ChatCompletionResult> {
    const primaryAttempt: ChatAttemptOptions = {
      model: selectedModel,
      timeoutMs: config.ollamaTimeoutMs,
      maxTokens: config.ollamaMaxTokens,
      maxContextTokens: config.ollamaNumCtx,
      think: selectedThink,
    };

    try {
      return await runner(primaryAttempt);
    } catch (primaryError) {
      const normalizedPrimaryError = this.normalizeError(primaryError, primaryAttempt);
      const fallbackModel = config.ollamaFallbackModel.trim();
      const shouldRetryWithFallback =
        !explicitModel &&
        fallbackModel.length > 0 &&
        fallbackModel !== selectedModel &&
        this.isRetryableError(primaryError) &&
        canRetry();

      if (!shouldRetryWithFallback) {
        throw normalizedPrimaryError;
      }

      const fallbackAttempt: ChatAttemptOptions = {
        model: fallbackModel,
        timeoutMs: Math.max(config.ollamaRetryTimeoutMs, 10_000),
        maxTokens: Math.min(config.ollamaMaxTokens, 220),
        maxContextTokens: Math.min(config.ollamaNumCtx, 3072),
        think: selectedThink,
      };

      logger.warn('Primary Ollama model failed, retrying with fallback model', {
        primaryModel: selectedModel,
        fallbackModel,
        reason:
          normalizedPrimaryError instanceof Error
            ? normalizedPrimaryError.message
            : String(normalizedPrimaryError),
      });

      try {
        return await runner(fallbackAttempt);
      } catch (fallbackError) {
        throw this.normalizeError(fallbackError, fallbackAttempt);
      }
    }
  }

  private buildPayload(messages: ChatMessageInput[], attempt: ChatAttemptOptions, stream: boolean) {
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
      stream,
      think: attempt.think,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      options,
    };

    if (config.ollamaKeepAlive) {
      payload.keep_alive = config.ollamaKeepAlive;
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
          maxContextTokens: Math.min(config.ollamaNumCtx, 1024),
          think: config.ollamaWarmupThink,
        },
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
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = this.buildPayload(messages, attempt, false);

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
    callbacks?: ChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = this.buildPayload(messages, attempt, true);

    const response = await this.client.post<NodeJS.ReadableStream>('/api/chat', payload, {
      timeout: attempt.timeoutMs,
      responseType: 'stream',
    });

    const stream = response.data as AsyncIterable<Buffer>;
    let buffer = '';
    let lastChunk: OllamaChatStreamChunk | undefined;
    const contentParts: string[] = [];
    const thinkingParts: string[] = [];

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

      const thinkingDelta = chunk.message?.thinking;
      if (thinkingDelta) {
        thinkingParts.push(thinkingDelta);
        callbacks?.onThinkingDelta?.(thinkingDelta);
      }

      const contentDelta = chunk.message?.content;
      if (contentDelta) {
        contentParts.push(contentDelta);
        callbacks?.onContentDelta?.(contentDelta);
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
      promptEvalCount: lastChunk?.prompt_eval_count,
      evalCount: lastChunk?.eval_count,
      doneReason: lastChunk?.done_reason,
      durations: lastChunk,
      latencyMs: Date.now() - startedAt,
    });
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
