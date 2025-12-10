'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Circle, RefreshCw, AlertTriangle, Bell } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { CitizenSearchBar } from '@/components/admin/gabinete/CitizenSearchBar'
import { LiveStatsCards } from '@/components/admin/gabinete/LiveStatsCards'
import { useLiveStats } from '@/hooks/useLiveStats'
import { useToast } from '@/hooks/use-toast'

// ⚡ Lazy load dos componentes pesados
const ProtocolTrendsChart = lazy(() => import('@/components/admin/gabinete/ProtocolTrendsChart').then(m => ({ default: m.ProtocolTrendsChart })))
const DepartmentPerformanceTable = lazy(() => import('@/components/admin/gabinete/DepartmentPerformanceTable').then(m => ({ default: m.DepartmentPerformanceTable })))
const CriticalAlerts = lazy(() => import('@/components/admin/gabinete/CriticalAlerts').then(m => ({ default: m.CriticalAlerts })))
const TopServersCard = lazy(() => import('@/components/admin/gabinete/TopServersCard').then(m => ({ default: m.TopServersCard })))

// Componente de loading
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )
}

interface PendingProtocol {
  id: string
  number: string
  title: string
  status: string
  createdAt: string
  citizen: { name: string }
  department: { name: string } | null
  assignedUser: { name: string } | null
}

export default function PainelPrefeitoPage() {
  const { user } = useAdminAuth()
  const { stats, isLoading, refresh, lastUpdate } = useLiveStats()
  const { toast } = useToast()
  const [pendingProtocols, setPendingProtocols] = useState<PendingProtocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)
  const [lastUpdateText, setLastUpdateText] = useState('agora')

  // Verificar se usuário tem permissão
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Apenas o Prefeito (ADMIN) pode acessar este painel
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Atualizar texto de "há X segundos"
  useEffect(() => {
    if (!lastUpdate) return

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      if (seconds < 60) {
        setLastUpdateText(`há ${seconds}s`)
      } else {
        const minutes = Math.floor(seconds / 60)
        setLastUpdateText(`há ${minutes}min`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastUpdate])

  // Carregar protocolos pendentes
  const loadPendingProtocols = async () => {
    try {
      setLoadingProtocols(true)
      const response = await fetch('/api/protocols?limit=10', { credentials: 'include' })
      const data = await response.json()

      if (data.success && data.data?.protocols) {
        // Filtrar apenas não concluídos
        const pending = data.data.protocols.filter(
          (p: PendingProtocol) => p.status !== 'CONCLUIDO'
        )
        setPendingProtocols(pending)
      }
    } catch (error) {
      console.error('Erro ao carregar protocolos pendentes:', error)
    } finally {
      setLoadingProtocols(false)
    }
  }

  useEffect(() => {
    loadPendingProtocols()
  }, [])

  const handleRefresh = () => {
    refresh()
    loadPendingProtocols()
    toast({
      title: 'Dados atualizados',
      description: 'O painel foi atualizado com sucesso'
    })
  }

  const handleRequestUpdate = async (protocolId: string) => {
    try {
      await fetch(`/api/admin/protocols/${protocolId}/request-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: 'Solicitação de agilidade na resolução deste protocolo.'
        })
      })

      toast({
        title: 'Solicitação enviada',
        description: 'A cobrança de agilidade foi enviada aos responsáveis'
      })

      loadPendingProtocols()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação',
        variant: 'destructive'
      })
    }
  }

  const getDaysOld = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const statusColors: Record<string, string> = {
    VINCULADO: 'bg-blue-100 text-blue-800',
    PROGRESSO: 'bg-yellow-100 text-yellow-800',
    ATUALIZACAO: 'bg-orange-100 text-orange-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PENDENCIA: 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">🏛️ Painel do Prefeito</h1>
            <p className="text-blue-100">Visão executiva 360° do município em tempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 animate-pulse"
            >
              <Circle className="h-2 w-2 fill-current mr-2" />
              LIVE - {lastUpdateText}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Busca de Cidadão */}
        <div className="max-w-3xl">
          <CitizenSearchBar />
        </div>
      </div>

      {/* Cards de Métricas */}
      <LiveStatsCards stats={stats} isLoading={isLoading} />

      {/* Grid de Gráficos e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Tendências */}
        <Suspense fallback={<Card><CardContent className="p-6"><ComponentLoader /></CardContent></Card>}>
          <ProtocolTrendsChart />
        </Suspense>

        {/* Top Servidores */}
        <Suspense fallback={<Card><CardContent className="p-6"><ComponentLoader /></CardContent></Card>}>
          <TopServersCard />
        </Suspense>
      </div>

      {/* Alertas Críticos */}
      <Suspense fallback={<Card><CardContent className="p-6"><ComponentLoader /></CardContent></Card>}>
        <CriticalAlerts />
      </Suspense>

      {/* Performance por Secretaria */}
      <Suspense fallback={<Card><CardContent className="p-6"><ComponentLoader /></CardContent></Card>}>
        <DepartmentPerformanceTable />
      </Suspense>

      {/* Protocolos que Requerem Atenção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                Protocolos que Requerem Sua Atenção
              </CardTitle>
              <CardDescription>
                Últimos protocolos em andamento que precisam de acompanhamento
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/protocolos'}>
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProtocols ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : pendingProtocols.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Nenhum protocolo pendente!</p>
              <p className="text-sm text-gray-500">Todos os protocolos estão sob controle</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProtocols.map((protocol) => {
                const daysOld = getDaysOld(protocol.createdAt)
                const isOverdue = daysOld > 30

                return (
                  <div
                    key={protocol.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={`/admin/protocolos?search=${protocol.number}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            #{protocol.number}
                          </a>
                          <Badge
                            variant="secondary"
                            className={statusColors[protocol.status] || 'bg-gray-100 text-gray-800'}
                          >
                            {protocol.status}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="animate-pulse">
                              ⚠️ Atrasado {daysOld} dias
                            </Badge>
                          )}
                          {!isOverdue && daysOld > 0 && (
                            <span className="text-xs text-gray-500">
                              há {daysOld} {daysOld === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{protocol.title}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <strong>Cidadão:</strong> {protocol.citizen?.name || 'N/A'}
                          </span>
                          <span>
                            <strong>Setor:</strong> {protocol.department?.name || 'Não definido'}
                          </span>
                          <span>
                            <strong>Responsável:</strong> {protocol.assignedUser?.name || 'Não atribuído'}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestUpdate(protocol.id)}
                        className="ml-4 border-orange-600 text-orange-600 hover:bg-orange-50"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Cobrar Agilidade
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
