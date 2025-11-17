'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, GripVertical, Settings2 } from 'lucide-react'

interface CustomFormConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  validation?: any
  options?: string[]
}

export function CustomFormConfig({ formData, onChange }: CustomFormConfigProps) {
  const config = formData.customFormConfig || {
    title: '',
    description: '',
    isRequired: false,
    isMultiStep: false,
    fields: [],
  }

  const [editingField, setEditingField] = useState<string | null>(null)

  const updateConfig = (updates: any) => {
    onChange('customFormConfig', { ...config, ...updates })
  }

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Novo Campo',
      required: false,
    }
    updateConfig({ fields: [...config.fields, newField] })
    setEditingField(newField.id)
  }

  const removeField = (fieldId: string) => {
    updateConfig({ fields: config.fields.filter((f: FormField) => f.id !== fieldId) })
    if (editingField === fieldId) setEditingField(null)
  }

  const updateField = (fieldId: string, updates: any) => {
    updateConfig({
      fields: config.fields.map((f: FormField) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do Formulário</CardTitle>
          <CardDescription>Configure as propriedades básicas do formulário customizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formTitle">Título do Formulário</Label>
            <Input
              id="formTitle"
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Ex: Formulário de Atendimento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formDescription">Descrição</Label>
            <Input
              id="formDescription"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Breve descrição do formulário"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="formRequired"
                checked={config.isRequired}
                onCheckedChange={(checked) => updateConfig({ isRequired: checked })}
              />
              <Label htmlFor="formRequired" className="cursor-pointer font-normal">
                Formulário obrigatório
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="formMultiStep"
                checked={config.isMultiStep}
                onCheckedChange={(checked) => updateConfig({ isMultiStep: checked })}
              />
              <Label htmlFor="formMultiStep" className="cursor-pointer font-normal">
                Multi-step (múltiplas etapas)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Campos do Formulário</CardTitle>
              <CardDescription>
                {config.fields.length} campo{config.fields.length !== 1 ? 's' : ''} configurado{config.fields.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Campo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.fields.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-600">Nenhum campo adicionado</p>
              <p className="text-xs text-gray-500 mt-1">
                Clique em "Adicionar Campo" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.fields.map((field: FormField, index: number) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{index + 1}. {field.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {editingField === field.id && (
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div className="space-y-2">
                            <Label className="text-xs">Label do Campo</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Tipo de Campo</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateField(field.id, { type: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="tel">Telefone</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="textarea">Área de Texto</SelectItem>
                                <SelectItem value="select">Seleção (Select)</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="radio">Radio</SelectItem>
                                <SelectItem value="file">Arquivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                              placeholder="Texto de ajuda"
                              className="text-sm"
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <Checkbox
                              id={`required_${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                            />
                            <Label htmlFor={`required_${field.id}`} className="text-xs cursor-pointer">
                              Campo obrigatório
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
