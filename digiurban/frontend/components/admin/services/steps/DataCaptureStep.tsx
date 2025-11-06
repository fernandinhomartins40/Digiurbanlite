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
import { Plus, Trash2, GripVertical, AlertCircle, FileText, X } from 'lucide-react'
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

export function DataCaptureStep({ formData, onChange }: DataCaptureStepProps) {
  const [fields, setFields] = useState<FormField[]>(
    formData.formSchema?.fields || []
  )
  const [documentInput, setDocumentInput] = useState('')
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    formData.requiredDocuments || []
  )

  const handleModuleTypeChange = (value: string) => {
    onChange('moduleType', value)

    // Sugerir campos básicos baseados no tipo de módulo
    if (value && fields.length === 0) {
      const suggestedFields = getSuggestedFields(value)
      setFields(suggestedFields)
      updateFormSchema(suggestedFields)
    }
  }

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
    const schema = {
      type: 'object',
      fields: updatedFields,
      properties: updatedFields.reduce((acc, field) => {
        acc[field.id] = {
          type: field.type === 'number' ? 'number' : 'string',
          title: field.label,
          required: field.required,
          ...(field.options && { enum: field.options }),
        }
        return acc
      }, {} as Record<string, any>),
    }
    onChange('formSchema', schema)
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

  // Verificar se é um serviço de inscrição (programa/curso/capacitação)
  const isEnrollmentService = formData.moduleType && [
    'INSCRICAO_PROGRAMA_RURAL',
    'INSCRICAO_CURSO_RURAL',
    'INSCRICAO_OFICINA_CULTURAL',
    'INSCRICAO_ATIVIDADE_ESPORTIVA',
    'INSCRICAO_CAPACITACAO',
  ].includes(formData.moduleType)

  if (formData.serviceType === 'INFORMATIVO') {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Serviços informativos não capturam dados estruturados.
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
      {/* Seleção do Tipo de Módulo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Módulo</CardTitle>
          <CardDescription>
            Selecione para qual módulo este serviço irá enviar os dados capturados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moduleType">Módulo de Destino *</Label>
            <Select value={formData.moduleType} onValueChange={handleModuleTypeChange}>
              <SelectTrigger id="moduleType">
                <SelectValue placeholder="Selecione o módulo..." />
              </SelectTrigger>
              <SelectContent>
                {MODULE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Os dados capturados serão salvos e poderão ser consultados no módulo selecionado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Construtor de Formulário */}
      {formData.moduleType && (
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
                            <div className="col-span-3 space-y-2">
                              <Label>Opções (separadas por vírgula)</Label>
                              <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) =>
                                  updateField(index, {
                                    options: e.target.value
                                      .split(',')
                                      .map((s) => s.trim()),
                                  })
                                }
                                placeholder="Opção 1, Opção 2, Opção 3"
                              />
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
      )}

      {/* Preview */}
      {fields.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Preview do Formulário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  </Select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled className="rounded" />
                    <span className="text-xs text-gray-600">{field.label}</span>
                  </div>
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
          </CardContent>
        </Card>
      )}

      {/* Seção de Documentos Necessários - Mostrar para serviços de inscrição */}
      {isEnrollmentService && (
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
      )}
    </div>
  )
}
