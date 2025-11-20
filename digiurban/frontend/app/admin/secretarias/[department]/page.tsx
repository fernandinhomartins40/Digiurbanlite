'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { getDepartmentConfig } from '@/lib/department-config';
import { getServiceRoute } from '@/lib/ms-detection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  MapPin,
  FileCheck,
  LayoutDashboard,
} from 'lucide-react';

/**
 * 🎯 PÁGINA PRINCIPAL DINÂMICA DE DEPARTAMENTO
 *
 * Esta página única substitui 13 arquivos hardcoded de secretarias.
 * Funciona para TODOS os departamentos automaticamente.
 *
 * Features:
 * - Stats agregadas do departamento (vêm do backend)
 * - Cards dos módulos COM_DADOS (gerados dinamicamente)
 * - Cards dos serviços SEM_DADOS (certidões/documentos)
 * - Tudo atualiza em real-time via WebSocket
 *
 * Admin cria novo serviço → card aparece automaticamente ✨
 */
export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const department = params.department as string;

  // ✅ Busca config visual do departamento (nome, ícone, cores)
  const config = getDepartmentConfig(department);

  // ✅ Busca stats do backend (protocolos + serviços com stats)
  const { stats, loading, error } = useDepartmentStats(department);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Departamento não encontrado</CardTitle>
            <CardDescription>
              O departamento "{department}" não está configurado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin')}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = config.icon;

  // ✅ Filtra módulos (serviços COM_DADOS com moduleType)
  const modules = stats?.services.filter(
    (s) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  // ✅ Filtra serviços SEM_DADOS (certidões, declarações)
  const documents = stats?.services.filter(
    (s) => s.serviceType === 'SEM_DADOS'
  ) || [];

  // ✅ Filtra serviços COM_DADOS que NÃO são módulos (formulários simples)
  const simpleServices = stats?.services.filter(
    (s) => s.serviceType === 'COM_DADOS' && !s.moduleType
  ) || [];

  return (
    <div className="space-y-6 p-6">
      {/* 📌 Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center ${config.color}`}>
            <Icon className="h-8 w-8 mr-3" />
            {config.name}
          </h1>
          <p className="text-muted-foreground mt-2">{config.description}</p>
        </div>
        <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
          {modules.length} módulos
        </Badge>
      </div>

      {/* 📊 Stats Gerais do Departamento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Protocolos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.protocols.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.protocols.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.protocols.inProgress || 0}
                </div>
                <p className="text-xs text-muted-foreground">Em processamento</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.protocols.approved || 0}
                </div>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🎴 CARDS DOS MÓDULOS - 100% DINÂMICOS */}
      {modules.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Módulos de Gestão</h2>
            <p className="text-sm text-muted-foreground">
              Gestão de dados estruturados e cadastros do departamento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
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
                {/* Separa MS de serviços normais */}
                {(() => {
                  const { isMicroSystem } = require('@/lib/ms-detection');
                  const microSystems = modules.filter(m => isMicroSystem(m.moduleType));
                  const regularServices = modules.filter(m => !isMicroSystem(m.moduleType));

                  return (
                    <>
                      {/* 🚀 SEÇÃO DE MICRO SISTEMAS */}
                      {microSystems.length > 0 && (
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-3 border-b pb-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Micro Sistemas</h2>
                              <p className="text-sm text-muted-foreground">
                                Aplicações completas com gestão avançada e workflows
                              </p>
                            </div>
                            <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600">
                              {microSystems.length} MS Disponíveis
                            </Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {microSystems.map((ms) => {
                              const targetRoute = getServiceRoute(ms.moduleType, ms.slug, department);

                              return (
                                <Card
                                  key={ms.id}
                                  className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                                  onClick={() => router.push(targetRoute)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2">
                                        <FileText className="h-6 w-6 text-white" />
                                      </div>
                                      <Badge variant="secondary" className="text-xs">
                                        SUPER APP
                                      </Badge>
                                    </div>
                                    <CardTitle className="text-lg">{ms.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs">
                                      {ms.description}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {/* Stats do MS */}
                                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                                          <div className="font-bold text-lg">{ms.stats.total}</div>
                                          <div className="text-xs text-muted-foreground">Total</div>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-950 rounded p-2">
                                          <div className="font-bold text-lg text-orange-600">{ms.stats.pending}</div>
                                          <div className="text-xs text-muted-foreground">Pendente</div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 rounded p-2">
                                          <div className="font-bold text-lg text-green-600">{ms.stats.approved}</div>
                                          <div className="text-xs text-muted-foreground">Aprovado</div>
                                        </div>
                                      </div>

                                      {/* Features do MS */}
                                      <div className="flex gap-1 flex-wrap">
                                        <Badge variant="outline" className="text-xs bg-white/50">
                                          <LayoutDashboard className="h-3 w-3 mr-1" />
                                          Dashboard
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-white/50">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Workflow
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-white/50">
                                          <FileText className="h-3 w-3 mr-1" />
                                          Relatórios
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 📋 SEÇÃO DE SERVIÇOS REGULARES */}
                      {regularServices.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 border-b pb-3">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <h2 className="text-xl font-semibold">Serviços e Solicitações</h2>
                              <p className="text-sm text-muted-foreground">
                                Serviços gerais e solicitações do departamento
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {regularServices.map((service) => {
                              const targetRoute = getServiceRoute(service.moduleType, service.slug, department);

                              return (
                                <Card
                                  key={service.id}
                                  className={`cursor-pointer hover:shadow-lg transition-shadow ${config.bgColor} ${config.borderColor}`}
                                  onClick={() => router.push(targetRoute)}
                                >
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <FileText className={`h-5 w-5 ${config.color}`} />
                                      {service.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">
                                      {service.description}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {/* Stats do serviço */}
                                      <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Total:</span>
                                          <span className="font-medium">{service.stats.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Pendentes:</span>
                                          <span className="font-medium text-orange-600">
                                            {service.stats.pending}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Aprovados:</span>
                                          <span className="font-medium text-green-600">
                                            {service.stats.approved}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Features do serviço */}
                                      <div className="flex gap-2 flex-wrap">
                                        {service.hasScheduling && (
                                          <Badge variant="outline" className="text-xs">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Agenda
                                          </Badge>
                                        )}
                                        {service.hasLocation && (
                                          <Badge variant="outline" className="text-xs">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            Mapa
                                          </Badge>
                                        )}
                                        {service.requiresDocuments && (
                                          <Badge variant="outline" className="text-xs">
                                            <FileCheck className="h-3 w-3 mr-1" />
                                            Documentos
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* 📄 SERVIÇOS SEM_DADOS (Certidões, Declarações) */}
      {documents.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Certidões e Documentos</h2>
            <p className="text-sm text-muted-foreground">
              Serviços que geram protocolos para emissão de documentos oficiais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {service.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    <Plus className="h-3 w-3 mr-1" />
                    Solicitar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 📝 SERVIÇOS COM_DADOS SIMPLES (Sem módulo) */}
      {simpleServices.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Outros Serviços</h2>
            <p className="text-sm text-muted-foreground">
              Serviços com formulários de coleta de dados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simpleServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Criar Protocolo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 Ações Rápidas */}
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
              onClick={() => router.push(`/cidadao/servicos?asAdmin=true&departamento=${department}`)}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Novo Protocolo</span>
            </Button>

            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => router.push(`/admin/protocolos?departamento=${department}&status=pending`)}
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

      {/* Estado vazio */}
      {!loading && modules.length === 0 && documents.length === 0 && simpleServices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Este departamento ainda não possui serviços configurados.
            </p>
            <Button onClick={() => router.push('/admin/configuracoes/servicos')}>
              Configurar Serviços
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado de erro */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar dados: {error}</p>
            <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
