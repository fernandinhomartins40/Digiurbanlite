'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  NIVEL_BY_TIPO,
  TIPO_UNIDADE_LABELS,
  TIPO_UNIDADE_OPTIONS,
} from './organogram-options';

interface DepartmentOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface OrganizationalUnitOption {
  id: string;
  nome: string;
  sigla?: string | null;
  departmentId: string;
  parentId?: string | null;
  tipo: string;
  isActive?: boolean;
}

export interface OrganizationalUnitFormData {
  id?: string;
  nome: string;
  sigla: string;
  tipo: string;
  departmentId: string;
  parentId: string;
  responsavelId: string;
  descricao: string;
  isActive?: boolean;
}

interface OrganizationalUnitManagementFormProps {
  mode: 'create' | 'edit';
  initialUnit?: OrganizationalUnitFormData | null;
  presetDepartmentId?: string;
  presetParentId?: string;
  cancelHref: string;
  successHref?: string;
}

const EMPTY_FORM: OrganizationalUnitFormData = {
  nome: '',
  sigla: '',
  tipo: 'SETOR',
  departmentId: '',
  parentId: '',
  responsavelId: '',
  descricao: '',
};

export function OrganizationalUnitManagementForm({
  mode,
  initialUnit,
  presetDepartmentId,
  presetParentId,
  cancelHref,
  successHref,
}: OrganizationalUnitManagementFormProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState<OrganizationalUnitFormData>(() => ({
    ...(initialUnit || EMPTY_FORM),
    departmentId: initialUnit?.departmentId || presetDepartmentId || '',
    parentId: initialUnit?.parentId || presetParentId || '',
  }));
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [parentUnits, setParentUnits] = useState<OrganizationalUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      ...(initialUnit || EMPTY_FORM),
      departmentId: initialUnit?.departmentId || presetDepartmentId || '',
      parentId: initialUnit?.parentId || presetParentId || '',
    });
  }, [initialUnit, presetDepartmentId, presetParentId]);

  useEffect(() => {
    void loadReferenceData();
  }, []);

  useEffect(() => {
    if (!formData.departmentId) {
      setParentUnits([]);
      return;
    }
    void loadParentUnits(formData.departmentId);
  }, [formData.departmentId]);

  const loadReferenceData = async () => {
    setLoadingReferences(true);
    try {
      const [departmentsResponse, usersResponse] = await Promise.all([
        apiRequest('/admin/departments'),
        apiRequest('/admin/team?limit=200&includeSuperAdmin=true'),
      ]);
      setDepartments(departmentsResponse?.data?.departments ?? departmentsResponse?.departments ?? []);
      const teamMembers = usersResponse?.data?.teamMembers ?? [];
      setUsers(teamMembers.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
      })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar referencias');
    } finally {
      setLoadingReferences(false);
    }
  };

  const loadParentUnits = async (departmentId: string) => {
    try {
      const response = await apiRequest(`/organizational-units?departmentId=${departmentId}`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setParentUnits(
        list.filter((unit: OrganizationalUnitOption) =>
          unit.isActive !== false && (!initialUnit?.id || unit.id !== initialUnit.id)
        )
      );
    } catch {
      setParentUnits([]);
    }
  };

  const currentDepartmentName = useMemo(
    () => departments.find((department) => department.id === formData.departmentId)?.name || '',
    [departments, formData.departmentId]
  );

  const rootDepartmentUnit = useMemo(
    () =>
      parentUnits.find(
        (unit) => unit.tipo === 'SECRETARIA' && !unit.parentId && unit.departmentId === formData.departmentId
      ) || null,
    [formData.departmentId, parentUnits]
  );

  const handleDepartmentChange = (departmentId: string) => {
    setFormData((current) => ({
      ...current,
      departmentId,
      parentId: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      setError('Nome da unidade e obrigatorio');
      return;
    }

    if (!formData.departmentId) {
      setError('Selecione a secretaria responsavel');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        nome: formData.nome.trim(),
        sigla: formData.sigla.trim() || undefined,
        tipo: formData.tipo,
        nivel: NIVEL_BY_TIPO[formData.tipo] || 5,
        departmentId: formData.departmentId,
        parentId: formData.parentId || undefined,
        responsavelId: formData.responsavelId || undefined,
        descricao: formData.descricao.trim() || undefined,
        ...(isEditMode ? { isActive: formData.isActive } : {}),
      };

      if (isEditMode && initialUnit?.id) {
        await apiRequest(`/organizational-units/${initialUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/organizational-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      router.push(successHref || '/admin/organograma/unidades');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao salvar unidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar unidade organizacional' : 'Nova unidade organizacional'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Atualize a unidade dentro da secretaria responsavel.'
            : 'Cadastre a unidade ja vinculada a uma secretaria do organograma.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Nome *</Label>
              <Input
                id="unit-name"
                value={formData.nome}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, nome: event.target.value }))
                }
                placeholder="Ex: Diretoria de Fiscalizacao"
                disabled={loading || loadingReferences}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-sigla">Sigla</Label>
              <Input
                id="unit-sigla"
                value={formData.sigla}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, sigla: event.target.value }))
                }
                placeholder="Ex: DIFIS"
                disabled={loading || loadingReferences}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Secretaria *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={handleDepartmentChange}
                disabled={loading || loadingReferences}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a secretaria" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, tipo: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_UNIDADE_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_UNIDADE_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unidade superior</Label>
            <Select
              value={formData.parentId || '_none_'}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  parentId: value === '_none_' ? '' : value,
                }))
              }
              disabled={loading || !formData.departmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Usar a raiz da secretaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Raiz da secretaria ({currentDepartmentName || 'automatica'})</SelectItem>
                {parentUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.sigla ? `${unit.sigla} - ${unit.nome}` : unit.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.parentId && rootDepartmentUnit && (
              <p className="text-xs text-muted-foreground">
                Sem unidade superior informada, a unidade sera vinculada automaticamente a {rootDepartmentUnit.nome}.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Responsavel</Label>
            <Select
              value={formData.responsavelId || '_none_'}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  responsavelId: value === '_none_' ? '' : value,
                }))
              }
              disabled={loading || loadingReferences}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum responsavel definido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Nenhum responsavel</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-description">Descricao</Label>
            <Textarea
              id="unit-description"
              value={formData.descricao}
              onChange={(event) =>
                setFormData((current) => ({ ...current, descricao: event.target.value }))
              }
              rows={5}
              placeholder="Resumo da finalidade da unidade"
              disabled={loading}
            />
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.isActive === false ? 'false' : 'true'}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, isActive: value === 'true' }))
                }
                disabled={loading}
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
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(cancelHref)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingReferences || !formData.nome.trim() || !formData.departmentId}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar alteracoes' : 'Criar unidade'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
