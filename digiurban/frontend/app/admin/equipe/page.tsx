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
  XCircle
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

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  permissions: string[]
}

export default function EquipePage() {
  const { user } = useAdminAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - substituir por chamada real à API
    const mockData: TeamMember[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@cidade.gov.br',
        role: 'ADMIN',
        department: 'Secretaria de Saúde',
        status: 'active',
        permissions: ['protocols:read', 'protocols:write', 'team:read']
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria.santos@cidade.gov.br',
        role: 'COORDINATOR',
        department: 'Secretaria de Educação',
        status: 'active',
        permissions: ['protocols:read', 'services:read']
      },
      {
        id: '3',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@cidade.gov.br',
        role: 'USER',
        department: 'Secretaria de Cultura',
        status: 'active',
        permissions: ['protocols:read']
      },
      {
        id: '4',
        name: 'Ana Costa',
        email: 'ana.costa@cidade.gov.br',
        role: 'MANAGER',
        department: 'Secretaria de Assistência Social',
        status: 'active',
        permissions: ['protocols:read', 'protocols:write', 'reports:department']
      },
      {
        id: '5',
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@cidade.gov.br',
        role: 'USER',
        department: 'Secretaria de Obras',
        status: 'inactive',
        permissions: ['protocols:read']
      }
    ]

    setTimeout(() => {
      setTeamMembers(mockData)
      setLoading(false)
    }, 500)
  }, [])

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
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

  const activeMembers = teamMembers.filter(m => m.status === 'active').length
  const inactiveMembers = teamMembers.filter(m => m.status === 'inactive').length
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
        <Button className="flex items-center">
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
                        {member.department}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {member.status === 'active' ? (
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
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
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
    </div>
  )
}
