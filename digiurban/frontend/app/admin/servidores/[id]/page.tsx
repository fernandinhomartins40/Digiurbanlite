'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  User,
  Briefcase,
  Users,
  Calendar,
  Building2,
  Award,
  Clock,
  ArrowRight,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssignmentData {
  id: string;
  situacao?: string;
  isPrimary?: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  cargaHoraria?: number | null;
  percentualDedicacao?: number | null;
  department?: { name?: string } | null;
  position?: { nome?: string } | null;
  function?: { nome?: string } | null;
  organizationalUnit?: { nome?: string } | null;
}

interface HierarchyData {
  id: string;
  ativo?: boolean;
  tipo?: string;
  supervisor?: { name?: string } | null;
  subordinado?: { name?: string } | null;
  organizationalUnit?: { nome?: string } | null;
}

interface HealthData {
  categoria?: string;
  registroProfissional?: string;
  tipoRegistro?: string;
  ufRegistro?: string;
  cns?: string;
  cbo?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string | null;
  assignments: AssignmentData[];
  subordinados: HierarchyData[];
  supervisores: HierarchyData[];
  healthData?: HealthData | null;
  educationData?: unknown;
}

function parseValidDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateSafe(value?: string | null, pattern: string = 'dd/MM/yyyy'): string {
  const date = parseValidDate(value);
  if (!date) {
    return '-';
  }

  return format(date, pattern, { locale: ptBR });
}

function getYearsSince(value?: string | null): string {
  const date = parseValidDate(value);
  if (!date) {
    return '-';
  }

  const years = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365));
  return String(Math.max(0, years));
}

export default function PerfilServidorPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      const userResponse = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      });

      if (!userResponse.ok) throw new Error('Erro ao carregar usuario');
      const userData = await userResponse.json();

      const assignmentsResponse = await fetch(`/api/employee-assignments/user/${userId}?includeInactive=true`, {
        credentials: 'include',
      });

      let assignments: AssignmentData[] = [];
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        assignments = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData?.data || [];
      }

      const subordinadosResponse = await fetch(`/api/employee-hierarchies/employee/${userId}/subordinates?includeInactive=true`, {
        credentials: 'include',
      });

      let subordinados: HierarchyData[] = [];
      if (subordinadosResponse.ok) {
        const subordinadosData = await subordinadosResponse.json();
        subordinados = Array.isArray(subordinadosData) ? subordinadosData : subordinadosData?.data || [];
      }

      const supervisoresResponse = await fetch(`/api/employee-hierarchies/employee/${userId}/supervisors?includeInactive=true`, {
        credentials: 'include',
      });

      let supervisores: HierarchyData[] = [];
      if (supervisoresResponse.ok) {
        const supervisoresData = await supervisoresResponse.json();
        supervisores = Array.isArray(supervisoresData) ? supervisoresData : supervisoresData?.data || [];
      }

      const healthDataResponse = await fetch(`/api/professional-data/health/${userId}`, {
        credentials: 'include',
      });

      let healthData: HealthData | null = null;
      if (healthDataResponse.ok) {
        const healthPayload = await healthDataResponse.json();
        healthData = healthPayload?.data || healthPayload || null;
      }

      setUser({
        ...userData,
        assignments,
        subordinados,
        supervisores,
        healthData,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p className="text-gray-600">Servidor nao encontrado</p>
        </Card>
      </div>
    );
  }

  const vinculoAtivo =
    user.assignments.find((assignment) => assignment.isPrimary && assignment.situacao === 'ATIVO') ||
    user.assignments.find((assignment) => assignment.situacao === 'ATIVO');

  const sortedAssignments = [...user.assignments].sort((a, b) => {
    const dateA = parseValidDate(a.dataInicio)?.getTime() ?? 0;
    const dateB = parseValidDate(b.dataInicio)?.getTime() ?? 0;
    return dateB - dateA;
  });

  const activeSubordinates = user.subordinados.filter((item) => item.ativo);
  const activeSupervisors = user.supervisores.filter((item) => item.ativo);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>{user.email}</p>
                  <p>Role: {user.role}</p>
                  {vinculoAtivo && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{vinculoAtivo.department?.name || 'Sem departamento'}</span>
                      </div>
                      {vinculoAtivo.position?.nome && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{vinculoAtivo.position.nome}</span>
                        </div>
                      )}
                      {vinculoAtivo.organizationalUnit?.nome && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{vinculoAtivo.organizationalUnit.nome}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <div className="text-sm text-gray-600">Vinculos Ativos</div>
              <div className="text-2xl font-bold text-blue-600">
                {user.assignments.filter((assignment) => assignment.situacao === 'ATIVO').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Subordinados</div>
              <div className="text-2xl font-bold text-purple-600">{activeSubordinates.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Supervisores</div>
              <div className="text-2xl font-bold text-green-600">{activeSupervisors.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tempo de Servico</div>
              <div className="text-2xl font-bold text-orange-600">{getYearsSince(user.createdAt)} anos</div>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="timeline">Timeline de Carreira</TabsTrigger>
            <TabsTrigger value="vinculos">Vinculos</TabsTrigger>
            <TabsTrigger value="hierarquia">Hierarquia</TabsTrigger>
            {user.healthData && <TabsTrigger value="saude">Dados de Saude</TabsTrigger>}
          </TabsList>

          <TabsContent value="geral">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informacoes Gerais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Nome Completo</label>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Role</label>
                  <p className="font-medium">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <p className="font-medium">{user.isActive ? 'Ativo' : 'Inativo'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Data de Cadastro</label>
                  <p className="font-medium">{formatDateSafe(user.createdAt, "dd 'de' MMMM 'de' yyyy")}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Timeline de Carreira</h3>

              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                <div className="space-y-8">
                  {sortedAssignments.map((assignment) => (
                    <div key={assignment.id} className="relative pl-16">
                      <div className="absolute left-3 top-2 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Briefcase className="h-3 w-3 text-white" />
                      </div>

                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {assignment.position?.nome || 'Cargo nao especificado'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {assignment.organizationalUnit?.nome || assignment.department?.name || 'Sem unidade'}
                            </p>
                          </div>
                          <Badge variant={assignment.situacao === 'ATIVO' ? 'default' : 'secondary'}>
                            {assignment.situacao || 'Sem situacao'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateSafe(assignment.dataInicio)}
                          </div>
                          {assignment.dataFim ? (
                            <>
                              <ArrowRight className="h-4 w-4" />
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDateSafe(assignment.dataFim)}
                              </div>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4" />
                              <span className="text-green-600 font-medium">Atual</span>
                            </>
                          )}
                        </div>

                        {assignment.function?.nome && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">Funcao:</span>
                              <span>{assignment.function.nome}</span>
                            </div>
                          </div>
                        )}

                        {(assignment.cargaHoraria || assignment.percentualDedicacao) && (
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                            {assignment.cargaHoraria && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assignment.cargaHoraria}h/semana
                              </div>
                            )}
                            {assignment.percentualDedicacao && (
                              <div>{assignment.percentualDedicacao}% dedicacao</div>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {user.assignments.length === 0 && (
                <div className="text-center py-8 text-gray-600">Nenhum vinculo registrado</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="vinculos">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Vinculos Funcionais</h3>
              <div className="space-y-4">
                {user.assignments.map((assignment) => (
                  <Card key={assignment.id} className="p-4 border-l-4 border-l-blue-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{assignment.position?.nome || 'Sem cargo'}</h4>
                          <Badge variant={assignment.situacao === 'ATIVO' ? 'default' : 'secondary'}>
                            {assignment.situacao || 'Sem situacao'}
                          </Badge>
                          {assignment.isPrimary && <Badge variant="outline">Principal</Badge>}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{assignment.department?.name || 'Sem departamento'}</p>
                          {assignment.organizationalUnit?.nome && <p>{assignment.organizationalUnit.nome}</p>}
                          <p>
                            {formatDateSafe(assignment.dataInicio)}
                            {assignment.dataFim && <> ate {formatDateSafe(assignment.dataFim)}</>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hierarquia">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Supervisores
                </h3>
                <div className="space-y-3">
                  {activeSupervisors.map((hierarquia) => (
                    <Card key={hierarquia.id} className="p-3">
                      <p className="font-medium">{hierarquia.supervisor?.name || 'Supervisor'}</p>
                      <p className="text-sm text-gray-600">{hierarquia.tipo || '-'}</p>
                      {hierarquia.organizationalUnit?.nome && (
                        <p className="text-sm text-gray-500">{hierarquia.organizationalUnit.nome}</p>
                      )}
                    </Card>
                  ))}

                  {activeSupervisors.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum supervisor registrado</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Subordinados
                </h3>
                <div className="space-y-3">
                  {activeSubordinates.map((hierarquia) => (
                    <Card key={hierarquia.id} className="p-3">
                      <p className="font-medium">{hierarquia.subordinado?.name || 'Subordinado'}</p>
                      <p className="text-sm text-gray-600">{hierarquia.tipo || '-'}</p>
                      {hierarquia.organizationalUnit?.nome && (
                        <p className="text-sm text-gray-500">{hierarquia.organizationalUnit.nome}</p>
                      )}
                    </Card>
                  ))}

                  {activeSubordinates.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum subordinado registrado</p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {user.healthData && (
            <TabsContent value="saude">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Dados Profissionais de Saude</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Categoria</label>
                    <p className="font-medium">{user.healthData.categoria || '-'}</p>
                  </div>
                  {user.healthData.registroProfissional && (
                    <div>
                      <label className="text-sm text-gray-600">Registro Profissional</label>
                      <p className="font-medium">
                        {user.healthData.tipoRegistro} {user.healthData.registroProfissional} - {user.healthData.ufRegistro}
                      </p>
                    </div>
                  )}
                  {user.healthData.cns && (
                    <div>
                      <label className="text-sm text-gray-600">CNS</label>
                      <p className="font-medium">{user.healthData.cns}</p>
                    </div>
                  )}
                  {user.healthData.cbo && (
                    <div>
                      <label className="text-sm text-gray-600">CBO</label>
                      <p className="font-medium">{user.healthData.cbo}</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
