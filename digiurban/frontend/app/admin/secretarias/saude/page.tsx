'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Plus,
  FileBarChart,
  AlertCircle,
  GraduationCap,
  FileCheck,
  Calendar,
  DollarSign,
  Cloud,
  BookOpen,
  CalendarCheck,
  Award,
  Stethoscope,
  IdCard,
  Info,
  ChevronRight,
  Activity,
  Pill,
  Truck,
} from 'lucide-react';
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal';
import { useRouter } from 'next/navigation';
// ✅ NOVOS HOOKS PARA CARREGAR DADOS REAIS
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useSaudeStats } from '@/hooks/useSaudeStats';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection';
import { SecretariaModulosSection } from '@/components/modules/secretaria/SecretariaModulosSection';

export default function SecretariaSaudePage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  // ✅ CARREGAR SERVIÇOS E ESTATÍSTICAS REAIS
  const {
    services,
    loading: servicesLoading,
    error: servicesError
  } = useSecretariaServices('saude');

  const {
    stats: saudeStats,
    dashboard,
    healthUnitsStats,
    loading: statsLoading,
    error: statsError
  } = useSaudeStats();

  // ✅ NOVO: Buscar módulos dinâmicos do backend
  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('saude');

  // ✅ Buscar sugestões inteligentes de serviços
  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('saude');

  // Todos os serviços
  const allServices = services;

  // ✅ Módulos dinâmicos COM_DADOS (vêm do backend)
  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  // Cores para os cards dos módulos (mesmas cores hardcoded para manter visual)
  const moduleColors = [
    { border: 'border-red-200', bg: 'bg-red-50/50', icon: 'text-red-600' },
    { border: 'border-pink-200', bg: 'bg-pink-50/50', icon: 'text-pink-600' },
    { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600' },
    { border: 'border-purple-200', bg: 'bg-purple-50/50', icon: 'text-purple-600' },
    { border: 'border-emerald-200', bg: 'bg-emerald-50/50', icon: 'text-emerald-600' },
    { border: 'border-teal-200', bg: 'bg-teal-50/50', icon: 'text-teal-600' },
  ];

  // Estatísticas consolidadas usando dados reais
  const stats = {
    healthUnits: {
      active: healthUnitsStats?.activeUnits || 0,
      total: healthUnitsStats?.totalUnits || 0
    },
    appointments: {
      monthly: dashboard?.appointmentsThisMonth || 0,
      growth: 0
    },
    professionals: {
      total: saudeStats?.modules?.communityHealthAgents || 0,
      doctors: 0
    },
    protocols: {
      total: saudeStats?.totals?.totalProtocols || 0,
      pending: 0,
      approved: 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            <Heart className="h-7 w-7 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
            <span>Secretaria Municipal de Saúde</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gestão integrada dos serviços de saúde municipal - SUS
          </p>
        </div>
        <Badge variant="outline" className="text-red-600 border-red-200 self-start md:self-auto">
          SUS Municipal
        </Badge>
      </div>

      {/* Chamados Pendentes do Prefeito */}
      <PendingTicketsSection />

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades de Saúde</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.healthUnits?.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.healthUnits?.total || 0} unidades totais
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.appointments?.monthly || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Atendimentos agendados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais de Saúde</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.professionals?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agentes de saúde ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Protocolos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.protocols?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.protocols?.pending || 0} pendentes
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* APPS DE SAÚDE - SISTEMAS ESPECIALIZADOS                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-600" />
            Apps de Saúde
          </h2>
          <p className="text-sm text-muted-foreground">
            Sistemas especializados completos para gestão de saúde municipal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* App 1: Sistema Integrado de Atendimento */}
          <Card
            className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/admin/apps/saude/atendimento')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <Badge className="bg-blue-600">Sistema Completo</Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">
                Sistema de Atendimento
              </CardTitle>
              <CardDescription className="text-sm">
                Triagem, fila de atendimento, consultas médicas, prontuários eletrônicos, prescrições e exames
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Triagem por classificação de risco</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Prontuário eletrônico completo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Agendamento de consultas</span>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4 group-hover:shadow-lg transition-all">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Acessar Sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App 2: Farmácia Municipal */}
          <Card
            className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/admin/apps/saude/farmacia')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Pill className="h-8 w-8 text-green-600" />
                </div>
                <Badge className="bg-green-600">Gestão de Estoque</Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-green-700 transition-colors">
                Farmácia Municipal
              </CardTitle>
              <CardDescription className="text-sm">
                Controle de estoque, dispensação de medicamentos, alertas de vencimento e estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Pill className="h-3 w-3" />
                  <span>Dispensação de medicamentos</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>Alertas de estoque baixo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileBarChart className="h-3 w-3" />
                  <span>Relatórios e estatísticas</span>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 mt-4 group-hover:shadow-lg transition-all">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Acessar Sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App 3: TFD - Tratamento Fora do Domicílio */}
          <Card
            className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/admin/apps/saude/tfd')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
                <Badge className="bg-purple-600">Workflow Completo</Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-purple-700 transition-colors">
                TFD - Tratamento Fora do Domicílio
              </CardTitle>
              <CardDescription className="text-sm">
                Solicitações, regulação médica, gestão de viagens, frota de veículos e aprovações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileCheck className="h-3 w-3" />
                  <span>Análise documental e regulação</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span>Gestão de viagens e frota</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Aprovação de gestão municipal</span>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4 group-hover:shadow-lg transition-all">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Acessar Sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App 4: Cadastros e Configurações */}
          <Card
            className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/admin/apps/saude/cadastros')}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <IdCard className="h-8 w-8 text-orange-600" />
                </div>
                <Badge className="bg-orange-600">Configuração</Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-orange-700 transition-colors">
                Cadastros e Configurações
              </CardTitle>
              <CardDescription className="text-sm">
                Unidades, profissionais, especialidades, salas, turnos, agendas e configurações de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Unidades de saúde (UBS, UPA, Hospital)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Profissionais e especialidades</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Agendas médicas e configurações</span>
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-4 group-hover:shadow-lg transition-all">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Acessar Cadastros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso direto às funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => setShowServiceSelectorModal(true)}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Novo Protocolo</span>
            </Button>

            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => router.push('/admin/protocolos?departamento=saude&status=pending')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Protocolos Pendentes</span>
              {stats?.protocols?.pending && stats.protocols.pending > 0 && (
                <Badge className="mt-1" variant="destructive">
                  {stats.protocols.pending}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção: módulos gerais (Protocolos + Dados) desta secretaria */}
      <SecretariaModulosSection slug="saude" departmentName="Saúde" />

      {/* Sugestões Inteligentes de Serviços com Dados */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Sugestões de Serviços com Dados</h2>
            <p className="text-sm text-muted-foreground">
              Crie serviços com formulários dinâmicos baseados em sugestões inteligentes
            </p>
            {totalAvailable > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {totalAvailable} {totalAvailable === 1 ? 'sugestão disponível' : 'sugestões disponíveis'}
                {hasMore && ' (mostrando 2 primeiras)'}
              </p>
            )}
          </div>
        </div>

        {suggestionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : displayedSuggestions.length === 0 ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Award className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Parabéns! Todas as sugestões foram criadas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você já criou todos os serviços sugeridos para esta secretaria.
              </p>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=saude&serviceType=COM_DADOS')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Serviço Personalizado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                    {suggestion.name}
                  </CardTitle>
                  <CardDescription>{suggestion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {suggestion.estimatedDays} dias
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      {suggestion.requiresDocuments && (
                        <Badge variant="secondary" className="text-xs">
                          Requer Docs
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <strong>Campos incluídos:</strong>
                      <ul className="mt-2 space-y-1">
                        {suggestion.suggestedFields.slice(0, 4).map((field, idx) => (
                          <li key={idx}>• {field.label}</li>
                        ))}
                        {suggestion.suggestedFields.length > 4 && (
                          <li className="text-blue-600">+ {suggestion.suggestedFields.length - 4} campos adicionais</li>
                        )}
                      </ul>
                    </div>

                    <Button
                      variant="default"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push(buildServiceCreationUrl('saude', suggestion))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar este Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Card Ver Todas as Sugestões */}
            {hasMore && (
              <Card className="border-dashed border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
                <CardContent className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
                  <div className="rounded-full bg-blue-100 p-4 mb-4">
                    <FileCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Ver Todas as Sugestões</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {totalAvailable - displayedSuggestions.length} sugestões adicionais disponíveis
                  </p>
                  <Button
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => router.push(`/admin/secretarias/saude/sugestoes`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Todas ({totalAvailable})
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Info sobre serviços COM_DADOS */}
        <Card className="mt-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Como funcionam os Serviços COM_DADOS?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Recursos:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✅ Formulários dinâmicos e customizáveis</li>
                  <li>✅ Validação automática de campos</li>
                  <li>✅ Dados armazenados em JSON estruturado</li>
                  <li>✅ Workflows e SLA configuráveis</li>
                  <li>✅ Aprovação/Rejeição integrada</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">💡 Como usar as sugestões:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Clique em "Criar este Serviço" para pré-preencher o formulário</li>
                  <li>• Todos os campos sugeridos serão incluídos automaticamente</li>
                  <li>• Você pode editar e personalizar conforme necessário</li>
                  <li>• Após criar, a próxima sugestão aparecerá automaticamente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
{/* Modal de Seleção de Serviços */}
      <ServiceSelectorModal
        open={showServiceSelectorModal}
        onOpenChange={setShowServiceSelectorModal}
        departmentFilter="saude"
      />
    </div>
  );
}
