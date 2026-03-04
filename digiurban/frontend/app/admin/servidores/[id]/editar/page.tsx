'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  ServerManagementForm,
  type ServerFormData,
} from '@/components/admin/ServerManagementForm'

export default function EditarServidorPage() {
  const params = useParams()
  const { user, apiRequest } = useAdminAuth()
  const userId = params.id as string

  const [server, setServer] = useState<ServerFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadServer()
  }, [userId])

  const loadServer = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest(`/admin/users/${userId}`)
      const payload = response?.data?.user || response?.user || response?.data || response
      setServer(payload)
    } catch (loadError) {
      console.error('Erro ao carregar servidor para edicao:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={server?.id ? `/admin/servidores/${server.id}` : '/admin/servidores'}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Editar Servidor</h1>
            <p className="text-sm md:text-base text-gray-600">
              Edicao administrativa com organograma centralizado preservado
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error || !server ? (
          <Card className="p-8 text-gray-700">
            {error || 'Servidor nao encontrado'}
          </Card>
        ) : (
          <ServerManagementForm
            mode="edit"
            initialUser={server}
            cancelHref={`/admin/servidores/${server.id}`}
            currentUserRole={user?.role || 'USER'}
            currentUserDepartmentId={user?.primaryDepartment?.id || user?.departmentId}
          />
        )}
      </div>
    </div>
  )
}
