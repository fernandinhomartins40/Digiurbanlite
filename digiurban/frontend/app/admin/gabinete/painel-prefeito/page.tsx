'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Circle, RefreshCw, AlertTriangle, Bell, Calendar, Map, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { CitizenSearchBar } from '@/components/admin/gabinete/CitizenSearchBar'
import { ChamadosRecentesList } from '@/components/admin/gabinete/ChamadosRecentesList'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'

interface SimpleStats {
  totalActive: number
  totalCompleted: number
  completionRate: number
  avgResponseTime: number
}

interface OverdueSLA {
  id: string
  protocol: {
    id: string
    number: string
    title: string
    status: string
    department: { name: string } | null
    citizen: { name: string }
  }
  dueDate: string
  daysOverdue: number
}

export default function PainelPrefeitoPage() {
  const { user } = useAdminAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<SimpleStats | null>(null)
  const [overdueSLAs, setOverdueSLAs] = useState<OverdueSLA[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
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

  // Carregar dados do painel
  const loadData = async () => {
    try {
      setIsLoading(true)

      // Buscar estatísticas simples
      const statsResponse = await fetch(getFullApiUrl('/api/admin/gabinete/painel-prefeito/simple-stats'), {
        credentials: 'include'
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // Buscar SLAs atrasados
      const slaResponse = await fetch(getFullApiUrl('/api/sla/overdue'), {
        credentials: 'include'
      })

      if (slaResponse.ok) {
        const slaData = await slaResponse.json()
        setOverdueSLAs(slaData.data || [])
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do painel',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-refresh a cada 2 minutos
    const interval = setInterval(loadData, 120000)
    return () => clearInterval(interval)
  }, [])

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

  const handleRefresh = () => {
    loadData()
    toast({
      title: 'Dados atualizados',
      description: 'O painel foi atualizado com sucesso'
    })
  }

  const handleRequestUrgency = async (protocolId: string) => {
    try {
      const response = await fetch(getFullApiUrl(`/api/admin/gabinete/painel-prefeito/request-urgency/${protocolId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Falha ao enviar')

      toast({
        title: 'Cobrança enviada',
        description: 'A solicitação de urgência foi registrada e notificada aos responsáveis'
      })

      loadData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a cobrança',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Painel do Prefeito</h1>
            <p className="text-blue-100 text-sm sm:text-base">Gestão executiva simplificada e prática</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-xs sm:text-sm"
            >
              <Circle className="h-2 w-2 fill-current mr-2" />
              {lastUpdateText}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Busca de Cidadão */}
        <div className="w-full max-w-3xl">
          <CitizenSearchBar />
        </div>
      </div>

      {/* Cards de Métricas Simples */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Protocolos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {isLoading ? '...' : stats?.totalActive || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Concluídos (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {isLoading ? '...' : stats?.totalCompleted || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {isLoading ? '...' : `${stats?.completionRate || 0}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">
              {isLoading ? '...' : `${stats?.avgResponseTime || 0}d`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Link href="/admin/gabinete/mapa-demandas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                  <Map className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Mapa de Demandas</CardTitle>
                  <CardDescription className="text-green-700 text-xs sm:text-sm">
                    Visualização geográfica dos protocolos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/agenda">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 bg-purple-50">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Agenda Centralizada</CardTitle>
                  <CardDescription className="text-purple-700 text-xs sm:text-sm">
                    Compromissos e eventos oficiais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Chamados Recentes */}
      <ChamadosRecentesList />

      {/* Protocolos Atrasados (SLA Vencido) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              <span className="break-words">Protocolos Atrasados que Requerem Urgência</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Protocolos com SLA vencido que precisam de atenção imediata
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : overdueSLAs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Nenhum protocolo atrasado!</p>
              <p className="text-sm text-gray-500">Todos os SLAs estão dentro do prazo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueSLAs.map((sla) => (
                <div
                  key={sla.id}
                  className="border border-red-300 bg-red-50 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <a
                          href={`/admin/protocolos?search=${sla.protocol.number}`}
                          className="font-medium text-blue-600 hover:underline text-sm"
                        >
                          #{sla.protocol.number}
                        </a>
                        <Badge variant="destructive" className="animate-pulse text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {sla.daysOverdue} dias de atraso
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                        {sla.protocol.title}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-600">
                        <span className="truncate">
                          <strong>Cidadão:</strong> {sla.protocol.citizen?.name || 'N/A'}
                        </span>
                        <span className="truncate">
                          <strong>Secretaria:</strong>{' '}
                          {sla.protocol.department?.name || 'Não definido'}
                        </span>
                        <span className="whitespace-nowrap">
                          <strong>Prazo:</strong>{' '}
                          {new Date(sla.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRequestUrgency(sla.protocol.id)}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Cobrar Urgência
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
