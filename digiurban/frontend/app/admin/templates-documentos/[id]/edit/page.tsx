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

  // Form state - Editor unificado
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullTemplate: '', // Template completo (header + body + footer combinados)
    isActive: true,
  })

  const [previewHtml, setPreviewHtml] = useState('')
  const [editMode, setEditMode] = useState<'visual' | 'preview'>('visual')

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
    let contentHtml = formData.fullTemplate || '<p>Comece a editar o template...</p>'

    // Se há variáveis disponíveis, substituir no HTML
    if (template.availableVariables && Array.isArray(template.availableVariables)) {
      template.availableVariables.forEach((variable: any) => {
        const regex = new RegExp(`{{${variable.name}}}`, 'g')
        const exampleValue = variable.example || `[${variable.name}]`
        contentHtml = contentHtml.replace(regex, exampleValue)
      })
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    ${template.cssStyles || ''}
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
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    img { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    table td, table th { border: 1px solid #ddd; padding: 8px; }
    table th { background-color: #f4f4f4; font-weight: bold; }
  </style>
</head>
<body>
  <div class="template-container">
    ${contentHtml}
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

        // Combinar header + body + footer em um único template
        const combinedTemplate = `
${result.data.headerHtml || ''}

${result.data.htmlTemplate || ''}

${result.data.footerHtml || ''}`

        setFormData({
          name: result.data.name,
          description: result.data.description || '',
          fullTemplate: combinedTemplate.trim(),
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
      // Enviar o template completo como htmlTemplate (backend espera essa estrutura)
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        htmlTemplate: formData.fullTemplate,
        headerHtml: '', // Deixar vazio pois estamos usando template unificado
        footerHtml: '', // Deixar vazio pois estamos usando template unificado
        isActive: formData.isActive,
      }

      const result = await apiRequest(`/document-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(dataToSave)
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

      {/* Informações Básicas */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Certidão de Protocolo Padrão"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm cursor-pointer">
                  Template ativo
                </label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva para que serve este template"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modo de Visualização */}
      <div className="flex gap-2">
        <Button
          variant={editMode === 'visual' ? 'default' : 'outline'}
          onClick={() => setEditMode('visual')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Editar Template
        </Button>
        <Button
          variant={editMode === 'preview' ? 'default' : 'outline'}
          onClick={() => setEditMode('preview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Resultado
        </Button>
      </div>

      {/* Editor ou Preview */}
      {editMode === 'visual' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>💡 Dica:</strong> Edite o documento visualmente como se fosse o Word.
                  Use variáveis como <code className="bg-white px-2 py-0.5 rounded">{`{{protocolNumber}}`}</code> que serão substituídas automaticamente pelos dados reais.
                </p>
              </div>
              <WysiwygTemplateEditor
                content={formData.fullTemplate}
                onChange={(html) => setFormData({ ...formData, fullTemplate: html })}
                placeholder="Digite o conteúdo do documento aqui... Use a barra de ferramentas acima para formatar."
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {template.availableVariables && template.availableVariables.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium">Preview com dados de exemplo</p>
                      <p className="text-blue-600 mt-1">
                        As variáveis foram substituídas por valores de exemplo. No documento real, serão preenchidas com dados do protocolo.
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
      )}

      {/* Variáveis Disponíveis */}
      {template.availableVariables && template.availableVariables.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">📋 Variáveis Disponíveis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copie e cole estas variáveis no template. Elas serão substituídas automaticamente ao gerar o documento:
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {template.availableVariables.map((variable, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded border">
                  <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono flex-shrink-0">
                    {`{{${variable.name}}}`}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{variable.description}</p>
                    {variable.example && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ex: {variable.example}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remover todas as abas antigas */}
      <div className="hidden">
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

        </Tabs>
      </div>

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
