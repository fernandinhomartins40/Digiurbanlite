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
import { TIPO_FUNCAO_LABELS, TIPO_FUNCAO_OPTIONS } from './organogram-options';

interface DepartmentOption {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  nome: string;
  departmentId: string;
  organizationalUnit?: {
    id: string;
    nome: string;
    sigla?: string | null;
  } | null;
}

export interface FunctionFormData {
  id?: string;
  nome: string;
  descricao: string;
  tipo: string;
  simbolo: string;
  valor: string;
  departmentId: string;
  positionId: string;
  isActive?: boolean;
}

interface FunctionManagementFormProps {
  mode: 'create' | 'edit';
  initialFunction?: FunctionFormData | null;
  presetDepartmentId?: string;
  presetPositionId?: string;
  cancelHref: string;
  successHref?: string;
}

const EMPTY_FORM: FunctionFormData = {
  nome: '',
  descricao: '',
  tipo: 'GRATIFICADA',
  simbolo: '',
  valor: '',
  departmentId: '',
  positionId: '',
};

export function FunctionManagementForm({
  mode,
  initialFunction,
  presetDepartmentId,
  presetPositionId,
  cancelHref,
  successHref,
}: FunctionManagementFormProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState<FunctionFormData>(() => ({
    ...(initialFunction || EMPTY_FORM),
    departmentId: initialFunction?.departmentId || presetDepartmentId || '',
    positionId: initialFunction?.positionId || presetPositionId || '',
  }));
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      ...(initialFunction || EMPTY_FORM),
      departmentId: initialFunction?.departmentId || presetDepartmentId || '',
      positionId: initialFunction?.positionId || presetPositionId || '',
    });
  }, [initialFunction, presetDepartmentId, presetPositionId]);

  useEffect(() => {
    void loadDepartments();
  }, []);

  useEffect(() => {
    if (!formData.departmentId) {
      setPositions([]);
      return;
    }
    void loadPositions(formData.departmentId);
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

  const loadPositions = async (departmentId: string) => {
    try {
      const response = await apiRequest(`/positions?departmentId=${departmentId}&isActive=true`);
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setPositions(list);
    } catch {
      setPositions([]);
    }
  };

  const selectedPosition = useMemo(
    () => positions.find((position) => position.id === formData.positionId) || null,
    [formData.positionId, positions]
  );

  const handleDepartmentChange = (departmentId: string) => {
    setFormData((current) => ({
      ...current,
      departmentId,
      positionId: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      setError('Nome da funcao e obrigatorio');
      return;
    }
    if (!formData.departmentId) {
      setError('Selecione a secretaria da funcao');
      return;
    }
    if (!formData.positionId) {
      setError('Selecione o cargo ao qual a funcao pertence');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        tipo: formData.tipo,
        simbolo: formData.simbolo.trim() || undefined,
        valor: formData.valor ? Number(formData.valor) : undefined,
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        ...(isEditMode ? { isActive: formData.isActive } : {}),
      };

      if (isEditMode && initialFunction?.id) {
        await apiRequest(`/functions/${initialFunction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/functions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      router.push(successHref || '/admin/organograma/funcoes');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao salvar funcao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar funcao' : 'Nova funcao'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Atualize a funcao mantendo o cargo como dependencia central.'
            : 'Cadastre a funcao a partir de um cargo ja existente no organograma.'}
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
              <Label htmlFor="function-name">Nome *</Label>
              <Input
                id="function-name"
                value={formData.nome}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, nome: event.target.value }))
                }
                placeholder="Ex: Funcao gratificada de coordenacao"
                disabled={loading || loadingReferences}
              />
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
                  {TIPO_FUNCAO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_FUNCAO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Cargo *</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, positionId: value }))
                }
                disabled={loading || !formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.organizationalUnit?.sigla
                        ? `${position.organizationalUnit.sigla} - ${position.nome}`
                        : position.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPosition && (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">Cargo vinculado</p>
              <p>{selectedPosition.nome}</p>
              {selectedPosition.organizationalUnit && (
                <p className="text-xs text-slate-500">
                  Unidade: {selectedPosition.organizationalUnit.nome}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="function-symbol">Simbolo</Label>
              <Input
                id="function-symbol"
                value={formData.simbolo}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, simbolo: event.target.value }))
                }
                placeholder="Ex: FG-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="function-value">Valor</Label>
              <Input
                id="function-value"
                type="number"
                min="0"
                step="0.01"
                value={formData.valor}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, valor: event.target.value }))
                }
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="function-description">Descricao</Label>
            <Textarea
              id="function-description"
              value={formData.descricao}
              onChange={(event) =>
                setFormData((current) => ({ ...current, descricao: event.target.value }))
              }
              rows={4}
              placeholder="Detalhe o objetivo da funcao"
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
              disabled={
                loading ||
                loadingReferences ||
                !formData.nome.trim() ||
                !formData.departmentId ||
                !formData.positionId
              }
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar alteracoes' : 'Criar funcao'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
