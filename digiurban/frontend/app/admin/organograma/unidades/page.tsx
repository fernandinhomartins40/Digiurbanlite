'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Edit2, Eye, FolderTree, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  TIPO_UNIDADE_COLORS,
  TIPO_UNIDADE_LABELS,
  TIPO_UNIDADE_OPTIONS,
} from '@/components/admin/organograma/organogram-options';

interface Department {
  id: string;
  name: string;
}

interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  isActive?: boolean;
  departmentId?: string;
  parentId?: string | null;
  department?: Department;
  responsavel?: { id: string; name: string } | null;
  _count?: {
    assignments?: number;
    positions?: number;
  };
}

export default function UnidadesPage() {
  const { apiRequest } = useAdminAuth();
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [deletingUnit, setDeletingUnit] = useState<OrganizationalUnit | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      setDepartments(response?.data?.departments ?? response?.departments ?? []);
    } catch {
      setDepartments([]);
    }
  };

  const loadUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
      if (filterTipo !== 'all') params.set('tipo', filterTipo);
      const response = await apiRequest(`/organizational-units${params.toString() ? `?${params}` : ''}`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setUnits(list);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar unidades');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [filterDepartment, filterTipo]);

  const filteredUnits = useMemo(() => {
    let next = units.filter((unit) => (showActive ? unit.isActive !== false : unit.isActive === false));
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      next = next.filter(
        (unit) =>
          unit.nome.toLowerCase().includes(term) ||
          unit.sigla?.toLowerCase().includes(term) ||
          unit.responsavel?.name?.toLowerCase().includes(term)
      );
    }
    return next;
  }, [searchQuery, showActive, units]);

  const isManagedSecretary = (unit: OrganizationalUnit) => unit.tipo === 'SECRETARIA' && !unit.parentId;

  const newUnitHref = useMemo(() => {
    const params = new URLSearchParams({ returnTo: '/admin/organograma/unidades' });
    if (filterDepartment !== 'all') params.set('departmentId', filterDepartment);
    return `/admin/organograma/unidades/nova?${params.toString()}`;
  }, [filterDepartment]);

  const handleDelete = async () => {
    if (!deletingUnit) return;
    setSaving(true);
    try {
      await apiRequest(`/organizational-units/${deletingUnit.id}`, { method: 'DELETE' });
      setDeleteConfirmOpen(false);
      setDeletingUnit(null);
      void loadUnits();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : 'Erro ao desativar unidade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/organograma">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
                <FolderTree className="h-7 w-7 text-blue-600 md:h-8 md:w-8" />
                Unidades organizacionais
              </h1>
              <p className="mt-1 text-sm text-gray-600 md:text-base">
                Gerencie diretorias, divisioes, setores e demais subunidades. Secretarias sao geridas em cadastro proprio.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/organograma/secretarias">
              <Button variant="outline">Gerenciar secretarias</Button>
            </Link>
            <Link href={newUnitHref}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova unidade
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:w-56">
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

            <div className="w-full md:w-48">
              <Label className="sr-only">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPO_UNIDADE_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_UNIDADE_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nome, sigla ou responsavel"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button variant={showActive ? 'default' : 'outline'} size="sm" onClick={() => setShowActive(true)}>
                Ativas
              </Button>
              <Button variant={!showActive ? 'default' : 'outline'} size="sm" onClick={() => setShowActive(false)}>
                Inativas
              </Button>
            </div>
          </div>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando unidades...</span>
          </div>
        )}

        {error && !loading && <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>}

        {!loading && !error && filteredUnits.length === 0 && (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Nenhuma unidade encontrada</h3>
            <p className="mb-4 text-gray-600">
              {searchQuery.trim()
                ? 'Nenhuma unidade corresponde aos filtros aplicados.'
                : 'Ainda nao existem unidades cadastradas.'}
            </p>
            <Link href={newUnitHref}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar unidade
              </Button>
            </Link>
          </Card>
        )}

        {!loading && !error && filteredUnits.length > 0 && (
          <>
            <div className="hidden md:block">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-100">
                        <th className="p-3 text-left font-semibold text-gray-700">Nome</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Sigla</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Tipo</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Secretaria</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Responsavel</th>
                        <th className="p-3 text-center font-semibold text-gray-700">Servidores</th>
                        <th className="p-3 text-center font-semibold text-gray-700">Cargos</th>
                        <th className="p-3 text-center font-semibold text-gray-700">Status</th>
                        <th className="p-3 text-right font-semibold text-gray-700">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((unit) => {
                        const isSecretary = isManagedSecretary(unit);
                        return (
                          <tr key={unit.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-3 font-medium text-gray-900">{unit.nome}</td>
                            <td className="p-3 text-gray-600">{unit.sigla || '-'}</td>
                            <td className="p-3">
                              <Badge className={`${TIPO_UNIDADE_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700'} border`}>
                                {TIPO_UNIDADE_LABELS[unit.tipo] || unit.tipo}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600">{unit.department?.name || '-'}</td>
                            <td className="p-3 text-gray-600">{unit.responsavel?.name || '-'}</td>
                            <td className="p-3 text-center text-gray-600">{unit._count?.assignments ?? 0}</td>
                            <td className="p-3 text-center text-gray-600">{unit._count?.positions ?? 0}</td>
                            <td className="p-3 text-center">
                              <Badge variant={unit.isActive === false ? 'secondary' : 'default'}>
                                {unit.isActive === false ? 'Inativa' : 'Ativa'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/organograma/unidades/${unit.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Visualizar">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {isSecretary ? (
                                  <Link href={`/admin/organograma/secretarias/${unit.departmentId}/editar`}>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                      Secretaria
                                    </Button>
                                  </Link>
                                ) : (
                                  <>
                                    <Link href={`/admin/organograma/unidades/${unit.id}/editar`}>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      title="Desativar"
                                      onClick={() => {
                                        setDeletingUnit(unit);
                                        setDeleteConfirmOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredUnits.map((unit) => {
                const isSecretary = isManagedSecretary(unit);
                return (
                  <Card key={unit.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-gray-900">{unit.nome}</h3>
                        {unit.sigla && <p className="text-xs text-gray-500">{unit.sigla}</p>}
                      </div>
                      <Badge variant={unit.isActive === false ? 'secondary' : 'default'}>
                        {unit.isActive === false ? 'Inativa' : 'Ativa'}
                      </Badge>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className={`${TIPO_UNIDADE_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700'} border`}>
                        {TIPO_UNIDADE_LABELS[unit.tipo] || unit.tipo}
                      </Badge>
                      <span className="text-xs text-gray-500">{unit.department?.name || '-'}</span>
                    </div>

                    <div className="mb-3 text-xs text-gray-600">
                      <p>Responsavel: {unit.responsavel?.name || '-'}</p>
                      <p>{unit._count?.assignments ?? 0} servidores</p>
                      <p>{unit._count?.positions ?? 0} cargos</p>
                    </div>

                    <div className="flex items-center justify-end gap-1 border-t pt-2">
                      <Link href={`/admin/organograma/unidades/${unit.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {isSecretary ? (
                        <Link href={`/admin/organograma/secretarias/${unit.departmentId}/editar`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            Secretaria
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link href={`/admin/organograma/unidades/${unit.id}/editar`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setDeletingUnit(unit);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desativar unidade</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja desativar <strong>{deletingUnit?.nome}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
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
