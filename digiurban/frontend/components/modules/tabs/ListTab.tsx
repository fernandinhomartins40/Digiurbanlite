'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Search, Filter, Eye, Edit, Download, Plus, Loader2 } from 'lucide-react'
import { ModuleConfig } from '../BaseModuleView'

interface ListTabProps {
  config: ModuleConfig
}

interface ListItem {
  id: string
  protocol?: string
  title: string
  description?: string
  status: string
  createdAt: string
  updatedAt?: string
  [key: string]: any
}

interface ListResponse {
  data: ListItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  COMPLETED: 'Concluído',
}

export function ListTab({ config }: ListTabProps) {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, search])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      // Rota unificada: /api/admin/secretarias/:department/:module/list
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/list?${params}`

      console.log('[ListTab] Fetching:', url)
      console.log('[ListTab] Config:', config)

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[ListTab] Response status:', response.status)
      console.log('[ListTab] Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('[ListTab] Result:', result)

      setData(result)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page on search
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1) // Reset to first page on filter
  }

  const handleView = async (item: ListItem) => {
    setSelectedItem(item)
    setShowViewDialog(true)
  }

  const handleEdit = async (item: ListItem) => {
    setSelectedItem(item)
    setEditData({ ...item })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedItem) return

    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/update/${selectedItem.id}`

      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) throw new Error('Erro ao atualizar')

      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso',
      })

      setShowEditDialog(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar registro',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleNew = () => {
    setEditData({})
    setShowNewDialog(true)
  }

  const handleSaveNew = async () => {
    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/create`

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) throw new Error('Erro ao criar')

      toast({
        title: 'Sucesso',
        description: 'Registro criado com sucesso',
      })

      setShowNewDialog(false)
      setEditData({})
      fetchData()
    } catch (error) {
      console.error('Erro ao criar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar registro',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = async () => {
    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      const params = new URLSearchParams({
        format: 'csv',
      })

      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const url = `${baseUrl}/admin/secretarias/${department}/${module}/export?${params}`

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${module}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso',
        description: 'Dados exportados com sucesso',
      })
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dados',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
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
            <CardTitle>Listagem de Solicitações</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleNew} disabled={actionLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{item.title}</h3>
                          {item.protocol && (
                            <Badge variant="outline">{item.protocol}</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                          {item.updatedAt && (
                            <span>Atualizado em: {new Date(item.updatedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-12">
                <p className="text-gray-500">Nenhum registro encontrado</p>
              </div>
            )}
          </div>

          {/* Paginação */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, data.pagination.total)} de {data.pagination.total} registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Visualizar Detalhes */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              {selectedItem?.protocol && `Protocolo: ${selectedItem.protocol}`}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Título</Label>
                  <p className="text-sm mt-1">{selectedItem.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge className={STATUS_COLORS[selectedItem.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[selectedItem.status] || selectedItem.status}
                    </Badge>
                  </div>
                </div>
                {selectedItem.description && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                    <p className="text-sm mt-1">{selectedItem.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Criado em</Label>
                  <p className="text-sm mt-1">{new Date(selectedItem.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                {selectedItem.updatedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Atualizado em</Label>
                    <p className="text-sm mt-1">{new Date(selectedItem.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {/* Campos adicionais */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Informações Adicionais</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedItem).map(([key, value]) => {
                    if (['id', 'title', 'description', 'status', 'createdAt', 'updatedAt', 'protocol'].includes(key)) {
                      return null
                    }
                    return (
                      <div key={key}>
                        <Label className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <p className="text-sm mt-1">{String(value)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
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
              {selectedItem?.protocol && `Protocolo: ${selectedItem.protocol}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editData.status || ''}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo Registro */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo registro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-title">Título *</Label>
              <Input
                id="new-title"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-description">Descrição</Label>
              <Textarea
                id="new-description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-status">Status</Label>
              <Select
                value={editData.status || 'PENDING'}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDialog(false)
                  setEditData({})
                }}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveNew} disabled={actionLoading || !editData.title}>
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Registro'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
