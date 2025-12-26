'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { mapaDemandasService } from '@/lib/services/gabinete.service'
import { useToast } from '@/hooks/use-toast'
import { Filter, Download, RefreshCw } from 'lucide-react'

// Lazy load do mapa para evitar SSR
const ProtocolMapEnhanced = lazy(() =>
  import('@/components/admin/gabinete/ProtocolMapEnhanced').then(module => ({
    default: module.ProtocolMapEnhanced
  }))
)

export default function MapaDemandasEnhancedPage() {
  const [protocols, setProtocols] = useState<any[]>([])
  const [filteredProtocols, setFilteredProtocols] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')

  // Configurações do mapa
  const [showClustering, setShowClustering] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [protocolsResponse, statsResponse] = await Promise.all([
        mapaDemandasService.getProtocolsWithLocation({}),
        mapaDemandasService.getStats()
      ])

      setProtocols(protocolsResponse.data || [])
      setFilteredProtocols(protocolsResponse.data || [])
      setStats(statsResponse.data)
    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do mapa',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...protocols]

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.service?.category === categoryFilter)
    }

    // Filtro por departamento
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(p => p.department?.name === departmentFilter)
    }

    // Filtro por período
    if (periodFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (periodFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7)
          break
        case '30days':
          filterDate.setDate(now.getDate() - 30)
          break
        case '90days':
          filterDate.setDate(now.getDate() - 90)
          break
      }

      filtered = filtered.filter(p => new Date(p.createdAt) >= filterDate)
    }

    setFilteredProtocols(filtered)
  }, [protocols, statusFilter, categoryFilter, departmentFilter, periodFilter])

  // Extrair categorias e departamentos únicos
  const categories = Array.from(new Set(protocols.map(p => p.service?.category).filter(Boolean)))
  const departments = Array.from(new Set(protocols.map(p => p.department?.name).filter(Boolean)))

  // Exportar dados
  const exportData = () => {
    const csv = [
      ['Número', 'Título', 'Status', 'Serviço', 'Categoria', 'Secretaria', 'Latitude', 'Longitude', 'Endereço', 'Data'],
      ...filteredProtocols.map(p => [
        p.number,
        p.title,
        p.status,
        p.service?.name || '',
        p.service?.category || '',
        p.department?.name || '',
        p.latitude,
        p.longitude,
        p.address || '',
        new Date(p.createdAt).toLocaleDateString('pt-BR')
      ])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa-demandas-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Limpar filtros
  const clearFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setDepartmentFilter('all')
    setPeriodFilter('all')
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Demandas</h1>
          <p className="text-gray-600 mt-1">Visualização geoespacial das solicitações municipais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total com Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWithLocation || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">No Mapa (Filtrados)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredProtocols.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byCategory ? Object.keys(stats.byCategory).length : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Secretarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
              <CardDescription>Filtre os protocolos exibidos no mapa</CardDescription>
            </div>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Limpar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro de Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="VINCULADO">Vinculado</option>
                <option value="PROGRESSO">Em Progresso</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="PENDENCIA">Pendência</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* Filtro de Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                className="w-full p-2 border rounded"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat as string} value={cat as string}>{cat as string}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Departamento */}
            <div className="space-y-2">
              <Label>Secretaria</Label>
              <select
                className="w-full p-2 border rounded"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                {departments.map(dept => (
                  <option key={dept as string} value={dept as string}>{dept as string}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <select
                className="w-full p-2 border rounded"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="all">Todo o período</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          {/* Opções de visualização */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="clustering">Agrupar marcadores (Clustering)</Label>
              <Switch
                id="clustering"
                checked={showClustering}
                onCheckedChange={setShowClustering}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap">Exibir mapa de calor</Label>
              <Switch
                id="heatmap"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa Interativo */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa Interativo</CardTitle>
          <CardDescription>
            Visualize a distribuição de protocolos por região.{' '}
            {filteredProtocols.length !== protocols.length && (
              <span className="text-blue-600 font-medium">
                Exibindo {filteredProtocols.length} de {protocols.length} protocolos
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="bg-gray-100 h-[600px] rounded-lg flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <ProtocolMapEnhanced
              protocols={filteredProtocols}
              showClustering={showClustering}
              showHeatmap={showHeatmap}
              height="600px"
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle>Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Em Progresso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Pendência</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span className="text-sm">Vinculado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-sm">Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
