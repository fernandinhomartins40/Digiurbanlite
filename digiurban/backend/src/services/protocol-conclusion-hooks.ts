/**
 * O que acontece quando um protocolo é CONCLUÍDO, venha de onde vier
 * (botão Concluir, fim das etapas, aprovação de dados, apps, assistente).
 *
 * Antes cada caminho fazia a sua parte: a etiqueta do cidadão só era dada em 2
 * dos ~5 caminhos (pedidos concluídos pelos apps nunca davam etiqueta). Agora o
 * motor de status chama isto depois de gravar a conclusão.
 *
 * Tudo aqui é idempotente e nunca falha quem concluiu.
 */

import { prisma } from '../lib/prisma';
import { assignTagsOnProtocolConcluded } from './citizen-tags.service';

export async function runConclusionHooks(protocolId: string, actorId?: string | null): Promise<void> {
  try {
    // Etiquetas do cidadão ligadas ao serviço
    const assigned = await assignTagsOnProtocolConcluded(protocolId);
    const fresh = assigned.filter((tag) => tag.isNew);
    if (fresh.length > 0) {
      await prisma.protocolInteraction
        .create({
          data: {
            protocolId,
            type: 'NOTE',
            authorType: 'SYSTEM',
            authorId: actorId || null,
            authorName: 'Sistema',
            message: `O cidadão ganhou a etiqueta: ${fresh.map((tag) => tag.name).join(', ')}`,
            isInternal: true,
          },
        })
        .catch(() => undefined);
    }
  } catch (error) {
    console.error('[conclusion-hooks] não crítico:', error instanceof Error ? error.message : error);
  }
}
