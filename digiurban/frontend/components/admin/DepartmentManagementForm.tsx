'use client';

import { useState } from 'react';
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

export interface DepartmentFormData {
  id?: string;
  name: string;
  code: string;
  description: string;
  isActive: 'true' | 'false';
}

interface DepartmentManagementFormProps {
  mode: 'create' | 'edit';
  initialDepartment?: DepartmentFormData | null;
  cancelHref: string;
  successHref?: string;
}

const EMPTY_FORM: DepartmentFormData = {
  name: '',
  code: '',
  description: '',
  isActive: 'true',
};

export function DepartmentManagementForm({
  mode,
  initialDepartment,
  cancelHref,
  successHref = '/admin/organograma/secretarias',
}: DepartmentManagementFormProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState<DepartmentFormData>(initialDepartment || EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError('Nome da secretaria é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        isActive: formData.isActive === 'true',
      };

      if (isEditMode && formData.id) {
        await apiRequest(`/admin/departments/${formData.id}`, {
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

      router.push(successHref);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Erro ao salvar secretaria'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar secretaria' : 'Nova secretaria'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Atualize o cadastro oficial da secretaria e mantenha a unidade raiz sincronizada.'
            : 'Cadastre a secretaria oficial. A unidade raiz do organograma será criada automaticamente.'}
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

          <div className="space-y-2">
            <Label htmlFor="department-name">Nome *</Label>
            <Input
              id="department-name"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex: Secretaria de Meio Ambiente"
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department-code">Código</Label>
              <Input
                id="department-code"
                value={formData.code}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="Ex: MEIO_AMBIENTE"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.isActive}
                onValueChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    isActive: value as 'true' | 'false',
                  }))
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-description">Descrição</Label>
            <Textarea
              id="department-description"
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Resumo da atuação da secretaria"
              rows={5}
              disabled={loading}
            />
          </div>

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
              disabled={loading || !formData.name.trim()}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar alterações' : 'Criar secretaria'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
