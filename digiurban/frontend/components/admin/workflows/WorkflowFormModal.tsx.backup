'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, MoveUp, MoveDown, GitBranch } from 'lucide-react'

interface WorkflowStage {
  name: string
  order: number
  slaDays: number
  canSkip: boolean
  requiredActions: string[]
}

interface WorkflowFormData {
  moduleType: string
  name: string
  description: string
  defaultSLA: number
  stages: WorkflowStage[]
}

interface WorkflowFormModalProps {
  workflow?: any
  onClose: () => void
  onSaveSuccess: () => void
}

export function WorkflowFormModal({ workflow, onClose, onSaveSuccess }: WorkflowFormModalProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<WorkflowFormData>({
    moduleType: '',
    name: '',
    description: '',
    defaultSLA: 15,
    stages: []
  })

  useEffect(() => {
    if (workflow) {
      setFormData({
        moduleType: workflow.moduleType,
        name: workflow.name,
        description: workflow.description || '',
        defaultSLA: workflow.defaultSLA || 15,
        stages: workflow.stages || []
      })
    }
  }, [workflow])

  const handleAddStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        {
          name: '',
          order: formData.stages.length + 1,
          slaDays: 5,
          canSkip: false,
          requiredActions: []
        }
      ]
    })
  }

  const handleRemoveStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index)
    // Reordenar
    newStages.forEach((stage, i) => {
      stage.order = i + 1
    })
    setFormData({ ...formData, stages: newStages })
  }

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...formData.stages]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newStages.length) return

    // Trocar posições
    ;[newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]]

    // Reordenar
    newStages.forEach((stage, i) => {
      stage.order = i + 1
    })

    setFormData({ ...formData, stages: newStages })
  }

  const handleStageChange = (index: number, field: keyof WorkflowStage, value: any) => {
    const newStages = [...formData.stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setFormData({ ...formData, stages: newStages })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.moduleType || !formData.name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o tipo de módulo e nome do workflow',
        variant: 'destructive'
      })
      return
    }

    if (formData.stages.length === 0) {
      toast({
        title: 'Adicione etapas',
        description: 'O workflow precisa ter pelo menos uma etapa',
        variant: 'destructive'
      })
      return
    }

    // Validar etapas
    for (let i = 0; i < formData.stages.length; i++) {
      const stage = formData.stages[i]
      if (!stage.name) {
        toast({
          title: 'Etapa incompleta',
          description: `A etapa ${i + 1} precisa ter um nome`,
          variant: 'destructive'
        })
        return
      }
      if (stage.slaDays <= 0) {
        toast({
          title: 'SLA inválido',
          description: `A etapa ${i + 1} precisa ter SLA maior que 0`,
          variant: 'destructive'
        })
        return
      }
    }

    try {
      setLoading(true)

      const url = workflow
        ? `/workflows/${workflow.moduleType}`
        : '/workflows'

      const method = workflow ? 'PUT' : 'POST'

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (response.success) {
        toast({
          title: workflow ? 'Workflow atualizado' : 'Workflow criado',
          description: workflow
            ? 'Workflow atualizado com sucesso'
            : 'Workflow criado com sucesso'
        })
        onSaveSuccess()
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar workflow',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {workflow ? 'Editar Workflow' : 'Novo Workflow'}
          </DialogTitle>
          <DialogDescription>
            Configure as etapas, aprovações e SLAs do fluxo de trabalho
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moduleType">Tipo de Módulo *</Label>
              <Input
                id="moduleType"
                placeholder="Ex: CARTAO_SUS, MATRICULA_ESCOLAR"
                value={formData.moduleType}
                onChange={(e) => setFormData({ ...formData, moduleType: e.target.value.toUpperCase() })}
                disabled={!!workflow}
                required
              />
              <p className="text-xs text-muted-foreground">
                Identificador único do módulo (não pode ser alterado depois)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workflow *</Label>
              <Input
                id="name"
                placeholder="Ex: Emissão de Cartão SUS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste workflow..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSLA">SLA Padrão (dias úteis)</Label>
            <Input
              id="defaultSLA"
              type="number"
              min="1"
              value={formData.defaultSLA}
              onChange={(e) => setFormData({ ...formData, defaultSLA: parseInt(e.target.value) })}
            />
          </div>

          {/* Etapas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Etapas do Workflow</Label>
              <Button type="button" size="sm" onClick={handleAddStage}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Etapa
              </Button>
            </div>

            {formData.stages.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {formData.stages.map((stage, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Etapa {stage.order}</Badge>
                          <CardTitle className="text-base">
                            {stage.name || `Etapa ${stage.order}`}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveStage(index, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveStage(index, 'down')}
                            disabled={index === formData.stages.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Nome da Etapa *</Label>
                          <Input
                            placeholder="Ex: Análise Técnica"
                            value={stage.name}
                            onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>SLA (dias úteis)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={stage.slaDays}
                            onChange={(e) => handleStageChange(index, 'slaDays', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`canSkip-${index}`}
                          checked={stage.canSkip}
                          onCheckedChange={(checked) => handleStageChange(index, 'canSkip', checked)}
                        />
                        <Label htmlFor={`canSkip-${index}`} className="text-sm font-normal cursor-pointer">
                          Permitir pular esta etapa
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (workflow ? 'Atualizar' : 'Criar Workflow')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
