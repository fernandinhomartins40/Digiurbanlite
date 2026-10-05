/**
 * Configuração do e-mail transacional (VeloMail) — tudo pelo painel, nada de .env.
 *
 * Plataforma (Super-admin › E-mail transacional): liga/desliga, remetente e as
 * chaves (API key `re_...` e segredo do webhook), guardadas cifradas em
 * platform_secrets com a mesma derivação do JWT_SECRET usada nos outros segredos.
 * Município (Configurações › E-mails): nome do remetente e e-mail de resposta.
 */

import { prisma } from '../../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { openSecret, sealSecret } from '../platform-secrets.service';

export const VELOMAIL_API_KEY = 'velomail_api_key';
export const VELOMAIL_WEBHOOK_SECRET = 'velomail_webhook_secret';

let cache: { at: number; value: Awaited<ReturnType<typeof loadPlatformMail>> } | null = null;

async function loadPlatformMail() {
  return runAsPlatform(async () => {
    const [settings, apiKeyRow, webhookRow] = await Promise.all([
      prisma.transactionalMailSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} }),
      prisma.platformSecret.findUnique({ where: { key: VELOMAIL_API_KEY } }),
      prisma.platformSecret.findUnique({ where: { key: VELOMAIL_WEBHOOK_SECRET } }),
    ]);
    let apiKey: string | null = null;
    let webhookSecret: string | null = null;
    try {
      apiKey = apiKeyRow ? openSecret(apiKeyRow.valueEnc) : null;
      webhookSecret = webhookRow ? openSecret(webhookRow.valueEnc) : null;
    } catch {
      // JWT_SECRET trocado: as chaves precisam ser salvas de novo no painel
    }
    return { settings, apiKey, webhookSecret };
  });
}

export async function getPlatformMail() {
  if (cache && Date.now() - cache.at < 30000) return cache.value;
  const value = await loadPlatformMail();
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateMailCache() {
  cache = null;
}

export async function savePlatformSecret(key: string, plain: string | null) {
  await runAsPlatform(async () => {
    if (!plain) {
      await prisma.platformSecret.deleteMany({ where: { key } });
      return;
    }
    await prisma.platformSecret.upsert({
      where: { key },
      create: { key, valueEnc: sealSecret(plain) },
      update: { valueEnc: sealSecret(plain), rotatedAt: new Date() },
    });
  });
  invalidateMailCache();
}

export async function updatePlatformMailSettings(
  data: Partial<{ enabled: boolean; fromEmail: string; fromName: string; apiBaseUrl: string }>,
  updatedBy?: string | null
) {
  const settings = await runAsPlatform(async () =>
    prisma.transactionalMailSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data, updatedBy: updatedBy || null },
      update: { ...data, updatedBy: updatedBy || null },
    })
  );
  invalidateMailCache();
  return settings;
}

/** Configuração do município (sempre do município da requisição/contexto) */
export async function getTenantMailSettings(tenantId?: string | null) {
  const id = tenantId || tryGetTenantId();
  if (!id) return null;
  return runAsPlatform(async () => prisma.tenantMailSettings.findFirst({ where: { tenantId: id } }));
}

export async function upsertTenantMailSettings(
  tenantId: string,
  data: Partial<{ senderName: string | null; replyTo: string | null; emailNotificationsEnabled: boolean }>
) {
  return runAsPlatform(async () => {
    const existing = await prisma.tenantMailSettings.findFirst({ where: { tenantId } });
    if (existing) return prisma.tenantMailSettings.update({ where: { id: existing.id }, data });
    return prisma.tenantMailSettings.create({ data: { tenantId, ...data } });
  });
}
