'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  Users,
  FileText,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PendingCitizen {
  id: string
  cpf: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  birthDate: string | null
  registrationSource: string
  createdAt: string
  _count: {
    protocols: number
    familyAsHead: number
  }
}

interface CitizenStats {
  total: number
  withProtocols: number
  withFamily: number
}

export default function PendingCitizensPage() {
  const [citizens, setCitizens] = useState<PendingCitizen[]>([])
  const [filteredCitizens, setFilteredCitizens] = useState<PendingCitizen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<CitizenStats>({
    total: 0,
    withProtocols: 0,
    withFamily: 0,
  })

  // Dialogs state
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<PendingCitizen | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const { toast } = useToast()
  const { apiRequest } = useAdminAuth()

  useEffect(() => {
    loadPendingCitizens()
  }, [])

  useEffect(() => {
    filterCitizens()
  }, [searchTerm, citizens])

  const loadPendingCitizens = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/admin/citizens/pending')

      if (response.success) {
        const citizensData = response.data.citizens || []
        setCitizens(citizensData)
        setFilteredCitizens(citizensData)

        // Calculate stats
        const total = citizensData.length
        const withProtocols = citizensData.filter(
          (c: PendingCitizen) => c._count.protocols > 0
        ).length
        const withFamily = citizensData.filter(
          (c: PendingCitizen) => c._count.familyAsHead > 0
        ).length

        setStats({ total, withProtocols, withFamily })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar cidadãos pendentes',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterCitizens = () => {
    if (!searchTerm.trim()) {
      setFilteredCitizens(citizens)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = citizens.filter(
      (citizen) =>
        citizen.name.toLowerCase().includes(term) ||
        citizen.cpf.includes(term) ||
        citizen.email?.toLowerCase().includes(term) ||
        citizen.phone?.includes(term)
    )
    setFilteredCitizens(filtered)
  }

  const handleApprove = (citizen: PendingCitizen) => {
    setSelectedCitizen(citizen)
    setApprovalNotes('')
    setShowApproveDialog(true)
  }

  const handleReject = (citizen: PendingCitizen) => {
    setSelectedCitizen(citizen)
    setRejectionReason('')
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!selectedCitizen) return

    try {
      setProcessing(true)
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ notes: approvalNotes }),
      })

      if (response.success) {
        toast({
          title: 'Cadastro aprovado! ✅',
          description: `${selectedCitizen.name} agora possui status Prata (Verificado)`,
        })

        // Remove from list
        setCitizens((prev) => prev.filter((c) => c.id !== selectedCitizen.id))
        setShowApproveDialog(false)
        setSelectedCitizen(null)
        setApprovalNotes('')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description: 'Não foi possível aprovar o cadastro',
      })
    } finally {
      setProcessing(false)
    }
  }

  const confirmRejection = async () => {
    if (!selectedCitizen) return

    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição',
      })
      return
    }

    try {
      setProcessing(true)
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (response.success) {
        toast({
          title: 'Cadastro rejeitado',
          description: `O cidadão ${selectedCitizen.name} foi notificado`,
        })

        // Remove from list
        setCitizens((prev) => prev.filter((c) => c.id !== selectedCitizen.id))
        setShowRejectDialog(false)
        setSelectedCitizen(null)
        setRejectionReason('')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao rejeitar',
        description: 'Não foi possível rejeitar o cadastro',
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const getDaysAgo = (date: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return 'há 1 dia'
    return `há ${diffDays} dias`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cidadãos pendentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cidadãos Pendentes</h1>
        <p className="text-gray-600 mt-1">
          Verificação e aprovação de cadastros (Bronze → Prata)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendentes</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Aguardando verificação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Protocolos</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.withProtocols}</div>
            <p className="text-xs text-gray-600">
              {stats.total > 0
                ? `${((stats.withProtocols / stats.total) * 100).toFixed(0)}% do total`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Família</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.withFamily}</div>
            <p className="text-xs text-gray-600">
              {stats.total > 0
                ? `${((stats.withFamily / stats.total) * 100).toFixed(0)}% do total`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Citizens List */}
      {filteredCitizens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum cidadão pendente'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Tente ajustar os termos de busca'
                : 'Todos os cadastros foram verificados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCitizens.map((citizen) => (
            <Card key={citizen.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{citizen.name}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                        Bronze
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {getDaysAgo(citizen.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">CPF:</span>
                        <p className="font-medium">{formatCPF(citizen.cpf)}</p>
                      </div>

                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{citizen.email || '-'}</p>
                      </div>

                      <div>
                        <span className="text-gray-600">Telefone:</span>
                        <p className="font-medium">{formatPhone(citizen.phone)}</p>
                      </div>

                      <div>
                        <span className="text-gray-600">Cadastrado em:</span>
                        <p className="font-medium">
                          {format(new Date(citizen.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {(citizen._count.protocols > 0 || citizen._count.familyAsHead > 0) && (
                      <div className="flex gap-4 mt-3 text-xs">
                        {citizen._count.protocols > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <FileText className="h-3 w-3" />
                            {citizen._count.protocols} protocolo(s)
                          </span>
                        )}
                        {citizen._count.familyAsHead > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Users className="h-3 w-3" />
                            {citizen._count.familyAsHead} familiar(es)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(citizen)}
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(citizen)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Cadastro</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar o cadastro de{' '}
              <strong>{selectedCitizen?.name}</strong>. O cidadão receberá o status{' '}
              <strong>Prata (Verificado)</strong> e será notificado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="approval-notes">Observações (opcional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Adicione observações sobre a verificação..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button onClick={confirmApproval} disabled={processing} className="bg-green-600">
              {processing ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Você está prestes a rejeitar o cadastro de{' '}
              <strong>{selectedCitizen?.name}</strong>. O cadastro será desativado e o
              cidadão será notificado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">
                Motivo da rejeição <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Informe o motivo da rejeição (será enviado ao cidadão)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRejection}
              disabled={processing || !rejectionReason.trim()}
              variant="destructive"
            >
              {processing ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
