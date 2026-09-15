/**
 * Cliente Socket.IO do MESSAGES-SERVER (porta 9001).
 *
 * ⚠️ NÃO confundir com `lib/socket-manager.ts`: aquele conecta no BACKEND
 * (:3001, path `/api/socket`). São dois servidores Socket.IO distintos, com
 * paths diferentes — misturá-los foi armadilha documentada no CLAUDE.md.
 *
 * Aqui vivem os eventos de chat/bot e, desde 2026-09-15, os de assistência
 * remota (`assist:*`), cujos handlers estão em
 * ultrazend-messages-server/src/server/RemoteAssistHandler.ts.
 *
 * Autenticação: o handshake aceita o cookie httpOnly `digiurban_admin_token`
 * (ver WebSocketServer.ts), por isso `withCredentials: true` — não é preciso
 * passar token no cliente.
 */

import { io, Socket } from 'socket.io-client'

let instance: Socket | null = null

export function getMessagesSocket(): Socket {
  if (!instance || instance.disconnected) {
    // ⚠️ ESQUEMA DA URL (corrigido 2026-09-15): NEXT_PUBLIC_MESSAGES_WS_URL vale
    // `wss://digiurban.com.br` no build. Usá-la crua quebrava a conexão: o
    // Socket.IO começa por `polling`, que é uma requisição HTTP — e `wss://` não
    // é esquema válido para ela. Resultado: ZERO conexões chegavam ao
    // messages-server e o botão de assistência não dava retorno algum.
    //
    // Convertemos wss->https e ws->http. O Socket.IO faz o upgrade para
    // WebSocket sozinho depois do handshake.
    // ⚠️ MULTI-TENANT / SUBDOMÍNIO (corrigido 2026-09-15)
    //
    // A ORIGEM ATUAL vem primeiro, e NEXT_PUBLIC_MESSAGES_WS_URL é só fallback.
    // Antes a env tinha precedência e apontava sempre para
    // `https://digiurban.com.br`. Para quem acessa por um subdomínio de
    // município (palmital.digiurban.com.br) isso virava conexão CROSS-ORIGIN, e
    // o cookie `digiurban_admin_token` é sameSite=lax — ou seja, NÃO era
    // enviado no handshake. Resultado: o servidor rejeitava a conexão e o
    // usuário assistido nunca recebia o convite de assistência remota.
    //
    // Usando a origem atual, o socket acompanha o domínio de acesso e o cookie
    // viaja como same-site. O nginx roteia /socket.io/ em qualquer subdomínio
    // (server_name *.digiurban.com.br), então funciona para todos os municípios.
    const raw =
      (typeof window !== 'undefined' ? window.location.origin : '') ||
      process.env.NEXT_PUBLIC_MESSAGES_WS_URL ||
      'http://localhost:9001'

    const url = raw.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')

    instance = io(url, {
      // Path default do Socket.IO — o messages-server NÃO usa /api/socket.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true, // envia o cookie httpOnly no handshake
    })

    instance.on('connect_error', (err) => {
      console.warn('[messages-socket] falha ao conectar:', err.message)
    })
  }

  return instance
}

export function disconnectMessagesSocket(): void {
  if (instance) {
    instance.disconnect()
    instance = null
  }
}
