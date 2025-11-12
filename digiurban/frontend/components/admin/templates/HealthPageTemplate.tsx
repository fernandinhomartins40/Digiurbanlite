'use client'

import React, { useState, ReactNode } from 'react'
import BasePageTemplate, { PageSection, PageAction } from './BasePageTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Heart,
  Calendar,
  Pill,
  Activity,
  Stethoscope,
  Ambulance,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Search,
  BarChart3,
  Plus,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export interface HealthPageTemplateProps {
  pageType: 'atendimentos' | 'agendamentos' | 'medicamentos' | 'campanhas' | 'programas' | 'tfd' | 'exames' | 'acs' | 'transporte' | 'dashboard'
  customSections?: PageSection[]
  onPatientRegister?: (patient: any) => void
  onAppointmentSchedule?: (appointment: any) => void
  onMedicationDispense?: (medication: any) => void
  onCampaignEnroll?: (campaign: any, patient: any) => void
  onTfdRequest?: (request: any) => void
}

type PageType = 'atendimentos' | 'agendamentos' | 'medicamentos' | 'campanhas' | 'programas' | 'tfd' | 'exames' | 'acs' | 'transporte' | 'dashboard';

export default function HealthPageTemplate({
  pageType,
  customSections = [],
  onPatientRegister,
  onAppointmentSchedule,
  onMedicationDispense,
  onCampaignEnroll,
  onTfdRequest
}: HealthPageTemplateProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Page configurations por tipo
  const pageConfigs: Partial<Record<PageType, { title: string; description: string; sections: PageSection[] }>> = {
    atendimentos: {
      title: 'Atendimentos Médicos',
      description: 'PDV para consultas médicas, emergências e especialidades',
      sections: [
        {
          id: 'consultas',
          title: 'Consultas Gerais',
          description: 'Agendamento e gestão de consultas médicas básicas',
          icon: Stethoscope,
          stats: { total: 450, completed: 320, pending: 130 },
          component: <ConsultasSection onSchedule={onAppointmentSchedule} />
        },
        {
          id: 'emergencias',
          title: 'Emergências',
          description: 'Atendimento prioritário para casos urgentes',
          icon: Ambulance,
          stats: { total: 89, completed: 75, pending: 14 },
          component: <EmergenciasSection />
        },
        {
          id: 'especialidades',
          title: 'Especialidades',
          description: 'Consultas com médicos especialistas',
          icon: Heart,
          stats: { total: 234, completed: 190, pending: 44 },
          component: <EspecialidadesSection />
        },
        {
          id: 'prontuarios',
          title: 'Prontuários',
          description: 'Gestão de prontuários e histórico médico',
          icon: FileText,
          stats: { total: 1250, completed: 1250, pending: 0 },
          component: <ProntuariosSection />
        }
      ]
    },

    agendamentos: {
      title: 'Agendamentos Médicos',
      description: 'Calendário médico, slots de horário e gestão de agenda',
      sections: [
        {
          id: 'calendario',
          title: 'Calendário Médico',
          description: 'Visualização e gestão da agenda médica',
          icon: Calendar,
          component: <CalendarioMedicoSection />
        },
        {
          id: 'slots',
          title: 'Gestão de Slots',
          description: 'Configuração de horários disponíveis',
          icon: Clock,
          component: <SlotsSection />
        },
        {
          id: 'reagendamentos',
          title: 'Reagendamentos',
          description: 'Alteração de horários de consultas',
          icon: TrendingUp,
          component: <ReagendamentosSection />
        },
        {
          id: 'lista-espera',
          title: 'Lista de Espera',
          description: 'Gestão de fila de espera para consultas',
          icon: Users,
          component: <ListaEsperaSection />
        }
      ]
    },

    medicamentos: {
      title: 'Controle de Medicamentos',
      description: 'Farmácia básica, estoque, dispensação e prescrições',
      sections: [
        {
          id: 'estoque',
          title: 'Estoque',
          description: 'Controle de medicamentos disponíveis',
          icon: Pill,
          stats: { total: 456, completed: 398, pending: 58 },
          component: <EstoqueMedicamentosSection />
        },
        {
          id: 'dispensacao',
          title: 'Dispensação',
          description: 'Entrega de medicamentos prescritos',
          icon: User,
          component: <DispensacaoSection onDispense={onMedicationDispense} />
        },
        {
          id: 'prescricoes',
          title: 'Prescrições',
          description: 'Gestão de receitas médicas',
          icon: FileText,
          component: <PrescricoesSection />
        },
        {
          id: 'alto-custo',
          title: 'Alto Custo',
          description: 'Medicamentos de alto custo e procedimentos especiais',
          icon: AlertCircle,
          component: <AltoCustoSection />
        }
      ]
    },

    campanhas: {
      title: 'Campanhas de Saúde',
      description: 'Gestão de campanhas preventivas e de imunização',
      sections: [
        {
          id: 'vacinacao',
          title: 'Campanhas de Vacinação',
          description: 'Gestão de campanhas de imunização',
          icon: Activity,
          component: <CampanhasVacinacaoSection onEnroll={onCampaignEnroll} />
        },
        {
          id: 'preventivas',
          title: 'Campanhas Preventivas',
          description: 'Prevenção e educação em saúde',
          icon: Heart,
          component: <CampanhasPreventivasSection />
        },
        {
          id: 'metas',
          title: 'Metas de Cobertura',
          description: 'Acompanhamento de metas e indicadores',
          icon: TrendingUp,
          component: <MetasCobertura />
        },
        {
          id: 'logistica',
          title: 'Logística',
          description: 'Organização logística das campanhas',
          icon: MapPin,
          component: <LogisticaCampanhas />
        }
      ]
    },

    // Configurações para outros tipos de página...
    dashboard: {
      title: 'Dashboard Saúde',
      description: 'Indicadores consolidados da secretaria de saúde',
      sections: [
        {
          id: 'indicadores',
          title: 'Indicadores Gerais',
          description: 'Métricas consolidadas de saúde pública',
          icon: BarChart3,
          component: <IndicadoresSaudeSection />
        }
      ]
    }
  }

  const config = pageConfigs[pageType] || pageConfigs.dashboard || {
    title: 'Página de Saúde',
    description: 'Gestão de serviços de saúde',
    sections: []
  }

  const quickActions: PageAction[] = [
    {
      id: 'novo-atendimento',
      label: 'Novo Atendimento',
      description: 'Registrar novo atendimento médico',
      icon: Plus,
      onClick: () => onPatientRegister?.({})
    },
    {
      id: 'emergencia',
      label: 'Emergência',
      description: 'Atendimento de emergência',
      icon: Ambulance,
      onClick: () => console.log('Emergência acionada'),
      variant: 'destructive' as const
    }
  ]

  const stats = {
    protocolsAtivos: 127,
    servicosDisponiveis: 15,
    atendimentosMes: 2450,
    tempoMedioAtendimento: 2.5
  }

  const sidebarItems = [
    { id: 'atendimentos', label: 'Atendimentos', href: '/admin/secretarias/saude/atendimentos', icon: Stethoscope, active: pageType === 'atendimentos' },
    { id: 'agendamentos', label: 'Agendamentos', href: '/admin/secretarias/saude/agendamentos', icon: Calendar, active: pageType === 'agendamentos' },
    { id: 'medicamentos', label: 'Medicamentos', href: '/admin/secretarias/saude/medicamentos', icon: Pill, active: pageType === 'medicamentos' },
    { id: 'campanhas', label: 'Campanhas', href: '/admin/secretarias/saude/campanhas', icon: Activity, active: pageType === 'campanhas' },
    { id: 'programas', label: 'Programas', href: '/admin/secretarias/saude/programas', icon: Heart, active: pageType === 'programas' },
    { id: 'tfd', label: 'TFD', href: '/admin/secretarias/saude/tfd', icon: MapPin, active: pageType === 'tfd' },
    { id: 'exames', label: 'Exames', href: '/admin/secretarias/saude/exames', icon: FileText, active: pageType === 'exames' },
    { id: 'acs', label: 'ACS', href: '/admin/secretarias/saude/acs', icon: Users, active: pageType === 'acs' },
    { id: 'transporte', label: 'Transporte', href: '/admin/secretarias/saude/transporte', icon: Ambulance, active: pageType === 'transporte' },
    { id: 'dashboard', label: 'Dashboard', href: '/admin/secretarias/saude/dashboard', icon: BarChart3, active: pageType === 'dashboard' }
  ]

  const customHeader = (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar pacientes, consultas, medicamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Badge variant="outline" className="bg-red-50 text-red-700">
        Saúde Pública
      </Badge>
    </div>
  )

  return (
    <BasePageTemplate
      title={config.title}
      description={config.description}
      secretaria="saude"
      pageName={pageType}
      sections={[...config.sections, ...customSections]}
      quickActions={quickActions}
      stats={stats}
      sidebarItems={sidebarItems}
      customHeader={customHeader}
      onServiceGeneration={() => console.log('Gerando serviços automaticamente...')}
    />
  )
}

// Componentes específicos da Saúde
function ConsultasSection({ onSchedule }: { onSchedule?: (appointment: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Consultas do Dia</h3>
        <Button onClick={() => onSchedule?.({})}>
          <Plus className="w-4 h-4 mr-2" />
          Agendar Consulta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Paciente {item}</p>
                  <p className="text-sm text-gray-500">08:00 - Dr. Silva</p>
                </div>
                <Badge variant={item % 3 === 0 ? "default" : "secondary"}>
                  {item % 3 === 0 ? "Agendado" : "Concluído"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EmergenciasSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <Ambulance className="w-5 h-5 mr-2" />
              Emergências Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">3</div>
            <p className="text-sm text-red-600">Requer atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atendimentos de Urgência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-gray-500">Hoje</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EspecialidadesSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia'].map((especialidade) => (
          <Card key={especialidade}>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="font-medium">{especialidade}</p>
              <p className="text-sm text-gray-500">12 consultas</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ProntuariosSection() {
  return (
    <div className="space-y-4">
      <p>Sistema de prontuários eletrônicos e histórico médico dos pacientes.</p>
    </div>
  )
}

function CalendarioMedicoSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className={`p-2 border rounded text-center ${i % 7 === 0 || i % 7 === 6 ? 'bg-gray-100' : 'bg-white hover:bg-blue-50'}`}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlotsSection() {
  return <div>Gestão de slots de horário disponíveis para agendamento.</div>
}

function ReagendamentosSection() {
  return <div>Interface para reagendamento de consultas médicas.</div>
}

function ListaEsperaSection() {
  return <div>Gestão de lista de espera para consultas especializadas.</div>
}

function EstoqueMedicamentosSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Paracetamol', 'Dipirona', 'Amoxicilina'].map((medicamento) => (
          <Card key={medicamento}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{medicamento}</p>
                  <p className="text-sm text-gray-500">Estoque: 450 unidades</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DispensacaoSection({ onDispense }: { onDispense?: (medication: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onDispense?.({})}>
        <Pill className="w-4 h-4 mr-2" />
        Nova Dispensação
      </Button>
      <p>Interface para dispensação de medicamentos prescritos.</p>
    </div>
  )
}

function PrescricoesSection() {
  return <div>Gestão de prescrições médicas e receitas.</div>
}

function AltoCustoSection() {
  return <div>Medicamentos de alto custo e procedimentos especiais.</div>
}

function CampanhasVacinacaoSection({ onEnroll }: { onEnroll?: (campaign: any, patient: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onEnroll?.({}, {})}>
        <Activity className="w-4 h-4 mr-2" />
        Inscrever em Campanha
      </Button>
      <p>Gestão de campanhas de vacinação e imunização.</p>
    </div>
  )
}

function CampanhasPreventivasSection() {
  return <div>Campanhas de prevenção e educação em saúde.</div>
}

function MetasCobertura() {
  return <div>Acompanhamento de metas de cobertura das campanhas.</div>
}

function LogisticaCampanhas() {
  return <div>Organização logística das campanhas de saúde.</div>
}

function IndicadoresSaudeSection() {
  return <div>Indicadores consolidados da secretaria de saúde.</div>
}