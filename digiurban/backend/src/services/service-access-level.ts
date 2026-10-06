/**
 * Nível mínimo para pedir um serviço (Bronze / Prata / Ouro).
 *
 * Antes os níveis eram só um selo: nada era liberado nem bloqueado. Agora cada
 * serviço escolhe quem pode pedir pelo portal e pelo assistente (padrão:
 * qualquer cidadão). No balcão o servidor confere a pessoa, então ali não vale.
 */

import { prisma } from '../lib/prisma';

export type CitizenLevel = 'BRONZE' | 'SILVER' | 'GOLD';

const RANK: Record<CitizenLevel, number> = { BRONZE: 1, SILVER: 2, GOLD: 3 };
export const LEVEL_LABEL: Record<CitizenLevel, string> = { BRONZE: 'Bronze', SILVER: 'Prata', GOLD: 'Ouro' };

export function normalizeLevel(value: unknown): CitizenLevel {
  return value === 'SILVER' || value === 'GOLD' ? value : 'BRONZE';
}

export function levelOfStatus(status: string | null | undefined): CitizenLevel {
  if (status === 'GOLD') return 'GOLD';
  if (status === 'VERIFIED') return 'SILVER';
  return 'BRONZE';
}

/** Regra pura: o nível do cidadão alcança o do serviço? */
export function meetsLevel(citizenStatus: string | null | undefined, minLevel: unknown): boolean {
  return RANK[levelOfStatus(citizenStatus)] >= RANK[normalizeLevel(minLevel)];
}

export function levelBlockMessage(minLevel: unknown): string {
  const level = normalizeLevel(minLevel);
  return level === 'GOLD'
    ? 'Este serviço pede cadastro nível Ouro (documentos e biometria confirmados). Veja o que falta em "Meu perfil".'
    : 'Este serviço pede cadastro conferido pela prefeitura (nível Prata). Complete o seu perfil e aguarde a conferência.';
}

/** Confere no banco. `null` = pode pedir; texto = motivo para mostrar ao cidadão. */
export async function checkServiceLevel(citizenId: string, serviceId: string): Promise<{ minLevel: CitizenLevel; message: string } | null> {
  const [citizen, service] = await Promise.all([
    prisma.citizen.findUnique({ where: { id: citizenId }, select: { verificationStatus: true } }),
    prisma.serviceSimplified.findFirst({ where: { id: serviceId }, select: { minLevel: true } }),
  ]);
  if (!citizen || !service) return null; // quem chamou já trata "não encontrado"
  if (meetsLevel(citizen.verificationStatus, service.minLevel)) return null;
  return { minLevel: normalizeLevel(service.minLevel), message: levelBlockMessage(service.minLevel) };
}
