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

/** Item do catálogo que é só informação (consulta): não abre pedido */
export function isInformationOnly(serviceSubtype: string | null | undefined): boolean {
  return serviceSubtype === 'CONSULTA_PUBLICA' || serviceSubtype === 'CONSULTA_AUTENTICADA';
}

export const INFORMATION_ONLY_MESSAGE =
  'Este item é só de informação e não abre pedido. Para dúvidas, fale com o assistente ou procure a secretaria.';

/**
 * Confere se o cidadão pode pedir o serviço: nível mínimo e se o item abre
 * pedido. `null` = pode pedir; senão o motivo para mostrar ao cidadão.
 */
export async function checkServiceLevel(
  citizenId: string,
  serviceId: string
): Promise<{ minLevel: CitizenLevel; message: string; reason?: 'INFO_ONLY' | 'TAG_REQUIRED' } | null> {
  const [citizen, service] = await Promise.all([
    prisma.citizen.findUnique({ where: { id: citizenId }, select: { verificationStatus: true } }),
    prisma.serviceSimplified.findFirst({ where: { id: serviceId }, select: { minLevel: true, serviceSubtype: true, requiredTagId: true } }),
  ]);
  if (!citizen || !service) return null; // quem chamou já trata "não encontrado"
  if (isInformationOnly(service.serviceSubtype)) {
    return { minLevel: normalizeLevel(service.minLevel), message: INFORMATION_ONLY_MESSAGE, reason: 'INFO_ONLY' };
  }
  // serviço só para quem tem a etiqueta (ex.: renovação só para Produtor Rural)
  if (service.requiredTagId) {
    const [has, tag] = await Promise.all([
      prisma.citizenCategoryAssignment.findFirst({ where: { citizenId, categoryId: service.requiredTagId, active: true }, select: { id: true } }),
      prisma.citizenCategory.findFirst({ where: { id: service.requiredTagId }, select: { name: true, active: true } }),
    ]);
    if (tag?.active && !has) {
      return {
        minLevel: normalizeLevel(service.minLevel),
        message: `Este serviço é para quem já é "${tag.name}" no cadastro da prefeitura. Procure a secretaria se acha que é o seu caso.`,
        reason: 'TAG_REQUIRED',
      };
    }
  }
  if (meetsLevel(citizen.verificationStatus, service.minLevel)) return null;
  return { minLevel: normalizeLevel(service.minLevel), message: levelBlockMessage(service.minLevel) };
}
