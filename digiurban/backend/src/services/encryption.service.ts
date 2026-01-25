import * as crypto from 'crypto';

/**
 * Serviço de criptografia para chaves privadas
 * Usa AES-256-GCM para criptografia autenticada
 */

// Chave mestra para criptografia (em produção, deve vir de variável de ambiente)
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'CHANGE_THIS_IN_PRODUCTION_32CHAR';

// Garantir que a chave tenha 32 bytes (256 bits)
function getMasterKey(): Buffer {
  const key = MASTER_KEY.padEnd(32, '0').substring(0, 32);
  return Buffer.from(key, 'utf-8');
}

/**
 * Criptografa uma chave privada usando AES-256-GCM
 * @param privateKey - Chave privada em formato PEM
 * @returns String base64 contendo IV + Auth Tag + Dados criptografados
 */
export function encryptPrivateKey(privateKey: string): string {
  const algorithm = 'aes-256-gcm';
  const key = getMasterKey();

  // Gerar IV aleatório (12 bytes recomendado para GCM)
  const iv = crypto.randomBytes(12);

  // Criar cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Criptografar
  let encrypted = cipher.update(privateKey, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Obter authentication tag
  const authTag = cipher.getAuthTag();

  // Combinar: IV (12 bytes) + Auth Tag (16 bytes) + Dados criptografados
  const combined = Buffer.concat([iv, authTag, encrypted]);

  // Retornar como base64
  return combined.toString('base64');
}

/**
 * Descriptografa uma chave privada usando AES-256-GCM
 * @param encryptedData - String base64 contendo IV + Auth Tag + Dados criptografados
 * @returns Chave privada em formato PEM
 */
export function decryptPrivateKey(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const key = getMasterKey();

  // Converter de base64
  const combined = Buffer.from(encryptedData, 'base64');

  // Extrair componentes
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);

  // Criar decipher
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  // Descriptografar
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Testa se a criptografia/descriptografia está funcionando corretamente
 */
export function testEncryption(): boolean {
  const testData = '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----';

  try {
    const encrypted = encryptPrivateKey(testData);
    const decrypted = decryptPrivateKey(encrypted);

    return testData === decrypted;
  } catch (error) {
    console.error('Teste de criptografia falhou:', error);
    return false;
  }
}
