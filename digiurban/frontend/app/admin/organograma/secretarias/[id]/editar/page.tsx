'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  DepartmentManagementForm,
  type DepartmentFormData,
} from '@/components/admin/DepartmentManagementForm';

export default function EditarSecretariaPage() {
  const params = useParams();
  const { apiRequest } = useAdminAuth();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<DepartmentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDepartment();
  }, [departmentId]);

  const loadDepartment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(
        `/admin/departments?includeInactive=true&departmentId=${departmentId}`
      );
      const currentDepartment = response?.data?.departments?.[0] || null;

      if (!currentDepartment) {
        throw new Error('Secretaria não encontrada');
      }

      setDepartment({
        id: currentDepartment.id,
        name: currentDepartment.name,
        code: currentDepartment.code || '',
        description: currentDepartment.description || '',
        isActive: currentDepartment.isActive ? 'true' : 'false',
      });
    } catch (loadError) {
      console.error('Erro ao carregar secretaria para edição:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar secretaria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/organograma/secretarias"
            className="rounded-lg p-2 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
              <Building2 className="h-7 w-7 text-blue-600 md:h-8 md:w-8" />
              Editar Secretaria
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Atualize o cadastro oficial da secretaria sem sair do fluxo centralizado.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error || !department ? (
          <Card className="p-8 text-gray-700">
            {error || 'Secretaria não encontrada'}
          </Card>
        ) : (
          <DepartmentManagementForm
            mode="edit"
            initialDepartment={department}
            cancelHref="/admin/organograma/secretarias"
          />
        )}
      </div>
    </div>
  );
}
