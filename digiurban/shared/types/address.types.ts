/**
 * ============================================================================
 * TIPOS PADRONIZADOS DE ENDEREÇO - ALINHADO COM O BANCO DE DADOS
 * ============================================================================
 *
 * Este arquivo define os tipos de endereço usados em toda a aplicação,
 * garantindo consistência com o schema do banco de dados PostgreSQL.
 *
 * IMPORTANTE: Use SEMPRE estes tipos em toda a aplicação (frontend e backend)
 * para evitar inconsistências de nomenclatura.
 *
 * Nomenclatura padrão (baseada no banco de dados):
 * - cep: string
 * - logradouro: string
 * - numero: string
 * - complemento: string
 * - bairro: string
 * - cidade: string
 * - uf: string
 * - pontoReferencia: string
 */

/**
 * Interface de endereço completo
 * Alinhada com o schema do Prisma e banco de dados PostgreSQL
 */
export interface Address {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pontoReferencia?: string;
}

/**
 * Interface de endereço para formulários de cadastro
 * (todos os campos obrigatórios exceto complemento e pontoReferencia)
 */
export interface AddressInput {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia?: string;
}

/**
 * Type guard para verificar se um objeto é um Address válido
 */
export function isValidAddress(obj: any): obj is Address {
  if (!obj || typeof obj !== 'object') return false;

  // Pelo menos cidade ou logradouro devem estar presentes
  return (
    (typeof obj.cidade === 'string' && obj.cidade.length > 0) ||
    (typeof obj.logradouro === 'string' && obj.logradouro.length > 0)
  );
}

/**
 * Formata endereço completo para exibição
 */
export function formatAddressDisplay(address?: Address | null): string {
  if (!address) return '';

  const parts = [
    address.logradouro,
    address.numero,
    address.bairro,
    address.cidade,
    address.uf
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Formata endereço completo incluindo CEP e complemento
 */
export function formatAddressFull(address?: Address | null): string {
  if (!address) return '';

  const parts = [
    address.logradouro,
    address.numero,
    address.complemento,
    address.bairro,
    address.cidade,
    address.uf,
    address.cep
  ].filter(Boolean);

  return parts.join(', ');
}
