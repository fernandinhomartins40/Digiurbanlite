'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trash2, MoveUp, MoveDown, ChevronDown, ChevronUp,
  Settings, Eye, FileText, Shield, Copy, GripVertical
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowStageData {
  name: string
  description: string
  order: number
  slaDays: number
  canSkip: boolean
  skipCondition: string
  stageType: string
  availableTabs: string[]
  primaryTab: string
  allowedActions: string[]
  actionLabels: Record<string, string>
  requiredDocumentTypes: string[]
  requiredFormFields: string[]
  role: string
  department: string
  requiresApproval: boolean
}

interface WorkflowStageEditorProps {
  stage: WorkflowStageData
  index: number
  totalStages: number
  serviceDocumentTypes: string[]
  serviceFormFields: { id: string; label: string }[]
  departments: string[]
  onChange: (index: number, stage: WorkflowStageData) => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onDuplicate: (index: number) => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AVAILABLE_TABS = [
  { id: 'resumo', label: 'Resumo', description: 'Visão geral do protocolo' },
  { id: 'documentos', label: 'Documentos', description: 'Upload e visualização de documentos' },
  { id: 'dados', label: 'Dados/Formulário', description: 'Campos de formulário do serviço' },
  { id: 'pendencias', label: 'Pendências', description: 'Itens pendentes e bloqueadores' },
  { id: 'comunicacao', label: 'Comunicação', description: 'Mensagens e histórico' },
  { id: 'generated', label: 'Documentos Gerados', description: 'Documentos gerados pelo sistema' },
  { id: 'document-generation', label: 'Gerar Documentos', description: 'Interface para gerar documentos' },
  { id: 'send', label: 'Enviar', description: 'Enviar documentos ao cidadão' },
  { id: 'location', label: 'Localização', description: 'Mapa e coordenadas' },
]

const AVAILABLE_ACTIONS = [
  { id: 'APPROVE', label: 'Aprovar', description: 'Aprovar e avançar para próxima etapa', defaultLabel: 'Aprovar' },
  { id: 'REJECT', label: 'Rejeitar', description: 'Rejeitar a solicitação', defaultLabel: 'Rejeitar' },
  { id: 'REQUEST_INFO', label: 'Solicitar Informações', description: 'Pedir informações adicionais ao cidadão', defaultLabel: 'Solicitar Informações' },
  { id: 'CREATE_PENDING', label: 'Criar Pendência', description: 'Criar um item pendente', defaultLabel: 'Criar Pendência' },
  { id: 'SKIP', label: 'Pular Etapa', description: 'Pular para próxima etapa (se permitido)', defaultLabel: 'Pular' },
]

const STAGE_TYPES = [
  { id: '', label: 'Intermediária (padrão)' },
  { id: 'RECEPTION', label: 'Recepção (primeira etapa)' },
  { id: 'DOCUMENT_GENERATION', label: 'Geração de Documentos (emissão)' },
  { id: 'CONCLUSION', label: 'Conclusão (etapa final)' },
]

const ROLES = [
  { id: '', label: 'Qualquer (sem restrição)' },
  { id: 'USER', label: 'Servidor (USER)' },
  { id: 'COORDINATOR', label: 'Coordenador (COORDINATOR)' },
  { id: 'MANAGER', label: 'Gerente (MANAGER)' },
  { id: 'ADMIN', label: 'Administrador (ADMIN)' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowStageEditor({
  stage,
  index,
  totalStages,
  serviceDocumentTypes,
  serviceFormFields,
  departments,
  onChange,
  onRemove,
  onMove,
  onDuplicate
}: WorkflowStageEditorProps) {
  const [expanded, setExpanded] = useState(true)

  const update = (partial: Partial<WorkflowStageData>) => {
    onChange(index, { ...stage, ...partial })
  }

  const toggleTab = (tabId: string) => {
    const tabs = stage.availableTabs.includes(tabId)
      ? stage.availableTabs.filter(t => t !== tabId)
      : [...stage.availableTabs, tabId]
    const primaryTab = tabs.includes(stage.primaryTab) ? stage.primaryTab : (tabs[0] || 'resumo')
    update({ availableTabs: tabs, primaryTab })
  }

  const toggleAction = (actionId: string) => {
    const actions = stage.allowedActions.includes(actionId)
      ? stage.allowedActions.filter(a => a !== actionId)
      : [...stage.allowedActions, actionId]
    const labels = { ...stage.actionLabels }
    if (!actions.includes(actionId)) delete labels[actionId]
    update({ allowedActions: actions, actionLabels: labels })
  }

  const toggleDocument = (doc: string) => {
    const docs = stage.requiredDocumentTypes.includes(doc)
      ? stage.requiredDocumentTypes.filter(d => d !== doc)
      : [...stage.requiredDocumentTypes, doc]
    update({ requiredDocumentTypes: docs })
  }

  const toggleFormField = (fieldId: string) => {
    const fields = stage.requiredFormFields.includes(fieldId)
      ? stage.requiredFormFields.filter(f => f !== fieldId)
      : [...stage.requiredFormFields, fieldId]
    update({ requiredFormFields: fields })
  }

  const stageTypeInfo = STAGE_TYPES.find(t => t.id === (stage.stageType || ''))

  return (
    <Card className="border-l-4 border-l-primary">
      {/* Collapsed Header */}
      <CardHeader className="p-3 sm:p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {stage.order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">{stage.name || `Etapa ${stage.order}`}</span>
                {stage.stageType && (
                  <Badge variant="secondary" className="text-[10px]">{stageTypeInfo?.label}</Badge>
                )}
                {stage.slaDays > 0 && <Badge variant="outline" className="text-[10px]">{stage.slaDays}d SLA</Badge>}
                {stage.canSkip && <Badge variant="outline" className="text-[10px] bg-yellow-50">Pulável</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onMove(index, 'up') }} disabled={index === 0}><MoveUp className="h-3.5 w-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onMove(index, 'down') }} disabled={index === totalStages - 1}><MoveDown className="h-3.5 w-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onDuplicate(index) }}><Copy className="h-3.5 w-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(index) }}><Trash2 className="h-3.5 w-3.5" /></Button>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="p-3 sm:p-4 pt-0">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="info" className="text-xs gap-1"><Settings className="h-3 w-3 hidden sm:inline" />Informações</TabsTrigger>
              <TabsTrigger value="ui" className="text-xs gap-1"><Eye className="h-3 w-3 hidden sm:inline" />Interface</TabsTrigger>
              <TabsTrigger value="requirements" className="text-xs gap-1"><FileText className="h-3 w-3 hidden sm:inline" />Requisitos</TabsTrigger>
              <TabsTrigger value="governance" className="text-xs gap-1"><Shield className="h-3 w-3 hidden sm:inline" />Governança</TabsTrigger>
            </TabsList>

            {/* === TAB 1: INFORMAÇÕES BÁSICAS === */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome da Etapa *</Label>
                  <Input
                    placeholder="Ex: Análise Documental"
                    value={stage.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SLA (dias úteis)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={stage.slaDays}
                    onChange={(e) => update({ slaDays: parseInt(e.target.value) || 1 })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição</Label>
                <Textarea
                  placeholder="Descreva o que acontece nesta etapa..."
                  value={stage.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tipo da Etapa</Label>
                  <Select value={stage.stageType || ''} onValueChange={(v) => update({ stageType: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGE_TYPES.map(t => <SelectItem key={t.id} value={t.id || 'default'}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Permitir pular etapa</Label>
                    <Switch checked={stage.canSkip} onCheckedChange={(v) => update({ canSkip: v })} />
                  </div>
                  {stage.canSkip && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Condição para pular (opcional)</Label>
                      <Input placeholder="Ex: documento_especial_presente" value={stage.skipCondition} onChange={(e) => update({ skipCondition: e.target.value })} className="text-xs" />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* === TAB 2: INTERFACE (TABS & AÇÕES) === */}
            <TabsContent value="ui" className="space-y-5 mt-4">
              {/* Available Tabs */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Abas visíveis na interface</Label>
                <p className="text-[10px] text-muted-foreground mb-2">Selecione quais abas o servidor verá ao trabalhar nesta etapa</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {AVAILABLE_TABS.map(tab => {
                    const isSelected = stage.availableTabs.includes(tab.id)
                    const isPrimary = stage.primaryTab === tab.id
                    return (
                      <div
                        key={tab.id}
                        className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'} ${isPrimary ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => toggleTab(tab.id)}
                      >
                        <Checkbox checked={isSelected} className="mt-0.5" onCheckedChange={() => {}} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">{tab.label}</span>
                            {isPrimary && <Badge className="text-[9px] h-4 px-1">Principal</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{tab.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Primary Tab */}
              {stage.availableTabs.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Aba principal (destacada)</Label>
                  <Select value={stage.primaryTab} onValueChange={(v) => update({ primaryTab: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stage.availableTabs.map(tabId => {
                        const tab = AVAILABLE_TABS.find(t => t.id === tabId)
                        return <SelectItem key={tabId} value={tabId}>{tab?.label || tabId}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Allowed Actions */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Ações permitidas</Label>
                <p className="text-[10px] text-muted-foreground mb-2">Botões de ação disponíveis para o servidor nesta etapa</p>
                <div className="space-y-2">
                  {AVAILABLE_ACTIONS.map(action => {
                    const isSelected = stage.allowedActions.includes(action.id)
                    return (
                      <div key={action.id} className={`p-2.5 rounded-md border transition-colors ${isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'}`}>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleAction(action.id)} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-medium">{action.label}</span>
                                <p className="text-[10px] text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-2">
                                <Label className="text-[10px] text-muted-foreground">Rótulo customizado (opcional)</Label>
                                <Input
                                  placeholder={action.defaultLabel}
                                  value={stage.actionLabels[action.id] || ''}
                                  onChange={(e) => update({ actionLabels: { ...stage.actionLabels, [action.id]: e.target.value } })}
                                  className="text-xs h-7 mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* === TAB 3: REQUISITOS === */}
            <TabsContent value="requirements" className="space-y-5 mt-4">
              {/* Required Documents */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Documentos obrigatórios nesta etapa</Label>
                <p className="text-[10px] text-muted-foreground mb-2">O servidor não poderá aprovar sem estes documentos</p>
                {serviceDocumentTypes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {serviceDocumentTypes.map(doc => (
                      <div
                        key={doc}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${stage.requiredDocumentTypes.includes(doc) ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'}`}
                        onClick={() => toggleDocument(doc)}
                      >
                        <Checkbox checked={stage.requiredDocumentTypes.includes(doc)} onCheckedChange={() => {}} />
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground italic">Nenhum tipo de documento definido no serviço. Adicione manualmente:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do documento obrigatório"
                        className="text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim()
                            if (val && !stage.requiredDocumentTypes.includes(val)) {
                              update({ requiredDocumentTypes: [...stage.requiredDocumentTypes, val] })
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    {stage.requiredDocumentTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stage.requiredDocumentTypes.map(doc => (
                          <Badge key={doc} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/20" onClick={() => toggleDocument(doc)}>
                            {doc} &times;
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Required Form Fields */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Campos de formulário obrigatórios</Label>
                <p className="text-[10px] text-muted-foreground mb-2">Campos que devem estar preenchidos/aprovados nesta etapa</p>
                {serviceFormFields.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {serviceFormFields.map(field => (
                      <div
                        key={field.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${stage.requiredFormFields.includes(field.id) ? 'bg-purple-50 border-purple-200' : 'hover:bg-muted/50'}`}
                        onClick={() => toggleFormField(field.id)}
                      >
                        <Checkbox checked={stage.requiredFormFields.includes(field.id)} onCheckedChange={() => {}} />
                        <span>{field.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({field.id})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground italic">Nenhum campo definido no serviço. Adicione manualmente:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ID do campo (ex: parecer_tecnico)"
                        className="text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim()
                            if (val && !stage.requiredFormFields.includes(val)) {
                              update({ requiredFormFields: [...stage.requiredFormFields, val] })
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    {stage.requiredFormFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stage.requiredFormFields.map(field => (
                          <Badge key={field} variant="secondary" className="text-xs cursor-pointer font-mono hover:bg-destructive/20" onClick={() => toggleFormField(field)}>
                            {field} &times;
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* === TAB 4: GOVERNANÇA === */}
            <TabsContent value="governance" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role mínimo necessário</Label>
                  <Select value={stage.role || ''} onValueChange={(v) => update({ role: v === 'none' ? '' : v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r.id || 'none'} value={r.id || 'none'}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Define quem pode atuar nesta etapa</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Departamento responsável</Label>
                  <Select value={stage.department || ''} onValueChange={(v) => update({ department: v === 'none' ? '' : v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Qualquer (mesmo do protocolo)</SelectItem>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <Label className="text-xs font-medium">Requer aprovação manual</Label>
                  <p className="text-[10px] text-muted-foreground">Exige que um supervisor aprove antes de avançar</p>
                </div>
                <Switch checked={stage.requiresApproval} onCheckedChange={(v) => update({ requiresApproval: v })} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
