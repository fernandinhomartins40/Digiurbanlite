'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FunctionManagementForm } from '@/components/admin/organograma/FunctionManagementForm';

export default function NovaFuncaoPage() {
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('departmentId') || undefined;
  const positionId = searchParams.get('positionId') || undefined;
  const returnTo = searchParams.get('returnTo') || '/admin/organograma/funcoes';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={returnTo}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <BarChart3 className="h-7 w-7 text-pink-600" />
              Nova funcao
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Cadastre a funcao vinculada diretamente a um cargo existente.
            </p>
          </div>
        </div>

        <FunctionManagementForm
          mode="create"
          presetDepartmentId={departmentId}
          presetPositionId={positionId}
          cancelHref={returnTo}
          successHref={returnTo}
        />
      </div>
    </div>
  );
}
