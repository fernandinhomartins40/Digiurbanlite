/**
 * Gerenciador Seguro de Chaves Privadas
 *
 * IMPORTANTE: Este serviço armazena chaves privadas de forma TEMPORÁRIA
 * e criptografada durante a sessão. As chaves são:
 * - Criptografadas com AES usando o PIN do usuário
 * - Armazenadas em sessionStorage (limpa ao fechar aba)
 * - Nunca enviadas ao servidor
 * - Auto-destruídas após timeout
 */

import CryptoJS from 'crypto-js';

const SESSION_KEY_PREFIX = 'enc_key_';
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

interface StoredKey {
  encryptedKey: string;
  timestamp: number;
  certificateId: string;
}

/**
 * Armazena chave privada criptografada com PIN
 */
export function storePrivateKey(certificateId: string, privateKey: string, pin: string): void {
  try {
    // Criptografar chave privada com PIN
    const encrypted = CryptoJS.AES.encrypt(privateKey, pin).toString();

    const data: StoredKey = {
      encryptedKey: encrypted,
      timestamp: Date.now(),
      certificateId,
    };

    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${certificateId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao armazenar chave privada:', error);
    throw new Error('Falha ao armazenar chave de forma segura');
  }
}

/**
 * Recupera chave privada descriptografada com PIN
 */
export function retrievePrivateKey(certificateId: string, pin: string): string | null {
  try {
    const stored = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${certificateId}`);
    if (!stored) return null;

    const data: StoredKey = JSON.parse(stored);

    // Verificar timeout
    if (Date.now() - data.timestamp > TIMEOUT_MS) {
      removePrivateKey(certificateId);
      throw new Error('Sessão expirada. Faça login novamente com seu certificado.');
    }

    // Descriptografar chave privada
    const decrypted = CryptoJS.AES.decrypt(data.encryptedKey, pin);
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey) {
      throw new Error('PIN incorreto');
    }

    return privateKey;
  } catch (error: any) {
    console.error('Erro ao recuperar chave privada:', error);
    throw new Error(error.message || 'Falha ao recuperar chave privada');
  }
}

/**
 * Remove chave privada da sessão
 */
export function removePrivateKey(certificateId: string): void {
  sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${certificateId}`);
}

/**
 * Limpa todas as chaves da sessão
 */
export function clearAllKeys(): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(SESSION_KEY_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Verifica se uma chave está armazenada
 */
export function hasStoredKey(certificateId: string): boolean {
  const stored = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${certificateId}`);
  if (!stored) return false;

  try {
    const data: StoredKey = JSON.parse(stored);
    // Verificar se não expirou
    return Date.now() - data.timestamp <= TIMEOUT_MS;
  } catch {
    return false;
  }
}

/**
 * Obtém tempo restante de sessão em segundos
 */
export function getSessionTimeRemaining(certificateId: string): number {
  const stored = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${certificateId}`);
  if (!stored) return 0;

  try {
    const data: StoredKey = JSON.parse(stored);
    const remaining = TIMEOUT_MS - (Date.now() - data.timestamp);
    return Math.max(0, Math.floor(remaining / 1000));
  } catch {
    return 0;
  }
}
