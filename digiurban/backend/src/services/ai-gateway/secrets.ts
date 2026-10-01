/**
 * Criptografia das chaves de API dos provedores de IA (AES-256-GCM).
 * Chave mestra: AI_KEYS_ENCRYPTION_KEY (recomendado) ou, na falta, JWT_SECRET
 * (obrigatório no deploy). NUNCA um valor fixo no código.
 * A chave em claro só existe em memória no momento da chamada ao provedor;
 * a API devolve apenas os 4 últimos caracteres.
 */

import crypto from 'crypto';

function masterKey(): Buffer {
  const secret = process.env.AI_KEYS_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AI_KEYS_ENCRYPTION_KEY (ou JWT_SECRET) ausente ou curta demais para proteger as chaves de IA');
  }
  return crypto.createHash('sha256').update(`digiurban-ai-keys:${secret}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith('v1:')) throw new Error('Formato de chave desconhecido');
  const raw = Buffer.from(stored.slice(3), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

export const last4 = (value: string) => value.trim().slice(-4);
