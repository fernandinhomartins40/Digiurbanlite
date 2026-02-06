'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, Info, Edit, FileText } from 'lucide-react'
import { DocumentTemplate } from './types'
import { useEffect, useState } from 'react'

interface TemplateViewModalProps {
  template: DocumentTemplate | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  canEdit?: boolean
}

export function TemplateViewModal({ template, open, onClose, onEdit, canEdit }: TemplateViewModalProps) {
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    if (template && open) {
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
  }, [template, open])

  if (!template) return null

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description || template.code}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Badge variant="outline">{getTypeLabel(template.documentType)}</Badge>
          <Badge variant="outline">{template.outputFormat}</Badge>
          <Badge variant={template.isActive ? 'default' : 'secondary'}>
            {template.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          {template.isGlobal && <Badge variant="outline">Global</Badge>}
          <Badge variant="outline">v{template.version}</Badge>
        </div>

        <Tabs defaultValue="preview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
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
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-280px)]">
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
            </ScrollArea>
          </TabsContent>

          {/* Aba de Variáveis */}
          <TabsContent value="variables" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Informações Básicas */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Informações do Template
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Nome:</span>
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tipo:</span>
                      <span className="font-medium">{getTypeLabel(template.documentType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Formato:</span>
                      <span className="font-medium">{template.outputFormat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Página:</span>
                      <span className="font-medium">{template.pageSize} - {template.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Versão:</span>
                      <span className="font-medium">v{template.version}</span>
                    </div>
                  </div>
                </div>

                {/* Variáveis Disponíveis */}
                {template.availableVariables && template.availableVariables.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Variáveis Disponíveis
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Este template utiliza as seguintes variáveis que são preenchidas automaticamente quando o documento é gerado:
                    </p>
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
                  </div>
                ) : (
                  <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Info className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">
                      Este template não possui variáveis documentadas
                    </p>
                    <p className="text-xs text-yellow-600 mt-2 px-4">
                      As variáveis serão substituídas automaticamente ao gerar o documento.
                      Entre em contato com o suporte técnico para adicionar documentação das variáveis.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {canEdit && onEdit && (
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Template
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
