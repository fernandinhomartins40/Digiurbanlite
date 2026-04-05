'use client'

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Info, Database, FileText, LockKeyhole, Search, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NO_DATA_SUBTYPE_OPTIONS } from '@/utils/no-data-service-classification'

interface ServiceTypeStepProps {
  formData: any
  onChange: (field: string, value: any) => void
}

const serviceTypes = [
  {
    value: 'SEM_DADOS',
    title: 'Serviço sem captura de dados',
    description: 'Serviço simples, consulta ou emissão documental sem formulário estruturado.',
    icon: <FileText className="h-8 w-8" />,
    examples: [
      'Consulta de protocolo',
      'Emissão de certidão',
      'Solicitação simples de declaração',
    ],
    color: 'blue',
  },
  {
    value: 'COM_DADOS',
    title: 'Serviço com captura de dados',
    description: 'Captura dados estruturados e pode alimentar módulos específicos do sistema.',
    icon: <Database className="h-8 w-8" />,
    examples: [
      'Matrícula de aluno',
      'Agendamento de consulta',
      'Cadastro de produtor rural',
    ],
    color: 'green',
  },
]

const NO_DATA_ICON_MAP: Record<string, ReactNode> = {
  CONSULTA_PUBLICA: <Search className="h-5 w-5" />,
  CONSULTA_AUTENTICADA: <LockKeyhole className="h-5 w-5" />,
  EMISSAO_AUTOMATICA: <Zap className="h-5 w-5" />,
  EMISSAO_ASSISTIDA: <FileText className="h-5 w-5" />,
  SOLICITACAO_SIMPLES: <FileText className="h-5 w-5" />,
}

export function ServiceTypeStep({ formData, onChange }: ServiceTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Tipo de serviço</Label>
        <p className="text-sm text-gray-600">
          Defina primeiro se o serviço captura dados. Para serviços sem dados, escolha também o modelo operacional.
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

              if (type.value === 'SEM_DADOS') {
                onChange('moduleType', '')
                onChange('formSchema', null)
                if (!formData.serviceSubtype) {
                  onChange('serviceSubtype', 'SOLICITACAO_SIMPLES')
                }
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
                <p className="text-xs font-medium text-gray-500 uppercase">Exemplos</p>
                <ul className="space-y-1">
                  {type.examples.map((example) => (
                    <li key={example} className="text-xs text-gray-600 flex items-start">
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

      {formData.serviceType === 'SEM_DADOS' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Modelo do serviço sem dados</Label>
            <p className="text-sm text-gray-600">
              Esse modo define se o serviço gera workflow, se vira consulta direta ou se emite documento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NO_DATA_SUBTYPE_OPTIONS.map((option) => (
              <Card
                key={option.value}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  formData.serviceSubtype === option.value
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-gray-300'
                )}
                onClick={() => onChange('serviceSubtype', option.value)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-gray-100 text-gray-700">
                        {NO_DATA_ICON_MAP[option.value]}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{option.title}</h4>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        formData.serviceSubtype === option.value
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      )}
                    >
                      {formData.serviceSubtype === option.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">Regra nova para workflows</p>
            <p className="text-xs text-blue-700">
              Consultas públicas e autenticadas deixam de ganhar workflow automático. Emissão automática,
              emissão assistida e solicitação simples continuam com fluxo enxuto e coerente com o serviço.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
