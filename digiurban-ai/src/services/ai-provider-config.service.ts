import prisma from '../utils/prisma';
import { config } from '../config/config';
import { AiProviderId } from '../types';

export interface AiProviderSettingsView {
  provider: AiProviderId;
  fallbackProvider: null;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled: boolean;
  updatedAt?: string | null;
}

export interface AiProviderSettingsResolved extends AiProviderSettingsView {}

export interface UpdateAiProviderSettingsInput {
  provider: AiProviderId;
  fallbackProvider?: null;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled?: boolean;
}

function normalizeOptionalModel(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export class AiProviderConfigService {
  async getSettings(tenantId: string): Promise<AiProviderSettingsView> {
    const record = await prisma.aiProviderSettings.findUnique({
      where: { tenantId },
    });

    return {
      provider: 'LLAMACPP',
      fallbackProvider: null,
      fastModel: record?.fastModel || config.llamaCppModel,
      contextualModel: record?.contextualModel || config.llamaCppModel,
      qualityModel: record?.qualityModel || config.llamaCppModel,
      fallbackFastModel: null,
      fallbackContextualModel: null,
      fallbackQualityModel: null,
      isEnabled: record?.isEnabled ?? true,
      updatedAt: record?.updatedAt?.toISOString() || null,
    };
  }

  async getResolvedSettings(tenantId: string): Promise<AiProviderSettingsResolved> {
    return this.getSettings(tenantId);
  }

  async updateSettings(
    tenantId: string,
    input: UpdateAiProviderSettingsInput,
  ): Promise<AiProviderSettingsView> {
    await prisma.aiProviderSettings.upsert({
      where: { tenantId },
      update: {
        provider: 'LLAMACPP',
        fallbackProvider: null,
        fastModel: normalizeOptionalModel(input.fastModel) || config.llamaCppModel,
        contextualModel: normalizeOptionalModel(input.contextualModel) || config.llamaCppModel,
        qualityModel: normalizeOptionalModel(input.qualityModel) || config.llamaCppModel,
        fallbackFastModel: null,
        fallbackContextualModel: null,
        fallbackQualityModel: null,
        isEnabled: input.isEnabled ?? true,
      },
      create: {
        tenantId,
        provider: 'LLAMACPP',
        fallbackProvider: null,
        fastModel: normalizeOptionalModel(input.fastModel) || config.llamaCppModel,
        contextualModel: normalizeOptionalModel(input.contextualModel) || config.llamaCppModel,
        qualityModel: normalizeOptionalModel(input.qualityModel) || config.llamaCppModel,
        fallbackFastModel: null,
        fallbackContextualModel: null,
        fallbackQualityModel: null,
        isEnabled: input.isEnabled ?? true,
      },
    });

    return this.getSettings(tenantId);
  }
}

export const aiProviderConfigService = new AiProviderConfigService();
