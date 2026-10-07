'use client'

/**
 * Assinar um documento (servidor ou cidadão): confirmar a senha de acesso.
 * Mostra quem já assinou, o pedido de assinatura recebido (com "não vou
 * assinar") e, para servidores, "pedir a assinatura de outra pessoa".
 *
 * Sem PIN, sem chave no navegador, sem escolher posição no PDF: a assinatura
 * vai numa folha de assinaturas no fim do PDF, com QR Code de conferência.
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Loader2, PenLine, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface SignDocumentDialogProps {
  document: { id: string; fileName: string; fileUrl?: string }
  userType: 'admin' | 'citizen'
  /** generated = documento do protocolo; external = documento enviado para assinar */
  documentType?: 'generated' | 'external'
  onClose: () => void
  onSuccess?: (result: any) => void
}

interface SignatureItem {
  id: string
  signerName: string | null
  signerRole: string | null
  signedAt: string
  code: string | null
}

interface RequestItem {
  id: string
  userId: string
  userName: string
  requestedById: string
  requestedByName: string
  note: string | null
  status: string
  answerNote: string | null
}

const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) throw new Error(data?.message || data?.error || 'Não foi possível concluir.')
  return data
}

export function SignDocumentDialog({ document, userType, documentType = 'external', onClose, onSuccess }: SignDocumentDialogProps) {
  const type = documentType === 'generated' ? 'GENERATED' : 'EXTERNAL'
  const [signatures, setSignatures] = useState<SignatureItem[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [myRequest, setMyRequest] = useState<RequestItem | null>(null)
  const [password, setPassword] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  // pedir assinatura
  const [asking, setAsking] = useState(false)
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([])
  const [chosen, setChosen] = useState<Array<{ id: string; name: string }>>([])
  const [note, setNote] = useState('')
  const [declining, setDeclining] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const load = async () => {
    try {
      const data = await call(`/signatures/target/${type}/${document.id}`)
      setSignatures(data?.data?.signatures || [])
      setRequests(data?.data?.requests || [])
      setMyRequest(data?.data?.myRequest || null)
    } catch {
      setSignatures([])
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id])

  useEffect(() => {
    if (!asking) return
    const timer = setTimeout(() => {
      call(`/internal-processes/people?search=${encodeURIComponent(query.trim())}`)
        .then((data) => setPeople(data?.data?.people || []))
        .catch(() => setPeople([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [asking, query])

  const sign = async () => {
    setError(null)
    if (!password) return setError('Digite a sua senha.')
    try {
      setSigning(true)
      const body = type === 'GENERATED' ? { documentId: document.id, password } : { externalDocumentId: document.id, password }
      const data = await call('/documents/sign', { method: 'POST', body: JSON.stringify(body) })
      setDone(data?.code || '')
      setPassword('')
      toast.success('Documento assinado')
      onSuccess?.(data)
      await load()
    } catch (signError: any) {
      setError(signError?.message || 'Não foi possível assinar.')
    } finally {
      setSigning(false)
    }
  }

  const ask = async () => {
    if (chosen.length === 0) return toast.error('Escolha quem vai assinar')
    try {
      const data = await call('/signatures/requests', {
        method: 'POST',
        body: JSON.stringify({ targetType: type, targetId: document.id, userIds: chosen.map((person) => person.id), note }),
      })
      const names = (data?.data?.requested || []).map((item: any) => item.name)
      toast.success(names.length ? `Pedido enviado para ${names.join(', ')}` : 'Já havia pedido para essas pessoas')
      setAsking(false)
      setChosen([])
      setNote('')
      await load()
    } catch (askError: any) {
      toast.error(askError?.message || 'Não foi possível pedir')
    }
  }

  const answer = async (requestId: string, kind: 'decline' | 'cancel') => {
    if (kind === 'decline' && !declineNote.trim()) return toast.error('Diga por que não vai assinar')
    try {
      await call(`/signatures/requests/${requestId}/${kind}`, { method: 'POST', body: JSON.stringify({ note: declineNote }) })
      toast.success(kind === 'decline' ? 'Pedido recusado' : 'Pedido cancelado')
      setDeclining(false)
      setDeclineNote('')
      await load()
    } catch (answerError: any) {
      toast.error(answerError?.message || 'Não foi possível')
    }
  }

  const pending = requests.filter((item) => item.status === 'PENDENTE')

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinar documento</DialogTitle>
          <DialogDescription>
            {document.fileName}
            {document.fileUrl && (
              <a href={document.fileUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-blue-700 hover:underline">
                abrir <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {myRequest && (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950">
              <p><strong>{myRequest.requestedByName}</strong> pediu a sua assinatura.{myRequest.note ? ` "${myRequest.note}"` : ''}</p>
              {!declining ? (
                <button type="button" className="text-xs text-blue-800 underline" onClick={() => setDeclining(true)}>Não vou assinar</button>
              ) : (
                <div className="space-y-2">
                  <textarea rows={2} maxLength={1000} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Motivo" className="w-full rounded-md border p-2 text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDeclining(false)}>Voltar</Button>
                    <Button size="sm" onClick={() => answer(myRequest.id, 'decline')}>Enviar</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <p className="font-medium text-gray-900">Assinaturas</p>
            {signatures.length === 0 && <p className="text-gray-500">Ninguém assinou ainda.</p>}
            {signatures.map((item) => (
              <p key={item.id} className="flex items-start gap-1.5 text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item.signerName}{item.signerRole ? ` (${item.signerRole})` : ''} — {formatDate(item.signedAt)} · código {item.code}</span>
              </p>
            ))}
            {pending.map((item) => (
              <p key={item.id} className="text-gray-600">
                Esperando {item.userName} (pedido por {item.requestedByName})
                {userType === 'admin' && (
                  <button type="button" className="ml-2 text-xs text-red-700 hover:underline" onClick={() => answer(item.id, 'cancel')}>cancelar</button>
                )}
              </p>
            ))}
          </div>

          {done !== null ? (
            <p className="rounded-md bg-green-50 p-3 text-green-800">
              Assinado. Código da sua assinatura: <strong>{done}</strong>. A folha de assinaturas com QR Code já está no PDF.
            </p>
          ) : (
            <div className="space-y-1">
              <label htmlFor="sign-password" className="font-medium text-gray-900">Sua senha de acesso</label>
              <input
                id="sign-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sign()}
                className="h-10 w-full rounded-md border border-input bg-background px-3"
              />
              <p className="text-xs text-gray-500">
                Assinar é confirmar a sua senha. A assinatura vale sobre o conteúdo do documento e aparece na folha de assinaturas, com QR Code para qualquer pessoa conferir.
              </p>
            </div>
          )}
          {error && <p className="rounded-md bg-red-50 p-2 text-red-700">{error}</p>}

          {userType === 'admin' && (
            <div className="rounded-lg border p-3">
              {!asking ? (
                <button type="button" onClick={() => setAsking(true)} className="inline-flex items-center gap-1.5 text-blue-700 hover:underline">
                  <UserPlus className="h-4 w-4" /> Pedir a assinatura de outra pessoa
                </button>
              ) : (
                <div className="space-y-2">
                  <input placeholder="Buscar servidor pelo nome" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-full rounded-md border px-3" />
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {people.length === 0 && <p className="p-2 text-gray-500">Ninguém encontrado.</p>}
                    {people.map((person) => {
                      const on = chosen.some((item) => item.id === person.id)
                      return (
                        <label key={person.id} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                          <input type="checkbox" checked={on} onChange={() => setChosen((list) => (on ? list.filter((item) => item.id !== person.id) : [...list, person]))} />
                          {person.name}
                        </label>
                      )
                    })}
                  </div>
                  <textarea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Recado (opcional)" className="w-full rounded-md border p-2" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAsking(false)}>Cancelar</Button>
                    <Button size="sm" onClick={ask}>Pedir assinatura</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{done !== null ? 'Fechar' : 'Cancelar'}</Button>
          {done === null && (
            <Button onClick={sign} disabled={signing}>
              {signing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}Assinar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
