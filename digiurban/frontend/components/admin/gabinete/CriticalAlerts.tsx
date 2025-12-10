'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Clock, AlertCircle, UserX, ExternalLink } from 'lucide-react'
import useSWR from 'swr'

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  createdAt: string
  priority?: number
  citizen: { name: string }
  department: { name: string } | null
}

interface Alert {
  type: 'OVERDUE' | 'URGENT' | 'UNASSIGNED'
  title: string
  count: number
  protocols: Protocol[]
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Erro ao buscar dados')
  return response.json()
}

export function CriticalAlerts() {
  const { data } = useSWR<{ success: boolean; data: { alerts: Alert[] } }>(
    '/api/admin/gabinete/painel-prefeito/critical-alerts',
    fetcher,
    {
      refreshInterval: 120000, // ⚡ 2 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  if (!data?.data?.alerts) {
    return null // ⚡ Suspense já mostra loading
  }

  const alerts = data.data.alerts

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🎉 Sem Alertas Críticos</CardTitle>
          <CardDescription>Todos os protocolos estão sob controle</CardDescription>
        </CardHeader>
      </Card>
    )
  }


  const getAlertConfig = (type: Alert['type']) => {
    switch (type) {
      case 'OVERDUE':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          badgeVariant: 'destructive' as const
        }
      case 'URGENT':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          badgeVariant: 'secondary' as const
        }
      case 'UNASSIGNED':
        return {
          icon: UserX,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          badgeVariant: 'outline' as const
        }
    }
  }

  const getDaysOld = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0)

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Alertas Críticos
            </CardTitle>
            <CardDescription>
              {totalAlerts} {totalAlerts === 1 ? 'situação requer' : 'situações requerem'} atenção imediata
            </CardDescription>
          </div>
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
              {totalAlerts}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">Nenhum alerta crítico!</p>
            <p className="text-sm text-gray-500">Todos os protocolos estão sob controle</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const config = getAlertConfig(alert.type)
              const Icon = config.icon

              return (
                <div
                  key={alert.type}
                  className={`border-2 rounded-lg p-4 ${config.borderColor} ${config.bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-white flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <p className="text-sm text-gray-600">
                          {alert.count} {alert.count === 1 ? 'protocolo' : 'protocolos'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={config.badgeVariant}>
                      {alert.count}
                    </Badge>
                  </div>

                  {/* Lista de Protocolos */}
                  <div className="space-y-2 mt-3">
                    {alert.protocols.map((protocol) => {
                      const daysOld = getDaysOld(protocol.createdAt)

                      return (
                        <div
                          key={protocol.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <a
                                  href={`/admin/protocolos?search=${protocol.number}`}
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  #{protocol.number}
                                </a>
                                {alert.type === 'OVERDUE' && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {daysOld} dias
                                  </Badge>
                                )}
                                {alert.type === 'URGENT' && protocol.priority && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Prioridade {protocol.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 mb-1">{protocol.title}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>👤 {protocol.citizen?.name}</span>
                                <span>🏢 {protocol.department?.name || 'Sem departamento'}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/admin/protocolos?search=${protocol.number}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Botão Ver Todos */}
                  {alert.count > alert.protocols.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        if (alert.type === 'OVERDUE') {
                          window.location.href = '/admin/protocolos?overdue=true'
                        } else if (alert.type === 'URGENT') {
                          window.location.href = '/admin/protocolos?priority=high'
                        } else {
                          window.location.href = '/admin/protocolos?unassigned=true'
                        }
                      }}
                    >
                      Ver todos os {alert.count} protocolos
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
