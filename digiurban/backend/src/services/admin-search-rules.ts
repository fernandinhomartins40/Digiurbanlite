/**
 * Regras puras da busca do painel (Ctrl+K), separadas do serviço para o teste
 * não carregar o processo interno (que deixa conexão aberta no jest).
 */
import { getRolePermissions } from '../middleware/admin-auth';

export const SEARCH_MIN_CHARS = 3;
export const SEARCH_LIMIT = 5;

export interface AdminSearchQuery {
  term: string;
  /** só os números (CPF/número do pedido digitados com ou sem pontuação) */
  digits: string;
}

/** Termo limpo; null se curto demais para buscar */
export function parseSearchQuery(raw: unknown): AdminSearchQuery | null {
  const term = String(raw ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (term.length < SEARCH_MIN_CHARS) return null;
  return { term, digits: term.replace(/\D/g, '') };
}

export function maskCpf(cpf?: string | null): string {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return digits ? '***' : '';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export function canReadCitizens(role: string): boolean {
  const permissions = getRolePermissions(role as any);
  return permissions.includes('*') || permissions.includes('citizens:read') || permissions.includes('citizens:*');
}
