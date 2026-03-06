'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch, Plus, ArrowLeft, Edit, Trash2, CheckCircle2,
  XCircle, Layers, Clock, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { flowClient, WorkflowTemplate } from '@/lib/flow-client'

export default function FluxosPage() {
  const { user } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await flowClient.listWorkflowTemplates()
      setTemplates(data)
    } catch {
      toast({ title: 'Erro ao carregar fluxos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleDelete = async (t: WorkflowTemplate) => {
    if (!confirm(`Desativar o fluxo "${t.name}"? Processos em andamento não serão afetados.`)) return
    setDeletingId(t.id)
    try {
      await flowClient.deleteWorkflowTemplate(t.id)
      toast({ title: `Fluxo "${t.name}" desativado` })
      load()
    } catch (error) {
      toast({ title: 'Erro ao desativar', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleReactivate = async (t: WorkflowTemplate) => {
    try {
      await flowClient.updateWorkflowTemplate(t.id, { isActive: true })
      toast({ title: `Fluxo "${t.name}" reativado` })
      load()
    } catch {
      toast({ title: 'Erro ao reativar', variant: 'destructive' })
    }
  }

  const active = templates.filter(t => t.isActive)
  const inactive = templates.filter(t => !t.isActive)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/processos-internos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Processos Internos
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-600" />
            Fluxos de Tramitação
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Defina as etapas automáticas de tramitação para cada tipo de processo
          </p>
        </div>
        <Button onClick={() => router.push('/admin/processos-internos/fluxos/novo')}>
          <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{templates.length}</p>
            <p className="text-sm text-gray-500">Total de fluxos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{active.length}</p>
            <p className="text-sm text-gray-500">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gray-400">{inactive.length}</p>
            <p className="text-sm text-gray-500">Inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Templates Ativos */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : active.length === 0 && inactive.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum fluxo criado ainda</p>
            <p className="text-sm text-gray-400 mt-1">Crie seu primeiro fluxo de tramitação</p>
            <Button className="mt-4" onClick={() => router.push('/admin/processos-internos/fluxos/novo')}>
              <Plus className="w-4 h-4 mr-2" /> Criar Fluxo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ativos</h2>
              {active.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => router.push(`/admin/processos-internos/fluxos/${t.id}`)}
                  onDelete={() => handleDelete(t)}
                  deleting={deletingId === t.id}
                />
              ))}
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Inativos</h2>
              {inactive.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => router.push(`/admin/processos-internos/fluxos/${t.id}`)}
                  onReactivate={() => handleReactivate(t)}
                  deleting={deletingId === t.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explicação */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800">Como funcionam os Fluxos de Tramitação?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-1">
          <p>• Cada fluxo define uma sequência de <strong>etapas</strong> com unidade destino, documento exigido e SLA</p>
          <p>• Vincule um fluxo a um <strong>Tipo de Processo</strong> (ex: Memorandos seguem o Fluxo Padrão)</p>
          <p>• Ao despachar, escolha entre <strong>Destinatário livre</strong> ou <strong>Seguir o fluxo</strong></p>
          <p>• O fluxo orienta automaticamente para a próxima unidade e registra o progresso</p>
        </CardContent>
      </Card>
    </div>
  )
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onReactivate,
  deleting,
}: {
  template: WorkflowTemplate
  onEdit: () => void
  onDelete?: () => void
  onReactivate?: () => void
  deleting: boolean
}) {
  const steps = template.steps || []
  const totalSla = steps.reduce((acc, s) => acc + (s.slaHours || 0), 0)

  return (
    <Card className={`transition-all hover:shadow-md ${!template.isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${template.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <GitBranch className={`w-5 h-5 ${template.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                {template.isActive ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" />Ativo</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" />Inativo</>
                )}
              </Badge>
              <Badge variant="outline" className="text-xs">v{template.version}</Badge>
            </div>

            {template.description && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{template.description}</p>
            )}

            {/* Etapas em linha */}
            {steps.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {step.name}
                      {step.organizationalUnitName && (
                        <span className="text-gray-400"> · {step.organizationalUnitName}</span>
                      )}
                    </span>
                    {idx < steps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Metadados */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> {steps.length} etapa{steps.length !== 1 ? 's' : ''}
              </span>
              {totalSla > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> SLA total: {totalSla}h
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
            {template.isActive && onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:text-red-700 hover:border-red-300"
                onClick={onDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {!template.isActive && onReactivate && (
              <Button size="sm" variant="outline" onClick={onReactivate}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Reativar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
