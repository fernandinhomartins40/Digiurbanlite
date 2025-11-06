'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  FileText,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPriorityLabel, getPriorityBadgeClass, getPriorityIcon } from '@/lib/protocol-helpers'

const roleLabels = {
  USER: 'Funcionário',
  COORDINATOR: 'Coordenador',
  MANAGER: 'Secretário',
  ADMIN: 'Prefeito',
  SUPER_ADMIN: 'Super Admin',
  GUEST: 'Visitante'
}

const statusLabels = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em Progresso',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  PENDENCIA: 'Pendência'
}

const statusColors = {
  VINCULADO: 'bg-blue-100 text-blue-800',
  PROGRESSO: 'bg-yellow-100 text-yellow-800',
  ATUALIZACAO: 'bg-orange-100 text-orange-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  PENDENCIA: 'bg-red-100 text-red-800'
}

interface PendingProtocol {
  id: string
  number: string
  title: string
  description?: string
  status: string
  priority: number // ✅ INT (1-5)
  createdAt: string
  updatedAt: string
  dueDate?: string
  concludedAt?: string

  // Relacionamentos completos
  citizen: {
    id: string
    name: string
    cpf?: string
    email?: string
    phone?: string
  }

  service?: {
    id: string
    name: string
    category?: string
    estimatedDays?: number
  }

  department?: {
    id: string
    name: string
    code?: string
  }

  assignedUser?: {
    id: string
    name: string
    email?: string
    role?: string
  }

  history: Array<{
    id: string
    action: string
    comment?: string
    timestamp: string
  }>

  _count?: {
    history: number
    evaluations: number
  }
}

export default function AdminDashboard() {
  const { user, stats, apiRequest, loading } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const { toast } = useToast()
  const [pendingProtocols, setPendingProtocols] = useState<PendingProtocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)
  const [requestingUpdate, setRequestingUpdate] = useState<string | null>(null)

  // Carregar protocolos pendentes (apenas para ADMIN)
  // Busca todos os protocolos não concluídos, ordenados por prioridade
  const loadPendingProtocols = async () => {
    if (user?.role !== 'ADMIN') return

    try {
      setLoadingProtocols(true)

      // Buscar protocolos do backend - API retorna { success: true, data: { protocols: [], pagination: {} } }
      const response = await apiRequest('/admin/protocols?limit=5&status=VINCULADO,PROGRESSO,ATUALIZACAO,PENDENCIA')

      // Extrair protocolos da resposta
      const protocols = response?.data?.protocols || []

      // Validar que recebemos um array
      if (!Array.isArray(protocols)) {
        console.error('Resposta inválida da API - protocols não é um array:', response)
        setPendingProtocols([])
        return
      }

      // Filtrar apenas protocolos não concluídos (redundante mas garante consistência)
      const nonCompletedProtocols = protocols.filter(
        (p: PendingProtocol) => p.status && p.status !== 'CONCLUIDO'
      )

      console.log(`✅ ${nonCompletedProtocols.length} protocolos pendentes carregados`)
      setPendingProtocols(nonCompletedProtocols)

    } catch (error: any) {
      // Ignorar erro de "Não autenticado" (situação normal durante carregamento inicial)
      if (error?.message !== 'Não autenticado') {
        console.error('❌ Erro ao carregar protocolos pendentes:', error)
        // Em caso de erro, limpar lista
        setPendingProtocols([])
      }
    } finally {
      setLoadingProtocols(false)
    }
  }

  // Cobrar agilidade do setor
  const requestUpdate = async (protocolId: string) => {
    try {
      setRequestingUpdate(protocolId)
      await apiRequest(`/api/admin/protocols/${protocolId}/request-update`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Solicitação de agilidade na resolução deste protocolo.'
        })
      })

      // Recarregar protocolos
      await loadPendingProtocols()

      toast({
        title: "Solicitação enviada!",
        description: "A cobrança de agilidade foi enviada com sucesso aos responsáveis.",
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao solicitar atualização:', error)
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível enviar a cobrança. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setRequestingUpdate(null)
    }
  }

  // Carregar protocolos pendentes ao montar
  useEffect(() => {
    // ✅ Só executar quando autenticação estiver COMPLETA (loading: false) E tiver user/stats
    if (!loading && user?.role === 'ADMIN' && stats) {
      loadPendingProtocols()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.role, stats])

  if (!user || !stats) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalProtocols > 0
    ? Math.round((stats.completedProtocols / stats.totalProtocols) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard {roleLabels[user.role]}
          </h1>
          <p className="text-gray-600 mt-1">
            Visão geral das suas atividades e responsabilidades
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {user.department?.name || 'Administração Geral'}
        </Badge>
      </div>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Protocolos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Protocolos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === 'USER' ? 'Atribuídos a você' :
               user.role === 'ADMIN' ? 'Todo o município' : 'Do seu setor'}
            </p>
          </CardContent>
        </Card>

        {/* Protocolos Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingProtocols}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        {/* Protocolos Concluídos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedProtocols}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conclusão: {completionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Eficiência */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Visualização dos protocolos por status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.protocolsByStatus.map((item) => {
                const count = item._count?._all || 0
                const percentage = stats.totalProtocols > 0
                  ? Math.round((count / stats.totalProtocols) * 100)
                  : 0

                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={statusColors[item.status as keyof typeof statusColors]}
                      >
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count} protocolos
                      </span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {hasPermission('protocols:read') && (
                <a
                  href="/admin/protocolos"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Ver Protocolos</span>
                </a>
              )}

              {hasPermission('chamados:create') && (
                <a
                  href="/admin/chamados"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium">Novo Chamado</span>
                </a>
              )}

              {hasPermission('team:read') && (
                <a
                  href="/admin/equipe"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Gerenciar Equipe</span>
                </a>
              )}

              {(hasPermission('reports:department') || hasPermission('reports:full')) && (
                <a
                  href="/admin/relatorios"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium">Relatórios</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocolos Pendentes - Apenas para Prefeito (ADMIN) */}
      {user.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  Protocolos que Requerem Atenção
                </CardTitle>
                <CardDescription>
                  Protocolos em andamento que ainda não foram concluídos (ordenados por data de criação)
                </CardDescription>
              </div>
              {hasPermission('protocols:read') && (
                <a href="/admin/protocolos">
                  <Button variant="outline" size="sm">
                    Ver Todos
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingProtocols ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : pendingProtocols.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum protocolo pendente no momento!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingProtocols.map((protocol) => {
                  const daysOld = protocol.createdAt
                    ? Math.floor((Date.now() - new Date(protocol.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0

                  const lastRequestUpdate = protocol.history && protocol.history.length > 0 ? protocol.history[0] : null
                  const requestUpdateDaysAgo = lastRequestUpdate
                    ? Math.floor((Date.now() - new Date(lastRequestUpdate.timestamp).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  const requestUpdateHoursAgo = lastRequestUpdate
                    ? Math.floor((Date.now() - new Date(lastRequestUpdate.timestamp).getTime()) / (1000 * 60 * 60))
                    : 0

                  return (
                    <div
                      key={protocol.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        lastRequestUpdate ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <a
                            href={`/admin/protocolos?search=${protocol.number}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            #{protocol.number}
                          </a>
                          {/* Badge de Prioridade */}
                          <Badge
                            variant="secondary"
                            className={`border ${getPriorityBadgeClass(protocol.priority)}`}
                          >
                            {getPriorityIcon(protocol.priority)} {getPriorityLabel(protocol.priority)}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={statusColors[protocol.status as keyof typeof statusColors]}
                          >
                            {statusLabels[protocol.status as keyof typeof statusLabels]}
                          </Badge>
                          {lastRequestUpdate && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                              ⚠️ Agilidade Cobrada
                            </Badge>
                          )}
                          {daysOld > 0 && (
                            <span className="text-xs text-gray-500">
                              há {daysOld} {daysOld === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{protocol.title}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                        {lastRequestUpdate && (
                          <div className="mt-2 text-xs text-amber-700 font-medium">
                            Última cobrança: há {requestUpdateDaysAgo > 0
                              ? `${requestUpdateDaysAgo} ${requestUpdateDaysAgo === 1 ? 'dia' : 'dias'}`
                              : requestUpdateHoursAgo > 0
                              ? `${requestUpdateHoursAgo} ${requestUpdateHoursAgo === 1 ? 'hora' : 'horas'}`
                              : 'menos de 1 hora'
                            }
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestUpdate(protocol.id)}
                        disabled={requestingUpdate === protocol.id}
                        className="ml-4 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        {requestingUpdate === protocol.id ? 'Enviando...' : 'Cobrar Agilidade'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protocolos Recentes (se houver) */}
      {user.assignedProtocols && user.assignedProtocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seus Protocolos Recentes</CardTitle>
            <CardDescription>
              Últimos protocolos atribuídos a você
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.assignedProtocols.slice(0, 5).map((protocol) => (
                <div key={protocol.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">#{protocol.number}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusColors[protocol.status as keyof typeof statusColors]}
                  >
                    {statusLabels[protocol.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}