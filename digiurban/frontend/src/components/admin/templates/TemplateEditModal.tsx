'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Save, FileText, FileUp, FileDown, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentTemplate } from './types'
import { WysiwygTemplateEditor } from './WysiwygTemplateEditor'

interface Service {
  id: string
  name: string
}

interface TemplateEditModalProps {
  template: DocumentTemplate | null
  open: boolean
  onClose: () => void
  onSave: (template: Partial<DocumentTemplate>) => Promise<void>
  services?: Service[]
}

export function TemplateEditModal({ template, open, onClose, onSave, services = [] }: TemplateEditModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  // Form state
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    htmlTemplate: '',
    headerHtml: '',
    footerHtml: '',
    cssStyles: '',
    isActive: true,
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        htmlTemplate: template.htmlTemplate || '',
        headerHtml: template.headerHtml || '',
        footerHtml: template.footerHtml || '',
        cssStyles: template.cssStyles || '',
        isActive: template.isActive,
      })
    }
  }, [template])

  // Atualizar preview quando o conteúdo mudar
  useEffect(() => {
    if (open) {
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
    ${formData.headerHtml || ''}
    ${formData.htmlTemplate || '<p>Comece a editar o template...</p>'}
    ${formData.footerHtml || ''}
  </div>
</body>
</html>`
      setPreviewHtml(html)
    }
  }, [formData, open])

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

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Template: {template.name}</DialogTitle>
          <DialogDescription>
            Edite o conteúdo do template usando o editor visual abaixo. Formate texto, insira imagens, tabelas e mais.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informações</TabsTrigger>
            <TabsTrigger value="header" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              Cabeçalho
            </TabsTrigger>
            <TabsTrigger value="body" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Corpo Principal
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Rodapé
            </TabsTrigger>
          </TabsList>

          {/* Aba Informações Básicas */}
          <TabsContent value="basic" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-300px)]">
              <div className="space-y-4 pr-4">
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
                    rows={3}
                    className="text-base"
                  />
                </div>

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

                {/* Preview inline */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visualização Rápida
                  </Label>
                  <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[400px] bg-white rounded shadow-sm"
                      title="Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Cabeçalho */}
          <TabsContent value="header" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-300px)]">
              <div className="space-y-4 pr-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
            </ScrollArea>
          </TabsContent>

          {/* Aba Corpo Principal */}
          <TabsContent value="body" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-300px)]">
              <div className="space-y-4 pr-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
            </ScrollArea>
          </TabsContent>

          {/* Aba Rodapé */}
          <TabsContent value="footer" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(95vh-300px)]">
              <div className="space-y-4 pr-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
