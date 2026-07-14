'use client';

/**
 * Catálogo de PLANOS da plataforma (super-admin). CRUD dos planos SaaS que os
 * municípios contratam: nome, código, preço mensal, limites (maxUsers/
 * maxCitizens) e módulos incluídos. Substitui o hardcode de preços/limites.
 * Consome /api/platform/plans e /api/platform/modules.
 *
 * -1 em limite = ilimitado.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Crown,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  maxUsers: number;
  maxCitizens: number;
  features: Record<string, boolean> | null;
  isActive: boolean;
  sortOrder: number;
  tenants: number;
  createdAt: string;
  updatedAt: string;
}

interface ModuleOption {
  slug: string;
  label: string;
}

const emptyForm = {
  code: '',
  name: '',
  description: '',
  monthlyPrice: 0,
  maxUsers: 10,
  maxCitizens: 10000,
  sortOrder: 0,
  isActive: true,
};

/** Formata limite: -1 = Ilimitado. */
function fmtLimit(v: number): string {
  return v === -1 ? 'Ilimitado' : v.toLocaleString('pt-BR');
}

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [stats, setStats] = useState({ totalPlans: 0, activePlans: 0, totalSubscribers: 0, totalMRR: 0 });
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  // módulos DESABILITADOS (contrato: ausência = habilitado; só `false` desabilita)
  const [disabledModules, setDisabledModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
    loadModules();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform/plans', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
        setStats(data.stats);
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar planos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const res = await fetch('/api/platform/modules', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setModules(data.modules);
    } catch {
      /* silencioso — módulos são opcionais no form */
    }
  };

  const openNewDialog = () => {
    setFormData({ ...emptyForm, sortOrder: plans.length + 1 });
    setDisabledModules([]);
    setEditingPlan(null);
    setShowDialog(true);
  };

  const openEditDialog = (plan: Plan) => {
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice,
      maxUsers: plan.maxUsers,
      maxCitizens: plan.maxCitizens,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    });
    const feats = plan.features || {};
    setDisabledModules(Object.keys(feats).filter((k) => feats[k] === false));
    setEditingPlan(plan);
    setShowDialog(true);
  };

  const toggleModule = (slug: string) => {
    // marcado = módulo INCLUÍDO; desmarcar = adiciona a disabledModules
    setDisabledModules((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || (!editingPlan && !formData.code.trim())) {
      toast({ title: 'Campos obrigatórios', description: 'Informe nome e código.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // monta features: só grava as chaves desabilitadas como false
      const features: Record<string, boolean> = {};
      for (const s of disabledModules) features[s] = false;

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        monthlyPrice: Number(formData.monthlyPrice) || 0,
        maxUsers: Number(formData.maxUsers),
        maxCitizens: Number(formData.maxCitizens),
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
        features,
      };
      if (!editingPlan) payload.code = formData.code.trim().toUpperCase();

      const url = editingPlan ? `/api/platform/plans/${editingPlan.id}` : '/api/platform/plans';
      const res = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setShowDialog(false);
        loadPlans();
      } else {
        throw new Error(result.error || 'Erro ao salvar plano');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/platform/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast({ title: 'Status atualizado', description: `Plano ${plan.isActive ? 'desativado' : 'ativado'}.` });
        loadPlans();
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const deletePlan = async (plan: Plan) => {
    if (!confirm(`Deseja remover o plano "${plan.name}"?`)) return;
    try {
      const res = await fetch(`/api/platform/plans/${plan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast({ title: result.deleted ? 'Plano removido' : 'Plano desativado', description: result.message });
        loadPlans();
      } else {
        throw new Error(result.error || 'Erro ao remover plano');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando planos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Planos e Limites
          </h1>
          <p className="text-muted-foreground">
            Configure os planos que os municípios contratam: preço, limites e módulos.
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">{stats.activePlans} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Municípios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">com plano atribuído</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalMRR.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">receita recorrente mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalSubscribers > 0 ? Math.round(stats.totalMRR / stats.totalSubscribers).toLocaleString('pt-BR') : '0'}
            </div>
            <p className="text-xs text-muted-foreground">por município</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Preço/mês</TableHead>
                  <TableHead>Máx. Usuários</TableHead>
                  <TableHead>Máx. Cidadãos</TableHead>
                  <TableHead>Municípios</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum plano cadastrado. Clique em “Novo Plano”.
                    </TableCell>
                  </TableRow>
                )}
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.code}</Badge>
                    </TableCell>
                    <TableCell>R$ {plan.monthlyPrice.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{fmtLimit(plan.maxUsers)}</TableCell>
                    <TableCell>{fmtLimit(plan.maxCitizens)}</TableCell>
                    <TableCell>{plan.tenants}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch checked={plan.isActive} onCheckedChange={() => togglePlanStatus(plan)} />
                        <span className="text-xs">{plan.isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePlan(plan)}
                          title={plan.tenants > 0 ? 'Plano em uso será apenas desativado' : 'Remover plano'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              Preço, limites e módulos incluídos. Use <strong>-1</strong> para limite ilimitado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Município Pequeno"
                />
              </div>
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: STARTER"
                  disabled={!!editingPlan}
                />
                {editingPlan && <p className="text-xs text-muted-foreground mt-1">O código não é editável.</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Resumo do plano"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthlyPrice">Preço Mensal (R$) *</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  min={0}
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="maxUsers">Máx. Usuários *</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
                  placeholder="-1 = ilimitado"
                />
              </div>
              <div>
                <Label htmlFor="maxCitizens">Máx. Cidadãos *</Label>
                <Input
                  id="maxCitizens"
                  type="number"
                  value={formData.maxCitizens}
                  onChange={(e) => setFormData({ ...formData, maxCitizens: parseInt(e.target.value) || 0 })}
                  placeholder="-1 = ilimitado"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Módulos incluídos</Label>
              <div className="border rounded-lg p-4 max-h-[240px] overflow-y-auto">
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Catálogo de módulos indisponível.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {modules.map((mod) => {
                      const included = !disabledModules.includes(mod.slug);
                      return (
                        <label key={mod.slug} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() => toggleModule(mod.slug)}
                            className="rounded"
                          />
                          <span>{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Módulos desmarcados ficam bloqueados para municípios neste plano.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Plano ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sortOrder" className="text-sm">Ordem</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  className="w-20"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar'} Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
