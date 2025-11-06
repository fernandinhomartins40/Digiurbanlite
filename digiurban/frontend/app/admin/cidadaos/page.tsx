'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  RefreshCw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Citizen {
  id: string
  name: string
  cpf: string
  email: string
  phone?: string
  address?: any
  isActive: boolean
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  registrationSource?: 'WEB_PORTAL' | 'MOBILE_APP' | 'ADMIN_PANEL' | 'IMPORT'
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
}

export default function CidadaosPage() {
  const router = useRouter()
  const { user, apiRequest } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // Dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [pendingTransfers, setPendingTransfers] = useState(0)

  const canVerify = hasPermission('citizens:verify')

  useEffect(() => {
    if (user) {
      fetchCitizens()
      fetchTransferStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchCitizens = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Buscar todos os cidadãos usando o endpoint correto
      const response = await apiRequest('/admin/citizens')

      console.log('[CIDADÃOS] Response recebida:', response)
      console.log('[CIDADÃOS] success:', response?.success)
      console.log('[CIDADÃOS] citizens:', response?.citizens)
      console.log('[CIDADÃOS] total citizens:', response?.citizens?.length)

      // O backend retorna { success: true, citizens: [...], pagination: {...} }
      if (response.success && response.citizens) {
        console.log('[CIDADÃOS] Setando cidadãos:', response.citizens.length)
        setCitizens(response.citizens)
      } else {
        console.warn('[CIDADÃOS] Response inválida ou sem cidadãos')
        setCitizens([])
      }
    } catch (err) {
      console.error('[CIDADÃOS] Error fetching citizens:', err)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os cidadãos',
      })
      setCitizens([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTransferStats = async () => {
    try {
      const response = await apiRequest('/admin/transfer-requests?status=PENDING')
      if (response.success && response.stats) {
        setPendingTransfers(response.stats.pending || 0)
      }
    } catch (err) {
      console.error('[TRANSFERÊNCIAS] Erro ao buscar estatísticas:', err)
    }
  }

  const handleApprove = async () => {
    if (!selectedCitizen) return

    setProcessing(true)

    try {
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ notes: approvalNotes }),
      })

      if (response.success) {
        toast({
          title: 'Cadastro Aprovado! ✅',
          description: `${selectedCitizen.name} foi verificado e promovido para Prata.`,
        })

        setShowApproveDialog(false)
        setSelectedCitizen(null)
        setApprovalNotes('')
        await fetchCitizens()
      } else {
        throw new Error(response.error || 'Erro ao aprovar cadastro')
      }
    } catch (error: any) {
      console.error('Erro ao aprovar:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description: error.message || 'Não foi possível aprovar o cadastro',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCitizen || !rejectionReason.trim()) return

    setProcessing(true)

    try {
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (response.success) {
        toast({
          title: 'Cadastro Rejeitado',
          description: `${selectedCitizen.name} foi notificado sobre a rejeição.`,
        })

        setShowRejectDialog(false)
        setSelectedCitizen(null)
        setRejectionReason('')
        await fetchCitizens()
      } else {
        throw new Error(response.error || 'Erro ao rejeitar cadastro')
      }
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao rejeitar',
        description: error.message || 'Não foi possível rejeitar o cadastro',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleViewCitizen = (citizenId: string) => {
    router.push(`/admin/cidadaos/${citizenId}`)
  }

  const handleViewProtocols = (citizenId: string) => {
    router.push(`/admin/protocolos?citizenId=${citizenId}`)
  }

  const formatAddress = (address: any): string => {
    if (!address) return 'Não informado'
    if (typeof address === 'string') return address

    const parts = []
    if (address.street) parts.push(address.street)
    if (address.number) parts.push(address.number)
    if (address.neighborhood) parts.push(address.neighborhood)

    return parts.length > 0 ? parts.join(', ') : 'Não informado'
  }

  const getSourceLabel = (source?: string) => {
    const sources = {
      WEB_PORTAL: 'Portal Web',
      MOBILE_APP: 'App Mobile',
      ADMIN_PANEL: 'Painel Admin',
      IMPORT: 'Importação',
    }
    return source ? sources[source as keyof typeof sources] || source : '-'
  }

  const getSourceIcon = (source?: string) => {
    if (source === 'MOBILE_APP') return <Smartphone className="h-3 w-3" />
    return <Users className="h-3 w-3" />
  }

  // Filtrar cidadãos
  const filteredCitizens = citizens.filter(citizen => {
    const matchesSearch =
      citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citizen.cpf.includes(searchTerm) ||
      citizen.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (citizen.phone && citizen.phone.includes(searchTerm))

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'pending') return matchesSearch && citizen.verificationStatus === 'PENDING'
    if (activeTab === 'verified') return matchesSearch && citizen.verificationStatus === 'VERIFIED'
    if (activeTab === 'inactive') return matchesSearch && !citizen.isActive

    return matchesSearch
  })

  // Estatísticas
  const stats = {
    total: citizens.length,
    pending: citizens.filter(c => c.verificationStatus === 'PENDING').length,
    verified: citizens.filter(c => c.verificationStatus === 'VERIFIED').length,
    selfRegistered: citizens.filter(c => c.registrationSource === 'WEB_PORTAL' || c.registrationSource === 'MOBILE_APP').length,
    inactive: citizens.filter(c => !c.isActive).length,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            Gerenciamento de Cidadãos
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema Unificado de Cadastro - Bronze, Prata e Ouro
          </p>
        </div>
        <div className="flex gap-2">
          {stats.pending > 0 && (
            <Button
              variant="outline"
              onClick={() => router.push('/admin/cidadaos/pendentes')}
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {stats.pending} Pendentes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {pendingTransfers > 0 && (
            <Button
              variant="outline"
              onClick={() => router.push('/admin/cidadaos/transferencias')}
              className="border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {pendingTransfers} Transferência{pendingTransfers !== 1 ? 's' : ''}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button onClick={() => router.push('/admin/cidadaos/novo')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Cidadão
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Cadastros no sistema</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pending')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes (Bronze)</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-yellow-700">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('verified')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados (Prata)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
            <p className="text-xs text-blue-700">Cadastros aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Cadastro</CardTitle>
            <Smartphone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.selfRegistered}</div>
            <p className="text-xs text-green-700">Portal/App cidadão</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('inactive')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-red-700">Cadastros desativados</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-200 bg-blue-50/50"
          onClick={() => router.push('/admin/cidadaos/transferencias')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferências</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingTransfers}</div>
            <p className="text-xs text-blue-700">
              {pendingTransfers > 0 ? 'Aguardando análise' : 'Nenhuma pendente'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cidadãos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cadastro de Cidadãos</CardTitle>
              <CardDescription>
                Lista completa com aprovação rápida de cadastros SELF
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes ({stats.pending})
                {stats.pending > 0 && <span className="ml-1 text-yellow-600">●</span>}
              </TabsTrigger>
              <TabsTrigger value="verified">Verificados ({stats.verified})</TabsTrigger>
              <TabsTrigger value="inactive">Inativos ({stats.inactive})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cidadão</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Verificação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCitizens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum cidadão encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCitizens.map((citizen) => (
                  <TableRow key={citizen.id} className={!citizen.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{citizen.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {formatAddress(citizen.address)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{citizen.cpf}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {citizen.email}
                        </div>
                        {citizen.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {citizen.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {getSourceIcon(citizen.registrationSource)}
                        {getSourceLabel(citizen.registrationSource)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {citizen.verificationStatus === 'VERIFIED' ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Prata
                        </Badge>
                      ) : citizen.verificationStatus === 'PENDING' ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Bronze
                        </Badge>
                      ) : citizen.verificationStatus === 'REJECTED' ? (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitado
                        </Badge>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(citizen.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botões de ação rápida para pendentes */}
                        {citizen.verificationStatus === 'PENDING' && canVerify && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCitizen(citizen)
                                setShowApproveDialog(true)
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCitizen(citizen)
                                setShowRejectDialog(true)
                              }}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}

                        {/* Menu de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewCitizen(citizen.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewProtocols(citizen.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Protocolos
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Aprovar Cadastro (Bronze → Prata)
            </DialogTitle>
            <DialogDescription>
              Aprovar o cadastro de {selectedCitizen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Nome:</strong> {selectedCitizen?.name}
              </p>
              <p className="text-sm text-blue-900">
                <strong>CPF:</strong> {selectedCitizen?.cpf}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Email:</strong> {selectedCitizen?.email}
              </p>
            </div>

            <div>
              <Label htmlFor="approval-notes">Observações (opcional)</Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Documentos conferidos no balcão..."
                rows={3}
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ O cidadão será notificado por email/app e terá acesso completo aos serviços
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? 'Aprovando...' : 'Aprovar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeitar Cadastro
            </DialogTitle>
            <DialogDescription>
              Rejeitar o cadastro de {selectedCitizen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900">
                <strong>Nome:</strong> {selectedCitizen?.name}
              </p>
              <p className="text-sm text-gray-900">
                <strong>CPF:</strong> {selectedCitizen?.cpf}
              </p>
            </div>

            <div>
              <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo será enviado ao cidadão
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              ⚠️ O cadastro será desativado e o cidadão será notificado
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? 'Rejeitando...' : 'Rejeitar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
