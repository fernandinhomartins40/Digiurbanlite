'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Circle, RefreshCw, AlertTriangle, Bell, Calendar, Map } from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { CitizenSearchBar } from '@/components/admin/gabinete/CitizenSearchBar'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Painel do Prefeito</h1>
            <p className="text-blue-100">Gestão executiva simplificada e prática</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <Circle className="h-2 w-2 fill-current mr-2" />
              {lastUpdateText}
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

      {/* Cards de Métricas Simples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Protocolos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? '...' : stats?.totalActive || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Concluídos (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : stats?.totalCompleted || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? '...' : `${stats?.completionRate || 0}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? '...' : `${stats?.avgResponseTime || 0}d`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/gabinete/mapa-demandas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Map className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Mapa de Demandas</CardTitle>
                  <CardDescription className="text-green-700">
                    Visualização geográfica dos protocolos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/gabinete/agenda">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Agenda Executiva</CardTitle>
                  <CardDescription className="text-purple-700">
                    Compromissos e eventos oficiais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Protocolos Atrasados (SLA Vencido) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                Protocolos Atrasados que Requerem Urgência
              </CardTitle>
              <CardDescription>
                Protocolos com SLA vencido que precisam de atenção imediata
              </CardDescription>
            </div>
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
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Nenhum protocolo atrasado!</p>
              <p className="text-sm text-gray-500">Todos os SLAs estão dentro do prazo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueSLAs.map((sla) => (
                <div
                  key={sla.id}
                  className="border border-red-300 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={`/admin/protocolos?search=${sla.protocol.number}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          #{sla.protocol.number}
                        </a>
                        <Badge variant="destructive" className="animate-pulse">
                          ⚠️ {sla.daysOverdue} dias de atraso
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {sla.protocol.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          <strong>Cidadão:</strong> {sla.protocol.citizen?.name || 'N/A'}
                        </span>
                        <span>
                          <strong>Secretaria:</strong>{' '}
                          {sla.protocol.department?.name || 'Não definido'}
                        </span>
                        <span>
                          <strong>Prazo:</strong>{' '}
                          {new Date(sla.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRequestUrgency(sla.protocol.id)}
                      className="ml-4"
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
