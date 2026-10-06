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
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha família</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            Quem mora com você. A pessoa adicionada confirma o vínculo pela conta dela.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => setShowAddDialog(true)} className="h-12 text-base sm:flex-1">
            <UserPlus className="mr-2 h-5 w-5" />
            Adicionar pessoa
          </Button>
          <Button size="lg" variant="outline" onClick={() => setShowInviteDialog(true)} className="h-12 text-base sm:flex-1">
            <Mail className="mr-2 h-5 w-5" />
            Convidar quem não tem cadastro
          </Button>
        </div>

        {/* Vínculos esperando a sua confirmação */}
        {familyData.pendingLinks && familyData.pendingLinks.length > 0 && (
          <PendingLinksSection
            pendingLinks={familyData.pendingLinks}
            onUpdate={handleSuccess}
            apiRequest={apiRequest}
          />
        )}

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="members" className="rounded-lg py-2">
              Pessoas ({(familyData?.members?.length || 0) + 1})
            </TabsTrigger>
            <TabsTrigger value="invites" className="rounded-lg py-2">
              Convites{invites?.length ? ` (${invites.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg py-2">
              Resumo
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
              <div className="space-y-4">
                <FamilyStats stats={familyData.stats} />
                <div className="flex justify-end">
                  <FamilyExportButton head={familyData.head} members={familyData.members} stats={familyData.stats} />
                </div>
              </div>
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
