'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import type { DocumentTemplate } from '@/src/components/admin/templates/types'

export default function TemplateEditPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()

  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const templateId = params.id as string

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  // Verificar permissões - SUPER_ADMIN, ADMIN e MANAGER podem editar templates
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Carregar template
  useEffect(() => {
    if (!canEdit) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para editar templates',
        variant: 'destructive'
      })
      router.push('/admin/templates-documentos')
      return
    }

    loadTemplate()
  }, [templateId, canEdit])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const result = await apiRequest(`/document-templates/${templateId}`)

      if (result.success) {
        setTemplate(result.data)
        setFormData({
          name: result.data.name,
          description: result.data.description || '',
          isActive: result.data.isActive,
        })
      } else {
        throw new Error(result.error || 'Erro ao carregar template')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar template',
        description: error.message,
        variant: 'destructive'
      })
      router.push('/admin/templates-documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!template) return

    // Validações
    if (!formData.name?.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do template',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const result = await apiRequest(`/document-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      if (result.success) {
        toast({
          title: 'Template atualizado',
          description: 'Template foi atualizado com sucesso'
        })
        router.push('/admin/templates-documentos')
      } else {
        throw new Error(result.error || 'Erro ao salvar template')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/templates-documentos')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Editar Template
            </h1>
            <p className="text-muted-foreground mt-1">
              {template.name}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Alerta informativo */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Modo Simplificado:</strong> Apenas informações básicas podem ser editadas aqui.
          Para alterações avançadas no HTML, CSS ou estrutura do template, entre em contato com o suporte técnico.
        </AlertDescription>
      </Alert>

      {/* Formulário */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="technical">Informações Técnicas</TabsTrigger>
        </TabsList>

        {/* Aba Informações Básicas */}
        <TabsContent value="basic" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">
                    Nome do Template *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Certidão de Protocolo Padrão"
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome que será exibido ao selecionar este template
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva para que serve este template e quando deve ser usado"
                    rows={4}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajude outros usuários a entenderem quando usar este template
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-base font-semibold">
                    Status
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm cursor-pointer">
                      Template ativo e disponível para uso
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Templates inativos não aparecem para seleção ao gerar documentos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Informações Técnicas (Read-only) */}
        <TabsContent value="technical" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Estas informações técnicas são somente leitura. Para alterá-las, entre em contato com o suporte.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Código do Template
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md font-mono text-sm">
                      {template.code}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Tipo de Documento
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md">
                      {template.documentType}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Formato de Saída
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md">
                      {template.outputFormat}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Tamanho da Página
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md">
                      {template.pageSize} - {template.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Versão
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md">
                      v{template.version}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Tipo de Template
                    </Label>
                    <div className="p-3 bg-gray-100 rounded-md">
                      {template.isGlobal ? 'Global (todos os serviços)' : 'Específico de serviço'}
                    </div>
                  </div>
                </div>

                {/* Variáveis */}
                {template.availableVariables && template.availableVariables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Variáveis Disponíveis
                    </Label>
                    <div className="p-4 bg-gray-50 rounded-md border">
                      <ScrollArea className="max-h-60">
                        <div className="space-y-2">
                          {template.availableVariables.map((variable, index) => (
                            <div key={index} className="text-sm">
                              <code className="bg-white px-2 py-1 rounded text-xs font-mono">
                                {`{{${variable.name}}}`}
                              </code>
                              <span className="ml-2 text-muted-foreground">
                                {variable.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Estatísticas de Uso */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Estatísticas de Uso
                  </Label>
                  <div className="p-3 bg-gray-100 rounded-md">
                    <p className="text-sm">
                      Este template foi usado para gerar{' '}
                      <strong>{template._count?.generatedDocuments || 0}</strong> documentos
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações do rodapé */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/templates-documentos')}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
