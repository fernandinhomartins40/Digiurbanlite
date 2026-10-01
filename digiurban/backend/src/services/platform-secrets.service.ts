/**
 * Segredos da plataforma gerados pelo painel — o operador não edita .env.
 *
 * internal_service_token: token das chamadas internas do bot (messages-server)
 * ao backend. Antes vinha só do .env, com padrão público
 * "ultrazend-messages-service-token" quando a variável não existia.
 *
 * Cifra AES-256-GCM com chave derivada do JWT_SECRET (o messages-server tem o
 * mesmo JWT_SECRET e decifra igual — ver ultrazend-messages-server/src/utils/serviceToken.ts).
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';

export const INTERNAL_TOKEN_KEY = 'internal_service_token';
export const KNOWN_DEFAULT_TOKENS = ['ultrazend-messages-service-token', 'digiurban-ai-service-token'];
const PREVIOUS_GRACE_MS = 10 * 60 * 1000;

function key(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET ausente');
  return crypto.createHash('sha256').update(`digiurban-platform-secret:${secret}`).digest();
}

export function sealSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `v1:${Buffer.concat([iv, c.getAuthTag(), data]).toString('base64')}`;
}

export function openSecret(stored: string): string {
  const raw = Buffer.from(stored.replace(/^v1:/, ''), 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
}

let cache: { at: number; current: string | null; previous: string | null; rotatedAt: Date | null } | null = null;

/** Tokens aceitos agora (atual + anterior durante a troca). Cache de 30 s. */
export async function acceptedInternalTokens(): Promise<{ db: string[]; hasDbToken: boolean }> {
  if (!cache || Date.now() - cache.at > 30000) {
    const row = await runAsPlatform(async () => prisma.platformSecret.findUnique({ where: { key: INTERNAL_TOKEN_KEY } })).catch(() => null);
    let current: string | null = null;
    let previous: string | null = null;
    try {
      current = row ? openSecret(row.valueEnc) : null;
      previous = row?.previousEnc ? openSecret(row.previousEnc) : null;
    } catch {
      current = null; // JWT_SECRET trocado: volta ao .env até gerar um novo pelo painel
    }
    cache = { at: Date.now(), current, previous, rotatedAt: row?.rotatedAt ?? null };
  }
  const db: string[] = [];
  if (cache.current) db.push(cache.current);
  if (cache.previous && cache.rotatedAt && Date.now() - cache.rotatedAt.getTime() < PREVIOUS_GRACE_MS) db.push(cache.previous);
  return { db, hasDbToken: Boolean(cache.current) };
}

export async function internalTokenStatus() {
  const row = await runAsPlatform(async () => prisma.platformSecret.findUnique({ where: { key: INTERNAL_TOKEN_KEY } }));
  const envToken = process.env.DIGIURBAN_SERVICE_TOKEN || '';
  return {
    generatedByPanel: Boolean(row),
    rotatedAt: row?.rotatedAt ?? null,
    envUsesKnownDefault: !envToken || KNOWN_DEFAULT_TOKENS.includes(envToken),
  };
}

/** Gera um token novo (48 bytes aleatórios); o anterior vale por mais 10 min */
export async function rotateInternalToken(): Promise<{ rotatedAt: Date }> {
  const token = crypto.randomBytes(48).toString('base64url');
  const row = await runAsPlatform(async () => {
    const existing = await prisma.platformSecret.findUnique({ where: { key: INTERNAL_TOKEN_KEY } });
    return prisma.platformSecret.upsert({
      where: { key: INTERNAL_TOKEN_KEY },
      create: { key: INTERNAL_TOKEN_KEY, valueEnc: sealSecret(token) },
      update: { valueEnc: sealSecret(token), previousEnc: existing?.valueEnc ?? null, rotatedAt: new Date() },
    });
  });
  cache = null;
  return { rotatedAt: row.rotatedAt };
}
