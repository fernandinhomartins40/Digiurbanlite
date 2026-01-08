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
  Smartphone
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  _count?: {
    documents: number
  }
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

  const canVerify = hasPermission('citizens:verify')

  useEffect(() => {
    if (user) {
      fetchCitizens()
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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="break-words">Gerenciamento de Cidadãos</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Sistema Unificado de Cadastro - Bronze, Prata e Ouro
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {stats.pending > 0 && (
            <Button
              variant="outline"
              onClick={() => router.push('/admin/cidadaos/pendentes')}
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 w-full sm:w-auto justify-center"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {stats.pending} Pendentes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button onClick={() => router.push('/admin/cidadaos/novo')} className="w-full sm:w-auto justify-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Cidadão
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Cadastros no sistema</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pending')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes (Bronze)</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-yellow-700">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('verified')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Verificados (Prata)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.verified}</div>
            <p className="text-xs text-blue-700">Cadastros aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Auto-Cadastro</CardTitle>
            <Smartphone className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.selfRegistered}</div>
            <p className="text-xs text-green-700">Portal/App cidadão</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('inactive')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-red-700">Cadastros desativados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cidadãos */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg md:text-xl">Cadastro de Cidadãos</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Lista completa com aprovação rápida de cadastros SELF
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full text-sm"
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm py-2">
                Pendentes ({stats.pending})
                {stats.pending > 0 && <span className="ml-1 text-yellow-600">●</span>}
              </TabsTrigger>
              <TabsTrigger value="verified" className="text-xs sm:text-sm py-2">Verificados ({stats.verified})</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs sm:text-sm py-2">Inativos ({stats.inactive})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Cidadão</TableHead>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">CPF</TableHead>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">Contato</TableHead>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 hidden xl:table-cell">Origem</TableHead>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Verificação</TableHead>
                  <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Ações</TableHead>
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
                    <TableCell className="py-3 px-2 sm:px-4">
                      <div>
                        <div className="font-medium text-sm sm:text-base">{citizen.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{formatAddress(citizen.address)}</span>
                        </div>
                        {/* Mostrar CPF em mobile abaixo do nome */}
                        <div className="text-xs text-muted-foreground mt-1 md:hidden">
                          <span className="font-mono">{citizen.cpf}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3 px-2 sm:px-4">
                      <span className="font-mono text-xs sm:text-sm">{citizen.cpf}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3 px-2 sm:px-4">
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{citizen.email}</span>
                        </div>
                        {citizen.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            {citizen.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-1 text-xs">
                        {getSourceIcon(citizen.registrationSource)}
                        {getSourceLabel(citizen.registrationSource)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-2 sm:px-4">
                      <div className="flex flex-col gap-1">
                        {citizen.verificationStatus === 'VERIFIED' ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Prata</span>
                            <span className="sm:hidden">P</span>
                          </Badge>
                        ) : citizen.verificationStatus === 'PENDING' ? (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Bronze</span>
                            <span className="sm:hidden">B</span>
                          </Badge>
                        ) : citizen.verificationStatus === 'REJECTED' ? (
                          <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap">
                            <XCircle className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Rejeitado</span>
                            <span className="sm:hidden">R</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">-</Badge>
                        )}
                        {citizen._count?.documents && citizen._count.documents > 0 && (
                          <Badge variant="destructive" className="text-xs whitespace-nowrap">
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">
                              {citizen._count.documents} doc{citizen._count.documents > 1 ? 's' : ''} pendente{citizen._count.documents > 1 ? 's' : ''}
                            </span>
                            <span className="sm:hidden">{citizen._count.documents}</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-3 px-2 sm:px-4">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        {new Date(citizen.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3 px-2 sm:px-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {/* Botões de ação rápida para pendentes */}
                        {citizen.verificationStatus === 'PENDING' && canVerify && (
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCitizen(citizen)
                                setShowApproveDialog(true)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-xs px-2 sm:px-3 h-7 sm:h-8 w-full sm:w-auto justify-center"
                            >
                              <CheckCircle className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Aprovar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCitizen(citizen)
                                setShowRejectDialog(true)
                              }}
                              className="border-red-500 text-red-600 hover:bg-red-50 text-xs px-2 sm:px-3 h-7 sm:h-8 w-full sm:w-auto justify-center"
                            >
                              <XCircle className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Rejeitar</span>
                            </Button>
                          </div>
                        )}

                        {/* Menu de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs sm:text-sm">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewCitizen(citizen.id)} className="text-xs sm:text-sm cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewProtocols(citizen.id)} className="text-xs sm:text-sm cursor-pointer">
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
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 text-base sm:text-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">Aprovar Cadastro (Bronze → Prata)</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Aprovar o cadastro de {selectedCitizen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-900 break-words">
                <strong>Nome:</strong> {selectedCitizen?.name}
              </p>
              <p className="text-xs sm:text-sm text-blue-900 break-all">
                <strong>CPF:</strong> {selectedCitizen?.cpf}
              </p>
              <p className="text-xs sm:text-sm text-blue-900 break-all">
                <strong>Email:</strong> {selectedCitizen?.email}
              </p>
            </div>

            <div>
              <Label htmlFor="approval-notes" className="text-xs sm:text-sm">Observações (opcional)</Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Documentos conferidos no balcão..."
                rows={3}
                className="text-xs sm:text-sm mt-1"
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-green-800">
              ✅ O cidadão será notificado por email/app e terá acesso completo aos serviços
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={processing}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm"
            >
              {processing ? 'Aprovando...' : 'Aprovar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">Rejeitar Cadastro</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Rejeitar o cadastro de {selectedCitizen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-900 break-words">
                <strong>Nome:</strong> {selectedCitizen?.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-900 break-all">
                <strong>CPF:</strong> {selectedCitizen?.cpf}
              </p>
            </div>

            <div>
              <Label htmlFor="rejection-reason" className="text-xs sm:text-sm">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                required
                className="text-xs sm:text-sm mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo será enviado ao cidadão
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-red-800">
              ⚠️ O cadastro será desativado e o cidadão será notificado
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={processing}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {processing ? 'Rejeitando...' : 'Rejeitar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
