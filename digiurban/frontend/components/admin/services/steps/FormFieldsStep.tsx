'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  Info,
  Plus,
  Settings,
  Users,
  Briefcase,
  DollarSign
} from 'lucide-react'

interface FormFieldConfig {
  id: string
  label: string
  type: string
  required: boolean
  enabled: boolean
  category: 'citizen' | 'additional'
  icon?: any
  description?: string
}

interface FormFieldsStepProps {
  formData: {
    enabledFields?: string[]
    formFieldsConfig?: FormFieldConfig[]
    formSchema?: any // Schema do formulário com campos adicionais
    hasCustomFields?: boolean
    hasCustomForm?: boolean
  }
  onChange: (field: string, value: any) => void
}

// IDs de campos que pertencem ao cadastro do cidadão (para categorização)
const CITIZEN_FIELD_IDS = [
  'nome', 'name', 'cpf', 'rg', 'dataNascimento', 'birthDate',
  'email', 'telefone', 'phone', 'phoneSecondary', 'telefoneSecundario',
  'nomeMae', 'motherName', 'estadoCivil', 'maritalStatus',
  'profissao', 'occupation', 'rendaFamiliar', 'familyIncome',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'pontoReferencia',
  'address', 'possuiDeficiencia', 'tipoDeficiencia'
]

// Campos padrão que vêm do cadastro do cidadão (baseados no modelo Citizen do Prisma)
const CITIZEN_DEFAULT_FIELDS: FormFieldConfig[] = [
  // ========== DADOS BÁSICOS OBRIGATÓRIOS ==========
  {
    id: 'nome',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    enabled: true,
    category: 'citizen',
    icon: User,
    description: 'Nome completo do cidadão',
  },
  {
    id: 'cpf',
    label: 'CPF',
    type: 'text',
    required: true,
    enabled: true,
    category: 'citizen',
    icon: Hash,
    description: 'CPF do cidadão',
  },

  // ========== DOCUMENTOS ==========
  {
    id: 'rg',
    label: 'RG',
    type: 'text',
    required: false,
    enabled: true,
    category: 'citizen',
    icon: FileText,
    description: 'RG do cidadão',
  },

  // ========== CONTATO ==========
  {
    id: 'email',
    label: 'E-mail',
    type: 'email',
    required: false,
    enabled: true,
    category: 'citizen',
    icon: Mail,
    description: 'E-mail do cidadão',
  },
  {
    id: 'phone',
    label: 'Telefone Principal',
    type: 'tel',
    required: false,
    enabled: true,
    category: 'citizen',
    icon: Phone,
    description: 'Telefone principal do cidadão',
  },
  {
    id: 'phoneSecondary',
    label: 'Telefone Secundário',
    type: 'tel',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: Phone,
    description: 'Telefone secundário/alternativo',
  },

  // ========== DADOS PESSOAIS ==========
  {
    id: 'birthDate',
    label: 'Data de Nascimento',
    type: 'date',
    required: false,
    enabled: true,
    category: 'citizen',
    icon: Calendar,
    description: 'Data de nascimento',
  },
  {
    id: 'motherName',
    label: 'Nome da Mãe',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: User,
    description: 'Nome completo da mãe',
  },
  {
    id: 'maritalStatus',
    label: 'Estado Civil',
    type: 'select',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: Users,
    description: 'Estado civil do cidadão',
  },

  // ========== DADOS SOCIOECONÔMICOS ==========
  {
    id: 'occupation',
    label: 'Ocupação/Profissão',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: Briefcase,
    description: 'Ocupação ou profissão',
  },
  {
    id: 'familyIncome',
    label: 'Renda Familiar',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: DollarSign,
    description: 'Faixa de renda familiar',
  },

  // ========== ENDEREÇO (campos do JSON address) ==========
  {
    id: 'address.street',
    label: 'Logradouro',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Rua/Avenida',
  },
  {
    id: 'address.number',
    label: 'Número',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Número da residência',
  },
  {
    id: 'address.complement',
    label: 'Complemento',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Complemento do endereço',
  },
  {
    id: 'address.neighborhood',
    label: 'Bairro',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Bairro',
  },
  {
    id: 'address.city',
    label: 'Cidade',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Cidade',
  },
  {
    id: 'address.state',
    label: 'Estado (UF)',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'Estado (UF)',
  },
  {
    id: 'address.zipCode',
    label: 'CEP',
    type: 'text',
    required: false,
    enabled: false,
    category: 'citizen',
    icon: MapPin,
    description: 'CEP do endereço',
  },
]

export function FormFieldsStep({ formData, onChange }: FormFieldsStepProps) {
  const [fields, setFields] = useState<FormFieldConfig[]>(() => {
    // Se já tiver configuração salva, usar ela
    if (formData.formFieldsConfig && formData.formFieldsConfig.length > 0) {
      return formData.formFieldsConfig
    }

    // Montar lista completa de campos
    let allFields: FormFieldConfig[] = []

    // Se tiver formSchema (JSON Schema), usar os campos de lá
    if (formData.formSchema && formData.formSchema.properties) {
      const schemaProperties = formData.formSchema.properties
      const requiredFields = formData.formSchema.required || []

      // Converter cada campo do schema para FormFieldConfig
      Object.entries(schemaProperties).forEach(([fieldName, fieldDef]: [string, any]) => {
        // Mapear do tipo JSON Schema para nossos tipos
        let fieldType = 'text'
        if (fieldDef.format === 'email') fieldType = 'email'
        else if (fieldDef.format === 'date') fieldType = 'date'
        else if (fieldDef.type === 'boolean') fieldType = 'checkbox'
        else if (fieldDef.enum) fieldType = 'select'
        else if (fieldDef.type === 'number' || fieldDef.type === 'integer') fieldType = 'number'

        // Determinar se é campo do cidadão ou adicional
        const isCitizenField = CITIZEN_FIELD_IDS.includes(fieldName)

        // Escolher ícone baseado no nome do campo
        let icon = FileText
        if (fieldName.includes('nome') || fieldName.includes('name') || fieldName.includes('Mae')) icon = User
        else if (fieldName.includes('cpf') || fieldName.includes('rg') || fieldName.includes('cartao')) icon = Hash
        else if (fieldName.includes('email')) icon = Mail
        else if (fieldName.includes('telefone') || fieldName.includes('phone')) icon = Phone
        else if (fieldName.includes('data') || fieldName.includes('Date') || fieldName.includes('nascimento')) icon = Calendar
        else if (fieldName.includes('endereco') || fieldName.includes('cep') || fieldName.includes('logradouro') || fieldName.includes('bairro') || fieldName.includes('address')) icon = MapPin
        else if (fieldName.includes('profissao') || fieldName.includes('occupation')) icon = Briefcase
        else if (fieldName.includes('renda') || fieldName.includes('income')) icon = DollarSign
        else if (fieldName.includes('estado') || fieldName.includes('marital')) icon = Users

        allFields.push({
          id: fieldName,
          label: fieldDef.title || fieldName,
          type: fieldType,
          required: requiredFields.includes(fieldName),
          enabled: true, // Por padrão habilitado
          category: isCitizenField ? 'citizen' : 'additional',
          icon: icon,
          description: fieldDef.description || fieldDef.title,
        })
      })
    } else {
      // Se não tiver formSchema, usar apenas campos padrão do cidadão
      allFields = [...CITIZEN_DEFAULT_FIELDS]
    }

    return allFields
  })

  const toggleField = (fieldId: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, enabled: !field.enabled } : field
    )
    setFields(updatedFields)

    // Atualizar formData
    onChange('formFieldsConfig', updatedFields)

    // Atualizar lista de campos habilitados
    const enabledIds = updatedFields.filter(f => f.enabled).map(f => f.id)
    onChange('enabledFields', enabledIds)
  }

  const toggleRequired = (fieldId: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, required: !field.required } : field
    )
    setFields(updatedFields)
    onChange('formFieldsConfig', updatedFields)
  }

  const citizenFields = fields.filter(f => f.category === 'citizen')
  const additionalFields = fields.filter(f => f.category === 'additional')

  const enabledCount = fields.filter(f => f.enabled).length
  const requiredCount = fields.filter(f => f.required && f.enabled).length

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Campos do Formulário</p>
          <p className="text-xs text-blue-700 mt-1">
            Configure quais campos serão exibidos no formulário de solicitação. Campos do cidadão
            são preenchidos automaticamente com dados do cadastro.
          </p>
          <div className="flex gap-4 mt-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {enabledCount} campos habilitados
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {requiredCount} obrigatórios
            </Badge>
          </div>
        </div>
      </div>

      {/* Campos do Cidadão (Pré-preenchidos) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Campos do Cadastro do Cidadão
          </CardTitle>
          <CardDescription>
            Estes campos são preenchidos automaticamente com os dados do cadastro do cidadão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {citizenFields.map((field) => {
              const Icon = field.icon || FileText
              return (
                <Card key={field.id} className={`border-2 ${field.enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${field.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${field.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label className="font-medium text-base">{field.label}</Label>
                              {field.required && field.enabled && (
                                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                              )}
                              {!field.enabled && (
                                <Badge variant="secondary" className="text-xs">Desabilitado</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            {field.enabled && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                                  Obrigatório
                                </Label>
                                <Switch
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onCheckedChange={() => toggleRequired(field.id)}
                                />
                              </div>
                            )}

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center gap-2">
                              <Label htmlFor={`toggle-${field.id}`} className="text-xs cursor-pointer">
                                {field.enabled ? 'Habilitado' : 'Desabilitado'}
                              </Label>
                              <Switch
                                id={`toggle-${field.id}`}
                                checked={field.enabled}
                                onCheckedChange={() => toggleField(field.id)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                          <span>ID: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{field.id}</code></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Campos Adicionais do Serviço */}
      {additionalFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Campos Adicionais do Serviço
            </CardTitle>
            <CardDescription>
              Campos específicos configurados na aba "Campos do Formulário" quando ativar o recurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {additionalFields.map((field) => {
                const Icon = field.icon || FileText
                return (
                  <Card key={field.id} className={`border-2 ${field.enabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${field.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`h-5 w-5 ${field.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Label className="font-medium text-base">{field.label}</Label>
                                {field.required && field.enabled && (
                                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                )}
                                {!field.enabled && (
                                  <Badge variant="secondary" className="text-xs">Desabilitado</Badge>
                                )}
                              </div>
                              {field.description && (
                                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {field.enabled && (
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                                    Obrigatório
                                  </Label>
                                  <Switch
                                    id={`required-${field.id}`}
                                    checked={field.required}
                                    onCheckedChange={() => toggleRequired(field.id)}
                                  />
                                </div>
                              )}

                              <Separator orientation="vertical" className="h-6" />

                              <div className="flex items-center gap-2">
                                <Label htmlFor={`toggle-${field.id}`} className="text-xs cursor-pointer">
                                  {field.enabled ? 'Habilitado' : 'Desabilitado'}
                                </Label>
                                <Switch
                                  id={`toggle-${field.id}`}
                                  checked={field.enabled}
                                  onCheckedChange={() => toggleField(field.id)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <span>ID: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{field.id}</code></span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {additionalFields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">Nenhum campo adicional configurado</p>
            <p className="text-xs text-gray-500 mt-1">
              Ative o recurso "Formulário Customizado" ou "Campos Personalizados" na aba Recursos
              para criar campos adicionais específicos do serviço
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {enabledCount} campos serão exibidos no formulário
                </p>
                <p className="text-xs text-gray-600">
                  {requiredCount} obrigatórios • {enabledCount - requiredCount} opcionais
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
