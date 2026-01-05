'use client';

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
  Mail,
  TrendingUp,
  RefreshCw,
  Globe,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EmailPlan {
  id: string;
  name: string;
  code: string;
  monthlyPrice: number;
  maxEmailsPerMonth: number;
  maxAccounts: number;
  features: string[];
  isActive: boolean;
  allowedDomains: Array<{
    id: string;
    domainId: string;
    domainName: string;
    isVerified: boolean;
  }>;
  subscribers: number;
  createdAt: string;
  updatedAt: string;
}

interface EmailDomain {
  id: string;
  domainName: string;
  isVerified: boolean;
  dkimEnabled: boolean;
  spfEnabled: boolean;
  dmarcEnabled: boolean;
}

export default function EmailPlansManagementPage() {
  const [plans, setPlans] = useState<EmailPlan[]>([]);
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [stats, setStats] = useState({ totalPlans: 0, activePlans: 0, totalSubscribers: 0, totalMRR: 0 });
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EmailPlan | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    monthlyPrice: 0,
    maxEmailsPerMonth: 0,
    maxAccounts: 0,
    features: '',
    isActive: true
  });

  useEffect(() => {
    loadPlans();
    loadDomains();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/email/plans', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
        setStats(data.stats);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar planos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/super-admin/email/plans/domains/available', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const openNewDialog = () => {
    setFormData({
      name: '',
      code: '',
      monthlyPrice: 0,
      maxEmailsPerMonth: 0,
      maxAccounts: 0,
      features: '',
      isActive: true
    });
    setSelectedDomains([]);
    setEditingPlan(null);
    setShowDialog(true);
  };

  const openEditDialog = (plan: EmailPlan) => {
    setFormData({
      name: plan.name,
      code: plan.code,
      monthlyPrice: plan.monthlyPrice,
      maxEmailsPerMonth: plan.maxEmailsPerMonth,
      maxAccounts: plan.maxAccounts,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      isActive: plan.isActive
    });
    setSelectedDomains(plan.allowedDomains.map(d => d.domainId));
    setEditingPlan(plan);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const featuresArray = formData.features.split('\n').filter(f => f.trim());

      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        monthlyPrice: parseFloat(formData.monthlyPrice.toString()),
        maxEmailsPerMonth: parseInt(formData.maxEmailsPerMonth.toString()),
        maxAccounts: parseInt(formData.maxAccounts.toString()),
        features: featuresArray,
        isActive: formData.isActive,
        allowedDomainIds: selectedDomains
      };

      const url = editingPlan
        ? `/api/super-admin/email/plans/${editingPlan.id}`
        : '/api/super-admin/email/plans';

      const response = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message
        });
        setShowDialog(false);
        loadPlans();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar plano',
        variant: 'destructive'
      });
    }
  };

  const togglePlanStatus = async (plan: EmailPlan) => {
    try {
      const response = await fetch(`/api/super-admin/email/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !plan.isActive })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Status atualizado',
          description: `Plano ${plan.isActive ? 'desativado' : 'ativado'} com sucesso`
        });
        loadPlans();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do plano',
        variant: 'destructive'
      });
    }
  };

  const deletePlan = async (plan: EmailPlan) => {
    if (!confirm(`Deseja desativar o plano "${plan.name}"?`)) return;

    try {
      const response = await fetch(`/api/super-admin/email/plans/${plan.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Plano desativado',
          description: result.message
        });
        loadPlans();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar plano',
        variant: 'destructive'
      });
    }
  };

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
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
            Gestão de Planos de Email
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie planos para prefeituras contratarem
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
            <p className="text-xs text-muted-foreground">
              {stats.activePlans} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">prefeituras ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalMRR.toFixed(2)}</div>
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
              R$ {stats.totalSubscribers > 0 ? (stats.totalMRR / stats.totalSubscribers).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">por prefeitura</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Emails/Mês</TableHead>
                <TableHead>Contas</TableHead>
                <TableHead>Domínios</TableHead>
                <TableHead>Assinantes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{plan.code}</Badge>
                  </TableCell>
                  <TableCell>R$ {plan.monthlyPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {plan.maxEmailsPerMonth === -1 ? 'Ilimitado' : plan.maxEmailsPerMonth.toLocaleString()}
                  </TableCell>
                  <TableCell>{plan.maxAccounts}</TableCell>
                  <TableCell>
                    {plan.allowedDomains.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {plan.allowedDomains.slice(0, 2).map(d => (
                          <Badge key={d.id} variant="secondary" className="text-xs">
                            {d.domainName}
                          </Badge>
                        ))}
                        {plan.allowedDomains.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{plan.allowedDomains.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Todos</span>
                    )}
                  </TableCell>
                  <TableCell>{plan.subscribers}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => togglePlanStatus(plan)}
                      />
                      <span className="text-xs">
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePlan(plan)}
                        disabled={plan.subscribers > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do plano de email
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
                  placeholder="Ex: Básico Municipal"
                />
              </div>

              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: BASIC"
                  disabled={!!editingPlan}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthlyPrice">Preço Mensal (R$) *</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  step="0.01"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="maxEmailsPerMonth">Emails/Mês *</Label>
                <Input
                  id="maxEmailsPerMonth"
                  type="number"
                  value={formData.maxEmailsPerMonth}
                  onChange={(e) => setFormData({ ...formData, maxEmailsPerMonth: parseInt(e.target.value) || 0 })}
                  placeholder="-1 = ilimitado"
                />
              </div>

              <div>
                <Label htmlFor="maxAccounts">Contas *</Label>
                <Input
                  id="maxAccounts"
                  type="number"
                  value={formData.maxAccounts}
                  onChange={(e) => setFormData({ ...formData, maxAccounts: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (uma por linha)</Label>
              <textarea
                id="features"
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="5.000 emails/mês&#10;Domínio personalizado&#10;DKIM/SPF automático"
              />
            </div>

            <div>
              <Label className="mb-2 block">Domínios Permitidos (opcional)</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                {domains.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum domínio verificado disponível</p>
                ) : (
                  <div className="space-y-2">
                    {domains.map((domain) => (
                      <div key={domain.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`domain-${domain.id}`}
                          checked={selectedDomains.includes(domain.id)}
                          onChange={() => toggleDomain(domain.id)}
                          className="rounded"
                        />
                        <label htmlFor={`domain-${domain.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{domain.domainName}</span>
                          {domain.isVerified && (
                            <Badge variant="secondary" className="ml-2 text-xs">Verificado</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Se nenhum domínio for selecionado, todos os domínios serão permitidos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Plano ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlan ? 'Atualizar' : 'Criar'} Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
