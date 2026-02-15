'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Building2, RefreshCw, Plus, Users, Briefcase, UserCog,
  ChevronRight, ChevronDown, Edit2, Trash2, Eye, Network, ArrowRight,
  BarChart3, GitBranch, UserPlus as UserPlusIcon, FolderTree
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  code: string;
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
  responsavel?: {
    id: string;
    name: string;
    email: string;
  };
  children?: OrganizationalUnit[];
  _count?: {
    assignments?: number;
    positions?: number;
    teams?: number;
    children?: number;
  };
}

const TIPO_UNIDADE_OPTIONS = [
  'SECRETARIA', 'DIRETORIA', 'COORDENADORIA', 'DIVISAO', 'SETOR',
  'NUCLEO', 'GERENCIA', 'UNIDADE_ESPECIAL', 'DEPARTAMENTO', 'ASSESSORIA'
];

const TIPO_LABELS: Record<string, string> = {
  SECRETARIA: 'Secretaria',
  DIRETORIA: 'Diretoria',
  COORDENADORIA: 'Coordenadoria',
  DIVISAO: 'Divisão',
  SETOR: 'Setor',
  NUCLEO: 'Núcleo',
  GERENCIA: 'Gerência',
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

export default function OrganogramaPage() {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [orgData, setOrgData] = useState<OrganizationalUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({ units: 0, positions: 0, assignments: 0, teams: 0 });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrganizationalUnit | null>(null);
  const [parentForCreate, setParentForCreate] = useState<OrganizationalUnit | null>(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipo: 'SETOR' as string,
    descricao: '',
    responsavelId: '',
    endereco: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchOrganogram();
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      const deptList = response?.data?.departments ?? response?.departments ?? [];
      setDepartments(deptList);
      if (deptList.length > 0 && !selectedDepartment) {
        setSelectedDepartment(deptList[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/admin/team?limit=200');
      const teamMembers = response?.data?.teamMembers ?? [];
      setUsers(teamMembers.map((m: any) => ({ id: m.id, name: m.name, email: m.email })));
    } catch {
      // silently fail
    }
  };

  const fetchOrganogram = async () => {
    setLoading(true);
    setError(null);
    try {
      const units = await apiRequest(`/organizational-units?departmentId=${selectedDepartment}&tipo=SECRETARIA`);
      const unitList = Array.isArray(units) ? units : (units?.data ?? []);

      if (unitList.length === 0) {
        setOrgData(null);
        setStats({ units: 0, positions: 0, assignments: 0, teams: 0 });
        return;
      }

      const secretaria = unitList[0];
      const hierarchy = await apiRequest(`/organizational-units/${secretaria.id}/hierarchy`);
      setOrgData(hierarchy);
      setExpanded(prev => ({ ...prev, [hierarchy.id]: true }));

      // Calculate stats from hierarchy
      let totalUnits = 0, totalPositions = 0, totalAssignments = 0, totalTeams = 0;
      const countRecursive = (unit: OrganizationalUnit) => {
        totalUnits++;
        totalPositions += unit._count?.positions || 0;
        totalAssignments += unit._count?.assignments || 0;
        totalTeams += unit._count?.teams || 0;
        unit.children?.forEach(countRecursive);
      };
      countRecursive(hierarchy);
      setStats({ units: totalUnits, positions: totalPositions, assignments: totalAssignments, teams: totalTeams });
    } catch (err: any) {
      setError(err.message);
      setOrgData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = (parent: OrganizationalUnit | null) => {
    setParentForCreate(parent);
    setFormData({
      nome: '',
      sigla: '',
      tipo: parent ? 'SETOR' : 'SECRETARIA',
      descricao: '',
      responsavelId: '',
      endereco: '',
      telefone: '',
      email: '',
    });
    setCreateModalOpen(true);
  };

  const openEditModal = (unit: OrganizationalUnit) => {
    setSelectedUnit(unit);
    setFormData({
      nome: unit.nome,
      sigla: unit.sigla || '',
      tipo: unit.tipo,
      descricao: unit.descricao || '',
      responsavelId: unit.responsavel?.id || '',
      endereco: '',
      telefone: '',
      email: '',
    });
    setEditModalOpen(true);
  };

  const openDeleteConfirm = (unit: OrganizationalUnit) => {
    setSelectedUnit(unit);
    setDeleteConfirmOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const nivel = NIVEL_BY_TIPO[formData.tipo] || (parentForCreate ? (parentForCreate.nivel + 1) : 1);
      await apiRequest('/organizational-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          sigla: formData.sigla || undefined,
          tipo: formData.tipo,
          nivel,
          departmentId: selectedDepartment,
          parentId: parentForCreate?.id || undefined,
          responsavelId: formData.responsavelId || undefined,
          descricao: formData.descricao || undefined,
          endereco: formData.endereco || undefined,
          telefone: formData.telefone || undefined,
          email: formData.email || undefined,
        }),
      });
      setCreateModalOpen(false);
      fetchOrganogram();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar unidade');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUnit) return;
    setSaving(true);
    try {
      await apiRequest(`/organizational-units/${selectedUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          sigla: formData.sigla || undefined,
          tipo: formData.tipo,
          nivel: NIVEL_BY_TIPO[formData.tipo] || selectedUnit.nivel,
          responsavelId: formData.responsavelId || null,
          descricao: formData.descricao || undefined,
        }),
      });
      setEditModalOpen(false);
      fetchOrganogram();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar unidade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;
    setSaving(true);
    try {
      await apiRequest(`/organizational-units/${selectedUnit.id}`, {
        method: 'DELETE',
      });
      setDeleteConfirmOpen(false);
      fetchOrganogram();
    } catch (err: any) {
      alert(err.message || 'Erro ao desativar unidade');
    } finally {
      setSaving(false);
    }
  };

  const renderUnit = (unit: OrganizationalUnit, level: number = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const isExpanded = expanded[unit.id];
    const colorClass = TIPO_COLORS[unit.tipo] || 'bg-gray-100 text-gray-700 border-gray-300';

    return (
      <div key={unit.id} className="mb-2">
        <div
          className={`border-2 rounded-lg p-3 ${colorClass} hover:shadow-md transition-all`}
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(unit.id)}
                  className="p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              <Building2 className="h-4 w-4 flex-shrink-0" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{unit.nome}</span>
                  {unit.sigla && (
                    <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded flex-shrink-0">{unit.sigla}</span>
                  )}
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {TIPO_LABELS[unit.tipo] || unit.tipo}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs mt-0.5 opacity-80">
                  {unit.responsavel && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {unit.responsavel.name}
                    </span>
                  )}
                  <span>{unit._count?.assignments || 0} servidores</span>
                  <span>{unit._count?.positions || 0} cargos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Adicionar subunidade"
                onClick={(e) => { e.stopPropagation(); openCreateModal(unit); }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Editar"
                onClick={(e) => { e.stopPropagation(); openEditModal(unit); }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Ver detalhes"
                onClick={(e) => { e.stopPropagation(); router.push(`/admin/organograma/unidades/${unit.id}`); }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {(!unit.children || unit.children.length === 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  title="Desativar"
                  onClick={(e) => { e.stopPropagation(); openDeleteConfirm(unit); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {unit.children!.map((child) => renderUnit(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const quickLinks = [
    { title: 'Unidades', desc: 'Gerenciar unidades organizacionais', icon: FolderTree, href: '/admin/organograma/unidades', color: 'text-blue-600 bg-blue-50' },
    { title: 'Cargos', desc: 'Cadastro de cargos e funções', icon: Briefcase, href: '/admin/organograma/cargos', color: 'text-purple-600 bg-purple-50' },
    { title: 'Lotações', desc: 'Vínculos funcionais de servidores', icon: UserCog, href: '/admin/organograma/lotacoes', color: 'text-green-600 bg-green-50' },
    { title: 'Equipes', desc: 'Grupos de trabalho e comissões', icon: Users, href: '/admin/organograma/equipes', color: 'text-orange-600 bg-orange-50' },
    { title: 'Funções', desc: 'Funções gratificadas e comissionadas', icon: BarChart3, href: '/admin/organograma/funcoes', color: 'text-pink-600 bg-pink-50' },
    { title: 'Hierarquias', desc: 'Relações supervisor-subordinado', icon: GitBranch, href: '/admin/organograma/hierarquias', color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Network className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                Organograma Municipal
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Gerencie a estrutura organizacional de todas as secretarias
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchOrganogram} disabled={loading || !selectedDepartment}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className={`rounded-lg p-2 w-fit ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mt-2">{link.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats */}
        {orgData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.units}</p>
                  <p className="text-xs text-gray-500">Unidades</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assignments}</p>
                  <p className="text-xs text-gray-500">Servidores Lotados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.positions}</p>
                  <p className="text-xs text-gray-500">Cargos</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.teams}</p>
                  <p className="text-xs text-gray-500">Equipes</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Department Selector */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-medium text-gray-700 text-sm">Secretaria:</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione uma secretaria" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDepartment && !orgData && !loading && (
              <Button onClick={() => openCreateModal(null)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Criar Secretaria
              </Button>
            )}
          </div>
        </Card>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando organograma...</span>
          </div>
        )}

        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {!loading && !error && orgData && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-blue-600" />
                Estrutura Organizacional
              </h2>
              <Button variant="outline" size="sm" onClick={() => openCreateModal(orgData)}>
                <Plus className="h-4 w-4 mr-1" /> Nova Subunidade
              </Button>
            </div>
            {renderUnit(orgData)}
          </Card>
        )}

        {!loading && !error && !orgData && selectedDepartment && (
          <Card className="p-8 text-center">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma estrutura organizacional encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Este departamento ainda não possui uma estrutura organizacional cadastrada.
            </p>
            <Button onClick={() => openCreateModal(null)}>
              <Plus className="h-4 w-4 mr-2" /> Criar Estrutura Organizacional
            </Button>
          </Card>
        )}

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {parentForCreate ? `Nova subunidade de "${parentForCreate.nome}"` : 'Nova Unidade Organizacional'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da unidade"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sigla</Label>
                  <Input
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
                        <SelectItem key={t} value={t}>{TIPO_LABELS[t] || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select
                  value={formData.responsavelId}
                  onValueChange={(v) => setFormData({ ...formData, responsavelId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da unidade (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.nome}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Unidade Organizacional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sigla</Label>
                  <Input
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_UNIDADE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{TIPO_LABELS[t] || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select
                  value={formData.responsavelId}
                  onValueChange={(v) => setFormData({ ...formData, responsavelId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={saving || !formData.nome}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desativar Unidade</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja desativar a unidade <strong>"{selectedUnit?.nome}"</strong>?
              Esta ação pode ser revertida posteriormente.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
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
