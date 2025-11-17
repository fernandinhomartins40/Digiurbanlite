'use client'

import React, { useState } from 'react'
import BasePageTemplate, { PageSection, PageAction } from './BasePageTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  HandHeart,
  Users,
  Home,
  Heart,
  Package,
  MapPin,
  FileText,
  Calendar,
  BarChart3,
  Search,
  Plus,
  UserPlus,
  Shield,
  DollarSign,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export interface SocialPageTemplateProps {
  pageType: 'atendimentos' | 'familias-vulneraveis' | 'cras-creas' | 'programas-sociais' | 'beneficios' | 'entregas-emergenciais' | 'registro-visitas' | 'dashboard'
  customSections?: PageSection[]
  onFamilyRegister?: (family: any) => void
  onBenefitRequest?: (benefit: any) => void
  onEmergencyDelivery?: (delivery: any) => void
  onVisitSchedule?: (visit: any) => void
  onSocialSupport?: (support: any) => void
}

export default function SocialPageTemplate({
  pageType,
  customSections = [],
  onFamilyRegister,
  onBenefitRequest,
  onEmergencyDelivery,
  onVisitSchedule,
  onSocialSupport
}: SocialPageTemplateProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const pageConfigs = {
    atendimentos: {
      title: 'Atendimentos Assistência Social',
      description: 'PDV para auxílios, cestas básicas e acompanhamento social',
      sections: [
        {
          id: 'auxilios',
          title: 'Solicitações de Auxílio',
          description: 'Atendimento para auxílios emergenciais',
          icon: HandHeart,
          stats: { total: 345, completed: 278, pending: 67 },
          component: <SolicitacoesAuxilioSection onRequest={onBenefitRequest} />
        },
        {
          id: 'denuncias',
          title: 'Denúncias de Violação',
          description: 'Registro de violação de direitos',
          icon: Shield,
          stats: { total: 23, completed: 18, pending: 5 },
          component: <DenunciasViolacaoSection />
        },
        {
          id: 'orientacao-social',
          title: 'Orientação Social',
          description: 'Orientação e encaminhamento social',
          icon: Users,
          stats: { total: 189, completed: 156, pending: 33 },
          component: <OrientacaoSocialSection onSupport={onSocialSupport} />
        },
        {
          id: 'encaminhamentos',
          title: 'Encaminhamentos',
          description: 'Encaminhamentos para serviços especializados',
          icon: MapPin,
          stats: { total: 134, completed: 102, pending: 32 },
          component: <EncaminhamentosAssistenciaisSection />
        }
      ]
    },

    'familias-vulneraveis': {
      title: 'Famílias Vulneráveis',
      description: 'Cadastro e acompanhamento de famílias em situação de vulnerabilidade',
      sections: [
        {
          id: 'cadastro-vulnerabilidade',
          title: 'Cadastro de Vulnerabilidade',
          description: 'Registro de famílias em situação de risco',
          icon: UserPlus,
          stats: { total: 567, completed: 450, pending: 117 },
          component: <CadastroVulnerabilidadeSection onRegister={onFamilyRegister} />
        },
        {
          id: 'acompanhamento-social',
          title: 'Acompanhamento Social',
          description: 'Acompanhamento longitudinal das famílias',
          icon: Calendar,
          stats: { total: 234, completed: 180, pending: 54 },
          component: <AcompanhamentoSocialSection />
        },
        {
          id: 'visitas-assistenciais',
          title: 'Visitas Assistenciais',
          description: 'Agendamento e controle de visitas domiciliares',
          icon: Home,
          stats: { total: 123, completed: 98, pending: 25 },
          component: <VisitasAssistenciaisSection onSchedule={onVisitSchedule} />
        },
        {
          id: 'estudos-sociais',
          title: 'Estudos Sociais',
          description: 'Elaboração de estudos socioeconômicos',
          icon: FileText,
          stats: { total: 89, completed: 67, pending: 22 },
          component: <EstudosSociaisSection />
        }
      ]
    },

    'cras-creas': {
      title: 'CRAS e CREAS',
      description: 'Gestão das unidades do Sistema Único de Assistência Social',
      sections: [
        {
          id: 'atendimento-cras',
          title: 'Atendimento CRAS',
          description: 'Atendimentos nos Centros de Referência',
          icon: Home,
          component: <AtendimentoCRASSection />
        },
        {
          id: 'acompanhamento-creas',
          title: 'Acompanhamento CREAS',
          description: 'Acompanhamento especializado',
          icon: Shield,
          component: <AcompanhamentoCREASSection />
        },
        {
          id: 'grupos-convivencia',
          title: 'Grupos de Convivência',
          description: 'Gestão de grupos e atividades coletivas',
          icon: Users,
          component: <GruposConvivenciaSection />
        },
        {
          id: 'oficinas-sociais',
          title: 'Oficinas Sociais',
          description: 'Oficinas socioeducativas e profissionalizantes',
          icon: Heart,
          component: <OficinasSociaisSection />
        }
      ]
    },

    'programas-sociais': {
      title: 'Programas Sociais',
      description: 'Administração de programas municipais de assistência social',
      sections: [
        {
          id: 'inscricao-programas',
          title: 'Inscrição em Programas',
          description: 'Cadastro para programas sociais municipais',
          icon: UserPlus,
          stats: { total: 1200, completed: 980, pending: 220 },
          component: <InscricaoProgramasSection />
        },
        {
          id: 'renovacao-beneficios',
          title: 'Renovação de Benefícios',
          description: 'Renovação anual de benefícios sociais',
          icon: Calendar,
          stats: { total: 456, completed: 389, pending: 67 },
          component: <RenovacaoBeneficiosSection />
        },
        {
          id: 'auxilio-emergencial',
          title: 'Auxílio Emergencial',
          description: 'Auxílios emergenciais municipais',
          icon: AlertCircle,
          stats: { total: 234, completed: 198, pending: 36 },
          component: <AuxilioEmergencialSection />
        },
        {
          id: 'transferencia-renda',
          title: 'Transferência de Renda',
          description: 'Programas municipais de transferência de renda',
          icon: DollarSign,
          stats: { total: 890, completed: 750, pending: 140 },
          component: <TransferenciaRendaSection />
        }
      ]
    },

    beneficios: {
      title: 'Gerenciamento de Benefícios',
      description: 'Controle de benefícios financeiros, materiais e serviços',
      sections: [
        {
          id: 'beneficios-eventuais',
          title: 'Benefícios Eventuais',
          description: 'Benefícios de caráter eventual e emergencial',
          icon: Package,
          stats: { total: 345, completed: 289, pending: 56 },
          component: <BeneficiosEventuaisSection />
        },
        {
          id: 'auxilio-funeral',
          title: 'Auxílio Funeral',
          description: 'Auxílio para despesas funerárias',
          icon: HandHeart,
          stats: { total: 12, completed: 10, pending: 2 },
          component: <AuxilioFuneralSection />
        },
        {
          id: 'auxilio-natalidade',
          title: 'Auxílio Natalidade',
          description: 'Auxílio para famílias com recém-nascidos',
          icon: Heart,
          stats: { total: 67, completed: 59, pending: 8 },
          component: <AuxilioNatalidadeSection />
        },
        {
          id: 'cartao-alimentacao',
          title: 'Cartão Alimentação',
          description: 'Programa de cartão alimentação familiar',
          icon: DollarSign,
          stats: { total: 456, completed: 398, pending: 58 },
          component: <CartaoAlimentacaoSection />
        }
      ]
    },

    'entregas-emergenciais': {
      title: 'Entregas Emergenciais',
      description: 'Sistema logístico para distribuição de itens essenciais',
      sections: [
        {
          id: 'cestas-basicas',
          title: 'Cestas Básicas',
          description: 'Distribuição de cestas básicas emergenciais',
          icon: Package,
          stats: { total: 234, completed: 198, pending: 36 },
          component: <CestasBasicasSection onDelivery={onEmergencyDelivery} />
        },
        {
          id: 'kit-higiene',
          title: 'Kit Higiene',
          description: 'Distribuição de kits de higiene e limpeza',
          icon: Package,
          stats: { total: 123, completed: 98, pending: 25 },
          component: <KitHigieneSection />
        },
        {
          id: 'auxilio-vulnerabilidade',
          title: 'Auxílio Vulnerabilidade',
          description: 'Apoio material para famílias vulneráveis',
          icon: HandHeart,
          stats: { total: 89, completed: 67, pending: 22 },
          component: <AuxilioVulnerabilidadeSection />
        },
        {
          id: 'doacao-roupas',
          title: 'Doação de Roupas',
          description: 'Distribuição de roupas e calçados',
          icon: Heart,
          stats: { total: 156, completed: 134, pending: 22 },
          component: <DoacaoRoupasSection />
        }
      ]
    },

    'registro-visitas': {
      title: 'Registro de Visitas',
      description: 'Controle de visitas domiciliares e territorialização',
      sections: [
        {
          id: 'visitas-domiciliares',
          title: 'Visitas Domiciliares',
          description: 'Agendamento e controle de visitas sociais',
          icon: Home,
          stats: { total: 456, completed: 389, pending: 67 },
          component: <VisitasDomiciliaresSection onSchedule={onVisitSchedule} />
        },
        {
          id: 'acompanhamento-familiar',
          title: 'Acompanhamento Familiar',
          description: 'Acompanhamento longitudinal das famílias',
          icon: Users,
          stats: { total: 234, completed: 198, pending: 36 },
          component: <AcompanhamentoFamiliarSection />
        },
        {
          id: 'busca-ativa-social',
          title: 'Busca Ativa Social',
          description: 'Identificação proativa de vulnerabilidades',
          icon: Search,
          stats: { total: 123, completed: 98, pending: 25 },
          component: <BuscaAtivaSocialSection />
        },
        {
          id: 'territorializacao',
          title: 'Territorialização',
          description: 'Mapeamento territorial das demandas sociais',
          icon: MapPin,
          component: <TerritorializacaoSection />
        }
      ]
    },

    dashboard: {
      title: 'Dashboard Assistência Social',
      description: 'Indicadores consolidados da assistência social',
      sections: [
        {
          id: 'indicadores-sociais',
          title: 'Indicadores Sociais',
          description: 'Métricas consolidadas da assistência social',
          icon: BarChart3,
          component: <IndicadoresSociaisSection />
        },
        {
          id: 'familias-atendidas',
          title: 'Famílias Atendidas',
          description: 'Estatísticas de famílias em acompanhamento',
          icon: Users,
          component: <FamiliasAtendidasSection />
        },
        {
          id: 'equipamentos-suas',
          title: 'Equipamentos SUAS',
          description: 'Panorama dos equipamentos socioassistenciais',
          icon: Home,
          component: <EquipamentosSUASSection />
        }
      ]
    }
  }

  const config = pageConfigs[pageType] || pageConfigs.dashboard

  const quickActions: PageAction[] = [
    {
      id: 'cadastrar-familia',
      label: 'Cadastrar Família',
      description: 'Registrar nova família vulnerável',
      icon: UserPlus,
      onClick: () => onFamilyRegister?.({})
    },
    {
      id: 'solicitar-auxilio',
      label: 'Solicitar Auxílio',
      description: 'Nova solicitação de auxílio',
      icon: HandHeart,
      onClick: () => onBenefitRequest?.({})
    },
    {
      id: 'entrega-emergencial',
      label: 'Entrega Emergencial',
      description: 'Agendar entrega emergencial',
      icon: Truck,
      onClick: () => onEmergencyDelivery?.({}),
      variant: 'outline' as const
    }
  ]

  const stats = {
    protocolsAtivos: 156,
    servicosDisponiveis: 18,
    atendimentosMes: 2340,
    tempoMedioAtendimento: 3.2
  }

  const sidebarItems = [
    { id: 'atendimentos', label: 'Atendimentos', href: '/admin/secretarias/assistencia-social/atendimentos', icon: HandHeart, active: pageType === 'atendimentos' },
    { id: 'familias-vulneraveis', label: 'Famílias Vulneráveis', href: '/admin/secretarias/assistencia-social/familias-vulneraveis', icon: Users, active: pageType === 'familias-vulneraveis' },
    { id: 'cras-creas', label: 'CRAS e CREAS', href: '/admin/secretarias/assistencia-social/cras-creas', icon: Home, active: pageType === 'cras-creas' },
    { id: 'programas-sociais', label: 'Programas Sociais', href: '/admin/secretarias/assistencia-social/programas-sociais', icon: Heart, active: pageType === 'programas-sociais' },
    { id: 'beneficios', label: 'Benefícios', href: '/admin/secretarias/assistencia-social/beneficios', icon: DollarSign, active: pageType === 'beneficios' },
    { id: 'entregas-emergenciais', label: 'Entregas', href: '/admin/secretarias/assistencia-social/entregas-emergenciais', icon: Package, active: pageType === 'entregas-emergenciais' },
    { id: 'registro-visitas', label: 'Visitas', href: '/admin/secretarias/assistencia-social/registro-visitas', icon: Calendar, active: pageType === 'registro-visitas' },
    { id: 'dashboard', label: 'Dashboard', href: '/admin/secretarias/assistencia-social/dashboard', icon: BarChart3, active: pageType === 'dashboard' }
  ]

  const customHeader = (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar famílias, benefícios, auxílios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Badge variant="outline" className="bg-green-50 text-green-700">
        Assistência Social
      </Badge>
    </div>
  )

  return (
    <BasePageTemplate
      title={config.title}
      description={config.description}
      secretaria="assistencia-social"
      pageName={pageType}
      sections={[...config.sections, ...customSections]}
      quickActions={quickActions}
      stats={stats}
      sidebarItems={sidebarItems}
      customHeader={customHeader}
      onServiceGeneration={() => console.log('Gerando serviços sociais...')}
    />
  )
}

// Componentes específicos da Assistência Social
function SolicitacoesAuxilioSection({ onRequest }: { onRequest?: (benefit: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Auxílios Solicitados</h3>
        <Button onClick={() => onRequest?.({})}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Auxílio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Auxílio Funeral', 'Auxílio Natalidade', 'Cesta Básica', 'Kit Higiene', 'Auxílio Aluguel', 'Medicamentos'].map((tipo, index) => (
          <Card key={tipo}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tipo}</p>
                  <p className="text-sm text-gray-500">{5 + index * 2} solicitações</p>
                </div>
                <Badge variant={index % 3 === 0 ? "default" : "secondary"}>
                  {index % 3 === 0 ? "Pendente" : "Aprovado"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DenunciasViolacaoSection() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="font-medium text-red-800">Denúncias de Violação de Direitos</h3>
        </div>
        <p className="text-sm text-red-700 mt-2">
          Canal seguro para denúncias de violação de direitos sociais e humanos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Denúncias Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">5</div>
            <p className="text-sm text-red-600">Em investigação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Casos Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-sm text-gray-500">Este mês</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OrientacaoSocialSection({ onSupport }: { onSupport?: (support: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onSupport?.({})}>
        <Users className="w-4 h-4 mr-2" />
        Nova Orientação
      </Button>
      <p>Sistema de orientação e encaminhamento social para famílias.</p>
    </div>
  )
}

function EncaminhamentosAssistenciaisSection() {
  return <div>Encaminhamentos para serviços especializados de assistência social.</div>
}

function CadastroVulnerabilidadeSection({ onRegister }: { onRegister?: (family: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Famílias Cadastradas</h3>
        <Button onClick={() => onRegister?.({})}>
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar Família
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Família Silva {item}</p>
                  <p className="text-sm text-gray-500">4 membros - Vulnerabilidade Alta</p>
                </div>
                <Badge variant={item % 3 === 0 ? "destructive" : "secondary"}>
                  {item % 3 === 0 ? "Alto Risco" : "Acompanhamento"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AcompanhamentoSocialSection() {
  return <div>Sistema de acompanhamento longitudinal das famílias vulneráveis.</div>
}

function VisitasAssistenciaisSection({ onSchedule }: { onSchedule?: (visit: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onSchedule?.({})}>
        <Calendar className="w-4 h-4 mr-2" />
        Agendar Visita
      </Button>
      <p>Agendamento e controle de visitas domiciliares assistenciais.</p>
    </div>
  )
}

function EstudosSociaisSection() {
  return <div>Elaboração de estudos socioeconômicos para análise de casos.</div>
}

function AtendimentoCRASSection() {
  return <div>Atendimentos nos Centros de Referência de Assistência Social.</div>
}

function AcompanhamentoCREASSection() {
  return <div>Acompanhamento especializado nos CREAS.</div>
}

function GruposConvivenciaSection() {
  return <div>Gestão de grupos de convivência e fortalecimento de vínculos.</div>
}

function OficinasSociaisSection() {
  return <div>Oficinas socioeducativas e de geração de renda.</div>
}

function InscricaoProgramasSection() {
  return <div>Cadastro para programas sociais municipais.</div>
}

function RenovacaoBeneficiosSection() {
  return <div>Renovação anual de benefícios sociais.</div>
}

function AuxilioEmergencialSection() {
  return <div>Gestão de auxílios emergenciais municipais.</div>
}

function TransferenciaRendaSection() {
  return <div>Programas municipais de transferência de renda.</div>
}

function BeneficiosEventuaisSection() {
  return <div>Benefícios de caráter eventual e emergencial.</div>
}

function AuxilioFuneralSection() {
  return <div>Auxílio para despesas funerárias.</div>
}

function AuxilioNatalidadeSection() {
  return <div>Auxílio para famílias com recém-nascidos.</div>
}

function CartaoAlimentacaoSection() {
  return <div>Programa de cartão alimentação familiar.</div>
}

function CestasBasicasSection({ onDelivery }: { onDelivery?: (delivery: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Entregas de Cestas Básicas</h3>
        <Button onClick={() => onDelivery?.({})}>
          <Truck className="w-4 h-4 mr-2" />
          Agendar Entrega
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entregas Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">36</div>
            <p className="text-sm text-gray-500">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-sm text-gray-500">Cestas básicas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KitHigieneSection() {
  return <div>Distribuição de kits de higiene e limpeza.</div>
}

function AuxilioVulnerabilidadeSection() {
  return <div>Apoio material para famílias em situação de vulnerabilidade.</div>
}

function DoacaoRoupasSection() {
  return <div>Distribuição de roupas e calçados doados.</div>
}

function VisitasDomiciliaresSection({ onSchedule }: { onSchedule?: (visit: any) => void }) {
  return (
    <div className="space-y-4">
      <Button onClick={() => onSchedule?.({})}>
        <Home className="w-4 h-4 mr-2" />
        Agendar Visita Domiciliar
      </Button>
      <p>Sistema de agendamento e controle de visitas domiciliares.</p>
    </div>
  )
}

function AcompanhamentoFamiliarSection() {
  return <div>Acompanhamento longitudinal das famílias atendidas.</div>
}

function BuscaAtivaSocialSection() {
  return <div>Identificação proativa de situações de vulnerabilidade social.</div>
}

function TerritorializacaoSection() {
  return <div>Mapeamento territorial das demandas sociais.</div>
}

function IndicadoresSociaisSection() {
  return <div>Indicadores consolidados da assistência social municipal.</div>
}

function FamiliasAtendidasSection() {
  return <div>Estatísticas de famílias em acompanhamento social.</div>
}

function EquipamentosSUASSection() {
  return <div>Panorama dos equipamentos do Sistema Único de Assistência Social.</div>
}