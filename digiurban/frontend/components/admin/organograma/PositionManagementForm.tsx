'use client';

import { useEffect, useState } from 'react';
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
  NIVEL_CARGO_LABELS,
  NIVEL_CARGO_OPTIONS,
  TIPO_CARGO_LABELS,
  TIPO_CARGO_OPTIONS,
} from './organogram-options';

interface DepartmentOption {
  id: string;
  name: string;
}

interface OrganizationalUnitOption {
  id: string;
  nome: string;
  sigla?: string | null;
  departmentId: string;
  tipo: string;
}

export interface PositionFormData {
  id?: string;
  nome: string;
  descricao: string;
  cbo: string;
  tipo: string;
  categoria: string;
  nivel: string;
  departmentId: string;
  organizationalUnitId: string;
  cargaHorariaPadrao: string;
  salarioBase: string;
  isActive?: boolean;
}

interface PositionManagementFormProps {
  mode: 'create' | 'edit';
  initialPosition?: PositionFormData | null;
  presetDepartmentId?: string;
  presetOrganizationalUnitId?: string;
  cancelHref: string;
  successHref?: string;
}

const EMPTY_FORM: PositionFormData = {
  nome: '',
  descricao: '',
  cbo: '',
  tipo: 'EFETIVO',
  categoria: '',
  nivel: '',
  departmentId: '',
  organizationalUnitId: '',
  cargaHorariaPadrao: '',
  salarioBase: '',
};

export function PositionManagementForm({
  mode,
  initialPosition,
  presetDepartmentId,
  presetOrganizationalUnitId,
  cancelHref,
  successHref,
}: PositionManagementFormProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState<PositionFormData>(() => ({
    ...(initialPosition || EMPTY_FORM),
    departmentId: initialPosition?.departmentId || presetDepartmentId || '',
    organizationalUnitId:
      initialPosition?.organizationalUnitId || presetOrganizationalUnitId || '',
  }));
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [organizationalUnits, setOrganizationalUnits] = useState<OrganizationalUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      ...(initialPosition || EMPTY_FORM),
      departmentId: initialPosition?.departmentId || presetDepartmentId || '',
      organizationalUnitId:
        initialPosition?.organizationalUnitId || presetOrganizationalUnitId || '',
    });
  }, [initialPosition, presetDepartmentId, presetOrganizationalUnitId]);

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    if (!formData.departmentId) {
      setOrganizationalUnits([]);
      return;
    }
    void loadOrganizationalUnits(formData.departmentId);
  }, [formData.departmentId]);

  const loadDepartments = async () => {
    setLoadingReferences(true);
    try {
      const response = await apiRequest('/admin/departments');
      setDepartments(response?.data?.departments ?? response?.departments ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar secretarias');
    } finally {
      setLoadingReferences(false);
    }
  };

  const loadOrganizationalUnits = async (departmentId: string) => {
    try {
      const response = await apiRequest(`/organizational-units?departmentId=${departmentId}&isActive=true`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setOrganizationalUnits(list);
    } catch {
      setOrganizationalUnits([]);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFormData((current) => ({
      ...current,
      departmentId,
      organizationalUnitId: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      setError('Nome do cargo e obrigatorio');
      return;
    }
    if (!formData.departmentId) {
      setError('Selecione a secretaria do cargo');
      return;
    }
    if (!formData.organizationalUnitId) {
      setError('Selecione a unidade organizacional do cargo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        cbo: formData.cbo.trim() || undefined,
        tipo: formData.tipo,
        categoria: formData.categoria.trim() || undefined,
        nivel: formData.nivel || undefined,
        departmentId: formData.departmentId,
        organizationalUnitId: formData.organizationalUnitId,
        cargaHorariaPadrao: formData.cargaHorariaPadrao
          ? Number(formData.cargaHorariaPadrao)
          : undefined,
        salarioBase: formData.salarioBase ? Number(formData.salarioBase) : undefined,
        ...(isEditMode ? { isActive: formData.isActive } : {}),
      };

      if (isEditMode && initialPosition?.id) {
        await apiRequest(`/positions/${initialPosition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      router.push(successHref || '/admin/organograma/cargos');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao salvar cargo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar cargo' : 'Novo cargo'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Atualize o cargo mantendo a unidade organizacional como contexto principal.'
            : 'Cadastre o cargo vinculado diretamente a uma unidade organizacional.'}
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
              <Label htmlFor="position-name">Nome *</Label>
              <Input
                id="position-name"
                value={formData.nome}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, nome: event.target.value }))
                }
                placeholder="Ex: Analista de Fiscalizacao"
                disabled={loading || loadingReferences}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-cbo">CBO</Label>
              <Input
                id="position-cbo"
                value={formData.cbo}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, cbo: event.target.value }))
                }
                placeholder="Ex: 2521-05"
                disabled={loading}
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
              <Label>Unidade / setor *</Label>
              <Select
                value={formData.organizationalUnitId}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, organizationalUnitId: value }))
                }
                disabled={loading || !formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {organizationalUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.sigla ? `${unit.sigla} - ${unit.nome}` : unit.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  {TIPO_CARGO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_CARGO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select
                value={formData.nivel || '_none_'}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    nivel: value === '_none_' ? '' : value,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sem nivel definido</SelectItem>
                  {NIVEL_CARGO_OPTIONS.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {NIVEL_CARGO_LABELS[nivel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-category">Categoria</Label>
            <Input
              id="position-category"
              value={formData.categoria}
              onChange={(event) =>
                setFormData((current) => ({ ...current, categoria: event.target.value }))
              }
              placeholder="Ex: Administrativo"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-description">Descricao</Label>
            <Textarea
              id="position-description"
              value={formData.descricao}
              onChange={(event) =>
                setFormData((current) => ({ ...current, descricao: event.target.value }))
              }
              rows={4}
              placeholder="Resumo das atribuicoes do cargo"
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-hours">Carga horaria padrao</Label>
              <Input
                id="position-hours"
                type="number"
                min="0"
                value={formData.cargaHorariaPadrao}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    cargaHorariaPadrao: event.target.value,
                  }))
                }
                placeholder="40"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-salary">Salario base</Label>
              <Input
                id="position-salary"
                type="number"
                min="0"
                step="0.01"
                value={formData.salarioBase}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, salarioBase: event.target.value }))
                }
                placeholder="3500.00"
                disabled={loading}
              />
            </div>
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
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
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
              disabled={
                loading ||
                loadingReferences ||
                !formData.nome.trim() ||
                !formData.departmentId ||
                !formData.organizationalUnitId
              }
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar alteracoes' : 'Criar cargo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
