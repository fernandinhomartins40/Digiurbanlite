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
import { ollamaService, OllamaServiceError } from './ollama.service';
import { openRouterService, OpenRouterServiceError } from './openrouter.service';

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

type ProviderSelection = {
  provider: AiProviderId;
  model: string;
};

function normalizeProvider(value?: string | null): AiProviderId | null {
  if (value === 'OLLAMA' || value === 'OPENROUTER') {
    return value;
  }
  return null;
}

function chooseModelByExperience(params: {
  provider: AiProviderId;
  experience?: AiExperience;
  explicitModel?: string;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  useFallbackModels?: boolean;
}): string {
  if (params.explicitModel?.trim()) {
    return params.explicitModel.trim();
  }

  const experience = params.experience || 'fast';
  const configured =
    experience === 'quality'
      ? params.qualityModel
      : experience === 'contextual'
        ? params.contextualModel || params.fastModel
        : params.fastModel;

  if (configured?.trim()) {
    return configured.trim();
  }

  if (params.provider === 'OPENROUTER') {
    if (experience === 'quality') {
      return config.openRouterQualityModel;
    }
    if (experience === 'contextual') {
      return config.openRouterContextualModel;
    }
    return config.openRouterFastModel;
  }

  if (experience === 'quality') {
    return config.ollamaQualityModel;
  }

  return config.ollamaModel;
}

function normalizeProviderError(error: unknown): AiProviderServiceError {
  if (error instanceof AiProviderServiceError) {
    return error;
  }

  if (error instanceof OllamaServiceError || error instanceof OpenRouterServiceError) {
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
    return aiProviderConfigService.updateSettings(tenantId, input);
  }

  async listModels(params: {
    tenantId: string;
    provider: AiProviderId;
    openRouterApiKey?: string;
    openRouterBaseUrl?: string;
  }): Promise<
    Array<{
      id: string;
      name: string;
      contextLength?: number;
      promptPrice?: string;
      completionPrice?: string;
    }>
  > {
    try {
      if (params.provider === 'OLLAMA') {
        return [
          { id: config.ollamaModel, name: config.ollamaModel },
          { id: config.ollamaQualityModel, name: config.ollamaQualityModel },
          { id: config.ollamaFallbackModel, name: config.ollamaFallbackModel },
        ];
      }

      const resolved = await aiProviderConfigService.getResolvedSettings(params.tenantId);
      const apiKey = params.openRouterApiKey?.trim() || resolved.openRouterApiKey;
      if (!apiKey) {
        throw new AiProviderServiceError('Uma chave da OpenRouter e obrigatoria para listar modelos', 400);
      }

      return await openRouterService.listModels({
        apiKey,
        baseUrl: params.openRouterBaseUrl?.trim() || resolved.openRouterBaseUrl || config.openRouterBaseUrl,
      });
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  async testConnection(params: {
    tenantId: string;
    provider: AiProviderId;
    openRouterApiKey?: string;
    openRouterBaseUrl?: string;
  }): Promise<{
    provider: AiProviderId;
    ok: boolean;
    message: string;
    modelsChecked?: number;
  }> {
    try {
      if (params.provider === 'OLLAMA') {
        return {
          provider: 'OLLAMA',
          ok: true,
          message: 'Ollama local configurado como provider',
        };
      }

      const models = await this.listModels(params);
      return {
        provider: 'OPENROUTER',
        ok: true,
        message: 'Conexao com OpenRouter validada',
        modelsChecked: models.length,
      };
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  async chat(
    messages: ChatMessageInput[],
    options: ProviderChatOptions,
  ): Promise<ChatCompletionResult> {
    return this.execute(messages, options, false);
  }

  async chatStream(
    messages: ChatMessageInput[],
    options: ProviderChatOptions,
    callbacks?: ProviderChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    return this.execute(messages, options, true, callbacks);
  }

  getRuntimeStatus(): Record<string, unknown> {
    return {
      defaults: {
        provider: 'OLLAMA',
        ollamaModel: config.ollamaModel,
        ollamaQualityModel: config.ollamaQualityModel,
        openRouterFastModel: config.openRouterFastModel,
        openRouterContextualModel: config.openRouterContextualModel,
        openRouterQualityModel: config.openRouterQualityModel,
      },
    };
  }

  private async execute(
    messages: ChatMessageInput[],
    options: ProviderChatOptions,
    stream: boolean,
    callbacks?: ProviderChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    const settings = await aiProviderConfigService.getResolvedSettings(options.tenantId);
    const primaryProvider = settings.isEnabled ? settings.provider : 'OLLAMA';
    const fallbackProvider = settings.isEnabled ? settings.fallbackProvider : null;

    const primarySelection = this.resolveSelection({
      provider: primaryProvider,
      experience: options.experience,
      explicitModel: options.model,
      fastModel: settings.fastModel,
      contextualModel: settings.contextualModel,
      qualityModel: settings.qualityModel,
    });

    try {
      return await this.dispatch(primarySelection, messages, settings, options, stream, callbacks);
    } catch (primaryError) {
      if (!options.allowFallback || !fallbackProvider || fallbackProvider === primaryProvider) {
        throw normalizeProviderError(primaryError);
      }

      const fallbackSelection = this.resolveSelection({
        provider: fallbackProvider,
        experience: options.experience,
        explicitModel: undefined,
        fastModel: settings.fallbackFastModel,
        contextualModel: settings.fallbackContextualModel,
        qualityModel: settings.fallbackQualityModel,
      });

      const rawAttemptedModels = (primaryError as { attemptedModels?: unknown } | undefined)?.attemptedModels;
      const primaryAttemptedModels = Array.isArray(rawAttemptedModels)
        ? rawAttemptedModels.filter(
            (attemptedModel): attemptedModel is string => typeof attemptedModel === 'string' && attemptedModel.trim().length > 0,
          )
        : [primarySelection.model];

      try {
        const fallbackResult = await this.dispatch(
          fallbackSelection,
          messages,
          settings,
          {
            ...options,
            allowFallback: fallbackSelection.provider === 'OLLAMA' ? true : false,
          },
          stream,
          callbacks,
        );

        return {
          ...fallbackResult,
          attemptedModels: [
            ...(fallbackResult.attemptedModels || []),
            ...primaryAttemptedModels.filter(
              (attemptedModel) => !(fallbackResult.attemptedModels || []).includes(attemptedModel),
            ),
          ],
          usedFallback: true,
        };
      } catch (fallbackError) {
        throw normalizeProviderError(fallbackError);
      }
    }
  }

  private resolveSelection(params: {
    provider: AiProviderId;
    experience?: AiExperience;
    explicitModel?: string;
    fastModel?: string | null;
    contextualModel?: string | null;
    qualityModel?: string | null;
  }): ProviderSelection {
    return {
      provider: params.provider,
      model: chooseModelByExperience({
        provider: params.provider,
        experience: params.experience,
        explicitModel: params.explicitModel,
        fastModel: params.fastModel,
        contextualModel: params.contextualModel,
        qualityModel: params.qualityModel,
      }),
    };
  }

  private async dispatch(
    selection: ProviderSelection,
    messages: ChatMessageInput[],
    settings: Awaited<ReturnType<typeof aiProviderConfigService.getResolvedSettings>>,
    options: ProviderChatOptions,
    stream: boolean,
    callbacks?: ProviderChatStreamCallbacks,
  ): Promise<ChatCompletionResult> {
    if (selection.provider === 'OLLAMA') {
      if (stream) {
        return ollamaService.chatStream(
          messages,
          selection.model,
          {
            think: options.think,
            profile: options.profile,
            format: options.format,
            tools: options.tools,
            allowFallback: options.allowFallback,
          },
          callbacks,
        );
      }

      return ollamaService.chat(messages, selection.model, {
        think: options.think,
        profile: options.profile,
        format: options.format,
        tools: options.tools,
        allowFallback: options.allowFallback,
      });
    }

    if (!settings.openRouterApiKey) {
      throw new AiProviderServiceError('A chave da OpenRouter nao esta configurada', 400);
    }

    if (stream) {
      return openRouterService.chatStream(
        messages,
        selection.model,
        {
          apiKey: settings.openRouterApiKey,
          baseUrl: settings.openRouterBaseUrl || config.openRouterBaseUrl,
        },
        {
          think: options.think,
          profile: options.profile,
          format: options.format,
          tools: options.tools,
          experience: options.experience,
        },
        callbacks,
      );
    }

    return openRouterService.chat(
      messages,
      selection.model,
      {
        apiKey: settings.openRouterApiKey,
        baseUrl: settings.openRouterBaseUrl || config.openRouterBaseUrl,
      },
      {
        think: options.think,
        profile: options.profile,
        format: options.format,
        tools: options.tools,
        experience: options.experience,
      },
    );
  }
}

export const aiProviderService = new AiProviderService();
