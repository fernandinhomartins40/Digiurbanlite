'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical, AlertCircle, FileText, X, User, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DataCaptureStepProps {
  formData: any
  onChange: (field: string, value: any) => void
}

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'tel'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // Para select
  validation?: string
}

// Lista de tipos de módulos disponíveis
const MODULE_TYPES = [
  { value: 'MATRICULA_ALUNO', label: 'Matrícula de Aluno (Educação)' },
  { value: 'ATENDIMENTOS_SAUDE', label: 'Atendimentos de Saúde' },
  { value: 'AGENDAMENTO_CONSULTA', label: 'Agendamento de Consulta' },
  { value: 'CADASTRO_PRODUTOR', label: 'Cadastro de Produtor Rural' },
  { value: 'ASSISTENCIA_SOCIAL', label: 'Atendimento Social' },
  { value: 'INSCRICAO_PROGRAMA', label: 'Inscrição em Programa' },
  { value: 'INSCRICAO_PROGRAMA_RURAL', label: '🌾 Inscrição em Programa Rural' },
  { value: 'INSCRICAO_CURSO_RURAL', label: '📚 Inscrição em Curso Rural' },
  { value: 'INSCRICAO_OFICINA_CULTURAL', label: '🎨 Inscrição em Oficina Cultural' },
  { value: 'INSCRICAO_ATIVIDADE_ESPORTIVA', label: '⚽ Inscrição em Atividade Esportiva' },
  { value: 'INSCRICAO_CAPACITACAO', label: '🎓 Inscrição em Capacitação' },
  { value: 'SOLICITACAO_HABITACAO', label: 'Solicitação Habitacional' },
  { value: 'LICENCA_AMBIENTAL', label: 'Licença Ambiental' },
  { value: 'ALVARA_CONSTRUCAO', label: 'Alvará de Construção' },
  { value: 'ATENDIMENTO_CULTURA', label: 'Atendimento Cultural' },
  { value: 'INSCRICAO_ESPORTE', label: 'Inscrição Esportiva' },
  { value: 'CUSTOM', label: '🔧 Customizado (Definir Manualmente)' },
]

// Campos disponíveis do perfil do cidadão
const CITIZEN_PROFILE_FIELDS = [
  { id: 'citizen_name', label: 'Nome Completo', type: 'text' as const, description: 'Nome cadastrado no perfil' },
  { id: 'citizen_cpf', label: 'CPF', type: 'text' as const, description: 'CPF do cidadão' },
  { id: 'citizen_rg', label: 'RG', type: 'text' as const, description: 'RG do cidadão' },
  { id: 'citizen_email', label: 'E-mail', type: 'email' as const, description: 'E-mail cadastrado' },
  { id: 'citizen_phone', label: 'Telefone', type: 'tel' as const, description: 'Telefone principal' },
  { id: 'citizen_phonesecondary', label: 'Telefone Secundário', type: 'tel' as const, description: 'Telefone alternativo' },
  { id: 'citizen_birthdate', label: 'Data de Nascimento', type: 'date' as const, description: 'Data de nascimento' },
  { id: 'citizen_address', label: 'Endereço Completo', type: 'textarea' as const, description: 'Endereço do cidadão' },
  { id: 'citizen_mothername', label: 'Nome da Mãe', type: 'text' as const, description: 'Nome completo da mãe' },
  { id: 'citizen_maritalstatus', label: 'Estado Civil', type: 'text' as const, description: 'Estado civil' },
  { id: 'citizen_occupation', label: 'Profissão', type: 'text' as const, description: 'Ocupação profissional' },
  { id: 'citizen_familyincome', label: 'Renda Familiar', type: 'text' as const, description: 'Faixa de renda familiar' },
]

/**
 * Campos do formulário em lista, venha o formulário do jeito que vier:
 * `fields` (criado por esta tela) ou `properties` (catálogo da plataforma).
 * Antes só lia `fields`: um serviço do catálogo abria com 0 campos e, ao
 * mexer no formulário, todos os campos dele eram apagados.
 */
function fieldsFromSchema(schema: any): FormField[] {
  if (Array.isArray(schema?.fields) && schema.fields.length > 0) return schema.fields
  const properties = schema?.properties
  if (!properties || typeof properties !== 'object') return []
  const required: string[] = Array.isArray(schema.required) ? schema.required : []
  return Object.entries<any>(properties).map(([id, prop]) => {
    let type: FormField['type'] = 'text'
    if (Array.isArray(prop?.enum)) type = 'select'
    else if (prop?.type === 'number' || prop?.type === 'integer') type = 'number'
    else if (prop?.type === 'boolean') type = 'checkbox'
    else if (prop?.format === 'date') type = 'date'
    else if (prop?.format === 'email') type = 'email'
    else if (prop?.widget === 'textarea' || (prop?.maxLength || 0) > 300) type = 'textarea'
    return {
      id,
      type,
      label: prop?.title || id,
      required: required.includes(id) || prop?.required === true,
      ...(Array.isArray(prop?.enum) ? { options: prop.enum.map(String) } : {}),
    }
  })
}

/** Formulário completo: lista de campos + JSON Schema (com obrigatórios no lugar certo) */
function schemaFromFields(fields: FormField[], citizenFields: string[], previous: any) {
  const previousProps = previous?.properties || {}
  return {
    type: 'object',
    fields,
    citizenFields,
    properties: fields.reduce((acc, field) => {
      const kept = previousProps[field.id] || {}
      acc[field.id] = {
        // mantém o que o catálogo já definia (tamanho, padrão, formato...)
        ...kept,
        type: field.type === 'number' ? 'number' : field.type === 'checkbox' ? 'boolean' : 'string',
        title: field.label,
        ...(field.type === 'date' ? { format: 'date' } : {}),
        ...(field.type === 'email' ? { format: 'email' } : {}),
        ...(field.type === 'textarea' ? { widget: 'textarea' } : {}),
        ...(field.options ? { enum: field.options } : {}),
      }
      if (field.type !== 'select') delete acc[field.id].enum
      delete acc[field.id].required
      return acc
    }, {} as Record<string, any>),
    required: fields.filter((field) => field.required).map((field) => field.id),
  }
}

export function DataCaptureStep({ formData, onChange }: DataCaptureStepProps) {
  const [fields, setFields] = useState<FormField[]>(() => fieldsFromSchema(formData.formSchema))
  const [documentInput, setDocumentInput] = useState('')
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    formData.requiredDocuments || []
  )
  const [selectedCitizenFields, setSelectedCitizenFields] = useState<string[]>(
    formData.formSchema?.citizenFields || []
  )

  const getSuggestedFields = (moduleType: string): FormField[] => {
    const baseFields: Record<string, FormField[]> = {
      MATRICULA_ALUNO: [
        { id: 'nomeAluno', type: 'text', label: 'Nome do Aluno', required: true },
        { id: 'dataNascimento', type: 'date', label: 'Data de Nascimento', required: true },
        { id: 'escolaDesejada', type: 'text', label: 'Escola Desejada', required: true },
        { id: 'serie', type: 'select', label: 'Série', required: true, options: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'] },
      ],
      ATENDIMENTOS_SAUDE: [
        { id: 'tipoAtendimento', type: 'select', label: 'Tipo de Atendimento', required: true, options: ['Consulta', 'Exame', 'Vacina', 'Medicamento'] },
        { id: 'unidadeSaude', type: 'text', label: 'Unidade de Saúde', required: true },
        { id: 'sintomas', type: 'textarea', label: 'Sintomas/Descrição', required: false },
      ],
      AGENDAMENTO_CONSULTA: [
        { id: 'especialidade', type: 'text', label: 'Especialidade', required: true },
        { id: 'dataPreferencia', type: 'date', label: 'Data de Preferência', required: true },
        { id: 'periodo', type: 'select', label: 'Período', required: true, options: ['Manhã', 'Tarde'] },
      ],
      CADASTRO_PRODUTOR: [
        { id: 'nomeProdutor', type: 'text', label: 'Nome do Produtor', required: true },
        { id: 'cpf', type: 'text', label: 'CPF', required: true },
        { id: 'propriedade', type: 'text', label: 'Nome da Propriedade', required: true },
        { id: 'area', type: 'number', label: 'Área (Alqueire)', required: true },
        { id: 'tipoProducao', type: 'select', label: 'Tipo de Produção', required: true, options: ['Agricultura', 'Pecuária', 'Ambos'] },
      ],
      INSCRICAO_PROGRAMA_RURAL: [
        { id: 'motivoInscricao', type: 'textarea', label: 'Motivo da Inscrição', required: true, placeholder: 'Por que deseja participar deste programa?' },
        { id: 'experienciaAnterior', type: 'select', label: 'Possui Experiência Anterior?', required: true, options: ['Sim', 'Não'] },
        { id: 'disponibilidade', type: 'select', label: 'Disponibilidade', required: true, options: ['Integral', 'Meio Período', 'Fins de Semana'] },
      ],
      INSCRICAO_CURSO_RURAL: [
        { id: 'escolaridade', type: 'select', label: 'Escolaridade', required: true, options: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior'] },
        { id: 'areaInteresse', type: 'text', label: 'Área de Interesse', required: true },
        { id: 'expectativas', type: 'textarea', label: 'Expectativas com o Curso', required: true },
        { id: 'disponibilidadeHorario', type: 'select', label: 'Disponibilidade de Horário', required: true, options: ['Manhã', 'Tarde', 'Noite', 'Flexível'] },
      ],
      INSCRICAO_OFICINA_CULTURAL: [
        { id: 'faixaEtaria', type: 'select', label: 'Faixa Etária', required: true, options: ['Infantil (6-12)', 'Adolescente (13-17)', 'Adulto (18-59)', 'Idoso (60+)'] },
        { id: 'experienciaCultural', type: 'textarea', label: 'Experiência Cultural Anterior', required: false },
        { id: 'objetivos', type: 'textarea', label: 'O que espera aprender?', required: true },
      ],
      INSCRICAO_ATIVIDADE_ESPORTIVA: [
        { id: 'modalidade', type: 'text', label: 'Modalidade de Interesse', required: true },
        { id: 'nivelHabilidade', type: 'select', label: 'Nível de Habilidade', required: true, options: ['Iniciante', 'Intermediário', 'Avançado'] },
        { id: 'restricoesMedicas', type: 'textarea', label: 'Restrições Médicas', required: false },
        { id: 'contatoEmergencia', type: 'tel', label: 'Contato de Emergência', required: true },
      ],
      INSCRICAO_CAPACITACAO: [
        { id: 'areaAtuacao', type: 'text', label: 'Área de Atuação Profissional', required: true },
        { id: 'objetivoProfissional', type: 'textarea', label: 'Objetivo Profissional', required: true },
        { id: 'formacaoAcademica', type: 'select', label: 'Formação Acadêmica', required: true, options: ['Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-Graduação'] },
        { id: 'experienciaProfissional', type: 'textarea', label: 'Experiência Profissional', required: false },
      ],
    }

    return baseFields[moduleType] || [
      { id: 'campo1', type: 'text', label: 'Campo 1', required: true },
    ]
  }

  const updateFormSchema = (updatedFields: FormField[]) => {
    onChange('formSchema', schemaFromFields(updatedFields, selectedCitizenFields, formData.formSchema))
  }

  const toggleCitizenField = (fieldId: string) => {
    const updated = selectedCitizenFields.includes(fieldId)
      ? selectedCitizenFields.filter(id => id !== fieldId)
      : [...selectedCitizenFields, fieldId]

    setSelectedCitizenFields(updated)
    // Atualizar formSchema imediatamente
    onChange('formSchema', schemaFromFields(fields, updated, formData.formSchema))
  }

  const addField = () => {
    const newField: FormField = {
      id: `campo_${Date.now()}`,
      type: 'text',
      label: 'Novo Campo',
      required: false,
    }
    const updatedFields = [...fields, newField]
    setFields(updatedFields)
    updateFormSchema(updatedFields)
  }

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    updateFormSchema(updatedFields)
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    )
    setFields(updatedFields)
    updateFormSchema(updatedFields)
  }

  const addDocument = () => {
    if (documentInput.trim()) {
      const updatedDocs = [...requiredDocuments, documentInput.trim()]
      setRequiredDocuments(updatedDocs)
      onChange('requiredDocuments', updatedDocs)
      setDocumentInput('')
    }
  }

  const removeDocument = (index: number) => {
    const updatedDocs = requiredDocuments.filter((_, i) => i !== index)
    setRequiredDocuments(updatedDocs)
    onChange('requiredDocuments', updatedDocs)
  }

  const addCommonDocument = (doc: string) => {
    const updatedDocs = [...requiredDocuments, doc]
    setRequiredDocuments(updatedDocs)
    onChange('requiredDocuments', updatedDocs)
  }

  const handleDocumentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDocument()
    }
  }

  const commonDocuments = [
    'RG',
    'CPF',
    'Comprovante de Residência',
    'Certidão de Nascimento',
    'Foto 3x4',
    'Comprovante de Escolaridade',
    'Atestado Médico',
    'Certidão Negativa de Débitos',
  ]

  if (formData.serviceType === 'SEM_DADOS') {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Serviços sem captura de dados não precisam de formulário estruturado.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Volte ao passo anterior se deseja criar um serviço com captura de dados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campos do Perfil do Cidadão */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <CardTitle className="text-lg">Campos do Perfil do Cidadão</CardTitle>
              <CardDescription>
                Selecione quais campos do perfil do cidadão devem ser incluídos neste serviço.
                Estes campos serão pré-preenchidos automaticamente com os dados do perfil.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CITIZEN_PROFILE_FIELDS.map((field) => {
              const isSelected = selectedCitizenFields.includes(field.id)
              return (
                <Card
                  key={field.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    isSelected
                      ? 'border-blue-500 bg-blue-100/50 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-blue-300'
                  )}
                  onClick={() => toggleCitizenField(field.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{field.label}</h4>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                        <Badge variant="outline" className="text-xs mt-2">
                          {field.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedCitizenFields.length > 0 ? (
            <div className="p-4 bg-blue-100 border border-blue-300 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedCitizenFields.length} {selectedCitizenFields.length === 1 ? 'campo selecionado' : 'campos selecionados'}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Estes campos serão automaticamente preenchidos com os dados do perfil do cidadão ao abrir o formulário.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Nenhum campo do perfil selecionado
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Clique nos cards acima para selecionar campos que devem ser pré-preenchidos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Construtor de Formulário */}
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campos do Formulário</CardTitle>
                <CardDescription>
                  Configure os campos que serão exibidos ao cidadão
                </CardDescription>
              </div>
              <Button onClick={addField} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum campo adicionado ainda.</p>
                <p className="text-sm mt-1">Clique em "Adicionar Campo" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <GripVertical className="h-5 w-5 text-gray-400 mt-6 flex-shrink-0" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label>Nome do Campo</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, { label: e.target.value })
                              }
                              placeholder="Ex: Nome Completo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: any) =>
                                updateField(index, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="textarea">Texto Longo</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Telefone</SelectItem>
                                <SelectItem value="select">Seleção</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>ID do Campo</Label>
                            <Input
                              value={field.id}
                              onChange={(e) =>
                                updateField(index, { id: e.target.value })
                              }
                              placeholder="campo_id"
                              className="font-mono text-xs"
                            />
                          </div>

                          {field.type === 'select' && (
                            <div className="col-span-3 space-y-3">
                              <Label>Opções da Seleção</Label>
                              <div className="space-y-2">
                                {field.options && field.options.length > 0 ? (
                                  <div className="space-y-2">
                                    {field.options.map((option, optIndex) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <Input
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...(field.options || [])]
                                            newOptions[optIndex] = e.target.value
                                            updateField(index, { options: newOptions })
                                          }}
                                          placeholder={`Opção ${optIndex + 1}`}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          onClick={() => {
                                            const newOptions = field.options?.filter((_, i) => i !== optIndex) || []
                                            updateField(index, { options: newOptions })
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Nenhuma opção adicionada</p>
                                )}
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [...(field.options || []), '']
                                    updateField(index, { options: newOptions })
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Opção
                                </Button>
                              </div>
                            </div>
                          )}

                          {field.type === 'checkbox' && (
                            <div className="col-span-3 space-y-3">
                              <div className="space-y-2">
                                <Label>Opções do Checkbox</Label>
                                <p className="text-xs text-gray-500">
                                  Deixe vazio para um checkbox simples (Sim/Não). Adicione opções para permitir múltiplas seleções.
                                </p>
                              </div>
                              <div className="space-y-2">
                                {field.options && field.options.length > 0 ? (
                                  <div className="space-y-2">
                                    {field.options.map((option, optIndex) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <Input
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...(field.options || [])]
                                            newOptions[optIndex] = e.target.value
                                            updateField(index, { options: newOptions })
                                          }}
                                          placeholder={`Opção ${optIndex + 1}`}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          onClick={() => {
                                            const newOptions = field.options?.filter((_, i) => i !== optIndex) || []
                                            updateField(index, { options: newOptions })
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Nenhuma opção adicionada (checkbox simples)</p>
                                )}
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [...(field.options || []), '']
                                    updateField(index, { options: newOptions })
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Opção
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="col-span-3 flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(index, { required: e.target.checked })
                                }
                                className="rounded"
                              />
                              <span className="text-sm">Campo obrigatório</span>
                            </label>
                          </div>
                        </div>

                        <Button
                          onClick={() => removeField(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Preview */}
      {(selectedCitizenFields.length > 0 || fields.length > 0) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Preview do Formulário</CardTitle>
            <CardDescription className="text-xs">
              Assim será a experiência do cidadão ao preencher este serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campos do Perfil do Cidadão */}
            {selectedCitizenFields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-300">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900 uppercase">
                    Campos Pré-preenchidos do Perfil
                  </span>
                </div>
                {selectedCitizenFields.map((fieldId) => {
                  const citizenField = CITIZEN_PROFILE_FIELDS.find(f => f.id === fieldId)
                  if (!citizenField) return null
                  return (
                    <div key={fieldId} className="space-y-1">
                      <Label className="text-xs flex items-center gap-2">
                        {citizenField.label}
                        <Badge variant="secondary" className="text-xs">Auto-preenchido</Badge>
                      </Label>
                      {citizenField.type === 'textarea' ? (
                        <Textarea
                          disabled
                          placeholder="Dados do perfil do cidadão"
                          className="text-sm bg-blue-100 border-blue-300"
                        />
                      ) : (
                        <Input
                          type={citizenField.type}
                          disabled
                          placeholder="Dados do perfil do cidadão"
                          className="text-sm bg-blue-100 border-blue-300"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Campos Customizados */}
            {fields.length > 0 && (
              <div className="space-y-3">
                {selectedCitizenFields.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-900 uppercase">
                      Campos Customizados
                    </span>
                  </div>
                )}
                {fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-xs">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea disabled placeholder={field.placeholder} className="text-sm bg-white" />
                    ) : field.type === 'select' ? (
                      <Select disabled>
                        <SelectTrigger className="text-sm bg-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options && field.options.length > 0 ? (
                            field.options.map((option, idx) => (
                              <SelectItem key={idx} value={option}>
                                {option}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="placeholder" disabled>
                              Nenhuma opção configurada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'checkbox' ? (
                      field.options && field.options.length > 0 ? (
                        <div className="space-y-2">
                          {field.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="checkbox" disabled className="rounded" />
                              <span className="text-xs text-gray-600">{option}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="rounded" />
                          <span className="text-xs text-gray-600">{field.label}</span>
                        </div>
                      )
                    ) : (
                      <Input
                        type={field.type}
                        disabled
                        placeholder={field.placeholder}
                        className="text-sm bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção de Documentos Necessários */}
      <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 mt-1" />
              <div>
                <CardTitle>Documentos Necessários</CardTitle>
                <CardDescription>
                  Configure quais documentos os cidadãos devem apresentar para se inscrever
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input para adicionar documento */}
            <div>
              <Label htmlFor="documentInput" className="text-sm font-medium">
                Adicionar Documento
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="documentInput"
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  onKeyPress={handleDocumentKeyPress}
                  placeholder="Ex: RG, CPF, Comprovante de residência"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addDocument}
                  disabled={!documentInput.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pressione Enter ou clique no + para adicionar
              </p>
            </div>

            {/* Documentos Comuns */}
            {commonDocuments.filter(doc => !requiredDocuments.includes(doc)).length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Documentos Comuns (clique para adicionar)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {commonDocuments
                    .filter(doc => !requiredDocuments.includes(doc))
                    .map((doc) => (
                      <Badge
                        key={doc}
                        variant="outline"
                        className="cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors"
                        onClick={() => addCommonDocument(doc)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {doc}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Lista de Documentos Adicionados */}
            {requiredDocuments.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Documentos Obrigatórios ({requiredDocuments.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {requiredDocuments.map((doc, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                      onClick={() => removeDocument(index)}
                    >
                      {doc}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Clique em um documento para removê-lo
                </p>
              </div>
            )}

            {requiredDocuments.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Nenhum documento obrigatório configurado
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Adicione documentos que os cidadãos devem apresentar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
