import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import {
  AiExperience,
  ChatCompletionResult,
  ChatMessageInput,
  ChatResponseFormat,
  ChatThinkingMode,
  ModelToolCall,
  ModelToolDefinition,
} from '../types';

type InferenceProfile = 'interactive' | 'rag' | 'draft' | 'tool' | 'structured';

export class OpenRouterServiceError extends Error {
  constructor(message: string, public statusCode = 502) {
    super(message);
    this.name = 'OpenRouterServiceError';
  }
}

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
}

interface OpenRouterChatOptions {
  think?: ChatThinkingMode;
  profile?: InferenceProfile;
  format?: ChatResponseFormat;
  tools?: ModelToolDefinition[];
  experience?: AiExperience;
}

interface OpenRouterChatStreamCallbacks {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
}

type OpenRouterModelEntry = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

type OpenRouterModelsResponse = {
  data?: OpenRouterModelEntry[];
};

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type OpenRouterMessage = {
  content?: string | Array<{ type?: string; text?: string }>;
  reasoning?: string;
  tool_calls?: Array<{
    id?: string;
    type?: 'function';
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
};

type OpenRouterChatChoice = {
  message?: OpenRouterMessage;
  delta?: OpenRouterMessage;
  finish_reason?: string;
};

type OpenRouterChatResponse = {
  id?: string;
  model?: string;
  choices?: OpenRouterChatChoice[];
  usage?: OpenRouterUsage;
  error?: {
    message?: string;
  };
};

function extractContent(content: OpenRouterMessage['content']): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => (typeof item?.text === 'string' ? item.text : ''))
    .filter(Boolean)
    .join('');
}

function parseToolCalls(
  toolCalls: OpenRouterMessage['tool_calls'] | undefined,
): ModelToolCall[] | undefined {
  if (!Array.isArray(toolCalls) || !toolCalls.length) {
    return undefined;
  }

  const normalized = toolCalls
    .map((toolCall) => {
      const name = toolCall.function?.name?.trim();
      if (!name) {
        return null;
      }

      const rawArguments = toolCall.function?.arguments || '{}';
      let parsedArguments: Record<string, unknown> | string = rawArguments;
      try {
        parsedArguments = JSON.parse(rawArguments);
      } catch {
        parsedArguments = rawArguments;
      }

      return {
        id: toolCall.id,
        type: toolCall.type || 'function',
        function: {
          name,
          arguments: parsedArguments,
        },
      } as ModelToolCall;
    })
    .filter((toolCall): toolCall is ModelToolCall => toolCall !== null);

  return normalized.length ? normalized : undefined;
}

function buildFormatInstruction(format: ChatResponseFormat | undefined): string | undefined {
  if (!format) {
    return undefined;
  }

  if (format === 'json') {
    return 'Responda exclusivamente com JSON valido, sem texto adicional fora do JSON.';
  }

  return `Responda exclusivamente com JSON valido seguindo este schema: ${JSON.stringify(format)}`;
}

function toOpenRouterMessages(
  messages: ChatMessageInput[],
  format?: ChatResponseFormat,
): Array<Record<string, unknown>> {
  const mapped = messages.map((message) => {
    const contentParts: string[] = [];

    if (message.content?.trim()) {
      contentParts.push(message.content.trim());
    }

    if (message.role === 'assistant' && message.thinking?.trim()) {
      contentParts.push(`Pensamento interno ja gerado:\n${message.thinking.trim()}`);
    }

    return {
      role: message.role,
      content: contentParts.join('\n\n'),
      ...(message.toolName ? { name: message.toolName } : {}),
      ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
      ...(message.toolCalls?.length
        ? {
            tool_calls: message.toolCalls.map((toolCall) => ({
              id: toolCall.id,
              type: toolCall.type || 'function',
              function: {
                name: toolCall.function.name,
                arguments:
                  typeof toolCall.function.arguments === 'string'
                    ? toolCall.function.arguments
                    : JSON.stringify(toolCall.function.arguments || {}),
              },
            })),
          }
        : {}),
    };
  });

  const formatInstruction = buildFormatInstruction(format);
  if (!formatInstruction) {
    return mapped;
  }

  return [
    {
      role: 'system',
      content: formatInstruction,
    },
    ...mapped,
  ];
}

function buildCompletionResult(params: {
  model: string;
  content: string;
  thinking?: string;
  usage?: OpenRouterUsage;
  finishReason?: string;
  latencyMs: number;
  toolCalls?: ModelToolCall[];
  profile?: string;
  firstTokenLatencyMs?: number;
}): ChatCompletionResult {
  const inputTokens = params.usage?.prompt_tokens ?? 0;
  const outputTokens = params.usage?.completion_tokens ?? 0;
  const totalTokens = params.usage?.total_tokens ?? inputTokens + outputTokens;

  return {
    content: params.content.trim(),
    model: params.model,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs: params.latencyMs,
    thinking: params.thinking?.trim() || undefined,
    finishReason: params.finishReason,
    toolCalls: params.toolCalls,
    profile: params.profile,
    firstTokenLatencyMs: params.firstTokenLatencyMs,
  };
}

export class OpenRouterService {
  private createClient(openRouterConfig: OpenRouterConfig): AxiosInstance {
    return axios.create({
      baseURL: openRouterConfig.baseUrl || config.openRouterBaseUrl,
      timeout: config.openRouterTimeoutMs,
      headers: {
        Authorization: `Bearer ${openRouterConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.openRouterSiteUrl,
        'X-Title': config.openRouterAppName,
      },
    });
  }

  async listModels(openRouterConfig: OpenRouterConfig): Promise<
    Array<{
      id: string;
      name: string;
      contextLength?: number;
      promptPrice?: string;
      completionPrice?: string;
    }>
  > {
    try {
      const client = this.createClient(openRouterConfig);
      const response = await client.get<OpenRouterModelsResponse>('/models');
      return (response.data?.data || [])
        .map((item) => ({
          id: item.id,
          name: item.name || item.id,
          contextLength: item.context_length,
          promptPrice: item.pricing?.prompt,
          completionPrice: item.pricing?.completion,
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new OpenRouterServiceError(
          error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message ||
            'Falha ao listar modelos da OpenRouter',
          error.response?.status || 502,
        );
      }

      throw error;
    }
  }

  async chat(
    messages: ChatMessageInput[],
    model: string,
    openRouterConfig: OpenRouterConfig,
    requestOptions?: OpenRouterChatOptions,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    try {
      const client = this.createClient(openRouterConfig);
      const response = await client.post<OpenRouterChatResponse>('/chat/completions', {
        model,
        stream: false,
        messages: toOpenRouterMessages(messages, requestOptions?.format),
        ...(requestOptions?.tools?.length ? { tools: requestOptions.tools } : {}),
      });

      if (response.data?.error?.message) {
        throw new OpenRouterServiceError(response.data.error.message, 502);
      }

      const choice = response.data?.choices?.[0];
      const toolCalls = parseToolCalls(choice?.message?.tool_calls);

      return buildCompletionResult({
        model: response.data?.model || model,
        content: extractContent(choice?.message?.content),
        thinking: choice?.message?.reasoning,
        usage: response.data?.usage,
        finishReason: choice?.finish_reason,
        latencyMs: Date.now() - startedAt,
        toolCalls,
        profile: requestOptions?.profile,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new OpenRouterServiceError(
          error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message ||
            'Falha ao consultar a OpenRouter',
          error.response?.status || 502,
        );
      }

      if (error instanceof OpenRouterServiceError) {
        throw error;
      }

      throw new OpenRouterServiceError(
        error instanceof Error ? error.message : 'Falha ao consultar a OpenRouter',
      );
    }
  }

  async chatStream(
    messages: ChatMessageInput[],
    model: string,
    openRouterConfig: OpenRouterConfig,
    requestOptions?: OpenRouterChatOptions,
    callbacks?: OpenRouterChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const startedAt = Date.now();
    try {
      const client = this.createClient(openRouterConfig);
      const response = await client.post<NodeJS.ReadableStream>(
        '/chat/completions',
        {
          model,
          stream: true,
          messages: toOpenRouterMessages(messages, requestOptions?.format),
          ...(requestOptions?.tools?.length ? { tools: requestOptions.tools } : {}),
        },
        {
          responseType: 'stream',
        },
      );

      const stream = response.data as AsyncIterable<Buffer>;
      let buffer = '';
      let content = '';
      let thinking = '';
      let lastChunk: OpenRouterChatResponse | undefined;
      let firstOutputAt: number | undefined;
      let toolCalls: ModelToolCall[] | undefined;

      const handleChunk = (payload: OpenRouterChatResponse): void => {
        const choice = payload.choices?.[0];
        const delta = choice?.delta;
        const contentDelta = extractContent(delta?.content);
        const thinkingDelta = delta?.reasoning || '';
        const toolCallDelta = parseToolCalls(delta?.tool_calls);

        if (contentDelta) {
          firstOutputAt ??= Date.now();
          content += contentDelta;
          callbacks?.onContentDelta?.(contentDelta);
        }

        if (thinkingDelta) {
          firstOutputAt ??= Date.now();
          thinking += thinkingDelta;
          callbacks?.onThinkingDelta?.(thinkingDelta);
        }

        if (toolCallDelta?.length) {
          toolCalls = toolCallDelta;
        }

        lastChunk = payload;
      };

      for await (const piece of stream) {
        buffer += piece.toString('utf8');

        let lineBreak = buffer.indexOf('\n');
        while (lineBreak >= 0) {
          const line = buffer.slice(0, lineBreak).trim();
          buffer = buffer.slice(lineBreak + 1);

          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              break;
            }

            if (data) {
              handleChunk(JSON.parse(data) as OpenRouterChatResponse);
            }
          }

          lineBreak = buffer.indexOf('\n');
        }
      }

      return buildCompletionResult({
        model: lastChunk?.model || model,
        content,
        thinking,
        usage: lastChunk?.usage,
        finishReason: lastChunk?.choices?.[0]?.finish_reason,
        latencyMs: Date.now() - startedAt,
        firstTokenLatencyMs:
          typeof firstOutputAt === 'number' ? firstOutputAt - startedAt : undefined,
        toolCalls,
        profile: requestOptions?.profile,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new OpenRouterServiceError(
          error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message ||
            'Falha ao consultar a OpenRouter',
          error.response?.status || 502,
        );
      }

      if (error instanceof OpenRouterServiceError) {
        throw error;
      }

      throw new OpenRouterServiceError(
        error instanceof Error ? error.message : 'Falha ao consultar a OpenRouter',
      );
    }
  }
}

export const openRouterService = new OpenRouterService();
