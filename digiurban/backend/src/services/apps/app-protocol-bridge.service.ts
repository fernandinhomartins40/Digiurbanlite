/**
 * Ponte única App → Protocolo (ARQUITETURA-DE-PRODUTO.md, seção 6.3).
 *
 * O protocolo é o recibo e o canal com o cidadão; o app é a mesa de trabalho.
 * Quando o app avança ou encerra um caso, o protocolo de origem precisa
 * refletir isso — com histórico, motivo, SLA encerrado e notificação ao
 * cidadão.
 *
 * Antes: 9 apps tinham cada um a sua cópia de `concluirProtocolo`, gravando
 * `status: 'CONCLUIDO'` direto no banco (contornando o motor de status): sem
 * histórico, sem notificação, sem encerrar o SLA, e o motivo ("Licença
 * emitida", "Inscrição indeferida") ia só para o log do servidor.
 *
 * Tudo aqui é NÃO-FATAL: uma falha ao refletir no protocolo nunca desfaz a
 * operação já concluída no app.
 */

import { ProtocolStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { protocolStatusEngine } from '../protocol-status.engine';
import { logger } from '../../config/logger.config';

const TERMINAL: string[] = [ProtocolStatus.CONCLUIDO, ProtocolStatus.CANCELADO];

export interface AppProtocolUpdate {
  /** Protocolo de origem do caso (null/undefined = caso sem protocolo: nada a fazer) */
  protocolId: string | null | undefined;
  /** Nome do app para o cidadão (ex.: "Licenciamento Urbano") */
  app: string;
  /** O que aconteceu, em linguagem do cidadão (ex.: "Licença ALV-2026-0012 emitida") */
  message: string;
  /** Usuário que realizou a ação no app, quando houver */
  actorId?: string;
}

/**
 * O app ENCERROU o caso (deferido ou indeferido). O protocolo é concluído
 * pelo motor de status, com o motivo registrado no histórico.
 */
export async function concludeProtocolFromApp(input: AppProtocolUpdate & { outcome?: 'DEFERIDO' | 'INDEFERIDO' }) {
  const { protocolId, app, message, actorId, outcome } = input;
  if (!protocolId) return;

  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { status: true },
    });
    if (!protocol || TERMINAL.includes(protocol.status)) return;

    const metadata = { source: 'APP', app, ...(outcome && { outcome }) };

    // Serviços com formulário não vão direto de VINCULADO para CONCLUIDO
    if (protocol.status === ProtocolStatus.VINCULADO) {
      await protocolStatusEngine.updateStatus({
        protocolId,
        newStatus: ProtocolStatus.PROGRESSO,
        actorRole: 'SYSTEM',
        actorId,
        comment: `${app}: pedido em atendimento`,
        metadata,
      } as any);
    }

    await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.CONCLUIDO,
      actorRole: 'SYSTEM',
      actorId,
      comment: `${app}: ${message}`,
      reason: message,
      metadata,
    } as any);
  } catch (error) {
    logger.warn(`[app-bridge] ${app}: falha ao concluir protocolo ${protocolId} (não-fatal) — ${message}`, error);
  }
}

/**
 * O app COMEÇOU a atender o caso: o protocolo sai de "Vinculado" para
 * "Em progresso" (o cidadão vê que o pedido está sendo tratado).
 */
export async function markProtocolInProgressFromApp(input: AppProtocolUpdate) {
  const { protocolId, app, message, actorId } = input;
  if (!protocolId) return;

  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { status: true },
    });
    if (!protocol || protocol.status !== ProtocolStatus.VINCULADO) return;

    await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.PROGRESSO,
      actorRole: 'SYSTEM',
      actorId,
      comment: `${app}: ${message}`,
      metadata: { source: 'APP', app },
    } as any);
  } catch (error) {
    logger.warn(`[app-bridge] ${app}: falha ao atualizar protocolo ${protocolId} (não-fatal) — ${message}`, error);
  }
}

/**
 * O app tem uma NOVIDADE para o cidadão que não encerra o caso (vaga
 * reservada, documento pendente, aguardando estoque...). Vira mensagem
 * visível no pedido + aviso no portal (sem e-mail: o plano do VeloMail é
 * limitado e o encerramento já manda e-mail). Também tira o pedido de
 * "Vinculado", porque alguém já está cuidando dele.
 */
export async function noteProtocolFromApp(input: AppProtocolUpdate) {
  const { protocolId, app, message, actorId } = input;
  if (!protocolId) return;

  try {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { status: true, number: true, citizenId: true },
    });
    if (!protocol || TERMINAL.includes(protocol.status)) return;

    await markProtocolInProgressFromApp({ protocolId, app, message, actorId });

    await prisma.protocolInteraction.create({
      data: {
        protocolId,
        type: 'MESSAGE',
        authorType: 'SYSTEM',
        authorId: actorId,
        authorName: app,
        message,
        isInternal: false,
        metadata: { source: 'APP', app },
      },
    });

    if (protocol.citizenId) {
      const { default: notificationService } = await import('../notification.service');
      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: protocol.citizenId,
        type: 'PROTOCOL_MESSAGE' as any,
        title: `Novidade no pedido ${protocol.number}`,
        message,
        data: { protocolId, protocolNumber: protocol.number, url: `/cidadao/protocolos/${protocolId}` },
        priority: 'normal',
      } as any);
    }
  } catch (error) {
    logger.warn(`[app-bridge] ${app}: falha ao avisar no protocolo ${protocolId} (não-fatal) — ${message}`, error);
  }
}
