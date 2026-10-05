/**
 * Consentimento da biometria, por finalidade (LGPD art. 11 I; art. 14 para menores).
 *
 * IDENTITY_VERIFICATION: confirmar que é o próprio cidadão (nível Ouro, atendimentos).
 * SCHOOL_SECURITY: reconhecer o aluno na entrada/saída da escola e avisar o responsável.
 * Um rosto só entra numa busca se houver consentimento ATIVO para aquela finalidade.
 */

import prisma from '../../utils/prisma';

export type FacePurpose = 'IDENTITY_VERIFICATION' | 'SCHOOL_SECURITY';
export const FACE_PURPOSES: FacePurpose[] = ['IDENTITY_VERIFICATION', 'SCHOOL_SECURITY'];
export const TERMS_VERSION = 'biometria-v1-2026-10';

export interface ConsentInput {
  tenantId: string;
  citizenId: string;
  purpose: FacePurpose;
  relationship: 'TITULAR' | 'MAE' | 'PAI' | 'RESPONSAVEL_LEGAL';
  channel: 'SELF_SERVICE' | 'PRESENCIAL';
  grantedByCitizenId?: string | null;
  grantedByName?: string | null;
  recordedByUserId?: string | null;
  evidence?: Record<string, unknown> | null;
}

function consentError(message: string, status = 400) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export function assertPurpose(value: unknown): FacePurpose {
  if (FACE_PURPOSES.includes(value as FacePurpose)) return value as FacePurpose;
  throw consentError('Finalidade da biometria inválida');
}

export async function hasActiveConsent(tenantId: string, citizenId: string, purpose: FacePurpose) {
  const found = await prisma.faceConsent.findFirst({
    where: { tenantId, citizenId, purpose, revokedAt: null },
    select: { id: true },
  });
  return Boolean(found);
}

export async function citizenIdsWithConsent(tenantId: string, purpose: FacePurpose): Promise<Set<string>> {
  const rows = await prisma.faceConsent.findMany({
    where: { tenantId, purpose, revokedAt: null },
    select: { citizenId: true },
  });
  return new Set(rows.map((row) => row.citizenId));
}

export async function grantConsent(input: ConsentInput) {
  if (input.relationship !== 'TITULAR' && !input.grantedByName?.trim()) {
    throw consentError('Informe o nome do responsável que autorizou.');
  }

  const existing = await prisma.faceConsent.findFirst({
    where: { tenantId: input.tenantId, citizenId: input.citizenId, purpose: input.purpose, revokedAt: null },
  });
  if (existing) return existing;

  return prisma.faceConsent.create({
    data: {
      tenantId: input.tenantId,
      citizenId: input.citizenId,
      purpose: input.purpose,
      relationship: input.relationship,
      channel: input.channel,
      grantedByCitizenId: input.grantedByCitizenId || null,
      grantedByName: input.grantedByName?.trim() || null,
      recordedByUserId: input.recordedByUserId || null,
      termsVersion: TERMS_VERSION,
      evidence: (input.evidence || undefined) as any,
    },
  });
}

export async function revokeConsent(
  tenantId: string,
  citizenId: string,
  purpose: FacePurpose,
  revokedBy: string,
  reason: string
) {
  const result = await prisma.faceConsent.updateMany({
    where: { tenantId, citizenId, purpose, revokedAt: null },
    data: { revokedAt: new Date(), revokedBy, revokedReason: reason },
  });
  return result.count;
}

export async function listConsents(tenantId: string, citizenId: string) {
  return prisma.faceConsent.findMany({
    where: { tenantId, citizenId },
    orderBy: { grantedAt: 'desc' },
  });
}
