/**
 * Regras de acesso do chat (auditoria LGPD 2026-10-01).
 *
 * O messages-server lê o banco SEM a extensão de isolamento do backend, então
 * cada rota precisa filtrar por município e por participação explicitamente.
 * Antes: qualquer usuário logado lia mensagens de qualquer conversa por id,
 * listava cidadãos (CPF/telefone) de todos os municípios e criava canais.
 */

import { DEFAULT_TENANT_ID } from '../utils/tenant';

export interface AccessUser {
  userId: string;
  userType?: string;
  role?: string;
  tenantId?: string;
}

/** Tenant efetivo: claim do JWT; tokens antigos sem claim = tenant padrão */
export const tenantOf = (user?: AccessUser | null) => user?.tenantId || DEFAULT_TENANT_ID;

export const isServer = (user?: AccessUser | null) => user?.userType === 'SERVER';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'MANAGER']);
export const isServerAdmin = (user?: AccessUser | null) => isServer(user) && ADMIN_ROLES.has(String(user?.role || ''));

export interface ConversationLike {
  tenantId: string | null;
  participant1Id: string;
  participant1Type: string;
  participant2Id: string;
  participant2Type: string;
  isBotConversation?: boolean | null;
  metadata?: any;
}

export const isParticipant = (c: ConversationLike, u: AccessUser) =>
  (c.participant1Id === u.userId && c.participant1Type === u.userType) ||
  (c.participant2Id === u.userId && c.participant2Type === u.userType);

/**
 * Pode ler a conversa: participante; ou servidor do MESMO município quando é
 * conversa do bot (supervisão/fila de atendimento humano) ou foi assumida por ele.
 */
export function canReadConversation(c: ConversationLike, u: AccessUser): boolean {
  if (isParticipant(c, u)) return true;
  if (!isServer(u)) return false;
  if ((c.tenantId || DEFAULT_TENANT_ID) !== tenantOf(u)) return false;
  return Boolean(c.isBotConversation) || c.metadata?.takenOverBy === u.userId;
}

/** CPF parcialmente oculto (LGPD — minimização): 123.***.***-09 */
export function maskCpf(cpf?: string | null): string | null {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}.***.***-${d.slice(9)}` : '***';
}
