'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Edit2, Loader2, Plus, RefreshCw, ShieldCheck, Shuffle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface RootUnitSummary {
  id: string;
  nome: string;
  sigla?: string | null;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  usersCount: number;
  servicesCount: number;
  protocolsCount: number;
  unitsCount: number;
  rootUnitStatus: 'SYNCED' | 'MISSING';
  rootOrganizationalUnit?: RootUnitSummary | null;
}

type FormState = {
  name: string;
  code: string;
  description: string;
  isActive: 'true' | 'false';
};

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  description: '',
  isActive: 'true',
};

export default function SecretariasPage() {
  const { apiRequest } = useAdminAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/admin/departments?includeInactive=true');
      const list = response?.data?.departments ?? [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar secretarias');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
      isActive: department.isActive ? 'true' : 'false',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        isActive: formData.isActive === 'true',
      };

      if (editingDepartment) {
        await apiRequest(`/admin/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/admin/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      setEditingDepartment(null);
      setFormData(EMPTY_FORM);
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar secretaria');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (departmentId?: string) => {
    setSyncing(true);
    try {
      await apiRequest('/admin/departments/sync-root-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId,
          missingOnly: !departmentId,
        }),
      });
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Erro ao sincronizar secretarias');
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    return departments.reduce(
      (acc, department) => {
        acc.total += 1;
        if (department.isActive) {
          acc.active += 1;
        }
        if (department.rootUnitStatus === 'SYNCED') {
          acc.synced += 1;
        } else {
          acc.missing += 1;
        }
        return acc;
      },
      { total: 0, active: 0, synced: 0, missing: 0 }
    );
  }, [departments]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/organograma">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
                <Building2 className="h-7 w-7 text-blue-600 md:h-8 md:w-8" />
                Secretarias
              </h1>
              <p className="mt-1 text-sm text-gray-600 md:text-base">
                Cadastre a secretaria oficial e mantenha a unidade raiz do organograma sincronizada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchDepartments} disabled={loading || syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={() => handleSync()} disabled={syncing || loading}>
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
              Sincronizar raízes pendentes
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova secretaria
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-blue-900">Fonte de verdade centralizada</h2>
              <p className="mt-1 text-sm text-blue-800">
                A secretaria é criada como <strong>Department</strong>. A unidade <strong>SECRETARIA</strong> do
                organograma é gerada e mantida em conjunto. Diretorias, divisões, núcleos e setores continuam sendo
                geridos em <Link href="/admin/organograma/unidades" className="underline">Unidades</Link>.
              </p>
            </div>
          </div>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total de secretarias</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-xs text-gray-500">Ativas</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.synced}</p>
            <p className="text-xs text-gray-500">Com raiz sincronizada</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.missing}</p>
            <p className="text-xs text-gray-500">Pendentes de sincronização</p>
          </Card>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <Loader2 className="mr-3 h-6 w-6 animate-spin text-blue-600" />
            Carregando secretarias...
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200 bg-red-50 p-4 text-red-700">{error}</Card>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {departments.map((department) => (
              <Card key={department.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">{department.name}</h2>
                      <Badge variant={department.isActive ? 'default' : 'secondary'}>
                        {department.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge
                        variant={department.rootUnitStatus === 'SYNCED' ? 'default' : 'secondary'}
                        className={department.rootUnitStatus === 'SYNCED' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                      >
                        {department.rootUnitStatus === 'SYNCED' ? 'Raiz sincronizada' : 'Raiz pendente'}
                      </Badge>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Código: {department.code || '-'}</span>
                      <span>{department.usersCount} usuários</span>
                      <span>{department.servicesCount} serviços</span>
                      <span>{department.protocolsCount} protocolos</span>
                      <span>{department.unitsCount} unidades</span>
                    </div>

                    <p className="text-sm text-gray-600">
                      {department.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900">Unidade raiz do organograma:</span>{' '}
                      {department.rootOrganizationalUnit ? (
                        <>
                          {department.rootOrganizationalUnit.nome}
                          {department.rootOrganizationalUnit.sigla ? ` (${department.rootOrganizationalUnit.sigla})` : ''}
                        </>
                      ) : (
                        'Ainda não criada'
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {department.rootUnitStatus === 'MISSING' && (
                      <Button
                        variant="outline"
                        onClick={() => handleSync(department.id)}
                        disabled={syncing}
                      >
                        {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
                        Criar raiz
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => openEditDialog(department)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {departments.length === 0 && (
              <Card className="p-8 text-center text-gray-600">
                Nenhuma secretaria cadastrada.
              </Card>
            )}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingDepartment ? 'Editar secretaria' : 'Nova secretaria'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="department-name">Nome *</Label>
                <Input
                  id="department-name"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Secretaria de Meio Ambiente"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="department-code">Código</Label>
                  <Input
                    id="department-code"
                    value={formData.code}
                    onChange={(event) => setFormData((current) => ({ ...current, code: event.target.value }))}
                    placeholder="Ex: MEIO_AMBIENTE"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.isActive}
                    onValueChange={(value) => setFormData((current) => ({ ...current, isActive: value as 'true' | 'false' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativa</SelectItem>
                      <SelectItem value="false">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="department-description">Descrição</Label>
                <Textarea
                  id="department-description"
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Resumo da atuação da secretaria"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingDepartment ? 'Salvar alterações' : 'Criar secretaria'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
