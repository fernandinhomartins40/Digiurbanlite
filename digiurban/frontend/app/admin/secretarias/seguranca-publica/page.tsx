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
  Car,
  Calendar,
  Info,
  Award,
  FileCheck,
} from 'lucide-react';
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal';
import { useRouter } from 'next/navigation';
import { useDepartmentStats } from '@/hooks/useDepartmentStats';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';
import { PendingTicketsSection } from '@/components/departments/PendingTicketsSection';

export default function SecretariaSegurancaPublicaPage() {
  useAdminAuth();
  const router = useRouter();
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('seguranca-publica');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = useSegurancaPublicaStats();

  // ✅ NOVO: Buscar módulos dinâmicos do backend
  const {
    stats: departmentStats,
    loading: departmentLoading,
  } = useDepartmentStats('seguranca-publica');

  // ✅ Buscar sugestões inteligentes de serviços
  const {
    displayedSuggestions,
    hasMore,
    totalAvailable,
    isLoading: suggestionsLoading
  } = useServiceSuggestions('seguranca-publica');

  const modules = departmentStats?.services.filter(
    (s: any) => s.serviceType === 'COM_DADOS' && s.moduleType
  ) || [];

  const moduleColors = [
    { border: 'border-red-200', bg: 'bg-red-50/50', icon: 'text-red-600' },
    { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600' },
    { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600' },
    { border: 'border-yellow-200', bg: 'bg-yellow-50/50', icon: 'text-yellow-600' },
    { border: 'border-purple-200', bg: 'bg-purple-50/50', icon: 'text-purple-600' },
    { border: 'border-gray-200', bg: 'bg-gray-50/50', icon: 'text-gray-600' },
  ];

  // Todos os serviços
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

      {/* Chamados Pendentes do Prefeito */}
      <PendingTicketsSection />

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
              onClick={() => setShowServiceSelectorModal(true)}
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

      {/* ========================================
          SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS)
          ======================================== */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos de Gestão de Dados</h2>
          <p className="text-sm text-muted-foreground">
            Sistemas completos com formulários, validações e workflows personalizados
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
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : modules.length > 0 ? (
            modules.map((module: any) => (
              <Card
                key={module.id}
                className="hover:shadow-xl transition-all cursor-pointer border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 group"
                onClick={() => router.push(`/admin/secretarias/seguranca-publica/${module.moduleType}`)}
              >
                <CardHeader>
                  <Badge className="mb-2 bg-blue-600 text-white">Módulo COM_DADOS</Badge>
                  <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    <FileBarChart className="h-5 w-5" />
                    {module.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-2xl font-bold text-gray-900">{module.stats?.total || 0}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-yellow-700">{module.stats?.pending || 0}</div>
                      <div className="text-xs text-muted-foreground">Pendentes</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-green-700">{module.stats?.approved || 0}</div>
                      <div className="text-xs text-muted-foreground">Aprovados</div>
                    </div>
                  </div>
                  <Button className="w-full mt-4 group-hover:bg-blue-600 transition-colors" variant="outline">
                    Abrir Painel Completo →
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full border-blue-200 bg-blue-50/50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileBarChart className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum Módulo COM_DADOS Criado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Módulos aparecem automaticamente quando você cria serviços COM_DADOS com um moduleType
                </p>
                <Button
                  onClick={() => router.push('/admin/servicos/novo?departmentCode=seguranca-publica&serviceType=COM_DADOS')}
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

      {/* ========================================
          SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO
          ======================================== */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Serviços Gerais e Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Certidões, declarações e documentos oficiais - gerenciados em painel único
          </p>
        </div>

        <Card className="hover:shadow-xl transition-all cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 group"
          onClick={() => router.push('/admin/secretarias/seguranca-publica/servicos-gerais')}>
          <CardHeader>
            <Badge className="mb-3 bg-green-600 text-white">Painel Agregado SEM_DADOS</Badge>
            <CardTitle className="text-xl flex items-center gap-2 group-hover:text-green-600 transition-colors">
              <FileBarChart className="h-6 w-6" />
              Gerenciar Todos os Serviços Gerais
            </CardTitle>
            <CardDescription>
              Painel consolidado para visualizar e gerenciar protocolos de múltiplos serviços simultaneamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {services
                    .filter((s: any) => s.serviceType === 'SEM_DADOS')
                    .slice(0, 6)
                    .map((service: any) => (
                      <Badge key={service.id} variant="outline" className="bg-white text-gray-700 border-gray-300">
                        {service.name}
                      </Badge>
                    ))}
                  {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 6 && (
                    <Badge variant="secondary" className="bg-gray-200">
                      +{services.filter((s: any) => s.serviceType === 'SEM_DADOS').length - 6} mais
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Serviços Cadastrados</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length}
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Categorias</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {new Set(services.filter((s: any) => s.serviceType === 'SEM_DADOS').map((s: any) => s.category)).size}
                    </div>
                  </div>
                </div>

                {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <FileText className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-amber-800 font-medium">Nenhum serviço SEM_DADOS cadastrado ainda</p>
                    <p className="text-xs text-amber-600 mt-1">Execute o seed ou crie serviços manualmente</p>
                  </div>
                ) : (
                  <Button className="w-full mt-2 group-hover:bg-green-600 group-hover:text-white transition-colors" variant="outline">
                    Abrir Painel Consolidado →
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================
          SEÇÕES REMOVIDAS (consolidadas acima):
          - "Certidões individuais" → agregado em SEÇÃO 2
          - "Serviços COM_DADOS duplicados" → já em SEÇÃO 1
          - "Serviços Disponíveis duplicados" → removidos
          ======================================== */}

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
                onClick={() => router.push('/admin/servicos/novo?departmentCode=seguranca-publica&serviceType=COM_DADOS')}
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
                      onClick={() => router.push(buildServiceCreationUrl('seguranca-publica', suggestion))}
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
                    onClick={() => router.push(`/admin/secretarias/seguranca-publica/sugestoes`)}
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
        departmentFilter="seguranca-publica"
      />
    </div>
  );
}
