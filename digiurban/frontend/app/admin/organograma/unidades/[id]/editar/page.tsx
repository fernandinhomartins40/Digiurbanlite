'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderTree, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  OrganizationalUnitFormData,
  OrganizationalUnitManagementForm,
} from '@/components/admin/organograma/OrganizationalUnitManagementForm';

interface UnitResponse {
  id: string;
  nome: string;
  sigla?: string | null;
  tipo: string;
  departmentId: string;
  parentId?: string | null;
  responsavel?: { id: string } | null;
  descricao?: string | null;
  isActive?: boolean;
}

export default function EditarUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const id = params.id as string;
  const [unit, setUnit] = useState<OrganizationalUnitFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void loadUnit();
  }, [id]);

  const loadUnit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = (await apiRequest(`/organizational-units/${id}`)) as UnitResponse;
      if (response.tipo === 'SECRETARIA' && !response.parentId) {
        router.replace('/admin/organograma/secretarias');
        return;
      }
      setUnit({
        id: response.id,
        nome: response.nome,
        sigla: response.sigla || '',
        tipo: response.tipo,
        departmentId: response.departmentId,
        parentId: response.parentId || '',
        responsavelId: response.responsavel?.id || '',
        descricao: response.descricao || '',
        isActive: response.isActive !== false,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar unidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/organograma/unidades/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <FolderTree className="h-7 w-7 text-blue-600" />
              Editar unidade
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Atualize a unidade mantendo seu contexto na secretaria correta.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando unidade...</span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>
        ) : unit ? (
          <OrganizationalUnitManagementForm
            mode="edit"
            initialUnit={unit}
            cancelHref={`/admin/organograma/unidades/${id}`}
            successHref={`/admin/organograma/unidades/${id}`}
          />
        ) : null}
      </div>
    </div>
  );
}
