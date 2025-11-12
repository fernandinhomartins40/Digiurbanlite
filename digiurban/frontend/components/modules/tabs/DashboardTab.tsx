'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useToast } from '@/components/ui/use-toast'
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertTriangle, Download, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { ModuleConfig } from '../BaseModuleView'

interface DashboardTabProps {
  config: ModuleConfig
}

interface KPI {
  label: string
  value: number | string
  format: 'number' | 'currency' | 'percentage' | 'time'
  trend?: number
  icon?: string
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface Chart {
  type: 'pie' | 'bar' | 'line'
  title: string
  data: ChartData[]
}

interface DashboardData {
  kpis: KPI[]
  distribution?: ChartData[]
  charts?: Chart[]
  trends?: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function DashboardTab({ config }: DashboardTabProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [period, setPeriod] = useState('month')
  const [department, setDepartment] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [period, department])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        ...(department !== 'all' && { department }),
      })

      const [dept, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${baseUrl}/admin/secretarias/${dept}/${module}/dashboard?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number | string, format: string) => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
      case 'percentage':
        return `${value}%`
      case 'time':
        return `${value} dias`
      default:
        return value.toLocaleString('pt-BR')
    }
  }

  const getIcon = (iconName?: string) => {
    const icons: Record<string, any> = {
      users: Users,
      clock: Clock,
      check: CheckCircle,
      alert: AlertTriangle,
    }
    const Icon = iconName ? icons[iconName] : Users
    return Icon ? <Icon className="h-4 w-4" /> : null
  }

  const handleExportPDF = async () => {
    setExportLoading(true)
    try {
      const [dept, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const params = new URLSearchParams({
        period,
        format: 'pdf',
        ...(department !== 'all' && { department }),
      })

      const response = await fetch(`${baseUrl}/admin/secretarias/${dept}/${module}/dashboard/export?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao exportar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard_${module}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso',
        description: 'Dashboard exportado em PDF com sucesso',
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dashboard em PDF',
        variant: 'destructive',
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setExportLoading(true)
    try {
      const [dept, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const params = new URLSearchParams({
        period,
        format: 'xlsx',
        ...(department !== 'all' && { department }),
      })

      const response = await fetch(`${baseUrl}/admin/secretarias/${dept}/${module}/dashboard/export?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao exportar Excel')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard_${module}_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso',
        description: 'Dashboard exportado em Excel com sucesso',
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dashboard em Excel',
        variant: 'destructive',
      })
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Dashboard e Indicadores</CardTitle>
              <CardDescription>Métricas e análises de desempenho</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dept1">Departamento 1</SelectItem>
                  <SelectItem value="dept2">Departamento 2</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportExcel} disabled={exportLoading}>
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Exportar Excel
              </Button>
              <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading}>
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.kpis?.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {getIcon(kpi.icon)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(kpi.value, kpi.format)}
              </div>
              {kpi.trend !== undefined && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {kpi.trend > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{kpi.trend}%</span>
                    </>
                  ) : kpi.trend < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{kpi.trend}%</span>
                    </>
                  ) : (
                    <span>sem alteração</span>
                  )}
                  {' '}desde o período anterior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Distribuição por Status */}
      {data?.distribution && data.distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Solicitações por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.category}: ${entry.value} (${entry.percentage}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráficos Específicos do Módulo */}
      {data?.charts && data.charts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.charts.map((chart, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : chart.type === 'bar' ? (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  ) : (
                    <LineChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
