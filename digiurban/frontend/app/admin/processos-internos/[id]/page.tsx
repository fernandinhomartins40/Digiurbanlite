'use client'

/**
 * Detalhe do processo interno: texto, por onde passou (histórico) e as ações
 * de quem está com ele (encaminhar, devolver, despachar, pedir parecer,
 * passar para um colega, concluir, arquivar).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, CornerUpLeft, FileText, Loader2, MessageSquare, Send, UserRound, HelpCircle, Archive, RotateCcw } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UnitPicker } from '@/components/admin/internal-process/UnitPicker'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, MOVEMENT_LABEL, PROCESS_STATUS } from '@/lib/internal-process'

type Action = 'forward' | 'return' | 'note' | 'opinion' | 'assign' | 'conclude' | 'archive' | 'reopen' | null

export default function ProcessoInternoPage() {
  const { id } = useParams() as { id: string }
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [process, setProcess] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [note, setNote] = useState('')
  const [unitId, setUnitId] = useState('')
  const [userId, setUserId] = useState('')
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = async () => {
    try {
      const response = await apiRequest(`/internal-processes/${id}`)
      setProcess(response?.data?.process || null)
    } catch (loadError: any) {
      setError(loadError?.message || 'Processo não encontrado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const open = (next: Action) => {
    setAction(next)
    setNote('')
    setUnitId('')
    setUserId('')
    setActionError(null)
    if (next === 'assign' && process?.currentUnitId) {
      apiRequest(`/internal-processes/units/${process.currentUnitId}/people`)
        .then((response: any) => setPeople(response?.data?.people || []))
        .catch(() => setPeople([]))
    }
  }

  const run = async () => {
    setActionError(null)
    const routes: Record<string, { path: string; body: Record<string, unknown> }> = {
      forward: { path: 'forward', body: { toUnitId: unitId, note } },
      return: { path: 'return', body: { note } },
      note: { path: 'note', body: { note } },
      opinion: { path: 'opinion', body: { toUnitId: unitId, question: note } },
      assign: { path: 'assign', body: { toUserId: userId } },
      conclude: { path: 'conclude', body: { note } },
      archive: { path: 'archive', body: { note } },
      reopen: { path: 'reopen', body: { note } },
    }
    const chosen = action ? routes[action] : null
    if (!chosen) return
    if ((action === 'forward' || action === 'opinion') && !unitId) return setActionError('Escolha a unidade.')
    if (action === 'assign' && !userId) return setActionError('Escolha o servidor.')
    if ((action === 'return' || action === 'note' || action === 'opinion') && !note.trim()) return setActionError('Escreva o texto.')
    try {
      setBusy(true)
      await apiRequest(`/internal-processes/${id}/${chosen.path}`, { method: 'POST', body: JSON.stringify(chosen.body) })
      toast({ title: 'Pronto' })
      setAction(null)
      await load()
    } catch (runError: any) {
      setActionError(runError?.message || 'Não foi possível concluir.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }
  if (error || !process) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-gray-700">{error || 'Processo não encontrado'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/processos-internos">Voltar</Link>
        </Button>
      </div>
    )
  }

  const status = PROCESS_STATUS[process.status] || PROCESS_STATUS.ABERTO
  const isOpen = ['ABERTO', 'EM_TRAMITE'].includes(process.status)

  const DIALOG: Record<Exclude<Action, null>, { title: string; description: string; noteLabel?: string; button: string }> = {
    forward: { title: 'Encaminhar', description: 'Mande o processo para outra unidade.', noteLabel: 'Despacho (opcional)', button: 'Encaminhar' },
    return: { title: 'Devolver', description: 'Volta para a unidade que mandou por último.', noteLabel: 'Por que está devolvendo', button: 'Devolver' },
    note: { title: 'Despacho', description: 'Anotação no histórico, sem mudar de unidade.', noteLabel: 'Despacho', button: 'Registrar' },
    opinion: { title: 'Pedir parecer', description: 'Abre um pedido de parecer para outra unidade. A resposta volta neste processo.', noteLabel: 'O que precisa no parecer', button: 'Pedir parecer' },
    assign: { title: 'Passar para um colega', description: 'Escolha quem da unidade vai cuidar.', button: 'Passar' },
    conclude: { title: 'Concluir', description: process.parentId ? 'A conclusão volta como resposta ao processo que pediu o parecer.' : 'Encerra o processo.', noteLabel: 'Conclusão / parecer', button: 'Concluir' },
    archive: { title: 'Arquivar', description: 'Encerra o processo sem conclusão.', noteLabel: 'Observação (opcional)', button: 'Arquivar' },
    reopen: { title: 'Reabrir', description: 'Volta o processo para trâmite.', noteLabel: 'Motivo', button: 'Reabrir' },
  }
  const dialog = action ? DIALOG[action] : null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/processos-internos" className="mt-1 rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="font-mono">{process.number}</span>
            <span>{process.type?.name}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs', status.className)}>{status.label}</span>
            {process.priority === 1 && <span className="rounded bg-red-100 px-1.5 text-xs text-red-700">Urgente</span>}
            {process.confidential && <span className="rounded bg-gray-200 px-1.5 text-xs text-gray-700">Sigiloso</span>}
          </p>
          <h1 className="text-xl font-bold text-gray-900">{process.subject}</h1>
          <p className="text-sm text-gray-600">
            De {process.originUnitName} ({process.createdByName}) · agora em <strong>{process.currentUnitName}</strong>
            {process.currentUserName ? ` com ${process.currentUserName}` : ''}
          </p>
          <p className={cn('text-sm', process.overdue ? 'text-red-700' : 'text-gray-500')}>
            {process.overdue && <AlertTriangle className="mr-1 inline h-4 w-4" />}
            Prazo: {formatDate(process.dueAt)}
          </p>
        </div>
      </div>

      {process.canAct && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => open('forward')}><Send className="mr-2 h-4 w-4" />Encaminhar</Button>
          <Button variant="outline" onClick={() => open('return')}><CornerUpLeft className="mr-2 h-4 w-4" />Devolver</Button>
          <Button variant="outline" onClick={() => open('opinion')}><HelpCircle className="mr-2 h-4 w-4" />Pedir parecer</Button>
          <Button variant="outline" onClick={() => open('assign')}><UserRound className="mr-2 h-4 w-4" />Passar para</Button>
          <Button variant="outline" onClick={() => open('conclude')}><CheckCircle2 className="mr-2 h-4 w-4" />Concluir</Button>
          <Button variant="ghost" onClick={() => open('archive')}><Archive className="mr-2 h-4 w-4" />Arquivar</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => open('note')}><MessageSquare className="mr-2 h-4 w-4" />Despacho</Button>
        {!isOpen && <Button variant="outline" size="sm" onClick={() => open('reopen')}><RotateCcw className="mr-2 h-4 w-4" />Reabrir</Button>}
      </div>

      {(process.protocol || process.parent || process.children?.length > 0) && (
        <div className="space-y-2 rounded-xl border bg-white p-4 text-sm">
          {process.protocol && (
            <p>
              Protocolo do cidadão:{' '}
              <Link href={`/admin/protocolos/${process.protocol.id}`} className="text-blue-700 hover:underline">
                nº {process.protocol.number} — {process.protocol.title}
              </Link>
            </p>
          )}
          {process.parent && (
            <p>
              Parecer pedido no processo{' '}
              <Link href={`/admin/processos-internos/${process.parent.id}`} className="text-blue-700 hover:underline">{process.parent.number}</Link>
            </p>
          )}
          {process.children?.length > 0 && (
            <div>
              <p className="font-medium text-gray-900">Pareceres pedidos</p>
              <ul className="mt-1 space-y-1">
                {process.children.map((child: any) => (
                  <li key={child.id}>
                    <Link href={`/admin/processos-internos/${child.id}`} className="text-blue-700 hover:underline">{child.number}</Link>
                    {' — '}{child.currentUnitName} · {(PROCESS_STATUS[child.status] || PROCESS_STATUS.ABERTO).label}
                    {child.conclusion && <span className="block text-gray-600">{child.conclusion}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {process.body && (
        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900"><FileText className="h-4 w-4" />Texto</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{process.body}</p>
        </div>
      )}

      {process.conclusion && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">Conclusão</p>
          <p className="mt-1 whitespace-pre-wrap">{process.conclusion}</p>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-900">Por onde passou</p>
        <ol className="space-y-3 border-l pl-4">
          {(process.movements || []).map((move: any) => (
            <li key={move.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
              <p className="text-gray-900">
                <strong>{MOVEMENT_LABEL[move.action] || move.action}</strong>
                {move.fromUnitName && move.toUnitName && ` · ${move.fromUnitName} → ${move.toUnitName}`}
                {!move.fromUnitName && move.toUnitName && move.action !== 'CRIADO' && ` · ${move.toUnitName}`}
                {move.toUserName && ` (${move.toUserName})`}
              </p>
              <p className="text-xs text-gray-500">{move.userName} · {formatDateTime(move.createdAt)}</p>
              {move.note && <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-gray-800">{move.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      <Dialog open={!!action} onOpenChange={(next) => !next && setAction(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.title}</DialogTitle>
                <DialogDescription>{dialog.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {(action === 'forward' || action === 'opinion') && (
                  <div className="space-y-1">
                    <Label>Unidade</Label>
                    <UnitPicker value={unitId} onChange={(next) => setUnitId(next)} hintText={`${process.subject} ${note}`} excludeIds={[process.currentUnitId]} />
                  </div>
                )}
                {action === 'assign' && (
                  <div className="space-y-1">
                    <Label htmlFor="person">Servidor da unidade</Label>
                    <select id="person" value={userId} onChange={(e) => setUserId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                      <option value="">Escolher...</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                    {people.length === 0 && <p className="text-xs text-gray-500">Ninguém lotado nesta unidade no organograma.</p>}
                  </div>
                )}
                {dialog.noteLabel && (
                  <div className="space-y-1">
                    <Label htmlFor="note">{dialog.noteLabel}</Label>
                    <Textarea id="note" rows={4} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                )}
                {actionError && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{actionError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={busy}>Cancelar</Button>
                <Button onClick={run} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {dialog.button}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
