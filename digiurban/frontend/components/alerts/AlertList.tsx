'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Bell, Filter, RefreshCcw, Search } from 'lucide-react'
import { AlertCard } from './AlertCard'
import type { Alert } from './index'
// LEGADO: import { useAlerts } from '@/hooks/api/analytics'

interface AlertListProps {
  title?: string
  showFilters?: boolean
  showTabs?: boolean
  defaultFilter?: 'all' | 'active' | 'acknowledged' | 'resolved'
  maxHeight?: string
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

export function AlertList({
  title = 'Alertas do Sistema',
  showFilters = true,
  showTabs = true,
  defaultFilter = 'all',
  maxHeight = '600px',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className
}: AlertListProps) {
  // LEGADO: const { alerts, loading, error, fetchAlerts } = useAlerts()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchAlerts = async () => { /* TODO: Implementar via API */ }

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>(defaultFilter)

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAlerts()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchAlerts])

  // Filter alerts based on current filters
  const filteredAlerts = alerts.filter((alert: Alert) => {
    const matchesSearch = searchTerm === '' ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesType = typeFilter === 'all' || alert.type === typeFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter

    return matchesSearch && matchesSeverity && matchesType && matchesStatus
  })

  // Group alerts by status for tabs
  const alertsByStatus = {
    all: filteredAlerts,
    active: filteredAlerts.filter((alert: Alert) => alert.status === 'active'),
    acknowledged: filteredAlerts.filter((alert: Alert) => alert.status === 'acknowledged'),
    resolved: filteredAlerts.filter((alert: Alert) => alert.status === 'resolved')
  }

  const getStatusCount = (status: string) => {
    switch (status) {
      case 'active':
        return alerts.filter((alert: Alert) => alert.status === 'active').length
      case 'acknowledged':
        return alerts.filter((alert: Alert) => alert.status === 'acknowledged').length
      case 'resolved':
        return alerts.filter((alert: Alert) => alert.status === 'resolved').length
      default:
        return alerts.length
    }
  }

  const handleRefresh = () => {
    fetchAlerts()
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Erro ao carregar alertas</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>{title}</span>
            <Badge variant="secondary">
              {filteredAlerts.length}
            </Badge>
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
                <SelectItem value="business">Negócio</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {!showTabs && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="acknowledged">Reconhecidos</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {showTabs ? (
          <Tabs defaultValue={defaultFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <span>Todos</span>
                <Badge variant="secondary">{getStatusCount('all')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center space-x-2">
                <span>Ativos</span>
                <Badge variant="destructive">{getStatusCount('active')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="acknowledged" className="flex items-center space-x-2">
                <span>Reconhecidos</span>
                <Badge variant="default">{getStatusCount('acknowledged')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center space-x-2">
                <span>Resolvidos</span>
                <Badge variant="secondary">{getStatusCount('resolved')}</Badge>
              </TabsTrigger>
            </TabsList>

            {Object.entries(alertsByStatus).map(([status, statusAlerts]) => (
              <TabsContent key={status} value={status}>
                <div
                  className="space-y-4 overflow-y-auto pr-2"
                  style={{ maxHeight }}
                >
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : statusAlerts.length > 0 ? (
                    statusAlerts.map((alert: Alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={() => fetchAlerts()}
                        onResolve={() => fetchAlerts()}
                        onDismiss={() => fetchAlerts()}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm || severityFilter !== 'all' || typeFilter !== 'all'
                          ? 'Nenhum alerta encontrado com os filtros aplicados'
                          : status === 'active'
                          ? 'Nenhum alerta ativo'
                          : status === 'acknowledged'
                          ? 'Nenhum alerta reconhecido'
                          : status === 'resolved'
                          ? 'Nenhum alerta resolvido'
                          : 'Nenhum alerta encontrado'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div
            className="space-y-4 overflow-y-auto pr-2"
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert: Alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => fetchAlerts()}
                  onResolve={() => fetchAlerts()}
                  onDismiss={() => fetchAlerts()}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  Nenhum alerta encontrado
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}