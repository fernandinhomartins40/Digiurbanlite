'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileCheck,
  FilePlus,
  Download,
  Globe,
  Building2,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import type { DocumentTemplate } from '@/src/components/admin/templates/types'

export default function TemplatesDocumentosPage() {
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PROTOCOL_CERTIFICATE' | 'COMPLETION_REPORT'>('all')
  // documentos do protocolo (HTML) ou do processo interno e licitações (texto)
  const [scope, setScope] = useState<'PROTOCOL' | 'INTERNAL_PROCESS'>('PROTOCOL')

  // Carregar templates e serviços
  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  useEffect(() => {
    loadServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const result = await apiRequest(`/document-templates?scope=${scope}`)

      if (result.success) {
        setTemplates(result.data || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar templates')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar templates',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const result = await apiRequest('/services')

      if (result.success) {
        setServices(result.data || [])
      }
    } catch (error: any) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Desativar
        const result = await apiRequest(`/document-templates/${templateId}`, {
          method: 'DELETE'
        })

        if (result.success) {
          toast({
            title: 'Template desativado',
            description: 'Template desativado com sucesso'
          })
          loadTemplates()
        }
      } else {
        const result = await apiRequest(`/document-templates/${templateId}`, {
          method: 'PUT',
          body: JSON.stringify({ isActive: true })
        })
        if (result.success) {
          toast({ title: 'Modelo ativado' })
          loadTemplates()
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewTemplate = (templateId: string) => {
    router.push(scope === 'INTERNAL_PROCESS' ? `/admin/templates-documentos/${templateId}/texto` : `/admin/templates-documentos/${templateId}/view`)
  }

  const handleEditTemplate = (templateId: string) => {
    router.push(scope === 'INTERNAL_PROCESS' ? `/admin/templates-documentos/${templateId}/texto` : `/admin/templates-documentos/${templateId}/edit`)
  }

  // modelo do catálogo editado pelo município: desfaz as mudanças
  const handleRestore = async (templateId: string) => {
    if (!window.confirm('Voltar este modelo ao padrão? As mudanças feitas pelo município nele se perdem.')) return
    try {
      const result = await apiRequest(`/document-templates/${templateId}/restore`, { method: 'POST' })
      if (result.success) {
        toast({ title: 'Modelo voltou ao padrão' })
        loadTemplates()
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'PROTOCOL_CERTIFICATE': 'Certidão de Protocolo',
      'COMPLETION_REPORT': 'Relatório de Conclusão',
      'RECEIPT': 'Recibo',
      'AUTHORIZATION': 'Autorização',
      'NOTIFICATION': 'Notificação',
      'CUSTOM': 'Personalizado'
    }
    return types[type] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PROTOCOL_CERTIFICATE': 'bg-blue-100 text-blue-700',
      'COMPLETION_REPORT': 'bg-green-100 text-green-700',
      'RECEIPT': 'bg-purple-100 text-purple-700',
      'AUTHORIZATION': 'bg-orange-100 text-orange-700',
      'NOTIFICATION': 'bg-yellow-100 text-yellow-700',
      'CUSTOM': 'bg-gray-100 text-gray-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.documentType === filter)

  // Administrador do município cria e edita os modelos
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const canCreate = canEdit

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates de Documentos</h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar templates para geração de documentos PDF
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Templates de Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar templates para geração de documentos PDF
          </p>
        </div>
        {canCreate && scope === 'PROTOCOL' && (
          <Button onClick={() => router.push('/admin/templates-documentos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Onde o modelo é usado */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: 'PROTOCOL' as const, label: 'Documentos do protocolo' },
          { id: 'INTERNAL_PROCESS' as const, label: 'Processo interno e licitações' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setScope(item.id); setFilter('all') }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm ${scope === item.id ? 'bg-white font-medium shadow-sm' : 'text-gray-600'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Avisos e Informações */}
      {!canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Só o administrador do município cria e edita modelos. Você pode visualizar os modelos existentes.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta informativo sobre funcionamento dos templates */}
      {templates.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Os templates utilizam variáveis dinâmicas (ex: <code className="bg-blue-100 px-1 rounded">{"{{protocolNumber}}"}</code>) que são automaticamente substituídas pelos dados reais ao gerar documentos.
            Use o botão "Visualizar" para ver o preview com dados de exemplo.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Globais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templates.filter(t => t.isGlobal).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documentos Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {templates.reduce((acc, t) => acc + (t._count?.generatedDocuments || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {scope === 'PROTOCOL' && <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({templates.length})
        </Button>
        <Button
          variant={filter === 'PROTOCOL_CERTIFICATE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PROTOCOL_CERTIFICATE')}
        >
          Certidões ({templates.filter(t => t.documentType === 'PROTOCOL_CERTIFICATE').length})
        </Button>
        <Button
          variant={filter === 'COMPLETION_REPORT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('COMPLETION_REPORT')}
        >
          Relatórios ({templates.filter(t => t.documentType === 'COMPLETION_REPORT').length})
        </Button>
      </div>}

      {/* Lista de Templates */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {filter === 'all' ? (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum template cadastrado
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Os templates de documentos são necessários para gerar certidões, relatórios e outros documentos oficiais.
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Os modelos prontos do catálogo chegam sozinhos em alguns minutos. Se não aparecerem, peça ao suporte para atualizar o catálogo do município.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Nenhum template encontrado com este filtro.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || template.code}
                    </CardDescription>
                  </div>
                  {template.isGlobal && (
                    <span title="Template Global">
                      <Globe className="h-4 w-4 text-blue-500" />
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getTypeBadgeColor(template.documentType)}>
                    {getTypeLabel(template.documentType)}
                  </Badge>
                  <Badge variant="outline">
                    {template.outputFormat}
                  </Badge>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    v{template.version}
                  </Badge>
                  {(template as any).fromCatalog && (
                    <Badge variant="outline" className="text-xs">
                      {(template as any).edited ? 'Editado pelo município' : 'Modelo padrão'}
                    </Badge>
                  )}
                </div>

                {/* Estatísticas e Vinculação */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Documentos gerados: <strong>{template._count?.generatedDocuments || 0}</strong>
                  </p>
                  {!template.isGlobal && template.serviceIds && template.serviceIds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Serviços vinculados:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.serviceIds.map(serviceId => {
                          const service = services.find(s => s.id === serviceId)
                          return service ? (
                            <Badge key={serviceId} variant="outline" className="text-xs">
                              {service.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTemplate(template.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(template.id, template.isActive)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {template.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                      {(template as any).fromCatalog && (template as any).edited && (
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(template.id)}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Padrão
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
