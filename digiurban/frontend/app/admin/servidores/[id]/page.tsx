'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ROLE_DISPLAY_NAMES } from '@/types/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DepartmentSummary {
  id: string;
  name: string;
  code?: string | null;
}

interface OrganizationalUnitSummary {
  id: string;
  nome: string;
  sigla?: string | null;
  tipo?: string | null;
  nivel?: number | null;
}

interface PositionSummary {
  id: string;
  nome: string;
  tipo?: string | null;
  nivel?: string | null;
}

interface FunctionSummary {
  id: string;
  nome: string;
  tipo?: string | null;
  simbolo?: string | null;
}

interface AssignmentSummary {
  id: string;
  tipo?: string;
  situacao?: string;
  isPrimary?: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  cargaHoraria?: number | null;
  percentualDedicacao?: number | null;
  observacoes?: string | null;
  department?: DepartmentSummary | null;
  organizationalUnit?: OrganizationalUnitSummary | null;
  position?: PositionSummary | null;
  function?: FunctionSummary | null;
}

interface RelatedEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  assignments?: AssignmentSummary[];
}

interface HierarchySummary {
  id: string;
  tipo?: string | null;
  ativo?: boolean;
  organizationalUnit?: OrganizationalUnitSummary | null;
  supervisor?: RelatedEmployee | null;
  subordinado?: RelatedEmployee | null;
}

interface HealthData {
  categoria?: string | null;
  registroProfissional?: string | null;
  tipoRegistro?: string | null;
  ufRegistro?: string | null;
  cns?: string | null;
  cbo?: string | null;
  especialidades?: unknown;
  status?: string | null;
}

interface EducationData {
  categoria?: string | null;
  formacao?: string | null;
  disciplinas?: unknown;
  nivelEnsino?: unknown;
}

interface EngineeringData {
  categoria?: string | null;
  registroProfissional?: string | null;
  tipoRegistro?: string | null;
  especialidades?: unknown;
}

interface SocialAssistanceData {
  categoria?: string | null;
  registroProfissional?: string | null;
  tipoRegistro?: string | null;
  areasAtuacao?: unknown;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string | null;
  lastLogin?: string | null;
  cpf?: string | null;
  matricula?: string | null;
  rg?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  telefoneSecundario?: string | null;
  cargoEfetivo?: string | null;
  situacaoFuncional?: string | null;
  dataAdmissao?: string | null;
  observacoes?: string | null;
  department?: DepartmentSummary | null;
  departments?: DepartmentSummary[];
  primaryDepartment?: DepartmentSummary | null;
  assignments: AssignmentSummary[];
  supervisores: HierarchySummary[];
  subordinados: HierarchySummary[];
  healthData?: HealthData | null;
  educationData?: EducationData | null;
  engineeringData?: EngineeringData | null;
  socialAssistanceData?: SocialAssistanceData | null;
  _count?: {
    assignedProtocolsSimplified?: number;
    subordinados?: number;
  };
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

function extractArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function getPrimaryAssignment(assignments: AssignmentSummary[]): AssignmentSummary | null {
  return assignments.find((assignment) => assignment.isPrimary) || assignments[0] || null;
}

function formatRelatedAssignment(employee?: RelatedEmployee | null): string {
  const assignment = getPrimaryAssignment(employee?.assignments || []);
  if (!assignment) {
    return 'Sem lotacao ativa';
  }

  return (
    assignment.organizationalUnit?.sigla ||
    assignment.organizationalUnit?.nome ||
    assignment.position?.nome ||
    assignment.department?.name ||
    'Sem lotacao ativa'
  );
}

export default function PerfilServidorPage() {
  const params = useParams();
  const { apiRequest } = useAdminAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(`/admin/users/${userId}`);
      const payload = response?.data?.user || response?.user || response?.data || response;

      setUser({
        ...payload,
        departments: extractArray<DepartmentSummary>(payload?.departments),
        assignments: extractArray<AssignmentSummary>(payload?.assignments),
        subordinados: extractArray<HierarchySummary>(payload?.subordinados),
        supervisores: extractArray<HierarchySummary>(payload?.supervisores),
      });
    } catch (fetchError) {
      console.error('Erro ao carregar dados do servidor:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Erro ao carregar servidor');
    } finally {
      setLoading(false);
    }
  };

  const activeAssignments = useMemo(
    () =>
      (user?.assignments || []).filter((assignment) =>
        ['ATIVO', 'AFASTADO', 'LICENCA'].includes(assignment.situacao || '')
      ),
    [user]
  );

  const sortedAssignments = useMemo(
    () =>
      [...(user?.assignments || [])].sort((a, b) => {
        const dateA = parseValidDate(a.dataInicio)?.getTime() ?? 0;
        const dateB = parseValidDate(b.dataInicio)?.getTime() ?? 0;
        return dateB - dateA;
      }),
    [user]
  );

  const primaryAssignment = getPrimaryAssignment(activeAssignments);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="p-8 max-w-lg w-full">
          <p className="text-gray-700">{error || 'Servidor nao encontrado'}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/servidores">Voltar para servidores</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/servidores"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Perfil do Servidor</h1>
              <p className="text-sm md:text-base text-gray-600">
                Cadastro administrativo e estrutura funcional centralizada
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline">
              <Link href={`/admin/servidores/${user.id}/editar`}>
                <Shield className="mr-2 h-4 w-4" />
                Editar cadastro
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/organograma/lotacoes?userId=${user.id}`}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Gerenciar lotacoes
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">
                      {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] || user.role}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{user.telefone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{user.primaryDepartment?.name || 'Sem departamento principal'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>
                        {primaryAssignment?.position?.nome ||
                          primaryAssignment?.organizationalUnit?.nome ||
                          'Sem lotacao operacional ativa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[280px]">
                <Card className="shadow-none border">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-500">Lotacoes ativas</div>
                    <div className="text-2xl font-bold text-blue-600">{activeAssignments.length}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none border">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-500">Subordinados</div>
                    <div className="text-2xl font-bold text-purple-600">{user.subordinados.length}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none border">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-500">Protocolos</div>
                    <div className="text-2xl font-bold text-green-600">
                      {user._count?.assignedProtocolsSimplified || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none border">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-500">Tempo de servico</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {getYearsSince(user.dataAdmissao || user.createdAt)} anos
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="resumo">
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="lotacoes">Lotacoes</TabsTrigger>
            <TabsTrigger value="hierarquia">Hierarquia</TabsTrigger>
            <TabsTrigger value="profissional">Dados Profissionais</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro Administrativo</CardTitle>
                  <CardDescription>Dados base do servidor e escopo administrativo</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">CPF</div>
                    <div className="font-medium">{user.cpf || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Matricula</div>
                    <div className="font-medium">{user.matricula || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">RG</div>
                    <div className="font-medium">{user.rg || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Situacao funcional</div>
                    <div className="font-medium">{user.situacaoFuncional || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Nascimento</div>
                    <div className="font-medium">{formatDateSafe(user.dataNascimento)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Admissao</div>
                    <div className="font-medium">{formatDateSafe(user.dataAdmissao)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Criado em</div>
                    <div className="font-medium">{formatDateSafe(user.createdAt, "dd 'de' MMMM 'de' yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Ultimo login</div>
                    <div className="font-medium">{formatDateSafe(user.lastLogin, "dd/MM/yyyy HH:mm")}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Cargo efetivo informativo</div>
                    <div className="font-medium">{user.cargoEfetivo || '-'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Observacoes</div>
                    <div className="font-medium whitespace-pre-wrap">{user.observacoes || '-'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organograma Centralizado</CardTitle>
                  <CardDescription>Departamento, lotacao principal e escopo operacional atual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Departamento principal</div>
                    <div className="font-medium">{user.primaryDepartment?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Departamentos do escopo administrativo</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(user.departments || []).length > 0 ? (
                        (user.departments || []).map((department) => (
                          <Badge key={department.id} variant="secondary">
                            {department.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-600">Nenhum departamento vinculado</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <BadgeCheck className="h-4 w-4 text-green-600" />
                      Lotacao principal atual
                    </div>
                    <div className="text-sm text-slate-700">
                      Setor: {primaryAssignment?.organizationalUnit?.nome || '-'}
                    </div>
                    <div className="text-sm text-slate-700">
                      Cargo: {primaryAssignment?.position?.nome || '-'}
                    </div>
                    <div className="text-sm text-slate-700">
                      Funcao: {primaryAssignment?.function?.nome || '-'}
                    </div>
                    <div className="text-sm text-slate-700">
                      Tipo e situacao: {primaryAssignment?.tipo || '-'} / {primaryAssignment?.situacao || '-'}
                    </div>
                    <div className="text-sm text-slate-700">
                      Inicio: {formatDateSafe(primaryAssignment?.dataInicio)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lotacoes">
            <Card>
              <CardHeader>
                <CardTitle>Historico de Lotacoes</CardTitle>
                <CardDescription>Todas as lotacoes funcionais do servidor no organograma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedAssignments.length === 0 ? (
                  <p className="text-sm text-gray-600">Nenhuma lotacao registrada.</p>
                ) : (
                  sortedAssignments.map((assignment) => (
                    <Card key={assignment.id} className="border-l-4 border-l-blue-600 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {assignment.position?.nome || 'Sem cargo operacional'}
                              </span>
                              {assignment.isPrimary && <Badge variant="outline">Principal</Badge>}
                              <Badge variant={assignment.situacao === 'ATIVO' ? 'default' : 'secondary'}>
                                {assignment.situacao || '-'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Departamento: {assignment.department?.name || '-'}</div>
                              <div>Setor: {assignment.organizationalUnit?.nome || '-'}</div>
                              <div>Funcao: {assignment.function?.nome || '-'}</div>
                              <div>Tipo: {assignment.tipo || '-'}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDateSafe(assignment.dataInicio)} ate {formatDateSafe(assignment.dataFim)}
                              </span>
                            </div>
                            {assignment.cargaHoraria ? (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{assignment.cargaHoraria}h/semana</span>
                              </div>
                            ) : null}
                            {assignment.percentualDedicacao ? (
                              <div>{assignment.percentualDedicacao}% de dedicacao</div>
                            ) : null}
                          </div>
                        </div>
                        {assignment.observacoes && (
                          <div className="mt-3 border-t pt-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {assignment.observacoes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hierarquia">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supervisores</CardTitle>
                  <CardDescription>Relacoes hierarquicas ativas acima do servidor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.supervisores.length === 0 ? (
                    <p className="text-sm text-gray-600">Nenhum supervisor ativo registrado.</p>
                  ) : (
                    user.supervisores.map((hierarquia) => (
                      <Card key={hierarquia.id} className="shadow-none">
                        <CardContent className="p-4">
                          <div className="font-medium">{hierarquia.supervisor?.name || 'Supervisor'}</div>
                          <div className="text-sm text-gray-600">
                            {hierarquia.tipo || '-'} • {formatRelatedAssignment(hierarquia.supervisor)}
                          </div>
                          {hierarquia.organizationalUnit?.nome && (
                            <div className="text-sm text-gray-500 mt-1">
                              Unidade da hierarquia: {hierarquia.organizationalUnit.nome}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subordinados</CardTitle>
                  <CardDescription>Relacoes hierarquicas ativas abaixo do servidor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.subordinados.length === 0 ? (
                    <p className="text-sm text-gray-600">Nenhum subordinado ativo registrado.</p>
                  ) : (
                    user.subordinados.map((hierarquia) => (
                      <Card key={hierarquia.id} className="shadow-none">
                        <CardContent className="p-4">
                          <div className="font-medium">{hierarquia.subordinado?.name || 'Subordinado'}</div>
                          <div className="text-sm text-gray-600">
                            {hierarquia.tipo || '-'} • {formatRelatedAssignment(hierarquia.subordinado)}
                          </div>
                          {hierarquia.organizationalUnit?.nome && (
                            <div className="text-sm text-gray-500 mt-1">
                              Unidade da hierarquia: {hierarquia.organizationalUnit.nome}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profissional">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saude</CardTitle>
                  <CardDescription>Dados profissionais especificos, quando aplicavel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Categoria: {user.healthData?.categoria || '-'}</div>
                  <div>
                    Registro: {user.healthData?.tipoRegistro || '-'} {user.healthData?.registroProfissional || ''}
                    {user.healthData?.ufRegistro ? ` - ${user.healthData.ufRegistro}` : ''}
                  </div>
                  <div>CNS: {user.healthData?.cns || '-'}</div>
                  <div>CBO: {user.healthData?.cbo || '-'}</div>
                  <div>Status: {user.healthData?.status || '-'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outros Modulos</CardTitle>
                  <CardDescription>Convergencia dos dados profissionais setoriais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">Educacao</div>
                    <div className="text-gray-600">
                      Categoria: {user.educationData?.categoria || '-'} • Formacao: {user.educationData?.formacao || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Engenharia</div>
                    <div className="text-gray-600">
                      Categoria: {user.engineeringData?.categoria || '-'} • Registro: {user.engineeringData?.registroProfissional || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Assistencia Social</div>
                    <div className="text-gray-600">
                      Categoria: {user.socialAssistanceData?.categoria || '-'} • Registro: {user.socialAssistanceData?.registroProfissional || '-'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
