'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationalUnitManagementForm } from '@/components/admin/organograma/OrganizationalUnitManagementForm';

export default function NovaUnidadePage() {
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('departmentId') || undefined;
  const parentId = searchParams.get('parentId') || undefined;
  const returnTo = searchParams.get('returnTo') || '/admin/organograma/unidades';

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={returnTo}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <FolderTree className="h-7 w-7 text-blue-600" />
                Nova unidade
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Cadastre uma unidade organizacional dentro da secretaria correta.
              </p>
            </div>
          </div>
        </div>

        <OrganizationalUnitManagementForm
          mode="create"
          presetDepartmentId={departmentId}
          presetParentId={parentId}
          cancelHref={returnTo}
          successHref={returnTo}
        />
      </div>
    </div>
  );
}
