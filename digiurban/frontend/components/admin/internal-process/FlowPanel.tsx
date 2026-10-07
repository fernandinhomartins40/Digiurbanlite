'use client'

/**
 * Etapas da contratação (Lei 14.133/2021) dentro do processo interno:
 * onde está, o fundamento legal, o que fazer, os documentos da etapa (feitos
 * a partir dos modelos) e o botão de avançar.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Circle, FileText, Loader2, PenLine, Plus, Scale } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/internal-process'

interface FlowStageView {
  key: string
  name: string
  legal: string
  description: string
  checklist: string[]
  requiredDocs: Array<{ key: string; title: string; mustSign: boolean }>
  optionalDocs: Array<{ key: string; title: string }>
  days: number
  owner: string
  status: 'done' | 'current' | 'todo'
}

interface FlowView {
  key: string
  name: string
  stages: FlowStageView[]
  missing: string[]
  isLast: boolean
}

interface ProcessDocumentItem {
  id: string
  templateKey: string
  title: string
  stageKey: string | null
  signedAt: string | null
  signedByName: string | null
}

interface FlowPanelProps {
  processId: string
  flow: FlowView
  documents: ProcessDocumentItem[]
  stageDueAt: string | null
  fields: Record<string, any> | null
  warnings: string[]
  canAct: boolean
  onChanged: () => void
}

const brl = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
}

export function FlowPanel({ processId, flow, documents, stageDueAt, fields, warnings, canAct, onChanged }: FlowPanelProps) {
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const current = flow.stages.find((stage) => stage.status === 'current') || null
  const shown = flow.stages.find((stage) => stage.key === selected) || current

  const createFromTemplate = async (templateKey: string) => {
    try {
      setBusy(templateKey)
      const response = await apiRequest(`/internal-processes/${processId}/documents`, { method: 'POST', body: JSON.stringify({ templateKey }) })
      const id = response?.data?.document?.id
      if (id) router.push(`/admin/processos-internos/${processId}/documentos/${id}`)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível criar', description: error?.message })
    } finally {
      setBusy(null)
    }
  }

  const advance = async () => {
    try {
      setBusy('advance')
      const response = await apiRequest(`/internal-processes/${processId}/advance`, { method: 'POST', body: JSON.stringify({}) })
      toast({ title: 'Etapa concluída', description: response?.data?.next?.name ? `Agora: ${response.data.next.name}` : undefined })
      setSelected(null)
      onChanged()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Ainda não dá para avançar', description: error?.message })
    } finally {
      setBusy(null)
    }
  }

  const docsFor = (key: string) => documents.filter((doc) => doc.templateKey === key)

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Scale className="h-4 w-4 text-blue-700" /> {flow.name} — Lei 14.133/2021
        </p>
        <p className="text-xs text-gray-600">
          Valor estimado: <strong>{brl(fields?.valorEstimado)}</strong>
          {fields?.modalidade && <> · {fields.modalidade}</>}
          {fields?.criterio && <> · {fields.criterio}</>}
          {fields?.hipotese && <> · {fields.hipotese}</>}
        </p>
      </div>

      {warnings.map((warning) => (
        <p key={warning} className="flex items-start gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}
        </p>
      ))}

      {/* trilha de etapas */}
      <ol className="flex flex-wrap gap-1.5">
        {flow.stages.map((stage, index) => (
          <li key={stage.key}>
            <button
              type="button"
              onClick={() => setSelected(stage.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
                stage.status === 'done' && 'border-green-200 bg-green-50 text-green-800',
                stage.status === 'current' && 'border-blue-600 bg-blue-600 text-white',
                stage.status === 'todo' && 'text-gray-500',
                shown?.key === stage.key && stage.status !== 'current' && 'ring-2 ring-blue-200'
              )}
            >
              {stage.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {index + 1}. {stage.name}
            </button>
          </li>
        ))}
      </ol>

      {shown && (
        <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">{shown.name}</p>
              <p className="text-xs text-blue-800">{shown.legal}</p>
            </div>
            <p className="text-xs text-gray-600">
              Conduz: {shown.owner}
              {shown.status === 'current' && stageDueAt && <> · prazo da etapa: {formatDate(stageDueAt)}</>}
              {shown.status !== 'current' && <> · prazo sugerido: {shown.days} dias úteis</>}
            </p>
          </div>
          <p className="text-sm text-gray-700">{shown.description}</p>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-gray-700">
            {shown.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {[...shown.requiredDocs.map((doc) => ({ ...doc, required: true })), ...shown.optionalDocs.map((doc) => ({ ...doc, required: false, mustSign: false }))].map((doc) => {
            const made = docsFor(doc.key)
            return (
              <div key={doc.key} className="flex flex-col gap-1 rounded-md border bg-white p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {doc.title} {!doc.required && <span className="text-xs font-normal text-gray-500">(se for o caso)</span>}
                  </p>
                  {made.length === 0 ? (
                    <p className="text-xs text-gray-500">Ainda não feito{doc.mustSign ? ' · precisa de assinatura' : ''}</p>
                  ) : (
                    made.map((item) => (
                      <Link key={item.id} href={`/admin/processos-internos/${processId}/documentos/${item.id}`} className="block text-xs text-blue-700 hover:underline">
                        {item.signedAt ? `Assinado por ${item.signedByName}` : doc.mustSign ? 'Feito — falta assinar' : 'Feito'}
                      </Link>
                    ))
                  )}
                </div>
                {canAct && shown.status === 'current' && (
                  <Button size="sm" variant="outline" onClick={() => createFromTemplate(doc.key)} disabled={!!busy}>
                    {busy === doc.key ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : made.length ? <PenLine className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                    {made.length ? 'Nova versão' : 'Fazer pelo modelo'}
                  </Button>
                )}
              </div>
            )
          })}

          {shown.status === 'current' && (
            <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600">
                {flow.missing.length ? `Falta: ${flow.missing.join('; ')}` : flow.isLast ? 'Última etapa: conclua o processo quando tudo estiver pronto.' : 'Tudo pronto para avançar.'}
              </p>
              {canAct && !flow.isLast && (
                <Button size="sm" onClick={advance} disabled={busy === 'advance' || flow.missing.length > 0}>
                  {busy === 'advance' && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Concluir etapa e avançar
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">Documentos do processo</p>
          <ul className="space-y-1 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/processos-internos/${processId}/documentos/${doc.id}`} className="inline-flex min-w-0 items-center gap-1.5 text-blue-700 hover:underline">
                  <FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{doc.title}</span>
                </Link>
                <span className={cn('shrink-0 text-xs', doc.signedAt ? 'text-green-700' : 'text-gray-500')}>
                  {doc.signedAt ? `Assinado · ${doc.signedByName}` : 'Rascunho'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
