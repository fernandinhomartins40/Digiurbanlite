'use client'

import { useState, useEffect, useCallback } from 'react'
import { CitizenLayout } from '@/components/citizen/CitizenLayout'
import { useCitizenAuth } from '@/contexts/CitizenAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FamilyTree } from '@/components/citizen/FamilyTree'
import { AddFamilyMemberDialog } from '@/components/citizen/AddFamilyMemberDialog'
import { EditFamilyMemberDialog } from '@/components/citizen/EditFamilyMemberDialog'
import { FamilyInviteDialog } from '@/components/citizen/FamilyInviteDialog'
import { PendingLinksSection } from '@/components/citizen/PendingLinksSection'
import { FamilyStats } from '@/components/citizen/FamilyStats'
import { FamilyInvitesList } from '@/components/citizen/FamilyInvitesList'
import { FamilyTreeDiagram } from '@/components/citizen/FamilyTreeDiagram'
import { FamilyExportButton } from '@/components/citizen/FamilyExportButton'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Mail,
  Loader2,
  AlertCircle,
  Info,
  Trash2,
  GitBranch
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null
  member: {
    id: string
    cpf: string
    name: string
    email: string
    phone?: string
    birthDate?: string
    isActive: boolean
  }
}

interface FamilyData {
  head: {
    id: string
    cpf: string
    name: string
    email: string
    phone?: string
    birthDate?: string
  }
  members: FamilyMember[]
  memberOf: any[]
  stats: any
  pendingLinks: any[]
}

export default function FamiliaPage() {
  const { apiRequest } = useCitizenAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [familyData, setFamilyData] = useState<FamilyData | null>(null)
  const [invites, setInvites] = useState<any[]>([])

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  // Selected
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [removing, setRemoving] = useState(false)

  const loadFamilyData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/citizen/family')

      if (response.success && response.data?.family) {
        // A API retorna { success: true, data: { family: {...} } }
        setFamilyData(response.data.family)
      } else {
        console.error('[Família] Resposta inesperada da API:', response)
        throw new Error('Dados de família não encontrados na resposta')
      }
    } catch (error: any) {
      console.error('[Família] Erro ao carregar família:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os dados da família'
      })
    } finally {
      setLoading(false)
    }
  }, [apiRequest, toast])

  const loadInvites = useCallback(async () => {
    try {
      const response = await apiRequest('/citizen/family/invites')

      if (response.success) {
        setInvites(response.data.invites || [])
      }
    } catch (error) {
      console.error('[Família] Erro ao carregar convites:', error)
    }
  }, [apiRequest])

  useEffect(() => {
    loadFamilyData()
    loadInvites()
  }, [loadFamilyData, loadInvites])

  const handleEditMember = (memberId: string) => {
    const member = familyData?.members.find(m => m.id === memberId)
    if (member) {
      setSelectedMember(member)
      setShowEditDialog(true)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    const member = familyData?.members.find(m => m.id === memberId)
    if (member) {
      setSelectedMember(member)
      setShowRemoveDialog(true)
    }
  }

  const confirmRemoveMember = async () => {
    if (!selectedMember) return

    try {
      setRemoving(true)
      const response = await apiRequest(`/citizen/family/members/${selectedMember.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast({
          title: 'Membro removido',
          description: 'O membro foi removido da família'
        })
        setShowRemoveDialog(false)
        setSelectedMember(null)
        loadFamilyData()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível remover o membro'
      })
    } finally {
      setRemoving(false)
    }
  }

  const handleSuccess = () => {
    loadFamilyData()
    loadInvites()
  }

  if (loading) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando informações da família...</p>
          </div>
        </div>
      </CitizenLayout>
    )
  }

  if (!familyData) {
    return (
      <CitizenLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-gray-600">Erro ao carregar dados da família</p>
            <Button onClick={loadFamilyData} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-7 w-7 md:h-8 md:w-8" />
              Minha Família
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie a composição familiar e envie convites
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex-1 md:flex-none"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
            <Button
              onClick={() => setShowInviteDialog(true)}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              <Mail className="h-4 w-4 mr-2" />
              Convidar por Email
            </Button>
            <FamilyExportButton
              head={familyData.head}
              members={familyData.members}
              stats={familyData.stats}
            />
          </div>
        </div>

        {/* Vínculos Pendentes */}
        {familyData.pendingLinks && familyData.pendingLinks.length > 0 && (
          <PendingLinksSection
            pendingLinks={familyData.pendingLinks}
            onUpdate={handleSuccess}
            apiRequest={apiRequest}
          />
        )}

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona a composição familiar?</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Adicionar Membro:</strong> Busque um cidadão já cadastrado no sistema</li>
                  <li>• <strong>Convidar por Email:</strong> Envie um convite para alguém que ainda não está cadastrado</li>
                  <li>• Membros adicionados precisam confirmar o vínculo familiar</li>
                  <li>• Convites expiram em 30 dias</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Membros ({familyData?.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tree">
              <GitBranch className="h-4 w-4 mr-2" />
              Árvore
            </TabsTrigger>
            <TabsTrigger value="invites">
              <Mail className="h-4 w-4 mr-2" />
              Convites ({invites?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Info className="h-4 w-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Aba Membros */}
          <TabsContent value="members">
            <FamilyTree
              family={familyData}
              onAddMember={() => setShowAddDialog(true)}
              onEditMember={handleEditMember}
              onRemoveMember={handleRemoveMember}
            />
          </TabsContent>

          {/* Aba Árvore Genealógica */}
          <TabsContent value="tree">
            <FamilyTreeDiagram
              head={familyData.head}
              members={familyData.members}
            />
          </TabsContent>

          {/* Aba Convites */}
          <TabsContent value="invites">
            <FamilyInvitesList
              invites={invites}
              onUpdate={loadInvites}
              apiRequest={apiRequest}
            />
          </TabsContent>

          {/* Aba Estatísticas */}
          <TabsContent value="stats">
            {familyData.stats ? (
              <FamilyStats stats={familyData.stats} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Estatísticas não disponíveis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddFamilyMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleSuccess}
        apiRequest={apiRequest}
        headBirthDate={familyData?.head?.birthDate}
      />

      <EditFamilyMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={selectedMember}
        onSuccess={handleSuccess}
        apiRequest={apiRequest}
      />

      <FamilyInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={handleSuccess}
        apiRequest={apiRequest}
      />

      {/* Dialog de Remoção */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Remover Membro da Família
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja remover{' '}
              <strong>{selectedMember?.member?.name || 'este membro'}</strong>{' '}
              da sua composição familiar?
            </p>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Esta ação não poderá ser desfeita. O membro será notificado sobre a remoção.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false)
                setSelectedMember(null)
              }}
              disabled={removing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={removing}
            >
              {removing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  )
}
