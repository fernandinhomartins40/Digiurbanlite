'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Briefcase,
  ArrowRightLeft,
} from 'lucide-react'
import { ROLE_DISPLAY_NAMES } from '@/types/roles'
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
import { ServerManagementModal } from '@/components/admin/ServerManagementModal'
import { useToast } from '@/hooks/use-toast'

interface OrganizationalUnit {
  id: string
  nome: string
  sigla?: string
  tipo: string
  nivel: number
}

interface Position {
  id: string
  nome: string
  tipo: string
  nivel: string
}

interface Function {
  id: string
  nome: string
  tipo: string
  simbolo?: string
}

interface Assignment {
  id: string
  tipo: string
  situacao: string
  isPrimary: boolean
  dataInicio: string
  dataFim?: string
  cargaHoraria?: number
  percentualDedicacao?: number
  documentoVinculo?: string
  department?: {
    id: string
    name: string
    code: string | null
  }
  organizationalUnit?: OrganizationalUnit
  position?: Position
  function?: Function
}

interface Supervisor {
  id: string
  tipo: string
  supervisor: {
    id: string
    name: string
    email: string
    cpf?: string
    matricula?: string
  }
}

interface HealthData {
  categoria: string
  registroProfissional: string
  tipoRegistro: string
  especialidades: unknown
  status: string
}

interface EducationData {
  categoria: string
  formacao: string
  disciplinas: unknown
  nivelEnsino: unknown
}

interface EngineeringData {
  categoria: string
  registroProfissional: string
  tipoRegistro: string
  especialidades: unknown
}

interface SocialAssistanceData {
  categoria: string
  registroProfissional: string
  tipoRegistro: string
  areasAtuacao: unknown
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  cpf?: string
  matricula?: string
  rg?: string
  dataNascimento?: string
  telefone?: string
  telefoneSecundario?: string
  endereco?: unknown
  cargoEfetivo?: string
  situacaoFuncional?: string
  dataAdmissao?: string
  observacoes?: string
  department?: {
    id: string
    name: string
    code: string | null
  }
  departments?: Array<{
    id: string
    name: string
    code: string | null
  }>
  primaryDepartment?: {
    id: string
    name: string
    code: string | null
  }
  userDepartments?: Array<{
    id: string
    departmentId: string
    isPrimary: boolean
    isActive: boolean
    department: {
      id: string
      name: string
      code: string | null
    }
  }>
  assignments?: Assignment[]
  supervisores?: Supervisor[]
  subordinados?: unknown[]
  healthData?: HealthData
  educationData?: EducationData
  engineeringData?: EngineeringData
  socialAssistanceData?: SocialAssistanceData
  _count?: {
    assignedProtocolsSimplified: number
    subordinados: number
  }
}

export default function ServidoresPage() {
  const router = useRouter()
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
      console.error('Erro ao carregar servidores:', error)
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar os servidores',
        variant: 'destructive',
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

  const handleViewProfile = (member: TeamMember) => {
    router.push(`/admin/servidores/${member.id}`)
  }

  const handleManageAssignments = (member: TeamMember) => {
    router.push(`/admin/organograma/lotacoes?userId=${member.id}`)
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
        method: 'DELETE',
      })

      toast({
        title: 'Sucesso',
        description: data.message || 'Servidor excluido com sucesso',
      })

      loadTeamMembers()
    } catch (error) {
      console.error('Erro ao excluir servidor:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Nao foi possivel excluir o servidor',
        variant: 'destructive',
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
      description: selectedUser ? 'Servidor atualizado com sucesso' : 'Servidor criado com sucesso',
    })
    loadTeamMembers()
  }

  const getPrimaryAssignment = (member: TeamMember) =>
    member.assignments?.find((assignment) => assignment.isPrimary) || member.assignments?.[0]

  const filteredMembers = teamMembers.filter((member) => {
    const normalizedSearch = searchTerm.toLowerCase()
    const numericSearch = searchTerm.replace(/\D/g, '')
    const primaryAssignment = getPrimaryAssignment(member)

    return (
      member.name.toLowerCase().includes(normalizedSearch) ||
      member.email.toLowerCase().includes(normalizedSearch) ||
      (member.cpf || '').replace(/\D/g, '').includes(numericSearch) ||
      (member.matricula || '').toLowerCase().includes(normalizedSearch) ||
      (member.primaryDepartment?.name || '').toLowerCase().includes(normalizedSearch) ||
      (primaryAssignment?.department?.name || '').toLowerCase().includes(normalizedSearch) ||
      (primaryAssignment?.organizationalUnit?.nome || '').toLowerCase().includes(normalizedSearch) ||
      (primaryAssignment?.position?.nome || '').toLowerCase().includes(normalizedSearch) ||
      (primaryAssignment?.function?.nome || '').toLowerCase().includes(normalizedSearch)
    )
  })

  const getRoleBadge = (role: string) => {
    const roles = {
      SUPER_ADMIN: { label: ROLE_DISPLAY_NAMES.SUPER_ADMIN, color: 'bg-purple-100 text-purple-800' },
      ADMIN: { label: ROLE_DISPLAY_NAMES.ADMIN, color: 'bg-red-100 text-red-800' },
      MANAGER: { label: ROLE_DISPLAY_NAMES.MANAGER, color: 'bg-orange-100 text-orange-800' },
      COORDINATOR: { label: ROLE_DISPLAY_NAMES.COORDINATOR, color: 'bg-blue-100 text-blue-800' },
      USER: { label: ROLE_DISPLAY_NAMES.USER, color: 'bg-green-100 text-green-800' },
      GUEST: { label: ROLE_DISPLAY_NAMES.GUEST, color: 'bg-gray-100 text-gray-800' },
    }

    const roleConfig = roles[role as keyof typeof roles] || roles.USER

    return (
      <Badge variant="outline" className={roleConfig.color}>
        {roleConfig.label}
      </Badge>
    )
  }

  const getVinculoBadge = (tipo: string) => {
    const tipos = {
      LOTACAO: { color: 'bg-blue-100 text-blue-800' },
      CEDENCIA: { color: 'bg-purple-100 text-purple-800' },
      REQUISICAO: { color: 'bg-orange-100 text-orange-800' },
      REMOCAO: { color: 'bg-yellow-100 text-yellow-800' },
      DISPOSICAO: { color: 'bg-pink-100 text-pink-800' },
    }
    const config = tipos[tipo as keyof typeof tipos] || tipos.LOTACAO
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {tipo}
      </Badge>
    )
  }

  const getSituacaoBadge = (situacao: string) => {
    const situacoes = {
      ATIVO: { color: 'bg-green-100 text-green-800' },
      AFASTADO: { color: 'bg-yellow-100 text-yellow-800' },
      LICENCA: { color: 'bg-orange-100 text-orange-800' },
      SUSPENSO: { color: 'bg-red-100 text-red-800' },
      CEDIDO: { color: 'bg-purple-100 text-purple-800' },
      INATIVO: { color: 'bg-gray-100 text-gray-800' },
    }
    const config = situacoes[situacao as keyof typeof situacoes] || situacoes.INATIVO
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {situacao}
      </Badge>
    )
  }

  const activeMembers = teamMembers.filter((member) => member.isActive).length
  const adminCount = teamMembers.filter((member) => ['ADMIN', 'SUPER_ADMIN'].includes(member.role)).length
  const withAssignments = teamMembers.filter((member) => (member.assignments || []).length > 0).length

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            Gestao de Servidores
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Diretorio administrativo com lotacao operacional vinculada ao organograma
          </p>
        </div>
        <Button className="w-full sm:w-auto flex items-center justify-center" onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Adicionar Servidor</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Servidores</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Servidores cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Servidores Ativos</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Com acesso ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Com Lotacao</CardTitle>
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{withAssignments}</div>
            <p className="text-xs text-muted-foreground">Lotacoes funcionais registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Permissoes elevadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Servidores Publicos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Cadastro administrativo com leitura da lotacao operacional centralizada
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, matricula, setor ou cargo..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-8 w-full sm:w-[300px] md:w-[350px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Servidor</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">CPF / Matricula</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[240px]">Lotacao Atual</TableHead>
                <TableHead className="min-w-[140px]">Perfil de Acesso</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[80px]">Status</TableHead>
                <TableHead className="text-right min-w-[80px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum servidor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const primaryAssignment = getPrimaryAssignment(member)

                  return (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewProfile(member)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{member.name}</span>
                          <span className="sm:hidden text-xs text-muted-foreground flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </span>
                          {member.cpf && (
                            <span className="md:hidden text-xs text-muted-foreground mt-0.5">
                              CPF: {member.cpf}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col text-xs">
                          {member.cpf && <span className="font-mono">{member.cpf}</span>}
                          {member.matricula && <span className="text-muted-foreground">Mat: {member.matricula}</span>}
                          {!member.cpf && !member.matricula && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={(event) => event.stopPropagation()}>
                        {primaryAssignment ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              {getVinculoBadge(primaryAssignment.tipo)}
                              {getSituacaoBadge(primaryAssignment.situacao)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {primaryAssignment.organizationalUnit?.sigla ||
                                primaryAssignment.organizationalUnit?.nome ||
                                primaryAssignment.department?.name ||
                                'Sem unidade organizacional'}
                            </span>
                            {primaryAssignment.position && (
                              <span className="text-xs font-medium">{primaryAssignment.position.nome}</span>
                            )}
                            {primaryAssignment.function && (
                              <span className="text-xs text-muted-foreground">
                                Funcao: {primaryAssignment.function.nome}
                              </span>
                            )}
                          </div>
                        ) : member.departments?.length ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs">
                              Escopo administrativo apenas
                            </Badge>
                            <span className="text-xs text-muted-foreground">Sem lotacao operacional ativa</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem lotacao operacional</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>{getRoleBadge(member.role)}</TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={(event) => event.stopPropagation()}>
                        {member.isActive ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageAssignments(member)}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Gerenciar Lotacoes
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ServerManagementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleModalSuccess}
        user={selectedUser}
        currentUserRole={user?.role || 'USER'}
        currentUserDepartmentId={user?.primaryDepartment?.id || user?.departmentId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o servidor <strong>{userToDelete?.name}</strong>?
              Esta acao nao pode ser desfeita.
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
