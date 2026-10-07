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

/** marca do documento final gerado na conclusão (publica sozinho depois de assinado) */
export const FINAL_DOCUMENT_STAGE = 'Documento final do serviço';

/**
 * Documento final do serviço (certidão, alvará...): gerado na conclusão, fica
 * esperando a assinatura de quem concluiu; assinado, vai sozinho para o cidadão.
 */
async function generateFinalDocument(protocolId: string, actorId?: string | null) {
  const protocol = await prisma.protocolSimplified.findFirst({
    where: { id: protocolId },
    select: { id: true, number: true, currentAssignedUserId: true, assignedUserId: true, service: { select: { finalDocumentTemplateId: true, name: true } } },
  });
  const templateId = protocol?.service?.finalDocumentTemplateId;
  if (!protocol || !templateId) return;
  const template = await prisma.documentTemplate.findFirst({ where: { id: templateId, isActive: true, scope: 'PROTOCOL' }, select: { id: true, name: true } });
  if (!template) return;
  const already = await prisma.generatedDocument.findFirst({ where: { protocolId, templateId, isActive: true, status: { not: 'SUPERSEDED' } }, select: { id: true } });
  if (already) return;
  const signerId = actorId || protocol.currentAssignedUserId || protocol.assignedUserId;
  if (!signerId) return;
  const { generateDocument } = await import('./document-generator.service');
  const document = await generateDocument({
    templateId,
    protocolId,
    generatedBy: signerId,
    sourceStageName: FINAL_DOCUMENT_STAGE,
  } as any);
  await prisma.protocolInteraction
    .create({
      data: {
        protocolId,
        type: 'NOTE',
        authorType: 'SYSTEM',
        authorId: signerId,
        authorName: 'Sistema',
        message: `${template.name} gerado na conclusão. Assine para ele ir ao cidadão.`,
        isInternal: true,
      },
    })
    .catch(() => undefined);
  const notificationService = (await import('./notification.service')).default;
  await notificationService
    .notify({
      recipientType: 'user',
      recipientId: signerId,
      type: 'SIGNATURE_REQUESTED',
      title: `Assine: ${template.name}`,
      message: `Protocolo ${protocol.number} concluído — o documento vai ao cidadão depois da sua assinatura.`,
      data: { actionUrl: `/admin/protocolos/${protocolId}`, documentId: document.id },
    })
    .catch(() => undefined);
}

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
  try {
    await generateFinalDocument(protocolId, actorId);
  } catch (error) {
    console.error('[conclusion-hooks] documento final não gerado:', error instanceof Error ? error.message : error);
  }
}
