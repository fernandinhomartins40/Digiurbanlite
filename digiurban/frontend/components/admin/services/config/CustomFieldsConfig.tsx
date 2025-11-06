'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Settings2, Sliders } from 'lucide-react'

interface CustomFieldsConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

interface CustomField {
  id: string
  key: string
  label: string
  type: string
  required: boolean
  section?: string
}

export function CustomFieldsConfig({ formData, onChange }: CustomFieldsConfigProps) {
  const config = formData.customFieldsConfig || {
    fields: [],
  }

  const [editingField, setEditingField] = useState<string | null>(null)

  const updateConfig = (updates: any) => {
    onChange('customFieldsConfig', { ...config, ...updates })
  }

  const addField = () => {
    const newField: CustomField = {
      id: `cf_${Date.now()}`,
      key: `campo_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: false,
    }
    updateConfig({ fields: [...config.fields, newField] })
    setEditingField(newField.id)
  }

  const removeField = (fieldId: string) => {
    updateConfig({ fields: config.fields.filter((f: CustomField) => f.id !== fieldId) })
    if (editingField === fieldId) setEditingField(null)
  }

  const updateField = (fieldId: string, updates: any) => {
    updateConfig({
      fields: config.fields.map((f: CustomField) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Campos Personalizados
              </CardTitle>
              <CardDescription>
                {config.fields.length} campo{config.fields.length !== 1 ? 's' : ''} adicional{config.fields.length !== 1 ? 'is' : ''}
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
            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">Nenhum campo personalizado</p>
              <p className="text-xs text-gray-500 mt-2">
                Adicione campos extras específicos para este serviço
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.fields.map((field: CustomField, index: number) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {field.key}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {field.type}
                          </Badge>
                          {field.required && (
                            <Badge className="text-xs bg-red-100 text-red-700">
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
                            <Label className="text-xs">Chave (ID único)</Label>
                            <Input
                              value={field.key}
                              onChange={(e) => updateField(field.id, { key: e.target.value })}
                              placeholder="campo_unico"
                              className="text-sm font-mono"
                            />
                            <p className="text-xs text-gray-500">
                              Apenas letras, números e underscore
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Label (Exibição)</Label>
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
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Telefone</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="time">Hora</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="select">Seleção</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="textarea">Área de Texto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Seção/Agrupamento</Label>
                            <Input
                              value={field.section || ''}
                              onChange={(e) => updateField(field.id, { section: e.target.value })}
                              placeholder="Ex: Dados Adicionais"
                              className="text-sm"
                            />
                          </div>

                          <div className="flex items-center space-x-2 col-span-2 pt-2">
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

      {config.fields.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-900">
              <strong>💡 Dica:</strong> Estes campos adicionais aparecerão no formulário de solicitação
              do serviço e permitirão coletar informações específicas necessárias para este tipo de atendimento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
