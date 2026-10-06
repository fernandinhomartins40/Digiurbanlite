/**
 * Etiquetas do cidadão ("Produtor Rural", "Beneficiário do Bolsa-Aluguel"...).
 *
 * Uma etiqueta é uma marca que o cidadão ganha quando um pedido de certos
 * serviços é concluído — ou que o servidor coloca à mão na ficha. Quem cria a
 * etiqueta escolhe os serviços numa lista (guardados por id). O gatilho antigo
 * pelo código técnico do serviço (`triggerServices`) continua valendo para as
 * etiquetas que já existiam.
 *
 * Este arquivo substitui auto-categorization + citizen-category(-expanded|
 * -relationships): eram ~2.000 linhas (pontos, medalhas, hierarquia, validade)
 * que nunca tiveram tela nem uso, e duas rotinas diferentes atribuindo.
 */

import { prisma } from '../lib/prisma';

export interface AssignedTag {
  categoryId: string;
  code: string;
  name: string;
  isNew: boolean;
}

/** "Produtor Rural" → "PRODUTOR_RURAL" */
export function tagCodeFromName(name: string): string {
  const code = String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return code || 'ETIQUETA';
}

/** Coloca (ou reativa) uma etiqueta no cidadão. Não repete se já está ativa. */
export async function assignTag(input: {
  citizenId: string;
  categoryId: string;
  protocolId?: string | null;
  assignedBy?: string | null;
  source: 'AUTO' | 'MANUAL';
}): Promise<{ isNew: boolean; changed: boolean }> {
  const existing = await prisma.citizenCategoryAssignment.findUnique({
    where: { citizenId_categoryId: { citizenId: input.citizenId, categoryId: input.categoryId } },
    select: { id: true, active: true },
  });

  if (existing?.active) {
    if (input.protocolId) {
      await prisma.citizenCategoryAssignment.update({
        where: { id: existing.id },
        data: { protocolCount: { increment: 1 }, lastProtocolDate: new Date() },
      });
    }
    return { isNew: false, changed: false };
  }

  if (existing) {
    await prisma.citizenCategoryAssignment.update({
      where: { id: existing.id },
      data: {
        active: true,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null,
        activationCount: { increment: 1 },
        ...(input.protocolId ? { protocolId: input.protocolId, lastProtocolDate: new Date() } : {}),
      },
    });
    return { isNew: false, changed: true };
  }

  await prisma.citizenCategoryAssignment.create({
    data: {
      citizenId: input.citizenId,
      categoryId: input.categoryId,
      protocolId: input.protocolId || null,
      assignedBy: input.assignedBy || null,
      active: true,
      protocolCount: input.protocolId ? 1 : 0,
      lastProtocolDate: input.protocolId ? new Date() : null,
      metadata: { source: input.source },
    },
  });
  return { isNew: true, changed: true };
}

/** Tira a etiqueta do cidadão (fica o registro de que já teve). */
export async function removeTag(citizenId: string, categoryId: string, removedBy: string | null, reason?: string): Promise<boolean> {
  const result = await prisma.citizenCategoryAssignment.updateMany({
    where: { citizenId, categoryId, active: true },
    data: {
      active: false,
      deactivatedAt: new Date(),
      deactivatedBy: removedBy,
      deactivationReason: reason?.slice(0, 300) || null,
      deactivationCount: { increment: 1 },
    },
  });
  return result.count > 0;
}

/**
 * Pedido concluído: dá ao cidadão as etiquetas ligadas ao serviço.
 * Pode ser chamada mais de uma vez para o mesmo pedido (não repete).
 * Nunca falha quem chamou.
 */
export async function assignTagsOnProtocolConcluded(protocolId: string): Promise<AssignedTag[]> {
  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { id: true, citizenId: true, serviceId: true, moduleType: true },
    });
    if (!protocol?.citizenId) return [];

    const triggers: any[] = [];
    if (protocol.serviceId) triggers.push({ triggerServiceIds: { has: protocol.serviceId } });
    if (protocol.moduleType) triggers.push({ triggerServices: { has: protocol.moduleType } });
    if (triggers.length === 0) return [];

    const tags = await prisma.citizenCategory.findMany({
      where: { active: true, OR: triggers },
      select: { id: true, code: true, name: true },
    });

    // já contado para este pedido? (a conclusão e o fim das etapas chamam os dois)
    const already = await prisma.citizenCategoryAssignment.findMany({
      where: { citizenId: protocol.citizenId, protocolId: protocol.id, active: true, categoryId: { in: tags.map((tag) => tag.id) } },
      select: { categoryId: true },
    });
    const done = new Set(already.map((item) => item.categoryId));

    const assigned: AssignedTag[] = [];
    for (const tag of tags) {
      if (done.has(tag.id)) continue;
      const result = await assignTag({ citizenId: protocol.citizenId, categoryId: tag.id, protocolId: protocol.id, source: 'AUTO' });
      if (result.changed) assigned.push({ categoryId: tag.id, code: tag.code, name: tag.name, isNew: result.isNew });
    }
    return assigned;
  } catch (error) {
    console.error('[citizen-tags] etiquetas não atribuídas (não crítico):', error instanceof Error ? error.message : error);
    return [];
  }
}
