import * as crypto from 'crypto';
import { getCertMasterKey } from './signing/keystore.service';

/**
 * Cifra das chaves privadas dos certificados (AES-256-GCM).
 *
 * Formato atual "v2:" — chave mestra aleatória guardada cifrada no cofre da
 * plataforma (signing/keystore.service). Antes a chave vinha de
 * ENCRYPTION_MASTER_KEY e, sem ela (produção), de um texto fixo do código;
 * esse formato antigo só é lido para recifrar (ver isLegacyEncrypted).
 */

const LEGACY_DEFAULT = 'CHANGE_THIS_IN_PRODUCTION_32CHAR';

function legacyKeys(): Buffer[] {
  return [process.env.ENCRYPTION_MASTER_KEY, LEGACY_DEFAULT]
    .filter((value): value is string => Boolean(value))
    .map((value) => Buffer.from(value.padEnd(32, '0').substring(0, 32), 'utf-8'));
}

function open(combined: Buffer, key: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, combined.subarray(0, 12));
  decipher.setAuthTag(combined.subarray(12, 28));
  return Buffer.concat([decipher.update(combined.subarray(28)), decipher.final()]).toString('utf8');
}

export function isLegacyEncrypted(stored: string): boolean {
  return !stored.startsWith('v2:');
}

/** Cifra uma chave privada (PEM) com a chave mestra do cofre */
export async function encryptPrivateKey(privateKey: string): Promise<string> {
  const key = await getCertMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
  return `v2:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')}`;
}

/** Decifra a chave privada (formato atual ou antigo) */
export async function decryptPrivateKey(stored: string): Promise<string> {
  if (!isLegacyEncrypted(stored)) {
    return open(Buffer.from(stored.slice(3), 'base64'), await getCertMasterKey());
  }
  const combined = Buffer.from(stored, 'base64');
  for (const key of legacyKeys()) {
    try {
      return open(combined, key);
    } catch {
      // tenta a próxima chave antiga
    }
  }
  throw new Error('Não foi possível decifrar a chave privada do certificado');
}
