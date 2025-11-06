'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Construction,
  Headset,
  ClipboardCheck,
  Building2,
  Shield,
  FileText,
  Map,
  Plus,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaObrasPublicasPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // TODO: Migrar para arquitetura baseada em module-configs
  const servicesLoading = false;
  const statsLoading = false;
  const servicesError = null;
  const statsError = null;
  const services: any[] = [];
  const stats: any = {
    repairs: { active: 0, total: 0 },
    inspections: { total: 0, pending: 0 },
    projects: { active: 0, completed: 0 },
    protocols: { total: 0, pending: 0, approved: 0 }
  };

  // Separar serviços com e sem módulo
  const servicesWithModule = services.filter((s: any) => s.moduleType);
  const allServices = services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Construction className="h-8 w-8 text-orange-600 mr-3" />
            Secretaria de Obras Públicas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão de obras, reparos, vistorias técnicas e infraestrutura urbana
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          Infraestrutura
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reparos Ativos</CardTitle>
            <Construction className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.repairs.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.repairs.total || 0} cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vistorias</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.inspections.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.inspections.pending || 0} pendentes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.projects.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.projects.completed || 0} concluídas
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
              onClick={() => router.push('/admin/protocolos?departamento=obras-publicas&status=pending')}
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

      {/* Módulos Padrões - Base de dados do sistema */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Padrões</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de cadastros e dados estruturados de obras públicas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Atendimentos */}
          <Card className="border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/obras-publicas/atendimentos-obras-publicas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Headset className="h-5 w-5 text-amber-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Solicitações e atendimentos gerais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reparos de Vias */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/obras-publicas/reparos-de-vias')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Construction className="h-5 w-5 text-orange-600" />
                Reparos de Vias
              </CardTitle>
              <CardDescription>
                Solicitações de reparos em vias públicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendentes:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vistorias Técnicas */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/obras-publicas/vistorias-tecnicas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Vistorias Técnicas
              </CardTitle>
              <CardDescription>
                Solicitações de vistorias em imóveis e obras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativas:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cadastro de Obras */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/obras-publicas/cadastro-de-obras')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Cadastro de Obras
              </CardTitle>
              <CardDescription>
                Acompanhamento de obras em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Em andamento:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspeção de Obras */}
          <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/obras-publicas/inspecao-de-obras')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Inspeção de Obras
              </CardTitle>
              <CardDescription>
                Inspeções e fiscalizações de obras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Módulos Informativos */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Informativos</h2>
          <p className="text-sm text-muted-foreground">
            Consultas e informações sobre contratos e obras
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consulta de Contratos */}
          <Card className="border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow cursor-pointer border-dashed"
                onClick={() => router.push('/admin/secretarias/obras-publicas/consulta-contratos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                Consulta de Contratos
              </CardTitle>
              <CardDescription>
                Informações sobre contratos e licitações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Módulo informativo - apenas consulta
              </div>
            </CardContent>
          </Card>

          {/* Mapa de Obras */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer border-dashed"
                onClick={() => router.push('/admin/secretarias/obras-publicas/consulta-mapa-obras')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-green-600" />
                Mapa de Obras
              </CardTitle>
              <CardDescription>
                Visualização geográfica das obras públicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Módulo informativo - visualização no mapa
              </div>
            </CardContent>
          </Card>
        </div>
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
              <Construction className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Configure serviços para a Secretaria de Obras Públicas
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
                      <Badge className="bg-orange-600">
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
                        onClick={() => setShowNewProtocolModal(true)}
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
              <Card key={service.id} className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Construction className="h-5 w-5 text-orange-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-orange-600">
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
