/**
 * Segredos do serviço de face.
 *
 * Token entre serviços: o MESMO "Comunicação interna" gerado no painel
 * (Super-admin › Chaves de API), guardado cifrado em platform_secrets e decifrado
 * com a derivação do JWT_SECRET (igual ao backend e ao servidor do bot). O valor
 * do .env (FACE_PLATFORM_SERVICE_TOKEN) só vale enquanto o painel não gerou um.
 */

import crypto from 'crypto';
import prisma from './prisma';

const KNOWN_PUBLIC_DEFAULTS = ['ultrazend-face-service-token', 'ultrazend-messages-service-token'];
const PREVIOUS_GRACE_MS = 10 * 60 * 1000;

function platformKey(): Buffer | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return crypto.createHash('sha256').update(`digiurban-platform-secret:${secret}`).digest();
}

function open(stored: string, key: Buffer): string {
  const raw = Buffer.from(stored.replace(/^v1:/, ''), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

let cache: { at: number; current: string | null; previous: string | null; rotatedAt: Date | null } | null = null;

async function loadPanelToken() {
  if (cache && Date.now() - cache.at < 30000) return cache;
  let current: string | null = null;
  let previous: string | null = null;
  let rotatedAt: Date | null = null;
  const key = platformKey();
  if (key) {
    try {
      const row = await prisma.platformSecret.findUnique({ where: { key: 'internal_service_token' } });
      if (row) {
        current = open(row.valueEnc, key);
        previous = row.previousEnc ? open(row.previousEnc, key) : null;
        rotatedAt = row.rotatedAt;
      }
    } catch {
      // tabela ainda não migrada ou JWT_SECRET diferente: segue com o .env
    }
  }
  cache = { at: Date.now(), current, previous, rotatedAt };
  return cache;
}

/** Tokens aceitos agora: o do painel (e o anterior por 10 min após a troca); sem painel, o do .env */
export async function acceptedServiceTokens(): Promise<string[]> {
  const panel = await loadPanelToken();
  if (panel.current) {
    const tokens = [panel.current];
    if (panel.previous && panel.rotatedAt && Date.now() - panel.rotatedAt.getTime() < PREVIOUS_GRACE_MS) {
      tokens.push(panel.previous);
    }
    return tokens;
  }
  const envToken = process.env.FACE_PLATFORM_SERVICE_TOKEN || '';
  return envToken ? [envToken] : [];
}

/** Token para o face server chamar o backend (avisos aos responsáveis) */
export async function outgoingServiceToken(): Promise<string> {
  const panel = await loadPanelToken();
  return panel.current || process.env.DIGIURBAN_SERVICE_TOKEN || '';
}

export function isPublicDefaultToken(token: string) {
  return KNOWN_PUBLIC_DEFAULTS.includes(token);
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Chave das credenciais de câmera. Antes: padrão público "CHANGE_THIS_FACE_PLATFORM_KEY"
 * quando a variável não existia. Agora deriva do JWT_SECRET (sempre configurado).
 */
export function deviceSecretKey(): Buffer {
  const base = process.env.FACE_PLATFORM_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!base) throw new Error('JWT_SECRET ausente: não é possível cifrar credenciais de câmera');
  return crypto.createHash('sha256').update(`digiurban-face-device:${base}`).digest();
}
