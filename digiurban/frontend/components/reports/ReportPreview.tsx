'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Download,
  Share2,
  Printer,
  RefreshCcw,
  Calendar,
  Clock,
  User,
  Filter,
  BarChart3,
  Table,
  TrendingUp
} from 'lucide-react'
import { AnalyticsLineChart, AnalyticsBarChart, AnalyticsPieChart } from '../analytics/Charts'
import { KPICard } from '../analytics/KPICard'
// LEGADO: import { useReports } from '@/hooks/api/analytics'

interface ReportPreviewData {
  id?: string
  name: string
  description: string
  type: 'operational' | 'managerial' | 'executive'
  category: string
  executedAt: string
  executedBy: string
  data: any[]
  summary: {
    totalRecords: number
    dateRange: {
      start: string
      end: string
    }
    filters: Array<{
      field: string
      operator: string
      value: string
    }>
  }
  visualizations: Array<{
    id: string
    type: 'table' | 'chart' | 'metric'
    title: string
    config: any
    data: any[]
  }>
}

interface ReportPreviewProps {
  reportData?: ReportPreviewData
  reportId?: string
  loading?: boolean
  onDownload?: (format: 'pdf' | 'excel' | 'csv') => void
  onShare?: () => void
  onPrint?: () => void
  onRefresh?: () => void
  className?: string
}

export function ReportPreview({
  reportData,
  reportId,
  loading = false,
  onDownload,
  onShare,
  onPrint,
  onRefresh,
  className
}: ReportPreviewProps) {
  const executeReport = async (id: string) => { /* TODO: Implementar via API */ return null; };
  const downloadReport = async (id: string, format: string) => { /* TODO: Implementar via API */ };
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(reportData || null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (reportId && !reportData) {
      loadReportData()
    }
  }, [reportId])

  const loadReportData = async () => {
    if (!reportId) return

    try {
      setIsGenerating(true)
      const result = await executeReport(reportId)
      setPreviewData(result)
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (format: 'pdf' | 'excel' | 'csv') => {
    if (onDownload) {
      onDownload(format)
    } else if (reportId) {
      try {
        await downloadReport(reportId, format)
      } catch (error) {
        console.error('Failed to download report:', error)
      }
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      loadReportData()
    }
  }

  if (loading || isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RefreshCcw className="h-5 w-5 animate-spin" />
            <span>Gerando relatório...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!previewData) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum relatório carregado
          </h3>
          <p className="text-gray-500 mb-4">
            Execute um relatório para visualizar os dados aqui.
          </p>
          {reportId && (
            <Button onClick={loadReportData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Carregar Relatório
            </Button>
          )}
        </CardContent>
      </Card>
    )
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

  const renderVisualization = (viz: any) => {
    switch (viz.type) {
      case 'table':
        return (
          <Card key={viz.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Table className="h-5 w-5" />
                <span>{viz.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {viz.config.columns?.map((col: string, index: number) => (
                        <th key={index} className="text-left p-2 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viz.data.slice(0, 10).map((row: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {viz.config.columns?.map((col: string, colIndex: number) => (
                          <td key={colIndex} className="p-2">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {viz.data.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando 10 de {viz.data.length} registros
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'chart':
        const chartProps = {
          title: viz.title,
          data: viz.data,
          height: 300
        }

        if (viz.config.chartType === 'bar') {
          return (
            <AnalyticsBarChart
              key={viz.id}
              {...chartProps}
              xKey={viz.config.xField || 'x'}
              yKey={viz.config.yField || 'y'}
              colors={viz.config.colors || ['#3B82F6']}
            />
          )
        } else if (viz.config.chartType === 'line') {
          return (
            <AnalyticsLineChart
              key={viz.id}
              {...chartProps}
              xKey={viz.config.xField || 'x'}
              yKey={viz.config.yField || 'y'}
              colors={viz.config.colors || ['#3B82F6']}
            />
          )
        } else if (viz.config.chartType === 'pie') {
          return (
            <AnalyticsPieChart
              key={viz.id}
              {...chartProps}
              dataKey={viz.config.valueField || 'value'}
              nameKey={viz.config.nameField || 'name'}
              colors={viz.config.colors}
            />
          )
        }
        break

      case 'metric':
        const metricValue = viz.data[0]?.[viz.config.field] || 0
        return (
          <KPICard
            key={viz.id}
            title={viz.title}
            value={metricValue}
            unit={viz.config.unit}
            description={viz.config.description}
            status="normal"
            size="md"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">{previewData.name}</h1>
                <Badge className={getTypeColor(previewData.type)}>
                  {previewData.type === 'operational' ? 'Operacional' :
                   previewData.type === 'managerial' ? 'Gerencial' : 'Executivo'}
                </Badge>
                <Badge variant="outline">{previewData.category}</Badge>
              </div>
              {previewData.description && (
                <p className="text-muted-foreground">{previewData.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
              {onPrint && (
                <Button variant="outline" onClick={onPrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              )}
              {onShare && (
                <Button variant="outline" onClick={onShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => handleDownload('pdf')}
                  className="rounded-r-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('excel')}
                  className="rounded-none border-l-0"
                >
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('csv')}
                  className="rounded-l-none border-l-0"
                >
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo da Execução</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{previewData.summary.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total de registros</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {new Date(previewData.summary.dateRange.start).toLocaleDateString('pt-BR')} -
                </p>
                <p className="font-semibold text-sm">
                  {new Date(previewData.summary.dateRange.end).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">Período analisado</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {new Date(previewData.executedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">Executado em</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{previewData.executedBy}</p>
                <p className="text-sm text-muted-foreground">Executado por</p>
              </div>
            </div>
          </div>

          {previewData.summary.filters && previewData.summary.filters.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtros Aplicados</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {previewData.summary.filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {filter.field} {filter.operator} {filter.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visualizations */}
      <div className="space-y-6">
        {previewData.visualizations.map(viz => renderVisualization(viz))}
      </div>

      {/* Raw Data Table (if no visualizations) */}
      {previewData.visualizations.length === 0 && previewData.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData.data[0]).map((key, index) => (
                        <th key={index} className="text-left p-2 font-medium sticky top-0 bg-white">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.data.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {Object.values(row).map((value: any, colIndex) => (
                          <td key={colIndex} className="p-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {previewData.data.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-gray-500">
              O relatório foi executado mas não retornou dados com base nos filtros aplicados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}