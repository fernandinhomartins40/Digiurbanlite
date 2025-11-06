'use client'

import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  FileText,
  MapPin,
  Calendar,
  BarChart,
  GitBranch,
  Settings,
  FileSearch,
  Bell,
  Info,
  Check
} from 'lucide-react'

interface FeaturesStepProps {
  formData: {
    hasCustomForm: boolean
    hasLocation: boolean
    hasScheduling: boolean
    hasSurvey: boolean
    hasCustomWorkflow: boolean
    hasCustomFields: boolean
    hasAdvancedDocs: boolean
    hasNotifications: boolean
  }
  onChange: (field: string, value: any) => void
}

const features = [
  {
    key: 'hasCustomForm',
    icon: FileText,
    title: 'Formulário Customizado',
    description: 'Campos dinâmicos, validações personalizadas e formulários em múltiplas etapas',
    benefits: ['Campos condicionais', 'Validação em tempo real', 'Multi-step forms'],
    color: 'blue',
  },
  {
    key: 'hasLocation',
    icon: MapPin,
    title: 'Captura de Localização',
    description: 'GPS, endereço, fotos do local e validação por geofencing',
    benefits: ['Coordenadas GPS', 'Upload de fotos', 'Geofencing inteligente'],
    color: 'green',
  },
  {
    key: 'hasScheduling',
    icon: Calendar,
    title: 'Sistema de Agendamento',
    description: 'Calendário, horários disponíveis, lembretes e reagendamento',
    benefits: ['Calendário integrado', 'Notificações automáticas', 'Gestão de slots'],
    color: 'purple',
  },
  {
    key: 'hasSurvey',
    icon: BarChart,
    title: 'Pesquisa de Satisfação',
    description: 'Avaliações, feedback dos cidadãos e métricas de qualidade',
    benefits: ['NPS e CSAT', 'Comentários', 'Análise de sentimento'],
    color: 'orange',
  },
  {
    key: 'hasCustomWorkflow',
    icon: GitBranch,
    title: 'Workflow Customizado',
    description: 'Etapas personalizadas, aprovações e automações',
    benefits: ['Etapas flexíveis', 'Aprovações multi-nível', 'Automações inteligentes'],
    color: 'indigo',
  },
  {
    key: 'hasCustomFields',
    icon: Settings,
    title: 'Campos Personalizados',
    description: 'Dados adicionais específicos do serviço',
    benefits: ['Campos dinâmicos', 'Tipos variados', 'Validações customizadas'],
    color: 'pink',
  },
  {
    key: 'hasAdvancedDocs',
    icon: FileSearch,
    title: 'Documentos Inteligentes',
    description: 'OCR, validação com IA, extração automática de dados',
    benefits: ['OCR automático', 'Validação por IA', 'Extração de dados'],
    color: 'teal',
  },
  {
    key: 'hasNotifications',
    icon: Bell,
    title: 'Sistema de Notificações',
    description: 'Email, SMS, WhatsApp e notificações push',
    benefits: ['Multi-canal', 'Triggers personalizados', 'Templates customizados'],
    color: 'red',
  },
]

const colorClasses: Record<string, { border: string; bg: string; text: string; badgeBg: string }> = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', badgeBg: 'bg-blue-100' },
  green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', badgeBg: 'bg-green-100' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', badgeBg: 'bg-purple-100' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', badgeBg: 'bg-orange-100' },
  indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', badgeBg: 'bg-indigo-100' },
  pink: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-700', badgeBg: 'bg-pink-100' },
  teal: { border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-700', badgeBg: 'bg-teal-100' },
  red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', badgeBg: 'bg-red-100' },
}

export function FeaturesStep({ formData, onChange }: FeaturesStepProps) {
  const activeFeatures = features.filter((f) => formData[f.key as keyof typeof formData])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-900">Recursos Inteligentes</p>
          <p className="text-xs text-purple-700 mt-1">
            Ative funcionalidades avançadas para tornar seu serviço mais completo e eficiente.
            Você poderá configurar cada recurso detalhadamente na próxima etapa.
          </p>
        </div>
        {activeFeatures.length > 0 && (
          <Badge className="bg-purple-600 text-white">
            {activeFeatures.length} ativo{activeFeatures.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          const colors = colorClasses[feature.color]
          const isActive = formData[feature.key as keyof typeof formData]

          return (
            <Card
              key={feature.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? `${colors.border} ring-2 ring-offset-2 ring-${feature.color}-500` : 'border-gray-200'
              }`}
              onClick={() => onChange(feature.key, !isActive)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? colors.bg : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? colors.text : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {feature.title}
                        {isActive && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${isActive ? colors.badgeBg : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={feature.key} className="text-xs font-medium cursor-pointer">
                      {isActive ? 'Ativado' : 'Ativar recurso'}
                    </Label>
                    <Checkbox
                      id={feature.key}
                      checked={isActive}
                      onCheckedChange={(checked) => onChange(feature.key, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {activeFeatures.length === 0 && (
        <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Nenhum recurso ativado</p>
          <p className="text-xs text-gray-500 mt-1">
            Selecione os recursos que deseja habilitar para este serviço
          </p>
        </div>
      )}

      {activeFeatures.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {activeFeatures.length} recurso{activeFeatures.length > 1 ? 's' : ''} ativado{activeFeatures.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Na próxima etapa você poderá configurar detalhadamente cada recurso ativado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
