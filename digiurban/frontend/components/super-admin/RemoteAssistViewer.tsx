'use client'

/**
 * ASSISTÊNCIA REMOTA — lado do OPERADOR DE PLATAFORMA (2026-09-15)
 *
 * Reproduz ao vivo a tela do servidor assistido, usando o `Replayer` do rrweb
 * alimentado pelos eventos que chegam por WebSocket.
 *
 * MODOS
 *   VER       — observa e aponta (o ponteiro só desenha um círculo lá).
 *   CONTROLAR — clica, digita e rola DENTRO do painel do assistido. Os inputs
 *               são executados na aba dele, na sessão dele.
 *
 * O ASSISTIDO TEM PRECEDÊNCIA: ele retoma o controle a qualquer momento (basta
 * mexer no mouse/teclado). Quando isso acontece chega `assist:mode` com VER e a
 * área volta a ser somente leitura — daí o `podeControlar` reger tanto o cursor
 * quanto o envio de eventos.
 *
 * ⚠️ TELA PRETA (corrigido 2026-09-15): o Replayer SÓ consegue montar a árvore a
 * partir de um FULL SNAPSHOT (evento type 2). Antes criávamos o Replayer com o
 * primeiro lote que chegasse; se aquele lote trouxesse apenas eventos
 * incrementais (type 3) — o que acontece sempre que o operador entra na sala
 * depois do snapshot inicial — o player montava um documento vazio e NUNCA se
 * recuperava: iframe preto, ponteiro funcionando e nada mais. Agora esperamos um
 * type 2 de verdade e, se ele não vier, pedimos com `assist:resync`.
 *
 * O conteúdo reproduzido NÃO é gravado: vive em memória enquanto a sessão dura.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getMessagesSocket } from '@/lib/messages-socket'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  MessageSquare,
  MonitorOff,
  MousePointer2,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'

type Status = 'idle' | 'solicitando' | 'aguardando' | 'ativa' | 'recusada' | 'encerrada'
type Modo = 'VER' | 'CONTROLAR'

interface ChatMsg {
  de: string
  nome: string
  texto: string
  em: string
}

interface Props {
  /** Id do User (servidor municipal) a ser assistido. */
  assistedUserId: string
  assistedUserName?: string
  onClose?: () => void
}

/** Evento de snapshot completo do rrweb. Sem ele o Replayer não monta nada. */
const EH_FULL_SNAPSHOT = (ev: unknown) => (ev as { type?: number })?.type === 2

export function RemoteAssistViewer({ assistedUserId, assistedUserName, onClose }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [modoPedido, setModoPedido] = useState<Modo>('CONTROLAR')
  const [modo, setModo] = useState<Modo>('VER')
  const [erro, setErro] = useState<string | null>(null)
  const [apontando, setApontando] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [montandoTela, setMontandoTela] = useState(true)

  const [chatAberto, setChatAberto] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [rascunho, setRascunho] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  /** Tela real do assistido, lida do evento Meta (type 4) do rrweb. */
  const telaRef = useRef<{ width: number; height: number } | null>(null)
  const replayerRef = useRef<any>(null)
  const sessionRef = useRef<string | null>(null)
  /** Eventos incrementais que chegaram ANTES do primeiro snapshot. */
  const pendentesRef = useRef<any[]>([])

  const podeControlar = status === 'ativa' && modo === 'CONTROLAR'

  /** Pede ao assistido que reemita o snapshot completo da tela. */
  const resync = useCallback(() => {
    const id = sessionRef.current
    if (!id) return
    setMontandoTela(true)
    getMessagesSocket().emit('assist:resync', { sessionId: id })
  }, [])

  /** Solicita a sessão; a transmissão só começa se o assistido aceitar. */
  const solicitar = () => {
    const socket = getMessagesSocket()
    setErro(null)

    // Sem conexão o `emit` é enfileirado silenciosamente e o callback NUNCA
    // roda — a tela ficaria parada sem explicação (foi o sintoma relatado).
    // Avisamos e tentamos reconectar.
    if (!socket.connected) {
      setErro(
        'Sem conexão com o servidor de mensagens. Tentando reconectar — aguarde alguns segundos e tente de novo.'
      )
      socket.connect()
      return
    }

    setStatus('solicitando')

    // Timeout explícito: se o servidor não responder, o operador precisa saber.
    let respondido = false
    const timer = setTimeout(() => {
      if (respondido) return
      setStatus('idle')
      setErro('O servidor não respondeu ao pedido. Verifique a conexão e tente novamente.')
    }, 10000)

    socket.emit(
      'assist:request',
      { assistedUserId, motivo: motivo.trim() || undefined, modo: modoPedido },
      (res: { success: boolean; sessionId?: string; error?: string }) => {
        respondido = true
        clearTimeout(timer)
        if (!res?.success) {
          setStatus('idle')
          setErro(res?.error ?? 'Não foi possível solicitar')
          return
        }
        sessionRef.current = res.sessionId ?? null
        setSessionId(res.sessionId ?? null)
        setStatus('aguardando')
      }
    )
  }

  /**
   * Encaixa a tela do assistido na caixa do operador, SEM distorcer.
   *
   * ⚠️ POR QUE ISTO EXISTE (corrigido 2026-09-15 — "so renderiza parte da
   * tela"): o rrweb desenha o conteudo dentro do iframe usando as dimensoes
   * ORIGINAIS do assistido (ex.: 1920x1080). Nos criavamos o Replayer sem
   * passar width/height, entao ele assumia o default 1024x576, e o CSS ainda
   * esticava o iframe com `h-full w-full`. Resultado: o iframe ocupava a caixa
   * toda, mas o conteudo era pintado numa regiao menor no canto — o resto
   * ficava preto.
   *
   * A correcao e manter o iframe no tamanho REAL e aplicar um `scale` no
   * wrapper, que e como o rrweb-player faz. Assim a proporcao se mantem e a
   * tela inteira aparece.
   */
  const ajustarEscala = useCallback(() => {
    const caixa = containerRef.current?.parentElement
    const tela = telaRef.current
    const wrapper = containerRef.current?.querySelector('.replayer-wrapper') as HTMLElement | null
    if (!caixa || !tela || !wrapper || !tela.width || !tela.height) return

    const escala = Math.min(caixa.clientWidth / tela.width, caixa.clientHeight / tela.height)
    wrapper.style.transform = `scale(${escala})`
    wrapper.style.transformOrigin = 'top left'
    // Centraliza a sobra no eixo em que a proporcao nao bate.
    wrapper.style.position = 'absolute'
    wrapper.style.left = `${Math.max(0, (caixa.clientWidth - tela.width * escala) / 2)}px`
    wrapper.style.top = `${Math.max(0, (caixa.clientHeight - tela.height * escala) / 2)}px`
  }, [])

  /** A caixa do operador muda de tamanho (resize, sidebar, chat): reencaixar. */
  useEffect(() => {
    const onResize = () => ajustarEscala()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [ajustarEscala])

  const encerrar = useCallback(() => {
    const socket = getMessagesSocket()
    if (sessionRef.current) socket.emit('assist:end', { sessionId: sessionRef.current })
    replayerRef.current = null
    pendentesRef.current = []
    setStatus('encerrada')
  }, [])

  useEffect(() => {
    const socket = getMessagesSocket()

    // Estado da conexão visível na tela: sem isso o operador só descobria que o
    // socket estava fora ao clicar e nada acontecer.
    setConectado(socket.connected)
    const onConnect = () => setConectado(true)
    const onDisconnect = () => setConectado(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    const onStarted = ({ modo: m }: { modo?: Modo }) => {
      setModo(m === 'CONTROLAR' ? 'CONTROLAR' : 'VER')
      setStatus('ativa')
      setMontandoTela(true)
    }
    const onDeclined = () => setStatus('recusada')
    const onEnded = () => {
      replayerRef.current = null
      pendentesRef.current = []
      setStatus('encerrada')
    }
    const onMode = ({ modo: m }: { modo: Modo }) => setModo(m)

    const onChat = (msg: ChatMsg) => {
      setMsgs((prev) => [...prev, msg])
      setChatAberto((aberto) => {
        if (!aberto) setNaoLidas((n) => n + 1)
        return aberto
      })
    }

    const onEvents = async ({ events }: { events: any[] }) => {
      if (!events?.length || !containerRef.current) return

      // ── Ainda não há player: ele SÓ pode nascer de um full snapshot ──
      if (!replayerRef.current) {
        const idx = events.findIndex(EH_FULL_SNAPSHOT)

        if (idx === -1) {
          // Nenhum snapshot neste lote. Guardamos os incrementais (eles vão
          // fazer sentido depois do snapshot) e pedimos um resync. Era aqui
          // que o player antigo nascia vazio e ficava preto para sempre.
          pendentesRef.current.push(...events)
          if (pendentesRef.current.length > 5000) pendentesRef.current = [] // não crescer sem limite
          resync()
          return
        }

        // Descartamos o que veio ANTES do snapshot: são eventos de um estado de
        // DOM que o player nunca viu, e aplicá-los corromperia a árvore.
        const doSnapshot = events.slice(idx)
        pendentesRef.current = []

        // O evento Meta (type 4) carrega a tela REAL do assistido. Sem ele o
        // Replayer cai no default 1024x576 e a imagem sai cortada.
        const meta = doSnapshot.find((e: any) => e?.type === 4) as any
        if (meta?.data?.width && meta?.data?.height) {
          telaRef.current = { width: meta.data.width, height: meta.data.height }
        }

        const { Replayer } = await import('rrweb')
        replayerRef.current = new Replayer(doSnapshot, {
          root: containerRef.current,
          liveMode: true,
          // Sem controles de linha do tempo: isto é ao vivo, não gravação.
          skipInactive: false,
          mouseTail: false,
        })
        replayerRef.current.startLive()
        setMontandoTela(false)
        // Depois do startLive o wrapper ja existe no DOM: da para escalar.
        requestAnimationFrame(ajustarEscala)
        return
      }

      for (const ev of events) {
        // O assistido pode redimensionar a janela no meio da sessao.
        if ((ev as any)?.type === 4 && (ev as any)?.data?.width) {
          telaRef.current = { width: (ev as any).data.width, height: (ev as any).data.height }
          requestAnimationFrame(ajustarEscala)
        }
        replayerRef.current.addEvent(ev)
      }
    }

    socket.on('assist:started', onStarted)
    socket.on('assist:declined', onDeclined)
    socket.on('assist:ended', onEnded)
    socket.on('assist:events', onEvents)
    socket.on('assist:mode', onMode)
    socket.on('assist:chat', onChat)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('assist:started', onStarted)
      socket.off('assist:declined', onDeclined)
      socket.off('assist:ended', onEnded)
      socket.off('assist:events', onEvents)
      socket.off('assist:mode', onMode)
      socket.off('assist:chat', onChat)
    }
  }, [resync])

  /**
   * Assim que a sessão fica ativa, pedimos o snapshot: o assistido pode ter
   * começado a capturar antes de entrarmos na sala.
   */
  useEffect(() => {
    if (status === 'ativa') resync()
  }, [status, resync])

  /**
   * Encerra a sessão se o operador FECHAR A ABA no meio.
   *
   * ⚠️ POR QUE `beforeunload` E NÃO O CLEANUP (corrigido 2026-09-15):
   * antes isto era o cleanup de um effect com dep `[status]`. Um cleanup roda
   * a cada mudança da dep e em QUALQUER desmontagem — nao apenas ao fechar a
   * aba. Na pratica, bastava o operador navegar para outra pagina (ou abrir um
   * cadastro que desmontasse este componente) para dispararmos `assist:end` e
   * derrubar a sessao sozinhos. Era o sintoma "a conexao cai quando mudo de
   * pagina".
   *
   * `beforeunload` dispara SO no fechamento/recarregamento real da aba, que e
   * exatamente a intencao original.
   */
  useEffect(() => {
    const aoFechar = () => {
      if (sessionRef.current) {
        getMessagesSocket().emit('assist:end', { sessionId: sessionRef.current })
      }
    }
    window.addEventListener('beforeunload', aoFechar)
    return () => window.removeEventListener('beforeunload', aoFechar)
  }, [])

  /**
   * Teclado do operador → assistido.
   *
   * Só enquanto o controle está concedido E o foco não está no chat (senão
   * digitar uma mensagem seria reenviado para a tela da pessoa).
   */
  useEffect(() => {
    if (!podeControlar) return

    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo?.closest('[data-assist-chat]')) return // digitando no chat

      const socket = getMessagesSocket()
      const id = sessionRef.current
      if (!id) return

      // Caractere imprimível → texto; o resto → tecla de ação.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        socket.emit('assist:input', { sessionId: id, input: { tipo: 'text', valor: e.key } })
        return
      }
      if (['Enter', 'Tab', 'Backspace', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        socket.emit('assist:input', { sessionId: id, input: { tipo: 'key', key: e.key } })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [podeControlar])

  /**
   * Coordenada do clique → normalizada (0..1).
   *
   * As janelas dos dois lados quase nunca têm o mesmo tamanho; mandar pixel cru
   * acertaria outro elemento. O assistido converte de volta com o tamanho real
   * da janela dele.
   */
  const normalizar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tela = telaRef.current

    // ⚠️ Descontar a MOLDURA (corrigido 2026-09-15). Com o encaixe por escala,
    // a tela do assistido quase nunca preenche a caixa toda: sobra uma faixa
    // vazia num dos eixos. Normalizar pela caixa inteira faria o operador
    // clicar num ponto e acertar outro — o erro cresce quanto maior a sobra.
    if (tela?.width && tela?.height) {
      const escala = Math.min(rect.width / tela.width, rect.height / tela.height)
      const larguraReal = tela.width * escala
      const alturaReal = tela.height * escala
      const offsetX = Math.max(0, (rect.width - larguraReal) / 2)
      const offsetY = Math.max(0, (rect.height - alturaReal) / 2)
      return {
        x: (e.clientX - rect.left - offsetX) / larguraReal,
        y: (e.clientY - rect.top - offsetY) / alturaReal,
      }
    }

    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const onClickTela = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!podeControlar || !sessionRef.current) return
    const { x, y } = normalizar(e)
    getMessagesSocket().emit('assist:input', {
      sessionId: sessionRef.current,
      input: { tipo: e.detail === 2 ? 'dblclick' : 'click', x, y },
    })
  }

  const onScrollTela = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!podeControlar || !sessionRef.current) return
    getMessagesSocket().emit('assist:input', {
      sessionId: sessionRef.current,
      input: { tipo: 'scroll', x: e.deltaX, y: e.deltaY },
    })
  }

  /** Ponteiro: converte a posição do mouse para coordenadas da tela assistida. */
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!apontando || status !== 'ativa' || !sessionRef.current) return
    // Mesma correcao de moldura do `normalizar`: mandamos a coordenada JA na
    // escala da tela do assistido, senao o ponteiro aparece deslocado para ele.
    const { x, y } = normalizar(e)
    const tela = telaRef.current
    getMessagesSocket().emit('assist:pointer', {
      sessionId: sessionRef.current,
      x: x * (tela?.width ?? e.currentTarget.clientWidth),
      y: y * (tela?.height ?? e.currentTarget.clientHeight),
    })
  }

  const enviarChat = () => {
    const texto = rascunho.trim()
    if (!texto || !sessionRef.current) return
    getMessagesSocket().emit('assist:chat', { sessionId: sessionRef.current, texto })
    setRascunho('')
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Antes de começar: modo + motivo + pedido */}
      {status === 'idle' && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            Assistir {assistedUserName ?? 'servidor'}
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            A pessoa receberá um pedido e precisa <strong>aceitar</strong> antes de qualquer
            transmissão. Ela pode conceder só a visualização, e retoma o controle quando quiser.
          </p>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">O que você precisa</label>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModoPedido('CONTROLAR')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                modoPedido === 'CONTROLAR'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block text-sm font-medium text-gray-900">Ver e usar</span>
              <span className="block text-xs text-gray-500">
                Clicar, digitar e navegar no painel da pessoa
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModoPedido('VER')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                modoPedido === 'VER'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block text-sm font-medium text-gray-900">Somente ver</span>
              <span className="block text-xs text-gray-500">Acompanhar a tela e apontar</span>
            </button>
          </div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Motivo <span className="font-normal text-gray-400">(aparece para ela)</span>
          </label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: ajudar com o cadastro de protocolo"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            maxLength={200}
          />
          {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={solicitar} disabled={!conectado}>
              Solicitar assistência
            </Button>
            {/* Estado da conexão explícito — o operador vê antes de clicar. */}
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className={`h-2 w-2 rounded-full ${conectado ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              {conectado ? 'Conectado ao servidor' : 'Conectando...'}
            </span>
          </div>
        </div>
      )}

      {status === 'solicitando' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-center">
          <Loader2 className="mb-3 animate-spin text-indigo-600" size={28} />
          <p className="font-medium text-gray-900">Enviando pedido...</p>
          <p className="mt-1 text-sm text-gray-500">Falando com o servidor de mensagens.</p>
        </div>
      )}

      {status === 'aguardando' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-center">
          <Loader2 className="mb-3 animate-spin text-indigo-600" size={28} />
          <p className="font-medium text-gray-900">Aguardando autorização</p>
          <p className="mt-1 text-sm text-gray-500">
            {assistedUserName ?? 'A pessoa'} precisa aceitar o pedido.
          </p>
          <Button variant="outline" className="mt-4" onClick={encerrar}>
            Cancelar
          </Button>
        </div>
      )}

      {status === 'recusada' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-10 text-center">
          <MonitorOff className="mb-3 text-amber-600" size={28} />
          <p className="font-medium text-gray-900">Pedido recusado</p>
          <p className="mt-1 text-sm text-gray-600">A pessoa não autorizou o acompanhamento.</p>
          <Button variant="outline" className="mt-4" onClick={() => setStatus('idle')}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'encerrada' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-10 text-center">
          <MonitorOff className="mb-3 text-gray-400" size={28} />
          <p className="font-medium text-gray-900">Sessão encerrada</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStatus('idle')}>
              Nova sessão
            </Button>
            {onClose && <Button onClick={onClose}>Fechar</Button>}
          </div>
        </div>
      )}

      {status === 'ativa' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="font-medium text-gray-900">Ao vivo</span>
              <span className="text-gray-500">· {assistedUserName ?? 'servidor'}</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  podeControlar
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {podeControlar ? 'No controle' : 'Somente visualização'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resync} title="Recarregar a tela">
                <RefreshCw size={15} className="mr-1.5" />
                Recarregar
              </Button>
              <Button
                variant={chatAberto ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setChatAberto((v) => !v)
                  setNaoLidas(0)
                }}
              >
                <MessageSquare size={15} className="mr-1.5" />
                Conversa
                {naoLidas > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                    {naoLidas}
                  </span>
                )}
              </Button>
              <Button
                variant={apontando ? 'default' : 'outline'}
                size="sm"
                onClick={() => setApontando((v) => !v)}
                title="Mostrar meu ponteiro na tela da pessoa"
              >
                <MousePointer2 size={15} className="mr-1.5" />
                {apontando ? 'Apontando' : 'Apontar'}
              </Button>
              <Button variant="destructive" size="sm" onClick={encerrar}>
                Encerrar
              </Button>
            </div>
          </div>

          {/* Aviso quando o assistido retomou o controle */}
          {!podeControlar && modo === 'VER' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Você está <strong>somente visualizando</strong>. A pessoa precisa conceder o controle
              (botão <em>Dar controle</em> na tarja vermelha da tela dela) — e ela retoma o controle
              sempre que mexer no mouse ou no teclado.
            </div>
          )}

          <div className="flex min-h-0 flex-1 gap-3">
            {/*
              Em modo VER a área é inerte (`pointer-events-none` no replay).
              Em modo CONTROLAR ela captura clique/rolagem e os envia ao assistido.
            */}
            <div
              onMouseMove={onMouseMove}
              onClick={onClickTela}
              onWheel={onScrollTela}
              className={`relative min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-900 ${
                podeControlar ? 'cursor-pointer' : apontando ? 'cursor-crosshair' : ''
              }`}
            >
              <div
                ref={containerRef}
                /*
                  ⚠️ NAO forcar `h-full w-full` no iframe (corrigido
                  2026-09-15). O rrweb pinta o conteudo no tamanho real do
                  assistido; esticar o iframe por CSS desalinhava a imagem e
                  deixava o resto da area preto. O encaixe agora e feito por
                  `transform: scale()` em `ajustarEscala`.
                */
                className="pointer-events-none h-full w-full [&_iframe]:border-0"
              />

              {/* Enquanto o snapshot não chega, a área ficaria preta sem explicação */}
              {montandoTela && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center text-gray-300">
                  <Loader2 className="mb-3 animate-spin" size={26} />
                  <p className="text-sm font-medium">Carregando a tela...</p>
                  <p className="mt-1 max-w-xs text-xs text-gray-400">
                    Se demorar, use <strong>Recarregar</strong> para pedir a tela de novo.
                  </p>
                </div>
              )}
            </div>

            {/* Conversa — data-assist-chat impede que o que eu digito aqui vá para a tela dela */}
            {chatAberto && (
              <div
                data-assist-chat
                className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900">Conversa</span>
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
                      Converse por escrito com a pessoa assistida.
                    </p>
                  )}
                  {msgs.map((m, i) => (
                    <div key={i} className="rounded-lg bg-gray-100 px-3 py-2">
                      <p className="text-[11px] font-semibold text-gray-500">{m.nome}</p>
                      <p className="whitespace-pre-wrap break-words text-sm text-gray-900">
                        {m.texto}
                      </p>
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
                    placeholder="Mensagem..."
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
          </div>
        </>
      )}
    </div>
  )
}
