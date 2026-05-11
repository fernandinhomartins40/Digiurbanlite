import { config } from '../config/config';
import {
  AiExperience,
  AiProviderId,
  ChatCompletionResult,
  ChatMessageInput,
  ChatResponseFormat,
  ChatThinkingMode,
  ModelToolDefinition,
} from '../types';
import { aiProviderConfigService, UpdateAiProviderSettingsInput } from './ai-provider-config.service';
import { llamaCppService, LlamaCppServiceError } from './llamacpp.service';

type InferenceProfile = 'interactive' | 'rag' | 'draft' | 'tool' | 'structured';

export class AiProviderServiceError extends Error {
  constructor(message: string, public statusCode = 502) {
    super(message);
    this.name = 'AiProviderServiceError';
  }
}

interface ProviderChatOptions {
  tenantId: string;
  model?: string;
  think?: ChatThinkingMode;
  profile?: InferenceProfile;
  experience?: AiExperience;
  format?: ChatResponseFormat;
  tools?: ModelToolDefinition[];
  allowFallback?: boolean;
}

interface ProviderChatStreamCallbacks {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
}

function normalizeProviderError(error: unknown): AiProviderServiceError {
  if (error instanceof AiProviderServiceError) return error;
  if (error instanceof LlamaCppServiceError) {
    return new AiProviderServiceError(error.message, error.statusCode);
  }
  return new AiProviderServiceError(
    error instanceof Error ? error.message : 'Falha no provider de IA',
    502,
  );
}

export class AiProviderService {
  async getSettings(tenantId: string) {
    return aiProviderConfigService.getSettings(tenantId);
  }

  async updateSettings(tenantId: string, input: UpdateAiProviderSettingsInput) {
    return aiProviderConfigService.updateSettings(tenantId, {
      ...input,
      provider: 'LLAMACPP',
      fallbackProvider: null,
    });
  }

  async listModels(_params: {
    tenantId: string;
    provider: AiProviderId;
  }): Promise<Array<{ id: string; name: string; huggingFaceId?: string; isOpenSource?: boolean; contextLength?: number }>> {
    return [
      {
        id: config.llamaCppModel,
        name: 'Qwen3 1.7B Instruct GGUF (llama.cpp)',
        huggingFaceId: 'ggml-org/Qwen3-1.7B-GGUF:Q4_K_M',
        isOpenSource: true,
        contextLength: config.llamaCppNumCtx,
      },
    ];
  }

  async testConnection(_params: {
    tenantId: string;
    provider: AiProviderId;
  }): Promise<{
    provider: AiProviderId;
    ok: boolean;
    message: string;
    modelsChecked?: number;
  }> {
    try {
      await llamaCppService.testConnection();
      return {
        provider: 'LLAMACPP',
        ok: true,
        message: 'Conexao com llama.cpp validada',
        modelsChecked: 1,
      };
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  async chat(
    messages: ChatMessageInput[],
    options: ProviderChatOptions,
  ): Promise<ChatCompletionResult> {
    try {
      const settings = await aiProviderConfigService.getResolvedSettings(options.tenantId);
      const model = options.model || settings.fastModel || config.llamaCppModel;
      return llamaCppService.chat(messages, model, {
        think: options.think,
        profile: options.profile,
        format: options.format,
        tools: options.tools,
        allowFallback: false,
      });
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  async chatStream(
    messages: ChatMessageInput[],
    options: ProviderChatOptions,
    callbacks?: ProviderChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    try {
      const settings = await aiProviderConfigService.getResolvedSettings(options.tenantId);
      const model = options.model || settings.fastModel || config.llamaCppModel;
      return llamaCppService.chatStream(
        messages,
        model,
        {
          think: options.think,
          profile: options.profile,
          format: options.format,
          tools: options.tools,
          allowFallback: false,
        },
        callbacks,
      );
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  getRuntimeStatus(): Record<string, unknown> {
    return {
      provider: 'LLAMACPP',
      model: config.llamaCppModel,
      baseUrl: config.llamaCppBaseUrl,
    };
  }
}

export const aiProviderService = new AiProviderService();
