'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useObrasPublicasStats } from '@/hooks/useObrasPublicasStats';
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
  FileCheck,
  Search,
  Copy,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaObrasPublicasPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('obras-publicas');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = useObrasPublicasStats();

  // Separar serviços por tipo
  const servicesComDados = services.filter((s: any) => s.serviceType === 'COM_DADOS');
  const servicesInformativos = services.filter((s: any) => s.serviceType === 'INFORMATIVO');

  // Calcular totais
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

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
            <CardTitle className="text-sm font-medium">Obras em Andamento</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.projects.inProgress || 0}</div>
                <p className="text-xs text-muted-foreground">
                  obras ativas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Concluídas</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.projects.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  no ano atual
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções Realizadas</CardTitle>
            <Construction className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.repairs.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  no mês atual
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200 bg-gray-50/50"
                    onClick={() => setShowNewProtocolModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-600" />
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
                          <Badge variant="outline" className="bg-gray-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gray-600 hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewProtocolModal(true);
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
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço de documentos cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços SEM_DADOS
              </p>
            </CardContent>
          </Card>
        )}
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
