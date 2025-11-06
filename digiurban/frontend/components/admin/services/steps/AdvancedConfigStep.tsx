'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Settings, FileText, MapPin, Calendar, BarChart, GitBranch, Sliders, FileSearch, Bell } from 'lucide-react'

// Import config components
import { CustomFormConfig } from '../config/CustomFormConfig'
import { LocationConfig } from '../config/LocationConfig'
import { SchedulingConfig } from '../config/SchedulingConfig'
import { SurveyConfig } from '../config/SurveyConfig'
import { WorkflowConfig } from '../config/WorkflowConfig'
import { CustomFieldsConfig } from '../config/CustomFieldsConfig'
import { AdvancedDocsConfig } from '../config/AdvancedDocsConfig'
import { NotificationsConfig } from '../config/NotificationsConfig'

interface AdvancedConfigStepProps {
  formData: any
  onChange: (field: string, value: any) => void
}

const featureConfigs = [
  {
    key: 'hasCustomForm',
    name: 'Formulário Customizado',
    icon: FileText,
    color: 'blue',
    component: CustomFormConfig,
  },
  {
    key: 'hasLocation',
    name: 'Captura de Localização',
    icon: MapPin,
    color: 'green',
    component: LocationConfig,
  },
  {
    key: 'hasScheduling',
    name: 'Sistema de Agendamento',
    icon: Calendar,
    color: 'purple',
    component: SchedulingConfig,
  },
  {
    key: 'hasSurvey',
    name: 'Pesquisa de Satisfação',
    icon: BarChart,
    color: 'orange',
    component: SurveyConfig,
  },
  {
    key: 'hasCustomWorkflow',
    name: 'Workflow Customizado',
    icon: GitBranch,
    color: 'indigo',
    component: WorkflowConfig,
  },
  {
    key: 'hasCustomFields',
    name: 'Campos Personalizados',
    icon: Sliders,
    color: 'pink',
    component: CustomFieldsConfig,
  },
  {
    key: 'hasAdvancedDocs',
    name: 'Documentos Inteligentes',
    icon: FileSearch,
    color: 'teal',
    component: AdvancedDocsConfig,
  },
  {
    key: 'hasNotifications',
    name: 'Sistema de Notificações',
    icon: Bell,
    color: 'red',
    component: NotificationsConfig,
  },
]

export function AdvancedConfigStep({ formData, onChange }: AdvancedConfigStepProps) {
  const activeFeatures = featureConfigs.filter((f) => formData[f.key])

  if (activeFeatures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Configurações Avançadas</p>
            <p className="text-xs text-blue-700 mt-1">
              Configure detalhadamente os recursos ativados para este serviço.
            </p>
          </div>
        </div>

        <div className="p-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 font-medium">Nenhum recurso para configurar</p>
          <p className="text-xs text-gray-500 mt-2">
            Volte à etapa anterior e ative alguns recursos para poder configurá-los aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <Settings className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-900">Configurações Detalhadas</p>
          <p className="text-xs text-purple-700 mt-1">
            Configure os {activeFeatures.length} recurso{activeFeatures.length > 1 ? 's' : ''} ativado{activeFeatures.length > 1 ? 's' : ''}.
            Cada recurso possui configurações específicas para personalizar seu funcionamento.
          </p>
        </div>
        <Badge className="bg-purple-600 text-white">
          {activeFeatures.length} recurso{activeFeatures.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recursos Ativados</CardTitle>
          <CardDescription>
            Configure cada recurso usando as abas abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeFeatures[0]?.key} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
              {activeFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <TabsTrigger
                    key={feature.key}
                    value={feature.key}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{feature.name}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {activeFeatures.map((feature) => {
              const ConfigComponent = feature.component
              return (
                <TabsContent key={feature.key} value={feature.key} className="mt-6">
                  <ConfigComponent formData={formData} onChange={onChange} />
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900">
              Dica de Configuração
            </p>
            <p className="text-xs text-blue-700 mt-1">
              As configurações podem ser editadas posteriormente na página de edição do serviço.
              Não se preocupe em deixar tudo perfeito agora - você poderá refinar depois.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
