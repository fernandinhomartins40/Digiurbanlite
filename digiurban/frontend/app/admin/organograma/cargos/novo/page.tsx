'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PositionManagementForm } from '@/components/admin/organograma/PositionManagementForm';

export default function NovoCargoPage() {
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('departmentId') || undefined;
  const organizationalUnitId = searchParams.get('organizationalUnitId') || undefined;
  const returnTo = searchParams.get('returnTo') || '/admin/organograma/cargos';

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
              <Briefcase className="h-7 w-7 text-purple-600" />
              Novo cargo
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Cadastre o cargo diretamente na unidade organizacional correta.
            </p>
          </div>
        </div>

        <PositionManagementForm
          mode="create"
          presetDepartmentId={departmentId}
          presetOrganizationalUnitId={organizationalUnitId}
          cancelHref={returnTo}
          successHref={returnTo}
        />
      </div>
    </div>
  );
}
