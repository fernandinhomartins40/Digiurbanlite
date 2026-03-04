'use client';

import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { DepartmentManagementForm } from '@/components/admin/DepartmentManagementForm';

export default function NovaSecretariaPage() {
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
              Nova Secretaria
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Cadastro oficial da secretaria com sincronização automática no organograma.
            </p>
          </div>
        </div>

        <DepartmentManagementForm
          mode="create"
          cancelHref="/admin/organograma/secretarias"
        />
      </div>
    </div>
  );
}
