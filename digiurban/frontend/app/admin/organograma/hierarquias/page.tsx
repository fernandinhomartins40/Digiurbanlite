'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  ArrowDown,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserBasic {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface OrgUnitBasic {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
}

interface Hierarchy {
  id: string;
  subordinadoId: string;
  supervisorId: string;
  tipo: string;
  organizationalUnitId?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  subordinado: UserBasic;
  supervisor: UserBasic;
  organizationalUnit?: OrgUnitBasic | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPO_HIERARQUIA: Record<string, string> = {
  HIERARQUICO: 'Hierarquico',
  FUNCIONAL: 'Funcional',
  TECNICO: 'Tecnico',
};

const TIPO_HIERARQUIA_LABELS: Record<string, string> = {
  HIERARQUICO: 'Hierarquico',
  FUNCIONAL: 'Funcional',
  TECNICO: 'Tecnico',
};

const TIPO_BADGE_COLORS: Record<string, string> = {
  HIERARQUICO: 'bg-blue-100 text-blue-800 border-blue-300',
  FUNCIONAL: 'bg-green-100 text-green-800 border-green-300',
  TECNICO: 'bg-purple-100 text-purple-800 border-purple-300',
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HierarquiasPage() {
  const { apiRequest } = useAdminAuth();

  // Data
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterAtivo, setFilterAtivo] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subordinadoId: '',
    supervisorId: '',
    tipo: 'HIERARQUICO',
    organizationalUnitId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    observacoes: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Hierarchy | null>(null);
  const [editForm, setEditForm] = useState({
    tipo: 'HIERARQUICO',
    dataFim: '',
    ativo: true,
    observacoes: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hierarchy | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------

  const fetchHierarchies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterTipo !== 'TODOS') {
        params.set('tipo', filterTipo);
      }
      if (filterAtivo) {
        params.set('ativo', 'true');
      }
      const qs = params.toString();
      const url = `/employee-hierarchies${qs ? `?${qs}` : ''}`;
      const response = await apiRequest(url);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setHierarchies(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hierarquias');
      setHierarchies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/admin/team?limit=200');
      const teamMembers = response?.data?.teamMembers ?? [];
      setUsers(
        teamMembers.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
        }))
      );
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchHierarchies();
  }, [filterTipo, filterAtivo]);

  // ---------------------------------------------------------------------------
  // Filtered list (local search)
  // ---------------------------------------------------------------------------

  const filteredHierarchies = useMemo(() => {
    if (!searchTerm.trim()) return hierarchies;
    const lower = searchTerm.toLowerCase();
    return hierarchies.filter((h) => {
      const subName = h.subordinado?.name?.toLowerCase() || '';
      const subEmail = h.subordinado?.email?.toLowerCase() || '';
      const supName = h.supervisor?.name?.toLowerCase() || '';
      const supEmail = h.supervisor?.email?.toLowerCase() || '';
      return (
        subName.includes(lower) ||
        subEmail.includes(lower) ||
        supName.includes(lower) ||
        supEmail.includes(lower)
      );
    });
  }, [hierarchies, searchTerm]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  const openCreateDialog = () => {
    setCreateForm({
      subordinadoId: '',
      supervisorId: '',
      tipo: 'HIERARQUICO',
      organizationalUnitId: '',
      dataInicio: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setCreateError(null);

    if (!createForm.subordinadoId || !createForm.supervisorId || !createForm.tipo) {
      setCreateError('Preencha todos os campos obrigatorios.');
      return;
    }

    if (createForm.subordinadoId === createForm.supervisorId) {
      setCreateError('O subordinado e o supervisor devem ser pessoas diferentes.');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, any> = {
        subordinadoId: createForm.subordinadoId,
        supervisorId: createForm.supervisorId,
        tipo: createForm.tipo,
        dataInicio: createForm.dataInicio || new Date().toISOString().split('T')[0],
      };
      if (createForm.organizationalUnitId) {
        body.organizationalUnitId = createForm.organizationalUnitId;
      }
      if (createForm.observacoes.trim()) {
        body.observacoes = createForm.observacoes.trim();
      }

      await apiRequest('/employee-hierarchies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setCreateOpen(false);
      fetchHierarchies();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar hierarquia');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  const openEditDialog = (h: Hierarchy) => {
    setEditTarget(h);
    setEditForm({
      tipo: h.tipo,
      dataFim: h.dataFim ? h.dataFim.split('T')[0] : '',
      ativo: h.ativo,
      observacoes: h.observacoes || '',
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditError(null);
    setSaving(true);
    try {
      const body: Record<string, any> = {
        tipo: editForm.tipo,
        ativo: editForm.ativo,
      };
      if (editForm.dataFim) {
        body.dataFim = editForm.dataFim;
      } else {
        body.dataFim = null;
      }
      if (editForm.observacoes.trim()) {
        body.observacoes = editForm.observacoes.trim();
      } else {
        body.observacoes = null;
      }

      await apiRequest(`/employee-hierarchies/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setEditOpen(false);
      fetchHierarchies();
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar hierarquia');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const openDeleteDialog = (h: Hierarchy) => {
    setDeleteTarget(h);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiRequest(`/employee-hierarchies/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      fetchHierarchies();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover hierarquia');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/admin/organograma"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Organograma
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <GitBranch className="h-7 w-7 md:h-8 md:w-8 text-indigo-600" />
                Hierarquias Organizacionais
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Gerencie as relacoes de supervisao entre servidores
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Hierarquia
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Tipo filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tipo:</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os tipos</SelectItem>
                  <SelectItem value="HIERARQUICO">Hierarquico</SelectItem>
                  <SelectItem value="FUNCIONAL">Funcional</SelectItem>
                  <SelectItem value="TECNICO">Tecnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</Label>
              <div className="flex rounded-md overflow-hidden border">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterAtivo
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterAtivo(true)}
                >
                  Ativas
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    !filterAtivo
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterAtivo(false)}
                >
                  Todas
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome do subordinado ou supervisor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Carregando hierarquias...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && filteredHierarchies.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma hierarquia encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Nenhum resultado para a busca realizada.'
                : 'Ainda nao existem hierarquias cadastradas. Crie a primeira!'}
            </p>
            {!searchTerm && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Hierarquia
              </Button>
            )}
          </Card>
        )}

        {/* Hierarchy cards list */}
        {!loading && !error && filteredHierarchies.length > 0 && (
          <div className="space-y-3">
            {filteredHierarchies.map((h) => {
              const tipoBadge = TIPO_BADGE_COLORS[h.tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
              return (
                <Card key={h.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: relationship visual */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <Badge className={`${tipoBadge} text-xs`}>
                          {TIPO_HIERARQUIA_LABELS[h.tipo] || h.tipo}
                        </Badge>
                        <Badge
                          variant={h.ativo ? 'default' : 'secondary'}
                          className={
                            h.ativo
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-xs'
                              : 'bg-gray-100 text-gray-500 border-gray-300 text-xs'
                          }
                        >
                          {h.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                        {h.organizationalUnit && (
                          <span className="text-xs text-gray-500">
                            {h.organizationalUnit.sigla
                              ? `${h.organizationalUnit.nome} (${h.organizationalUnit.sigla})`
                              : h.organizationalUnit.nome}
                          </span>
                        )}
                      </div>

                      {/* Supervisor -> Subordinado visual */}
                      <div className="flex items-center gap-3">
                        {/* Supervisor */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-semibold text-blue-500 mb-0.5">
                            Supervisor
                          </p>
                          <p className="font-medium text-sm truncate">
                            {h.supervisor?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {h.supervisor?.email || ''}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ArrowDown className="h-5 w-5 text-gray-400 flex-shrink-0 rotate-[-90deg]" />

                        {/* Subordinado */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-semibold text-indigo-500 mb-0.5">
                            Subordinado
                          </p>
                          <p className="font-medium text-sm truncate">
                            {h.subordinado?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {h.subordinado?.email || ''}
                          </p>
                        </div>
                      </div>

                      {/* Bottom info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Inicio: {formatDate(h.dataInicio)}</span>
                        {h.dataFim && <span>Fim: {formatDate(h.dataFim)}</span>}
                        {h.observacoes && (
                          <span className="truncate max-w-[200px]" title={h.observacoes}>
                            Obs: {h.observacoes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Editar hierarquia"
                        onClick={() => openEditDialog(h)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Remover hierarquia"
                        onClick={() => openDeleteDialog(h)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Result count */}
        {!loading && !error && filteredHierarchies.length > 0 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            {filteredHierarchies.length}{' '}
            {filteredHierarchies.length === 1 ? 'hierarquia encontrada' : 'hierarquias encontradas'}
          </p>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Create Dialog                                                     */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Hierarquia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                  {createError}
                </div>
              )}

              {/* Subordinado */}
              <div>
                <Label>Subordinado *</Label>
                <Select
                  value={createForm.subordinadoId}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, subordinadoId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subordinado" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supervisor */}
              <div>
                <Label>Supervisor *</Label>
                <Select
                  value={createForm.supervisorId}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, supervisorId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warning: same user */}
              {createForm.subordinadoId &&
                createForm.supervisorId &&
                createForm.subordinadoId === createForm.supervisorId && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md p-3">
                    O subordinado e o supervisor devem ser pessoas diferentes.
                  </div>
                )}

              {/* Tipo */}
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={createForm.tipo}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, tipo: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIERARQUICO">Hierarquico</SelectItem>
                    <SelectItem value="FUNCIONAL">Funcional</SelectItem>
                    <SelectItem value="TECNICO">Tecnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Inicio */}
              <div>
                <Label>Data de Inicio</Label>
                <Input
                  type="date"
                  value={createForm.dataInicio}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, dataInicio: e.target.value }))
                  }
                />
              </div>

              {/* Observacoes */}
              <div>
                <Label>Observacoes</Label>
                <Textarea
                  value={createForm.observacoes}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, observacoes: e.target.value }))
                  }
                  placeholder="Observacoes adicionais (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  saving ||
                  !createForm.subordinadoId ||
                  !createForm.supervisorId ||
                  createForm.subordinadoId === createForm.supervisorId
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ----------------------------------------------------------------- */}
        {/* Edit Dialog                                                       */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Hierarquia</DialogTitle>
            </DialogHeader>
            {editTarget && (
              <div className="space-y-4">
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                    {editError}
                  </div>
                )}

                {/* Read-only info */}
                <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500 w-24">Supervisor:</span>
                    <span>{editTarget.supervisor?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500 w-24">Subordinado:</span>
                    <span>{editTarget.subordinado?.name || 'N/A'}</span>
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={editForm.tipo}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, tipo: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIERARQUICO">Hierarquico</SelectItem>
                      <SelectItem value="FUNCIONAL">Funcional</SelectItem>
                      <SelectItem value="TECNICO">Tecnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Fim */}
                <div>
                  <Label>Data de Fim</Label>
                  <Input
                    type="date"
                    value={editForm.dataFim}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, dataFim: e.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco se a hierarquia ainda estiver vigente.
                  </p>
                </div>

                {/* Ativo */}
                <div className="flex items-center gap-3">
                  <Label className="mb-0">Ativa</Label>
                  <div className="flex rounded-md overflow-hidden border">
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        editForm.ativo
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setEditForm((prev) => ({ ...prev, ativo: true }))}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        !editForm.ativo
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setEditForm((prev) => ({ ...prev, ativo: false }))}
                    >
                      Nao
                    </button>
                  </div>
                </div>

                {/* Observacoes */}
                <div>
                  <Label>Observacoes</Label>
                  <Textarea
                    value={editForm.observacoes}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, observacoes: e.target.value }))
                    }
                    placeholder="Observacoes adicionais (opcional)"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ----------------------------------------------------------------- */}
        {/* Delete Confirmation Dialog                                        */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Hierarquia</DialogTitle>
            </DialogHeader>
            {deleteTarget && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Tem certeza que deseja remover esta hierarquia?
                </p>
                <div className="bg-gray-50 border rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Supervisor:</span>{' '}
                    {deleteTarget.supervisor?.name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Subordinado:</span>{' '}
                    {deleteTarget.subordinado?.name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Tipo:</span>{' '}
                    {TIPO_HIERARQUIA_LABELS[deleteTarget.tipo] || deleteTarget.tipo}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Esta acao nao pode ser desfeita.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
