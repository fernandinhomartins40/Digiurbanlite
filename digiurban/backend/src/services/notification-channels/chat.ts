/**
 * Canal "chat": entrega o aviso na conversa "Avisos da Prefeitura" do cidadão
 * (servidor de mensagens). Antes se chamava "whatsapp", mas nunca enviou
 * WhatsApp — o nome antigo continua aceito para dados já salvos.
 *
 * Servidores recebem avisos pelo sininho do painel; o chat é só do cidadão.
 */
import { NotificationPayload } from '../../types/notification.types';
import { sendChatNotice } from '../chat-notices.service';

export async function sendChatMessage(payload: NotificationPayload): Promise<{ success: boolean }> {
  if (payload.recipientType !== 'citizen') return { success: false };
  const sent = await sendChatNotice({
    citizenId: payload.recipientId,
    content: `${payload.title}\n\n${payload.message}`,
    protocolId: (payload.data?.protocolId as string | undefined) || null,
  });
  return { success: sent };
}
