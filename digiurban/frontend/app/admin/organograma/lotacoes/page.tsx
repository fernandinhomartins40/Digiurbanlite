'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  UserCog,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Department {
  id: string;
  name: string;
  code?: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface PositionOption {
  id: string;
  nome: string;
  departmentId?: string;
}

interface FunctionOption {
  id: string;
  nome: string;
  departmentId?: string;
}

interface OrgUnitOption {
  id: string;
  nome: string;
  sigla?: string;
}

interface Assignment {
  id: string;
  userId: string;
  departmentId: string;
  organizationalUnitId?: string | null;
  positionId?: string | null;
  functionId?: string | null;
  tipo: string;
  situacao: string;
  isPrimary: boolean;
  dataInicio: string;
  dataFim?: string | null;
  cargaHoraria?: number | null;
  percentualDedicacao?: number | null;
  observacoes?: string | null;
  user?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  organizationalUnit?: { id: string; nome: string; sigla?: string } | null;
  position?: { id: string; nome: string } | null;
  function?: { id: string; nome: string } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPO_VINCULO: Record<string, string> = {
  LOTACAO: 'Lotacao',
  CEDENCIA: 'Cedencia',
  REQUISICAO: 'Requisicao',
  REMOCAO: 'Remocao',
};

const TIPO_VINCULO_LABEL: Record<string, string> = {
  LOTACAO: 'Lotacao',
  CEDENCIA: 'Cedencia',
  REQUISICAO: 'Requisicao',
  REMOCAO: 'Remocao',
};

const SITUACAO_VINCULO: Record<string, string> = {
  ATIVO: 'Ativo',
  AFASTADO: 'Afastado',
  LICENCA: 'Licenca',
  SUSPENSO: 'Suspenso',
  CEDIDO: 'Cedido',
  INATIVO: 'Inativo',
};

const SITUACAO_COLORS: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800 border-green-300',
  AFASTADO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LICENCA: 'bg-blue-100 text-blue-800 border-blue-300',
  SUSPENSO: 'bg-red-100 text-red-800 border-red-300',
  CEDIDO: 'bg-orange-100 text-orange-800 border-orange-300',
  INATIVO: 'bg-gray-100 text-gray-600 border-gray-300',
};

// ---------------------------------------------------------------------------
// Initial form state
// ---------------------------------------------------------------------------

interface FormData {
  userId: string;
  departmentId: string;
  organizationalUnitId: string;
  positionId: string;
  functionId: string;
  tipo: string;
  situacao: string;
  isPrimary: boolean;
  dataInicio: string;
  cargaHoraria: string;
  percentualDedicacao: string;
  observacoes: string;
}

const INITIAL_FORM: FormData = {
  userId: '',
  departmentId: '',
  organizationalUnitId: '',
  positionId: '',
  functionId: '',
  tipo: 'LOTACAO',
  situacao: 'ATIVO',
  isPrimary: false,
  dataInicio: '',
  cargaHoraria: '',
  percentualDedicacao: '',
  observacoes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LotacoesPage() {
  const { apiRequest } = useAdminAuth();
  const searchParams = useSearchParams();
  const filterUserId = searchParams.get('userId') || '';

  // Data lists
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [functions, setFunctions] = useState<FunctionOption[]>([]);
  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterSituacao, setFilterSituacao] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  // Org units for create/edit (filtered by selected department)
  const [formOrgUnits, setFormOrgUnits] = useState<OrgUnitOption[]>([]);

  // -----------------------------------------------------------------------
  // Fetch helpers
  // -----------------------------------------------------------------------

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterTipo) params.append('tipo', filterTipo);
      if (filterSituacao) params.append('situacao', filterSituacao);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiRequest(`/employee-assignments${qs}`);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setAssignments(
        list.map((assignment: any) => ({
          ...assignment,
          tipo: assignment.tipo || assignment.tipoVinculo || 'LOTACAO',
        })),
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lotacoes');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, filterDepartment, filterTipo, filterSituacao, filterUserId]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await apiRequest('/admin/departments');
      const list = res?.data?.departments ?? res?.departments ?? [];
      setDepartments(list);
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiRequest('/admin/team?limit=200');
      const members = res?.data?.teamMembers ?? [];
      setUsers(members.map((m: any) => ({ id: m.id, name: m.name, email: m.email })));
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await apiRequest('/positions');
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setPositions(list);
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchFunctions = useCallback(async () => {
    try {
      const res = await apiRequest('/functions');
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setFunctions(list);
    } catch {
      // silent
    }
  }, [apiRequest]);

  const fetchOrgUnitsForDept = useCallback(
    async (deptId: string) => {
      if (!deptId) {
        setFormOrgUnits([]);
        return;
      }
      try {
        const res = await apiRequest(`/organizational-units?departmentId=${deptId}`);
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setFormOrgUnits(list);
      } catch {
        setFormOrgUnits([]);
      }
    },
    [apiRequest],
  );

  // -----------------------------------------------------------------------
  // Effects
  // -----------------------------------------------------------------------

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
    fetchPositions();
    fetchFunctions();
  }, [fetchDepartments, fetchUsers, fetchPositions, fetchFunctions]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Reload org units when departmentId changes in form
  useEffect(() => {
    if (formData.departmentId) {
      fetchOrgUnitsForDept(formData.departmentId);
    } else {
      setFormOrgUnits([]);
    }
  }, [formData.departmentId, fetchOrgUnitsForDept]);

  // -----------------------------------------------------------------------
  // Filtered positions / functions by department in form
  // -----------------------------------------------------------------------

  const filteredPositions = useMemo(() => {
    if (!formData.departmentId) return positions;
    return positions.filter(
      (p) => !p.departmentId || p.departmentId === formData.departmentId,
    );
  }, [positions, formData.departmentId]);

  const filteredFunctions = useMemo(() => {
    if (!formData.departmentId) return functions;
    return functions.filter(
      (f) => !f.departmentId || f.departmentId === formData.departmentId,
    );
  }, [functions, formData.departmentId]);

  const filteredUser = useMemo(
    () => users.find((user) => user.id === filterUserId) || null,
    [users, filterUserId],
  );

  // -----------------------------------------------------------------------
  // Local search filter (by user name)
  // -----------------------------------------------------------------------

  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments;
    const term = searchTerm.toLowerCase();
    return assignments.filter((a) => {
      const userName = a.user?.name?.toLowerCase() ?? '';
      const userEmail = a.user?.email?.toLowerCase() ?? '';
      return userName.includes(term) || userEmail.includes(term);
    });
  }, [assignments, searchTerm]);

  // -----------------------------------------------------------------------
  // Dialog openers
  // -----------------------------------------------------------------------

  const openCreate = () => {
    setFormData({ ...INITIAL_FORM, userId: filterUserId });
    setFormOrgUnits([]);
    setCreateOpen(true);
  };

  const openEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      userId: assignment.userId,
      departmentId: assignment.departmentId,
      organizationalUnitId: assignment.organizationalUnitId || '',
      positionId: assignment.positionId || '',
      functionId: assignment.functionId || '',
      tipo: assignment.tipo,
      situacao: assignment.situacao,
      isPrimary: assignment.isPrimary,
      dataInicio: assignment.dataInicio ? assignment.dataInicio.slice(0, 10) : '',
      cargaHoraria: assignment.cargaHoraria != null ? String(assignment.cargaHoraria) : '',
      percentualDedicacao:
        assignment.percentualDedicacao != null ? String(assignment.percentualDedicacao) : '',
      observacoes: assignment.observacoes || '',
    });
    setEditOpen(true);
  };

  const openDelete = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDeleteOpen(true);
  };

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const buildBody = () => {
    const body: Record<string, any> = {
      userId: formData.userId || undefined,
      departmentId: formData.departmentId,
      organizationalUnitId: formData.organizationalUnitId || undefined,
      positionId: formData.positionId || undefined,
      functionId: formData.functionId || undefined,
      tipo: formData.tipo,
      situacao: formData.situacao,
      isPrimary: formData.isPrimary,
      dataInicio: formData.dataInicio || undefined,
      cargaHoraria: formData.cargaHoraria ? Number(formData.cargaHoraria) : undefined,
      percentualDedicacao: formData.percentualDedicacao
        ? Number(formData.percentualDedicacao)
        : undefined,
      observacoes: formData.observacoes || undefined,
    };
    return body;
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await apiRequest('/employee-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      setCreateOpen(false);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar lotacao');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      const body = buildBody();
      delete body.userId; // cannot change user
      await apiRequest(`/employee-assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditOpen(false);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar lotacao');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      await apiRequest(`/employee-assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar vinculo');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const situacaoBadge = (sit: string) => {
    const color = SITUACAO_COLORS[sit] || 'bg-gray-100 text-gray-600 border-gray-300';
    return (
      <Badge variant="outline" className={`${color} text-xs`}>
        {SITUACAO_VINCULO[sit] || sit}
      </Badge>
    );
  };

  const tipoBadge = (tipo: string) => (
    <Badge variant="secondary" className="text-xs">
      {TIPO_VINCULO_LABEL[tipo] || tipo}
    </Badge>
  );

  // -----------------------------------------------------------------------
  // Form fields renderer (shared between create & edit)
  // -----------------------------------------------------------------------

  const renderFormFields = (isEdit: boolean) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* User (only on create) */}
      {!isEdit && (
        <div>
          <Label>Servidor *</Label>
          <Select
            value={formData.userId}
            onValueChange={(v) => setFormData({ ...formData, userId: v })}
            disabled={Boolean(filterUserId)}
          >
            <SelectTrigger>
                <SelectValue placeholder="Selecione o servidor" />
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
      )}

      {/* Department */}
      <div>
        <Label>Departamento *</Label>
        <Select
          value={formData.departmentId}
          onValueChange={(v) =>
            setFormData({
              ...formData,
              departmentId: v,
              organizationalUnitId: '',
              positionId: '',
              functionId: '',
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Organizational Unit */}
      <div>
        <Label>Unidade Organizacional</Label>
        <Select
          value={formData.organizationalUnitId}
          onValueChange={(v) =>
            setFormData({ ...formData, organizationalUnitId: v === '_none_' ? '' : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhuma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none_">Nenhuma</SelectItem>
            {formOrgUnits.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome} {u.sigla ? `(${u.sigla})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Position */}
      <div>
        <Label>Cargo</Label>
        <Select
          value={formData.positionId}
          onValueChange={(v) =>
            setFormData({ ...formData, positionId: v === '_none_' ? '' : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none_">Nenhum</SelectItem>
            {filteredPositions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Function */}
      <div>
        <Label>Funcao</Label>
        <Select
          value={formData.functionId}
          onValueChange={(v) =>
            setFormData({ ...formData, functionId: v === '_none_' ? '' : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhuma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none_">Nenhuma</SelectItem>
            {filteredFunctions.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo + Situacao */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Vinculo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(v) => setFormData({ ...formData, tipo: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_VINCULO).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Situacao *</Label>
          <Select
            value={formData.situacao}
            onValueChange={(v) => setFormData({ ...formData, situacao: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SITUACAO_VINCULO).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* isPrimary */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isPrimary"
          checked={formData.isPrimary}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isPrimary: checked === true })
          }
        />
        <Label htmlFor="isPrimary" className="cursor-pointer">
          Lotacao principal
        </Label>
      </div>

      {/* Data Inicio */}
      <div>
        <Label>Data de Inicio *</Label>
        <Input
          type="date"
          value={formData.dataInicio}
          onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
        />
      </div>

      {/* Carga Horaria + Percentual */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Carga Horaria (h/semana)</Label>
          <Input
            type="number"
            min={0}
            value={formData.cargaHoraria}
            onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
            placeholder="40"
          />
        </div>
        <div>
          <Label>Dedicacao (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.percentualDedicacao}
            onChange={(e) =>
              setFormData({ ...formData, percentualDedicacao: e.target.value })
            }
            placeholder="100"
          />
        </div>
      </div>

      {/* Observacoes */}
      <div>
        <Label>Observacoes</Label>
        <Textarea
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observacoes (opcional)"
          rows={3}
        />
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/organograma"
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <UserCog className="h-7 w-7 md:h-8 md:w-8 text-green-600" />
                  Lotacoes e Vinculos
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Gerencie as lotacoes e vinculos funcionais dos servidores
                </p>
              </div>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Lotacao
            </Button>
          </div>
        </div>

        {filterUserId && (
          <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Filtro por servidor ativo</p>
                <p className="text-sm text-blue-800">
                  {filteredUser
                    ? `Mostrando lotacoes de ${filteredUser.name}.`
                    : 'Mostrando lotacoes do servidor selecionado.'}
                </p>
              </div>
              <Link href="/admin/organograma/lotacoes" className="text-sm font-medium text-blue-700 hover:text-blue-900">
                Limpar filtro
              </Link>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Department filter */}
            <div className="w-full sm:w-48">
              <Label className="text-xs text-gray-500 mb-1 block">Departamento</Label>
              <Select
                value={filterDepartment || '_all_'}
                onValueChange={(v) => setFilterDepartment(v === '_all_' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Todos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo filter */}
            <div className="w-full sm:w-40">
              <Label className="text-xs text-gray-500 mb-1 block">Tipo</Label>
              <Select
                value={filterTipo || '_all_'}
                onValueChange={(v) => setFilterTipo(v === '_all_' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Todos</SelectItem>
                  {Object.entries(TIPO_VINCULO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Situacao filter */}
            <div className="w-full sm:w-40">
              <Label className="text-xs text-gray-500 mb-1 block">Situacao</Label>
              <Select
                value={filterSituacao || '_all_'}
                onValueChange={(v) => setFilterSituacao(v === '_all_' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Todos</SelectItem>
                  {Object.entries(SITUACAO_VINCULO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="w-full sm:w-60 flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500 mb-1 block">Buscar servidor</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-600">Carregando lotacoes...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAssignments.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma lotacao encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Nenhum resultado para a busca informada.'
                : 'Cadastre a primeira lotacao clicando no botao acima.'}
            </p>
            {!searchTerm && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Nova Lotacao
              </Button>
            )}
          </Card>
        )}

        {/* List */}
        {!loading && filteredAssignments.length > 0 && (
          <div className="space-y-3">
            {filteredAssignments.map((a) => (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">
                        {a.user?.name || 'Servidor'}
                      </span>
                      {a.isPrimary && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-400 flex-shrink-0" />
                      )}
                      {tipoBadge(a.tipo)}
                      {situacaoBadge(a.situacao)}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {a.user?.email || ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                      <span>
                        <strong>Depto:</strong> {a.department?.name || '-'}
                      </span>
                      {a.organizationalUnit && (
                        <span>
                          <strong>Unidade:</strong> {a.organizationalUnit.nome}
                          {a.organizationalUnit.sigla
                            ? ` (${a.organizationalUnit.sigla})`
                            : ''}
                        </span>
                      )}
                      {a.position && (
                        <span>
                          <strong>Cargo:</strong> {a.position.nome}
                        </span>
                      )}
                      {a.function && (
                        <span>
                          <strong>Funcao:</strong> {a.function.nome}
                        </span>
                      )}
                      <span>
                        <strong>Inicio:</strong> {formatDate(a.dataInicio)}
                      </span>
                      {a.cargaHoraria != null && (
                        <span>
                          <strong>CH:</strong> {a.cargaHoraria}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Editar"
                      onClick={() => openEdit(a)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Encerrar vinculo"
                      onClick={() => openDelete(a)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Lotacao</DialogTitle>
            </DialogHeader>
            {renderFormFields(false)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  saving ||
                  !formData.userId ||
                  !formData.departmentId ||
                  !formData.tipo ||
                  !formData.situacao ||
                  !formData.dataInicio
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Editar Lotacao{' '}
                {selectedAssignment?.user?.name
                  ? `- ${selectedAssignment.user.name}`
                  : ''}
              </DialogTitle>
            </DialogHeader>
            {renderFormFields(true)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={
                  saving ||
                  !formData.departmentId ||
                  !formData.tipo ||
                  !formData.situacao ||
                  !formData.dataInicio
                }
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Encerrar Vinculo</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja encerrar o vinculo de{' '}
              <strong>{selectedAssignment?.user?.name || 'este servidor'}</strong> com o
              departamento{' '}
              <strong>{selectedAssignment?.department?.name || ''}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta acao ira remover a lotacao permanentemente.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Encerrar Vinculo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
