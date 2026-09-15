'use client'

/**
 * ASSISTÊNCIA REMOTA — lado do OPERADOR DE PLATAFORMA (2026-09-15)
 *
 * Reproduz ao vivo a tela do servidor assistido, usando o `Replayer` do rrweb
 * alimentado pelos eventos que chegam por WebSocket.
 *
 * SOMENTE VISUALIZAÇÃO: o iframe do replay tem `pointer-events: none`, então
 * nenhum clique do operador atinge a tela reproduzida — a garantia não depende
 * só do backend não ter canal de entrada, está também aqui no cliente.
 * O único "controle" é o ponteiro, que apenas desenha um círculo na tela do
 * assistido para orientar ("clique nesse botão").
 *
 * O conteúdo reproduzido NÃO é gravado: vive em memória enquanto a sessão dura.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getMessagesSocket } from '@/lib/messages-socket'
import { Button } from '@/components/ui/button'
import { Loader2, MonitorOff, MousePointer2 } from 'lucide-react'

type Status = 'idle' | 'aguardando' | 'ativa' | 'recusada' | 'encerrada'

interface Props {
  /** Id do User (servidor municipal) a ser assistido. */
  assistedUserId: string
  assistedUserName?: string
  onClose?: () => void
}

export function RemoteAssistViewer({ assistedUserId, assistedUserName, onClose }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [apontando, setApontando] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<any>(null)

  /** Solicita a sessão; a transmissão só começa se o assistido aceitar. */
  const solicitar = () => {
    const socket = getMessagesSocket()
    setErro(null)
    socket.emit(
      'assist:request',
      { assistedUserId, motivo: motivo.trim() || undefined },
      (res: { success: boolean; sessionId?: string; error?: string }) => {
        if (!res?.success) {
          setErro(res?.error ?? 'Não foi possível solicitar')
          return
        }
        setSessionId(res.sessionId ?? null)
        setStatus('aguardando')
      }
    )
  }

  const encerrar = useCallback(() => {
    const socket = getMessagesSocket()
    if (sessionId) socket.emit('assist:end', { sessionId })
    replayerRef.current = null
    setStatus('encerrada')
  }, [sessionId])

  useEffect(() => {
    const socket = getMessagesSocket()

    const onStarted = () => setStatus('ativa')
    const onDeclined = () => setStatus('recusada')
    const onEnded = () => {
      replayerRef.current = null
      setStatus('encerrada')
    }

    const onEvents = async ({ events }: { events: any[] }) => {
      if (!events?.length || !containerRef.current) return

      // O Replayer é criado só quando o primeiro lote chega — ele exige ao
      // menos um snapshot completo para montar a árvore inicial.
      if (!replayerRef.current) {
        const { Replayer } = await import('rrweb')
        replayerRef.current = new Replayer(events, {
          root: containerRef.current,
          liveMode: true,
          // Sem controles de linha do tempo: isto é ao vivo, não gravação.
          skipInactive: false,
          mouseTail: false,
        })
        replayerRef.current.startLive()
        return
      }

      for (const ev of events) replayerRef.current.addEvent(ev)
    }

    socket.on('assist:started', onStarted)
    socket.on('assist:declined', onDeclined)
    socket.on('assist:ended', onEnded)
    socket.on('assist:events', onEvents)

    return () => {
      socket.off('assist:started', onStarted)
      socket.off('assist:declined', onDeclined)
      socket.off('assist:ended', onEnded)
      socket.off('assist:events', onEvents)
    }
  }, [])

  /** Encerra a sessão se o operador fechar a aba no meio. */
  useEffect(() => {
    return () => {
      if (sessionId && status === 'ativa') {
        getMessagesSocket().emit('assist:end', { sessionId })
      }
    }
  }, [sessionId, status])

  /** Ponteiro: converte a posição do mouse para coordenadas da tela assistida. */
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!apontando || status !== 'ativa' || !sessionId) return
    const rect = e.currentTarget.getBoundingClientRect()
    getMessagesSocket().emit('assist:pointer', {
      sessionId,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Antes de começar: motivo + pedido */}
      {status === 'idle' && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            Assistir {assistedUserName ?? 'servidor'}
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            A pessoa receberá um pedido e precisa <strong>aceitar</strong> antes de qualquer
            transmissão. Você poderá ver a tela e apontar, mas não clicar ou digitar.
          </p>
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
          <Button onClick={solicitar}>Solicitar assistência</Button>
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
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="font-medium text-gray-900">Ao vivo</span>
              <span className="text-gray-500">· {assistedUserName ?? 'servidor'}</span>
            </div>
            <div className="flex items-center gap-2">
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

          {/*
            pointer-events-none garante, no cliente, que nenhum clique do
            operador alcance a tela reproduzida — é somente visualização.
            O wrapper captura o movimento do mouse para o ponteiro.
          */}
          <div
            onMouseMove={onMouseMove}
            className={`relative flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-900 ${
              apontando ? 'cursor-crosshair' : ''
            }`}
          >
            <div ref={containerRef} className="pointer-events-none h-full w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0" />
          </div>
        </>
      )}
    </div>
  )
}
