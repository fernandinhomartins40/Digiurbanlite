/**
 * ASSISTÊNCIA REMOTA — co-browsing com controle (2026-09-15)
 *
 * Permite que um operador de plataforma acompanhe AO VIVO a tela de um servidor
 * municipal para dar suporte, sem instalar nada. O assistido captura o próprio
 * DOM (rrweb) e transmite; o operador reproduz.
 *
 * REGRAS DE PRODUTO (definidas com o cliente):
 *   1. DOIS MODOS. `VER` (padrão) só observa + ponteiro. `CONTROLAR` deixa o
 *      operador clicar, digitar e navegar dentro do painel do assistido.
 *      O modo é pedido no convite e o assistido o vê ANTES de aceitar.
 *   2. CONSENTIMENTO EXPLÍCITO. A sessão nasce PENDENTE; só transmite depois que
 *      o assistido aceita. Ele vê quem pediu, por quê e com qual modo.
 *   3. O ASSISTIDO TEM PRECEDÊNCIA. Ele retoma o controle a qualquer momento
 *      (basta mexer no mouse/teclado) e pode devolvê-lo depois. O operador nunca
 *      "tranca" a máquina — não existe modo exclusivo.
 *
 * AUTORIA (decisão do cliente, 2026-09-15): as ações executadas durante o
 * controle continuam sendo do USUÁRIO ASSISTIDO — é a sessão dele, no navegador
 * dele, com os cookies dele. O backend não muda. O que fica registrado é a
 * JANELA de controle (`controleConcedidoEm` / `controleRetomadoEm` + contador),
 * de modo que uma auditoria consegue cruzar "o que foi feito neste intervalo"
 * com "o operador X estava no controle".
 *
 * PRIVACIDADE: a tela pode conter dado pessoal de cidadão (CPF, prontuário,
 * assistência social). Por isso:
 *   - o conteúdo NUNCA é persistido — trafega só em memória, sala a sala;
 *   - o mascaramento de campos sensíveis é feito na CAPTURA (cliente), não aqui,
 *     para que o dado sensível sequer saia da máquina do assistido;
 *   - o chat da sessão também é efêmero: não é gravado em lugar nenhum;
 *   - toda sessão deixa trilha em `remote_assist_sessions` (quem/quem/quando).
 */

import { Server } from 'socket.io';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import type { AuthenticatedSocket } from './WebSocketServer';

type AuthedSocket = AuthenticatedSocket;

/**
 * VER      → operador observa e aponta; nenhum input dele chega à página.
 * CONTROLAR→ operador também clica/digita/rola, na sessão do próprio assistido.
 */
export type Modo = 'VER' | 'CONTROLAR';

/** Tamanho máximo de uma mensagem de chat — o canal é de apoio, não um editor. */
const MAX_CHAT = 1000;

/** Sala por sessão: só o operador e o assistido daquela sessão entram. */
const roomOf = (sessionId: string) => `assist:${sessionId}`;

/**
 * Modo vigente de cada sessão ATIVA, em memória.
 *
 * POR QUE NÃO LER DO BANCO: `assist:input` roda a cada clique e a cada tecla.
 * Uma consulta por input transformaria digitar um formulário em dezenas de
 * queries. O banco continua sendo a verdade auditável (janela de controle);
 * este mapa é só o cache da decisão para o caminho quente.
 *
 * ⚠️ ESCALA: é local ao processo. Com mais de uma instância do messages-server,
 * o operador e o assistido precisam cair no MESMO processo — hoje é o caso
 * (instância única). Ao escalar horizontalmente, isto migra para o Redis, que
 * já é usado como adapter do Socket.IO.
 */
const modoDaSala = new Map<string, Modo>();

type Ack = (res: { success: boolean; error?: string; [k: string]: unknown }) => void;

const reply = (cb: Ack | undefined, res: Parameters<Ack>[0]) => {
  if (typeof cb === 'function') cb(res);
};

export function registerRemoteAssistHandlers(io: Server, socket: AuthedSocket) {
  /**
   * QUALQUER LADO → reentra na sala de uma sessão ativa.
   *
   * ⚠️ POR QUE ISTO EXISTE (corrigido 2026-09-15 — causa da "tela preta"):
   * as salas do Socket.IO vivem no SOCKET, não no usuário. Numa reconexão
   * (queda de rede, wifi trocando, aba suspensa pelo navegador) o cliente
   * ganha um socket NOVO, com id novo e ZERO salas — mas a sessão continua
   * ATIVA no banco e o React continua gravando com o rrweb.
   *
   * Sem este handler, o assistido seguia emitindo `assist:events` por um
   * socket que não estava mais em `assist:<id>`, e o guard de sala descartava
   * TUDO em silêncio: nenhum frame chegava ao operador (tela preta), nenhum
   * erro aparecia, e `eventosEnviados` ficava em 0 no banco.
   *
   * Revalidamos no banco em vez de confiar no cliente: só reentra quem é de
   * fato o operador ou o assistido de uma sessão ATIVA.
   */
  socket.on('assist:rejoin', async (data: { sessionId: string }, cb: Ack) => {
    try {
      if (!data?.sessionId) {
        return reply(cb, { success: false, error: 'sessionId obrigatório' });
      }

      const session = await prisma.remoteAssistSession.findUnique({
        where: { id: data.sessionId },
      });

      if (!session || session.status !== 'ATIVA') {
        return reply(cb, { success: false, error: 'Sessão não está ativa' });
      }

      const participa =
        session.assistedUserId === socket.userId || session.operatorId === socket.userId;
      if (!participa) {
        logger.warn('assist:rejoin negado — usuário não participa da sessão', {
          sessionId: data.sessionId,
          socketUserId: socket.userId,
        });
        return reply(cb, { success: false, error: 'Sem permissão nesta sessão' });
      }

      socket.join(roomOf(session.id));

      logger.info('Assistência remota — reentrada na sala após reconexão', {
        sessionId: session.id,
        userId: socket.userId,
        papel: session.assistedUserId === socket.userId ? 'ASSISTIDO' : 'OPERADOR',
      });

      reply(cb, { success: true, modo: modoDaSala.get(session.id) ?? session.modo });
    } catch (error) {
      logger.error('Erro em assist:rejoin', { error });
      reply(cb, { success: false, error: 'Erro ao reentrar na sessão' });
    }
  });

  /**
   * OPERADOR → solicita acompanhar a tela de um servidor.
   * Cria a sessão PENDENTE e avisa o assistido na sala pessoal dele.
   */
  socket.on(
    'assist:request',
    async (data: { assistedUserId: string; motivo?: string; modo?: Modo }, cb: Ack) => {
    try {
      if (!data?.assistedUserId) {
        return reply(cb, { success: false, error: 'assistedUserId obrigatório' });
      }

      // Modo pedido. Qualquer valor inesperado cai em VER — o menos invasivo.
      const modo: Modo = data.modo === 'CONTROLAR' ? 'CONTROLAR' : 'VER';

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
          modo,
        },
      });

      socket.join(roomOf(session.id));

      // Convite chega na sala pessoal do assistido (ele pode estar em qualquer aba).
      io.to(`user:${assisted.id}`).emit('assist:invite', {
        sessionId: session.id,
        operatorName: session.operatorName,
        motivo: session.motivo,
        modo,
        solicitadaEm: session.solicitadaEm,
      });

      logger.info('Assistência remota solicitada', {
        sessionId: session.id,
        operatorId: socket.userId,
        assistedUserId: assisted.id,
      });

      reply(cb, { success: true, sessionId: session.id, modo });
    } catch (error) {
      logger.error('Erro em assist:request', { error });
      reply(cb, { success: false, error: 'Erro ao solicitar assistência' });
    }
    }
  );

  /**
   * ASSISTIDO → aceita ou recusa. É o consentimento: sem passar por aqui,
   * nenhum frame de tela é transmitido.
   */
  socket.on(
    'assist:respond',
    async (
      data: { sessionId: string; aceitar: boolean; pagina?: string; modo?: Modo },
      cb: Ack
    ) => {
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

        // Quem aceita decide o modo FINAL. O operador pode ter pedido
        // CONTROLAR e o assistido conceder só VER — nunca o contrário, por isso
        // o pedido é o teto: sem pedir controle, aceitar não concede controle.
        const modoFinal: Modo =
          session.modo === 'CONTROLAR' && data.modo === 'CONTROLAR' ? 'CONTROLAR' : 'VER';

        await prisma.remoteAssistSession.update({
          where: { id: session.id },
          data: {
            status: 'ATIVA',
            aceitaEm: new Date(),
            paginaInicial: data.pagina?.slice(0, 500),
            modo: modoFinal,
            controleConcedidoEm: modoFinal === 'CONTROLAR' ? new Date() : null,
          },
        });

        modoDaSala.set(session.id, modoFinal);

        socket.join(roomOf(session.id));
        io.to(roomOf(session.id)).emit('assist:started', {
          sessionId: session.id,
          modo: modoFinal,
        });

        logger.info('Assistência remota aceita', {
          sessionId: session.id,
          assistedUserId: socket.userId,
        });

        reply(cb, { success: true, aceito: true, modo: modoFinal });
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
    if (!socket.rooms.has(room)) {
      // ⚠️ Este descarte era SILENCIOSO e foi o que escondeu a "tela preta"
      // (2026-09-15): após uma reconexão o socket perde as salas e todos os
      // frames morriam aqui sem log nenhum. Agora avisamos o cliente, que
      // responde com `assist:rejoin` e volta para a sala.
      //
      // Amostrado: este é caminho quente (várias vezes por segundo) e um log
      // por frame inundaria o disco durante uma falha.
      if (Math.random() < 0.05) {
        logger.warn('assist:events descartado — socket fora da sala (reconexão?)', {
          sessionId: data.sessionId,
          socketUserId: socket.userId,
        });
      }
      socket.emit('assist:rejoin-needed', { sessionId: data.sessionId });
      return;
    }

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

  /**
   * OPERADOR → pede um novo snapshot completo da tela.
   *
   * POR QUE ISTO EXISTE (bug da "tela preta", 2026-09-15): o operador monta o
   * Replayer com o primeiro lote que recebe, mas o rrweb só consegue montar a
   * árvore a partir de um FULL SNAPSHOT (type 2). Se o operador entra na sala
   * depois que aquele snapshot já passou — ou se o lote inicial traz apenas
   * eventos incrementais (type 3) —, o Replayer fica com um documento vazio e
   * nunca se recupera sozinho: o resultado é um iframe em branco/preto, com o
   * ponteiro funcionando (ele não passa pelo rrweb) e mais nada.
   *
   * Aqui o operador pede e o ASSISTIDO reemite o snapshot (`record.takeFullSnapshot`).
   */
  socket.on('assist:resync', (data: { sessionId: string }) => {
    if (!data?.sessionId) return;
    const room = roomOf(data.sessionId);
    if (!socket.rooms.has(room)) return;
    // Vai para o outro lado da sala (o assistido), não de volta a quem pediu.
    socket.to(room).emit('assist:resync');
  });

  /**
   * OPERADOR → envia um input (clique, tecla, rolagem) para a tela do assistido.
   *
   * O payload é repassado ÀS CEGAS: quem sabe traduzir coordenada em elemento é
   * o cliente do assistido, que tem o DOM real. Aqui só garantimos duas coisas,
   * e elas são as que importam:
   *   1. quem envia participa da sala (logo, passou por request+respond);
   *   2. a sessão está em modo CONTROLAR.
   *
   * O modo é lido do cache da sala, não do banco: este é caminho quente
   * (um evento por clique/tecla) e uma consulta por input seria absurda.
   */
  socket.on('assist:input', (data: { sessionId: string; input: unknown }) => {
    if (!data?.sessionId || !data.input) return;
    const room = roomOf(data.sessionId);
    if (!socket.rooms.has(room)) return;
    if (modoDaSala.get(data.sessionId) !== 'CONTROLAR') return; // controle não concedido
    socket.to(room).emit('assist:input', data.input);
  });

  /**
   * ASSISTIDO → retoma ou devolve o controle.
   *
   * PRECEDÊNCIA DO ASSISTIDO: ele nunca fica preso. Mexer no mouse/teclado já
   * dispara `assumir` no cliente dele; aqui só registramos e avisamos o operador,
   * que passa a ver a tela sem poder agir até o controle ser devolvido.
   */
  socket.on(
    'assist:control',
    async (data: { sessionId: string; conceder: boolean }, cb: Ack) => {
      try {
        const session = await prisma.remoteAssistSession.findFirst({
          where: { id: data?.sessionId, status: 'ATIVA' },
        });
        if (!session) return reply(cb, { success: false, error: 'Sessão não encontrada' });

        // Só o assistido dá ou tira o controle da própria máquina.
        if (session.assistedUserId !== socket.userId) {
          return reply(cb, { success: false, error: 'Não autorizado' });
        }

        const modo: Modo = data.conceder ? 'CONTROLAR' : 'VER';
        modoDaSala.set(session.id, modo);

        await prisma.remoteAssistSession.update({
          where: { id: session.id },
          data: data.conceder
            ? { modo, controleConcedidoEm: new Date() }
            : {
                modo,
                controleRetomadoEm: new Date(),
                controleRetomadas: { increment: 1 },
              },
        });

        io.to(roomOf(session.id)).emit('assist:mode', { sessionId: session.id, modo });
        reply(cb, { success: true, modo });
      } catch (error) {
        logger.error('Erro em assist:control', { error });
        reply(cb, { success: false, error: 'Erro ao alterar controle' });
      }
    }
  );

  /**
   * CHAT da sessão — os dois lados conversam por escrito.
   *
   * Efêmero de propósito: não gravamos nada. A conversa de suporte pode conter
   * o mesmo dado sensível que a tela ("o CPF dela é ..."), e persistir isso
   * criaria um acervo que a regra de privacidade do co-browsing evita.
   */
  socket.on('assist:chat', (data: { sessionId: string; texto: string }) => {
    const texto = typeof data?.texto === 'string' ? data.texto.trim().slice(0, MAX_CHAT) : '';
    if (!data?.sessionId || !texto) return;
    const room = roomOf(data.sessionId);
    if (!socket.rooms.has(room)) return;

    // Emitimos para a sala TODA (inclui o remetente): assim as duas pontas
    // recebem a mensagem pelo mesmo caminho e na mesma ordem do servidor.
    io.to(room).emit('assist:chat', {
      de: socket.userId,
      nome: socket.userData?.name ?? 'Participante',
      texto,
      em: new Date().toISOString(),
    });
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

      modoDaSala.delete(session.id);
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
      modoDaSala.delete(s.id);
      io.to(roomOf(s.id)).emit('assist:ended', { sessionId: s.id, motivo: 'desconexão' });
      io.socketsLeave(roomOf(s.id));
    }
  } catch (error) {
    logger.error('Erro ao encerrar sessões na desconexão', { error });
  }
}
