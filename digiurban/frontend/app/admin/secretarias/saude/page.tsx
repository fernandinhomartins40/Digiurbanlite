'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Users,
  Calendar,
  FileText,
  Activity,
  Plus,
  Shield,
  Stethoscope,
  AlertCircle,
  Pill,
  Syringe,
  Ambulance,
  CreditCard,
  UserPlus,
  Microscope,
  Truck,
  Home,
  ClipboardList,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useSaudeStats } from '@/hooks/useSaudeStats';

export default function SecretariaSaudePage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar serviços da secretaria de saúde
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('saude');

  // Buscar estatísticas reais
  const { stats: saudeStats, dashboard, healthUnitsStats, loading: statsLoading, error: statsError } = useSaudeStats();

  // Estatísticas consolidadas usando dados reais
  const stats = {
    healthUnits: {
      active: healthUnitsStats?.activeUnits || 0,
      total: healthUnitsStats?.totalUnits || 0
    },
    appointments: {
      monthly: dashboard?.appointmentsThisMonth || 0,
      growth: 0
    },
    professionals: {
      total: saudeStats?.modules.communityHealthAgents || 0,
      doctors: 0
    },
    protocols: {
      total: saudeStats?.totals.totalProtocols || 0,
      pending: 0,
      approved: 0
    }
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
            <Heart className="h-8 w-8 text-red-600 mr-3" />
            Secretaria Municipal de Saúde
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão integrada dos serviços de saúde municipal - SUS
          </p>
        </div>
        <Badge variant="outline" className="text-red-600 border-red-200">
          SUS Municipal
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades de Saúde</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.healthUnits.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.healthUnits.total || 0} cadastradas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos/Mês</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.appointments.monthly || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.appointments.growth || 0}% vs mês anterior
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.professionals.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.professionals.doctors || 0} médicos ativos
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
              onClick={() => router.push('/admin/protocolos?departamento=saude&status=pending')}
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
            Gestão de cadastros e dados estruturados da saúde municipal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atendimentos */}
          <Card className="border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/atendimentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Registro de atendimentos de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{saudeStats?.modules.healthAttendances || 0}</span>
                  </div>
                  {saudeStats?.modules.healthAttendances === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhum atendimento cadastrado
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agendamento de Consultas */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/agendamentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Agendamentos
              </CardTitle>
              <CardDescription>
                Agendamento de consultas médicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{saudeStats?.modules.healthAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Este mês:</span>
                    <span className="font-medium">{dashboard?.appointmentsThisMonth || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unidades de Saúde */}
          <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/unidades')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Unidades de Saúde
              </CardTitle>
              <CardDescription>
                UBS, CAPS, UPA e unidades especializadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativas:</span>
                    <span className="font-medium">{healthUnitsStats?.activeUnits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{healthUnitsStats?.totalUnits || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profissionais de Saúde */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/profissionais')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-indigo-600" />
                Profissionais
              </CardTitle>
              <CardDescription>
                Médicos, enfermeiros, ACS e especialistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.professionals.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Médicos:</span>
                    <span className="font-medium">{stats?.professionals.doctors || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cartão SUS / Pacientes */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/cartao-sus')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Cartão SUS
              </CardTitle>
              <CardDescription>
                Cadastro e emissão do Cartão Nacional de Saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pacientes:</span>
                    <span className="font-medium">{saudeStats?.modules.patients || 0}</span>
                  </div>
                  {saudeStats?.modules.patients === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhum paciente cadastrado
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controle de Medicamentos */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/medicamentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Medicamentos
              </CardTitle>
              <CardDescription>
                Controle de medicamentos da farmácia básica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispensações:</span>
                    <span className="font-medium">{saudeStats?.modules.medicationDispenses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estoque baixo:</span>
                    <span className="font-medium text-orange-600">{dashboard?.lowStockMedications || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vacinação */}
          <Card className="border-cyan-200 bg-cyan-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/vacinacao')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-cyan-600" />
                Vacinação
              </CardTitle>
              <CardDescription>
                Registro e acompanhamento de vacinação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aplicadas:</span>
                    <span className="font-medium">{saudeStats?.modules.vaccinations || 0}</span>
                  </div>
                  {saudeStats?.modules.vaccinations === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhuma vacinação registrada
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campanhas de Vacinação */}
          <Card className="border-teal-200 bg-teal-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/campanhas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                Campanhas de Saúde
              </CardTitle>
              <CardDescription>
                Gestão de campanhas e programas de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campanhas:</span>
                    <span className="font-medium">{saudeStats?.modules.healthCampaigns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativas:</span>
                    <span className="font-medium text-green-600">{dashboard?.activeCampaigns || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programas de Saúde */}
          <Card className="border-pink-200 bg-pink-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/programas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-pink-600" />
                Programas de Saúde
              </CardTitle>
              <CardDescription>
                Hipertensão, diabetes e programas especiais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Programas:</span>
                    <span className="font-medium">{saudeStats?.modules.healthPrograms || 0}</span>
                  </div>
                  {saudeStats?.modules.healthPrograms === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhum programa cadastrado
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitação de Exames */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/exames')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Microscope className="h-5 w-5 text-orange-600" />
                Exames
              </CardTitle>
              <CardDescription>
                Agendamento de exames laboratoriais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitados:</span>
                    <span className="font-medium">{saudeStats?.modules.healthExams || 0}</span>
                  </div>
                  {saudeStats?.modules.healthExams === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhum exame solicitado
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TFD - Tratamento Fora do Domicílio */}
          <Card className="border-emerald-200 bg-emerald-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/tfd')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                TFD
              </CardTitle>
              <CardDescription>
                Tratamento Fora do Domicílio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transportes:</span>
                    <span className="font-medium">{saudeStats?.modules.healthTransports || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitações:</span>
                    <span className="font-medium">{saudeStats?.modules.healthTransportRequests || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transporte de Pacientes */}
          <Card className="border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/transporte')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ambulance className="h-5 w-5 text-yellow-600" />
                Transporte de Pacientes
              </CardTitle>
              <CardDescription>
                Solicitação de ambulância e transporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitações:</span>
                    <span className="font-medium">{saudeStats?.modules.healthTransportRequests || 0}</span>
                  </div>
                  {dashboard?.activeEmergencies ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergências:</span>
                      <span className="font-medium text-red-600">{dashboard.activeEmergencies}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-2">
                      {saudeStats?.modules.healthTransportRequests === 0 ? 'Nenhuma solicitação' : '✓ Módulo ativo'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestão de ACS */}
          <Card className="border-violet-200 bg-violet-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/acs')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-violet-600" />
                Agentes Comunitários
              </CardTitle>
              <CardDescription>
                Gestão de Agentes Comunitários de Saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cadastrados:</span>
                    <span className="font-medium">{saudeStats?.modules.communityHealthAgents || 0}</span>
                  </div>
                  {saudeStats?.modules.communityHealthAgents === 0 ? (
                    <div className="text-xs text-muted-foreground mt-2">
                      Nenhum agente cadastrado
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-2">
                      ✓ Módulo ativo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atendimento Domiciliar */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/atendimento-domiciliar')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-indigo-600" />
                Atendimento Domiciliar
              </CardTitle>
              <CardDescription>
                Acompanhamento e cuidados em domicílio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Em acompanhamento:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Módulo disponível
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inscrições em Programas */}
          <Card className="border-rose-200 bg-rose-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/saude/inscricoes')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-rose-600" />
                Inscrições em Programas
              </CardTitle>
              <CardDescription>
                Cadastro em campanhas e programas de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inscritos:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Módulo disponível
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
                    className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 bg-red-50/50"
                    onClick={() => setShowNewProtocolModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" />
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
                          <Badge variant="outline" className="bg-red-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700"
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
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço de documentos cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços SEM_DADOS
              </p>
            </CardContent>
          </Card>
        )}
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
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Configure serviços para a Secretaria de Saúde
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
                      <Badge className="bg-red-600">
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
              <Card key={service.id} className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className="bg-red-600">
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
              Crie tabelas personalizadas para dados específicos da saúde
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=health')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Controle de Vacinas */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Controle de Vacinas
              </CardTitle>
              <CardDescription>
                Exemplo: tabela para controlar estoque e aplicação de imunobiológicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Vacina, Lote, Validade, Doses disponíveis, Temperatura
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=health&template=vacinas')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Equipamentos Médicos */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Equipamentos Médicos
              </CardTitle>
              <CardDescription>
                Exemplo: controle de manutenção e calibração de equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Equipamento, Patrimônio, Última manutenção, Próxima calibração
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=health&template=equipamentos')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Ver todos os módulos */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Gerenciar Módulos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ver todos os módulos customizados criados para saúde
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=health')}
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
                  <li>• Controle de estoque de medicamentos</li>
                  <li>• Registro de visitas domiciliares</li>
                  <li>• Monitoramento de pacientes crônicos</li>
                  <li>• Cadastro de equipamentos médicos</li>
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
