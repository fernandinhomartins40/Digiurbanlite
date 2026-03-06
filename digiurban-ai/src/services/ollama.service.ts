import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import logger from '../utils/logger';
import { ChatCompletionResult, ChatMessageInput } from '../types';

interface OllamaChatResponse {
  model?: string;
  message?: {
    role?: string;
    content?: string;
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

  async chat(messages: ChatMessageInput[], model?: string): Promise<ChatCompletionResult> {
    const selectedModel = model || config.ollamaModel;
    const primaryAttempt: ChatAttemptOptions = {
      model: selectedModel,
      timeoutMs: config.ollamaTimeoutMs,
      maxTokens: config.ollamaMaxTokens,
      maxContextTokens: config.ollamaNumCtx,
    };

    try {
      return await this.executeChat(messages, primaryAttempt);
    } catch (primaryError) {
      const normalizedPrimaryError = this.normalizeError(primaryError, primaryAttempt);
      const fallbackModel = config.ollamaFallbackModel.trim();
      const shouldRetryWithFallback =
        !model &&
        fallbackModel.length > 0 &&
        fallbackModel !== selectedModel &&
        this.isRetryableError(primaryError);

      if (!shouldRetryWithFallback) {
        throw normalizedPrimaryError;
      }

      const fallbackAttempt: ChatAttemptOptions = {
        model: fallbackModel,
        timeoutMs: Math.max(config.ollamaRetryTimeoutMs, 10_000),
        maxTokens: Math.min(config.ollamaMaxTokens, 220),
        maxContextTokens: Math.min(config.ollamaNumCtx, 3072),
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
        return await this.executeChat(messages, fallbackAttempt);
      } catch (fallbackError) {
        throw this.normalizeError(fallbackError, fallbackAttempt);
      }
    }
  }

  private async executeChat(
    messages: ChatMessageInput[],
    attempt: ChatAttemptOptions,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    const payload = {
      model: attempt.model,
      stream: false,
      think: config.ollamaThinking,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      options: {
        temperature: config.ollamaTemperature,
        top_p: config.ollamaTopP,
        num_ctx: attempt.maxContextTokens,
        num_predict: attempt.maxTokens,
      },
    };

    const response = await this.client.post<OllamaChatResponse>('/api/chat', payload, {
      timeout: attempt.timeoutMs,
    });

    const body = response.data;
    const content = body?.message?.content?.trim();

    if (!content) {
      throw new OllamaServiceError('Resposta vazia do modelo de IA', 502);
    }

    const inputTokens = body.prompt_eval_count ?? 0;
    const outputTokens = body.eval_count ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      content,
      model: body.model || attempt.model,
      inputTokens,
      outputTokens,
      totalTokens,
      latencyMs: Date.now() - startedAt,
      finishReason: body.done_reason,
    };
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
