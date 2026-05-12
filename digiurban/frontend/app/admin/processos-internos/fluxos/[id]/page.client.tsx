'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { OrganizationalUnitAutocomplete } from '@/components/admin/OrganizationalUnitAutocomplete'
import {
  ArrowLeft, Plus, Trash2, Save, GitBranch, ChevronUp,
  ChevronDown, GripVertical, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { flowClient, WorkflowStep, WorkflowTransition } from '@/lib/flow-client'

// Ações disponíveis para etapas
const AVAILABLE_ACTIONS = [
  { value: 'ENCAMINHADO', label: 'Encaminhar' },
  { value: 'DESPACHO', label: 'Despacho' },
  { value: 'PARECER', label: 'Parecer' },
  { value: 'ASSINATURA', label: 'Para Assinatura' },
  { value: 'DEVOLVIDO', label: 'Devolver' },
  { value: 'CONCLUSAO', label: 'Concluir' },
]

// Documentos que podem ser exigidos na etapa
const DOCUMENT_OPTIONS = [
  { value: '', label: 'Nenhum (opcional)' },
  { value: 'memorando', label: 'Memorando' },
  { value: 'oficio', label: 'Ofício' },
  { value: 'despacho', label: 'Despacho' },
  { value: 'capa-processo', label: 'Capa de Processo' },
]

function generateId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function buildTransitions(steps: WorkflowStep[]): WorkflowTransition[] {
  const transitions: WorkflowTransition[] = []
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i]
    const to = steps[i + 1]
    transitions.push({
      fromStepId: from.id,
      toStepId: to.id,
      label: from.actions[0] || 'ENCAMINHADO',
    })
  }
  return transitions
}

function newStep(order: number): WorkflowStep {
  return {
    id: generateId(),
    name: '',
    order,
    organizationalUnitId: '',
    organizationalUnitName: '',
    slaHours: 72,
    documentRequired: '',
    actions: ['ENCAMINHADO'],
  }
}

export default function FluxoEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const isNew = params.id === 'novo'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([newStep(0)])

  const loadTemplate = useCallback(async () => {
    if (isNew) return
    try {
      setLoading(true)
      const t = await flowClient.getWorkflowTemplate(params.id as string)
      setName(t.name)
      setDescription(t.description || '')
      const sorted = [...t.steps].sort((a, b) => a.order - b.order)
      setSteps(sorted.length > 0 ? sorted : [newStep(0)])
    } catch {
      toast({ title: 'Erro ao carregar fluxo', variant: 'destructive' })
      router.push('/admin/processos-internos/fluxos')
    } finally {
      setLoading(false)
    }
  }, [isNew, params.id, router, toast])

  useEffect(() => { loadTemplate() }, [loadTemplate])

  // ─── Manipulação de etapas ───

  const addStep = () => {
    setSteps(prev => [...prev, newStep(prev.length)])
  }

  const removeStep = (idx: number) => {
    if (steps.length <= 1) {
      toast({ title: 'O fluxo precisa ter ao menos uma etapa', variant: 'destructive' })
      return
    }
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= steps.length) return
    setSteps(prev => {
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  const toggleAction = (idx: number, action: string) => {
    const step = steps[idx]
    const has = step.actions.includes(action)
    const next = has ? step.actions.filter(a => a !== action) : [...step.actions, action]
    if (next.length === 0) return // deve ter ao menos 1
    updateStep(idx, { actions: next })
  }

  // ─── Salvar ───

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Informe o nome do fluxo', variant: 'destructive' })
      return
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].name.trim()) {
        toast({ title: `Etapa ${i + 1} precisa de um nome`, variant: 'destructive' })
        return
      }
      if (!steps[i].organizationalUnitId || !steps[i].organizationalUnitName) {
        toast({ title: `Etapa ${i + 1} precisa de uma unidade de destino`, variant: 'destructive' })
        return
      }
    }

    const orderedSteps = steps.map((s, i) => ({ ...s, order: i }))
    const transitions = buildTransitions(orderedSteps)

    setSaving(true)
    try {
      if (isNew) {
        await flowClient.createWorkflowTemplate({
          name: name.trim(),
          description: description.trim() || undefined,
          steps: orderedSteps,
          transitions,
        })
        toast({ title: 'Fluxo criado com sucesso!' })
      } else {
        await flowClient.updateWorkflowTemplate(params.id as string, {
          name: name.trim(),
          description: description.trim() || undefined,
          steps: orderedSteps,
          transitions,
        })
        toast({ title: 'Fluxo atualizado!' })
      }
      router.push('/admin/processos-internos/fluxos')
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/processos-internos/fluxos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Fluxos
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          {isNew ? 'Novo Fluxo de Tramitação' : 'Editar Fluxo'}
        </h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Fluxo'}
        </Button>
      </div>

      {/* Nome e Descrição */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label htmlFor="name">Nome do Fluxo *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Fluxo de Memorando Padrão"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva quando este fluxo deve ser usado..."
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visualização do fluxo */}
      {steps.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.name ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 max-w-[80px] truncate">{step.name || '...'}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Etapas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Etapas <Badge variant="outline" className="ml-1">{steps.length}</Badge>
          </h2>
          <Button size="sm" variant="outline" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar Etapa
          </Button>
        </div>

        {steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            index={idx}
            total={steps.length}
            onUpdate={patch => updateStep(idx, patch)}
            onRemove={() => removeStep(idx)}
            onMoveUp={() => moveStep(idx, 'up')}
            onMoveDown={() => moveStep(idx, 'down')}
            onToggleAction={action => toggleAction(idx, action)}
          />
        ))}

        <Button variant="outline" className="w-full border-dashed text-gray-500" onClick={addStep}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Etapa
        </Button>
      </div>

      {/* Aviso sobre transitions */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          As transições entre etapas são geradas automaticamente em sequência linear (1→2→3...).
          Ao despachar com "Seguir Fluxo", a unidade de destino da próxima etapa é pré-selecionada.
        </p>
      </div>

      {/* Botão salvar ao final */}
      <div className="flex justify-end gap-3 pt-2 pb-8">
        <Link href="/admin/processos-internos/fluxos">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Fluxo'}
        </Button>
      </div>
    </div>
  )
}

// ─── Componente de Etapa ───

function StepCard({
  step,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleAction,
}: {
  step: WorkflowStep
  index: number
  total: number
  onUpdate: (patch: Partial<WorkflowStep>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleAction: (action: string) => void
}) {
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <Card className="border-l-4 border-l-blue-400">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          {/* Handle + ordem */}
          <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </div>
          <CardTitle className="text-sm flex-1">
            <Input
              value={step.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder={`Nome da Etapa ${index + 1} *`}
              className="h-7 text-sm font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
            />
          </CardTitle>
          {/* Mover + Remover */}
          <div className="flex items-center gap-1">
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6"
              onClick={onMoveUp}
              disabled={isFirst}
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6"
              onClick={onMoveDown}
              disabled={isLast}
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6 text-red-400 hover:text-red-600"
              onClick={onRemove}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Unidade */}
          <div>
            <OrganizationalUnitAutocomplete
              label="Unidade de destino"
              value={step.organizationalUnitName || ''}
              onValueChange={value => onUpdate({
                organizationalUnitName: value,
                organizationalUnitId: '',
                departmentId: undefined,
              })}
              onSelect={unit => onUpdate({
                organizationalUnitName: unit.nome,
                organizationalUnitId: unit.id,
                departmentId: unit.department?.id,
              })}
              placeholder="Ex: Secretaria de Finanças"
              helperText="Selecione uma unidade existente do organograma."
            />
          </div>

          {/* SLA */}
          <div>
            <Label className="text-xs text-gray-500">SLA (horas)</Label>
            <Input
              type="number"
              min={1}
              value={step.slaHours || ''}
              onChange={e => onUpdate({ slaHours: parseInt(e.target.value) || undefined })}
              placeholder="72"
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>

        {/* Documento requerido */}
        <div>
          <Label className="text-xs text-gray-500">Documento requerido nesta etapa</Label>
          <select
            value={step.documentRequired || ''}
            onChange={e => onUpdate({ documentRequired: e.target.value || undefined })}
            className="mt-1 w-full h-8 text-sm border border-input rounded-md px-2 bg-background"
          >
            {DOCUMENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Ações permitidas */}
        <div>
          <Label className="text-xs text-gray-500">Ações permitidas nesta etapa *</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {AVAILABLE_ACTIONS.map(a => {
              const active = step.actions.includes(a.value)
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => onToggleAction(a.value)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                    active
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {active && <CheckCircle2 className="w-3 h-3" />}
                  {a.label}
                </button>
              )
            })}
          </div>
          {step.actions.length === 0 && (
            <p className="text-xs text-red-500 mt-1">Selecione ao menos uma ação</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

