'use client'

/**
 * Documento do processo interno (DFD, ETP, Termo de Referência, parecer...):
 * editar o texto do modelo, salvar, assinar eletronicamente e baixar o PDF.
 * Assinado, o texto fica travado (para mudar, faça uma nova versão).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2, PenLine, Save, Trash2 } from 'lucide-react'
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
  const { apiRequest } = useAdminAuth()
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

  const load = async () => {
    try {
      const response = await apiRequest(`/internal-processes/documents/${docId}`)
      const data = response?.data
      setDoc(data?.document)
      setContent(data?.document?.content || '')
      setCanEdit(Boolean(data?.canEdit))
      setProcessNumber(data?.process?.number || '')
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

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
            </Button>
            <Button variant="outline" onClick={() => { setShowSign(true); setSignError(null) }}>
              <PenLine className="mr-2 h-4 w-4" />Assinar
            </Button>
          </>
        )}
        <Button variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />Baixar PDF</Button>
        {canEdit && (
          <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 className="mr-2 h-4 w-4" />Apagar rascunho</Button>
        )}
      </div>

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
    </div>
  )
}
