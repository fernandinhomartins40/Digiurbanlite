'use client'

import React, { useState } from 'react'
import BasePageTemplate, { PageSection, PageAction } from './BasePageTemplate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Palette,
  Shield,
  MapPin,
  Sprout,
  Trophy,
  Camera,
  Home,
  TreePine,
  Truck,
  FileText,
  Users,
  Settings,
  BarChart3,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'

// Mapear ícones por secretaria
const secretariaIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cultura': Palette,
  'seguranca': Shield,
  'planejamento': MapPin,
  'agricultura': Sprout,
  'esportes': Trophy,
  'turismo': Camera,
  'habitacao': Home,
  'meio-ambiente': TreePine,
  'obras': Truck,
  'servicos-publicos': Settings
}

export interface GenericPageTemplateProps {
  secretaria: 'cultura' | 'seguranca' | 'planejamento' | 'agricultura' | 'esportes' | 'turismo' | 'habitacao' | 'meio-ambiente' | 'obras' | 'servicos-publicos'
  pageType: string
  customSections?: PageSection[]
  onGenericAction?: (action: string, data: any) => void
}

export default function GenericPageTemplate({
  secretaria,
  pageType,
  customSections = [],
  onGenericAction
}: GenericPageTemplateProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Configurações por secretaria
  const secretariaConfigs = {
    cultura: {
      title: 'Secretaria de Cultura',
      color: 'bg-purple-100 text-purple-800',
      searchPlaceholder: 'Buscar eventos, projetos, espaços culturais...',
      defaultPages: ['atendimentos', 'espacos-culturais', 'projetos-culturais', 'eventos', 'grupos-artisticos', 'oficinas-cursos', 'manifestacoes-culturais', 'dashboard']
    },
    seguranca: {
      title: 'Secretaria de Segurança Pública',
      color: 'bg-orange-100 text-orange-800',
      searchPlaceholder: 'Buscar ocorrências, apoio, alertas...',
      defaultPages: ['atendimentos', 'registro-ocorrencias', 'apoio-guarda', 'pontos-criticos', 'alertas-seguranca', 'estatisticas-regionais', 'vigilancia-integrada', 'dashboard']
    },
    planejamento: {
      title: 'Secretaria de Planejamento Urbano',
      color: 'bg-indigo-100 text-indigo-800',
      searchPlaceholder: 'Buscar projetos, alvarás, consultas...',
      defaultPages: ['atendimentos', 'aprovacao-projetos', 'emissao-alvaras', 'reclamacoes-denuncias', 'consultas-publicas', 'mapa-urbano', 'projetos', 'dashboard']
    },
    agricultura: {
      title: 'Secretaria de Agricultura',
      color: 'bg-emerald-100 text-emerald-800',
      searchPlaceholder: 'Buscar produtores, assistência técnica, programas...',
      defaultPages: ['atendimentos', 'cadastro-produtores', 'assistencia-tecnica', 'programas-rurais', 'cursos-capacitacoes', 'dashboard']
    },
    esportes: {
      title: 'Secretaria de Esportes',
      color: 'bg-yellow-100 text-yellow-800',
      searchPlaceholder: 'Buscar atletas, competições, escolinhas...',
      defaultPages: ['atendimentos', 'equipes-esportivas', 'competicoes-torneios', 'atletas-federados', 'escolinhas-esportivas', 'eventos-esportivos', 'infraestrutura-esportiva', 'dashboard']
    },
    turismo: {
      title: 'Secretaria de Turismo',
      color: 'bg-pink-100 text-pink-800',
      searchPlaceholder: 'Buscar pontos turísticos, eventos, estabelecimentos...',
      defaultPages: ['atendimentos', 'pontos-turisticos', 'estabelecimentos-locais', 'programas-turisticos', 'mapa-turistico', 'informacoes-turisticas', 'dashboard']
    },
    habitacao: {
      title: 'Secretaria de Habitação',
      color: 'bg-cyan-100 text-cyan-800',
      searchPlaceholder: 'Buscar programas habitacionais, unidades...',
      defaultPages: ['atendimentos', 'inscricoes', 'programas-habitacionais', 'unidades-habitacionais', 'regularizacao-fundiaria', 'dashboard']
    },
    'meio-ambiente': {
      title: 'Secretaria de Meio Ambiente',
      color: 'bg-teal-100 text-teal-800',
      searchPlaceholder: 'Buscar licenças ambientais, denúncias, programas...',
      defaultPages: ['atendimentos', 'licencas-ambientais', 'registro-denuncias', 'areas-protegidas', 'programas-ambientais', 'dashboard']
    },
    obras: {
      title: 'Secretaria de Obras Públicas',
      color: 'bg-slate-100 text-slate-800',
      searchPlaceholder: 'Buscar obras, projetos, progresso...',
      defaultPages: ['atendimentos', 'obras-intervencoes', 'progresso-obras', 'mapa-obras', 'dashboard']
    },
    'servicos-publicos': {
      title: 'Secretaria de Serviços Públicos',
      color: 'bg-gray-100 text-gray-800',
      searchPlaceholder: 'Buscar serviços urbanos, iluminação, limpeza...',
      defaultPages: ['atendimentos', 'iluminacao-publica', 'limpeza-urbana', 'coleta-especial', 'problemas-com-foto', 'programacao-equipes', 'dashboard']
    }
  }

  const config = secretariaConfigs[secretaria]
  const Icon = secretariaIcons[secretaria] || Settings

  // Gerar seções baseadas no tipo de página
  const generateSections = (): PageSection[] => {
    const baseSections: PageSection[] = [
      {
        id: 'atendimentos',
        title: 'Atendimentos',
        description: `Atendimento ao público da ${config.title}`,
        icon: FileText,
        stats: { total: 234, completed: 189, pending: 45 },
        component: <GenericAtendimentosSection secretaria={secretaria} onAction={onGenericAction} />
      },
      {
        id: 'gestao',
        title: 'Gestão',
        description: 'Gestão interna da secretaria',
        icon: Settings,
        stats: { total: 89, completed: 67, pending: 22 },
        component: <GenericGestaoSection secretaria={secretaria} />
      },
      {
        id: 'documentos',
        title: 'Documentos',
        description: 'Gestão de documentos e processos',
        icon: FileText,
        stats: { total: 156, completed: 134, pending: 22 },
        component: <GenericDocumentosSection secretaria={secretaria} />
      },
      {
        id: 'relatorios',
        title: 'Relatórios',
        description: 'Relatórios e estatísticas',
        icon: BarChart3,
        component: <GenericRelatoriosSection secretaria={secretaria} />
      }
    ]

    // Seções específicas por secretaria
    const specificSections = getSpecificSections(secretaria, pageType)

    return [...specificSections, ...baseSections, ...customSections]
  }

  const getSpecificSections = (sec: string, page: string): PageSection[] => {
    const sectionsMap: Record<string, Record<string, PageSection[]>> = {
      cultura: {
        'espacos-culturais': [
          {
            id: 'reservas',
            title: 'Reservas de Espaços',
            description: 'Gestão de reservas de espaços culturais',
            icon: Calendar,
            stats: { total: 45, completed: 38, pending: 7 },
            component: <EspacosCulturaisSection />
          }
        ],
        'eventos': [
          {
            id: 'programacao',
            title: 'Programação Cultural',
            description: 'Gestão da agenda de eventos culturais',
            icon: Activity,
            component: <EventosCulturaisSection />
          }
        ]
      },
      seguranca: {
        'registro-ocorrencias': [
          {
            id: 'ocorrencias-ativas',
            title: 'Ocorrências Ativas',
            description: 'Ocorrências em andamento',
            icon: AlertCircle,
            stats: { total: 12, completed: 8, pending: 4 },
            component: <OcorrenciasSegurancaSection />
          }
        ]
      }
      // Adicionar mais conforme necessário
    }

    return sectionsMap[sec]?.[page] || []
  }

  const quickActions: PageAction[] = [
    {
      id: 'novo-protocolo',
      label: 'Novo Protocolo',
      description: 'Criar novo protocolo',
      icon: Plus,
      onClick: () => onGenericAction?.('create-protocol', {})
    },
    {
      id: 'gerar-relatorio',
      label: 'Gerar Relatório',
      description: 'Gerar relatório da secretaria',
      icon: BarChart3,
      onClick: () => onGenericAction?.('generate-report', {}),
      variant: 'outline' as const
    }
  ]

  const stats = {
    protocolsAtivos: 89,
    servicosDisponiveis: 8,
    atendimentosMes: 567,
    tempoMedioAtendimento: 2.1
  }

  const sidebarItems = config.defaultPages.map((page, index) => ({
    id: page,
    label: page.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    href: `/admin/secretarias/${secretaria}/${page}`,
    icon: index === config.defaultPages.length - 1 ? BarChart3 : Icon,
    active: page === pageType
  }))

  const customHeader = (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={config.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Badge variant="outline" className={config.color}>
        {config.title.replace('Secretaria de ', '')}
      </Badge>
    </div>
  )

  return (
    <BasePageTemplate
      title={`${config.title} - ${pageType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
      description={`Gestão de ${pageType.replace('-', ' ')} da ${config.title}`}
      secretaria={secretaria}
      pageName={pageType}
      sections={generateSections()}
      quickActions={quickActions}
      stats={stats}
      sidebarItems={sidebarItems}
      customHeader={customHeader}
      onServiceGeneration={() => console.log(`Gerando serviços para ${secretaria}...`)}
    />
  )
}

// Componentes genéricos reutilizáveis
function GenericAtendimentosSection({ secretaria, onAction }: { secretaria: string, onAction?: (action: string, data: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Atendimentos Recentes</h3>
        <Button onClick={() => onAction?.('new-attendance', { secretaria })}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Protocolo #{1000 + item}</p>
                  <p className="text-sm text-gray-500">Cidadão {item} - {secretaria}</p>
                  <p className="text-xs text-gray-400">Há {item} dias</p>
                </div>
                <Badge variant={item % 3 === 0 ? "default" : "secondary"}>
                  {item % 3 === 0 ? "Em Andamento" : "Concluído"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GenericGestaoSection({ secretaria }: { secretaria: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Equipe Ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-sm text-gray-500">Funcionários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-sm text-gray-500">Em andamento</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="font-medium mb-3">Configurações da Secretaria</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm">Horário de funcionamento</span>
            <span className="text-sm text-gray-600">08:00 - 17:00</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm">Serviços disponíveis</span>
            <span className="text-sm text-gray-600">8 ativos</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm">Protocolos automáticos</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function GenericDocumentosSection({ secretaria }: { secretaria: string }) {
  return (
    <div className="space-y-4">
      <p>Sistema de gestão de documentos para a {secretaria}.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Formulários', 'Certidões', 'Relatórios'].map((tipo) => (
          <Card key={tipo}>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">{tipo}</p>
              <p className="text-sm text-gray-500">12 disponíveis</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GenericRelatoriosSection({ secretaria }: { secretaria: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-sm text-gray-500">Atendimentos este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satisfação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            <p className="text-sm text-gray-500">Nota média</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componentes específicos por secretaria
function EspacosCulturaisSection() {
  return (
    <div className="space-y-4">
      <p>Gestão de espaços culturais municipais e sistema de reservas.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Teatro Municipal', 'Centro Cultural', 'Biblioteca Pública'].map((espaco) => (
          <Card key={espaco}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{espaco}</p>
                  <p className="text-sm text-gray-500">Disponível para reserva</p>
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

function EventosCulturaisSection() {
  return (
    <div className="space-y-4">
      <p>Programação e gestão de eventos culturais municipais.</p>
    </div>
  )
}

function OcorrenciasSegurancaSection() {
  return (
    <div className="space-y-4">
      <p>Registro e acompanhamento de ocorrências de segurança pública.</p>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="font-medium text-orange-800">4 Ocorrências Ativas</h3>
        </div>
        <p className="text-sm text-orange-700 mt-2">
          Requerem atenção imediata da equipe de segurança.
        </p>
      </div>
    </div>
  )
}