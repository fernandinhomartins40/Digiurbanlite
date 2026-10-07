'use client'

/**
 * Documento do processo interno (DFD, ETP, Termo de Referência, parecer...):
 * editar o texto do modelo, salvar, assinar eletronicamente e baixar o PDF.
 * Assinado, o texto fica travado (para mudar, faça uma nova versão).
 * Quem está com o processo pode pedir a assinatura de outras pessoas (ex.: o
 * Prefeito); quem recebeu o pedido assina ou recusa daqui.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2, PenLine, Save, Trash2, UserPlus, X } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'
import { formatDateTime } from '@/lib/internal-process'

export default function ProcessoDocumentoPage() {
  const { id, docId } = useParams() as { id: string; docId: string }
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()

  const [doc, setDoc] = useState<any>(null)
  const [processNumber, setProcessNumber] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signing, setSigning] = useState(false)
  const [password, setPassword] = useState('')
  const [signError, setSignError] = useState<string | null>(null)
  const [showSign, setShowSign] = useState(false)
  const [canSign, setCanSign] = useState(false)
  const [canRequest, setCanRequest] = useState(false)
  const [myRequest, setMyRequest] = useState<{ id: string; requestedByName: string; note: string | null } | null>(null)
  const [signatures, setSignatures] = useState<Array<{ name: string; signedAt: string; code: string }>>([])
  const [requests, setRequests] = useState<any[]>([])
  // pedir assinatura
  const [showAsk, setShowAsk] = useState(false)
  const [peopleQuery, setPeopleQuery] = useState('')
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([])
  const [chosen, setChosen] = useState<Array<{ id: string; name: string }>>([])
  const [askNote, setAskNote] = useState('')
  const [askError, setAskError] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  // recusar
  const [showDecline, setShowDecline] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const load = async () => {
    try {
      const response = await apiRequest(`/internal-processes/documents/${docId}`)
      const data = response?.data
      setDoc(data?.document)
      setContent(data?.document?.content || '')
      setCanEdit(Boolean(data?.canEdit))
      setProcessNumber(data?.process?.number || '')
      setCanSign(Boolean(data?.canSign))
      setCanRequest(Boolean(data?.canRequest))
      setMyRequest(data?.myRequest || null)
      setSignatures(data?.signatures || [])
      setRequests(data?.requests || [])
      setDirty(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Documento não encontrado', description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  const save = async () => {
    try {
      setSaving(true)
      await apiRequest(`/internal-processes/documents/${docId}`, { method: 'PUT', body: JSON.stringify({ content }) })
      setDirty(false)
      toast({ title: 'Documento salvo' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: error?.message })
    } finally {
      setSaving(false)
    }
  }

  const sign = async () => {
    setSignError(null)
    if (dirty) return setSignError('Salve o texto antes de assinar.')
    if (!password) return setSignError('Digite a sua senha.')
    try {
      setSigning(true)
      const response = await apiRequest(`/internal-processes/documents/${docId}/sign`, { method: 'POST', body: JSON.stringify({ password }) })
      toast({ title: 'Documento assinado', description: `Código ${response?.data?.code}` })
      setShowSign(false)
      setPassword('')
      await load()
    } catch (error: any) {
      setSignError(error?.message || 'Não foi possível assinar.')
    } finally {
      setSigning(false)
    }
  }

  useEffect(() => {
    if (!showAsk) return
    const timer = setTimeout(() => {
      apiRequest(`/internal-processes/people?search=${encodeURIComponent(peopleQuery.trim())}`)
        .then((response: any) => setPeople(response?.data?.people || []))
        .catch(() => setPeople([]))
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAsk, peopleQuery])

  const ask = async () => {
    setAskError(null)
    if (chosen.length === 0) return setAskError('Escolha quem vai assinar.')
    try {
      setAsking(true)
      const response = await apiRequest(`/internal-processes/documents/${docId}/signers`, {
        method: 'POST',
        body: JSON.stringify({ userIds: chosen.map((person) => person.id), note: askNote }),
      })
      const names: string[] = response?.data?.requested || []
      toast({ title: names.length ? 'Pedido enviado' : 'Já havia pedido para essas pessoas', description: names.join(', ') || undefined })
      setShowAsk(false)
      await load()
    } catch (error: any) {
      setAskError(error?.message || 'Não foi possível pedir.')
    } finally {
      setAsking(false)
    }
  }

  const answer = async (requestId: string, kind: 'decline' | 'cancel') => {
    if (kind === 'decline' && !declineNote.trim()) return toast({ variant: 'destructive', title: 'Diga por que não vai assinar' })
    try {
      await apiRequest(`/internal-processes/signature-requests/${requestId}/${kind}`, { method: 'POST', body: JSON.stringify({ note: declineNote }) })
      toast({ title: kind === 'decline' ? 'Pedido recusado' : 'Pedido cancelado' })
      setShowDecline(false)
      setDeclineNote('')
      await load()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível', description: error?.message })
    }
  }

  const remove = async () => {
    if (!window.confirm('Apagar este rascunho?')) return
    try {
      await apiRequest(`/internal-processes/documents/${docId}`, { method: 'DELETE' })
      router.push(`/admin/processos-internos/${id}`)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível apagar', description: error?.message })
    }
  }

  const downloadPdf = async () => {
    try {
      const response = await fetch(getFullApiUrl(`/internal-processes/documents/${docId}/pdf`), { credentials: 'include' })
      if (!response.ok) throw new Error()
      const url = window.URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `${doc?.title || 'documento'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível gerar o PDF' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }
  if (!doc) {
    return (
      <div className="py-16 text-center">
        <Button asChild variant="outline"><Link href={`/admin/processos-internos/${id}`}>Voltar ao processo</Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-start gap-3">
        <Link href={`/admin/processos-internos/${id}`} className="mt-1 rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">Processo {processNumber}</p>
          <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
          <p className="text-sm text-gray-600">
            {doc.signedAt
              ? `Assinado por ${doc.signedByName} em ${formatDateTime(doc.signedAt)} — texto travado`
              : `Rascunho de ${doc.createdByName}${doc.updatedByName ? ` · editado por ${doc.updatedByName}` : ''}`}
          </p>
        </div>
      </div>

      {myRequest && (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
          <p><strong>{myRequest.requestedByName}</strong> pediu a sua assinatura neste documento.{myRequest.note ? ` "${myRequest.note}"` : ''}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setShowSign(true); setSignError(null) }}><PenLine className="mr-2 h-4 w-4" />Ler e assinar</Button>
            <Button size="sm" variant="outline" onClick={() => setShowDecline(true)}>Não vou assinar</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
          </Button>
        )}
        {canSign && !myRequest && (
          <Button variant="outline" onClick={() => { setShowSign(true); setSignError(null) }}>
            <PenLine className="mr-2 h-4 w-4" />Assinar
          </Button>
        )}
        {canRequest && (
          <Button variant="outline" onClick={() => { setShowAsk(true); setChosen([]); setAskNote(''); setPeopleQuery(''); setAskError(null) }}>
            <UserPlus className="mr-2 h-4 w-4" />Pedir assinatura
          </Button>
        )}
        <Button variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />Baixar PDF</Button>
        {canEdit && (
          <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 className="mr-2 h-4 w-4" />Apagar rascunho</Button>
        )}
      </div>

      {(signatures.length > 0 || requests.some((request) => request.status !== 'ASSINADO')) && (
        <div className="space-y-1 rounded-lg border bg-white p-3 text-sm">
          <p className="font-medium text-gray-900">Assinaturas</p>
          {signatures.map((sig) => (
            <p key={sig.code} className="text-green-800">{sig.name} — {formatDateTime(sig.signedAt)} · código {sig.code}</p>
          ))}
          {requests
            .filter((request) => request.status === 'PENDENTE' || request.status === 'RECUSADO')
            .map((request) => (
              <p key={request.id} className="flex flex-wrap items-center gap-2 text-gray-700">
                {request.status === 'PENDENTE' ? `Esperando ${request.userName} (pedido por ${request.requestedByName})` : `${request.userName} não assinou: ${request.answerNote || ''}`}
                {request.status === 'PENDENTE' && request.requestedById === user?.id && (
                  <button type="button" onClick={() => answer(request.id, 'cancel')} className="inline-flex items-center text-xs text-red-700 hover:underline">
                    <X className="h-3.5 w-3.5" />cancelar pedido
                  </button>
                )}
              </p>
            ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Os trechos entre parênteses e os "____" são para você completar. O modelo é um ponto de partida: adeque ao regulamento do município.
      </p>
      <Textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true) }}
        readOnly={!canEdit}
        rows={32}
        className="font-mono text-sm leading-6"
      />

      <Dialog open={showSign} onOpenChange={setShowSign}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar eletronicamente</DialogTitle>
            <DialogDescription>Confirme a sua senha. Depois de assinado, o texto não pode mais ser alterado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="doc-password">Sua senha</Label>
            <input id="doc-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          {signError && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{signError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSign(false)} disabled={signing}>Cancelar</Button>
            <Button onClick={sign} disabled={signing}>
              {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAsk} onOpenChange={setShowAsk}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedir assinatura</DialogTitle>
            <DialogDescription>A pessoa recebe um aviso e o documento entra na fila de assinaturas dela, mesmo sendo de outra unidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              placeholder="Buscar servidor pelo nome"
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {people.length === 0 && <p className="p-3 text-sm text-gray-500">Ninguém encontrado.</p>}
              {people.map((person) => {
                const on = chosen.some((item) => item.id === person.id)
                return (
                  <label key={person.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setChosen((list) => (on ? list.filter((item) => item.id !== person.id) : [...list, person]))}
                    />
                    {person.name}
                  </label>
                )
              })}
            </div>
            {chosen.length > 0 && <p className="text-sm text-gray-700">Vão assinar: {chosen.map((person) => person.name).join(', ')}</p>}
            <div className="space-y-1">
              <Label htmlFor="ask-note">Recado (opcional)</Label>
              <Textarea id="ask-note" rows={3} maxLength={1000} value={askNote} onChange={(e) => setAskNote(e.target.value)} />
            </div>
            {askError && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{askError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsk(false)} disabled={asking}>Cancelar</Button>
            <Button onClick={ask} disabled={asking}>{asking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pedir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDecline} onOpenChange={setShowDecline}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Não vou assinar</DialogTitle>
            <DialogDescription>Quem pediu recebe o motivo e pode ajustar o documento (numa nova versão).</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} maxLength={1000} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Motivo" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecline(false)}>Cancelar</Button>
            <Button onClick={() => myRequest && answer(myRequest.id, 'decline')}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
