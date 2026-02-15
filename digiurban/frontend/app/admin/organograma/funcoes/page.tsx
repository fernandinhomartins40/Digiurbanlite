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
import { BarChart3, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface Department {
  id: string;
  name: string;
  code?: string;
}

interface Funcao {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  simbolo?: string;
  valor?: number;
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
  _count?: {
    assignments?: number;
  };
}

const TIPO_FUNCAO_OPTIONS = ['GRATIFICADA', 'COMISSIONADA', 'DESIGNACAO', 'REPRESENTACAO'];

const TIPO_FUNCAO_LABELS: Record<string, string> = {
  GRATIFICADA: 'Gratificada',
  COMISSIONADA: 'Comissionada',
  DESIGNACAO: 'Designacao',
  REPRESENTACAO: 'Representacao',
};

const TIPO_FUNCAO_COLORS: Record<string, string> = {
  GRATIFICADA: 'bg-green-100 text-green-800 border-green-300',
  COMISSIONADA: 'bg-blue-100 text-blue-800 border-blue-300',
  DESIGNACAO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  REPRESENTACAO: 'bg-purple-100 text-purple-800 border-purple-300',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function FuncoesPage() {
  const { apiRequest } = useAdminAuth();

  // Data states
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFuncao, setSelectedFuncao] = useState<Funcao | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'GRATIFICADA',
    simbolo: '',
    valor: '',
    departmentId: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchFuncoes();
  }, [filterDepartment, filterTipo]);

  const fetchDepartments = async () => {
    try {
      const response = await apiRequest('/admin/departments');
      const deptList = response?.data?.departments ?? response?.departments ?? [];
      setDepartments(deptList);
    } catch (err: any) {
      console.error('Erro ao carregar departamentos:', err);
    }
  };

  const fetchFuncoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterTipo) params.append('tipo', filterTipo);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const queryString = params.toString();
      const url = `/functions${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setFuncoes(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar funcoes');
      setFuncoes([]);
    } finally {
      setLoading(false);
    }
  }, [filterDepartment, filterTipo, searchTerm, apiRequest]);

  const handleSearch = () => {
    fetchFuncoes();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchFuncoes();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'GRATIFICADA',
      simbolo: '',
      valor: '',
      departmentId: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (funcao: Funcao) => {
    setSelectedFuncao(funcao);
    setFormData({
      nome: funcao.nome,
      descricao: funcao.descricao || '',
      tipo: funcao.tipo,
      simbolo: funcao.simbolo || '',
      valor: funcao.valor != null ? String(funcao.valor) : '',
      departmentId: funcao.departmentId,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (funcao: Funcao) => {
    setSelectedFuncao(funcao);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.nome || !formData.tipo || !formData.departmentId) return;
    setSaving(true);
    try {
      await apiRequest('/functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          tipo: formData.tipo,
          simbolo: formData.simbolo || undefined,
          valor: formData.valor ? parseFloat(formData.valor) : undefined,
          departmentId: formData.departmentId,
        }),
      });
      setCreateDialogOpen(false);
      resetForm();
      fetchFuncoes();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar funcao');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFuncao || !formData.nome || !formData.tipo || !formData.departmentId) return;
    setSaving(true);
    try {
      await apiRequest(`/functions/${selectedFuncao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          tipo: formData.tipo,
          simbolo: formData.simbolo || undefined,
          valor: formData.valor ? parseFloat(formData.valor) : undefined,
          departmentId: formData.departmentId,
        }),
      });
      setEditDialogOpen(false);
      setSelectedFuncao(null);
      resetForm();
      fetchFuncoes();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar funcao');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFuncao) return;
    setSaving(true);
    try {
      await apiRequest(`/functions/${selectedFuncao.id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      setSelectedFuncao(null);
      fetchFuncoes();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir funcao');
    } finally {
      setSaving(false);
    }
  };

  const filteredFuncoes = funcoes.filter((f) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNome = f.nome.toLowerCase().includes(term);
      const matchSimbolo = f.simbolo?.toLowerCase().includes(term);
      const matchDescricao = f.descricao?.toLowerCase().includes(term);
      if (!matchNome && !matchSimbolo && !matchDescricao) return false;
    }
    return true;
  });

  const getDepartmentName = (funcao: Funcao) => {
    if (funcao.department?.name) return funcao.department.name;
    const dept = departments.find((d) => d.id === funcao.departmentId);
    return dept?.name || 'N/A';
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/organograma"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 mt-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-7 w-7 md:h-8 md:w-8 text-pink-600" />
                Funcoes Gratificadas
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Gerencie funcoes gratificadas, comissionadas e de designacao
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Funcao
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm text-gray-600 mb-1 block">Departamento</Label>
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
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-gray-600 mb-1 block">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPO_FUNCAO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_FUNCAO_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <Label className="text-sm text-gray-600 mb-1 block">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Nome, simbolo ou descricao..."
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            <span className="ml-3 text-gray-600">Carregando funcoes...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && filteredFuncoes.length === 0 && (
          <Card className="p-8 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma funcao encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterDepartment || filterTipo
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece cadastrando a primeira funcao gratificada.'}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Funcao
            </Button>
          </Card>
        )}

        {/* Card Grid */}
        {!loading && !error && filteredFuncoes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFuncoes.map((funcao) => {
              const colorClass = TIPO_FUNCAO_COLORS[funcao.tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
              return (
                <Card key={funcao.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{funcao.nome}</h3>
                      {funcao.descricao && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{funcao.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Editar"
                        onClick={() => openEditDialog(funcao)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        title="Excluir"
                        onClick={() => openDeleteDialog(funcao)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${colorClass}`}>
                        {TIPO_FUNCAO_LABELS[funcao.tipo] || funcao.tipo}
                      </Badge>
                      {funcao.simbolo && (
                        <Badge variant="outline" className="text-xs">
                          {funcao.simbolo}
                        </Badge>
                      )}
                    </div>

                    {funcao.valor != null && funcao.valor > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <DollarSign className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">{formatCurrency(funcao.valor)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span className="truncate">{getDepartmentName(funcao)}</span>
                      <span className="flex-shrink-0 ml-2">
                        {funcao._count?.assignments ?? 0} lotacao(oes)
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Funcao</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da funcao"
                />
              </div>
              <div>
                <Label>Descricao</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao da funcao (opcional)"
                  rows={3}
                />
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
                      {TIPO_FUNCAO_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_FUNCAO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Simbolo</Label>
                  <Input
                    value={formData.simbolo}
                    onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                    placeholder="Ex: FG-1, CC-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Departamento *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formData.nome || !formData.tipo || !formData.departmentId}
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
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Funcao</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da funcao"
                />
              </div>
              <div>
                <Label>Descricao</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao da funcao (opcional)"
                  rows={3}
                />
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
                      {TIPO_FUNCAO_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_FUNCAO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Simbolo</Label>
                  <Input
                    value={formData.simbolo}
                    onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                    placeholder="Ex: FG-1, CC-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Departamento *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={saving || !formData.nome || !formData.tipo || !formData.departmentId}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Funcao</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja excluir a funcao <strong>&quot;{selectedFuncao?.nome}&quot;</strong>?
              Esta acao nao pode ser desfeita.
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
