'use client'

/**
 * ASSISTÊNCIA REMOTA — lado do USUÁRIO ASSISTIDO (2026-09-15)
 *
 * Monta no painel administrativo e fica ocioso até chegar um convite. Ao chegar:
 *   1. mostra QUEM pediu e POR QUÊ, e espera aceite explícito;
 *   2. só depois do aceite começa a capturar e transmitir a tela;
 *   3. mantém um indicador VISÍVEL o tempo todo enquanto transmite, com botão
 *      de encerrar sempre à mão.
 *
 * PRIVACIDADE (LGPD): a tela de um servidor municipal exibe dado pessoal de
 * cidadão. Por isso o mascaramento acontece AQUI, na captura — o texto sensível
 * nem chega a sair desta máquina:
 *   - `maskAllInputs` cobre todo campo de formulário;
 *   - `.dado-sensivel` e `[data-sensivel]` marcam blocos a bloquear;
 *   - `maskTextClass` permite marcar qualquer elemento como texto mascarado.
 *
 * Somente visualização: não há canal de entrada do operador para cá. O ponteiro
 * que ele move é puramente decorativo, desenhado sobre a tela.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { record } from 'rrweb'
import { getMessagesSocket } from '@/lib/messages-socket'
import { Button } from '@/components/ui/button'
import { Eye, ShieldAlert, X } from 'lucide-react'

interface Invite {
  sessionId: string
  operatorName: string
  motivo?: string | null
}

export function RemoteAssistConsent() {
  const [invite, setInvite] = useState<Invite | null>(null)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const stopRecordingRef = useRef<(() => void) | null>(null)

  /** Interrompe a captura e limpa o estado — idempotente. */
  const stopCapture = useCallback(() => {
    try {
      stopRecordingRef.current?.()
    } catch {
      /* rrweb já parado */
    }
    stopRecordingRef.current = null
    setActiveSession(null)
    setPointer(null)
  }, [])

  const startCapture = useCallback((sessionId: string) => {
    const socket = getMessagesSocket()
    if (!socket) return

    // Lote por tempo: emitir evento a evento inundaria o socket em páginas
    // com muita animação. 300 ms mantém a sensação de "ao vivo" com ~3 envios/s.
    let buffer: unknown[] = []
    const flush = () => {
      if (buffer.length === 0) return
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

  useEffect(() => {
    const socket = getMessagesSocket()
    if (!socket) return

    const onInvite = (data: Invite) => setInvite(data)
    const onStarted = ({ sessionId }: { sessionId: string }) => {
      setActiveSession(sessionId)
      startCapture(sessionId)
    }
    const onEnded = () => {
      stopCapture()
      setInvite(null)
    }
    const onPointer = (p: { x: number; y: number }) => setPointer(p)

    socket.on('assist:invite', onInvite)
    socket.on('assist:started', onStarted)
    socket.on('assist:ended', onEnded)
    socket.on('assist:pointer', onPointer)

    return () => {
      socket.off('assist:invite', onInvite)
      socket.off('assist:started', onStarted)
      socket.off('assist:ended', onEnded)
      socket.off('assist:pointer', onPointer)
      stopCapture()
    }
  }, [startCapture, stopCapture])

  const respond = (aceitar: boolean) => {
    const socket = getMessagesSocket()
    if (!socket || !invite) return
    socket.emit('assist:respond', {
      sessionId: invite.sessionId,
      aceitar,
      pagina: window.location.pathname,
    })
    setInvite(null)
  }

  const end = () => {
    const socket = getMessagesSocket()
    if (socket && activeSession) socket.emit('assist:end', { sessionId: activeSession })
    stopCapture()
  }

  return (
    <>
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
                <p className="text-sm text-gray-500">Alguém quer acompanhar sua tela</p>
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
            </div>

            <p className="mb-5 text-xs leading-relaxed text-gray-600">
              A pessoa verá o que está na sua tela, <strong>mas não poderá clicar nem digitar</strong>.
              Campos de formulário e dados marcados como sensíveis aparecem ocultos para ela. Você
              pode encerrar a qualquer momento.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => respond(false)}>
                Recusar
              </Button>
              <Button className="flex-1" onClick={() => respond(true)}>
                Permitir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador permanente — o assistido nunca "esquece" que está sendo visto */}
      {activeSession && (
        <div className="fixed bottom-4 left-1/2 z-[9998] flex -translate-x-1/2 items-center gap-3 rounded-full bg-red-600 py-2 pl-4 pr-2 text-white shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <Eye size={16} />
          <span className="text-sm font-medium">Sua tela está sendo acompanhada</span>
          <button
            onClick={end}
            className="ml-1 rounded-full p-1.5 transition-colors hover:bg-red-700"
            title="Encerrar assistência"
          >
            <X size={16} />
          </button>
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
    </>
  )
}
