'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Phone, ExternalLink } from 'lucide-react'
import { getFullApiUrl } from '@/lib/api-config'
import Link from 'next/link'

interface Chamado {
  id: string
  number: string
  title: string
  status: string
  priority: number
  createdAt: string
  updatedAt: string
  citizen: {
    name: string
    cpf: string
  } | null
  service: {
    name: string
  } | null
  department: {
    name: string
  } | null
  assignedUser: {
    name: string
  } | null
  createdBy: {
    name: string
  } | null
}

interface ChamadosData {
  chamados: Chamado[]
  stats: {
    total: number
    byStatus: Record<string, number>
  }
}

export function ChamadosRecentesList() {
  const [data, setData] = useState<ChamadosData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadChamados = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(getFullApiUrl('/api/admin/gabinete/painel-prefeito/chamados?limit=10'), {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChamados()
  }, [])

  const statusColors: Record<string, string> = {
    VINCULADO: 'bg-blue-100 text-blue-800',
    PROGRESSO: 'bg-yellow-100 text-yellow-800',
    ATUALIZACAO: 'bg-orange-100 text-orange-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PENDENCIA: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-gray-100 text-gray-800'
  }

  const priorityColors: Record<number, string> = {
    5: 'bg-red-600 text-white',
    4: 'bg-orange-600 text-white',
    3: 'bg-yellow-600 text-white',
    2: 'bg-blue-600 text-white',
    1: 'bg-gray-600 text-white'
  }

  const priorityLabels: Record<number, string> = {
    5: 'Urgente',
    4: 'Alta',
    3: 'Média',
    2: 'Baixa',
    1: 'Muito Baixa'
  }

  const getDaysAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    return `${days} dias atrás`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Phone className="h-6 w-6 text-blue-600" />
              Chamados Recentes
            </CardTitle>
            <CardDescription>
              Protocolos criados pela equipe administrativa - {data?.stats.total || 0} no total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data?.stats.byStatus && (
              <div className="flex gap-1 text-xs">
                {Object.entries(data.stats.byStatus).map(([status, count]) => (
                  <Badge key={status} variant="outline" className={statusColors[status]}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={loadChamados} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/admin/chamados">
              <Button variant="outline" size="sm">
                Ver Todos
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data?.chamados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">Nenhum chamado registrado</p>
            <p className="text-sm text-gray-500">Chamados criados pela equipe aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.chamados.map((chamado) => (
              <div
                key={chamado.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Link
                        href={`/admin/protocolos?search=${chamado.number}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        #{chamado.number}
                      </Link>
                      <Badge
                        variant="secondary"
                        className={statusColors[chamado.status] || 'bg-gray-100 text-gray-800'}
                      >
                        {chamado.status}
                      </Badge>
                      {chamado.priority > 3 && (
                        <Badge
                          className={priorityColors[chamado.priority]}
                        >
                          {priorityLabels[chamado.priority]}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {getDaysAgo(chamado.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {chamado.title}
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      {chamado.citizen && (
                        <div>
                          <strong>Cidadão:</strong> {chamado.citizen.name}
                        </div>
                      )}
                      {chamado.service && (
                        <div>
                          <strong>Serviço:</strong> {chamado.service.name}
                        </div>
                      )}
                      {chamado.department && (
                        <div>
                          <strong>Secretaria:</strong> {chamado.department.name}
                        </div>
                      )}
                      {chamado.assignedUser && (
                        <div>
                          <strong>Responsável:</strong> {chamado.assignedUser.name}
                        </div>
                      )}
                      {chamado.createdBy && (
                        <div className="col-span-2">
                          <strong>Criado por:</strong> {chamado.createdBy.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
