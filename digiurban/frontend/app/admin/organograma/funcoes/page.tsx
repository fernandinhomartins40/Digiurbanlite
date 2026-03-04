'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Edit2, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { TIPO_FUNCAO_COLORS, TIPO_FUNCAO_LABELS, TIPO_FUNCAO_OPTIONS } from '@/components/admin/organograma/organogram-options';

interface Department {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  nome: string;
  organizationalUnit?: {
    id: string;
    nome: string;
    sigla?: string | null;
  } | null;
}

interface Funcao {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  simbolo?: string;
  valor?: number | string;
  departmentId: string;
  positionId?: string | null;
  department?: Department;
  position?: PositionOption | null;
  _count?: {
    assignments?: number;
  };
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function FuncoesPage() {
  const { apiRequest } = useAdminAuth();
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuncao, setSelectedFuncao] = useState<Funcao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      setDepartments(response?.data?.departments ?? response?.departments ?? []);
    } catch {
      setDepartments([]);
    }
  };

  const loadPositions = async (departmentId: string) => {
    try {
      const response = await apiRequest(`/positions?departmentId=${departmentId}&isActive=true`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setPositions(list);
    } catch {
      setPositions([]);
    }
  };

  const loadFuncoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ isActive: 'true' });
      if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
      if (filterPosition !== 'all') params.set('positionId', filterPosition);
      if (filterTipo !== 'all') params.set('tipo', filterTipo);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await apiRequest(`/functions?${params.toString()}`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setFuncoes(list);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar funcoes');
      setFuncoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    if (filterDepartment === 'all') {
      setPositions([]);
      setFilterPosition('all');
      return;
    }
    void loadPositions(filterDepartment);
  }, [filterDepartment]);

  useEffect(() => {
    void loadFuncoes();
  }, [filterDepartment, filterPosition, filterTipo, searchTerm]);

  const createHref = useMemo(() => {
    const params = new URLSearchParams({ returnTo: '/admin/organograma/funcoes' });
    if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
    if (filterPosition !== 'all') params.set('positionId', filterPosition);
    return `/admin/organograma/funcoes/nova?${params.toString()}`;
  }, [filterDepartment, filterPosition]);

  const handleDelete = async () => {
    if (!selectedFuncao) return;
    setSaving(true);
    try {
      await apiRequest(`/functions/${selectedFuncao.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setSelectedFuncao(null);
      void loadFuncoes();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : 'Erro ao desativar funcao');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/organograma">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
                <BarChart3 className="h-7 w-7 text-pink-600 md:h-8 md:w-8" />
                Funcoes
              </h1>
              <p className="mt-1 text-sm text-gray-600 md:text-base">
                Cada funcao deve estar vinculada a um cargo especifico do organograma.
              </p>
            </div>
          </div>
          <Link href={createHref}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova funcao
            </Button>
          </Link>
        </div>

        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="sr-only">Secretaria</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Secretaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as secretarias</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="sr-only">Cargo</Label>
              <Select
                value={filterPosition}
                onValueChange={setFilterPosition}
                disabled={filterDepartment === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.organizationalUnit?.sigla
                        ? `${position.organizationalUnit.sigla} - ${position.nome}`
                        : position.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="sr-only">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPO_FUNCAO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_FUNCAO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar funcao"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            <span className="ml-3 text-gray-600">Carregando funcoes...</span>
          </div>
        )}

        {error && !loading && <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>}

        {!loading && !error && funcoes.length === 0 && (
          <Card className="p-8 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Nenhuma funcao encontrada</h3>
            <p className="mb-4 text-gray-600">
              Ajuste os filtros ou cadastre a primeira funcao vinculada a um cargo.
            </p>
            <Link href={createHref}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova funcao
              </Button>
            </Link>
          </Card>
        )}

        {!loading && !error && funcoes.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funcoes.map((funcao) => (
              <Card key={funcao.id} className="p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{funcao.nome}</h3>
                    {funcao.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{funcao.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/organograma/funcoes/${funcao.id}/editar`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedFuncao(funcao);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={TIPO_FUNCAO_COLORS[funcao.tipo] || ''}>
                    {TIPO_FUNCAO_LABELS[funcao.tipo] || funcao.tipo}
                  </Badge>
                  {funcao.simbolo && <Badge variant="outline">{funcao.simbolo}</Badge>}
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <p>
                    <strong>Secretaria:</strong> {funcao.department?.name || '-'}
                  </p>
                  <p>
                    <strong>Cargo:</strong> {funcao.position?.nome || '-'}
                  </p>
                  {funcao.position?.organizationalUnit && (
                    <p>
                      <strong>Unidade:</strong> {funcao.position.organizationalUnit.nome}
                    </p>
                  )}
                  {funcao.valor != null && (
                    <p>
                      <strong>Valor:</strong> {formatCurrency(funcao.valor)}
                    </p>
                  )}
                </div>

                <div className="mt-3 border-t pt-3 text-xs text-gray-500">
                  {funcao._count?.assignments ?? 0} lotacoes vinculadas
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desativar funcao</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja desativar <strong>{selectedFuncao?.nome}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Desativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
