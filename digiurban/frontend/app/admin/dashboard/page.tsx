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
      const response = await apiRequest('/protocols?limit=5')

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            Dashboard {roleLabels[user.role]}
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
            Visão geral das suas atividades e responsabilidades
          </p>
        </div>
        <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap shrink-0">
          {user.department?.name || 'Administração Geral'}
        </Badge>
      </div>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total de Protocolos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Protocolos</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalProtocols}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.role === 'USER' ? 'Atribuídos a você' :
               user.role === 'ADMIN' ? 'Todo o município' : 'Do seu setor'}
            </p>
          </CardContent>
        </Card>

        {/* Protocolos Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingProtocols}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        {/* Protocolos Concluídos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.completedProtocols}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de conclusão: {completionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Eficiência */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Distribuição por Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Visualização dos protocolos por status atual
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              {stats.protocolsByStatus.map((item) => {
                const count = item._count?._all || 0
                const percentage = stats.totalProtocols > 0
                  ? Math.round((count / stats.totalProtocols) * 100)
                  : 0

                return (
                  <div key={item.status} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className={`${statusColors[item.status as keyof typeof statusColors]} text-xs whitespace-nowrap`}
                      >
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {count} {count === 1 ? 'protocolo' : 'protocolos'}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium shrink-0">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {hasPermission('protocols:read') && (
                <a
                  href="/admin/protocolos"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Ver Protocolos</span>
                </a>
              )}

              {hasPermission('chamados:create') && (
                <a
                  href="/admin/chamados"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Novo Chamado</span>
                </a>
              )}

              {hasPermission('team:read') && (
                <a
                  href="/admin/equipe"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Gerenciar Equipe</span>
                </a>
              )}

              {(hasPermission('reports:department') || hasPermission('reports:full')) && (
                <a
                  href="/admin/relatorios"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Relatórios</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocolos Pendentes - Apenas para Prefeito (ADMIN) */}
      {user.role === 'ADMIN' && (
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center text-base sm:text-lg flex-wrap gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
                  <span>Protocolos que Requerem Atenção</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1.5">
                  Protocolos em andamento que ainda não foram concluídos (ordenados por data de criação)
                </CardDescription>
              </div>
              {hasPermission('protocols:read') && (
                <a href="/admin/protocolos" className="shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <span className="hidden sm:inline">Ver Todos</span>
                    <span className="sm:hidden">Ver Todos os Protocolos</span>
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loadingProtocols ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : pendingProtocols.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm sm:text-base">Nenhum protocolo pendente no momento!</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
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
                      className={`flex flex-col gap-3 p-3 sm:p-4 border rounded-lg transition-colors ${
                        lastRequestUpdate ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                          <a
                            href={`/admin/protocolos?search=${protocol.number}`}
                            className="text-sm sm:text-base font-medium text-blue-600 hover:underline shrink-0"
                          >
                            #{protocol.number}
                          </a>
                          {/* Badge de Prioridade */}
                          <Badge
                            variant="secondary"
                            className={`border text-xs shrink-0 ${getPriorityBadgeClass(protocol.priority)}`}
                          >
                            {getPriorityIcon(protocol.priority)} {getPriorityLabel(protocol.priority)}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs shrink-0 ${statusColors[protocol.status as keyof typeof statusColors]}`}
                          >
                            {statusLabels[protocol.status as keyof typeof statusLabels]}
                          </Badge>
                          {lastRequestUpdate && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 text-xs shrink-0">
                              ⚠️ Agilidade Cobrada
                            </Badge>
                          )}
                          {daysOld > 0 && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              há {daysOld} {daysOld === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 line-clamp-2 break-words">{protocol.title}</h4>
                        <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-500">
                          <span className="truncate">
                            <strong className="text-gray-700">Cidadão:</strong> {protocol.citizen?.name || 'N/A'}
                          </span>
                          <span className="truncate">
                            <strong className="text-gray-700">Setor:</strong> {protocol.department?.name || 'Não definido'}
                          </span>
                          <span className="truncate">
                            <strong className="text-gray-700">Responsável:</strong> {protocol.assignedUser?.name || 'Não atribuído'}
                          </span>
                        </div>
                        {lastRequestUpdate && (
                          <div className="mt-2 text-xs sm:text-sm text-amber-700 font-medium">
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
                        className="border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100 w-full shrink-0"
                      >
                        <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                        <span className="text-xs sm:text-sm">{requestingUpdate === protocol.id ? 'Enviando...' : 'Cobrar Agilidade'}</span>
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