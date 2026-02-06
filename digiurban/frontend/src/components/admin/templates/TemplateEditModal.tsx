'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, Globe, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentTemplate } from './types'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

  // Form state - APENAS campos básicos para usuários leigos
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        isActive: template.isActive,
      })
    }
  }, [template])

  const handleSave = async () => {
    if (!template) return

    // Validações básicas
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
        description: 'As informações do template foram atualizadas com sucesso'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
          <DialogDescription>
            Edite as informações básicas do template. Para alterações no conteúdo do documento, entre em contato com o suporte técnico.
          </DialogDescription>
        </DialogHeader>

        {/* Alerta informativo */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você pode editar apenas o nome, descrição e status do template. O conteúdo do documento (HTML, CSS, estrutura) deve ser alterado por um administrador técnico.
          </AlertDescription>
        </Alert>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Nome do Template */}
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

            {/* Descrição */}
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
                Explique quando este template deve ser utilizado
              </p>
            </div>

            {/* Status Ativo/Inativo */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Status do Template</Label>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="cursor-pointer font-normal">
                    Template ativo e disponível para uso
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Desmarque para desativar temporariamente este template sem excluí-lo
                  </p>
                </div>
              </div>
            </div>

            {/* Informações somente leitura */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
              <h4 className="font-semibold text-sm text-gray-700">Informações Técnicas (somente leitura)</h4>
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
                  <span className="text-muted-foreground">Formato de saída:</span>
                  <p className="font-medium mt-1">{template.outputFormat}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Versão:</span>
                  <p className="font-medium mt-1">v{template.version}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho da página:</span>
                  <p className="font-medium mt-1">{template.pageSize}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Orientação:</span>
                  <p className="font-medium mt-1">{template.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</p>
                </div>
              </div>
              {template.isGlobal && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Template Global - Disponível para todos os serviços</span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

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
