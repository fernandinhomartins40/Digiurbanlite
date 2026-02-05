'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Code, Eye, FileText, Info, Edit } from 'lucide-react'
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

  // Criar preview HTML com estilos
  const createPreview = () => {
    const styles = template.cssStyles || ''
    const header = template.headerHtml || ''
    const footer = template.footerHtml || ''
    const body = template.htmlTemplate || ''

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${styles}
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${header}
          ${body}
          ${footer}
        </body>
      </html>
    `
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualização
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              CSS
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Variáveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-300px)] border rounded-md bg-white">
              <div
                className="w-full min-h-[600px] p-4"
                dangerouslySetInnerHTML={{ __html: createPreview() }}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="html" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-300px)]">
              <div className="space-y-4">
                {template.headerHtml && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Cabeçalho</h4>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                      <code>{template.headerHtml}</code>
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Corpo Principal</h4>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                    <code>{template.htmlTemplate}</code>
                  </pre>
                </div>

                {template.footerHtml && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Rodapé</h4>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                      <code>{template.footerHtml}</code>
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="css" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-300px)]">
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                <code>{template.cssStyles || '/* Nenhum estilo CSS definido */'}</code>
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(90vh-300px)]">
              {template.availableVariables && template.availableVariables.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Variáveis disponíveis para uso no template. Use a sintaxe Handlebars: <code className="bg-muted px-2 py-1 rounded">{`{{variableName}}`}</code>
                  </p>
                  <div className="grid gap-3">
                    {template.availableVariables.map((variable, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                            {`{{${variable.name}}}`}
                          </code>
                        </div>
                        <p className="text-sm">{variable.description}</p>
                        {variable.example && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Exemplo:</span> {variable.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma variável documentada para este template</p>
                </div>
              )}
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
