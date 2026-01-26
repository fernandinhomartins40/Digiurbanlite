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
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TemplateViewModal } from '@/src/components/admin/templates/TemplateViewModal'
import { TemplateEditModal } from '@/src/components/admin/templates/TemplateEditModal'
import type { DocumentTemplate } from '@/src/components/admin/templates/types'

export default function TemplatesDocumentosPage() {
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PROTOCOL_CERTIFICATE' | 'COMPLETION_REPORT'>('all')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)

  // Carregar templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/document-templates')

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
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'Ativar template será implementado em breve',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setViewModalOpen(true)
  }

  const handleEditTemplate = async (template: DocumentTemplate) => {
    // Carregar template completo
    try {
      const result = await apiRequest(`/document-templates/${template.id}`)
      if (result.success) {
        setSelectedTemplate(result.data)
        setEditModalOpen(true)
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar template',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleSaveTemplate = async (updatedTemplate: Partial<DocumentTemplate>) => {
    if (!selectedTemplate) return

    try {
      const result = await apiRequest(`/document-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTemplate)
      })

      if (result.success) {
        await loadTemplates()
        setEditModalOpen(false)
        setSelectedTemplate(null)
      } else {
        throw new Error(result.error || 'Erro ao salvar template')
      }
    } catch (error: any) {
      throw error
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

  // Verificar se é SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

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
        {isSuperAdmin && (
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Aviso para não SUPER_ADMIN */}
      {!isSuperAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Apenas SUPER_ADMIN pode criar/editar templates. Você pode visualizar os templates existentes.
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
      <div className="flex gap-2">
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
      </div>

      {/* Lista de Templates */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'Nenhum template cadastrado. Execute o seed de templates primeiro.'
                : 'Nenhum template encontrado com este filtro.'}
            </p>
            {filter === 'all' && isSuperAdmin && (
              <Button className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
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
                </div>

                {/* Estatísticas */}
                <div className="text-sm text-muted-foreground">
                  <p>
                    Documentos gerados: <strong>{template._count?.generatedDocuments || 0}</strong>
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  {isSuperAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {template.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(template.id, template.isActive)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Desativar
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

      {/* Modais */}
      <TemplateViewModal
        template={selectedTemplate}
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedTemplate(null)
        }}
      />

      <TemplateEditModal
        template={selectedTemplate}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedTemplate(null)
        }}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
