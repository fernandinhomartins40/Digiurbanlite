/**
 * ============================================================================
 * PROTOCOL ACCESS - Escopo de leitura/escrita por role
 * ============================================================================
 *
 * Regra única de acesso a um protocolo (mesma semântica do GET /:id):
 * - USER            → apenas protocolos atribuídos a ele (assignedUserId OU
 *                     currentAssignedUserId — delegações/encaminhamentos contam)
 * - COORDINATOR     → protocolos do seu departamento
 * - MANAGER         → protocolos do seu departamento
 * - ADMIN/SUPER     → todos (do tenant)
 *
 * Toda rota que lê/escreve um protocolo específico deve usar
 * assertProtocolAccess (ou canAccessProtocol) em vez de reimplementar a regra.
 */

import { prisma } from '../lib/prisma';

export interface ProtocolAccessActor {
  id: string;
  role: string;
  departmentId?: string | null;
}

export interface ProtocolAccessTarget {
  departmentId: string | null;
  assignedUserId?: string | null;
  currentAssignedUserId?: string | null;
}

export class ProtocolAccessDeniedError extends Error {
  public statusCode = 403;
  constructor(message = 'Você não tem permissão para acessar este protocolo') {
    super(message);
    this.name = 'ProtocolAccessDeniedError';
  }
}

export function canAccessProtocol(
  actor: ProtocolAccessActor,
  protocol: ProtocolAccessTarget
): boolean {
  const role = String(actor.role);

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return true;
  }

  if (role === 'MANAGER' || role === 'COORDINATOR') {
    return !!actor.departmentId && protocol.departmentId === actor.departmentId;
  }

  if (role === 'USER') {
    return (
      protocol.assignedUserId === actor.id ||
      protocol.currentAssignedUserId === actor.id
    );
  }

  return false;
}

/**
 * Verifica se o ator pode acessar o departamento (para rotas de listagem/stats
 * por departamento). ADMIN+ acessa qualquer um; demais roles apenas o próprio.
 */
export function canAccessDepartment(
  actor: ProtocolAccessActor,
  departmentId: string
): boolean {
  const role = String(actor.role);
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return true;
  }
  return !!actor.departmentId && actor.departmentId === departmentId;
}

/**
 * Carrega os campos mínimos do protocolo e valida acesso.
 * Lança ProtocolAccessDeniedError (403) ou Error 'Protocolo não encontrado'.
 * Retorna os campos carregados para reuso pela rota.
 */
export async function assertProtocolAccess(
  actor: ProtocolAccessActor,
  protocolId: string
): Promise<ProtocolAccessTarget & { id: string; citizenId: string; status: string; number: string }> {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      number: true,
      status: true,
      citizenId: true,
      departmentId: true,
      assignedUserId: true,
      currentAssignedUserId: true
    }
  });

  if (!protocol) {
    const err: any = new Error('Protocolo não encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (!canAccessProtocol(actor, protocol)) {
    throw new ProtocolAccessDeniedError();
  }

  return protocol;
}
