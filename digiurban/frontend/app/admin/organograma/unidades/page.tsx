'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2, Plus, Search, Edit2, Trash2, Eye, Loader2, ArrowLeft, FolderTree
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserBasic {
  id: string;
  name: string;
  email: string;
}

interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  nivel: number;
  isActive?: boolean;
  descricao?: string;
  departmentId?: string;
  parentId?: string | null;
  department?: Department;
  responsavel?: UserBasic;
  parent?: { id: string; nome: string } | null;
  children?: OrganizationalUnit[];
  _count?: {
    assignments?: number;
    positions?: number;
    teams?: number;
    children?: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPO_UNIDADE_OPTIONS = [
  'DIRETORIA', 'COORDENADORIA', 'DIVISAO', 'SETOR',
  'NUCLEO', 'GERENCIA', 'UNIDADE_ESPECIAL', 'DEPARTAMENTO', 'ASSESSORIA',
];

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
  SECRETARIA: 'bg-blue-100 text-blue-800',
  DIRETORIA: 'bg-purple-100 text-purple-800',
  COORDENADORIA: 'bg-green-100 text-green-800',
  DIVISAO: 'bg-yellow-100 text-yellow-800',
  SETOR: 'bg-gray-100 text-gray-700',
  NUCLEO: 'bg-pink-100 text-pink-800',
  GERENCIA: 'bg-indigo-100 text-indigo-800',
  UNIDADE_ESPECIAL: 'bg-teal-100 text-teal-800',
  DEPARTAMENTO: 'bg-orange-100 text-orange-800',
  ASSESSORIA: 'bg-cyan-100 text-cyan-800',
};

const NIVEL_BY_TIPO: Record<string, number> = {
  SECRETARIA: 1,
  DIRETORIA: 2,
  COORDENADORIA: 3,
  DIVISAO: 4,
  SETOR: 5,
  NUCLEO: 6,
  GERENCIA: 3,
  UNIDADE_ESPECIAL: 4,
  DEPARTAMENTO: 2,
  ASSESSORIA: 3,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnidadesPage() {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();

  // Data
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserBasic[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState(true);

  // Dialogs
  const [createEditOpen, setCreateEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<OrganizationalUnit | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipo: 'SETOR' as string,
    departmentId: '',
    parentId: '',
    responsavelId: '',
    descricao: '',
  });

  // -------------------------------------------------------------------------
  // Fetch helpers
  // -------------------------------------------------------------------------

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/departments');
      const deptList = response?.data?.departments ?? response?.departments ?? [];
      setDepartments(deptList);
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/team?limit=200');
      const teamMembers = response?.data?.teamMembers ?? [];
      setUsers(teamMembers.map((m: any) => ({ id: m.id, name: m.name, email: m.email })));
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDepartment && filterDepartment !== 'all') {
        params.append('departmentId', filterDepartment);
      }
      if (filterTipo && filterTipo !== 'all') {
        params.append('tipo', filterTipo);
      }
      const qs = params.toString();
      const url = `/organizational-units${qs ? `?${qs}` : ''}`;
      const response = await apiRequest(url);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setUnits(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar unidades');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, filterDepartment, filterTipo]);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // -------------------------------------------------------------------------
  // Filtered / searched list
  // -------------------------------------------------------------------------

  const filteredUnits = useMemo(() => {
    let result = units;

    // Active / inactive filter
    result = result.filter((u) => {
      const active = u.isActive !== false; // default true if undefined
      return showActive ? active : !active;
    });

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.nome.toLowerCase().includes(q) ||
          (u.sigla && u.sigla.toLowerCase().includes(q)) ||
          (u.responsavel?.name && u.responsavel.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [units, showActive, searchQuery]);

  // -------------------------------------------------------------------------
  // Parent units filtered by selected department in form
  // -------------------------------------------------------------------------

  const parentOptions = useMemo(() => {
    if (!formData.departmentId) return [];
    return units.filter(
      (u) =>
        u.departmentId === formData.departmentId &&
        u.isActive !== false &&
        (editingUnit ? u.id !== editingUnit.id : true)
    );
  }, [units, formData.departmentId, editingUnit]);

  const getDepartmentRootUnit = useCallback((departmentId?: string) => {
    if (!departmentId) return null;
    return (
      units.find(
        (unit) =>
          unit.departmentId === departmentId &&
          unit.tipo === 'SECRETARIA' &&
          !unit.parentId &&
          unit.isActive !== false
      ) || null
    );
  }, [units]);

  const isManagedRootSecretary = useCallback((unit: OrganizationalUnit) => {
    return unit.tipo === 'SECRETARIA' && !unit.parentId;
  }, []);

  // -------------------------------------------------------------------------
  // Dialog helpers
  // -------------------------------------------------------------------------

  const openCreateDialog = () => {
    const nextDepartmentId =
      filterDepartment !== 'all' ? filterDepartment : (departments[0]?.id ?? '');
    const rootUnit = getDepartmentRootUnit(nextDepartmentId);

    setEditingUnit(null);
    setFormData({
      nome: '',
      sigla: '',
      tipo: 'SETOR',
      departmentId: nextDepartmentId,
      parentId: rootUnit?.id || '',
      responsavelId: '',
      descricao: '',
    });
    setCreateEditOpen(true);
  };

  const openEditDialog = (unit: OrganizationalUnit) => {
    if (isManagedRootSecretary(unit)) {
      router.push('/admin/organograma/secretarias');
      return;
    }

    setEditingUnit(unit);
    setFormData({
      nome: unit.nome,
      sigla: unit.sigla || '',
      tipo: unit.tipo,
      departmentId: unit.departmentId || '',
      parentId: unit.parentId || '',
      responsavelId: unit.responsavel?.id || '',
      descricao: unit.descricao || '',
    });
    setCreateEditOpen(true);
  };

  const openDeleteDialog = (unit: OrganizationalUnit) => {
    setDeletingUnit(unit);
    setDeleteConfirmOpen(true);
  };

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    if (formData.tipo === 'SECRETARIA') {
      alert('Secretarias devem ser geridas pela página específica de secretarias.');
      return;
    }
    setSaving(true);
    try {
      const nivel = NIVEL_BY_TIPO[formData.tipo] || 5;
      const body: Record<string, any> = {
        nome: formData.nome.trim(),
        sigla: formData.sigla.trim() || undefined,
        tipo: formData.tipo,
        nivel,
        departmentId: formData.departmentId || undefined,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : undefined,
        responsavelId: formData.responsavelId && formData.responsavelId !== 'none' ? formData.responsavelId : undefined,
        descricao: formData.descricao.trim() || undefined,
      };

      if (editingUnit) {
        await apiRequest(`/organizational-units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest('/organizational-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      setCreateEditOpen(false);
      fetchUnits();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar unidade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;
    setSaving(true);
    try {
      await apiRequest(`/organizational-units/${deletingUnit.id}`, {
        method: 'DELETE',
      });
      setDeleteConfirmOpen(false);
      setDeletingUnit(null);
      fetchUnits();
    } catch (err: any) {
      alert(err.message || 'Erro ao desativar unidade');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '-';
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name ?? '-';
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/organograma">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FolderTree className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                  Unidades Organizacionais
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Gerencie diretorias, divisões, setores e demais subunidades. Secretarias são geridas em cadastro próprio.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/organograma/secretarias">
                <Button variant="outline">Gerenciar Secretarias</Button>
              </Link>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-wrap">
            {/* Department filter */}
            <div className="w-full md:w-52">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo filter */}
            <div className="w-full md:w-48">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPO_UNIDADE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, sigla ou responsavel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={showActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowActive(true)}
              >
                Ativas
              </Button>
              <Button
                variant={!showActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowActive(false)}
              >
                Inativas
              </Button>
            </div>
          </div>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando unidades...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && filteredUnits.length === 0 && (
          <Card className="p-8 text-center">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma unidade encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Nenhuma unidade corresponde aos filtros aplicados.'
                : 'Ainda nao existem unidades cadastradas.'}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" /> Criar Unidade
            </Button>
          </Card>
        )}

        {/* Desktop Table */}
        {!loading && filteredUnits.length > 0 && (
          <>
            {/* Table view (md+) */}
            <div className="hidden md:block">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Sigla</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Departamento</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Responsavel</th>
                        <th className="text-center p-3 font-semibold text-gray-700">Servidores</th>
                        <th className="text-center p-3 font-semibold text-gray-700">Cargos</th>
                        <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                        <th className="text-right p-3 font-semibold text-gray-700">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((unit) => {
                        const tipoColor = TIPO_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700';
                        const isActive = unit.isActive !== false;
                        const isManagedSecretary = isManagedRootSecretary(unit);
                        return (
                          <tr key={unit.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium text-gray-900">{unit.nome}</td>
                            <td className="p-3 text-gray-600">{unit.sigla || '-'}</td>
                            <td className="p-3">
                              <Badge className={`${tipoColor} border-0 text-xs`}>
                                {TIPO_LABELS[unit.tipo] || unit.tipo}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600">
                              {unit.department?.name || getDepartmentName(unit.departmentId)}
                            </td>
                            <td className="p-3 text-gray-600">
                              {unit.responsavel?.name || '-'}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {unit._count?.assignments ?? 0}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {unit._count?.positions ?? 0}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                                {isActive ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/organograma/unidades/${unit.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver detalhes">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {isManagedSecretary ? (
                                  <Link href="/admin/organograma/secretarias">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                      Secretaria
                                    </Button>
                                  </Link>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Editar"
                                      onClick={() => openEditDialog(unit)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      title="Desativar"
                                      onClick={() => openDeleteDialog(unit)}
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

            {/* Card view (mobile) */}
            <div className="md:hidden space-y-3">
              {filteredUnits.map((unit) => {
                const tipoColor = TIPO_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700';
                const isActive = unit.isActive !== false;
                const isManagedSecretary = isManagedRootSecretary(unit);
                return (
                  <Card key={unit.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{unit.nome}</h3>
                        {unit.sigla && (
                          <span className="text-xs text-gray-500">{unit.sigla}</span>
                        )}
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                        {isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={`${tipoColor} border-0 text-xs`}>
                        {TIPO_LABELS[unit.tipo] || unit.tipo}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {unit.department?.name || getDepartmentName(unit.departmentId)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      {unit.responsavel && (
                        <span>Resp: {unit.responsavel.name}</span>
                      )}
                      <span>{unit._count?.assignments ?? 0} servidores</span>
                      <span>{unit._count?.positions ?? 0} cargos</span>
                    </div>

                    <div className="flex items-center gap-1 justify-end border-t pt-2">
                      <Link href={`/admin/organograma/unidades/${unit.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {isManagedSecretary ? (
                        <Link href="/admin/organograma/secretarias">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            Secretaria
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Editar"
                            onClick={() => openEditDialog(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Desativar"
                            onClick={() => openDeleteDialog(unit)}
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

            {/* Count */}
            <p className="text-sm text-gray-500 mt-3 text-right">
              {filteredUnits.length} unidade{filteredUnits.length !== 1 ? 's' : ''} encontrada{filteredUnits.length !== 1 ? 's' : ''}
            </p>
          </>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Create / Edit Dialog                                              */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={createEditOpen} onOpenChange={setCreateEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? 'Editar Unidade Organizacional' : 'Nova Unidade Organizacional'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="form-nome">Nome *</Label>
                <Input
                  id="form-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da unidade"
                />
              </div>

              {/* Sigla + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-sigla">Sigla</Label>
                  <Input
                    id="form-sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                    placeholder="Ex: SMSAUDE"
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_UNIDADE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_LABELS[t] || t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Departamento */}
              <div>
                <Label>Departamento</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, departmentId: v, parentId: getDepartmentRootUnit(v)?.id || '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent */}
              <div>
                <Label>Unidade superior</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(v) => setFormData({ ...formData, parentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma (raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                    {parentOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} {u.sigla ? `(${u.sigla})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsavel */}
              <div>
                <Label>Responsavel</Label>
                <Select
                  value={formData.responsavelId}
                  onValueChange={(v) => setFormData({ ...formData, responsavelId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsavel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descricao */}
              <div>
                <Label htmlFor="form-descricao">Descricao</Label>
                <Textarea
                  id="form-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao da unidade (opcional)"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.nome.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingUnit ? (
                  <Edit2 className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingUnit ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ----------------------------------------------------------------- */}
        {/* Delete Confirmation Dialog                                        */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desativar Unidade</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja desativar a unidade{' '}
              <strong>&quot;{deletingUnit?.nome}&quot;</strong>?
              Esta acao pode ser revertida posteriormente.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Desativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
