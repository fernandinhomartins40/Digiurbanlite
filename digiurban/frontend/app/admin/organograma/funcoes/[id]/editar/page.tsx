'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { FunctionFormData, FunctionManagementForm } from '@/components/admin/organograma/FunctionManagementForm';

interface FunctionResponse {
  id: string;
  nome: string;
  descricao?: string | null;
  tipo: string;
  simbolo?: string | null;
  valor?: number | string | null;
  departmentId: string;
  positionId?: string | null;
  isActive?: boolean;
}

export default function EditarFuncaoPage() {
  const params = useParams();
  const { apiRequest } = useAdminAuth();
  const id = params.id as string;
  const [funcao, setFuncao] = useState<FunctionFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void loadFunction();
  }, [id]);

  const loadFunction = async () => {
    setLoading(true);
    setError('');
    try {
      const response = (await apiRequest(`/functions/${id}`)) as FunctionResponse;
      setFuncao({
        id: response.id,
        nome: response.nome,
        descricao: response.descricao || '',
        tipo: response.tipo,
        simbolo: response.simbolo || '',
        valor:
          response.valor !== null && response.valor !== undefined ? String(response.valor) : '',
        departmentId: response.departmentId,
        positionId: response.positionId || '',
        isActive: response.isActive !== false,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar funcao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/organograma/funcoes">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <BarChart3 className="h-7 w-7 text-pink-600" />
              Editar funcao
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Atualize a funcao mantendo o cargo vinculado como referencia central.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            <span className="ml-3 text-gray-600">Carregando funcao...</span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>
        ) : funcao ? (
          <FunctionManagementForm
            mode="edit"
            initialFunction={funcao}
            cancelHref="/admin/organograma/funcoes"
            successHref="/admin/organograma/funcoes"
          />
        ) : null}
      </div>
    </div>
  );
}
