'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Search, Filter, Calendar, Building2, Briefcase, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface EmployeeAssignment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  organizationalUnit?: {
    id: string;
    nome: string;
    sigla: string;
  };
  position?: {
    id: string;
    nome: string;
    tipo: string;
  };
  function?: {
    id: string;
    nome: string;
    tipo: string;
  };
  tipo: string;
  situacao: string;
  isPrimary: boolean;
  dataInicio: string;
  dataFim?: string;
  cargaHoraria?: number;
  percentualDedicacao?: number;
}

export default function VinculosPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    situacao: 'ATIVO',
    tipo: '',
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchAssignments();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.situacao) params.append('situacao', filters.situacao);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await fetch(`/api/employee-assignments?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao carregar vínculos');

      let data = await response.json();

      // Filtro de busca no frontend
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        data = data.filter((assignment: EmployeeAssignment) =>
          assignment.user.name.toLowerCase().includes(searchLower) ||
          assignment.user.email.toLowerCase().includes(searchLower) ||
          assignment.department.name.toLowerCase().includes(searchLower)
        );
      }

      setAssignments(data);
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    const variants: Record<string, any> = {
      ATIVO: { variant: 'default', label: 'Ativo' },
      INATIVO: { variant: 'secondary', label: 'Inativo' },
      AFASTADO: { variant: 'destructive', label: 'Afastado' },
      LICENCA: { variant: 'outline', label: 'Licença' },
      SUSPENSO: { variant: 'destructive', label: 'Suspenso' },
      CEDIDO: { variant: 'outline', label: 'Cedido' },
    };

    const config = variants[situacao] || { variant: 'secondary', label: situacao };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const labels: Record<string, string> = {
      LOTACAO: 'Lotação',
      CEDENCIA: 'Cedência',
      REQUISICAO: 'Requisição',
      REMOCAO: 'Remoção',
      DISPOSICAO: 'Disposição',
    };

    return <Badge variant="outline">{labels[tipo] || tipo}</Badge>;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-600" />
                Gestão de Vínculos Funcionais
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie os vínculos dos servidores com cargos, funções e unidades organizacionais
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Vínculo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Vínculo</DialogTitle>
                </DialogHeader>
                {/* Form de criação aqui */}
                <p className="text-gray-600">
                  Formulário de criação de vínculo será implementado em breve
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, email..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Secretaria</Label>
              <Select
                value={filters.departmentId}
                onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Situação</Label>
              <Select
                value={filters.situacao}
                onValueChange={(value) => setFilters({ ...filters, situacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="AFASTADO">Afastado</SelectItem>
                  <SelectItem value="LICENCA">Licença</SelectItem>
                  <SelectItem value="CEDIDO">Cedido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={filters.tipo}
                onValueChange={(value) => setFilters({ ...filters, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="LOTACAO">Lotação</SelectItem>
                  <SelectItem value="CEDENCIA">Cedência</SelectItem>
                  <SelectItem value="REQUISICAO">Requisição</SelectItem>
                  <SelectItem value="REMOCAO">Remoção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum vínculo encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Secretaria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {assignment.user.name}
                          {assignment.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {assignment.department.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.organizationalUnit ? (
                        <div className="text-sm">
                          {assignment.organizationalUnit.nome}
                          <span className="text-gray-500 ml-1">
                            ({assignment.organizationalUnit.sigla})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.position ? (
                        <div className="text-sm">
                          {assignment.position.nome}
                          <div className="text-xs text-gray-500">
                            {assignment.position.tipo}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getTipoBadge(assignment.tipo)}</TableCell>
                    <TableCell>{getSituacaoBadge(assignment.situacao)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(new Date(assignment.dataInicio), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </div>
                        {assignment.dataFim && (
                          <div className="text-gray-500">
                            até{' '}
                            {format(new Date(assignment.dataFim), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/vinculos/${assignment.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/vinculos/${assignment.id}/editar`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Estatísticas */}
        {!loading && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total de Vínculos</div>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Ativos</div>
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter((a) => a.situacao === 'ATIVO').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Afastados</div>
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter((a) => a.situacao === 'AFASTADO').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Inativos</div>
              <div className="text-2xl font-bold text-gray-600">
                {assignments.filter((a) => a.situacao === 'INATIVO').length}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
