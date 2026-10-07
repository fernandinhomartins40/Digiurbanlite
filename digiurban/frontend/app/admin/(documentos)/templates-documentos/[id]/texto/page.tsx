'use client'

/**
 * Editar modelo de documento do processo interno / licitações (DFD, ETP, TR,
 * parecer, contrato...). Texto simples: o servidor completa o resto ao usar.
 * Os campos entre {{ }} são preenchidos com os dados do processo — botões
 * inserem o campo onde o cursor está (nada técnico para digitar).
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RotateCcw, Save } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const FIELDS: Array<{ key: string; label: string }> = [
  { key: 'municipio', label: 'Município' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'numero', label: 'Nº do processo' },
  { key: 'objeto', label: 'Objeto / assunto' },
  { key: 'valor', label: 'Valor estimado' },
  { key: 'modalidade', label: 'Modalidade' },
  { key: 'criterio', label: 'Critério de julgamento' },
  { key: 'hipotese', label: 'Fundamento (dispensa/inexigibilidade)' },
  { key: 'ata', label: 'Ata de registro de preços' },
  { key: 'participantes', label: 'Secretarias participantes' },
  { key: 'responsavel', label: 'Quem faz o documento' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'cidade_data', label: 'Cidade e data' },
  { key: 'ano', label: 'Ano' },
]

export default function TextoModeloPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()
  const area = useRef<HTMLTextAreaElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [text, setText] = useState('')
  const [fromCatalog, setFromCatalog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const load = async () => {
    try {
      const result = await apiRequest(`/document-templates/${id}`)
      const template = result?.data
      setName(template?.name || '')
      setDescription(template?.description || '')
      setText(template?.htmlTemplate || '')
      setFromCatalog(Boolean(template?.catalogKey))
    } catch (error: any) {
      toast({ title: 'Modelo não encontrado', description: error?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const insert = (key: string) => {
    const field = `{{${key}}}`
    const element = area.current
    if (!element) return setText((current) => current + field)
    const start = element.selectionStart
    const end = element.selectionEnd
    const next = text.slice(0, start) + field + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(start + field.length, start + field.length)
    })
  }

  const save = async () => {
    if (name.trim().length < 3) return toast({ title: 'Dê um nome ao modelo', variant: 'destructive' })
    if (text.trim().length < 10) return toast({ title: 'O modelo está vazio', variant: 'destructive' })
    try {
      setSaving(true)
      await apiRequest(`/document-templates/${id}`, { method: 'PUT', body: JSON.stringify({ name, description, htmlTemplate: text }) })
      toast({ title: 'Modelo salvo', description: 'Os próximos documentos já saem com este texto.' })
      router.push('/admin/templates-documentos')
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const restore = async () => {
    if (!window.confirm('Voltar ao texto padrão? As mudanças feitas aqui se perdem.')) return
    try {
      await apiRequest(`/document-templates/${id}/restore`, { method: 'POST' })
      toast({ title: 'Modelo voltou ao padrão' })
      await load()
    } catch (error: any) {
      toast({ title: 'Não foi possível', description: error?.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-start gap-3">
        <Link href="/admin/templates-documentos" className="mt-1 rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelo do processo interno</h1>
          <p className="text-sm text-gray-600">Vale para os próximos documentos. Os já feitos não mudam.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" maxLength={120} value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Fundamento / observação</Label>
          <Input id="description" maxLength={300} value={description} disabled={!canEdit} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {canEdit && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">Inserir campo (preenchido sozinho com os dados do processo)</p>
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.map((field) => (
              <button key={field.key} type="button" onClick={() => insert(field.key)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-blue-50">
                {field.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={area}
        value={text}
        readOnly={!canEdit}
        onChange={(e) => setText(e.target.value)}
        rows={28}
        className="w-full rounded-md border border-input bg-background p-3 text-sm leading-6"
      />

      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          {fromCatalog && (
            <Button variant="ghost" onClick={restore}>
              <RotateCcw className="mr-2 h-4 w-4" />Voltar ao padrão
            </Button>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
          </Button>
        </div>
      )}
    </div>
  )
}
