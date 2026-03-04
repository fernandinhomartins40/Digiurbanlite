'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Edit2, Loader2, Plus, Search, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  NIVEL_CARGO_COLORS,
  NIVEL_CARGO_LABELS,
  NIVEL_CARGO_OPTIONS,
  TIPO_CARGO_COLORS,
  TIPO_CARGO_LABELS,
  TIPO_CARGO_OPTIONS,
} from '@/components/admin/organograma/organogram-options';

interface Department {
  id: string;
  name: string;
}

interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla?: string | null;
}

interface Position {
  id: string;
  nome: string;
  descricao?: string;
  cbo?: string;
  tipo: string;
  categoria?: string;
  nivel?: string;
  departmentId: string;
  organizationalUnitId?: string | null;
  cargaHorariaPadrao?: number;
  isActive?: boolean;
  department?: Department;
  organizationalUnit?: OrganizationalUnit | null;
  _count?: {
    assignments?: number;
    functions?: number;
  };
}

export default function CargosPage() {
  const { apiRequest } = useAdminAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizationalUnits, setOrganizationalUnits] = useState<OrganizationalUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterOrganizationalUnit, setFilterOrganizationalUnit] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      setDepartments(response?.data?.departments ?? response?.departments ?? []);
    } catch {
      setDepartments([]);
    }
  };

  const loadOrganizationalUnits = async (departmentId: string) => {
    try {
      const response = await apiRequest(`/organizational-units?departmentId=${departmentId}&isActive=true`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setOrganizationalUnits(list);
    } catch {
      setOrganizationalUnits([]);
    }
  };

  const loadPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ isActive: 'true' });
      if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
      if (filterOrganizationalUnit !== 'all') params.set('organizationalUnitId', filterOrganizationalUnit);
      if (filterTipo !== 'all') params.set('tipo', filterTipo);
      if (filterNivel !== 'all') params.set('nivel', filterNivel);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await apiRequest(`/positions?${params.toString()}`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setPositions(list);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar cargos');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    if (filterDepartment === 'all') {
      setOrganizationalUnits([]);
      setFilterOrganizationalUnit('all');
      return;
    }
    void loadOrganizationalUnits(filterDepartment);
  }, [filterDepartment]);

  useEffect(() => {
    void loadPositions();
  }, [filterDepartment, filterOrganizationalUnit, filterTipo, filterNivel, searchTerm]);

  const createHref = useMemo(() => {
    const params = new URLSearchParams({ returnTo: '/admin/organograma/cargos' });
    if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
    if (filterOrganizationalUnit !== 'all') params.set('organizationalUnitId', filterOrganizationalUnit);
    return `/admin/organograma/cargos/novo?${params.toString()}`;
  }, [filterDepartment, filterOrganizationalUnit]);

  const handleDelete = async () => {
    if (!selectedPosition) return;
    setSaving(true);
    try {
      await apiRequest(`/positions/${selectedPosition.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setSelectedPosition(null);
      void loadPositions();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : 'Erro ao desativar cargo');
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
                <Briefcase className="h-7 w-7 text-purple-600 md:h-8 md:w-8" />
                Cargos
              </h1>
              <p className="mt-1 text-sm text-gray-600 md:text-base">
                Cada cargo deve estar vinculado a uma unidade organizacional especifica.
              </p>
            </div>
          </div>
          <Link href={createHref}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo cargo
            </Button>
          </Link>
        </div>

        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <Label className="sr-only">Unidade</Label>
              <Select
                value={filterOrganizationalUnit}
                onValueChange={setFilterOrganizationalUnit}
                disabled={filterDepartment === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidade / setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {organizationalUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.sigla ? `${unit.sigla} - ${unit.nome}` : unit.nome}
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
                  {TIPO_CARGO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_CARGO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="sr-only">Nivel</Label>
              <Select value={filterNivel} onValueChange={setFilterNivel}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os niveis</SelectItem>
                  {NIVEL_CARGO_OPTIONS.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {NIVEL_CARGO_LABELS[nivel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar cargo"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Carregando cargos...</span>
          </div>
        )}

        {error && !loading && <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>}

        {!loading && !error && positions.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Nenhum cargo encontrado</h3>
            <p className="mb-4 text-gray-600">
              Ajuste os filtros ou cadastre o primeiro cargo vinculado a uma unidade.
            </p>
            <Link href={createHref}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo cargo
              </Button>
            </Link>
          </Card>
        )}

        {!loading && !error && positions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {positions.map((position) => (
              <Card key={position.id} className="p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="truncate font-semibold text-gray-900">{position.nome}</h3>
                    </div>
                    {position.descricao && (
                      <p className="line-clamp-2 text-sm text-gray-500">{position.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/organograma/cargos/${position.id}/editar`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      title="Desativar"
                      onClick={() => {
                        setSelectedPosition(position);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={TIPO_CARGO_COLORS[position.tipo] || ''}>
                    {TIPO_CARGO_LABELS[position.tipo] || position.tipo}
                  </Badge>
                  {position.nivel && (
                    <Badge variant="outline" className={NIVEL_CARGO_COLORS[position.nivel] || ''}>
                      {NIVEL_CARGO_LABELS[position.nivel] || position.nivel}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <p>
                    <strong>Secretaria:</strong> {position.department?.name || '-'}
                  </p>
                  <p>
                    <strong>Unidade:</strong>{' '}
                    {position.organizationalUnit
                      ? position.organizationalUnit.sigla
                        ? `${position.organizationalUnit.sigla} - ${position.organizationalUnit.nome}`
                        : position.organizationalUnit.nome
                      : '-'}
                  </p>
                  {position.cbo && (
                    <p>
                      <strong>CBO:</strong> {position.cbo}
                    </p>
                  )}
                  {position.cargaHorariaPadrao != null && (
                    <p>
                      <strong>Carga horaria:</strong> {position.cargaHorariaPadrao}h
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {position._count?.assignments ?? 0} lotacoes
                  </span>
                  <Link
                    href={`/admin/organograma/funcoes/nova?departmentId=${position.departmentId}&positionId=${position.id}&returnTo=/admin/organograma/cargos`}
                    className="font-medium text-purple-700 hover:text-purple-900"
                  >
                    Nova funcao
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desativar cargo</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja desativar <strong>{selectedPosition?.nome}</strong>?
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
