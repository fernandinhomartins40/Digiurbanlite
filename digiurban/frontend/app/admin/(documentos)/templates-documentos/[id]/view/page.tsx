'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Eye,
  Info,
  Edit,
  FileText,
  Loader2
} from 'lucide-react'
import type { DocumentTemplate } from '@/src/components/admin/templates/types'

export default function TemplateViewPage() {
  const params = useParams()
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()

  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewHtml, setPreviewHtml] = useState('')

  const templateId = params.id as string

  // Carregar template
  useEffect(() => {
    loadTemplate()
  }, [templateId])

  // Atualizar preview quando template carregar
  useEffect(() => {
    if (template) {
      generatePreview()
    }
  }, [template])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const result = await apiRequest(`/document-templates/${templateId}`)

      if (result.success) {
        setTemplate(result.data)
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

  const generatePreview = () => {
    if (!template) return

    // Substituir variáveis Handlebars {{variavel}} por valores de exemplo
    let headerHtml = template.headerHtml || ''
    let bodyHtml = template.htmlTemplate || '<p>Template vazio</p>'
    let footerHtml = template.footerHtml || ''

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

    // Gerar preview HTML completo com variáveis substituídas
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    ${template.cssStyles || ''}
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    table td, table th {
      border: 1px solid #ddd;
      padding: 8px;
    }
    table th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
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

  // Verificar permissões - SUPER_ADMIN, ADMIN e MANAGER podem editar templates
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER'

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
              {template.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {template.description || template.code}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => router.push(`/admin/templates-documentos/${templateId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Template
          </Button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{getTypeLabel(template.documentType)}</Badge>
        <Badge variant="outline">{template.outputFormat}</Badge>
        <Badge variant={template.isActive ? 'default' : 'secondary'}>
          {template.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
        {template.isGlobal && <Badge variant="outline">Global</Badge>}
        <Badge variant="outline">v{template.version}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualização do Documento
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Informações e Variáveis
          </TabsTrigger>
        </TabsList>

        {/* Aba de Preview */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* Mensagem informativa */}
              {template.availableVariables && template.availableVariables.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Variáveis */}
        <TabsContent value="variables" className="mt-6">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informações do Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{template.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{getTypeLabel(template.documentType)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Formato:</span>
                    <p className="font-medium">{template.outputFormat}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Página:</span>
                    <p className="font-medium">{template.pageSize} - {template.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Versão:</span>
                    <p className="font-medium">v{template.version}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Documentos Gerados:</span>
                    <p className="font-medium">{template._count?.generatedDocuments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variáveis Disponíveis */}
            {template.availableVariables && template.availableVariables.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Variáveis Disponíveis</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Este template utiliza as seguintes variáveis que são preenchidas automaticamente quando o documento é gerado:
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {template.availableVariables.map((variable, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white hover:border-primary/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <code className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-mono flex-shrink-0">
                            {`{{${variable.name}}}`}
                          </code>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{variable.description}</p>
                            {variable.example && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-semibold">Exemplo:</span> {variable.example}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Info className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-medium">
                    Este template não possui variáveis documentadas
                  </p>
                  <p className="text-xs text-yellow-600 mt-2 px-4">
                    As variáveis serão substituídas automaticamente ao gerar o documento.
                    Entre em contato com o suporte técnico para adicionar documentação das variáveis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
