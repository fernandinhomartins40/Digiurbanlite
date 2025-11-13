'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useSegurancaPublicaStats } from '@/hooks/useSegurancaPublicaStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Users,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Plus,
  FileBarChart,
  AlertCircle,
  Eye,
  Bell,
  Radio,
  Camera,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaSegurancaPublicaPage() {
  useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('seguranca-publica');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = useSegurancaPublicaStats();

  // Separar serviços por tipo
  const servicesWithModule = services.filter((s: any) => s.moduleType);
  const allServices = services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            Secretaria Municipal de Segurança Pública
          </h1>
          <p className="text-gray-600 mt-1">
            Proteção e segurança dos cidadãos
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Cidade Segura
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocorrências Registradas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.modules.occurrences || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.highlights.openOccurrences || 0} em andamento
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guarda Municipal</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.modules.guards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.highlights.activePatrols || 0} patrulhas ativas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Câmeras de Monitoramento</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.modules.surveillanceSystems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  sistemas ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.protocols.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.protocols.total || 0} no total
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
              onClick={() => router.push('/admin/protocolos?departamento=seguranca-publica&status=pending')}
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span>Ocorrências Pendentes</span>
              {stats && stats.highlights.openOccurrences > 0 && (
                <Badge className="mt-1" variant="destructive">
                  {stats.highlights.openOccurrences}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Módulos Padrões - Base de dados do sistema */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Padrões</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de cadastros e dados estruturados de segurança pública
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Atendimentos */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/atendimentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Gestão de solicitações e demandas de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.attendances || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocolos:</span>
                    <span className="font-medium">{stats?.protocols.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ocorrências */}
          <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/ocorrencias')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Registro de Ocorrências
              </CardTitle>
              <CardDescription>
                Registro e acompanhamento de ocorrências
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.occurrences || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Em andamento:</span>
                    <span className="font-medium">{stats?.highlights.openOccurrences || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apoio Guarda Municipal */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/apoio-guarda')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                Apoio Guarda Municipal
              </CardTitle>
              <CardDescription>
                Gestão e alocação da guarda municipal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guardas:</span>
                    <span className="font-medium">{stats?.modules.guards || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patrulhas:</span>
                    <span className="font-medium">{stats?.modules.patrols || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pontos Críticos */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/pontos-criticos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Pontos Críticos
              </CardTitle>
              <CardDescription>
                Mapeamento de áreas de risco e vulnerabilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.criticalPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alto risco:</span>
                    <span className="font-medium">{stats?.highlights.highRiskPoints || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card className="border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/alertas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Alertas de Segurança
              </CardTitle>
              <CardDescription>
                Sistema de alertas e notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">{stats?.modules.alerts || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Sistema de alertas
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/estatisticas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-purple-600" />
                Estatísticas Regionais
              </CardTitle>
              <CardDescription>
                Análise de dados por região
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ocorrências:</span>
                    <span className="font-medium">{stats?.modules.occurrences || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Análise regional
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vigilância */}
          <Card className="border-teal-200 bg-teal-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/vigilancia')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-teal-600" />
                Vigilância Integrada
              </CardTitle>
              <CardDescription>
                Monitoramento e videovigilância
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sistemas:</span>
                    <span className="font-medium">{stats?.modules.surveillanceSystems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Câmeras:</span>
                    <span className="font-medium">{stats?.modules.surveillanceSystems || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dashboard */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/dashboard')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Dashboard Segurança
              </CardTitle>
              <CardDescription>
                Indicadores e métricas de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocolos:</span>
                    <span className="font-medium">{stats?.protocols.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="font-medium">{stats?.protocols.pending || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Denúncia Anônima */}
          <Card className="border-pink-200 bg-pink-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/denuncia-anonima')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-pink-600" />
                Denúncia Anônima
              </CardTitle>
              <CardDescription>
                Recebimento e gestão de denúncias anônimas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.anonymousTips || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recentes:</span>
                    <span className="font-medium">{stats?.highlights.recentTips || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registro de Patrulha */}
          <Card className="border-cyan-200 bg-cyan-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/registro-patrulha')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5 text-cyan-600" />
                Registro de Patrulha
              </CardTitle>
              <CardDescription>
                Controle de patrulhamento e rondas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.patrols || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">{stats?.highlights.activePatrols || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitação de Câmera */}
          <Card className="border-violet-200 bg-violet-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/solicitacao-camera')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-violet-600" />
                Solicitação de Câmera
              </CardTitle>
              <CardDescription>
                Pedidos de instalação de câmeras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.cameraRequests || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Solicitações
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitação de Ronda */}
          <Card className="border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/seguranca-publica/solicitacao-ronda')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Solicitação de Ronda
              </CardTitle>
              <CardDescription>
                Pedidos de ronda especial ou emergencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.modules.patrolRequests || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="font-medium">{stats?.highlights.pendingPatrolRequests || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 bg-slate-50/50"
                    onClick={() => router.push(`/admin/servicos/${service.id}/solicitar`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
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
                          <Badge variant="outline" className="bg-slate-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-slate-600 hover:bg-slate-700"
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
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-slate-400 mb-4" />
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
                      <Badge className="bg-blue-600">Motor</Badge>
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
              <Shield className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Configure serviços para a Secretaria de Segurança Pública
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
                      <Shield className="h-5 w-5 text-blue-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-blue-600">
                      {service.moduleEntity}
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
                        <div>
                          <span className="text-muted-foreground">Pendentes:</span>
                          <span className="font-medium ml-2">0</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Em andamento:</span>
                          <span className="font-medium ml-2">0</span>
                        </div>
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
              Crie tabelas personalizadas para dados específicos de segurança pública
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=security')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Controle de Equipamentos */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Controle de Equipamentos
              </CardTitle>
              <CardDescription>
                Exemplo: gestão de coletes, rádios e equipamentos táticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Equipamento, Quantidade, Estado, Localização, Responsável
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=security&template=equipamentos')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Relatório de Rondas */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Relatório de Rondas
              </CardTitle>
              <CardDescription>
                Exemplo: registro detalhado de rondas e patrulhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Data/Hora, Região, Equipe, Ocorrências, Observações
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=security&template=rondas')}
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
                Ver todos os módulos customizados criados para segurança pública
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=security')}
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
                  <li>• Controle de equipamentos de segurança</li>
                  <li>• Relatórios detalhados de rondas</li>
                  <li>• Cadastro de denúncias anônimas</li>
                  <li>• Registro de vistorias preventivas</li>
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
