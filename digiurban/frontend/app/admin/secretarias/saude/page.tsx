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
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';
// ✅ NOVOS HOOKS PARA CARREGAR DADOS REAIS
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useSaudeStats } from '@/hooks/useSaudeStats';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';

export default function SecretariaSaudePage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

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

  // Separar serviços com e sem módulo
  const servicesWithModule = services.filter((s: any) => s.moduleType);
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
      total: saudeStats?.modules.communityHealthAgents || 0,
      doctors: 0
    },
    protocols: {
      total: saudeStats?.totals.totalProtocols || 0,
      pending: 0,
      approved: 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Heart className="h-8 w-8 text-red-600 mr-3" />
            Secretaria Municipal de Saúde
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão integrada dos serviços de saúde municipal - SUS
          </p>
        </div>
        <Badge variant="outline" className="text-red-600 border-red-200">
          SUS Municipal
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.producers?.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.producers?.total || 0} cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriedades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.properties?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.properties?.totalArea || 0} hectares totais
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistências Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.technicalAssistance?.totalActive || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.technicalAssistance?.completedThisMonth || 0} concluídas este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.protocols?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.protocols?.total || 0} total
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
              onClick={() => router.push('/cidadao/servicos?asAdmin=true&departamento=saude')}
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

      {/* Módulos Padrões - ✅ AGORA DINÂMICO DO BACKEND */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Padrões</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de cadastros e dados estruturados da saude
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
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
                  className={`${colors.border} ${colors.bg} hover:shadow-lg transition-shadow cursor-pointer`}
                  onClick={() => router.push(`/admin/secretarias/saude/${module.moduleType}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className={`h-5 w-5 ${colors.icon}`} />
                      {module.name}
                    </CardTitle>
                    <CardDescription>
                      {module.description || 'Módulo de gestão'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{module.stats?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-medium">{module.stats?.pending || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aprovados:</span>
                        <span className="font-medium">{module.stats?.approved || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full border-red-200 bg-red-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo cadastrado</h3>
                <p className="text-sm text-muted-foreground">
                  Configure serviços COM_DADOS com moduleType no admin
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Certidões, Declarações e Documentos (SEM_DADOS) */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Certidões, Declarações e Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Serviços que geram protocolos para emissão de documentos oficiais
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesLoading ? (
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
          ) : (
            <>
              {/* Filtrar apenas serviços SEM_DADOS */}
              {services
                .filter((s: any) => s.serviceType === 'SEM_DADOS')
                .map((service: any) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 bg-red-50/50"
                    onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        {service.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          ⏱️ Prazo: {service.estimatedDays} dias
                        </div>
                        <div className="text-sm">
                          <Badge variant="outline" className="bg-red-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/servicos/${service.id}/solicitar`);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Solicitar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </div>
        {!servicesLoading && services.filter((s: any) => s.serviceType === 'SEM_DADOS').length === 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço de documentos cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços SEM_DADOS
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Serviços COM_DADOS - Com formulários e dados estruturados */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Serviços com Coleta de Dados</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Serviços que coletam dados estruturados através de formulários completos
        </p>

        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        ) : services.filter((s: any) => s.serviceType === 'COM_DADOS').length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço COM_DADOS cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços COM_DADOS
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services
              .filter((s: any) => s.serviceType === 'COM_DADOS')
              .map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.moduleType && (
                      <Badge className="bg-red-600">
                        Motor
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.requiresDocuments && (
                      <div className="text-sm text-muted-foreground">
                        📎 Requer documentação
                      </div>
                    )}
                    {service.estimatedDays && (
                      <div className="text-sm text-muted-foreground">
                        ⏱️ Prazo: {service.estimatedDays} dias
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar Protocolo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Serviços Disponíveis */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Todos os Serviços</h2>

        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        ) : servicesError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">Erro ao carregar serviços</p>
            </CardContent>
          </Card>
        ) : allServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Configure serviços para a Secretaria de Saúde
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.moduleType && (
                      <Badge className="bg-red-600">
                        Motor
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.requiresDocuments && (
                      <div className="text-sm text-muted-foreground">
                        📎 Requer documentação
                      </div>
                    )}
                    {service.estimatedDays && (
                      <div className="text-sm text-muted-foreground">
                        ⏱️ Prazo: {service.estimatedDays} dias
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar Protocolo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Módulos Especializados */}
      {servicesWithModule.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Módulos Especializados</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Serviços integrados com o motor de protocolos e tabelas especializadas
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicesWithModule.map((service) => (
              <Card key={service.id} className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-red-600">
                      {service.moduleType}
                    </Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statsLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {service.moduleType === 'TechnicalAssistance' && stats?.technicalAssistance && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Pendentes:</span>
                              <span className="font-medium ml-2">
                                {stats.technicalAssistance.pending}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Em andamento:</span>
                              <span className="font-medium ml-2">
                                {stats.technicalAssistance.inProgress}
                              </span>
                            </div>
                          </>
                        )}
                        {service.moduleType === 'SeedDistribution' && stats?.seedDistribution && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Ativas:</span>
                              <span className="font-medium ml-2">
                                {stats.seedDistribution.activeRequests}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Concluídas:</span>
                              <span className="font-medium ml-2">
                                {stats.seedDistribution.completedThisMonth}
                              </span>
                            </div>
                          </>
                        )}
                        {service.moduleType === 'SoilAnalysis' && stats?.soilAnalysis && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Pendentes:</span>
                              <span className="font-medium ml-2">
                                {stats.soilAnalysis.pending}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Concluídas:</span>
                              <span className="font-medium ml-2">
                                {stats.soilAnalysis.completedThisMonth}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <div className="pt-2 text-xs text-muted-foreground">
                      ✅ Integrado ao motor de protocolos
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Módulos Customizados */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Módulos Customizados</h2>
            <p className="text-sm text-muted-foreground">
              Crie tabelas personalizadas para dados específicos da saude
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=agriculture')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Controle de Insumos */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Controle de Insumos
              </CardTitle>
              <CardDescription>
                Exemplo: tabela para controlar estoque de sementes, fertilizantes e defensivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Produto, Quantidade, Unidade, Fornecedor, Data de entrada
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=agriculture&template=insumos')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Registro de Produção */}
          <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Registro de Produção
              </CardTitle>
              <CardDescription>
                Exemplo: acompanhar safras e produtividade por propriedade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Cultura, Área plantada, Produção (kg), Safra, Produtor
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=agriculture&template=producao')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Ver todos os módulos */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileBarChart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Gerenciar Módulos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ver todos os módulos customizados criados para saude
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=agriculture')}
              >
                Ver Todos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info sobre módulos customizados */}
        <Card className="mt-6 border-gray-200 bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              O que são Módulos Customizados?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Funcionalidades:</h4>
                <ul className="space-y-1">
                  <li>✅ Defina campos personalizados (texto, número, data, etc)</li>
                  <li>✅ Vincule automaticamente a protocolos</li>
                  <li>✅ Exporte dados para Excel/CSV</li>
                  <li>✅ Crie relatórios personalizados</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Exemplos de uso:</h4>
                <ul className="space-y-1">
                  <li>• Controle de estoque de insumos</li>
                  <li>• Registro de visitas técnicas</li>
                  <li>• Monitoramento de propriedades rurais</li>
                  <li>• Cadastro de equipamentos agrícolas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Novo Protocolo */}
      <NewProtocolModal
        open={showNewProtocolModal}
        onOpenChange={setShowNewProtocolModal}
        services={services}
        onSuccess={() => {
          // Recarregar estatísticas após criar protocolo
          window.location.reload();
        }}
      />
    </div>
  );
}
