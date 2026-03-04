'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  UserPlus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  papel: string;
  atribuicoes?: string;
  dataInicio?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Team {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  finalidade?: string;
  ativo: boolean;
  departmentId: string;
  coordenadorId?: string;
  department?: { id: string; name: string };
  coordenador?: { id: string; name: string; email: string };
  _count?: { members?: number };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPO_TEAM: Record<string, string> = {
  PERMANENTE: 'Permanente',
  TEMPORARIA: 'Temporaria',
  PROJETO: 'Projeto',
  GRUPO_TRABALHO: 'Grupo de Trabalho',
  COMISSAO: 'Comissao',
  CONSELHO: 'Conselho',
};

const TIPO_TEAM_KEYS = Object.keys(TIPO_TEAM);

const TIPO_COLORS: Record<string, string> = {
  PERMANENTE: 'bg-blue-100 text-blue-800',
  TEMPORARIA: 'bg-amber-100 text-amber-800',
  PROJETO: 'bg-green-100 text-green-800',
  GRUPO_TRABALHO: 'bg-purple-100 text-purple-800',
  COMISSAO: 'bg-pink-100 text-pink-800',
  CONSELHO: 'bg-indigo-100 text-indigo-800',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EquipesPage() {
  const { apiRequest } = useAdminAuth();

  // Data
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterAtivo, setFilterAtivo] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded card
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Members for expanded team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create / Edit team dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({
    nome: '',
    sigla: '',
    tipo: 'PERMANENTE',
    finalidade: '',
    departmentId: '',
    coordenadorId: '',
  });

  // Members dialog (view members)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [membersDialogTeam, setMembersDialogTeam] = useState<Team | null>(null);
  const [membersDialogList, setMembersDialogList] = useState<TeamMember[]>([]);
  const [loadingMembersDialog, setLoadingMembersDialog] = useState(false);

  // Add member dialog
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string>('');
  const [addMemberForm, setAddMemberForm] = useState({
    userId: '',
    papel: '',
    atribuicoes: '',
  });

  // Remove member confirm
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ teamId: string; memberId: string; name: string } | null>(null);

  // Delete team confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterTipo) params.append('tipo', filterTipo);
      params.append('ativo', filterAtivo ? 'true' : '');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      const qs = params.toString();
      const response = await apiRequest(`/teams${qs ? `?${qs}` : ''}`);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setTeams(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, filterDepartment, filterTipo, filterAtivo, searchTerm]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/departments');
      const deptList = response?.data?.departments ?? response?.departments ?? [];
      setDepartments(deptList);
    } catch {
      // silently fail
    }
  }, [apiRequest]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/team?limit=200&includeSuperAdmin=true');
      const teamMembers = response?.data?.teamMembers ?? [];
      setUsers(teamMembers.map((m: any) => ({ id: m.id, name: m.name, email: m.email })));
    } catch {
      // silently fail
    }
  }, [apiRequest]);

  const fetchMembersForTeam = useCallback(async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const response = await apiRequest(`/teams/${teamId}/members`);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setTeamMembers(list);
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [apiRequest]);

  const fetchMembersForDialog = useCallback(async (teamId: string) => {
    setLoadingMembersDialog(true);
    try {
      const response = await apiRequest(`/teams/${teamId}/members`);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setMembersDialogList(list);
    } catch {
      setMembersDialogList([]);
    } finally {
      setLoadingMembersDialog(false);
    }
  }, [apiRequest]);

  // Initial load
  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  // Reload teams on filter change
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // When a card is expanded, load its members
  useEffect(() => {
    if (expandedTeamId) {
      fetchMembersForTeam(expandedTeamId);
    } else {
      setTeamMembers([]);
    }
  }, [expandedTeamId, fetchMembersForTeam]);

  // ---------------------------------------------------------------------------
  // Team CRUD handlers
  // ---------------------------------------------------------------------------

  const openCreateTeamDialog = () => {
    setEditingTeam(null);
    setTeamForm({
      nome: '',
      sigla: '',
      tipo: 'PERMANENTE',
      finalidade: '',
      departmentId: departments.length > 0 ? departments[0].id : '',
      coordenadorId: '',
    });
    setTeamDialogOpen(true);
  };

  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      nome: team.nome,
      sigla: team.sigla || '',
      tipo: team.tipo,
      finalidade: team.finalidade || '',
      departmentId: team.departmentId,
      coordenadorId: team.coordenadorId || '',
    });
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamForm.nome || !teamForm.tipo || !teamForm.departmentId) return;
    setSaving(true);
    try {
      const body: any = {
        nome: teamForm.nome,
        tipo: teamForm.tipo,
        departmentId: teamForm.departmentId,
      };
      if (teamForm.sigla) body.sigla = teamForm.sigla;
      if (teamForm.finalidade) body.finalidade = teamForm.finalidade;
      if (teamForm.coordenadorId) body.coordenadorId = teamForm.coordenadorId;

      if (editingTeam) {
        await apiRequest(`/teams/${editingTeam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest('/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setTeamDialogOpen(false);
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar equipe');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (team: Team) => {
    setTeamToDelete(team);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setSaving(true);
    try {
      await apiRequest(`/teams/${teamToDelete.id}`, { method: 'DELETE' });
      setDeleteConfirmOpen(false);
      setTeamToDelete(null);
      if (expandedTeamId === teamToDelete.id) setExpandedTeamId(null);
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipe');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Members handlers
  // ---------------------------------------------------------------------------

  const openMembersDialog = (team: Team) => {
    setMembersDialogTeam(team);
    setMembersDialogOpen(true);
    fetchMembersForDialog(team.id);
  };

  const openAddMemberDialog = (teamId: string) => {
    setAddMemberTeamId(teamId);
    setAddMemberForm({ userId: '', papel: '', atribuicoes: '' });
    setAddMemberDialogOpen(true);
  };

  const handleAddMember = async () => {
    if (!addMemberForm.userId || !addMemberTeamId) return;
    setSaving(true);
    try {
      const body: any = { userId: addMemberForm.userId };
      if (addMemberForm.papel) body.papel = addMemberForm.papel;
      if (addMemberForm.atribuicoes) body.atribuicoes = addMemberForm.atribuicoes;

      await apiRequest(`/teams/${addMemberTeamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setAddMemberDialogOpen(false);

      // Refresh members in both expanded card and dialog if open
      if (expandedTeamId === addMemberTeamId) fetchMembersForTeam(addMemberTeamId);
      if (membersDialogTeam?.id === addMemberTeamId) fetchMembersForDialog(addMemberTeamId);
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar membro');
    } finally {
      setSaving(false);
    }
  };

  const openRemoveMemberConfirm = (teamId: string, memberId: string, name: string) => {
    setMemberToRemove({ teamId, memberId, name });
    setRemoveMemberConfirmOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setSaving(true);
    try {
      await apiRequest(`/teams/${memberToRemove.teamId}/members/${memberToRemove.memberId}`, {
        method: 'DELETE',
      });
      setRemoveMemberConfirmOpen(false);
      setMemberToRemove(null);

      // Refresh members
      if (expandedTeamId === memberToRemove.teamId) fetchMembersForTeam(memberToRemove.teamId);
      if (membersDialogTeam?.id === memberToRemove.teamId) fetchMembersForDialog(memberToRemove.teamId);
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover membro');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || '-';
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
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar ao Organograma
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-7 w-7 md:h-8 md:w-8 text-orange-600" />
                Equipes e Grupos de Trabalho
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Gerencie equipes, comissoes, conselhos e grupos de trabalho
              </p>
            </div>
            <Button onClick={openCreateTeamDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Department filter */}
            <div className="w-full sm:w-48">
              <Label className="text-xs text-gray-500 mb-1 block">Departamento</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo filter */}
            <div className="w-full sm:w-48">
              <Label className="text-xs text-gray-500 mb-1 block">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TIPO_TEAM_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {TIPO_TEAM[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status toggle */}
            <div className="w-full sm:w-auto">
              <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filterAtivo
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterAtivo(true)}
                >
                  Ativas
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    !filterAtivo
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterAtivo(false)}
                >
                  Todas
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <Label className="text-xs text-gray-500 mb-1 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou sigla..."
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
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-3 text-gray-600">Carregando equipes...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && teams.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma equipe encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Nenhuma equipe corresponde aos filtros selecionados.
            </p>
            <Button onClick={openCreateTeamDialog}>
              <Plus className="h-4 w-4 mr-2" /> Criar Equipe
            </Button>
          </Card>
        )}

        {/* Team cards grid */}
        {!loading && !error && teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              const tipoColor = TIPO_COLORS[team.tipo] || 'bg-gray-100 text-gray-800';
              const memberCount = team._count?.members ?? 0;

              return (
                <Card key={team.id} className="overflow-hidden">
                  {/* Card header area */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">{team.nome}</h3>
                          {team.sigla && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 flex-shrink-0">
                              {team.sigla}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge className={`text-xs ${tipoColor} border-0`}>
                            {TIPO_TEAM[team.tipo] || team.tipo}
                          </Badge>
                          {!team.ativo && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                              Inativa
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Editar equipe"
                          onClick={() => openEditTeamDialog(team)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          title="Excluir equipe"
                          onClick={() => openDeleteConfirm(team)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Description */}
                    {team.finalidade && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{team.finalidade}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-col gap-1 mt-3 text-xs text-gray-500">
                      <span>
                        <strong>Departamento:</strong>{' '}
                        {team.department?.name || getDepartmentName(team.departmentId)}
                      </span>
                      {team.coordenador && (
                        <span>
                          <strong>Coordenador:</strong> {team.coordenador.name}
                        </span>
                      )}
                      <span>
                        <strong>Membros:</strong> {memberCount}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex-1"
                        onClick={() => toggleExpand(team.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                        )}
                        {isExpanded ? 'Recolher' : 'Expandir'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex-1"
                        onClick={() => openMembersDialog(team)}
                      >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Ver Membros
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => openAddMemberDialog(team.id)}
                        title="Adicionar membro"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded members section */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membros da Equipe
                      </h4>
                      {loadingMembers ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : teamMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">Nenhum membro cadastrado.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between bg-white rounded-lg p-2 border text-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {member.user?.name || member.userId}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {member.papel && <span>{member.papel}</span>}
                                  {member.dataInicio && (
                                    <span>
                                      desde {new Date(member.dataInicio).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                title="Remover membro"
                                onClick={() =>
                                  openRemoveMemberConfirm(
                                    team.id,
                                    member.id,
                                    member.user?.name || 'este membro'
                                  )
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* Dialogs                                                           */}
        {/* ================================================================= */}

        {/* Create / Edit Team Dialog */}
        <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTeam ? 'Editar Equipe' : 'Nova Equipe'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={teamForm.nome}
                  onChange={(e) => setTeamForm({ ...teamForm, nome: e.target.value })}
                  placeholder="Nome da equipe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sigla</Label>
                  <Input
                    value={teamForm.sigla}
                    onChange={(e) => setTeamForm({ ...teamForm, sigla: e.target.value })}
                    placeholder="Ex: GT-PLAN"
                  />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={teamForm.tipo}
                    onValueChange={(v) => setTeamForm({ ...teamForm, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_TEAM_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {TIPO_TEAM[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Departamento *</Label>
                <Select
                  value={teamForm.departmentId}
                  onValueChange={(v) => setTeamForm({ ...teamForm, departmentId: v })}
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
              <div>
                <Label>Coordenador</Label>
                <Select
                  value={teamForm.coordenadorId}
                  onValueChange={(v) => setTeamForm({ ...teamForm, coordenadorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o coordenador (opcional)" />
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
              <div>
                <Label>Finalidade</Label>
                <Textarea
                  value={teamForm.finalidade}
                  onChange={(e) => setTeamForm({ ...teamForm, finalidade: e.target.value })}
                  placeholder="Descreva a finalidade da equipe (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTeam}
                disabled={saving || !teamForm.nome || !teamForm.tipo || !teamForm.departmentId}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingTeam ? (
                  <Edit2 className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingTeam ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Members Detail Dialog */}
        <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Membros - {membersDialogTeam?.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {membersDialogList.length} membro{membersDialogList.length !== 1 ? 's' : ''}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  if (membersDialogTeam) openAddMemberDialog(membersDialogTeam.id);
                }}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Adicionar Membro
              </Button>
            </div>

            {loadingMembersDialog ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : membersDialogList.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Nenhum membro nesta equipe.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {membersDialogList.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {member.user?.name || member.userId}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {member.user?.email && <span>{member.user.email}</span>}
                        {member.papel && (
                          <Badge variant="outline" className="text-[10px]">
                            {member.papel}
                          </Badge>
                        )}
                        {member.dataInicio && (
                          <span>
                            Desde {new Date(member.dataInicio).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {member.atribuicoes && (
                        <p className="text-xs text-gray-400 mt-1">{member.atribuicoes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                      title="Remover membro"
                      onClick={() =>
                        openRemoveMemberConfirm(
                          membersDialogTeam?.id || '',
                          member.id,
                          member.user?.name || 'este membro'
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Servidor *</Label>
                <Select
                  value={addMemberForm.userId}
                  onValueChange={(v) => setAddMemberForm({ ...addMemberForm, userId: v })}
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
              <div>
                <Label>Papel / Funcao</Label>
                <Input
                  value={addMemberForm.papel}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, papel: e.target.value })}
                  placeholder="Ex: Relator, Fiscal, Membro"
                />
              </div>
              <div>
                <Label>Atribuicoes</Label>
                <Textarea
                  value={addMemberForm.atribuicoes}
                  onChange={(e) =>
                    setAddMemberForm({ ...addMemberForm, atribuicoes: e.target.value })
                  }
                  placeholder="Descreva as atribuicoes do membro (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled={saving || !addMemberForm.userId}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation */}
        <Dialog open={removeMemberConfirmOpen} onOpenChange={setRemoveMemberConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Membro</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja remover <strong>{memberToRemove?.name}</strong> desta equipe?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveMemberConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRemoveMember} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Team Confirmation */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Equipe</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja excluir a equipe <strong>&quot;{teamToDelete?.nome}&quot;</strong>?
              Esta acao nao pode ser desfeita.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteTeam} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
