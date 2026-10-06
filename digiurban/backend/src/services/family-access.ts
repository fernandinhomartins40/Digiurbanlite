/**
 * Quem pode agir por um familiar (ver pedidos, enviar e baixar documentos).
 *
 * Só vale vínculo CONFIRMADO (ACTIVE). Antes bastava existir a linha em
 * family_compositions — e ela nasce "pendente" com o CPF de qualquer pessoa,
 * então quem soubesse um CPF via, baixava e apagava os documentos dos pedidos
 * dela sem que ela aceitasse nada.
 */

import { FamilyLinkStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function canActForFamilyMember(
  actorId: string,
  targetId: string,
  options: { requireDependent?: boolean } = {}
): Promise<boolean> {
  if (!actorId || !targetId) return false;
  if (actorId === targetId) return true;
  const link = await prisma.familyComposition.findFirst({
    where: {
      headId: actorId,
      memberId: targetId,
      status: FamilyLinkStatus.ACTIVE,
      ...(options.requireDependent ? { isDependent: true } : {}),
    },
    select: { id: true },
  });
  return Boolean(link);
}
