'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Users, Briefcase, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Link from 'next/link';

interface ResponsavelInfo {
  id: string;
  name: string;
  email: string;
}

interface ParentUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
}

interface ChildUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  nivel: number;
  isActive: boolean;
  responsavel?: ResponsavelInfo;
  _count?: {
    children?: number;
    assignments?: number;
    positions?: number;
  };
}

interface Assignment {
  id: string;
  isPrimary: boolean;
  dataInicio?: string;
  position?: {
    id: string;
    nome: string;
    tipo?: string;
  };
  function?: {
    id: string;
    nome: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Position {
  id: string;
  nome: string;
  tipo?: string;
  nivel?: string;
  _count?: {
    assignments?: number;
  };
}

interface DepartmentInfo {
  id: string;
  name: string;
  code?: string;
}

interface UnitDetail {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  nivel: number;
  isActive: boolean;
  descricao?: string;
  departmentId?: string;
  parentId?: string | null;
  department?: DepartmentInfo;
  parent?: ParentUnit;
  responsavel?: ResponsavelInfo;
  children?: ChildUnit[];
  assignments?: Assignment[];
  positions?: Position[];
}

const TIPO_LABELS: Record<string, string> = {
  SECRETARIA: 'Secretaria',
  DIRETORIA: 'Diretoria',
  COORDENADORIA: 'Coordenadoria',
  DIVISAO: 'Divisao',
  SETOR: 'Setor',
  NUCLEO: 'Nucleo',
  GERENCIA: 'Gerencia',
  UNIDADE_ESPECIAL: 'Unidade Especial',
  DEPARTAMENTO: 'Departamento',
  ASSESSORIA: 'Assessoria',
};

const TIPO_COLORS: Record<string, string> = {
  SECRETARIA: 'bg-blue-100 text-blue-800 border-blue-300',
  DIRETORIA: 'bg-purple-100 text-purple-800 border-purple-300',
  COORDENADORIA: 'bg-green-100 text-green-800 border-green-300',
  DIVISAO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SETOR: 'bg-gray-100 text-gray-700 border-gray-300',
  NUCLEO: 'bg-pink-100 text-pink-800 border-pink-300',
  GERENCIA: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  UNIDADE_ESPECIAL: 'bg-teal-100 text-teal-800 border-teal-300',
  DEPARTAMENTO: 'bg-orange-100 text-orange-800 border-orange-300',
  ASSESSORIA: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const id = params.id as string;

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUnit();
    }
  }, [id]);

  const fetchUnit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/organizational-units/${id}`);
      setUnit(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da unidade.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando detalhes da unidade...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/admin/organograma')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Organograma
          </Button>
          <Card className="p-6 bg-red-50 border-red-200">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar unidade</h2>
            <p className="text-red-700">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/admin/organograma')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Organograma
          </Button>
          <Card className="p-6">
            <p className="text-gray-600">Unidade nao encontrada.</p>
          </Card>
        </div>
      </div>
    );
  }

  const tipoColor = TIPO_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
  const tipoLabel = TIPO_LABELS[unit.tipo] || unit.tipo;
  const children = unit.children || [];
  const assignments = unit.assignments || [];
  const positions = unit.positions || [];

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/admin/organograma')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Organograma
        </Button>

        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg border-2 ${tipoColor}`}>
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{unit.nome}</h1>
                  {unit.sigla && (
                    <span className="text-sm px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                      {unit.sigla}
                    </span>
                  )}
                  <Badge className={`${tipoColor} border`}>
                    {tipoLabel}
                  </Badge>
                  {unit.isActive === false && (
                    <Badge variant="destructive">Inativa</Badge>
                  )}
                </div>
                {unit.responsavel && (
                  <p className="text-gray-600 mt-1 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Responsavel: <span className="font-medium">{unit.responsavel.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="informacoes">
          <TabsList className="mb-4">
            <TabsTrigger value="informacoes">
              <Building2 className="h-4 w-4 mr-2" />
              Informacoes
            </TabsTrigger>
            <TabsTrigger value="subunidades">
              <Building2 className="h-4 w-4 mr-2" />
              Subunidades ({children.length})
            </TabsTrigger>
            <TabsTrigger value="servidores">
              <Users className="h-4 w-4 mr-2" />
              Servidores Lotados ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="cargos">
              <Briefcase className="h-4 w-4 mr-2" />
              Cargos ({positions.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informacoes */}
          <TabsContent value="informacoes">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacoes da Unidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-gray-900 mt-0.5">{unit.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sigla</label>
                  <p className="text-gray-900 mt-0.5">{unit.sigla || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <div className="mt-0.5">
                    <Badge className={`${tipoColor} border`}>
                      {tipoLabel}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nivel</label>
                  <p className="text-gray-900 mt-0.5">{unit.nivel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Departamento</label>
                  <p className="text-gray-900 mt-0.5">
                    {unit.department ? unit.department.name : (unit.departmentId || '-')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unidade Superior</label>
                  <p className="text-gray-900 mt-0.5">
                    {unit.parent ? (
                      <Link
                        href={`/admin/organograma/unidades/${unit.parent.id}`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {unit.parent.nome}
                        {unit.parent.sigla && (
                          <span className="text-gray-400 text-xs">({unit.parent.sigla})</span>
                        )}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Descricao</label>
                  <p className="text-gray-900 mt-0.5">{unit.descricao || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsavel</label>
                  <p className="text-gray-900 mt-0.5">
                    {unit.responsavel ? (
                      <span>
                        {unit.responsavel.name}
                        <span className="text-gray-400 text-sm ml-2">({unit.responsavel.email})</span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-0.5">
                    {unit.isActive !== false ? (
                      <Badge className="bg-green-100 text-green-800 border border-green-300">Ativa</Badge>
                    ) : (
                      <Badge variant="destructive">Inativa</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Subunidades */}
          <TabsContent value="subunidades">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subunidades</h2>
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhuma subunidade encontrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {children.map((child) => {
                    const childColor = TIPO_COLORS[child.tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
                    return (
                      <Link
                        key={child.id}
                        href={`/admin/organograma/unidades/${child.id}`}
                        className="block"
                      >
                        <div className={`border-2 rounded-lg p-4 ${childColor} hover:shadow-md transition-all cursor-pointer`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <Building2 className="h-5 w-5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">{child.nome}</span>
                                  {child.sigla && (
                                    <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">{child.sigla}</span>
                                  )}
                                  <Badge variant="outline" className="text-[10px]">
                                    {TIPO_LABELS[child.tipo] || child.tipo}
                                  </Badge>
                                  {child.isActive === false && (
                                    <Badge variant="destructive" className="text-[10px]">Inativa</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs mt-0.5 opacity-80">
                                  {child.responsavel && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {child.responsavel.name}
                                    </span>
                                  )}
                                  <span>{child._count?.assignments || 0} servidores</span>
                                  <span>{child._count?.children || 0} subunidades</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 opacity-50" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Servidores Lotados */}
          <TabsContent value="servidores">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Servidores Lotados</h2>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhum servidor lotado encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Servidor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cargo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Funcao</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Principal</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Data Inicio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {assignment.user?.name || '-'}
                              </p>
                              {assignment.user?.email && (
                                <p className="text-xs text-gray-500">{assignment.user.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {assignment.position?.nome || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {assignment.function?.nome || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {assignment.isPrimary ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-300">Sim</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">Nao</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {formatDate(assignment.dataInicio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Cargos */}
          <TabsContent value="cargos">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cargos</h2>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhum cargo encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-all bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Briefcase className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{position.nome}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {position.tipo && (
                                <Badge variant="outline" className="text-[10px]">{position.tipo}</Badge>
                              )}
                              {position.nivel && (
                                <span className="text-xs text-gray-500">Nivel: {position.nivel}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {position._count?.assignments || 0}
                          </p>
                          <p className="text-xs text-gray-500">lotacoes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
