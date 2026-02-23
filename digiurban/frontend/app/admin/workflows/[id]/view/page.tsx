'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Edit, Trash2, GitBranch, Clock, Layers, FileText,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, Shield,
  Eye, Send, MessageSquare, MapPin, Database, ListChecks,
  RefreshCw, Copy
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TAB_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  'resumo': { label: 'Resumo', icon: Eye, color: 'bg-slate-100 text-slate-700' },
  'documentos': { label: 'Documentos', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  'dados': { label: 'Dados', icon: Database, color: 'bg-purple-100 text-purple-700' },
  'pendencias': { label: 'Pendências', icon: AlertCircle, color: 'bg-orange-100 text-orange-700' },
  'comunicacao': { label: 'Comunicação', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  'generated': { label: 'Gerados', icon: FileText, color: 'bg-cyan-100 text-cyan-700' },
  'document-generation': { label: 'Gerar Docs', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
  'documentos-gerados': { label: 'Docs Gerados', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
  'send': { label: 'Enviar', icon: Send, color: 'bg-teal-100 text-teal-700' },
  'enviar': { label: 'Enviar', icon: Send, color: 'bg-teal-100 text-teal-700' },
  'location': { label: 'Localização', icon: MapPin, color: 'bg-red-100 text-red-700' },
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'APPROVE': { label: 'Aprovar', color: 'bg-green-100 text-green-700 border-green-300' },
  'REJECT': { label: 'Rejeitar', color: 'bg-red-100 text-red-700 border-red-300' },
  'REQUEST_INFO': { label: 'Solicitar Info', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  'CREATE_PENDING': { label: 'Criar Pendência', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  'SKIP': { label: 'Pular', color: 'bg-gray-100 text-gray-700 border-gray-300' },
}

const STAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  'RECEPTION': { label: 'Recepção', color: 'bg-blue-500 text-white' },
  'DOCUMENT_GENERATION': { label: 'Geração de Documentos', color: 'bg-indigo-500 text-white' },
  'CONCLUSION': { label: 'Conclusão', color: 'bg-green-500 text-white' },
}

export default function WorkflowViewPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkflow = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/service-workflows/${params.id}`)
      if (response.success) setWorkflow(response.data)
    } catch (error) {
      toast({ title: 'Erro ao carregar workflow', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [apiRequest, params.id, toast])

  useEffect(() => { loadWorkflow() }, [loadWorkflow])

  const handleDelete = async () => {
    if (!workflow) return
    if (!confirm(`Deletar o workflow "${workflow.name}"?`)) return
    try {
      await apiRequest(`/service-workflows/service/${workflow.serviceId}`, { method: 'DELETE' })
      toast({ title: 'Workflow deletado' })
      router.push('/admin/workflows')
    } catch (error) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    }
  }

  const handleDuplicate = () => {
    if (!workflow) return
    const data = encodeURIComponent(JSON.stringify({
      name: `${workflow.name} (Cópia)`,
      description: workflow.description,
      defaultSLA: workflow.defaultSLA,
      stages: workflow.stages,
    }))
    router.push(`/admin/workflows/new?duplicate=${data}`)
  }

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

  const stages = Array.isArray(workflow.stages) ? workflow.stages : []
  const totalStageSLA = stages.reduce((sum: number, s: any) => sum + (s.slaDays || 0), 0)

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/admin/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <div className="flex items-center gap-3 mb-1">
            <GitBranch className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            {!workflow.isActive && <Badge variant="destructive">Inativo</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{workflow.description || 'Sem descrição'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}><Copy className="h-4 w-4 mr-1" />Duplicar</Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/workflows/${params.id}/edit`)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" />Deletar</Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Serviço</p>
            <p className="text-sm font-semibold">{workflow.service?.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Departamento</p>
            <p className="text-sm font-semibold">{workflow.service?.department?.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Etapas</p>
            <p className="text-2xl font-bold">{stages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">SLA Total</p>
            <p className="text-2xl font-bold">{workflow.defaultSLA || totalStageSLA}d</p>
          </CardContent>
        </Card>
      </div>

      {/* Stages Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5" />Etapas do Workflow</h2>

        <div className="space-y-0">
          {stages.map((stage: any, index: number) => {
            const stageTypeInfo = stage.stageType ? STAGE_TYPE_LABELS[stage.stageType] : null
            const tabs = stage.availableTabs || []
            const actions = stage.allowedActions || []
            const reqDocs = stage.requiredDocumentTypes || []
            const reqFields = stage.requiredFormFields || stage.requiredFormFieldIds || []

            return (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < stages.length - 1 && (
                  <div className="absolute left-6 top-[60px] bottom-0 w-0.5 bg-border z-0" />
                )}

                <Card className="relative z-10 mb-3">
                  <CardContent className="p-4">
                    {/* Stage Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {stage.order || index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{stage.name}</h3>
                          {stage.description && <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-13 sm:ml-0">
                        {stageTypeInfo && <Badge className={stageTypeInfo.color}>{stageTypeInfo.label}</Badge>}
                        {stage.slaDays && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{stage.slaDays}d</Badge>}
                        {stage.canSkip && <Badge variant="outline" className="text-xs bg-yellow-50">Pulável</Badge>}
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {/* Stage Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Tabs */}
                      {tabs.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Eye className="h-3 w-3" />Abas visíveis</p>
                          <div className="flex flex-wrap gap-1">
                            {tabs.map((tab: string) => {
                              const info = TAB_LABELS[tab] || { label: tab, color: 'bg-gray-100 text-gray-700' }
                              const isPrimary = tab === stage.primaryTab
                              return (
                                <span key={tab} className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${info.color} ${isPrimary ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                                  {info.label}{isPrimary && ' *'}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Shield className="h-3 w-3" />Ações permitidas</p>
                          <div className="flex flex-wrap gap-1">
                            {actions.map((action: string) => {
                              const info = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-700' }
                              const customLabel = stage.actionLabels?.[action]
                              return (
                                <span key={action} className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${info.color}`}>
                                  {customLabel || info.label}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Required Docs */}
                      {reqDocs.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><FileText className="h-3 w-3" />Documentos obrigatórios</p>
                          <div className="flex flex-wrap gap-1">
                            {reqDocs.map((doc: string) => (
                              <Badge key={doc} variant="outline" className="text-xs">{doc}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Required Fields */}
                      {reqFields.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><ListChecks className="h-3 w-3" />Campos obrigatórios</p>
                          <div className="flex flex-wrap gap-1">
                            {reqFields.map((field: string) => (
                              <Badge key={field} variant="outline" className="text-xs font-mono">{field}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document Templates */}
                      {stage.documentTemplateIds?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><FileText className="h-3 w-3" />Templates de documento</p>
                          <div className="flex flex-wrap gap-1">
                            {stage.documentTemplateIds.map((id: string) => (
                              <Badge key={id} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">{id.substring(0, 8)}...</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Role & Department */}
                      {(stage.role || stage.department) && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Shield className="h-3 w-3" />Responsabilidade</p>
                          <div className="flex flex-wrap gap-1">
                            {stage.role && <Badge variant="secondary" className="text-xs">Role: {stage.role}</Badge>}
                            {stage.department && <Badge variant="secondary" className="text-xs">Dept: {stage.department}</Badge>}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
