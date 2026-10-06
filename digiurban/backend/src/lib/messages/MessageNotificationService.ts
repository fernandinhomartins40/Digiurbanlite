import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../prisma';
import { sendChatNotice } from '../../services/chat-notices.service';

/**
 * Avisos dos pedidos no chat do cidadão (conversa "Avisos da Prefeitura").
 *
 * Antes cada aviso era enviado "como" o servidor responsável (ou "system") com
 * uma sessão inventada sem município — o servidor de mensagens recusava e
 * nenhum aviso chegava; e, se chegasse, abriria uma conversa por cidadão na
 * caixa do servidor. Os avisos não falham quem chamou.
 */
export class MessageNotificationService {
  /** Pedido criado */
  async notifyProtocolCreated(protocolId: string) {
    const protocol = await prisma.protocolSimplified
      .findUnique({ where: { id: protocolId }, include: { citizen: true, service: true } })
      .catch(() => null);
    if (!protocol?.citizen) return;
    await sendChatNotice({
      citizenId: protocol.citizenId,
      protocolId: protocol.id,
      content: `Recebemos o seu pedido nº ${protocol.number} (${protocol.service?.name || 'serviço'}). Acompanhe o andamento em "Meus pedidos".`,
    });
  }

  /** Mudança de situação do pedido */
  async notifyProtocolStatusChanged(protocolId: string, oldStatus: string, newStatus: string) {
    const protocol = await prisma.protocolSimplified
      .findUnique({ where: { id: protocolId }, select: { id: true, number: true, citizenId: true } })
      .catch(() => null);
    if (!protocol?.citizenId) return;
    const statusMessages: Record<string, string> = {
      PROGRESSO: 'está em andamento',
      CONCLUIDO: 'foi concluído',
      CANCELADO: 'foi cancelado',
    };
    // pendência/atualização têm aviso próprio (o que falta e até quando)
    const what = statusMessages[newStatus];
    if (!what || oldStatus === newStatus) return;
    await sendChatNotice({
      citizenId: protocol.citizenId,
      protocolId: protocol.id,
      content: `Seu pedido nº ${protocol.number} ${what}.`,
    });
  }

  /** Comentário da equipe no pedido */
  async notifyNewComment(protocolId: string, commentText: string, authorName: string) {
    const protocol = await prisma.protocolSimplified
      .findUnique({ where: { id: protocolId }, select: { id: true, number: true, citizenId: true } })
      .catch(() => null);
    if (!protocol?.citizenId) return;
    const text = commentText.length > 600 ? `${commentText.slice(0, 597)}...` : commentText;
    await sendChatNotice({
      citizenId: protocol.citizenId,
      protocolId: protocol.id,
      content: `${authorName.split(' ')[0]} comentou no pedido nº ${protocol.number}:\n\n"${text}"`,
    });
  }

  /** Documento novo no pedido */
  async notifyDocumentUploaded(protocolId: string, documentName: string) {
    const protocol = await prisma.protocolSimplified
      .findUnique({ where: { id: protocolId }, select: { id: true, number: true, citizenId: true } })
      .catch(() => null);
    if (!protocol?.citizenId) return;
    await sendChatNotice({
      citizenId: protocol.citizenId,
      protocolId: protocol.id,
      content: `Um documento novo foi enviado no pedido nº ${protocol.number}: ${documentName}.`,
    });
  }

  /** Pendência aberta para o cidadão */
  async notifyProtocolPendingCreated(protocolId: string, pendingId: string) {
    const pending = await prisma.protocolPending
      .findUnique({ where: { id: pendingId }, include: { protocol: { select: { id: true, number: true, citizenId: true } } } })
      .catch(() => null);
    if (!pending?.protocol?.citizenId) return;
    const metadata = pending.metadata && typeof pending.metadata === 'object' ? (pending.metadata as Record<string, any>) : {};
    const dueDate = pending.dueDate ? ` Prazo: ${new Date(pending.dueDate).toLocaleDateString('pt-BR')}.` : '';
    const extra = metadata.documentType
      ? ` Documento pedido: ${metadata.documentType}.`
      : metadata.fieldLabel
        ? ` Informação pedida: ${metadata.fieldLabel}.`
        : '';
    await sendChatNotice({
      citizenId: pending.protocol.citizenId,
      protocolId: pending.protocol.id,
      content: `A prefeitura precisa de algo seu no pedido nº ${pending.protocol.number}: ${pending.title}.${extra}${dueDate} Responda pelo assistente ou em "Meus pedidos".`,
    });
  }

  /** Lembrete de pendência (perto do prazo ou vencida) */
  async notifyProtocolPendingReminder(protocolId: string, pendingId: string, reminderType: 'upcoming' | 'overdue' = 'upcoming') {
    const pending = await prisma.protocolPending
      .findUnique({ where: { id: pendingId }, include: { protocol: { select: { id: true, number: true, citizenId: true } } } })
      .catch(() => null);
    if (!pending?.protocol?.citizenId) return;
    const dueDate = pending.dueDate ? new Date(pending.dueDate).toLocaleDateString('pt-BR') : null;
    const intro =
      reminderType === 'overdue'
        ? 'Sua pendência continua aberta e o prazo já passou.'
        : 'Lembrete: você ainda tem uma pendência aberta.';
    await sendChatNotice({
      citizenId: pending.protocol.citizenId,
      protocolId,
      content: `${intro} Pedido nº ${pending.protocol.number}: ${pending.title}.${dueDate ? ` Prazo: ${dueDate}.` : ''} Responda pelo assistente ou em "Meus pedidos".`,
    });
  }

  /**
   * Boas-vindas: abre a conversa com o assistente já no cadastro (a primeira
   * conversa do cidadão é sempre a do assistente). A sessão leva o município
   * do cidadão — antes ia sem, e o assistente carregava a configuração errada.
   */
  async sendWelcomeMessage(citizenId: string) {
    try {
      const citizen = await prisma.citizen.findUnique({ where: { id: citizenId }, select: { id: true, tenantId: true } });
      if (!citizen || !process.env.JWT_SECRET) return;
      const token = jwt.sign(
        { citizenId, userId: citizenId, type: 'citizen', userType: 'CITIZEN', tenantId: citizen.tenantId || undefined },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      const baseUrl = process.env.MESSAGES_SERVER_URL || 'http://ultrazend-messages:9001';
      await axios.post(
        `${baseUrl}/api/bot-flow/start`,
        { flowName: 'ai_assistant' },
        { timeout: 15000, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.warn('[MessageNotificationService] boas-vindas no assistente não enviadas:', error instanceof Error ? error.message : error);
    }
  }
}

export default new MessageNotificationService();
