'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Play,
  Edit,
  Copy,
  Trash2,
  Download,
  Calendar,
  MoreHorizontal,
  Clock,
  User,
  TrendingUp
} from 'lucide-react'
// LEGADO: import { useReports } from '@/hooks/api/analytics'

interface Report {
  id: string
  name: string
  description?: string
  type: 'operational' | 'managerial' | 'executive'
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  lastExecutedAt?: string
  executionCount: number
  scheduleFrequency?: 'manual' | 'daily' | 'weekly' | 'monthly'
  config: any
}

interface ReportListProps {
  onCreateNew?: () => void
  onEditReport?: (report: Report) => void
  onExecuteReport?: (reportId: string) => void
  onPreviewReport?: (reportId: string) => void
  showFilters?: boolean
  showTabs?: boolean
  className?: string
}

export function ReportList({
  onCreateNew,
  onEditReport,
  onExecuteReport,
  onPreviewReport,
  showFilters = true,
  showTabs = true,
  className
}: ReportListProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchReports = async () => { /* TODO: Implementar via API */ };
  const deleteReport = async (id: string) => { /* TODO: Implementar via API */ };
  const cloneReport = async (id: string) => { /* TODO: Implementar via API */ };
  const executeReport = async (id: string) => { /* TODO: Implementar via API */ };
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updatedAt')

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' ||
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && report.isActive) ||
      (statusFilter === 'inactive' && !report.isActive)

    return matchesSearch && matchesType && matchesCategory && matchesStatus
  })

  const sortedReports = filteredReports.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'executionCount':
        return b.executionCount - a.executionCount
      default:
        return 0
    }
  })

  const reportsByType = {
    all: sortedReports,
    operational: sortedReports.filter(r => r.type === 'operational'),
    managerial: sortedReports.filter(r => r.type === 'managerial'),
    executive: sortedReports.filter(r => r.type === 'executive')
  }

  const handleExecute = async (reportId: string) => {
    try {
      if (onExecuteReport) {
        onExecuteReport(reportId)
      } else {
        await executeReport(reportId)
      }
    } catch (error) {
      console.error('Failed to execute report:', error)
    }
  }

  const handleClone = async (report: Report) => {
    try {
      await cloneReport(report.id)
      fetchReports()
    } catch (error) {
      console.error('Failed to clone report:', error)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      try {
        await deleteReport(reportId)
        fetchReports()
      } catch (error) {
        console.error('Failed to delete report:', error)
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'operational':
        return 'bg-blue-100 text-blue-800'
      case 'managerial':
        return 'bg-green-100 text-green-800'
      case 'executive':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'operational':
        return 'Operacional'
      case 'managerial':
        return 'Gerencial'
      case 'executive':
        return 'Executivo'
      default:
        return type
    }
  }

  const getScheduleLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'Diário'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensal'
      default:
        return 'Manual'
    }
  }

  const ReportCard = ({ report }: { report: Report }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg leading-tight">{report.name}</h3>
              {!report.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inativo
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={getTypeColor(report.type)}>
                {getTypeLabel(report.type)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {report.category}
              </Badge>
              {report.scheduleFrequency && report.scheduleFrequency !== 'manual' && (
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {getScheduleLabel(report.scheduleFrequency)}
                </Badge>
              )}
            </div>

            {report.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {report.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExecute(report.id)}>
                <Play className="h-4 w-4 mr-2" />
                Executar
              </DropdownMenuItem>
              {onPreviewReport && (
                <DropdownMenuItem onClick={() => onPreviewReport(report.id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onEditReport && (
                <DropdownMenuItem onClick={() => onEditReport(report)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleClone(report)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(report.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{report.createdBy}</span>
            </div>

            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(report.updatedAt).toLocaleDateString('pt-BR')}</span>
            </div>

            {report.executionCount > 0 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{report.executionCount} execuções</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExecute(report.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Executar
            </Button>
          </div>
        </div>

        {report.lastExecutedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Última execução: {new Date(report.lastExecutedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Gerencie e execute seus relatórios personalizados
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="operational">Operacional</SelectItem>
                  <SelectItem value="managerial">Gerencial</SelectItem>
                  <SelectItem value="executive">Executivo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="protocols">Protocolos</SelectItem>
                  <SelectItem value="citizens">Cidadãos</SelectItem>
                  <SelectItem value="departments">Departamentos</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="satisfaction">Satisfação</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Última atualização</SelectItem>
                  <SelectItem value="createdAt">Data de criação</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="executionCount">Execuções</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      {showTabs ? (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <span>Todos</span>
              <Badge variant="secondary">{reportsByType.all.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center space-x-2">
              <span>Operacional</span>
              <Badge variant="secondary">{reportsByType.operational.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="managerial" className="flex items-center space-x-2">
              <span>Gerencial</span>
              <Badge variant="secondary">{reportsByType.managerial.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="executive" className="flex items-center space-x-2">
              <span>Executivo</span>
              <Badge variant="secondary">{reportsByType.executive.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {Object.entries(reportsByType).map(([type, typeReports]) => (
            <TabsContent key={type} value={type}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
                  ))
                ) : typeReports.length > 0 ? (
                  typeReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum relatório encontrado
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                        ? 'Tente ajustar os filtros ou criar um novo relatório'
                        : type === 'all'
                        ? 'Comece criando seu primeiro relatório'
                        : `Nenhum relatório ${getTypeLabel(type).toLowerCase()} encontrado`
                      }
                    </p>
                    {onCreateNew && (
                      <Button onClick={onCreateNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Relatório
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
            ))
          ) : sortedReports.length > 0 ? (
            sortedReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum relatório encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros ou criar um novo relatório'
                  : 'Comece criando seu primeiro relatório'
                }
              </p>
              {onCreateNew && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Relatório
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}