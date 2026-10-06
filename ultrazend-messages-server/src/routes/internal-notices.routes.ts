/**
 * Avisos da prefeitura no chat do cidadão (chamado pelo sistema principal).
 *
 * Antes o backend inventava uma sessão de "servidor" (sem município e às vezes
 * com o usuário "system", que não existe) para mandar o aviso como se fosse um
 * administrador — o servidor de mensagens recusava, e nenhum aviso chegou aos
 * cidadãos de Palmital. E, se chegasse, cada aviso abriria uma conversa na
 * caixa do primeiro administrador.
 *
 * Agora: uma conversa "Avisos da Prefeitura" por cidadão, só de leitura,
 * autenticada pelo token interno (painel › Chaves de API › Comunicação interna).
 * Montado em /internal (fora de /api): não é alcançável pelo nginx.
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { getServiceToken } from '../utils/serviceToken';
import { ensureActiveMessageServerId } from '../utils/messageServer';
import { NOTICES_PARTICIPANT_ID } from '../server/accessControl';
import { getChatIO } from '../delivery/chatDelivery';
import { DEFAULT_TENANT_ID } from '../utils/tenant';

const router = Router();

function sameToken(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.use(async (req: Request, res: Response, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';
  const expected = await getServiceToken();
  if (!token || !expected || !sameToken(token, expected)) {
    res.status(401).json({ error: 'Token interno inválido' });
    return;
  }
  next();
});

router.post('/notices', async (req: Request, res: Response) => {
  try {
    const { citizenId, content, protocolId } = req.body || {};
    const text = String(content || '').trim().slice(0, 4000);
    if (typeof citizenId !== 'string' || !citizenId || !text) {
      res.status(400).json({ error: 'citizenId e content são obrigatórios' });
      return;
    }

    const citizen = await prisma.citizen.findUnique({ where: { id: citizenId }, select: { id: true, tenantId: true } });
    if (!citizen) {
      res.status(404).json({ error: 'Cidadão não encontrado' });
      return;
    }
    const tenantId = citizen.tenantId || DEFAULT_TENANT_ID;
    // o sistema principal informa o município; não aceita aviso para cidadão de outro
    const headerTenant = req.get('x-tenant-id');
    if (headerTenant && headerTenant !== tenantId) {
      res.status(404).json({ error: 'Cidadão não encontrado' });
      return;
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        participant1Id: citizenId,
        participant1Type: 'CITIZEN',
        participant2Id: NOTICES_PARTICIPANT_ID,
        participant2Type: 'SYSTEM',
      },
    });
    const created = !conversation;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          messageServerId: await ensureActiveMessageServerId(),
          participant1Id: citizenId,
          participant1Type: 'CITIZEN',
          participant2Id: NOTICES_PARTICIPANT_ID,
          participant2Type: 'SYSTEM',
          type: 'SUPPORT',
          status: 'ACTIVE',
          isBotConversation: false,
          metadata: { isNotices: true, systemName: 'Avisos da Prefeitura' },
        },
      });
    }

    const now = new Date();
    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        senderId: NOTICES_PARTICIPANT_ID,
        senderType: 'SYSTEM',
        content: text,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: now,
        metadata: typeof protocolId === 'string' && protocolId ? ({ protocolId } as any) : undefined,
      },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: text.substring(0, 100),
        totalMessages: { increment: 1 },
        unreadCount1: { increment: 1 },
        deletedAt1: null,
        status: 'ACTIVE',
      },
    });

    const io = getChatIO();
    if (io) {
      const room = `user:${citizenId}:CITIZEN`;
      if (created) {
        io.to(room).emit('conversation:new', {
          conversation: { ...conversation, metadata: { isNotices: true, systemName: 'Avisos da Prefeitura' } },
        });
      }
      io.to(room).emit('message:new', { conversationId: conversation.id, message });
    }

    res.json({ success: true, conversationId: conversation.id, messageId: message.id });
  } catch (error) {
    logger.error('Erro ao gravar aviso no chat', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Erro ao gravar aviso' });
  }
});

export default router;
