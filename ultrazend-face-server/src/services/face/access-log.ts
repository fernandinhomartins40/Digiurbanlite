/**
 * Registro de quem consultou ou alterou biometria de quem (LGPD art. 37 e 46).
 * Nunca derruba a operação: falha de registro vai para o log do serviço.
 */

import prisma from '../../utils/prisma';
import logger from '../../utils/logger';

export interface FaceActor {
  type: 'USER' | 'CITIZEN' | 'SYSTEM';
  id?: string | null;
  role?: string | null;
}

export async function logFaceAccess(entry: {
  tenantId: string | null;
  actor: FaceActor;
  action: string;
  citizenId?: string | null;
  identityId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.faceAccessLog.create({
      data: {
        tenantId: entry.tenantId,
        actorType: entry.actor.type,
        actorId: entry.actor.id || null,
        action: entry.action,
        citizenId: entry.citizenId || null,
        identityId: entry.identityId || null,
        details: { ...(entry.details || {}), ...(entry.actor.role ? { role: entry.actor.role } : {}) } as any,
      },
    });
  } catch (error: any) {
    logger.error('Falha ao registrar acesso à biometria', { error: error?.message, action: entry.action });
  }
}

export async function listFaceAccess(tenantId: string, filters: { citizenId?: string; limit?: number }) {
  return prisma.faceAccessLog.findMany({
    where: { tenantId, ...(filters.citizenId ? { citizenId: filters.citizenId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(filters.limit || 100, 1), 500),
  });
}
