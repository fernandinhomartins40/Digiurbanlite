'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconPicker } from '@/components/ui/icon-picker'
import { Info } from 'lucide-react'

interface Department {
  id: string
  name: string
  code?: string
}

interface BasicInfoStepProps {
  formData: {
    name: string
    description: string
    category: string
    departmentId: string
    estimatedDays: string
    priority: number
    icon: string
    color: string
  }
  departments: Department[]
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function BasicInfoStep({ formData, departments, onChange, errors }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Informações Básicas do Serviço</p>
          <p className="text-xs text-blue-700 mt-1">
            Configure os dados essenciais que identificam e descrevem o serviço público.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">
            Nome do Serviço <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Ex: Agendamento de Consulta Médica"
            className={errors?.name ? 'border-red-500' : ''}
          />
          {errors?.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Descrição do Serviço</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Descreva de forma clara e objetiva o que este serviço oferece aos cidadãos..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Uma boa descrição ajuda os cidadãos a entenderem melhor o serviço
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => onChange('category', e.target.value)}
            placeholder="Ex: Saúde, Educação, Infraestrutura"
          />
          <p className="text-xs text-gray-500">Ajuda a organizar os serviços por tipo</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="departmentId">
            Departamento Responsável <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.departmentId}
            onValueChange={(value) => onChange('departmentId', value)}
          >
            <SelectTrigger className={errors?.departmentId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.departmentId && (
            <p className="text-xs text-red-500">{errors.departmentId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDays">Prazo Estimado (dias)</Label>
          <Input
            id="estimatedDays"
            type="number"
            min="0"
            value={formData.estimatedDays}
            onChange={(e) => onChange('estimatedDays', e.target.value)}
            placeholder="Ex: 5"
          />
          <p className="text-xs text-gray-500">Tempo médio para conclusão do serviço</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={String(formData.priority)}
            onValueChange={(value) => onChange('priority', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Muito Baixa</SelectItem>
              <SelectItem value="2">2 - Baixa</SelectItem>
              <SelectItem value="3">3 - Normal</SelectItem>
              <SelectItem value="4">4 - Alta</SelectItem>
              <SelectItem value="5">5 - Crítica</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Define a ordem de exibição do serviço</p>
        </div>

        <div className="space-y-2">
          <IconPicker
            label="Ícone (opcional)"
            value={formData.icon}
            onChange={(value) => onChange('icon', value)}
            placeholder="Selecione um ícone"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Cor do Serviço</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => onChange('color', e.target.value)}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              value={formData.color}
              onChange={(e) => onChange('color', e.target.value)}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">Cor utilizada em badges e destaques</p>
        </div>
      </div>
    </div>
  )
}
