'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useEsportesStats } from '@/hooks/useEsportesStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Award,
  Activity,
  Target,
  Dumbbell,
  Plus,
  FileText,
  AlertCircle,
  FileBarChart,
  Clock,
  CalendarCheck,
  Info,
  FileCheck,
} from 'lucide-react';
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal';
import { useRouter } from 'next/navigation';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection';

export default function SecretariaEsportesPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('esportes');

  // Buscar estatísticas reais
  const { stats, loading: statsLoading, error: statsError } = useEsportesStats();

  // ✅ NOVO: Buscar módulos dinâmicos do backend
  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('esportes');

  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('esportes');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-yellow-200', bg: 'bg-yellow-50/50', icon: 'text-yellow-600' },
    { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600' },
    { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600' },
    { border: 'border-green-200', bg: 'bg-green-50/50', icon: 'text-green-600' },
    { border: 'border-red-200', bg: 'bg-red-50/50', icon: 'text-red-600' },
    { border: 'border-purple-200', bg: 'bg-purple-50/50', icon: 'text-purple-600' },
  ];

  // Todos os serviços
  const allServices = services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
            Secretaria Municipal de Esportes
          </h1>
          <p className="text-gray-600 mt-1">
            Fomento ao esporte e qualidade de vida
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
          Esporte Para Todos
        </Badge>
      </div>

      {/* Chamados Pendentes do Prefeito */}
      <PendingTicketsSection />

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atletas Cadastrados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.athletes.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.athletes.total || 0} total cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes Esportivas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.teams.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.teams.total || 0} equipes cadastradas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Esportivos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.competitions.upcoming || 0}</div>
                <p className="text-xs text-muted-foreground">
                  neste mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.protocols.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.protocols.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>
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
              onClick={() => router.push('/admin/protocolos?departamento=esportes&status=pending')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Protocolos Pendentes</span>
              {stats && stats.protocols.pending > 0 && (
                <Badge className="mt-1" variant="destructive">
                  {stats.protocols.pending}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS) */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-7 w-7 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold">Módulos de Gestão de Dados</h2>
            <p className="text-sm text-muted-foreground">
              Serviços COM_DADOS com formulários dinâmicos e gestão completa de protocolos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departmentLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : modules.length > 0 ? (
            modules.map((module: any, index: number) => {
              const colors = moduleColors[index % moduleColors.length];
              return (
                <Card
                  key={module.id}
                  className={`${colors.border} ${colors.bg} hover:shadow-lg transition-all cursor-pointer group`}
                  onClick={() => router.push(`/admin/secretarias/esportes/${module.moduleType}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-blue-600 text-white">
                          Módulo COM_DADOS
                        </Badge>
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <FileText className={`h-5 w-5 ${colors.icon}`} />
                          {module.name}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {module.description || 'Módulo de gestão com formulário dinâmico'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-lg">{module.stats?.total || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-semibold text-yellow-700">{module.stats?.pending || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-muted-foreground">Aprovados:</span>
                        <span className="font-semibold text-green-700">{module.stats?.approved || 0}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 group-hover:bg-blue-600 transition-colors" variant="outline">
                      Abrir Painel Completo →
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo COM_DADOS cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie serviços COM_DADOS com moduleType para que apareçam automaticamente aqui
                </p>
                <Button
                  onClick={() => router.push('/admin/servicos/novo?departmentCode=esportes&serviceType=COM_DADOS')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço COM_DADOS
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-7 w-7 text-green-600" />
          <div>
            <h2 className="text-2xl font-semibold">Serviços Gerais - Painel Consolidado</h2>
            <p className="text-sm text-muted-foreground">
              Todos os serviços SEM_DADOS gerenciados em um único painel agregado
            </p>
          </div>
        </div>

        {servicesLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card
            className="hover:shadow-xl transition-all cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 group"
            onClick={() => router.push('/admin/secretarias/esportes/servicos-gerais')}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-3 bg-green-600 text-white">
                    Painel Agregado SEM_DADOS
                  </Badge>
                  <CardTitle className="text-2xl flex items-center gap-3 group-hover:text-green-700 transition-colors">
                    <FileBarChart className="h-7 w-7 text-green-600" />
                    Gerenciar Todos os Serviços Gerais
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Visão consolidada de {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length} serviços em um único painel com filtros, busca e estatísticas
                  </CardDescription>
                </div>
                <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <FileText className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {services
                    .filter((s: any) => s.serviceType === 'SEM_DADOS')
                    .slice(0, 6)
                    .map((service: any) => (
                      <Badge key={service.id} variant="outline" className="bg-white text-green-700 border-green-300">
                        {service.name}
                      </Badge>
                    ))}
                  {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 6 && (
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                      +{services.filter((s: any) => s.serviceType === 'SEM_DADOS').length - 6} mais
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Serviços</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">•••</div>
                    <div className="text-xs text-muted-foreground">Protocolos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-700">•••</div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:shadow-lg transition-all" size="lg">
                  <FileBarChart className="h-5 w-5 mr-2" />
                  Abrir Painel Consolidado →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!servicesLoading && services.filter((s: any) => s.serviceType === 'SEM_DADOS').length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço SEM_DADOS cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Execute o seed do banco de dados para carregar os serviços gerais
              </p>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=esportes&serviceType=SEM_DADOS')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Serviço Personalizado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/*
        ============================================================
        SEÇÕES REMOVIDAS (Consolidadas acima):
        ============================================================
        - "Serviços de Certidões, Declarações e Documentos"
          → Agora: SEÇÃO 2 - Painel Agregado SEM_DADOS

        - "Serviços COM_DADOS - Com formulários e dados estruturados"
          → Agora: Incluído na SEÇÃO 1 - Módulos de Gestão de Dados

        - "Serviços Disponíveis" (listagem geral)
          → Agora: Distribuído entre SEÇÃO 1 (COM_DADOS) e SEÇÃO 2 (SEM_DADOS)
        ============================================================
      */}

      {/* Sugestões Inteligentes de Serviços COM_DADOS */}
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
                onClick={() => router.push('/admin/servicos/novo?departmentCode=esportes&serviceType=COM_DADOS')}
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
                      onClick={() => router.push(buildServiceCreationUrl('esportes', suggestion))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar este Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

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
                    onClick={() => router.push(`/admin/secretarias/esportes/sugestoes`)}
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
        departmentFilter="esportes"
      />
    </div>
  );
}
