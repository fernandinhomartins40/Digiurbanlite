'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Save, Plus, GitBranch, RefreshCw, AlertCircle,
  Layers, FileJson, Upload, Download, Undo2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WorkflowStageEditor, WorkflowStageData } from '@/components/admin/workflows/WorkflowStageEditor'

function createEmptyStage(order: number): WorkflowStageData {
  return {
    name: '',
    description: '',
    order,
    slaDays: 3,
    canSkip: false,
    skipCondition: '',
    stageType: '',
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE'],
    actionLabels: {},
    requiredDocumentTypes: [],
    requiredFormFields: [],
    role: '',
    department: '',
    requiresApproval: false,
  }
}

function normalizeStage(raw: any, order: number): WorkflowStageData {
  return {
    name: raw.name || '',
    description: raw.description || '',
    order,
    slaDays: raw.slaDays || 3,
    canSkip: raw.canSkip || false,
    skipCondition: raw.skipCondition || '',
    stageType: raw.stageType || '',
    availableTabs: Array.isArray(raw.availableTabs) ? raw.availableTabs : ['resumo', 'comunicacao'],
    primaryTab: raw.primaryTab || 'resumo',
    allowedActions: Array.isArray(raw.allowedActions) ? raw.allowedActions : ['APPROVE'],
    actionLabels: raw.actionLabels || {},
    requiredDocumentTypes: Array.isArray(raw.requiredDocumentTypes) ? raw.requiredDocumentTypes : [],
    requiredFormFields: Array.isArray(raw.requiredFormFields || raw.requiredFormFieldIds) ? (raw.requiredFormFields || raw.requiredFormFieldIds) : [],
    role: raw.role || '',
    department: raw.department || '',
    requiresApproval: raw.requiresApproval || false,
  }
}

const STAGE_TEMPLATES: Record<string, Partial<WorkflowStageData>> = {
  'Recepção': {
    name: 'Recepção',
    description: 'Recebimento e registro inicial da solicitação',
    slaDays: 1,
    stageType: 'RECEPTION',
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE'],
    actionLabels: { APPROVE: 'Aceitar protocolo' },
  },
  'Análise Documental': {
    name: 'Análise Documental',
    description: 'Verificação de documentos obrigatórios',
    slaDays: 2,
    availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
    primaryTab: 'documentos',
    allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
  },
  'Análise Técnica': {
    name: 'Análise Técnica',
    description: 'Avaliação técnica da solicitação',
    slaDays: 5,
    availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
    primaryTab: 'dados',
    allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
  },
  'Vistoria': {
    name: 'Vistoria',
    description: 'Vistoria técnica in loco',
    slaDays: 7,
    availableTabs: ['resumo', 'dados', 'location', 'documentos', 'comunicacao'],
    primaryTab: 'location',
    allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
  },
  'Aprovação': {
    name: 'Aprovação Final',
    description: 'Aprovação final pela gestão',
    slaDays: 2,
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE', 'REJECT'],
  },
  'Emissão': {
    name: 'Emissão de Documentos',
    description: 'Geração e emissão do documento final',
    slaDays: 3,
    stageType: 'DOCUMENT_GENERATION',
    availableTabs: ['resumo', 'documentos', 'generated', 'document-generation', 'send', 'comunicacao'],
    primaryTab: 'document-generation',
    allowedActions: ['APPROVE'],
  },
  'Conclusão': {
    name: 'Conclusão',
    description: 'Finalização do protocolo',
    slaDays: 1,
    stageType: 'CONCLUSION',
    availableTabs: ['resumo', 'documentos', 'generated', 'document-generation', 'send', 'comunicacao'],
    primaryTab: 'document-generation',
    allowedActions: ['APPROVE'],
    actionLabels: { APPROVE: 'Concluir protocolo' },
  },
}

export default function WorkflowEditPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workflow, setWorkflow] = useState<any>(null)
  const [serviceInfo, setServiceInfo] = useState<any>(null)
  const [departments, setDepartments] = useState<string[]>([])

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultSLA, setDefaultSLA] = useState(15)
  const [isActive, setIsActive] = useState(true)
  const [stages, setStages] = useState<WorkflowStageData[]>([])
  const [showJsonImport, setShowJsonImport] = useState(false)
  const [jsonImportValue, setJsonImportValue] = useState('')

  const loadWorkflow = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/service-workflows/${params.id}`)
      if (response.success && response.data) {
        const wf = response.data
        setWorkflow(wf)
        setName(wf.name)
        setDescription(wf.description || '')
        setDefaultSLA(wf.defaultSLA || 15)
        setIsActive(wf.isActive)
        const rawStages = Array.isArray(wf.stages) ? wf.stages : []
        setStages(rawStages.map((s: any, i: number) => normalizeStage(s, i + 1)))

        // Load service info
        if (wf.serviceId) {
          try {
            const svcResp = await apiRequest(`/service-workflows/service-info/${wf.serviceId}`)
            if (svcResp.success) setServiceInfo(svcResp.data)
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Erro ao carregar workflow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [apiRequest, params.id, toast])

  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiRequest('/departments')
      if (response.success && Array.isArray(response.data)) {
        setDepartments(response.data.map((d: any) => d.name))
      }
    } catch {}
  }, [apiRequest])

  useEffect(() => { loadWorkflow(); loadDepartments() }, [loadWorkflow, loadDepartments])

  // Stage handlers
  const handleStageChange = (index: number, updatedStage: WorkflowStageData) => {
    setStages(prev => prev.map((s, i) => i === index ? updatedStage : s))
  }

  const handleStageRemove = (index: number) => {
    if (stages.length <= 1) {
      toast({ title: 'O workflow precisa ter pelo menos 1 etapa', variant: 'destructive' })
      return
    }
    setStages(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })))
  }

  const handleStageMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= stages.length) return
    setStages(prev => {
      const copy = [...prev]
      ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
      return copy.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const handleStageDuplicate = (index: number) => {
    setStages(prev => {
      const copy = [...prev]
      const newStage = { ...copy[index], name: `${copy[index].name} (Cópia)` }
      copy.splice(index + 1, 0, newStage)
      return copy.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const handleAddStage = () => {
    setStages(prev => [...prev, createEmptyStage(prev.length + 1)])
  }

  const handleAddTemplate = (templateKey: string) => {
    const template = STAGE_TEMPLATES[templateKey]
    if (!template) return
    const newStage: WorkflowStageData = { ...createEmptyStage(stages.length + 1), ...template, order: stages.length + 1 }
    setStages(prev => [...prev, newStage])
  }

  const handleExportJson = () => {
    const data = JSON.stringify({ name, description, defaultSLA, stages }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${workflow?.service?.name || 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = () => {
    try {
      const data = JSON.parse(jsonImportValue)
      if (data.stages && Array.isArray(data.stages)) {
        setStages(data.stages.map((s: any, i: number) => normalizeStage(s, i + 1)))
        if (data.name) setName(data.name)
        if (data.description) setDescription(data.description)
        if (data.defaultSLA) setDefaultSLA(data.defaultSLA)
        setShowJsonImport(false)
        setJsonImportValue('')
        toast({ title: 'JSON importado com sucesso' })
      } else {
        toast({ title: 'JSON inválido', description: 'O JSON precisa ter um array "stages"', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'JSON inválido', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' }); return
    }
    if (stages.length === 0) {
      toast({ title: 'Adicione pelo menos uma etapa', variant: 'destructive' }); return
    }
    for (let i = 0; i < stages.length; i++) {
      if (!stages[i].name.trim()) {
        toast({ title: `Etapa ${i + 1} precisa de nome`, variant: 'destructive' }); return
      }
    }

    try {
      setSaving(true)
      // Clean stages for API — remove empty strings, convert stageType 'default' to undefined
      const cleanStages = stages.map(s => ({
        ...s,
        stageType: s.stageType === 'default' || s.stageType === '' ? undefined : s.stageType,
        role: s.role || undefined,
        department: s.department || undefined,
        skipCondition: s.skipCondition || undefined,
        description: s.description || undefined,
        requiredFormFieldIds: s.requiredFormFields, // Backend expects requiredFormFieldIds
      }))

      const response = await apiRequest(`/service-workflows/service/${workflow.serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          description: description || undefined,
          defaultSLA,
          isActive,
          stages: cleanStages,
        })
      })

      if (response.success) {
        toast({ title: 'Workflow salvo com sucesso' })
        router.push(`/admin/workflows/${params.id}/view`)
      }
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error instanceof Error ? error.message : 'Erro', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Extract service document types and form fields
  const serviceDocumentTypes: string[] = serviceInfo?.requiredDocuments?.map((d: any) => d.name || d.type) || []
  const serviceFormFields: { id: string; label: string }[] = serviceInfo?.formFields?.map((f: any) => ({ id: f.id, label: f.label || f.id })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Workflow não encontrado</h2>
        <Button variant="outline" onClick={() => router.push('/admin/workflows')}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push(`/admin/workflows/${params.id}/view`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <div className="flex items-center gap-3 mb-1">
            <GitBranch className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Editar Workflow</h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{workflow.service?.name}</Badge>
            <Badge variant="outline">{workflow.service?.department?.name}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJson}><Download className="h-4 w-4 mr-1" />Exportar JSON</Button>
          <Button variant="outline" size="sm" onClick={() => setShowJsonImport(!showJsonImport)}><Upload className="h-4 w-4 mr-1" />Importar JSON</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar</>}
          </Button>
        </div>
      </div>

      {/* JSON Import */}
      {showJsonImport && (
        <Card className="border-dashed border-2">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium">Colar JSON do workflow</Label>
            <Textarea value={jsonImportValue} onChange={(e) => setJsonImportValue(e.target.value)} rows={6} placeholder='{"name": "...", "stages": [...]}' className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImportJson}>Importar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowJsonImport(false); setJsonImportValue('') }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4" />Informações do Workflow</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Nome do Workflow *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Workflow - Emissão de Alvará" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">SLA Padrão (dias)</Label>
                <Input type="number" min="1" value={defaultSLA} onChange={(e) => setDefaultSLA(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm">{isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descreva o propósito deste workflow..." className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Etapas ({stages.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleAddStage}>
              <Plus className="h-4 w-4 mr-1" />Etapa Vazia
            </Button>
            {Object.keys(STAGE_TEMPLATES).map(key => (
              <Button key={key} variant="ghost" size="sm" className="text-xs" onClick={() => handleAddTemplate(key)}>
                + {key}
              </Button>
            ))}
          </div>
        </div>

        {stages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhuma etapa. Adicione etapas usando os botões acima ou templates pré-configurados.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(STAGE_TEMPLATES).map(key => (
                  <Button key={key} variant="outline" size="sm" onClick={() => handleAddTemplate(key)}>+ {key}</Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <WorkflowStageEditor
                key={`stage-${index}-${stage.order}`}
                stage={stage}
                index={index}
                totalStages={stages.length}
                serviceDocumentTypes={serviceDocumentTypes}
                serviceFormFields={serviceFormFields}
                departments={departments}
                onChange={handleStageChange}
                onRemove={handleStageRemove}
                onMove={handleStageMove}
                onDuplicate={handleStageDuplicate}
              />
            ))}
          </div>
        )}

        {/* Add more stages */}
        {stages.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Button variant="outline" onClick={handleAddStage}><Plus className="h-4 w-4 mr-1" />Adicionar Etapa</Button>
          </div>
        )}
      </div>

      {/* Footer Save */}
      <div className="sticky bottom-0 bg-background border-t py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push(`/admin/workflows/${params.id}/view`)}>
          <Undo2 className="h-4 w-4 mr-1" />Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Workflow</>}
        </Button>
      </div>
    </div>
  )
}
