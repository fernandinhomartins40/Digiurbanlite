'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useEsportesStats } from '@/hooks/useEsportesStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Award,
  Activity,
  Target,
  Dumbbell,
  Plus,
  FileText,
  AlertCircle,
  FileBarChart,
  Clock,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaEsportesPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('esportes');

  // Buscar estatísticas reais
  const { stats, loading: statsLoading, error: statsError } = useEsportesStats();

  // Separar serviços por tipo
  const servicesWithModule = services.filter((s: any) => s.moduleType);
  const allServices = services;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
            Secretaria Municipal de Esportes
          </h1>
          <p className="text-gray-600 mt-1">
            Fomento ao esporte e qualidade de vida
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
          Esporte Para Todos
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atletas Cadastrados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.athletes.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.athletes.total || 0} total cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes Esportivas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.teams.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.teams.total || 0} equipes cadastradas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Esportivos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.competitions.upcoming || 0}</div>
                <p className="text-xs text-muted-foreground">
                  neste mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
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
              onClick={() => router.push('/admin/protocolos?departamento=esportes&status=pending')}
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
            Gestão de cadastros e dados estruturados de esportes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atendimentos */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/atendimentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Registro de atendimentos esportivos
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

          {/* Atletas */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/atletas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600" />
                Atletas
              </CardTitle>
              <CardDescription>
                Cadastro de atletas e federados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">{stats?.athletes.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.athletes.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipes Esportivas */}
          <Card className="border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/equipes')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Equipes Esportivas
              </CardTitle>
              <CardDescription>
                Gestão de times municipais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativas:</span>
                    <span className="font-medium">{stats?.teams.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.teams.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escolinhas */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/escolinhas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Escolinhas Esportivas
              </CardTitle>
              <CardDescription>
                Programas de iniciação esportiva
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativas:</span>
                    <span className="font-medium">{stats?.schools.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alunos:</span>
                    <span className="font-medium">890</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reserva de Espaços */}
          <Card className="border-teal-200 bg-teal-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/reservas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-600" />
                Reserva de Espaços
              </CardTitle>
              <CardDescription>
                Agendamento de quadras e ginásios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reservas:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competições */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/competicoes')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Competições
              </CardTitle>
              <CardDescription>
                Inscrições em campeonatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscrições:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Torneios */}
          <Card className="border-pink-200 bg-pink-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/torneios')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-pink-600" />
                Torneios
              </CardTitle>
              <CardDescription>
                Inscrições de equipes em torneios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscrições:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modalidades */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/modalidades')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-indigo-600" />
                Modalidades
              </CardTitle>
              <CardDescription>
                Cadastro de modalidades esportivas
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

          {/* Infraestrutura */}
          <Card className="border-cyan-200 bg-cyan-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/esportes/infraestrutura')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-600" />
                Infraestrutura
              </CardTitle>
              <CardDescription>
                Ginásios, campos e quadras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativos:</span>
                    <span className="font-medium">{stats?.infrastructures.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.infrastructures.total || 0}</span>
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 bg-orange-50/50"
                    onClick={() => setShowNewProtocolModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
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
                          <Badge variant="outline" className="bg-orange-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-orange-600 hover:bg-orange-700"
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
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-orange-400 mb-4" />
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
              <Card key={service.id} className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-yellow-600">
                      {service.moduleEntity}
                    </Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
              Crie tabelas personalizadas para dados específicos de esportes
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=sports')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Controle de Competições */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Controle de Competições
              </CardTitle>
              <CardDescription>
                Exemplo: tabela para gerenciar torneios e campeonatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Nome, Modalidade, Data, Local, Participantes
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=sports&template=competicoes')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Reservas de Espaços */}
          <Card className="border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-yellow-600" />
                Reservas de Espaços
              </CardTitle>
              <CardDescription>
                Exemplo: controle de uso de ginásios e quadras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Espaço, Data, Horário, Responsável, Finalidade
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=sports&template=reservas')}
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
                Ver todos os módulos customizados criados para esportes
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=sports')}
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
                  <li>• Controle de uniformes e equipamentos</li>
                  <li>• Registro de eventos e competições</li>
                  <li>• Avaliação física de atletas</li>
                  <li>• Gestão de patrocínios</li>
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
