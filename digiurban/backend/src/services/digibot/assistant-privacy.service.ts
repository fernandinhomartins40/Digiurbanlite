/**
 * Assistente do cidadão e IA (2026-11-10, regras das lojas):
 *  - consentimento: antes do 1º uso a pessoa escolhe se as mensagens podem ir
 *    a provedores de IA de outras empresas (dados pessoais mascarados). Quem
 *    recusa é atendido sem IA (menus e busca por palavras — o mesmo caminho de
 *    quando o município está sem créditos);
 *  - denúncia: o cidadão marca uma resposta do assistente como errada ou
 *    ofensiva; o administrador vê no painel do DigiBot.
 */

import { prisma } from '../../lib/prisma';

export async function getAiConsent(citizenId: string): Promise<{ aiConsent: boolean | null; aiConsentAt: Date | null }> {
  const citizen = await prisma.citizen.findFirst({ where: { id: citizenId }, select: { aiConsent: true, aiConsentAt: true } });
  return { aiConsent: citizen?.aiConsent ?? null, aiConsentAt: citizen?.aiConsentAt ?? null };
}

export async function setAiConsent(citizenId: string, accepted: boolean) {
  await prisma.citizen.update({ where: { id: citizenId }, data: { aiConsent: accepted, aiConsentAt: new Date() } });
  return getAiConsent(citizenId);
}

/** O bot pode usar IA com esta pessoa? Só com o "sim" dela. */
export async function citizenAllowsAi(citizenId: string): Promise<boolean> {
  return (await getAiConsent(citizenId)).aiConsent === true;
}

export async function reportAnswer(input: { citizenId: string; messageId: string; reason?: string | null }) {
  const message = await prisma.message.findFirst({
    where: { id: input.messageId, OR: [{ isBotMessage: true }, { senderType: 'SYSTEM' }] },
    select: { id: true, content: true, conversationId: true, tenantId: true },
  });
  if (!message) throw Object.assign(new Error('Resposta não encontrada.'), { status: 404 });
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: message.conversationId,
      OR: [
        { participant1Id: input.citizenId, participant1Type: 'CITIZEN' },
        { participant2Id: input.citizenId, participant2Type: 'CITIZEN' },
      ],
    },
    select: { id: true },
  });
  if (!conversation) throw Object.assign(new Error('Resposta não encontrada.'), { status: 404 });
  const reason = input.reason?.trim().slice(0, 500) || null;
  return prisma.botAnswerReport.upsert({
    where: { messageId_citizenId: { messageId: message.id, citizenId: input.citizenId } },
    create: { citizenId: input.citizenId, conversationId: message.conversationId, messageId: message.id, answer: message.content.slice(0, 4000), reason, tenantId: message.tenantId },
    update: { reason, status: 'OPEN', reviewedAt: null, reviewedBy: null },
  });
}

export async function listAnswerReports(status: 'OPEN' | 'REVIEWED' | 'ALL' = 'OPEN') {
  return prisma.botAnswerReport.findMany({
    where: status === 'ALL' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, answer: true, reason: true, status: true, createdAt: true, reviewedAt: true },
  });
}

export async function markReportReviewed(id: string, userId?: string) {
  const result = await prisma.botAnswerReport.updateMany({ where: { id }, data: { status: 'REVIEWED', reviewedAt: new Date(), reviewedBy: userId || null } });
  if (result.count === 0) throw Object.assign(new Error('Denúncia não encontrada.'), { status: 404 });
}
