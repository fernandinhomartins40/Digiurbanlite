'use client'

/**
 * Etapas do processo (Lei 14.133/2021 ou fluxo próprio do município):
 * onde está, o fundamento legal, o que fazer, os documentos da etapa (feitos
 * a partir dos modelos), para qual unidade cada etapa vai e os botões de
 * avançar (vai sozinho para o setor da próxima etapa) e devolver para ajuste.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, CornerUpLeft, FileText, Loader2, PenLine, Plus, Scale } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UnitPicker } from '@/components/admin/internal-process/UnitPicker'
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
  role: string
  roleName: string
  unitId: string | null
  unitName: string | null
  status: 'done' | 'current' | 'todo'
}

interface FlowView {
  key: string
  baseKey: string | null
  name: string
  stages: FlowStageView[]
  missing: string[]
  isLast: boolean
  isFirst: boolean
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
  currentUnitId: string
  onChanged: () => void
}

const brl = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
}

const LEI_14133 = ['LICITACAO', 'REGISTRO_PRECOS', 'DISPENSA', 'INEXIGIBILIDADE', 'ADESAO_ATA']

export function FlowPanel({ processId, flow, documents, stageDueAt, fields, warnings, canAct, currentUnitId, onChanged }: FlowPanelProps) {
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'advance' | 'return' | null>(null)
  const [note, setNote] = useState('')
  const [otherUnit, setOtherUnit] = useState(false)
  const [toUnitId, setToUnitId] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)

  const currentIndex = flow.stages.findIndex((stage) => stage.status === 'current')
  const current = currentIndex >= 0 ? flow.stages[currentIndex] : null
  const next = currentIndex >= 0 ? flow.stages[currentIndex + 1] || null : null
  const previous = currentIndex > 0 ? flow.stages[currentIndex - 1] : null
  const shown = flow.stages.find((stage) => stage.key === selected) || current
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(String(user?.role || ''))
  const isLaw = LEI_14133.includes(flow.baseKey || flow.key)

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

  const openDialog = (kind: 'advance' | 'return') => {
    setDialog(kind)
    setNote('')
    setOtherUnit(false)
    setToUnitId('')
    setDialogError(null)
  }

  const confirm = async () => {
    setDialogError(null)
    if (dialog === 'return' && !note.trim()) return setDialogError('Diga o que precisa ser ajustado.')
    if (dialog === 'advance' && otherUnit && !toUnitId) return setDialogError('Escolha a unidade.')
    try {
      setBusy(dialog)
      const path = dialog === 'advance' ? 'advance' : 'return-stage'
      const body = dialog === 'advance' ? { note, toUnitId: otherUnit ? toUnitId : undefined } : { note }
      const response = await apiRequest(`/internal-processes/${processId}/${path}`, { method: 'POST', body: JSON.stringify(body) })
      const movedTo = response?.data?.movedTo
      toast({
        title: dialog === 'advance' ? 'Etapa concluída' : 'Devolvido para ajuste',
        description: movedTo ? `Enviado para ${movedTo}` : undefined,
      })
      setDialog(null)
      setSelected(null)
      onChanged()
    } catch (error: any) {
      setDialogError(error?.message || 'Não foi possível concluir.')
    } finally {
      setBusy(null)
    }
  }

  const docsFor = (key: string) => documents.filter((doc) => doc.templateKey === key)
  const goesTo = (stage: FlowStageView | null) =>
    !stage ? null : stage.unitId ? (stage.unitId === currentUnitId ? 'continua com esta unidade' : stage.unitName || stage.roleName) : null

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Scale className="h-4 w-4 text-blue-700" /> {flow.name}{isLaw ? ' — Lei 14.133/2021' : ''}
        </p>
        <p className="text-xs text-gray-600">
          Valor estimado: <strong>{brl(fields?.valorEstimado)}</strong>
          {fields?.modalidade && <> · {fields.modalidade}</>}
          {fields?.criterio && <> · {fields.criterio}</>}
          {fields?.hipotese && <> · {fields.hipotese}</>}
          {fields?.ata && <> · {fields.ata}</>}
        </p>
      </div>
      {Array.isArray(fields?.participantes) && fields!.participantes.length > 0 && (
        <p className="text-xs text-gray-600">Participantes: {fields!.participantes.map((item: any) => item.nome).join('; ')}</p>
      )}

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
              title={stage.unitName ? `${stage.roleName}: ${stage.unitName}` : stage.roleName}
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
              {shown.legal && <p className="text-xs text-blue-800">{shown.legal}</p>}
            </div>
            <p className="text-xs text-gray-600">
              Faz: {shown.roleName}{shown.unitName ? ` (${shown.unitName})` : ''}
              {shown.status === 'current' && stageDueAt && <> · prazo da etapa: {formatDate(stageDueAt)}</>}
              {shown.status !== 'current' && <> · prazo sugerido: {shown.days} dias úteis</>}
            </p>
          </div>
          {shown.description && <p className="text-sm text-gray-700">{shown.description}</p>}
          {shown.checklist.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-gray-700">
              {shown.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

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
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs text-gray-600">
                {flow.missing.length ? `Falta: ${flow.missing.join('; ')}` : flow.isLast ? 'Última etapa: conclua o processo quando tudo estiver pronto.' : 'Tudo pronto para avançar.'}
              </p>
              {next && (
                <p className="flex flex-wrap items-center gap-1 text-xs text-gray-700">
                  <ArrowRight className="h-3.5 w-3.5" /> Próxima: <strong>{next.name}</strong> —{' '}
                  {goesTo(next) ? <>vai para <strong>{goesTo(next)}</strong></> : (
                    <span className="text-amber-700">
                      ninguém definido para &quot;{next.roleName}&quot;; o processo fica com esta unidade.
                      {isAdmin && <> <Link href="/admin/processos-internos/configurar" className="underline">Definir quem faz cada etapa</Link></>}
                    </span>
                  )}
                </p>
              )}
              {canAct && (
                <div className="flex flex-wrap gap-2">
                  {!flow.isLast && (
                    <Button size="sm" onClick={() => openDialog('advance')} disabled={!!busy || flow.missing.length > 0}>
                      Concluir etapa e avançar
                    </Button>
                  )}
                  {previous && (
                    <Button size="sm" variant="outline" onClick={() => openDialog('return')} disabled={!!busy}>
                      <CornerUpLeft className="mr-1 h-4 w-4" />Devolver para ajuste
                    </Button>
                  )}
                </div>
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

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'advance' ? `Concluir "${current?.name}"` : 'Devolver para ajuste'}</DialogTitle>
            <DialogDescription>
              {dialog === 'advance'
                ? next && goesTo(next)
                  ? `Próxima etapa: ${next.name}. O processo ${goesTo(next) === 'continua com esta unidade' ? 'continua com esta unidade' : `vai para ${goesTo(next)}`}.`
                  : `Próxima etapa: ${next?.name}. Ninguém definido para ela: o processo fica com esta unidade (ou escolha outra abaixo).`
                : `Volta para "${previous?.name}"${previous && goesTo(previous) && goesTo(previous) !== 'continua com esta unidade' ? `, em ${goesTo(previous)}` : ''}, com o motivo no histórico.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialog === 'advance' && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={otherUnit} onChange={(e) => setOtherUnit(e.target.checked)} />
                Mandar para outra unidade só desta vez
              </label>
            )}
            {dialog === 'advance' && otherUnit && <UnitPicker value={toUnitId} onChange={(id) => setToUnitId(id)} excludeIds={[currentUnitId]} />}
            <div className="space-y-1">
              <Label htmlFor="flow-note">{dialog === 'advance' ? 'Despacho (opcional)' : 'O que precisa ser ajustado'}</Label>
              <Textarea id="flow-note" rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {dialogError && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{dialogError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={!!busy}>Cancelar</Button>
            <Button onClick={confirm} disabled={!!busy}>
              {busy === dialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialog === 'advance' ? 'Concluir e avançar' : 'Devolver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
