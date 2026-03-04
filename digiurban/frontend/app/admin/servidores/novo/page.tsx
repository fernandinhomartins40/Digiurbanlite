'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ServerManagementForm } from '@/components/admin/ServerManagementForm'

export default function NovoServidorPage() {
  const { user } = useAdminAuth()

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/servidores"
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Novo Servidor</h1>
            <p className="text-sm md:text-base text-gray-600">
              Cadastro administrativo com lotacao inicial obrigatoria no organograma
            </p>
          </div>
        </div>

        <ServerManagementForm
          mode="create"
          cancelHref="/admin/servidores"
          currentUserRole={user?.role || 'USER'}
          currentUserDepartmentId={user?.primaryDepartment?.id || user?.departmentId}
        />
      </div>
    </div>
  )
}
