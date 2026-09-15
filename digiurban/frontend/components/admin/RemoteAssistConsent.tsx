'use client'

/**
 * ASSISTÊNCIA REMOTA — lado do USUÁRIO ASSISTIDO (2026-09-15)
 *
 * Monta no painel administrativo e fica ocioso até chegar um convite. Ao chegar:
 *   1. mostra QUEM pediu, POR QUÊ e em QUAL MODO, e espera aceite explícito;
 *   2. só depois do aceite começa a capturar e transmitir a tela;
 *   3. mantém um indicador VISÍVEL o tempo todo enquanto transmite, com botão
 *      de encerrar sempre à mão.
 *
 * MODOS
 *   VER       — o operador observa e aponta. Nenhum input dele toca a página.
 *   CONTROLAR — o operador também clica, digita e navega, AQUI, nesta aba.
 *
 * PRECEDÊNCIA DO ASSISTIDO (regra central do modo CONTROLAR): quem está na
 * máquina manda. Qualquer mouse/tecla REAL do assistido retoma o controle na
 * hora, sem pedir nada a ninguém. Devolver é um clique consciente. Por isso o
 * operador nunca "tranca" a máquina de um servidor municipal.
 *
 * AUTORIA: os cliques do operador viram eventos nativos NESTA aba, com a sessão
 * e os cookies do assistido — ou seja, para o backend a ação é do assistido,
 * como decidido com o cliente. A janela de controle fica registrada no servidor
 * (ver RemoteAssistHandler.ts) para a auditoria conseguir cruzar depois.
 *
 * PRIVACIDADE (LGPD): a tela de um servidor municipal exibe dado pessoal de
 * cidadão. Por isso o mascaramento acontece AQUI, na captura — o texto sensível
 * nem chega a sair desta máquina:
 *   - `maskAllInputs` cobre todo campo de formulário;
 *   - `.dado-sensivel` e `[data-sensivel]` marcam blocos a bloquear;
 *   - `maskTextClass` permite marcar qualquer elemento como texto mascarado.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { record } from 'rrweb'
import { getMessagesSocket } from '@/lib/messages-socket'
import { Button } from '@/components/ui/button'
import { Eye, MessageSquare, MousePointer2, Send, ShieldAlert, X } from 'lucide-react'

type Modo = 'VER' | 'CONTROLAR'

interface Invite {
  sessionId: string
  operatorName: string
  motivo?: string | null
  modo?: Modo
}

interface ChatMsg {
  de: string
  nome: string
  texto: string
  em: string
}

/**
 * Input remoto. As coordenadas chegam NORMALIZADAS (0..1) em relação à página
 * do assistido: a janela do operador quase nunca tem o mesmo tamanho, então
 * mandar pixel cru acertaria o elemento errado.
 */
type RemoteInput =
  | { tipo: 'click'; x: number; y: number }
  | { tipo: 'dblclick'; x: number; y: number }
  | { tipo: 'scroll'; x: number; y: number }
  | { tipo: 'key'; key: string }
  | { tipo: 'text'; valor: string }

export function RemoteAssistConsent() {
  const [invite, setInvite] = useState<Invite | null>(null)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [modo, setModo] = useState<Modo>('VER')
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

  const [chatAberto, setChatAberto] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [rascunho, setRascunho] = useState('')

  const stopRecordingRef = useRef<(() => void) | null>(null)
  /** Espelha `modo` para uso dentro de listeners nativos, que não veem o state. */
  const modoRef = useRef<Modo>('VER')
  const sessionRef = useRef<string | null>(null)

  /** Interrompe a captura e limpa o estado — idempotente. */
  const stopCapture = useCallback(() => {
    try {
      stopRecordingRef.current?.()
    } catch {
      /* rrweb já parado */
    }
    stopRecordingRef.current = null
    sessionRef.current = null
    modoRef.current = 'VER'
    setActiveSession(null)
    setModo('VER')
    setPointer(null)
    setChatAberto(false)
    setMsgs([])
    setNaoLidas(0)
  }, [])

  const startCapture = useCallback((sessionId: string) => {
    // Lote por tempo: emitir evento a evento inundaria o socket em páginas
    // com muita animação. 300 ms mantém a sensação de "ao vivo" com ~3 envios/s.
    let buffer: unknown[] = []
    const flush = () => {
      if (buffer.length === 0) return
      // ⚠️ Resolver o socket A CADA envio (corrigido 2026-09-15). Antes
      // capturávamos a instância uma vez, na closure. Como
      // `getMessagesSocket()` devolve uma instância NOVA quando a anterior
      // caiu, a closure podia ficar segurando um socket morto para sempre —
      // e os frames iam para o vazio sem erro nenhum.
      const socket = getMessagesSocket()
      if (!socket?.connected) return // reconectando: descarta o lote, o próximo snapshot recupera
      socket.emit('assist:events', { sessionId, events: buffer })
      buffer = []
    }
    const timer = setInterval(flush, 300)

    const stop = record({
      emit(event) {
        buffer.push(event)
        // Snapshot completo (type 2) vai imediato: é o que permite ao operador
        // montar a tela inicial sem esperar o próximo lote.
        if ((event as { type?: number }).type === 2) flush()
      },
      // Sem isto o rrweb só emite um full snapshot no início. Se o operador
      // entra depois (ou o primeiro perde-se), não haveria outro type 2 nunca
      // mais — e `assist:resync` dependeria só do takeFullSnapshot manual.
      checkoutEveryNms: 30000,
      maskAllInputs: true,
      maskTextClass: 'mask-remote-assist',
      blockClass: 'dado-sensivel',
      blockSelector: '[data-sensivel]',
      // Sem capturar requisições de rede nem console: reduz superfície de
      // vazamento e peso do stream.
      recordCanvas: false,
      collectFonts: false,
    })

    stopRecordingRef.current = () => {
      clearInterval(timer)
      flush()
      stop?.()
    }
  }, [])

  /**
   * Devolve/retoma o controle. `origem` distingue o clique consciente no botão
   * da retomada automática por ter mexido no mouse/teclado.
   */
  const definirControle = useCallback((conceder: boolean) => {
    const socket = getMessagesSocket()
    const sessionId = sessionRef.current
    if (!socket || !sessionId) return
    // Atualiza já, sem esperar o servidor: a precedência do assistido não pode
    // depender de ida e volta de rede.
    modoRef.current = conceder ? 'CONTROLAR' : 'VER'
    setModo(modoRef.current)
    socket.emit('assist:control', { sessionId, conceder })
  }, [])

  /**
   * Aplica na página um input vindo do operador.
   *
   * COMO: convertemos a coordenada normalizada em pixel desta janela e usamos
   * `elementFromPoint` para achar o alvo real. Isso funciona em qualquer tela
   * (inclusive com tamanhos diferentes dos dois lados) e não exige mapear ids
   * de nó do rrweb de volta para elementos.
   */
  const aplicarInput = useCallback((input: RemoteInput) => {
    if (modoRef.current !== 'CONTROLAR') return

    if (input.tipo === 'scroll') {
      window.scrollBy(input.x, input.y)
      return
    }

    if (input.tipo === 'key' || input.tipo === 'text') {
      const alvo = document.activeElement as HTMLElement | null
      if (!alvo) return
      const campo = alvo as HTMLInputElement | HTMLTextAreaElement
      const editavel =
        campo.tagName === 'INPUT' || campo.tagName === 'TEXTAREA' || alvo.isContentEditable

      if (input.tipo === 'text') {
        if (!editavel) return
        // Setter nativo + evento: é o caminho que o React reconhece. Atribuir
        // `.value` direto não dispara o onChange e o formulário ficaria com o
        // valor visualmente certo mas vazio no state.
        const proto =
          campo.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        setter?.call(campo, input.valor)
        campo.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }

      // Teclas de ação (Enter, Tab, setas, Backspace...)
      alvo.dispatchEvent(
        new KeyboardEvent('keydown', { key: input.key, bubbles: true, cancelable: true })
      )
      if (input.key === 'Backspace' && editavel) {
        const proto =
          campo.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        setter?.call(campo, String(campo.value ?? '').slice(0, -1))
        campo.dispatchEvent(new Event('input', { bubbles: true }))
      }
      alvo.dispatchEvent(
        new KeyboardEvent('keyup', { key: input.key, bubbles: true, cancelable: true })
      )
      return
    }

    // Clique: normalizado → pixel → elemento sob o ponto.
    const x = input.x * window.innerWidth
    const y = input.y * window.innerHeight
    const alvo = document.elementFromPoint(x, y) as HTMLElement | null
    if (!alvo) return

    // Ignora a própria interface de assistência: o operador não deve conseguir
    // encerrar a sessão ou mexer no chat do assistido por engano.
    if (alvo.closest('[data-remote-assist-ui]')) return

    // Foca antes de clicar — para campos, é o que permite digitar em seguida.
    if (typeof alvo.focus === 'function') alvo.focus()

    const comum = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }
    alvo.dispatchEvent(new MouseEvent('mousedown', comum))
    alvo.dispatchEvent(new MouseEvent('mouseup', comum))
    alvo.dispatchEvent(new MouseEvent(input.tipo === 'dblclick' ? 'dblclick' : 'click', comum))
  }, [])

  useEffect(() => {
    const socket = getMessagesSocket()
    if (!socket) return

    const onInvite = (data: Invite) => setInvite(data)

    const onStarted = ({ sessionId, modo: m }: { sessionId: string; modo?: Modo }) => {
      sessionRef.current = sessionId
      modoRef.current = m === 'CONTROLAR' ? 'CONTROLAR' : 'VER'
      setActiveSession(sessionId)
      setModo(modoRef.current)
      startCapture(sessionId)
    }

    const onEnded = () => {
      stopCapture()
      setInvite(null)
    }

    const onPointer = (p: { x: number; y: number }) => setPointer(p)

    /**
     * O operador pediu a tela de novo (ele acabou de montar o player, ou o
     * player dele ficou sem o snapshot inicial — a "tela preta"). Reemitimos o
     * snapshot completo; o rrweb envia via o mesmo `emit` da captura.
     */
    const onResync = () => {
      if (!stopRecordingRef.current) return
      try {
        record.takeFullSnapshot(true)
      } catch {
        /* captura não está ativa */
      }
    }

    const onMode = ({ modo: m }: { modo: Modo }) => {
      modoRef.current = m
      setModo(m)
    }

    const onInput = (input: RemoteInput) => aplicarInput(input)

    /**
     * RECONEXÃO (corrigido 2026-09-15 — causa da "tela preta").
     *
     * As salas do Socket.IO pertencem ao SOCKET, não ao usuário: numa queda de
     * rede o cliente volta com um socket novo e SEM sala. A sessão continua
     * ativa e o rrweb continua gravando, mas o servidor passa a descartar todo
     * frame — nada chega ao operador e nada aparece no console.
     *
     * Pedimos a reentrada em dois gatilhos, de propósito: `connect` cobre o
     * caso normal, e `assist:rejoin-needed` (emitido pelo servidor ao descartar
     * um lote) cobre o caso em que perdemos o evento de reconexão.
     */
    const rejoin = () => {
      const sessionId = sessionRef.current
      if (!sessionId) return
      socket.emit('assist:rejoin', { sessionId }, (res?: { success?: boolean }) => {
        if (!res?.success) {
          console.warn('[assist] falha ao reentrar na sessão', sessionId)
          return
        }
        // De volta à sala: o operador está com a tela congelada no último frame
        // pré-queda, então mandamos um snapshot completo em vez de esperar o
        // próximo checkout.
        try {
          record.takeFullSnapshot(true)
        } catch {
          /* captura não está ativa */
        }
      })
    }

    const onRejoinNeeded = () => rejoin()

    const onChat = (msg: ChatMsg) => {
      setMsgs((prev) => [...prev, msg])
      // Só conta como não lida a mensagem do OUTRO lado e com o chat fechado.
      setChatAberto((aberto) => {
        if (!aberto && msg.de !== 'eu') setNaoLidas((n) => n + 1)
        return aberto
      })
    }

    socket.on('assist:invite', onInvite)
    socket.on('assist:started', onStarted)
    socket.on('assist:ended', onEnded)
    socket.on('assist:pointer', onPointer)
    socket.on('assist:resync', onResync)
    socket.on('assist:mode', onMode)
    socket.on('assist:input', onInput)
    socket.on('assist:chat', onChat)
    socket.on('assist:rejoin-needed', onRejoinNeeded)
    socket.on('connect', rejoin)

    return () => {
      socket.off('assist:invite', onInvite)
      socket.off('assist:started', onStarted)
      socket.off('assist:ended', onEnded)
      socket.off('assist:pointer', onPointer)
      socket.off('assist:resync', onResync)
      socket.off('assist:mode', onMode)
      socket.off('assist:input', onInput)
      socket.off('assist:chat', onChat)
      socket.off('assist:rejoin-needed', onRejoinNeeded)
      socket.off('connect', rejoin)
      stopCapture()
    }
  }, [aplicarInput, startCapture, stopCapture])

  /**
   * PRECEDÊNCIA DO ASSISTIDO: mexer no mouse ou no teclado retoma o controle.
   *
   * Escutamos na fase de CAPTURA (`true`) para ver o evento antes de qualquer
   * handler da aplicação. Os inputs sintéticos que nós mesmos despachamos em
   * `aplicarInput` não têm `isTrusted`, então não disparam a retomada — é essa
   * distinção que separa "o operador clicou" de "a pessoa clicou".
   */
  useEffect(() => {
    if (!activeSession || modo !== 'CONTROLAR') return

    const retomar = (e: Event) => {
      if (!e.isTrusted) return
      // ⚠️ NÃO retomar por causa da PRÓPRIA interface de assistência (corrigido
      // 2026-09-15): abrir a conversa ou digitar uma mensagem são cliques e
      // teclas legítimos do assistido, mas não são "ele voltou a trabalhar na
      // tela" — são ele falando com o suporte. Sem esta exclusão, clicar no
      // ícone de conversa revogava o controle na hora, e cada tecla digitada no
      // chat revogava de novo (foi o sintoma relatado: controleRetomadas=4).
      const alvo = e.target as HTMLElement | null
      if (alvo?.closest?.('[data-remote-assist-ui]')) return
      definirControle(false)
    }

    window.addEventListener('mousedown', retomar, true)
    window.addEventListener('keydown', retomar, true)
    window.addEventListener('wheel', retomar, true)
    return () => {
      window.removeEventListener('mousedown', retomar, true)
      window.removeEventListener('keydown', retomar, true)
      window.removeEventListener('wheel', retomar, true)
    }
  }, [activeSession, modo, definirControle])

  const respond = (aceitar: boolean, modoAceito: Modo = 'VER') => {
    const socket = getMessagesSocket()
    if (!socket || !invite) return
    socket.emit('assist:respond', {
      sessionId: invite.sessionId,
      aceitar,
      modo: modoAceito,
      pagina: window.location.pathname,
    })
    setInvite(null)
  }

  const end = () => {
    const socket = getMessagesSocket()
    if (socket && activeSession) socket.emit('assist:end', { sessionId: activeSession })
    stopCapture()
  }

  const enviarChat = () => {
    const texto = rascunho.trim()
    const socket = getMessagesSocket()
    if (!texto || !socket || !activeSession) return
    socket.emit('assist:chat', { sessionId: activeSession, texto })
    setRascunho('')
  }

  const pediuControle = invite?.modo === 'CONTROLAR'

  return (
    // data-remote-assist-ui: marca toda a interface de assistência para que os
    // cliques do operador nunca a atinjam (ver aplicarInput).
    <div data-remote-assist-ui>
      {/* Convite — exige decisão explícita, sem opção de "lembrar depois" */}
      {invite && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                <ShieldAlert className="text-amber-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pedido de assistência</h2>
                <p className="text-sm text-gray-500">
                  {pediuControle
                    ? 'Alguém quer acessar sua tela'
                    : 'Alguém quer acompanhar sua tela'}
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <p>
                <span className="text-gray-500">Solicitante:</span>{' '}
                <strong className="text-gray-900">{invite.operatorName}</strong>
              </p>
              {invite.motivo && (
                <p>
                  <span className="text-gray-500">Motivo:</span>{' '}
                  <span className="text-gray-900">{invite.motivo}</span>
                </p>
              )}
              <p>
                <span className="text-gray-500">Pedido:</span>{' '}
                <strong className="text-gray-900">
                  {pediuControle ? 'Ver e usar o sistema por você' : 'Apenas ver a tela'}
                </strong>
              </p>
            </div>

            <p className="mb-5 text-xs leading-relaxed text-gray-600">
              {pediuControle ? (
                <>
                  Se você permitir o uso, a pessoa poderá <strong>clicar e digitar</strong> no seu
                  painel. Tudo que ela fizer fica registrado <strong>no seu nome</strong>, porque é
                  a sua sessão. Você retoma o controle a qualquer momento — basta mexer no mouse ou
                  no teclado — e pode encerrar quando quiser.
                </>
              ) : (
                <>
                  A pessoa verá o que está na sua tela,{' '}
                  <strong>mas não poderá clicar nem digitar</strong>. Campos de formulário e dados
                  marcados como sensíveis aparecem ocultos para ela. Você pode encerrar a qualquer
                  momento.
                </>
              )}
            </p>

            <div className="flex flex-col gap-2">
              {pediuControle ? (
                <>
                  <Button className="w-full" onClick={() => respond(true, 'CONTROLAR')}>
                    Permitir ver e usar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => respond(true, 'VER')}
                  >
                    Permitir somente ver
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => respond(true, 'VER')}>
                  Permitir
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => respond(false)}>
                Recusar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador permanente — o assistido nunca "esquece" que está sendo visto */}
      {activeSession && (
        <div
          className={`fixed bottom-4 left-1/2 z-[9998] flex -translate-x-1/2 items-center gap-2 rounded-full py-2 pl-4 pr-2 text-white shadow-lg ${
            modo === 'CONTROLAR' ? 'bg-indigo-600' : 'bg-red-600'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          {modo === 'CONTROLAR' ? <MousePointer2 size={16} /> : <Eye size={16} />}
          <span className="text-sm font-medium">
            {modo === 'CONTROLAR'
              ? 'O suporte está usando sua tela'
              : 'Sua tela está sendo acompanhada'}
          </span>

          {/* Devolver/retomar: o botão é o caminho consciente; mexer no mouse
              também retoma, mas só o botão devolve. */}
          <button
            onClick={() => definirControle(modo !== 'CONTROLAR')}
            className="ml-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/25"
            title={
              modo === 'CONTROLAR'
                ? 'Retomar o controle do seu computador'
                : 'Deixar o suporte usar sua tela'
            }
          >
            {modo === 'CONTROLAR' ? 'Retomar controle' : 'Dar controle'}
          </button>

          <button
            onClick={() => {
              setChatAberto((v) => !v)
              setNaoLidas(0)
            }}
            className="relative rounded-full p-1.5 transition-colors hover:bg-white/20"
            title="Conversar com o suporte"
          >
            <MessageSquare size={16} />
            {naoLidas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red-600">
                {naoLidas}
              </span>
            )}
          </button>

          <button
            onClick={end}
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
            title="Encerrar assistência"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Chat da sessão — bloco de notas compartilhado, efêmero */}
      {activeSession && chatAberto && (
        <div className="fixed bottom-20 right-4 z-[9998] flex h-80 w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-sm font-semibold text-gray-900">Conversa com o suporte</span>
            <button
              onClick={() => setChatAberto(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <p className="mt-6 text-center text-xs text-gray-400">
                Use este espaço para se comunicar por escrito.
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className="rounded-lg bg-gray-100 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-500">{m.nome}</p>
                <p className="whitespace-pre-wrap break-words text-sm text-gray-900">{m.texto}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-200 p-2">
            <input
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviarChat()
                }
              }}
              placeholder="Escreva uma mensagem..."
              maxLength={1000}
              className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={enviarChat}
              className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700"
              title="Enviar"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Ponteiro do operador — orientação visual, sem capturar cliques */}
      {activeSession && pointer && (
        <div
          className="pointer-events-none fixed z-[9997] transition-all duration-75"
          style={{ left: pointer.x, top: pointer.y }}
        >
          <div className="h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500 shadow-lg" />
        </div>
      )}
    </div>
  )
}
