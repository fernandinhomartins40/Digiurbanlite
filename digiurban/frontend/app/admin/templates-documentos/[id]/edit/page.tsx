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
  Loader2,
  FileUp,
  FileDown,
  Eye,
  Code
} from 'lucide-react'
import type { DocumentTemplate } from '@/src/components/admin/templates/types'
import { WysiwygTemplateEditor } from '@/src/components/admin/templates/WysiwygTemplateEditor'

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
    htmlTemplate: '',
    headerHtml: '',
    footerHtml: '',
    cssStyles: '',
    isActive: true,
  })

  const [previewHtml, setPreviewHtml] = useState('')

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

  // Atualizar preview quando o conteúdo mudar
  useEffect(() => {
    if (template) {
      generatePreview()
    }
  }, [formData, template])

  const generatePreview = () => {
    if (!template) return

    // Substituir variáveis Handlebars por valores de exemplo
    let headerHtml = formData.headerHtml || ''
    let bodyHtml = formData.htmlTemplate || '<p>Comece a editar o template...</p>'
    let footerHtml = formData.footerHtml || ''

    // Se há variáveis disponíveis, substituir no HTML
    if (template.availableVariables && Array.isArray(template.availableVariables)) {
      template.availableVariables.forEach((variable: any) => {
        const regex = new RegExp(`{{${variable.name}}}`, 'g')
        const exampleValue = variable.example || `[${variable.name}]`

        headerHtml = headerHtml.replace(regex, exampleValue)
        bodyHtml = bodyHtml.replace(regex, exampleValue)
        footerHtml = footerHtml.replace(regex, exampleValue)
      })
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    ${formData.cssStyles || ''}
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
    }
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
    }
    img { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    table td, table th { border: 1px solid #ddd; padding: 8px; }
    table th { background-color: #f4f4f4; font-weight: bold; }
  </style>
</head>
<body>
  <div class="template-container">
    ${headerHtml}
    ${bodyHtml}
    ${footerHtml}
  </div>
</body>
</html>`
    setPreviewHtml(html)
  }

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const result = await apiRequest(`/document-templates/${templateId}`)

      if (result.success) {
        setTemplate(result.data)
        setFormData({
          name: result.data.name,
          description: result.data.description || '',
          htmlTemplate: result.data.htmlTemplate || '',
          headerHtml: result.data.headerHtml || '',
          footerHtml: result.data.footerHtml || '',
          cssStyles: result.data.cssStyles || '',
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

      {/* Formulário */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6 max-w-4xl">
          <TabsTrigger value="basic">Informações</TabsTrigger>
          <TabsTrigger value="header" className="flex items-center gap-1">
            <FileUp className="h-3 w-3" />
            Cabeçalho
          </TabsTrigger>
          <TabsTrigger value="body" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Corpo
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-1">
            <FileDown className="h-3 w-3" />
            Rodapé
          </TabsTrigger>
          <TabsTrigger value="css" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            CSS
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Preview
          </TabsTrigger>
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

                {/* Informações Técnicas */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
                  <h4 className="font-semibold text-sm text-gray-700">Informações Técnicas</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Código:</span>
                      <p className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">{template.code}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium mt-1">{template.documentType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Formato:</span>
                      <p className="font-medium mt-1">{template.outputFormat}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Versão:</span>
                      <p className="font-medium mt-1">v{template.version}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Cabeçalho */}
        <TabsContent value="header" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> O cabeçalho aparece no topo de todas as páginas do documento.
                    Use para inserir logotipo, título do documento, etc.
                  </p>
                </div>
                <WysiwygTemplateEditor
                  content={formData.headerHtml || ''}
                  onChange={(html) => setFormData({ ...formData, headerHtml: html })}
                  placeholder="Digite o cabeçalho do documento..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Corpo Principal */}
        <TabsContent value="body" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> Este é o conteúdo principal do documento.
                    Você pode usar variáveis como <code className="bg-white px-2 py-0.5 rounded">{`{{protocolNumber}}`}</code> que serão substituídas automaticamente.
                  </p>
                </div>
                <WysiwygTemplateEditor
                  content={formData.htmlTemplate || ''}
                  onChange={(html) => setFormData({ ...formData, htmlTemplate: html })}
                  placeholder="Digite o conteúdo principal do documento..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Rodapé */}
        <TabsContent value="footer" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> O rodapé aparece no final de todas as páginas.
                    Use para informações de contato, números de página, etc.
                  </p>
                </div>
                <WysiwygTemplateEditor
                  content={formData.footerHtml || ''}
                  onChange={(html) => setFormData({ ...formData, footerHtml: html })}
                  placeholder="Digite o rodapé do documento..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba CSS */}
        <TabsContent value="css" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> Estilos CSS personalizados para o template.
                    Use classes e seletores para estilizar o documento.
                  </p>
                </div>
                <Textarea
                  value={formData.cssStyles || ''}
                  onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                  placeholder="/* Adicione seus estilos CSS aqui */&#10;.titulo {&#10;  color: #333;&#10;  font-size: 24px;&#10;}"
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Preview */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Mensagem informativa */}
                {template.availableVariables && template.availableVariables.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium">Preview com dados de exemplo</p>
                        <p className="text-blue-600 mt-1">
                          As variáveis <code className="bg-blue-100 px-1 rounded">{"{{variavel}}"}</code> foram substituídas pelos valores de exemplo.
                          No documento real, serão preenchidas com os dados do protocolo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-100 p-4 rounded-md">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[800px] bg-white rounded shadow-sm border-2 border-gray-200"
                    title="Preview do Template"
                    sandbox="allow-same-origin allow-scripts"
                  />
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
