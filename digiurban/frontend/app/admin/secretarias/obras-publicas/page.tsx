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
  FileBarChart,
  ChevronRight,
  HardHat,
  Calendar,
  Info,
  Award,
} from 'lucide-react';
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal';
import { useRouter } from 'next/navigation';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection';
import { SecretariaModulosSection } from '@/components/modules/secretaria/SecretariaModulosSection';

export default function SecretariaObrasPublicasPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('obras-publicas');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = useObrasPublicasStats();

  // ✅ NOVO: Buscar módulos dinâmicos do backend
  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('obras-publicas');

  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('obras-publicas');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600' },
    { border: 'border-yellow-200', bg: 'bg-yellow-50/50', icon: 'text-yellow-600' },
    { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600' },
    { border: 'border-gray-200', bg: 'bg-gray-50/50', icon: 'text-gray-600' },
    { border: 'border-red-200', bg: 'bg-red-50/50', icon: 'text-red-600' },
    { border: 'border-green-200', bg: 'bg-green-50/50', icon: 'text-green-600' },
  ];

  // Todos os serviços
  const servicesComDados = services;
  const servicesInformativos = [];
  const allServices = services;

  // Calcular totais
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            <Construction className="h-7 w-7 md:h-8 md:w-8 text-orange-600 flex-shrink-0" />
            <span>Secretaria de Obras Públicas</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gestão de obras, reparos, vistorias técnicas e infraestrutura urbana
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200 self-start md:self-auto">
          Infraestrutura
        </Badge>
      </div>

      {/* Chamados Pendentes do Prefeito */}
      <PendingTicketsSection />

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

      {/* Seção: módulos gerais (Protocolos + Dados) desta secretaria */}
      <SecretariaModulosSection slug="obras-publicas" departmentName="Obras Públicas" />
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


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÕES DUPLICADAS REMOVIDAS - Agora temos apenas 2 seções:     */}
      {/* 1. Módulos COM_DADOS (acima) - painéis individuais             */}
      {/* 2. Serviços Gerais SEM_DADOS (acima) - painel agregado         */}
      {/* ═══════════════════════════════════════════════════════════════ */}

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
                onClick={() => router.push('/admin/servicos/novo?departmentCode=obras-publicas&serviceType=COM_DADOS')}
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
                      onClick={() => router.push(buildServiceCreationUrl('obras-publicas', suggestion))}
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
                    onClick={() => router.push(`/admin/secretarias/obras-publicas/sugestoes`)}
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
        departmentFilter="obras-publicas"
      />
    </div>
  );
}
