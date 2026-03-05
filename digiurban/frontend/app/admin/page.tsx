'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { DashboardCard, StatCard } from '@/components/admin/DashboardCard'
import { AppCard, CompactAppCard } from '@/components/admin/AppCard'
import { SearchBar } from '@/components/admin/SearchBar'
import { useAnalytics, usePageTracking } from '@/hooks/useAnalytics'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  FileText,
  Users,
  AlertCircle,
  Settings,
  BarChart3,
  UserPlus,
  UserCheck,
  Heart,
  Sprout,
  Crown,
  Calendar,
  Map,
  GitBranch,
  Bot,
  ScrollText,
  FileSignature,
  Award,
  Mail,
  UserCircle,
  MessageCircle,
  TrendingUp,
  Sparkles,
  GraduationCap,
  HandHeart,
  Palette,
  Shield,
  MapPin,
  Trophy,
  Camera,
  Home,
  TreePine,
  Truck,
  DollarSign,
  ShieldAlert,
  Cpu,
  Car,
  Bus,
  Building2,
  Clock,
  CheckCircle2,
  Bell
} from 'lucide-react'

// Configuração dos itens de busca
const getSearchItems = () => [
  // Gabinete do Prefeito
  { title: 'Painel do Prefeito', description: 'Visão executiva municipal', href: '/admin/gabinete/painel-prefeito', category: 'Gabinete', keywords: ['prefeito', 'executivo', 'gestão'] },
  { title: 'Criar Chamado', description: 'Protocolo top-down para setores', href: '/admin/chamados', category: 'Gabinete', keywords: ['chamado', 'demanda', 'setor'] },
  { title: 'Agenda Centralizada', description: 'Agenda unificada da gestão', href: '/admin/agenda', category: 'Gabinete', keywords: ['agenda', 'reunião', 'compromisso', 'calendário'] },
  { title: 'Mapa de Demandas', description: 'Visualização geográfica', href: '/admin/gabinete/mapa-demandas', category: 'Gabinete', keywords: ['mapa', 'geoprocessamento', 'demandas'] },

  // Gestão Municipal
  { title: 'Protocolos', description: 'Gestão de protocolos', href: '/admin/protocolos', category: 'Gestão', keywords: ['protocolo', 'solicitação', 'atendimento'] },
  { title: 'Serviços', description: 'Catálogo de serviços', href: '/admin/servicos', category: 'Gestão', keywords: ['serviço', 'catálogo', 'configuração'] },
  { title: 'Workflows', description: 'Fluxos de trabalho', href: '/admin/workflows', category: 'Gestão', keywords: ['workflow', 'fluxo', 'processo'] },
  { title: 'Cidadãos', description: 'Gestão de cidadãos', href: '/admin/cidadaos', category: 'Gestão', keywords: ['cidadão', 'munícipe', 'população'] },
  { title: 'Equipe', description: 'Gerenciar equipes', href: '/admin/servidores/equipe', category: 'Gestão', keywords: ['equipe', 'funcionário', 'servidor'] },
  { title: 'Relatórios', description: 'Business Intelligence', href: '/admin/relatorios', category: 'Gestão', keywords: ['relatório', 'bi', 'analytics'] },

  // Documentos
  { title: 'Meus Documentos', description: 'Documentos pessoais', href: '/admin/meus-documentos', category: 'Documentos', keywords: ['documento', 'arquivo', 'pdf'] },
  { title: 'Assinaturas Digitais', description: 'Gerenciar assinaturas', href: '/admin/assinaturas-digitais', category: 'Documentos', keywords: ['assinatura', 'digital', 'eletrônica'] },
  { title: 'Templates de Documentos', description: 'Modelos de documentos', href: '/admin/templates-documentos', category: 'Documentos', keywords: ['template', 'modelo', 'documento'] },
  { title: 'IA Centralizada', description: 'Chat e API da IA municipal', href: '/admin/ia', category: 'Automação', keywords: ['ia', 'chat', 'qwen', 'api'] },
  { title: 'Certificados Digitais', description: 'Certificados ICP-Brasil', href: '/admin/certificados-digitais', category: 'Documentos', keywords: ['certificado', 'icp', 'brasil'] },
  { title: 'Fluxos do Bot', description: 'Automação de processos', href: '/admin/bot-flows', category: 'Automação', keywords: ['bot', 'automação', 'ia'] },

  // Comunicação
  { title: 'Mensagens', description: 'Central de mensagens', href: '/admin/mensagens', category: 'Comunicação', keywords: ['mensagem', 'chat', 'notificação'] },
  { title: 'Email', description: 'Sistema de e-mail', href: '/admin/email', category: 'Comunicação', keywords: ['email', 'correio', 'mensagem'] },

  // Aplicativos
  { title: 'Saúde', description: 'Sistema de Atendimento', href: '/admin/apps/saude/cadastros', category: 'Aplicativos', keywords: ['saúde', 'ubs', 'atendimento', 'prontuário'] },
  { title: 'Agricultura', description: 'Gestão Agrícola', href: '/admin/agricultura/produtores', category: 'Aplicativos', keywords: ['agricultura', 'produtor', 'rural'] },

  // Análise
  { title: 'Analytics', description: 'Análise de dados', href: '/admin/analytics', category: 'Análise', keywords: ['analytics', 'dados', 'estatística'] },
  { title: 'Dashboard', description: 'Painel principal', href: '/admin/dashboard', category: 'Análise', keywords: ['dashboard', 'painel', 'visão geral'] },
]

export default function AdminPage() {
  const { user, stats, loading } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()
  const { trackCardClick } = useAnalytics()
  const [mounted, setMounted] = useState(false)

  // Rastrear página
  usePageTracking('Admin Home')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando portal administrativo...</p>
        </div>
      </div>
    )
  }

  // Stats default quando null (evita spinner infinito se backend retorna parcial)
  const safeStats = stats || {
    totalProtocols: 0,
    pendingProtocols: 0,
    completedProtocols: 0,
    pendingCitizens: 0,
    unreadMessages: 0,
    protocolsByStatus: []
  }

  // Handler para rastrear cliques
  const handleCardClick = (title: string, href: string, category: string) => {
    trackCardClick(title, href, category)
  }

  return (
    <main className={`min-h-screen space-y-8 ${mounted ? 'animate-in fade-in-0 duration-500' : 'opacity-0'}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Portal Administrativo
            </h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo(a), <span className="font-semibold text-foreground">{user.name || user.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-sm">
              {user.role === 'ADMIN' ? '👑 Prefeito' :
               user.role === 'MANAGER' ? '📋 Secretário' :
               user.role === 'COORDINATOR' ? '🎯 Coordenador' : '👤 Funcionário'}
            </Badge>
            {user.department && (
              <Badge variant="secondary" className="text-sm">
                {user.department.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar items={getSearchItems()} />
      </div>

      {/* Stats Cards - Visão Rápida */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Visão Rápida
          </h2>
          <p className="text-sm text-muted-foreground">Métricas em tempo real do sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasPermission('protocols:read') && (
            <StatCard
              title="Protocolos Pendentes"
              value={safeStats.pendingProtocols || 0}
              icon={Clock}
              trend={safeStats.pendingProtocols > 0 ? { value: 'Requer atenção', direction: 'neutral' } : undefined}
              href="/admin/protocolos"
            />
          )}

          {safeStats.totalProtocols !== undefined && (
            <StatCard
              title="Total de Protocolos"
              value={safeStats.totalProtocols}
              icon={FileText}
              href="/admin/protocolos"
            />
          )}

          {safeStats.unreadMessages !== undefined && safeStats.unreadMessages > 0 && (
            <StatCard
              title="Mensagens Não Lidas"
              value={safeStats.unreadMessages}
              icon={MessageCircle}
              trend={{ value: 'Novas', direction: 'up' }}
              href="/admin/mensagens"
            />
          )}

          {safeStats.pendingCitizens !== undefined && safeStats.pendingCitizens > 0 && (
            <StatCard
              title="Cidadãos Pendentes"
              value={safeStats.pendingCitizens}
              icon={UserCheck}
              trend={{ value: 'Aguardando aprovação', direction: 'neutral' }}
              href="/admin/cidadaos/pendentes"
            />
          )}
        </div>
      </section>

      <Separator />

      {/* Gabinete do Prefeito - Apenas para ADMIN */}
      {hasMinRole('ADMIN') && (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Gabinete do Prefeito
              </h2>
              <p className="text-sm text-muted-foreground">Ferramentas executivas de gestão municipal</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="Painel do Prefeito"
                description="Visão executiva e KPIs municipais"
                href="/admin/gabinete/painel-prefeito"
                icon={Crown}
                iconColor="text-yellow-600"
                iconBgColor="bg-yellow-50"
                badge="NOVO"
                badgeVariant="new"
                onClick={() => handleCardClick('Painel do Prefeito', '/admin/gabinete/painel-prefeito', 'Gabinete')}
              />

              <DashboardCard
                title="Criar Chamado"
                description="Protocolo top-down para setores"
                href="/admin/chamados"
                icon={AlertCircle}
                iconColor="text-red-600"
                iconBgColor="bg-red-50"
                onClick={() => handleCardClick('Criar Chamado', '/admin/chamados', 'Gabinete')}
              />

              <DashboardCard
                title="Agenda Centralizada"
                description="Compromissos e reuniões"
                href="/admin/agenda"
                icon={Calendar}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                onClick={() => handleCardClick('Agenda Centralizada', '/admin/agenda', 'Gabinete')}
              />

              <DashboardCard
                title="Mapa de Demandas"
                description="Visualização geográfica de protocolos"
                href="/admin/gabinete/mapa-demandas"
                icon={Map}
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
                onClick={() => handleCardClick('Mapa de Demandas', '/admin/gabinete/mapa-demandas', 'Gabinete')}
              />
            </div>
          </section>

          <Separator />
        </>
      )}

      {/* Gestão Municipal */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Gestão Municipal
          </h2>
          <p className="text-sm text-muted-foreground">Funcionalidades principais do sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hasPermission('protocols:read') && (
            <DashboardCard
              title="Protocolos"
              description="Gestão unificada de protocolos"
              href="/admin/protocolos"
              icon={FileText}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
              badge={safeStats.pendingProtocols}
              onClick={() => handleCardClick('Protocolos', '/admin/protocolos', 'Gestão')}
            />
          )}

          {(hasPermission('services:create') || hasPermission('services:update')) && (
            <DashboardCard
              title="Catálogo de Serviços"
              description="Configurar serviços municipais"
              href="/admin/servicos"
              icon={Settings}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
              onClick={() => handleCardClick('Catálogo de Serviços', '/admin/servicos', 'Gestão')}
            />
          )}

          {hasMinRole('ADMIN') && (
            <DashboardCard
              title="Workflows"
              description="Fluxos de trabalho automatizados"
              href="/admin/workflows"
              icon={GitBranch}
              iconColor="text-indigo-600"
              iconBgColor="bg-indigo-50"
              onClick={() => handleCardClick('Workflows', '/admin/workflows', 'Gestão')}
            />
          )}

          {hasPermission('citizens:read') && (
            <DashboardCard
              title="Cidadãos"
              description="Gestão da base de cidadãos"
              href="/admin/cidadaos"
              icon={UserPlus}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
              onClick={() => handleCardClick('Cidadãos', '/admin/cidadaos', 'Gestão')}
            />
          )}

          {hasPermission('team:read') && (
            <DashboardCard
              title="Equipe"
              description="Gerenciar equipes e permissões"
              href="/admin/servidores/equipe"
              icon={Users}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-50"
              onClick={() => handleCardClick('Equipe', '/admin/servidores/equipe', 'Gestão')}
            />
          )}

          {(hasPermission('reports:department') || hasPermission('reports:full')) && (
            <DashboardCard
              title="Relatórios"
              description="Business Intelligence municipal"
              href="/admin/relatorios"
              icon={BarChart3}
              iconColor="text-pink-600"
              iconBgColor="bg-pink-50"
              onClick={() => handleCardClick('Relatórios', '/admin/relatorios', 'Gestão')}
            />
          )}
        </div>
      </section>

      <Separator />

      {/* Documentos & Processos */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Documentos & Processos
          </h2>
          <p className="text-sm text-muted-foreground">Gestão documental e automação</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Meus Documentos"
            description="Documentos pessoais e assinados"
            href="/admin/meus-documentos"
            icon={FileText}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            onClick={() => handleCardClick('Meus Documentos', '/admin/meus-documentos', 'Documentos')}
          />

          {hasMinRole('COORDINATOR') && (
            <DashboardCard
              title="Assinaturas Digitais"
              description="Gerenciar assinaturas eletrônicas"
              href="/admin/assinaturas-digitais"
              icon={FileSignature}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
              badge="NOVO"
              badgeVariant="new"
              onClick={() => handleCardClick('Assinaturas Digitais', '/admin/assinaturas-digitais', 'Documentos')}
            />
          )}

          {hasMinRole('ADMIN') && (
            <>
              <DashboardCard
                title="Templates de Documentos"
                description="Modelos de documentos oficiais"
                href="/admin/templates-documentos"
                icon={ScrollText}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                onClick={() => handleCardClick('Templates de Documentos', '/admin/templates-documentos', 'Documentos')}
              />

              <DashboardCard
                title="IA Centralizada"
                description="Chat operacional e API da IA municipal"
                href="/admin/ia"
                icon={Bot}
                iconColor="text-cyan-600"
                iconBgColor="bg-cyan-50"
                badge="NOVO"
                badgeVariant="new"
                onClick={() => handleCardClick('IA Centralizada', '/admin/ia', 'Automação')}
              />

              <DashboardCard
                title="Fluxos do Bot"
                description="Automação com IA"
                href="/admin/bot-flows"
                icon={Bot}
                iconColor="text-indigo-600"
                iconBgColor="bg-indigo-50"
                badge="NOVO"
                badgeVariant="new"
                onClick={() => handleCardClick('Fluxos do Bot', '/admin/bot-flows', 'Automação')}
              />
            </>
          )}
        </div>
      </section>

      <Separator />

      {/* Aplicativos Setoriais */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Aplicativos Setoriais
          </h2>
          <p className="text-sm text-muted-foreground">Sistemas especializados por área de atuação</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppCard
            name="Sistema de Saúde"
            description="Sistema completo de atendimento, prontuário eletrônico e gestão de UBS"
            href="/admin/apps/saude/cadastros"
            icon={Heart}
            modules={60}
            badge="Completo"
            color="text-red-600"
            bgColor="bg-red-50"
            features={[
              'Prontuário Eletrônico',
              'Triagem e Classificação de Risco',
              'Gestão de Equipes ESF',
              'Agendamento Médico'
            ]}
          />

          <AppCard
            name="Agricultura"
            description="Gestão de produtores rurais, propriedades e assistência técnica"
            href="/admin/agricultura/produtores"
            icon={Sprout}
            modules={5}
            color="text-green-600"
            bgColor="bg-green-50"
            features={[
              'Cadastro de Produtores',
              'Gestão de Propriedades',
              'Assistência Técnica',
              'Controle de Sementes'
            ]}
          />
        </div>
      </section>

      <Separator />

      {/* Secretarias Municipais */}
      {hasMinRole('COORDINATOR') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Secretarias Municipais
            </h2>
            <p className="text-sm text-muted-foreground">Acesso rápido aos módulos setoriais</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <CompactAppCard name="Saúde" href="/admin/secretarias/saude" icon={Heart} color="text-red-600" />
            <CompactAppCard name="Educação" href="/admin/secretarias/educacao" icon={GraduationCap} color="text-blue-600" />
            <CompactAppCard name="Assistência Social" href="/admin/secretarias/assistencia-social" icon={HandHeart} color="text-pink-600" />
            <CompactAppCard name="Cultura" href="/admin/secretarias/cultura" icon={Palette} color="text-purple-600" />
            <CompactAppCard name="Esportes" href="/admin/secretarias/esportes" icon={Trophy} color="text-orange-600" />
            <CompactAppCard name="Segurança Pública" href="/admin/secretarias/seguranca-publica" icon={Shield} color="text-indigo-600" />
            <CompactAppCard name="Agricultura" href="/admin/secretarias/agricultura" icon={Sprout} color="text-green-600" />
            <CompactAppCard name="Planejamento Urbano" href="/admin/secretarias/planejamento-urbano" icon={MapPin} color="text-cyan-600" />
            <CompactAppCard name="Turismo" href="/admin/secretarias/turismo" icon={Camera} color="text-yellow-600" />
            <CompactAppCard name="Habitação" href="/admin/secretarias/habitacao" icon={Home} color="text-teal-600" />
            <CompactAppCard name="Meio Ambiente" href="/admin/secretarias/meio-ambiente" icon={TreePine} color="text-emerald-600" />
            <CompactAppCard name="Obras Públicas" href="/admin/secretarias/obras-publicas" icon={Truck} color="text-gray-600" />
            <CompactAppCard name="Finanças" href="/admin/secretarias/financas" icon={DollarSign} color="text-green-700" />
            <CompactAppCard name="Defesa Civil" href="/admin/secretarias/defesa-civil" icon={ShieldAlert} color="text-red-700" />
            <CompactAppCard name="Tecnologia" href="/admin/secretarias/tecnologia-inovacao" icon={Cpu} color="text-violet-600" />
            <CompactAppCard name="Transportes" href="/admin/secretarias/transportes-transito" icon={Car} color="text-slate-600" />
          </div>
        </section>
      )}

      <Separator />

      {/* Comunicação & Análise */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Comunicação & Análise
          </h2>
          <p className="text-sm text-muted-foreground">Ferramentas de comunicação e inteligência de dados</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasPermission('messages:read') && (
            <DashboardCard
              title="Mensagens"
              description="Central de mensagens do sistema"
              href="/admin/mensagens"
              icon={MessageCircle}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
              badge={safeStats.unreadMessages}
              onClick={() => handleCardClick('Mensagens', '/admin/mensagens', 'Comunicação')}
            />
          )}

          {hasMinRole('COORDINATOR') && (
            <>
              <DashboardCard
                title="Email"
                description="Sistema de e-mail institucional"
                href="/admin/email"
                icon={Mail}
                iconColor="text-green-600"
                iconBgColor="bg-green-50"
                onClick={() => handleCardClick('Email', '/admin/email', 'Comunicação')}
              />

              <DashboardCard
                title="Analytics"
                description="Análise avançada de dados"
                href="/admin/analytics"
                icon={TrendingUp}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                onClick={() => handleCardClick('Analytics', '/admin/analytics', 'Análise')}
              />
            </>
          )}

          <DashboardCard
            title="Dashboard"
            description="Painel de controle personalizado"
            href="/admin/dashboard"
            icon={LayoutDashboard}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
            onClick={() => handleCardClick('Dashboard', '/admin/dashboard', 'Análise')}
          />
        </div>
      </section>

      <Separator />

      {/* Configurações */}
      <section className="space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Sistema
          </h2>
          <p className="text-sm text-muted-foreground">Configurações e personalização</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Perfil"
            description="Suas informações pessoais"
            href="/admin/perfil"
            icon={UserCircle}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            onClick={() => handleCardClick('Perfil', '/admin/perfil', 'Sistema')}
          />

          {hasMinRole('ADMIN') && (
            <>
              <DashboardCard
                title="Configurações"
                description="Configurações do sistema"
                href="/admin/configuracoes"
                icon={Settings}
                iconColor="text-gray-600"
                iconBgColor="bg-gray-50"
                onClick={() => handleCardClick('Configurações', '/admin/configuracoes', 'Sistema')}
              />

              <DashboardCard
                title="Integrações"
                description="APIs e integrações externas"
                href="/admin/integracoes"
                icon={Cpu}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                onClick={() => handleCardClick('Integrações', '/admin/integracoes', 'Sistema')}
              />
            </>
          )}
        </div>
      </section>
    </main>
  )
}
