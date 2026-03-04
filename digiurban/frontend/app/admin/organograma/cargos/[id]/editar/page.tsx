'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PositionFormData, PositionManagementForm } from '@/components/admin/organograma/PositionManagementForm';

interface PositionResponse {
  id: string;
  nome: string;
  descricao?: string | null;
  cbo?: string | null;
  tipo: string;
  categoria?: string | null;
  nivel?: string | null;
  departmentId: string;
  organizationalUnitId?: string | null;
  cargaHorariaPadrao?: number | null;
  salarioBase?: number | string | null;
  isActive?: boolean;
}

export default function EditarCargoPage() {
  const params = useParams();
  const { apiRequest } = useAdminAuth();
  const id = params.id as string;
  const [position, setPosition] = useState<PositionFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void loadPosition();
  }, [id]);

  const loadPosition = async () => {
    setLoading(true);
    setError('');
    try {
      const response = (await apiRequest(`/positions/${id}`)) as PositionResponse;
      setPosition({
        id: response.id,
        nome: response.nome,
        descricao: response.descricao || '',
        cbo: response.cbo || '',
        tipo: response.tipo,
        categoria: response.categoria || '',
        nivel: response.nivel || '',
        departmentId: response.departmentId,
        organizationalUnitId: response.organizationalUnitId || '',
        cargaHorariaPadrao:
          response.cargaHorariaPadrao !== null && response.cargaHorariaPadrao !== undefined
            ? String(response.cargaHorariaPadrao)
            : '',
        salarioBase:
          response.salarioBase !== null && response.salarioBase !== undefined
            ? String(response.salarioBase)
            : '',
        isActive: response.isActive !== false,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar cargo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/organograma/cargos">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <Briefcase className="h-7 w-7 text-purple-600" />
              Editar cargo
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Atualize o cargo mantendo a vinculacao com a unidade organizacional.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Carregando cargo...</span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>
        ) : position ? (
          <PositionManagementForm
            mode="edit"
            initialPosition={position}
            cancelHref="/admin/organograma/cargos"
            successHref="/admin/organograma/cargos"
          />
        ) : null}
      </div>
    </div>
  );
}
