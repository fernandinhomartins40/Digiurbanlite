'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/../../../components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from './RichTextEditor'
import { Code, Eye, FileText, Info, Save, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DocumentTemplate {
  id: string
  name: string
  code: string
  description?: string
  documentType: string
  outputFormat: string
  htmlTemplate: string
  headerHtml?: string
  footerHtml?: string
  cssStyles?: string
  pageSize: string
  orientation: string
  availableVariables?: Array<{
    name: string
    description: string
    example: string
  }>
  isGlobal: boolean
  isActive: boolean
  version: number
}

interface TemplateEditModalProps {
  template: DocumentTemplate | null
  open: boolean
  onClose: () => void
  onSave: (template: Partial<DocumentTemplate>) => Promise<void>
}

export function TemplateEditModal({ template, open, onClose, onSave }: TemplateEditModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<'wysiwyg' | 'code'>('wysiwyg')

  // Form state
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    documentType: 'CUSTOM',
    outputFormat: 'PDF',
    htmlTemplate: '',
    headerHtml: '',
    footerHtml: '',
    cssStyles: '',
    pageSize: 'A4',
    orientation: 'portrait',
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        documentType: template.documentType,
        outputFormat: template.outputFormat,
        htmlTemplate: template.htmlTemplate,
        headerHtml: template.headerHtml || '',
        footerHtml: template.footerHtml || '',
        cssStyles: template.cssStyles || '',
        pageSize: template.pageSize,
        orientation: template.orientation,
      })
    }
  }, [template])

  const handleSave = async () => {
    if (!template) return

    setSaving(true)
    try {
      await onSave(formData)
      toast({
        title: 'Template atualizado',
        description: 'Template foi atualizado com sucesso'
      })
      onClose()
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

  const createPreview = () => {
    const styles = formData.cssStyles || ''
    const header = formData.headerHtml || ''
    const footer = formData.footerHtml || ''
    const body = formData.htmlTemplate || ''

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

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Template: {template.name}
          </DialogTitle>
          <DialogDescription>
            Edite o conteúdo e configurações do template de documento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="header" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Cabeçalho
            </TabsTrigger>
            <TabsTrigger value="body" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Corpo
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Rodapé
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualização
            </TabsTrigger>
          </TabsList>

          {/* Aba Básico */}
          <TabsContent value="basic" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-350px)]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Certidão de Protocolo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROTOCOL_CERTIFICATE">Certidão de Protocolo</SelectItem>
                        <SelectItem value="COMPLETION_REPORT">Relatório de Conclusão</SelectItem>
                        <SelectItem value="RECEIPT">Recibo</SelectItem>
                        <SelectItem value="AUTHORIZATION">Autorização</SelectItem>
                        <SelectItem value="NOTIFICATION">Notificação</SelectItem>
                        <SelectItem value="CUSTOM">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do template"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outputFormat">Formato</Label>
                    <Select
                      value={formData.outputFormat}
                      onValueChange={(value) => setFormData({ ...formData, outputFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="DOCX">DOCX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pageSize">Tamanho da Página</Label>
                    <Select
                      value={formData.pageSize}
                      onValueChange={(value) => setFormData({ ...formData, pageSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientação</Label>
                    <Select
                      value={formData.orientation}
                      onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato</SelectItem>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cssStyles">Estilos CSS</Label>
                  <Textarea
                    id="cssStyles"
                    value={formData.cssStyles}
                    onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                    placeholder="@page { size: A4; margin: 0; }"
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>

                {template.availableVariables && template.availableVariables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Variáveis Disponíveis</Label>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-md">
                      {template.availableVariables.map((variable, index) => (
                        <code key={index} className="text-xs bg-background px-2 py-1 rounded">
                          {`{{${variable.name}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Cabeçalho */}
          <TabsContent value="header" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-350px)]">
              <div className="space-y-4 pr-4">
                <div className="flex justify-between items-center mb-4">
                  <Label>Cabeçalho do Documento</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editMode === 'wysiwyg' ? 'default' : 'outline'}
                      onClick={() => setEditMode('wysiwyg')}
                    >
                      Visual
                    </Button>
                    <Button
                      size="sm"
                      variant={editMode === 'code' ? 'default' : 'outline'}
                      onClick={() => setEditMode('code')}
                    >
                      Código
                    </Button>
                  </div>
                </div>

                {editMode === 'wysiwyg' ? (
                  <RichTextEditor
                    content={formData.headerHtml || ''}
                    onChange={(html) => setFormData({ ...formData, headerHtml: html })}
                    placeholder="Digite o cabeçalho do documento..."
                  />
                ) : (
                  <Textarea
                    value={formData.headerHtml}
                    onChange={(e) => setFormData({ ...formData, headerHtml: e.target.value })}
                    placeholder="<div>HTML do cabeçalho...</div>"
                    rows={20}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Corpo */}
          <TabsContent value="body" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-350px)]">
              <div className="space-y-4 pr-4">
                <div className="flex justify-between items-center mb-4">
                  <Label>Corpo Principal do Documento</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editMode === 'wysiwyg' ? 'default' : 'outline'}
                      onClick={() => setEditMode('wysiwyg')}
                    >
                      Visual
                    </Button>
                    <Button
                      size="sm"
                      variant={editMode === 'code' ? 'default' : 'outline'}
                      onClick={() => setEditMode('code')}
                    >
                      Código
                    </Button>
                  </div>
                </div>

                {editMode === 'wysiwyg' ? (
                  <RichTextEditor
                    content={formData.htmlTemplate || ''}
                    onChange={(html) => setFormData({ ...formData, htmlTemplate: html })}
                    placeholder="Digite o conteúdo do documento..."
                  />
                ) : (
                  <Textarea
                    value={formData.htmlTemplate}
                    onChange={(e) => setFormData({ ...formData, htmlTemplate: e.target.value })}
                    placeholder="<div>HTML do corpo...</div>"
                    rows={20}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Rodapé */}
          <TabsContent value="footer" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-350px)]">
              <div className="space-y-4 pr-4">
                <div className="flex justify-between items-center mb-4">
                  <Label>Rodapé do Documento</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editMode === 'wysiwyg' ? 'default' : 'outline'}
                      onClick={() => setEditMode('wysiwyg')}
                    >
                      Visual
                    </Button>
                    <Button
                      size="sm"
                      variant={editMode === 'code' ? 'default' : 'outline'}
                      onClick={() => setEditMode('code')}
                    >
                      Código
                    </Button>
                  </div>
                </div>

                {editMode === 'wysiwyg' ? (
                  <RichTextEditor
                    content={formData.footerHtml || ''}
                    onChange={(html) => setFormData({ ...formData, footerHtml: html })}
                    placeholder="Digite o rodapé do documento..."
                  />
                ) : (
                  <Textarea
                    value={formData.footerHtml}
                    onChange={(e) => setFormData({ ...formData, footerHtml: e.target.value })}
                    placeholder="<div>HTML do rodapé...</div>"
                    rows={20}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Visualização */}
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-350px)] border rounded-md bg-white">
              <iframe
                srcDoc={createPreview()}
                className="w-full h-full min-h-[700px] border-0"
                title="Template Preview"
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
