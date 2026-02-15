'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, Users } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  code: string;
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
  cargaHorariaPadrao?: number;
  salarioBase?: number;
  isActive?: boolean;
  department?: {
    id: string;
    name: string;
  };
  _count?: {
    assignments?: number;
  };
}

const TIPO_CARGO_OPTIONS = [
  'EFETIVO',
  'COMISSIONADO',
  'TEMPORARIO',
  'CONTRATADO',
  'ESTAGIARIO',
  'VOLUNTARIO',
];

const TIPO_CARGO_LABELS: Record<string, string> = {
  EFETIVO: 'Efetivo',
  COMISSIONADO: 'Comissionado',
  TEMPORARIO: 'Temporário',
  CONTRATADO: 'Contratado',
  ESTAGIARIO: 'Estagiário',
  VOLUNTARIO: 'Voluntário',
};

const TIPO_CARGO_COLORS: Record<string, string> = {
  EFETIVO: 'bg-blue-100 text-blue-800 border-blue-300',
  COMISSIONADO: 'bg-purple-100 text-purple-800 border-purple-300',
  TEMPORARIO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONTRATADO: 'bg-green-100 text-green-800 border-green-300',
  ESTAGIARIO: 'bg-orange-100 text-orange-800 border-orange-300',
  VOLUNTARIO: 'bg-pink-100 text-pink-800 border-pink-300',
};

const NIVEL_CARGO_OPTIONS = [
  'OPERACIONAL',
  'TECNICO',
  'ANALISTA',
  'ESPECIALISTA',
  'COORDENACAO',
  'GERENCIA',
  'DIRECAO',
  'SECRETARIADO',
];

const NIVEL_CARGO_LABELS: Record<string, string> = {
  OPERACIONAL: 'Operacional',
  TECNICO: 'Técnico',
  ANALISTA: 'Analista',
  ESPECIALISTA: 'Especialista',
  COORDENACAO: 'Coordenação',
  GERENCIA: 'Gerência',
  DIRECAO: 'Direção',
  SECRETARIADO: 'Secretariado',
};

const NIVEL_CARGO_COLORS: Record<string, string> = {
  OPERACIONAL: 'bg-gray-100 text-gray-700 border-gray-300',
  TECNICO: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  ANALISTA: 'bg-blue-100 text-blue-800 border-blue-300',
  ESPECIALISTA: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  COORDENACAO: 'bg-violet-100 text-violet-800 border-violet-300',
  GERENCIA: 'bg-purple-100 text-purple-800 border-purple-300',
  DIRECAO: 'bg-rose-100 text-rose-800 border-rose-300',
  SECRETARIADO: 'bg-amber-100 text-amber-800 border-amber-300',
};

export default function CargosPage() {
  const { apiRequest } = useAdminAuth();

  // Data
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterNivel, setFilterNivel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cbo: '',
    tipo: 'EFETIVO',
    categoria: '',
    nivel: '',
    departmentId: '',
    cargaHorariaPadrao: '',
    salarioBase: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [filterDepartment, filterTipo, filterNivel, searchTerm]);

  const fetchDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      const deptList = response?.data?.departments ?? response?.departments ?? [];
      setDepartments(deptList);
    } catch (err: any) {
      console.error('Erro ao carregar departamentos:', err.message);
    }
  };

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterTipo) params.append('tipo', filterTipo);
      if (filterNivel) params.append('nivel', filterNivel);
      if (searchTerm) params.append('search', searchTerm);

      const queryString = params.toString();
      const url = `/positions${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setPositions(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cargos');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [filterDepartment, filterTipo, filterNivel, searchTerm, apiRequest]);

  const openCreateDialog = () => {
    setEditingPosition(null);
    setFormData({
      nome: '',
      descricao: '',
      cbo: '',
      tipo: 'EFETIVO',
      categoria: '',
      nivel: '',
      departmentId: '',
      cargaHorariaPadrao: '',
      salarioBase: '',
    });
    setFormDialogOpen(true);
  };

  const openEditDialog = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      nome: position.nome,
      descricao: position.descricao || '',
      cbo: position.cbo || '',
      tipo: position.tipo,
      categoria: position.categoria || '',
      nivel: position.nivel || '',
      departmentId: position.departmentId,
      cargaHorariaPadrao: position.cargaHorariaPadrao != null ? String(position.cargaHorariaPadrao) : '',
      salarioBase: position.salarioBase != null ? String(position.salarioBase) : '',
    });
    setFormDialogOpen(true);
  };

  const openDeleteDialog = (position: Position) => {
    setSelectedPosition(position);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        nome: formData.nome,
        tipo: formData.tipo,
        departmentId: formData.departmentId,
      };
      if (formData.descricao) body.descricao = formData.descricao;
      if (formData.cbo) body.cbo = formData.cbo;
      if (formData.categoria) body.categoria = formData.categoria;
      if (formData.nivel) body.nivel = formData.nivel;
      if (formData.cargaHorariaPadrao) body.cargaHorariaPadrao = Number(formData.cargaHorariaPadrao);
      if (formData.salarioBase) body.salarioBase = Number(formData.salarioBase);

      if (editingPosition) {
        await apiRequest(`/positions/${editingPosition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest('/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      setFormDialogOpen(false);
      fetchPositions();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cargo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition) return;
    setSaving(true);
    try {
      await apiRequest(`/positions/${selectedPosition.id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      setSelectedPosition(null);
      fetchPositions();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cargo');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.nome.trim() !== '' && formData.tipo !== '' && formData.departmentId !== '';

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
                title="Voltar ao Organograma"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Briefcase className="h-7 w-7 md:h-8 md:w-8 text-purple-600" />
                  Cargos
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Gerencie os cargos e funções da estrutura organizacional
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cargo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
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

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPO_CARGO_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_CARGO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os niveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os niveis</SelectItem>
                {NIVEL_CARGO_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {NIVEL_CARGO_LABELS[n]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Carregando cargos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && positions.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cargo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterDepartment || filterTipo || filterNivel
                ? 'Nenhum cargo corresponde aos filtros aplicados.'
                : 'Nenhum cargo cadastrado ainda. Crie o primeiro cargo para começar.'}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" /> Novo Cargo
            </Button>
          </Card>
        )}

        {/* Card Grid */}
        {!loading && !error && positions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((position) => {
              const tipoColor = TIPO_CARGO_COLORS[position.tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
              const nivelColor = position.nivel
                ? NIVEL_CARGO_COLORS[position.nivel] || 'bg-gray-100 text-gray-700 border-gray-300'
                : '';
              const assignmentCount = position._count?.assignments ?? 0;

              return (
                <Card key={position.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{position.nome}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Editar"
                        onClick={() => openEditDialog(position)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        title="Excluir"
                        onClick={() => openDeleteDialog(position)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {position.descricao && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{position.descricao}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="outline" className={`text-xs ${tipoColor}`}>
                      {TIPO_CARGO_LABELS[position.tipo] || position.tipo}
                    </Badge>
                    {position.nivel && (
                      <Badge variant="outline" className={`text-xs ${nivelColor}`}>
                        {NIVEL_CARGO_LABELS[position.nivel] || position.nivel}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500">
                    {position.cbo && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-600">CBO:</span>
                        <span>{position.cbo}</span>
                      </div>
                    )}
                    {position.department && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-600">Departamento:</span>
                        <span className="truncate">{position.department.name}</span>
                      </div>
                    )}
                    {position.cargaHorariaPadrao != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-600">Carga horaria:</span>
                        <span>{position.cargaHorariaPadrao}h</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {assignmentCount} {assignmentCount === 1 ? 'servidor vinculado' : 'servidores vinculados'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? 'Editar Cargo' : 'Novo Cargo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cargo"
                />
              </div>

              <div>
                <Label>Descricao</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao do cargo (opcional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CBO</Label>
                  <Input
                    value={formData.cbo}
                    onChange={(e) => setFormData({ ...formData, cbo: e.target.value })}
                    placeholder="Ex: 2521-05"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Administrativo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      {TIPO_CARGO_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_CARGO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(v) => setFormData({ ...formData, nivel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {NIVEL_CARGO_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n}>
                          {NIVEL_CARGO_LABELS[n]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Departamento *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carga Horaria Padrao</Label>
                  <Input
                    type="number"
                    value={formData.cargaHorariaPadrao}
                    onChange={(e) => setFormData({ ...formData, cargaHorariaPadrao: e.target.value })}
                    placeholder="Ex: 40"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Salario Base (R$)</Label>
                  <Input
                    type="number"
                    value={formData.salarioBase}
                    onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
                    placeholder="Ex: 3500.00"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !isFormValid}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingPosition ? null : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingPosition ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cargo</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja excluir o cargo <strong>&quot;{selectedPosition?.nome}&quot;</strong>?
              {(selectedPosition?._count?.assignments ?? 0) > 0 && (
                <span className="block mt-2 text-red-600 text-sm">
                  Atenao: este cargo possui {selectedPosition?._count?.assignments} servidor(es) vinculado(s).
                </span>
              )}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
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
