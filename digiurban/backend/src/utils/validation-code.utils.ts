/**
 * Utilitários para geração e validação de códigos de validação de documentos
 *
 * Formato: VAL-YYYY-XXXXXX-CCCC
 * - VAL: Prefixo fixo
 * - YYYY: Ano de geração
 * - XXXXXX: 6 dígitos aleatórios criptograficamente seguros
 * - CCCC: 4 dígitos de checksum (dígito verificador módulo 10)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Gera um código de validação único e criptograficamente seguro
 *
 * @returns Código de validação no formato VAL-YYYY-XXXXXX-CCCC
 *
 * @example
 * const code = generateValidationCode();
 * // Retorna: "VAL-2026-482719-3845"
 */
export function generateValidationCode(): string {
  const year = new Date().getFullYear();

  // Gera 6 dígitos aleatórios criptograficamente seguros
  const randomBytes = crypto.randomBytes(3); // 3 bytes = 24 bits
  const randomNumber = parseInt(randomBytes.toString('hex'), 16) % 1000000;
  const randomPart = randomNumber.toString().padStart(6, '0');

  // Calcula checksum usando algoritmo módulo 10 (Luhn-like)
  const baseCode = `${year}${randomPart}`;
  const checksum = calculateChecksum(baseCode);

  return `VAL-${year}-${randomPart}-${checksum}`;
}

/**
 * Calcula checksum de 4 dígitos usando algoritmo módulo 10
 *
 * @param code String numérica para calcular checksum
 * @returns Checksum de 4 dígitos
 */
function calculateChecksum(code: string): string {
  let sum = 0;

  // Algoritmo Luhn modificado para 4 dígitos
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]);
    // Multiplica por 2 os dígitos em posição par
    const multiplied = (i % 2 === 0) ? digit * 2 : digit;
    // Se resultado > 9, soma os dígitos (ex: 14 -> 1+4 = 5)
    sum += multiplied > 9 ? Math.floor(multiplied / 10) + (multiplied % 10) : multiplied;
  }

  const mod = sum % 10;
  const firstCheck = mod === 0 ? 0 : 10 - mod;

  // Segundo dígito: soma dos dígitos do código
  const digitSum = code.split('').reduce((acc, d) => acc + parseInt(d), 0);
  const secondCheck = digitSum % 10;

  // Terceiro e quarto: baseados em hash
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const thirdCheck = parseInt(hash[0], 16) % 10;
  const fourthCheck = parseInt(hash[1], 16) % 10;

  return `${firstCheck}${secondCheck}${thirdCheck}${fourthCheck}`;
}

/**
 * Valida o formato e checksum de um código de validação
 *
 * @param validationCode Código a ser validado
 * @returns true se o código é válido, false caso contrário
 *
 * @example
 * const isValid = validateChecksum('VAL-2026-482719-3845');
 * // Retorna: true ou false
 */
export function validateChecksum(validationCode: string): boolean {
  // Validar formato básico
  const parts = validationCode.split('-');
  if (parts.length !== 4) return false;
  if (parts[0] !== 'VAL') return false;
  if (!/^\d{4}$/.test(parts[1])) return false; // Ano: 4 dígitos
  if (!/^\d{6}$/.test(parts[2])) return false; // Random: 6 dígitos
  if (!/^\d{4}$/.test(parts[3])) return false; // Checksum: 4 dígitos

  // Recalcular checksum e comparar
  const baseCode = `${parts[1]}${parts[2]}`;
  const providedChecksum = parts[3];
  const calculatedChecksum = calculateChecksum(baseCode);

  return providedChecksum === calculatedChecksum;
}

/**
 * Gera hash SHA-256 de um arquivo
 *
 * @param filePath Caminho completo do arquivo
 * @returns Promise com o hash em hexadecimal
 *
 * @example
 * const hash = await generateDocumentHash('/path/to/document.pdf');
 * // Retorna: "a1b2c3d4e5f6..." (64 caracteres hex)
 */
export function generateDocumentHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
}

/**
 * Gera hash SHA-256 de um buffer (arquivo em memória)
 *
 * @param buffer Buffer do arquivo
 * @returns Hash em hexadecimal
 */
export function generateDocumentHashFromBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verifica se um hash de documento corresponde ao arquivo
 *
 * @param filePath Caminho do arquivo
 * @param expectedHash Hash esperado
 * @returns Promise<boolean> true se corresponde
 */
export async function verifyDocumentIntegrity(
  filePath: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const actualHash = await generateDocumentHash(filePath);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('[ValidationUtils] Erro ao verificar integridade:', error);
    return false;
  }
}

/**
 * Verifica se um código de validação já existe no banco
 * Deve ser usado antes de salvar um novo código
 *
 * @param code Código a verificar
 * @param prisma Instância do PrismaClient
 * @returns Promise<boolean> true se já existe
 */
export async function isValidationCodeUnique(
  code: string,
  prisma: any
): Promise<boolean> {
  const existing = await prisma.generatedDocument.findUnique({
    where: { validationCode: code },
  });
  return !existing;
}

/**
 * Gera um código de validação único, garantindo que não existe no banco
 * Tenta até 10 vezes antes de falhar
 *
 * @param prisma Instância do PrismaClient
 * @returns Promise<string> Código único gerado
 * @throws Error se não conseguir gerar código único após 10 tentativas
 */
export async function generateUniqueValidationCode(prisma: any): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateValidationCode();
    const isUnique = await isValidationCodeUnique(code, prisma);

    if (isUnique) {
      return code;
    }

    console.warn(
      `[ValidationUtils] Código ${code} já existe. Tentativa ${attempt}/${maxAttempts}`
    );
  }

  throw new Error(
    'Não foi possível gerar código de validação único após 10 tentativas'
  );
}

/**
 * Formata um código de validação para exibição
 * Adiciona espaços para melhor legibilidade
 *
 * @param code Código de validação
 * @returns Código formatado
 *
 * @example
 * formatValidationCode('VAL-2026-482719-3845')
 * // Retorna: "VAL - 2026 - 482719 - 3845"
 */
export function formatValidationCode(code: string): string {
  return code.replace(/-/g, ' - ');
}

/**
 * Remove formatação de um código de validação
 *
 * @param formattedCode Código formatado
 * @returns Código limpo
 */
export function cleanValidationCode(formattedCode: string): string {
  return formattedCode.replace(/\s/g, '').toUpperCase();
}
