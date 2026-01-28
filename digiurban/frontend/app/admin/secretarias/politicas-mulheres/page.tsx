'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  Plus,
  FileBarChart,
  Award,
  Info,
  Calendar,
  TrendingUp,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal';
import { useRouter } from 'next/navigation';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection';

export default function SecretariaPoliticasMulheresPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  const {
    services,
    loading: servicesLoading,
    error: servicesError
  } = useSecretariaServices('politicas-mulheres');

  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('politicas-mulheres');

  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('politicas-mulheres');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-purple-200', bg: 'bg-purple-50/50', icon: 'text-purple-600' },
    { border: 'border-violet-200', bg: 'bg-violet-50/50', icon: 'text-violet-600' },
    { border: 'border-fuchsia-200', bg: 'bg-fuchsia-50/50', icon: 'text-fuchsia-600' },
    { border: 'border-purple-300', bg: 'bg-purple-50/50', icon: 'text-purple-700' },
    { border: 'border-violet-300', bg: 'bg-violet-50/50', icon: 'text-violet-700' },
    { border: 'border-fuchsia-300', bg: 'bg-fuchsia-50/50', icon: 'text-fuchsia-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            <Users className="h-7 w-7 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
            <span>Secretaria de Políticas para Mulheres</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Promoção da igualdade e proteção dos direitos das mulheres
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-200 self-start md:self-auto">
          Políticas Mulheres
        </Badge>
      </div>

      <PendingTicketsSection />

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Realizados</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Neste ano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mulheres em Programas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Ativas e em acompanhamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denúncias Acolhidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Total processado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oficinas Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Em funcionamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso direto às funcionalidades mais utilizadas</CardDescription>
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
              onClick={() => router.push('/admin/protocolos?departamento=politicas-mulheres&status=pending')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Protocolos Pendentes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Módulos de Gestão de Dados */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-purple-600" />
            Módulos de Gestão de Dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Painéis completos com checklist, timeline e dados estruturados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departmentLoading ? (
            <>
              {[1, 2, 3].map((i) => (
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
                  className={`${colors.border} ${colors.bg} hover:shadow-lg transition-all cursor-pointer group p-4`}
                  onClick={() => router.push(`/admin/secretarias/politicas-mulheres/${module.moduleType}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                        <FileText className={`h-4 w-4 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-purple-600 transition-colors">
                          {module.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {module.description || 'Módulo de gestão'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${colors.icon} group-hover:translate-x-0.5 transition-all flex-shrink-0`} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 bg-white/50 rounded">
                      <div className="text-base font-bold text-gray-900">
                        {module.stats?.total || 0}
                      </div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        Total
                      </div>
                    </div>
                    <div className="p-1.5 bg-purple-50 rounded">
                      <div className="text-base font-bold text-purple-700">
                        {module.stats?.pending || 0}
                      </div>
                      <div className="text-[9px] text-purple-700 uppercase tracking-wider">
                        Pend
                      </div>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded">
                      <div className="text-base font-bold text-green-700">
                        {module.stats?.approved || 0}
                      </div>
                      <div className="text-[9px] text-green-700 uppercase tracking-wider">
                        Aprov
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full border-purple-200 bg-purple-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo COM_DADOS cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Módulos são criados automaticamente quando você configura serviços COM_DADOS com moduleType único.
                </p>
                <Button
                  onClick={() => router.push('/admin/servicos/novo?departmentCode=POLITICAS_MULHERES&serviceType=COM_DADOS')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço COM_DADOS
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Serviços Gerais (SEM_DADOS) */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Serviços Gerais (Certidões e Documentos)
          </h2>
          <p className="text-sm text-muted-foreground">
            Painel consolidado para gerenciar todos os serviços SEM_DADOS
          </p>
        </div>

        {servicesLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 0 ? (
          <Card
            className="hover:shadow-xl transition-all cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 group"
            onClick={() => router.push('/admin/secretarias/politicas-mulheres/servicos-gerais')}
          >
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <Badge className="mb-3 bg-green-600 text-white">Painel Agregado SEM_DADOS</Badge>
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-3 group-hover:text-green-700 transition-colors">
                    <FileBarChart className="h-6 w-6 md:h-7 md:w-7 text-green-600 flex-shrink-0" />
                    <span>Gerenciar Todos os Serviços Gerais</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm md:text-base">
                    Visão consolidada de {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length} serviços
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                <FileBarChart className="h-5 w-5 mr-2" />
                Abrir Painel Consolidado →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço SEM_DADOS cadastrado</h3>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=POLITICAS_MULHERES&serviceType=SEM_DADOS')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Serviço SEM_DADOS
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sugestões Inteligentes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Sugestões de Serviços</h2>
            <p className="text-sm text-muted-foreground">
              Crie serviços com formulários dinâmicos baseados em sugestões inteligentes
            </p>
            {totalAvailable > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                {totalAvailable} {totalAvailable === 1 ? 'sugestão disponível' : 'sugestões disponíveis'}
              </p>
            )}
          </div>
        </div>

        {suggestionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : displayedSuggestions.length === 0 ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Award className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Todas as sugestões foram criadas!</h3>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=POLITICAS_MULHERES&serviceType=COM_DADOS')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Serviço Personalizado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-purple-600" />
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
                          <li className="text-purple-700">+ {suggestion.suggestedFields.length - 4} campos adicionais</li>
                        )}
                      </ul>
                    </div>

                    <Button
                      variant="default"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push(buildServiceCreationUrl('politicas-mulheres', suggestion))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar este Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <Card className="border-dashed border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
                  <h3 className="font-semibold text-lg mb-2 text-center">Ver Todas as Sugestões</h3>
                  <Button
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    onClick={() => router.push(`/admin/secretarias/politicas-mulheres/sugestoes`)}
                  >
                    Ver Todas ({totalAvailable})
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <ServiceSelectorModal
        open={showServiceSelectorModal}
        onOpenChange={setShowServiceSelectorModal}
        departmentFilter="politicas-mulheres"
      />
    </div>
  );
}
