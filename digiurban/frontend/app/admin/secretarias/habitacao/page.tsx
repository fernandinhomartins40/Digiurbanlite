'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Home,
  Users,
  Building,
  FileText,
  TrendingUp,
  Plus,
  FileBarChart,
  AlertCircle,
  DollarSign,
  FileCheck,
  List,
} from 'lucide-react';
import { useHabitacaoStats } from '@/hooks/useHabitacaoStats';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaHabitacaoPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('habitacao');

  // Buscar estatísticas
  const { stats, loading: statsLoading, error: statsError } = useHabitacaoStats();

  // Separar serviços
  const servicesWithModule = services.filter((s: any) => s.moduleType && s.serviceType === 'COM_DADOS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Home className="h-8 w-8 text-blue-600 mr-3" />
            Secretaria Municipal de Habitação
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão de programas habitacionais, regularização fundiária e moradia popular
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Moradia Digna
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Famílias Cadastradas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.families.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.families.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imóveis Disponíveis</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.units.available || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.units.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programas Habitacionais</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.programs.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  ativos
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
              onClick={() => router.push('/admin/protocolos?departamento=habitacao&status=pending')}
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
            Gestão de cadastros e dados estruturados da habitação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atendimentos */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/atendimentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Registro de atendimentos habitacionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programas Habitacionais */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/programas-habitacionais')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Programas Habitacionais
              </CardTitle>
              <CardDescription>
                MCMV, Casa Verde e Amarela e outros programas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">{stats?.programs.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.programs.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regularização Fundiária */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/regularizacao-fundiaria')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                Regularização Fundiária
              </CardTitle>
              <CardDescription>
                Processos de regularização de terrenos e imóveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Em análise:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auxílio Aluguel */}
          <Card className="border-emerald-200 bg-emerald-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/auxilio-aluguel')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Auxílio Aluguel
              </CardTitle>
              <CardDescription>
                Programa de auxílio aluguel para famílias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beneficiários:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unidades Habitacionais */}
          <Card className="border-teal-200 bg-teal-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/unidades-habitacionais')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-teal-600" />
                Unidades Habitacionais
              </CardTitle>
              <CardDescription>
                Cadastro de imóveis e unidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.units.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ocupadas:</span>
                    <span className="font-medium">{stats?.units.occupied || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fila de Habitação */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/habitacao/fila-habitacao')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="h-5 w-5 text-orange-600" />
                Fila de Habitação
              </CardTitle>
              <CardDescription>
                Gestão da fila de espera para moradia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aguardando:</span>
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200 bg-amber-50/50"
                    onClick={() => setShowNewProtocolModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-600" />
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
                          <Badge variant="outline" className="bg-amber-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-amber-600 hover:bg-amber-700"
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
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço de documentos cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços SEM_DADOS
              </p>
            </CardContent>
          </Card>
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
                      <Home className="h-5 w-5 text-blue-600" />
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
              Crie tabelas personalizadas para dados específicos da habitação
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=housing')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Vistorias */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Vistorias
              </CardTitle>
              <CardDescription>
                Exemplo: registro de vistorias em unidades habitacionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Data, Endereço, Situação, Responsável, Observações
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=housing&template=vistorias')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Manutenções */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Manutenções
              </CardTitle>
              <CardDescription>
                Exemplo: controle de manutenções em unidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Tipo, Prioridade, Status, Data início, Data conclusão
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=housing&template=manutencoes')}
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
                Ver todos os módulos customizados criados para habitação
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=housing')}
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
                  <li>• Controle de vistorias habitacionais</li>
                  <li>• Registro de manutenções</li>
                  <li>• Acompanhamento de beneficiários</li>
                  <li>• Cadastro de documentos pendentes</li>
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
