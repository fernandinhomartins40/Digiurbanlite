'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Save, Plus, GitBranch, RefreshCw, AlertCircle,
  Layers, Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  WorkflowStageEditor,
  WorkflowStageData,
  DocumentTemplateOption,
  WorkflowStageSupportAssignmentData,
  DepartmentOption
} from '@/components/admin/workflows/WorkflowStageEditor'

const createStageId = () => globalThis.crypto?.randomUUID?.() || `stage-${Math.random().toString(36).slice(2)}`
const createSupportAssignmentId = () => globalThis.crypto?.randomUUID?.() || `support-${Math.random().toString(36).slice(2)}`

function extractDepartmentOptions(response: any): DepartmentOption[] {
  const rawDepartments = Array.isArray(response)
    ? response
    : Array.isArray(response?.data?.departments)
      ? response.data.departments
      : Array.isArray(response?.departments)
        ? response.departments
        : Array.isArray(response?.data)
          ? response.data
          : []

  return rawDepartments.map((department: any) => ({
    id: department.id,
    name: department.name,
    code: department.code || undefined,
  }))
}

function normalizeSupportAssignment(raw: any): WorkflowStageSupportAssignmentData | null {
  if (!raw || typeof raw !== 'object') return null

  const targetType =
    raw.targetType === 'USER' || raw.targetType === 'DEPARTMENT' || raw.targetType === 'ORGANIZATIONAL_UNIT'
      ? raw.targetType
      : null

  if (!targetType) return null

  const userId = typeof raw.userId === 'string' ? raw.userId : raw.user?.id
  const departmentId =
    typeof raw.departmentId === 'string'
      ? raw.departmentId
      : raw.department?.id
  const organizationalUnitId =
    typeof raw.organizationalUnitId === 'string'
      ? raw.organizationalUnitId
      : raw.organizationalUnit?.id

  if (targetType === 'USER' && !userId) return null
  if (targetType === 'DEPARTMENT' && !departmentId) return null
  if (targetType === 'ORGANIZATIONAL_UNIT' && !organizationalUnitId) return null

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createSupportAssignmentId(),
    targetType,
    mode:
      raw.mode === 'REQUIRED_EXECUTION'
        ? 'REQUIRED_EXECUTION'
        : raw.mode === 'SUGGEST_ASSIGNMENT'
          ? 'SUGGEST_ASSIGNMENT'
          : 'REFERENCE_ONLY',
    userId,
    user: raw.user
      ? {
          ...raw.user,
          departmentId: raw.user.departmentId,
          department: raw.user.department || raw.user.departmentName,
        }
      : undefined,
    departmentId,
    department: raw.department
      ? {
          id: raw.department.id,
          name: raw.department.name,
          code: raw.department.code,
        }
      : undefined,
    organizationalUnitId,
    organizationalUnit: raw.organizationalUnit
      ? {
          ...raw.organizationalUnit,
          department:
            raw.organizationalUnit.department ||
            (raw.organizationalUnit.departmentId || raw.organizationalUnit.departmentName
              ? {
                  id: raw.organizationalUnit.departmentId || '',
                  name: raw.organizationalUnit.departmentName || '',
                  code: '',
                }
              : undefined),
        }
      : undefined,
    searchValue: raw.searchValue || raw.organizationalUnit?.nome || '',
  }
}

function cloneSupportAssignments(
  supportAssignments: WorkflowStageSupportAssignmentData[]
): WorkflowStageSupportAssignmentData[] {
  return supportAssignments.map(assignment => ({
    ...assignment,
    id: createSupportAssignmentId(),
  }))
}

function createEmptyStage(order: number): WorkflowStageData {
  return {
    id: createStageId(),
    name: '', description: '', order, slaDays: 3, canSkip: false, skipCondition: '',
    stageType: '', availableTabs: ['resumo', 'documentos', 'comunicacao'], primaryTab: 'resumo',
    allowedActions: ['APPROVE'], actionLabels: {}, requiredDocumentTypes: [],
    requiredFormFields: [], documentTemplateIds: [], role: '', department: '', requiresApproval: false,
    supportAssignments: [],
  }
}

function normalizeStage(raw: any, order: number): WorkflowStageData {
  return {
    id: raw.id || createStageId(),
    name: raw.name || '', description: raw.description || '', order,
    slaDays: raw.slaDays || 3, canSkip: raw.canSkip || false, skipCondition: raw.skipCondition || '',
    stageType: raw.stageType || '',
    availableTabs: Array.isArray(raw.availableTabs) ? raw.availableTabs : ['resumo', 'comunicacao'],
    primaryTab: raw.primaryTab || 'resumo',
    allowedActions: Array.isArray(raw.allowedActions) ? raw.allowedActions : ['APPROVE'],
    actionLabels: raw.actionLabels || {},
    requiredDocumentTypes: Array.isArray(raw.requiredDocumentTypes) ? raw.requiredDocumentTypes : [],
    requiredFormFields: Array.isArray(raw.requiredFormFields || raw.requiredFormFieldIds) ? (raw.requiredFormFields || raw.requiredFormFieldIds) : [],
    documentTemplateIds: Array.isArray(raw.documentTemplateIds) ? raw.documentTemplateIds : [],
    role: raw.role || '', department: raw.department || '', requiresApproval: raw.requiresApproval || false,
    supportAssignments: Array.isArray(raw.supportAssignments)
      ? raw.supportAssignments
          .map(normalizeSupportAssignment)
          .filter(
            (assignment: WorkflowStageSupportAssignmentData | null): assignment is WorkflowStageSupportAssignmentData =>
              Boolean(assignment)
          )
      : [],
  }
}

const STAGE_TEMPLATES: Record<string, Partial<WorkflowStageData>> = {
  'Recepção': { name: 'Recepção', description: 'Recebimento e registro inicial', slaDays: 1, stageType: 'RECEPTION', availableTabs: ['resumo', 'documentos', 'comunicacao'], primaryTab: 'resumo', allowedActions: ['APPROVE'], actionLabels: { APPROVE: 'Aceitar protocolo' } },
  'Análise Documental': { name: 'Análise Documental', description: 'Verificação de documentos', slaDays: 2, availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'], primaryTab: 'documentos', allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'] },
  'Análise Técnica': { name: 'Análise Técnica', description: 'Avaliação técnica', slaDays: 5, availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'], primaryTab: 'dados', allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'] },
  'Emissão': { name: 'Emissão de Documentos', description: 'Geração e emissão do documento final', slaDays: 3, stageType: 'DOCUMENT_GENERATION', availableTabs: ['resumo', 'documentos', 'generated', 'document-generation', 'send', 'comunicacao'], primaryTab: 'document-generation', allowedActions: ['APPROVE'] },
  'Conclusão': { name: 'Conclusão', description: 'Finalização do protocolo', slaDays: 1, stageType: 'CONCLUSION', availableTabs: ['resumo', 'documentos', 'generated', 'document-generation', 'send', 'comunicacao'], primaryTab: 'document-generation', allowedActions: ['APPROVE'], actionLabels: { APPROVE: 'Concluir protocolo' } },
}

interface ServiceOption {
  id: string
  name: string
  moduleType: string | null
  department: { name: string }
}

export default function NewWorkflowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [serviceSearch, setServiceSearch] = useState('')
  const [departments, setDepartments] = useState<DepartmentOption[]>([])

  // Form
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultSLA, setDefaultSLA] = useState(15)
  const [stages, setStages] = useState<WorkflowStageData[]>([])
  const [serviceInfo, setServiceInfo] = useState<any>(null)
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplateOption[]>([])

  // Load services without workflow
  const loadServices = useCallback(async () => {
    try {
      setLoadingServices(true)
      // Get all services and all workflows to find which ones are free
      const [svcResp, wfResp] = await Promise.all([
        apiRequest('/services-simplified?isActive=true'),
        apiRequest('/service-workflows')
      ])
      if (svcResp.success && wfResp.success) {
        const existingIds = new Set((wfResp.data || []).map((w: any) => w.serviceId))
        const available = (svcResp.data || []).filter((s: any) => !existingIds.has(s.id))
        setServices(available)
      }
    } catch {}
    finally { setLoadingServices(false) }
  }, [apiRequest])

  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/departments')
      const options = extractDepartmentOptions(response)

      if (options.length > 0) {
        setDepartments(options)
        return
      }
    } catch (error) {
      console.warn('Falha ao carregar departamentos em /admin/departments, tentando fallback.', error)
    }

    try {
      const response = await apiRequest('/departments')
      setDepartments(extractDepartmentOptions(response))
    } catch (error) {
      console.error('Erro ao carregar departamentos do workflow:', error)
      setDepartments([])
    }
  }, [apiRequest])

  useEffect(() => {
    loadServices()
    loadDepartments()

    // Check for duplicate data
    const duplicateData = searchParams.get('duplicate')
    if (duplicateData) {
      try {
        const data = JSON.parse(decodeURIComponent(duplicateData))
        if (data.name) setName(data.name)
        if (data.description) setDescription(data.description)
        if (data.defaultSLA) setDefaultSLA(data.defaultSLA)
        if (data.stages) setStages(data.stages.map((s: any, i: number) => normalizeStage(s, i + 1)))
      } catch {}
    }
  }, [loadServices, loadDepartments, searchParams])

  // Load service info and document templates when service selected
  useEffect(() => {
    if (!selectedServiceId) { setServiceInfo(null); setDocumentTemplates([]); return }
    const loadInfo = async () => {
      try {
        const [resp, tplResp] = await Promise.all([
          apiRequest(`/service-workflows/service-info/${selectedServiceId}`),
          apiRequest(`/document-templates?serviceId=${selectedServiceId}`)
        ])
        if (resp.success) {
          setServiceInfo(resp.data)
          if (!name) setName(`Workflow - ${resp.data.name}`)
          if (resp.data.estimatedDays && defaultSLA === 15) setDefaultSLA(resp.data.estimatedDays)
        }
        if (tplResp.success && Array.isArray(tplResp.data)) {
          setDocumentTemplates(tplResp.data.map((t: any) => ({
            id: t.id, name: t.name, code: t.code || '',
            documentType: t.documentType || '', isGlobal: t.isGlobal || false
          })))
        }
      } catch {}
    }
    loadInfo()
  }, [selectedServiceId, apiRequest, name, defaultSLA])

  const handleStageChange = (index: number, stage: WorkflowStageData) => {
    setStages(prev => prev.map((s, i) => i === index ? stage : s))
  }
  const handleStageRemove = (index: number) => {
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
      copy.splice(index + 1, 0, {
        ...copy[index],
        id: createStageId(),
        name: `${copy[index].name} (Cópia)`,
        supportAssignments: cloneSupportAssignments(copy[index].supportAssignments),
      })
      return copy.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }
  const handleAddTemplate = (key: string) => {
    const t = STAGE_TEMPLATES[key]
    if (!t) return
    setStages(prev => [...prev, { ...createEmptyStage(prev.length + 1), ...t, order: prev.length + 1 }])
  }

  const handleSave = async () => {
    if (!selectedServiceId) { toast({ title: 'Selecione um serviço', variant: 'destructive' }); return }
    if (!name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return }
    if (stages.length === 0) { toast({ title: 'Adicione pelo menos uma etapa', variant: 'destructive' }); return }
    for (let i = 0; i < stages.length; i++) {
      if (!stages[i].name.trim()) { toast({ title: `Etapa ${i + 1} sem nome`, variant: 'destructive' }); return }
    }

    try {
      setSaving(true)
      const cleanStages = stages.map(s => ({
        ...s,
        stageType: s.stageType === 'default' || s.stageType === '' ? undefined : s.stageType,
        role: s.role || undefined, department: s.department || undefined,
        skipCondition: s.skipCondition || undefined, description: s.description || undefined,
        requiredFormFieldIds: s.requiredFormFields,
        documentTemplateIds: s.documentTemplateIds?.length ? s.documentTemplateIds : undefined,
        supportAssignments: s.supportAssignments.map(assignment => ({
          id: assignment.id,
          targetType: assignment.targetType,
          mode: assignment.mode,
          userId: assignment.userId,
          departmentId: assignment.departmentId,
          organizationalUnitId: assignment.organizationalUnitId,
          user: assignment.user,
          department: assignment.department,
          organizationalUnit: assignment.organizationalUnit,
        })),
      }))

      const response = await apiRequest('/service-workflows', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId, name, description: description || undefined,
          defaultSLA, stages: cleanStages,
        })
      })

      if (response.success) {
        toast({ title: 'Workflow criado com sucesso' })
        router.push(`/admin/workflows/${response.data.id}/view`)
      }
    } catch (error) {
      toast({ title: 'Erro ao criar', description: error instanceof Error ? error.message : 'Erro', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const filteredServices = services.filter(s => {
    const q = serviceSearch.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.department.name.toLowerCase().includes(q) || (s.moduleType || '').toLowerCase().includes(q)
  })

  const serviceDocTypes: string[] = serviceInfo?.requiredDocuments?.map((d: any) => d.name || d.type) || []
  const serviceFormFields: { id: string; label: string }[] = serviceInfo?.formFields?.map((f: any) => ({ id: f.id, label: f.label || f.id })) || []

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/admin/workflows')}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar
        </Button>
        <div className="flex items-center gap-3 mb-1">
          <GitBranch className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Novo Workflow</h1>
        </div>
        <p className="text-sm text-muted-foreground">Crie um fluxo de trabalho personalizado para um serviço</p>
      </div>

      {/* Select Service */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Selecione o Serviço</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loadingServices ? (
            <div className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Carregando serviços...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Todos os serviços já possuem workflow</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar serviço..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                {filteredServices.slice(0, 50).map(svc => (
                  <div
                    key={svc.id}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${selectedServiceId === svc.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedServiceId(svc.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{svc.department.name}</Badge>
                        {svc.moduleType && <Badge variant="outline" className="text-[10px] font-mono">{svc.moduleType}</Badge>}
                      </div>
                    </div>
                    {selectedServiceId === svc.id && <Badge className="text-xs">Selecionado</Badge>}
                  </div>
                ))}
              </div>
              {filteredServices.length > 50 && <p className="text-xs text-muted-foreground">Mostrando 50 de {filteredServices.length}. Refine a busca.</p>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      {selectedServiceId && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">2. Informações do Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Workflow - Emissão de Alvará" />
                </div>
                <div className="space-y-1.5">
                  <Label>SLA Padrão (dias)</Label>
                  <Input type="number" min="1" value={defaultSLA} onChange={(e) => setDefaultSLA(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descreva o propósito..." className="resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Stages */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5" />3. Etapas ({stages.length})</h2>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setStages(prev => [...prev, createEmptyStage(prev.length + 1)])}><Plus className="h-3.5 w-3.5 mr-1" />Vazia</Button>
                {Object.keys(STAGE_TEMPLATES).map(k => (
                  <Button key={k} variant="ghost" size="sm" className="text-xs" onClick={() => handleAddTemplate(k)}>+ {k}</Button>
                ))}
              </div>
            </div>

            {stages.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Adicione etapas usando templates pré-configurados</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.keys(STAGE_TEMPLATES).map(k => (
                    <Button key={k} variant="outline" size="sm" onClick={() => handleAddTemplate(k)}>+ {k}</Button>
                  ))}
                </div>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <WorkflowStageEditor
                    key={stage.id}
                    stage={stage}
                    index={index}
                    totalStages={stages.length}
                    serviceDocumentTypes={serviceDocTypes}
                    serviceFormFields={serviceFormFields}
                    departments={departments}
                    documentTemplates={documentTemplates}
                    workflowDepartmentId={serviceInfo?.departmentId}
                    onChange={handleStageChange}
                    onRemove={handleStageRemove}
                    onMove={handleStageMove}
                    onDuplicate={handleStageDuplicate}
                  />
                ))}
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={() => setStages(prev => [...prev, createEmptyStage(prev.length + 1)])}><Plus className="h-4 w-4 mr-1" />Adicionar Etapa</Button>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="sticky bottom-0 bg-background border-t py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 flex justify-between">
            <Button variant="ghost" onClick={() => router.push('/admin/workflows')}><ArrowLeft className="h-4 w-4 mr-1" />Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Criando...</> : <><Save className="h-4 w-4 mr-2" />Criar Workflow</>}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
