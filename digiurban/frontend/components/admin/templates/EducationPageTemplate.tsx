'use client'

import React, { useState } from 'react'
import BasePageTemplate, { PageSection, PageAction } from './BasePageTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  GraduationCap,
  Users,
  Bus,
  CalendarDays,
  AlertTriangle,
  FileText,
  UtensilsCrossed,
  BarChart3,
  Search,
  Plus,
  BookOpen,
  School,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react'

export interface EducationPageTemplateProps {
  pageType: 'atendimentos' | 'matriculas' | 'gestao-escolar' | 'transporte-escolar' | 'merenda-escolar' | 'registro-ocorrencias' | 'calendario-escolar' | 'dashboard'
  customSections?: PageSection[]
  onStudentEnroll?: (student: any) => void
  onTransferRequest?: (transfer: any) => void
  onTransportRequest?: (transport: any) => void
  onOccurrenceReport?: (occurrence: any) => void
}

export default function EducationPageTemplate({
  pageType,
  customSections = [],
  onStudentEnroll,
  onTransferRequest,
  onTransportRequest,
  onOccurrenceReport
}: EducationPageTemplateProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const pageConfigs = {
    atendimentos: {
      title: 'Atendimentos Educacionais',
      description: 'PDV para solicitações educacionais e protocolo escolar',
      sections: [
        {
          id: 'solicitacoes',
          title: 'Solicitações',
          description: 'Atendimento de demandas educacionais',
          icon: FileText,
          stats: { total: 234, completed: 180, pending: 54 },
          component: <SolicitacoesEducacionaisSection />
        },
        {
          id: 'informacoes',
          title: 'Informações Escolares',
          description: 'Consultas sobre escolas e vagas',
          icon: School,
          stats: { total: 456, completed: 400, pending: 56 },
          component: <InformacoesEscolaresSection />
        },
        {
          id: 'apoio',
          title: 'Apoio Educacional',
          description: 'Suporte e orientação educacional',
          icon: Users,
          stats: { total: 123, completed: 98, pending: 25 },
          component: <ApoioEducacionalSection />
        },
        {
          id: 'reclamacoes',
          title: 'Reclamações',
          description: 'Gestão de reclamações educacionais',
          icon: AlertTriangle,
          stats: { total: 45, completed: 38, pending: 7 },
          component: <ReclamacoesEducacionaisSection />
        }
      ]
    },

    matriculas: {
      title: 'Matrícula de Alunos',
      description: 'Sistema completo de matrícula, transferência e documentação',
      sections: [
        {
          id: 'novas-matriculas',
          title: 'Novas Matrículas',
          description: 'Processo de matrícula de novos alunos',
          icon: UserPlus,
          stats: { total: 1250, completed: 980, pending: 270 },
          component: <NovasMatriculasSection onEnroll={onStudentEnroll} />
        },
        {
          id: 'transferencias',
          title: 'Transferências',
          description: 'Transferências entre escolas municipais',
          icon: Users,
          stats: { total: 189, completed: 156, pending: 33 },
          component: <TransferenciasSection onTransfer={onTransferRequest} />
        },
        {
          id: 'rematriculas',
          title: 'Rematrículas',
          description: 'Renovação de matrículas para novo ano letivo',
          icon: GraduationCap,
          stats: { total: 2340, completed: 2100, pending: 240 },
          component: <RematriculasSection />
        },
        {
          id: 'documentos',
          title: 'Documentos',
          description: 'Segunda via e certificados escolares',
          icon: FileText,
          stats: { total: 567, completed: 523, pending: 44 },
          component: <DocumentosEscolaresSection />
        }
      ]
    },

    'gestao-escolar': {
      title: 'Gestão Escolar',
      description: 'Administração da rede municipal de ensino',
      sections: [
        {
          id: 'escolas',
          title: 'Escolas',
          description: 'Gestão das unidades escolares municipais',
          icon: School,
          component: <EscolasSection />
        },
        {
          id: 'professores',
          title: 'Professores',
          description: 'Gestão do corpo docente',
          icon: Users,
          component: <ProfessoresSection />
        },
        {
          id: 'infraestrutura',
          title: 'Infraestrutura',
          description: 'Controle de infraestrutura escolar',
          icon: BarChart3,
          component: <InfraestruturaSection />
        },
        {
          id: 'relatorios',
          title: 'Relatórios',
          description: 'Relatórios educacionais e estatísticas',
          icon: FileText,
          component: <RelatoriosEducacionaisSection />
        }
      ]
    },

    'transporte-escolar': {
      title: 'Transporte Escolar',
      description: 'Gestão de rotas, veículos e estudantes transportados',
      sections: [
        {
          id: 'rotas',
          title: 'Rotas',
          description: 'Gestão de rotas de transporte escolar',
          icon: Bus,
          component: <RotasTransporteSection />
        },
        {
          id: 'veiculos',
          title: 'Veículos',
          description: 'Controle da frota escolar',
          icon: Bus,
          component: <VeiculosSection />
        },
        {
          id: 'motoristas',
          title: 'Motoristas',
          description: 'Gestão de motoristas e monitores',
          icon: Users,
          component: <MotoristasSection />
        },
        {
          id: 'solicitacoes-transporte',
          title: 'Solicitações',
          description: 'Pedidos de transporte escolar',
          icon: FileText,
          stats: { total: 890, completed: 756, pending: 134 },
          component: <SolicitacoesTransporteSection onRequest={onTransportRequest} />
        }
      ]
    },

    'merenda-escolar': {
      title: 'Merenda Escolar',
      description: 'Gestão nutricional e cardápios escolares',
      sections: [
        {
          id: 'cardapios',
          title: 'Cardápios',
          description: 'Planejamento de cardápios escolares',
          icon: UtensilsCrossed,
          component: <CardapiosSection />
        },
        {
          id: 'dietas-especiais',
          title: 'Dietas Especiais',
          description: 'Gestão de dietas restritivas e especiais',
          icon: AlertTriangle,
          stats: { total: 45, completed: 38, pending: 7 },
          component: <DietasEspeciaisSection />
        },
        {
          id: 'estoque-alimentos',
          title: 'Estoque',
          description: 'Controle de estoque de alimentos',
          icon: BarChart3,
          component: <EstoqueAlimentosSection />
        },
        {
          id: 'nutricao',
          title: 'Informações Nutricionais',
          description: 'Dados nutricionais dos cardápios',
          icon: FileText,
          component: <InformacoesNutricionaisSection />
        }
      ]
    },

    'registro-ocorrencias': {
      title: 'Registro de Ocorrências',
      description: 'Sistema disciplinar e acompanhamento pedagógico',
      sections: [
        {
          id: 'ocorrencias-disciplinares',
          title: 'Ocorrências Disciplinares',
          description: 'Registro de problemas disciplinares',
          icon: AlertTriangle,
          stats: { total: 123, completed: 98, pending: 25 },
          component: <OcorrenciasDisciplinaresSection onReport={onOccurrenceReport} />
        },
        {
          id: 'acompanhamento-pedagogico',
          title: 'Acompanhamento Pedagógico',
          description: 'Acompanhamento de desenvolvimento dos alunos',
          icon: BookOpen,
          component: <AcompanhamentoPedagogicoSection />
        },
        {
          id: 'mediacao',
          title: 'Mediação Escolar',
          description: 'Processos de mediação e resolução de conflitos',
          icon: Users,
          component: <MediacaoEscolarSection />
        },
        {
          id: 'historico-ocorrencias',
          title: 'Histórico',
          description: 'Histórico de ocorrências por aluno',
          icon: FileText,
          component: <HistoricoOcorrenciasSection />
        }
      ]
    },

    'calendario-escolar': {
      title: 'Calendário Escolar',
      description: 'Gestão de eventos e cronograma educacional',
      sections: [
        {
          id: 'calendario-letivo',
          title: 'Calendário Letivo',
          description: 'Cronograma do ano letivo',
          icon: CalendarDays,
          component: <CalendarioLetivoSection />
        },
        {
          id: 'eventos-escolares',
          title: 'Eventos',
          description: 'Gestão de eventos educacionais',
          icon: Users,
          component: <EventosEscolaresSection />
        },
        {
          id: 'reunioes-pais',
          title: 'Reuniões de Pais',
          description: 'Agendamento de reuniões com responsáveis',
          icon: Users,
          component: <ReunioesPaisSection />
        },
        {
          id: 'feriados-letivos',
          title: 'Feriados Letivos',
          description: 'Gestão de feriados e pontos facultativos',
          icon: CalendarDays,
          component: <FeriadosLetivosSection />
        }
      ]
    },

    dashboard: {
      title: 'Dashboard Educação',
      description: 'Indicadores consolidados da secretaria de educação',
      sections: [
        {
          id: 'indicadores-educacionais',
          title: 'Indicadores Educacionais',
          description: 'Métricas consolidadas de educação',
          icon: BarChart3,
          component: <IndicadoresEducacionaisSection />
        },
        {
          id: 'desempenho-alunos',
          title: 'Desempenho dos Alunos',
          description: 'Estatísticas de aprovação e frequência',
          icon: GraduationCap,
          component: <DesempenhoAlunosSection />
        },
        {
          id: 'rede-escolar',
          title: 'Rede Escolar',
          description: 'Panorama da rede municipal de ensino',
          icon: School,
          component: <RedeEscolarSection />
        }
      ]
    }
  }

  const config = pageConfigs[pageType] || pageConfigs.dashboard

  const quickActions: PageAction[] = [
    {
      id: 'nova-matricula',
      label: 'Nova Matrícula',
      description: 'Matricular novo aluno',
      icon: UserPlus,
      onClick: () => onStudentEnroll?.({})
    },
    {
      id: 'transferencia',
      label: 'Transferência',
      description: 'Solicitar transferência',
      icon: Users,
      onClick: () => onTransferRequest?.({})
    },
    {
      id: 'ocorrencia',
      label: 'Registrar Ocorrência',
      description: 'Registrar nova ocorrência',
      icon: AlertTriangle,
      onClick: () => onOccurrenceReport?.({}),
      variant: 'outline' as const
    }
  ]

  const stats = {
    protocolsAtivos: 89,
    servicosDisponiveis: 12,
    atendimentosMes: 1890,
    tempoMedioAtendimento: 1.8
  }

  const sidebarItems = [
    { id: 'atendimentos', label: 'Atendimentos', href: '/admin/secretarias/educacao/atendimentos', icon: FileText, active: pageType === 'atendimentos' },
    { id: 'matriculas', label: 'Matrículas', href: '/admin/secretarias/educacao/matriculas', icon: UserPlus, active: pageType === 'matriculas' },
    { id: 'gestao-escolar', label: 'Gestão Escolar', href: '/admin/secretarias/educacao/gestao-escolar', icon: School, active: pageType === 'gestao-escolar' },
    { id: 'transporte-escolar', label: 'Transporte', href: '/admin/secretarias/educacao/transporte-escolar', icon: Bus, active: pageType === 'transporte-escolar' },
    { id: 'merenda-escolar', label: 'Merenda', href: '/admin/secretarias/educacao/merenda-escolar', icon: UtensilsCrossed, active: pageType === 'merenda-escolar' },
    { id: 'registro-ocorrencias', label: 'Ocorrências', href: '/admin/secretarias/educacao/registro-ocorrencias', icon: AlertTriangle, active: pageType === 'registro-ocorrencias' },
    { id: 'calendario-escolar', label: 'Calendário', href: '/admin/secretarias/educacao/calendario-escolar', icon: CalendarDays, active: pageType === 'calendario-escolar' },
    { id: 'dashboard', label: 'Dashboard', href: '/admin/secretarias/educacao/dashboard', icon: BarChart3, active: pageType === 'dashboard' }
  ]

  const customHeader = (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar alunos, escolas, matrículas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        Educação Municipal
      </Badge>
    </div>
  )

  return (
    <BasePageTemplate
      title={config.title}
      description={config.description}
      secretaria="educacao"
      pageName={pageType}
      sections={[...config.sections, ...customSections]}
      quickActions={quickActions}
      stats={stats}
      sidebarItems={sidebarItems}
      customHeader={customHeader}
      onServiceGeneration={() => console.log('Gerando serviços educacionais...')}
    />
  )
}

// Componentes específicos da Educação
function SolicitacoesEducacionaisSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Solicitação de Vaga', 'Informações Escolares', 'Apoio Educacional'].map((tipo, index) => (
          <Card key={tipo}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tipo}</p>
                  <p className="text-sm text-gray-500">{20 + index * 5} solicitações</p>
                </div>
                <Badge variant={index % 2 === 0 ? "default" : "secondary"}>
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function InformacoesEscolaresSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Escolas Municipais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-sm text-gray-500">Unidades ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vagas Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-sm text-gray-500">Para novo ano letivo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ApoioEducacionalSection() {
  return <div>Sistema de apoio e orientação educacional aos estudantes.</div>
}

function ReclamacoesEducacionaisSection() {
  return <div>Gestão de reclamações e demandas educacionais.</div>
}

function NovasMatriculasSection({ onEnroll }: { onEnroll?: (student: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Matrículas Pendentes</h3>
        <Button onClick={() => onEnroll?.({})}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Aluno {item}</p>
                  <p className="text-sm text-gray-500">5º Ano - Escola Municipal</p>
                </div>
                <Badge variant={item % 3 === 0 ? "default" : "secondary"}>
                  {item % 3 === 0 ? "Pendente" : "Aprovado"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TransferenciasSection({ onTransfer }: { onTransfer?: (transfer: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onTransfer?.({})}>
        <Users className="w-4 h-4 mr-2" />
        Solicitar Transferência
      </Button>
      <p>Interface para transferências entre escolas municipais.</p>
    </div>
  )
}

function RematriculasSection() {
  return <div>Sistema de rematrícula para renovação anual.</div>
}

function DocumentosEscolaresSection() {
  return <div>Emissão de segunda via de documentos escolares.</div>
}

function EscolasSection() {
  return <div>Gestão das unidades escolares municipais.</div>
}

function ProfessoresSection() {
  return <div>Gestão do corpo docente municipal.</div>
}

function InfraestruturaSection() {
  return <div>Controle de infraestrutura das escolas.</div>
}

function RelatoriosEducacionaisSection() {
  return <div>Relatórios educacionais e estatísticas.</div>
}

function RotasTransporteSection() {
  return <div>Gestão de rotas de transporte escolar.</div>
}

function VeiculosSection() {
  return <div>Controle da frota de transporte escolar.</div>
}

function MotoristasSection() {
  return <div>Gestão de motoristas e monitores escolares.</div>
}

function SolicitacoesTransporteSection({ onRequest }: { onRequest?: (transport: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onRequest?.({})}>
        <Bus className="w-4 h-4 mr-2" />
        Solicitar Transporte
      </Button>
      <p>Interface para solicitações de transporte escolar.</p>
    </div>
  )
}

function CardapiosSection() {
  return <div>Planejamento e gestão de cardápios escolares.</div>
}

function DietasEspeciaisSection() {
  return <div>Gestão de dietas especiais e restritivas.</div>
}

function EstoqueAlimentosSection() {
  return <div>Controle de estoque de alimentos da merenda.</div>
}

function InformacoesNutricionaisSection() {
  return <div>Informações nutricionais dos cardápios.</div>
}

function OcorrenciasDisciplinaresSection({ onReport }: { onReport?: (occurrence: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onReport?.({})}>
        <AlertTriangle className="w-4 h-4 mr-2" />
        Registrar Ocorrência
      </Button>
      <p>Sistema de registro de ocorrências disciplinares.</p>
    </div>
  )
}

function AcompanhamentoPedagogicoSection() {
  return <div>Acompanhamento pedagógico dos alunos.</div>
}

function MediacaoEscolarSection() {
  return <div>Processos de mediação escolar.</div>
}

function HistoricoOcorrenciasSection() {
  return <div>Histórico de ocorrências por aluno.</div>
}

function CalendarioLetivoSection() {
  return <div>Cronograma do ano letivo municipal.</div>
}

function EventosEscolaresSection() {
  return <div>Gestão de eventos educacionais.</div>
}

function ReunioesPaisSection() {
  return <div>Agendamento de reuniões com pais.</div>
}

function FeriadosLetivosSection() {
  return <div>Gestão de feriados e pontos facultativos.</div>
}

function IndicadoresEducacionaisSection() {
  return <div>Indicadores consolidados da educação municipal.</div>
}

function DesempenhoAlunosSection() {
  return <div>Estatísticas de desempenho dos alunos.</div>
}

function RedeEscolarSection() {
  return <div>Panorama da rede municipal de ensino.</div>
}