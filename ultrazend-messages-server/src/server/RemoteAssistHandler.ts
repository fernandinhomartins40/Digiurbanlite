/**
 * ASSISTÊNCIA REMOTA — co-browsing somente-visualização (2026-09-15)
 *
 * Permite que um operador de plataforma acompanhe AO VIVO a tela de um servidor
 * municipal para dar suporte, sem instalar nada. O assistido captura o próprio
 * DOM (rrweb) e transmite; o operador reproduz.
 *
 * REGRAS DE PRODUTO (definidas com o cliente):
 *   1. SOMENTE VISUALIZAÇÃO + ponteiro. Não há controle remoto — quem clica é
 *      sempre o usuário assistido. Isso elimina a pergunta "quem assinou aquele
 *      protocolo?", já que nenhuma ação é executada pelo operador.
 *   2. CONSENTIMENTO EXPLÍCITO. A sessão nasce PENDENTE; só transmite depois que
 *      o assistido aceita. Ele vê quem pediu e por quê antes de decidir.
 *
 * PRIVACIDADE: a tela pode conter dado pessoal de cidadão (CPF, prontuário,
 * assistência social). Por isso:
 *   - o conteúdo NUNCA é persistido — trafega só em memória, sala a sala;
 *   - o mascaramento de campos sensíveis é feito na CAPTURA (cliente), não aqui,
 *     para que o dado sensível sequer saia da máquina do assistido;
 *   - toda sessão deixa trilha em `remote_assist_sessions` (quem/quem/quando).
 */

import { Server } from 'socket.io';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import type { AuthenticatedSocket } from './WebSocketServer';

type AuthedSocket = AuthenticatedSocket;

/** Sala por sessão: só o operador e o assistido daquela sessão entram. */
const roomOf = (sessionId: string) => `assist:${sessionId}`;

type Ack = (res: { success: boolean; error?: string; [k: string]: unknown }) => void;

const reply = (cb: Ack | undefined, res: Parameters<Ack>[0]) => {
  if (typeof cb === 'function') cb(res);
};

export function registerRemoteAssistHandlers(io: Server, socket: AuthedSocket) {
  /**
   * OPERADOR → solicita acompanhar a tela de um servidor.
   * Cria a sessão PENDENTE e avisa o assistido na sala pessoal dele.
   */
  socket.on('assist:request', async (data: { assistedUserId: string; motivo?: string }, cb: Ack) => {
    try {
      if (!data?.assistedUserId) {
        return reply(cb, { success: false, error: 'assistedUserId obrigatório' });
      }

      // O alvo precisa existir e estar ativo — evita criar convite órfão.
      // NOTA: o schema local (cópia reduzida) não expõe `tenantId` em User —
      // por isso o tenant da sessão vem do contexto do socket, não daqui.
      const assisted = await prisma.user.findFirst({
        where: { id: data.assistedUserId, isActive: true },
        select: { id: true, name: true },
      });
      if (!assisted) {
        return reply(cb, { success: false, error: 'Usuário não encontrado ou inativo' });
      }

      // Uma sessão viva por assistido de cada vez: duas pessoas observando a
      // mesma tela simultaneamente confundiria o consentimento (o assistido
      // aceitou UM operador, não uma plateia).
      const emAndamento = await prisma.remoteAssistSession.findFirst({
        where: { assistedUserId: assisted.id, status: { in: ['PENDENTE', 'ATIVA'] } },
        select: { id: true, status: true },
      });
      if (emAndamento) {
        return reply(cb, {
          success: false,
          error:
            emAndamento.status === 'ATIVA'
              ? 'Este usuário já está em uma sessão de assistência'
              : 'Já existe um convite pendente para este usuário',
        });
      }

      const session = await prisma.remoteAssistSession.create({
        data: {
          // Tenant do contexto da conexão (resolvido no handshake pelo JWT).
          tenantId: socket.tenantId ?? null,
          operatorId: socket.userId,
          // name/email vêm do payload do JWT (userData), não de campos soltos.
          operatorName: socket.userData?.name ?? 'Operador',
          operatorEmail: socket.userData?.email ?? '',
          assistedUserId: assisted.id,
          status: 'PENDENTE',
          motivo: data.motivo?.slice(0, 500) ?? null,
        },
      });

      socket.join(roomOf(session.id));

      // Convite chega na sala pessoal do assistido (ele pode estar em qualquer aba).
      io.to(`user:${assisted.id}`).emit('assist:invite', {
        sessionId: session.id,
        operatorName: session.operatorName,
        motivo: session.motivo,
        solicitadaEm: session.solicitadaEm,
      });

      logger.info('Assistência remota solicitada', {
        sessionId: session.id,
        operatorId: socket.userId,
        assistedUserId: assisted.id,
      });

      reply(cb, { success: true, sessionId: session.id });
    } catch (error) {
      logger.error('Erro em assist:request', { error });
      reply(cb, { success: false, error: 'Erro ao solicitar assistência' });
    }
  });

  /**
   * ASSISTIDO → aceita ou recusa. É o consentimento: sem passar por aqui,
   * nenhum frame de tela é transmitido.
   */
  socket.on(
    'assist:respond',
    async (data: { sessionId: string; aceitar: boolean; pagina?: string }, cb: Ack) => {
      try {
        const session = await prisma.remoteAssistSession.findFirst({
          where: { id: data?.sessionId, status: 'PENDENTE' },
        });
        if (!session) {
          return reply(cb, { success: false, error: 'Convite não encontrado ou já respondido' });
        }

        // Só o próprio assistido responde — ninguém consente pelo outro.
        if (session.assistedUserId !== socket.userId) {
          logger.warn('Tentativa de responder convite alheio', {
            sessionId: session.id,
            socketUserId: socket.userId,
          });
          return reply(cb, { success: false, error: 'Não autorizado' });
        }

        if (!data.aceitar) {
          await prisma.remoteAssistSession.update({
            where: { id: session.id },
            data: { status: 'RECUSADA', encerradaEm: new Date(), encerradaPor: 'ASSISTIDO' },
          });
          io.to(roomOf(session.id)).emit('assist:declined', { sessionId: session.id });
          return reply(cb, { success: true, aceito: false });
        }

        await prisma.remoteAssistSession.update({
          where: { id: session.id },
          data: { status: 'ATIVA', aceitaEm: new Date(), paginaInicial: data.pagina?.slice(0, 500) },
        });

        socket.join(roomOf(session.id));
        io.to(roomOf(session.id)).emit('assist:started', { sessionId: session.id });

        logger.info('Assistência remota aceita', {
          sessionId: session.id,
          assistedUserId: socket.userId,
        });

        reply(cb, { success: true, aceito: true });
      } catch (error) {
        logger.error('Erro em assist:respond', { error });
        reply(cb, { success: false, error: 'Erro ao responder convite' });
      }
    }
  );

  /**
   * ASSISTIDO → envia os eventos de tela (rrweb).
   *
   * Caminho quente: chamado muitas vezes por segundo. Por isso NÃO consulta o
   * banco a cada frame — a autorização é feita pela sala: só quem entrou em
   * `assist:<id>` recebe, e só entra quem passou por request/respond acima.
   * O contador é incrementado de forma amostrada (a cada 50 lotes) para não
   * transformar telemetria em carga de escrita.
   */
  socket.on('assist:events', (data: { sessionId: string; events: unknown[] }) => {
    if (!data?.sessionId || !Array.isArray(data.events) || data.events.length === 0) return;

    const room = roomOf(data.sessionId);
    if (!socket.rooms.has(room)) return; // não participa desta sessão

    // `socket.to` exclui o próprio remetente: o assistido não recebe de volta.
    socket.to(room).emit('assist:events', { sessionId: data.sessionId, events: data.events });

    if (Math.random() < 0.02) {
      prisma.remoteAssistSession
        .updateMany({
          where: { id: data.sessionId, status: 'ATIVA' },
          data: { eventosEnviados: { increment: 50 } },
        })
        .catch(() => undefined);
    }
  });

  /**
   * OPERADOR → move o ponteiro na tela do assistido (orientação visual).
   * É o único "controle" que existe, e ele não clica em nada.
   */
  socket.on('assist:pointer', (data: { sessionId: string; x: number; y: number }) => {
    if (!data?.sessionId) return;
    const room = roomOf(data.sessionId);
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit('assist:pointer', { x: data.x, y: data.y });
  });

  /** Qualquer um dos lados encerra. */
  socket.on('assist:end', async (data: { sessionId: string }, cb: Ack) => {
    try {
      const session = await prisma.remoteAssistSession.findFirst({
        where: { id: data?.sessionId, status: { in: ['PENDENTE', 'ATIVA'] } },
      });
      if (!session) return reply(cb, { success: true }); // idempotente

      const ehParticipante =
        session.assistedUserId === socket.userId || session.operatorId === socket.userId;
      if (!ehParticipante) return reply(cb, { success: false, error: 'Não autorizado' });

      await prisma.remoteAssistSession.update({
        where: { id: session.id },
        data: {
          status: 'ENCERRADA',
          encerradaEm: new Date(),
          encerradaPor: session.assistedUserId === socket.userId ? 'ASSISTIDO' : 'OPERADOR',
        },
      });

      io.to(roomOf(session.id)).emit('assist:ended', { sessionId: session.id });
      io.socketsLeave(roomOf(session.id));

      logger.info('Assistência remota encerrada', {
        sessionId: session.id,
        encerradaPor: socket.userId,
      });

      reply(cb, { success: true });
    } catch (error) {
      logger.error('Erro em assist:end', { error });
      reply(cb, { success: false, error: 'Erro ao encerrar sessão' });
    }
  });
}

/**
 * Encerra sessões vivas de um usuário que caiu.
 * Sem isto, fechar a aba deixaria a sessão ATIVA para sempre e bloquearia
 * novos convites (pela regra de uma sessão por vez).
 */
export async function endSessionsOnDisconnect(io: Server, userId: string) {
  try {
    const abertas = await prisma.remoteAssistSession.findMany({
      where: {
        status: { in: ['PENDENTE', 'ATIVA'] },
        OR: [{ assistedUserId: userId }, { operatorId: userId }],
      },
      select: { id: true },
    });
    if (abertas.length === 0) return;

    await prisma.remoteAssistSession.updateMany({
      where: { id: { in: abertas.map((s) => s.id) } },
      data: { status: 'ENCERRADA', encerradaEm: new Date(), encerradaPor: 'SISTEMA' },
    });

    for (const s of abertas) {
      io.to(roomOf(s.id)).emit('assist:ended', { sessionId: s.id, motivo: 'desconexão' });
      io.socketsLeave(roomOf(s.id));
    }
  } catch (error) {
    logger.error('Erro ao encerrar sessões na desconexão', { error });
  }
}
