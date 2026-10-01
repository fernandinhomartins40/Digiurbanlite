/**
 * Token das chamadas internas ao backend (bot → /api/internal/*).
 *
 * Fonte: o token gerado pelo painel (Super-admin › Chaves de API › Comunicação
 * interna), guardado cifrado na tabela platform_secrets do banco compartilhado.
 * Decifra com a mesma derivação do backend (JWT_SECRET — os dois serviços têm).
 * Sem token do painel: DIGIURBAN_SERVICE_TOKEN do .env (compatibilidade).
 * Cache de 30 s: após "Gerar novo token" o bot passa a usar o novo sozinho.
 */

import crypto from 'crypto';
import prisma from './prisma';
import logger from './logger';

let cache: { at: number; token: string } | null = null;

function open(stored: string): string {
  const secret = process.env.JWT_SECRET || '';
  const key = crypto.createHash('sha256').update(`digiurban-platform-secret:${secret}`).digest();
  const raw = Buffer.from(stored.replace(/^v1:/, ''), 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
}

export async function getServiceToken(): Promise<string> {
  if (cache && Date.now() - cache.at < 30000) return cache.token;
  let token = process.env.DIGIURBAN_SERVICE_TOKEN || '';
  try {
    const rows = await prisma.$queryRaw<Array<{ valueEnc: string }>>`
      SELECT "valueEnc" FROM platform_secrets WHERE key = 'internal_service_token' LIMIT 1
    `;
    if (rows[0]?.valueEnc) token = open(rows[0].valueEnc);
  } catch (error) {
    // tabela ainda não migrada ou JWT_SECRET diferente: segue com o .env
    logger.debug?.('serviceToken: usando token do ambiente', { error: error instanceof Error ? error.message : error });
  }
  cache = { at: Date.now(), token };
  return token;
}

/** Interceptor axios: aplica o token atual em toda chamada ao backend */
export async function withServiceToken(config: any): Promise<any> {
  const token = await getServiceToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}
