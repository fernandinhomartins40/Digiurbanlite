'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Award, Medal } from 'lucide-react'
import useSWR from 'swr'

interface Server {
  id: string
  name: string
  email: string
  completionRate: number
  totalCompleted: number
  totalAssigned: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Erro ao buscar dados')
  return response.json()
}

export function TopServersCard() {
  const { data } = useSWR<{ success: boolean; data: { servers: Server[] } }>(
    '/api/admin/gabinete/painel-prefeito/top-servers',
    fetcher,
    {
      refreshInterval: 120000, // ⚡ 2 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  if (!data?.data?.servers) {
    return null // ⚡ Suspense já mostra loading
  }

  const servers = data.data.servers

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return { icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: '1º' }
      case 1:
        return { icon: Award, color: 'text-gray-400', bgColor: 'bg-gray-50', label: '2º' }
      case 2:
        return { icon: Medal, color: 'text-orange-500', bgColor: 'bg-orange-50', label: '3º' }
      default:
        return { icon: Medal, color: 'text-blue-500', bgColor: 'bg-blue-50', label: `${index + 1}º` }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Top 5 Servidores
        </CardTitle>
        <CardDescription>
          Servidores com maior taxa de conclusão de protocolos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {servers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Nenhum servidor com protocolos concluídos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server, index) => {
              const rank = getRankIcon(index)
              const Icon = rank.icon

              return (
                <div
                  key={server.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0 ? 'border-yellow-300 bg-yellow-50' :
                    index === 1 ? 'border-gray-300 bg-gray-50' :
                    index === 2 ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Ranking */}
                    <div className={`h-12 w-12 rounded-full ${rank.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${rank.color}`} />
                    </div>

                    {/* Informações do Servidor */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">{server.name}</p>
                        {index === 0 && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            MVP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{server.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          <strong>{server.totalCompleted}</strong> concluídos
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          <strong>{server.totalAssigned}</strong> atribuídos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Taxa de Conclusão */}
                  <div className="text-right ml-4">
                    <div className={`text-3xl font-bold ${
                      server.completionRate >= 90 ? 'text-green-600' :
                      server.completionRate >= 70 ? 'text-blue-600' :
                      server.completionRate >= 50 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>
                      {server.completionRate}%
                    </div>
                    <p className="text-xs text-gray-500">eficiência</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Resumo */}
        {servers.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Média do Top 5</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round(servers.reduce((sum, s) => sum + s.completionRate, 0) / servers.length)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700 font-medium">Total Concluído</p>
                <p className="text-2xl font-bold text-blue-900">
                  {servers.reduce((sum, s) => sum + s.totalCompleted, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
