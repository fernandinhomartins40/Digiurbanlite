'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { usePlanejamentoUrbanoStats } from '@/hooks/usePlanejamentoUrbanoStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building,
  Hammer,
  Store,
  FileCheck,
  AlertTriangle,
  Map,
  Headset,
  Users,
  MapPin,
  Plus,
  FileText,
  FileBarChart,
  AlertCircle,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';

export default function SecretariaPlanejamentoUrbanoPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('planejamento-urbano');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = usePlanejamentoUrbanoStats();

  // ✅ NOVO: Buscar módulos dinâmicos do backend
  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('planejamento-urbano');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600' },
    { border: 'border-purple-200', bg: 'bg-purple-50/50', icon: 'text-purple-600' },
    { border: 'border-indigo-200', bg: 'bg-indigo-50/50', icon: 'text-indigo-600' },
    { border: 'border-green-200', bg: 'bg-green-50/50', icon: 'text-green-600' },
    { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600' },
    { border: 'border-teal-200', bg: 'bg-teal-50/50', icon: 'text-teal-600' },
  ];

  // Todos os serviços
  const servicesWithModule = services;
  const allServices = services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building className="h-8 w-8 text-blue-600 mr-3" />
            Secretaria Municipal de Planejamento Urbano
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão urbanística, alvarás, certidões e fiscalização urbana
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Planejamento Urbano
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alvarás Emitidos</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.permits.thisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.permits.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos em Análise</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.inAnalysis.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando aprovação
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Aprovados</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.approved.thisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approved.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
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
              onClick={() => setShowNewProtocolModal(true)}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Novo Protocolo</span>
            </Button>

            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => router.push('/admin/protocolos?departamento=planejamento-urbano&status=pending')}
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

      {/* 🔥 Módulos Padrões - DINÂMICO (backend gera cards automaticamente) */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Padrões</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de cadastros e dados estruturados do planejamento urbano
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
                  className={`${colors.border} ${colors.bg} hover:shadow-lg transition-shadow cursor-pointer`}
                  onClick={() => router.push(`/admin/secretarias/planejamento-urbano/${module.moduleType}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className={`h-5 w-5 ${colors.icon}`} />
                      {module.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {module.description}
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
                        <span className="font-medium text-green-600">{module.stats?.approved || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Building className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo cadastrado</h3>
                <p className="text-sm text-muted-foreground">
                  Os módulos aparecem automaticamente quando o admin cria serviços COM_DADOS com moduleType
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200 bg-indigo-50/50"
                    onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
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
                          <Badge variant="outline" className="bg-indigo-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
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
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-indigo-400 mb-4" />
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
                      <Badge className="bg-indigo-600">
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
        <h2 className="text-2xl font-semibold mb-6">Serviços Disponíveis</h2>

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
              <Building className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Configure serviços para a Secretaria de Planejamento Urbano
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
                      <Badge className="bg-blue-600">
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
              <Card key={service.id} className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-blue-600">
                      {service.moduleEntity}
                    </Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="pt-2 text-xs text-muted-foreground">
                    ✅ Integrado ao motor de protocolos
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
              Crie tabelas personalizadas para dados específicos do planejamento urbano
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=urban-planning')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Registro de Obras */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hammer className="h-5 w-5 text-blue-600" />
                Registro de Obras
              </CardTitle>
              <CardDescription>
                Exemplo: acompanhamento detalhado de obras em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Endereço, Responsável técnico, Status da obra, Percentual concluído
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=urban-planning&template=obras')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Fiscalização */}
          <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Vistorias de Fiscalização
              </CardTitle>
              <CardDescription>
                Exemplo: registro detalhado de vistorias realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Local, Fiscal responsável, Data vistoria, Irregularidades encontradas
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=urban-planning&template=fiscalizacao')}
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
                Ver todos os módulos customizados criados para planejamento urbano
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=urban-planning')}
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
                  <li>• Controle detalhado de obras</li>
                  <li>• Registro de vistorias técnicas</li>
                  <li>• Histórico de alterações em imóveis</li>
                  <li>• Gestão de taxas e tributos urbanos</li>
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
