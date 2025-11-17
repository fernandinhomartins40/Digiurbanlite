'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Info, Database, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceTypeStepProps {
  formData: any
  onChange: (field: string, value: any) => void
}

export function ServiceTypeStep({ formData, onChange }: ServiceTypeStepProps) {
  const serviceTypes = [
    {
      value: 'SEM_DADOS',
      title: 'Serviço sem Captura de Dados',
      description: 'Gera protocolo de acompanhamento. Pode receber arquivos/documentos anexos.',
      icon: <FileText className="h-8 w-8" />,
      examples: [
        'Consulta de Calendário Escolar',
        'Acompanhamento de Obras',
        'Mapa Turístico da Cidade',
      ],
      color: 'blue',
    },
    {
      value: 'COM_DADOS',
      title: 'Serviço com Captura de Dados',
      description: 'Captura dados estruturados que serão salvos em módulos específicos.',
      icon: <Database className="h-8 w-8" />,
      examples: [
        'Matrícula de Aluno',
        'Agendamento de Consulta',
        'Cadastro de Produtor Rural',
      ],
      color: 'green',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Tipo de Serviço</Label>
        <p className="text-sm text-gray-600">
          Escolha o tipo de serviço que você deseja criar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceTypes.map((type) => (
          <Card
            key={type.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              formData.serviceType === type.value
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'hover:border-gray-400'
            )}
            onClick={() => {
              onChange('serviceType', type.value)
              // Limpar campos de captura de dados se mudar para SEM_DADOS
              if (type.value === 'SEM_DADOS') {
                onChange('moduleType', '')
                onChange('formSchema', null)
              }
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    type.color === 'blue' && 'bg-blue-100 text-blue-600',
                    type.color === 'green' && 'bg-green-100 text-green-600'
                  )}
                >
                  {type.icon}
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    formData.serviceType === type.value
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  )}
                >
                  {formData.serviceType === type.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Exemplos:
                </p>
                <ul className="space-y-1">
                  {type.examples.map((example, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Qual é a diferença?
            </p>
            <p className="text-xs text-blue-700">
              <strong>Sem Dados</strong> geram protocolos de acompanhamento e podem receber arquivos anexos.{' '}
              <strong>Com Dados</strong> salvam informações estruturadas que podem
              ser consultadas e relatadas posteriormente (ex: lista de alunos matriculados,
              agendamentos de consultas).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
