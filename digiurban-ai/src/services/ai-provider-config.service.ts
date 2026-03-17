import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import prisma from '../utils/prisma';
import { config } from '../config/config';
import { AiProviderId } from '../types';

export interface AiProviderSettingsView {
  provider: AiProviderId;
  fallbackProvider: AiProviderId | null;
  openRouterBaseUrl: string;
  hasOpenRouterApiKey: boolean;
  openRouterApiKeyStatus: 'missing' | 'valid' | 'broken';
  openRouterApiKeyLast4?: string | null;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled: boolean;
  updatedAt?: string | null;
}

export interface AiProviderSettingsResolved {
  provider: AiProviderId;
  fallbackProvider: AiProviderId | null;
  openRouterBaseUrl: string;
  openRouterApiKey?: string;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled: boolean;
}

export interface UpdateAiProviderSettingsInput {
  provider: AiProviderId;
  fallbackProvider?: AiProviderId | null;
  openRouterApiKey?: string;
  openRouterBaseUrl?: string;
  fastModel?: string | null;
  contextualModel?: string | null;
  qualityModel?: string | null;
  fallbackFastModel?: string | null;
  fallbackContextualModel?: string | null;
  fallbackQualityModel?: string | null;
  isEnabled?: boolean;
}

const OPENROUTER_PROVIDERS: AiProviderId[] = ['OPENROUTER'];

function deriveEncryptionKey(): Buffer {
  return createHash('sha256').update(config.aiProviderEncryptionKey).digest();
}

function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptSecret(value: string): string {
  const combined = Buffer.from(value, 'base64');
  const iv = combined.subarray(0, 12);
  const tag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function normalizeOptionalModel(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function requiresOpenRouterKey(provider: AiProviderId | null | undefined): boolean {
  return typeof provider === 'string' && OPENROUTER_PROVIDERS.includes(provider);
}

function getSavedOpenRouterKeyState(
  encryptedValue?: string | null,
): { status: 'missing' | 'valid' | 'broken'; value?: string } {
  if (!encryptedValue) {
    return { status: 'missing' };
  }

  try {
    return {
      status: 'valid',
      value: decryptSecret(encryptedValue),
    };
  } catch {
    return { status: 'broken' };
  }
}

export class AiProviderConfigService {
  async getSettings(tenantId: string): Promise<AiProviderSettingsView> {
    const record = await prisma.aiProviderSettings.findUnique({
      where: { tenantId },
    });
    const savedKeyState = getSavedOpenRouterKeyState(record?.openRouterApiKeyEncrypted);

    return {
      provider: (record?.provider as AiProviderId | undefined) || 'OLLAMA',
      fallbackProvider: (record?.fallbackProvider as AiProviderId | null | undefined) || null,
      openRouterBaseUrl: record?.openRouterBaseUrl || config.openRouterBaseUrl,
      hasOpenRouterApiKey: savedKeyState.status === 'valid',
      openRouterApiKeyStatus: savedKeyState.status,
      openRouterApiKeyLast4: record?.openRouterApiKeyLast4,
      fastModel: record?.fastModel || null,
      contextualModel: record?.contextualModel || null,
      qualityModel: record?.qualityModel || null,
      fallbackFastModel: record?.fallbackFastModel || null,
      fallbackContextualModel: record?.fallbackContextualModel || null,
      fallbackQualityModel: record?.fallbackQualityModel || null,
      isEnabled: record?.isEnabled ?? true,
      updatedAt: record?.updatedAt?.toISOString() || null,
    };
  }

  async getResolvedSettings(tenantId: string): Promise<AiProviderSettingsResolved> {
    const record = await prisma.aiProviderSettings.findUnique({
      where: { tenantId },
    });
    const savedKeyState = getSavedOpenRouterKeyState(record?.openRouterApiKeyEncrypted);

    if (savedKeyState.status === 'broken') {
      throw new Error(
        'Nao foi possivel descriptografar a chave da OpenRouter salva. Salve a configuracao novamente no Super Admin.',
      );
    }

    return {
      provider: (record?.provider as AiProviderId | undefined) || 'OLLAMA',
      fallbackProvider: (record?.fallbackProvider as AiProviderId | null | undefined) || null,
      openRouterBaseUrl: record?.openRouterBaseUrl || config.openRouterBaseUrl,
      openRouterApiKey: savedKeyState.value,
      fastModel: record?.fastModel || null,
      contextualModel: record?.contextualModel || null,
      qualityModel: record?.qualityModel || null,
      fallbackFastModel: record?.fallbackFastModel || null,
      fallbackContextualModel: record?.fallbackContextualModel || null,
      fallbackQualityModel: record?.fallbackQualityModel || null,
      isEnabled: record?.isEnabled ?? true,
    };
  }

  async updateSettings(
    tenantId: string,
    input: UpdateAiProviderSettingsInput,
  ): Promise<AiProviderSettingsView> {
    const current = await prisma.aiProviderSettings.findUnique({
      where: { tenantId },
    });

    const provider = input.provider;
    const fallbackProvider = input.fallbackProvider ?? null;
    const currentEncryptedKey = current?.openRouterApiKeyEncrypted || null;
    const currentKeyState = getSavedOpenRouterKeyState(currentEncryptedKey);
    const normalizedApiKey = input.openRouterApiKey?.trim();
    const nextEncryptedKey =
      normalizedApiKey && normalizedApiKey.length > 0
        ? encryptSecret(normalizedApiKey)
        : currentEncryptedKey;
    const nextKeyLast4 =
      normalizedApiKey && normalizedApiKey.length > 0
        ? normalizedApiKey.slice(-4)
        : current?.openRouterApiKeyLast4 || null;

    if (
      (requiresOpenRouterKey(provider) || requiresOpenRouterKey(fallbackProvider)) &&
      !nextEncryptedKey
    ) {
      throw new Error('Uma chave da OpenRouter e obrigatoria para usar este provider');
    }

    if (
      (requiresOpenRouterKey(provider) || requiresOpenRouterKey(fallbackProvider)) &&
      !normalizedApiKey &&
      currentKeyState.status === 'broken'
    ) {
      throw new Error(
        'A chave da OpenRouter salva esta corrompida. Cole uma nova chave e salve novamente.',
      );
    }

    await prisma.aiProviderSettings.upsert({
      where: { tenantId },
      update: {
        provider,
        fallbackProvider,
        openRouterApiKeyEncrypted: nextEncryptedKey || undefined,
        openRouterApiKeyLast4: nextKeyLast4 || undefined,
        openRouterBaseUrl: input.openRouterBaseUrl?.trim() || config.openRouterBaseUrl,
        fastModel: normalizeOptionalModel(input.fastModel),
        contextualModel: normalizeOptionalModel(input.contextualModel),
        qualityModel: normalizeOptionalModel(input.qualityModel),
        fallbackFastModel: normalizeOptionalModel(input.fallbackFastModel),
        fallbackContextualModel: normalizeOptionalModel(input.fallbackContextualModel),
        fallbackQualityModel: normalizeOptionalModel(input.fallbackQualityModel),
        isEnabled: input.isEnabled ?? true,
      },
      create: {
        tenantId,
        provider,
        fallbackProvider,
        openRouterApiKeyEncrypted: nextEncryptedKey || undefined,
        openRouterApiKeyLast4: nextKeyLast4 || undefined,
        openRouterBaseUrl: input.openRouterBaseUrl?.trim() || config.openRouterBaseUrl,
        fastModel: normalizeOptionalModel(input.fastModel),
        contextualModel: normalizeOptionalModel(input.contextualModel),
        qualityModel: normalizeOptionalModel(input.qualityModel),
        fallbackFastModel: normalizeOptionalModel(input.fallbackFastModel),
        fallbackContextualModel: normalizeOptionalModel(input.fallbackContextualModel),
        fallbackQualityModel: normalizeOptionalModel(input.fallbackQualityModel),
        isEnabled: input.isEnabled ?? true,
      },
    });

    return this.getSettings(tenantId);
  }
}

export const aiProviderConfigService = new AiProviderConfigService();
