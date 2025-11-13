'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Building2,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserManagementModal } from '@/components/admin/UserManagementModal'
import { useToast } from '@/hooks/use-toast'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  department?: {
    id: string
    name: string
    code: string | null
  }
  _count?: {
    assignedProtocolsSimplified: number
  }
}

export default function EquipePage() {
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/admin/team')
      if (data.success && data.data?.teamMembers) {
        setTeamMembers(data.data.teamMembers)
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a equipe',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setModalOpen(true)
  }

  const handleEditUser = (member: TeamMember) => {
    setSelectedUser(member)
    setModalOpen(true)
  }

  const handleDeleteUser = (member: TeamMember) => {
    setUserToDelete(member)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const data = await apiRequest(`/admin/team/${userToDelete.id}`, {
        method: 'DELETE'
      })

      toast({
        title: 'Sucesso',
        description: data.message || 'Usuário excluído com sucesso'
      })

      loadTeamMembers()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível excluir o usuário',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleModalSuccess = () => {
    toast({
      title: 'Sucesso',
      description: selectedUser ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso'
    })
    loadTeamMembers()
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    const roles = {
      SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      MANAGER: { label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
      COORDINATOR: { label: 'Coordenador', color: 'bg-green-100 text-green-800' },
      USER: { label: 'Usuário', color: 'bg-gray-100 text-gray-800' },
      GUEST: { label: 'Visitante', color: 'bg-yellow-100 text-yellow-800' }
    }

    const roleConfig = roles[role as keyof typeof roles] || roles.USER

    return (
      <Badge variant="outline" className={roleConfig.color}>
        {roleConfig.label}
      </Badge>
    )
  }

  const activeMembers = teamMembers.filter(m => m.isActive).length
  const inactiveMembers = teamMembers.filter(m => !m.isActive).length
  const adminCount = teamMembers.filter(m => ['ADMIN', 'SUPER_ADMIN'].includes(m.role)).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            Gerenciamento de Equipe
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>
        <Button className="flex items-center" onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Com acesso ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveMembers}</div>
            <p className="text-xs text-muted-foreground">
              Sem acesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Permissões elevadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Membros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                Lista completa de todos os usuários do sistema
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar membros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        {member.department?.name || 'Sem departamento'}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteUser(member)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Gerenciamento de Usuário */}
      <UserManagementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleModalSuccess}
        user={selectedUser ? {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          departmentId: selectedUser.department?.id,
          isActive: selectedUser.isActive
        } : null}
        currentUserRole={user?.role || 'USER'}
        currentUserDepartmentId={user?.departmentId}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
