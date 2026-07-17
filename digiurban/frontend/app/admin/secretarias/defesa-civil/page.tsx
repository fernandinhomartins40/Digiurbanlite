'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldAlert,
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
import { SecretariaModulosSection } from '@/components/modules/secretaria/SecretariaModulosSection';

export default function SecretariaDefesaCivilPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  const {
    services,
    loading: servicesLoading,
    error: servicesError
  } = useSecretariaServices('defesa-civil');

  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('defesa-civil');

  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('defesa-civil');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600' },
    { border: 'border-red-200', bg: 'bg-red-50/50', icon: 'text-red-600' },
    { border: 'border-amber-200', bg: 'bg-amber-50/50', icon: 'text-amber-600' },
    { border: 'border-orange-300', bg: 'bg-orange-50/50', icon: 'text-orange-700' },
    { border: 'border-red-300', bg: 'bg-red-50/50', icon: 'text-red-700' },
    { border: 'border-amber-300', bg: 'bg-amber-50/50', icon: 'text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            <ShieldAlert className="h-7 w-7 md:h-8 md:w-8 text-orange-600 flex-shrink-0" />
            <span>Secretaria Municipal de Defesa Civil</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Prevenção e resposta a emergências e desastres
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200 self-start md:self-auto">
          Defesa Civil
        </Badge>
      </div>

      <PendingTicketsSection />

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocorrências Ativas</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Em atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Famílias Acolhidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Em situação de risco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Emitidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voluntários Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Cadastrados e treinados</p>
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
              onClick={() => router.push('/admin/protocolos?departamento=defesa-civil&status=pending')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Protocolos Pendentes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção: módulos gerais (Protocolos + Dados) desta secretaria */}
      <SecretariaModulosSection slug="defesa-civil" departmentName="Defesa Civil" />


      {/* Sugestões Inteligentes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Sugestões de Serviços</h2>
            <p className="text-sm text-muted-foreground">
              Crie serviços com formulários dinâmicos baseados em sugestões inteligentes
            </p>
            {totalAvailable > 0 && (
              <p className="text-xs text-orange-600 mt-1">
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
                onClick={() => router.push('/admin/servicos/novo?departmentCode=DEFESA_CIVIL&serviceType=COM_DADOS')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Serviço Personalizado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-orange-600" />
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
                          <li className="text-orange-600">
                            + {suggestion.suggestedFields.length - 4} campos adicionais
                          </li>
                        )}
                      </ul>
                    </div>

                    <Button
                      variant="default"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => router.push(buildServiceCreationUrl('defesa-civil', suggestion))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar este Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <Card className="border-dashed border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
                  <h3 className="font-semibold text-lg mb-2 text-center">Ver Todas as Sugestões</h3>
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => router.push(`/admin/secretarias/defesa-civil/sugestoes`)}
                  >
                    Ver Todas ({totalAvailable})
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Apps de Defesa Civil — sistemas especializados com tabelas próprias */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Apps de Defesa Civil</h2>
          <p className="text-sm text-muted-foreground">
            Sistemas especializados completos da secretaria
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/admin/apps/defesa-civil')}
          >
            <CardHeader>
              <CardTitle className="text-lg group-hover:text-orange-700 transition-colors">
                Ocorrências & Áreas de Risco
              </CardTitle>
              <CardDescription className="text-sm">
                Ocorrências georreferenciadas, vistorias com laudo e interdição, abrigos com
                capacidade/ocupação e famílias atingidas com ponte ao CadÚnico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Acessar Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ServiceSelectorModal
        open={showServiceSelectorModal}
        onOpenChange={setShowServiceSelectorModal}
        departmentFilter="defesa-civil"
      />
    </div>
  );
}
