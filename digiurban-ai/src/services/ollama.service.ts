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
    const startedAt = Date.now();
    const selectedModel = model || config.ollamaModel;

    const payload = {
      model: selectedModel,
      stream: false,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      options: {
        temperature: config.ollamaTemperature,
        top_p: config.ollamaTopP,
        num_ctx: config.ollamaNumCtx,
      },
    };

    try {
      const response = await this.client.post<OllamaChatResponse>('/api/chat', payload);
      const body = response.data;
      const content = body?.message?.content?.trim();

      if (!content) {
        throw new Error('Empty response from Ollama');
      }

      const inputTokens = body.prompt_eval_count ?? 0;
      const outputTokens = body.eval_count ?? 0;
      const totalTokens = inputTokens + outputTokens;

      return {
        content,
        model: body.model || selectedModel,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs: Date.now() - startedAt,
        finishReason: body.done_reason,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new OllamaServiceError('Tempo limite ao consultar o modelo de IA', 504);
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new OllamaServiceError('Servico de IA indisponivel no momento', 503);
        }

        if (error.response?.status === 404) {
          throw new OllamaServiceError('Modelo de IA nao encontrado no Ollama', 502);
        }
      }

      logger.error('Ollama chat completion failed', {
        model: selectedModel,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
