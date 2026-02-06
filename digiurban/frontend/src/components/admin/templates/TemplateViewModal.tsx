'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, Info, Edit, FileText } from 'lucide-react'
import { DocumentTemplate } from './types'

interface TemplateViewModalProps {
  template: DocumentTemplate | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  canEdit?: boolean
}

export function TemplateViewModal({ template, open, onClose, onEdit, canEdit }: TemplateViewModalProps) {
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

  // Criar preview HTML com estilos - usando iframe com srcDoc
  const createPreviewHtml = () => {
    const styles = template.cssStyles || ''
    const header = template.headerHtml || ''
    const footer = template.footerHtml || ''
    const body = template.htmlTemplate || ''

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    ${styles}
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #333;
    }
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
    }
  </style>
</head>
<body>
  <div class="template-container">
    ${header}
    ${body}
    ${footer}
  </div>
</body>
</html>`
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

          {/* Aba de Preview - SIMPLIFICADA */}
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="bg-gray-100 p-4 rounded-md">
                <iframe
                  srcDoc={createPreviewHtml()}
                  className="w-full h-[800px] bg-white rounded shadow-sm border-2 border-gray-200"
                  title="Preview do Template"
                  sandbox="allow-same-origin"
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba de Variáveis - SIMPLIFICADA */}
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
                  <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg">
                    <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhuma variável documentada para este template</p>
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
