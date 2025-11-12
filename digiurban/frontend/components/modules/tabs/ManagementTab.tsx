'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Download, Eye, Edit, FileText, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ModuleConfig } from '../BaseModuleView'

interface ManagementTabProps {
  config: ModuleConfig
}

interface FieldConfig {
  key: string
  label: string
  type: string
  searchable?: boolean
  filterable?: boolean
  displayInTable?: boolean
  displayInCard?: boolean
}

interface FilterConfig {
  key: string
  label: string
  type: string
  options?: Array<{ value: string; label: string }>
}

interface QuickFilterConfig {
  label: string
  icon?: string
  filter: Record<string, any>
}

interface ManagementConfig {
  moduleType: string
  title: string
  description: string
  fields: FieldConfig[]
  filters: FilterConfig[]
  quickFilters: QuickFilterConfig[]
  defaultTableColumns: string[]
  primaryField: string
  secondaryField?: string
}

interface DataRecord {
  id: string
  protocolNumber: string
  status: string
  createdAt: string
  updatedAt: string
  citizen?: {
    name: string
    cpf: string
    email: string
  }
  [key: string]: any
}

export function ManagementTab({ config }: ManagementTabProps) {
  const [moduleConfig, setModuleConfig] = useState<ManagementConfig | null>(null)
  const [data, setData] = useState<DataRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})

  const [department, module] = config.apiEndpoint.split('/')
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  // Buscar configuração do módulo
  useEffect(() => {
    fetchConfig()
  }, [])

  // Buscar dados quando mudar página, busca ou filtros
  useEffect(() => {
    if (moduleConfig) {
      fetchData()
    }
  }, [moduleConfig, page, search, filters])

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/secretarias/${department}/${module}/management`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) throw new Error('Erro ao carregar configuração')

      const result = await response.json()
      setModuleConfig(result.config)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) params.append('search', search)
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters))
      }

      const response = await fetch(
        `${baseUrl}/admin/secretarias/${department}/${module}/management/data?${params}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) throw new Error('Erro ao carregar dados')

      const result = await response.json()
      setData(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = async (record: DataRecord) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/secretarias/${department}/${module}/management/data/${record.id}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) throw new Error('Erro ao carregar detalhes')

      const result = await response.json()
      setSelectedRecord(result.data)
      setShowDetailDialog(true)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    }
  }

  const openEdit = (record: DataRecord) => {
    const customData: Record<string, any> = {}

    // Extrair apenas os campos do customData (excluir campos do protocolo)
    moduleConfig?.fields.forEach(field => {
      customData[field.key] = record[field.key]
    })

    setEditData(customData)
    setSelectedRecord(record)
    setShowEditDialog(true)
  }

  const saveEdit = async () => {
    if (!selectedRecord) return

    try {
      const response = await fetch(
        `${baseUrl}/admin/secretarias/${department}/${module}/management/data/${selectedRecord.id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customData: editData,
            changeReason: 'Editado via gerenciamento'
          })
        }
      )

      if (!response.ok) throw new Error('Erro ao salvar')

      alert('Dados atualizados com sucesso!')
      setShowEditDialog(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar dados')
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/secretarias/${department}/${module}/management/export`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'csv',
            filters,
            columns: moduleConfig?.defaultTableColumns || []
          })
        }
      )

      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${module}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar dados')
    }
  }

  const applyQuickFilter = (quickFilter: QuickFilterConfig) => {
    setFilters(quickFilter.filter)
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '-'

    if (type === 'boolean') return value ? 'Sim' : 'Não'
    if (type === 'array') return Array.isArray(value) ? value.join(', ') : '-'
    if (type === 'date') {
      try {
        return new Date(value).toLocaleDateString('pt-BR')
      } catch {
        return value
      }
    }

    return String(value)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'APROVADO': 'bg-green-500',
      'VINCULADO': 'bg-blue-500',
      'ATUALIZACAO': 'bg-yellow-500',
      'EM_ANALISE': 'bg-orange-500',
      'CANCELADO': 'bg-red-500',
      'REJEITADO': 'bg-red-700',
    }
    return colors[status] || 'bg-gray-500'
  }

  if (loading && !moduleConfig) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!moduleConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento não disponível</CardTitle>
          <CardDescription>
            Este módulo não possui configuração de gerenciamento.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{moduleConfig.title}</CardTitle>
          <CardDescription>{moduleConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Busca e Ações */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={exportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button onClick={clearFilters} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Filtros Rápidos */}
          {moduleConfig.quickFilters && moduleConfig.quickFilters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600 flex items-center mr-2">
                Filtros rápidos:
              </span>
              {moduleConfig.quickFilters.map((qf, idx) => (
                <Button
                  key={idx}
                  onClick={() => applyQuickFilter(qf)}
                  variant="outline"
                  size="sm"
                  className={Object.keys(filters).length > 0 && JSON.stringify(filters) === JSON.stringify(qf.filter) ? 'bg-blue-50 border-blue-300' : ''}
                >
                  {qf.label}
                </Button>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          <div className="flex gap-4 text-sm text-gray-600">
            <span><strong>{total}</strong> registros encontrados</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Protocolo</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      {moduleConfig.defaultTableColumns.map(col => {
                        const field = moduleConfig.fields.find(f => f.key === col)
                        return field ? (
                          <TableHead key={col}>{field.label}</TableHead>
                        ) : null
                      })}
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead className="w-[150px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">
                          {record.protocolNumber}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        {moduleConfig.defaultTableColumns.map(col => {
                          const field = moduleConfig.fields.find(f => f.key === col)
                          return field ? (
                            <TableCell key={col}>
                              {formatValue(record[col], field.type)}
                            </TableCell>
                          ) : null
                        })}
                        <TableCell>
                          {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => viewDetails(record)}
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => openEdit(record)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} registros
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center px-4 text-sm">
                    Página {page} de {totalPages}
                  </div>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Visualizar Detalhes */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              Protocolo: {selectedRecord?.protocolNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* Informações do Cidadão */}
              {selectedRecord.citizen && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cidadão</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome</label>
                      <p className="text-sm">{selectedRecord.citizen.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">CPF</label>
                      <p className="text-sm">{selectedRecord.citizen.cpf}</p>
                    </div>
                    {selectedRecord.citizen.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <p className="text-sm">{selectedRecord.citizen.email}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Dados do Formulário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados Cadastrados</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {moduleConfig.fields
                    .filter(f => f.displayInCard && selectedRecord.customData?.[f.key] !== undefined)
                    .map(field => (
                      <div key={field.key}>
                        <label className="text-sm font-medium text-gray-600">{field.label}</label>
                        <p className="text-sm">{formatValue(selectedRecord.customData[field.key], field.type)}</p>
                      </div>
                    ))
                  }
                </CardContent>
              </Card>

              {/* Histórico de Interações */}
              {selectedRecord.interactions && selectedRecord.interactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRecord.interactions.map((interaction: any, idx: number) => (
                        <div key={idx} className="text-sm border-l-2 border-gray-300 pl-3 py-1">
                          <p className="font-medium">{interaction.type}</p>
                          <p className="text-gray-600">{interaction.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(interaction.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Protocolo: {selectedRecord?.protocolNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {moduleConfig.fields
              .filter(f => f.displayInCard)
              .map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={editData[field.key] || ''}
                      onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="w-full mt-1 p-2 border rounded"
                      rows={3}
                    />
                  ) : field.type === 'boolean' ? (
                    <select
                      value={editData[field.key] ? 'true' : 'false'}
                      onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value === 'true' })}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={editData[field.key] || ''}
                      onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="mt-1"
                    />
                  )}
                </div>
              ))
            }
            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={() => setShowEditDialog(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={saveEdit}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
