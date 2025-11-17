'use client'

import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut, Settings, User } from 'lucide-react'
import type { UserRole } from '@/contexts/AdminAuthContext'

const roleLabels: Record<UserRole, string> = {
  USER: 'Funcionário',
  COORDINATOR: 'Coordenador',
  MANAGER: 'Secretário',
  ADMIN: 'Prefeito',
  SUPER_ADMIN: 'Super Admin',
  GUEST: 'Convidado'
}

const roleColors: Record<UserRole, string> = {
  USER: 'bg-blue-100 text-blue-800',
  COORDINATOR: 'bg-green-100 text-green-800',
  MANAGER: 'bg-orange-100 text-orange-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  GUEST: 'bg-gray-100 text-gray-800'
}

export function AdminHeader() {
  const router = useRouter()
  const { user, logout, stats } = useAdminAuth()

  if (!user) return null

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Título da página atual */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Portal Administrativo
          </h1>
          {user.department && (
            <p className="text-sm text-gray-600">
              {user.department.name}
            </p>
          )}
        </div>

        {/* Área do usuário e notificações */}
        <div className="flex items-center space-x-4">
          {/* Estatísticas rápidas */}
          {stats && (
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{stats.pendingProtocols}</div>
                <div className="text-gray-500">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{stats.completedProtocols}</div>
                <div className="text-gray-500">Concluídos</div>
              </div>
            </div>
          )}

          {/* Botão de notificações */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push('/admin/protocolos')}
            title="Ver protocolos pendentes"
          >
            <Bell className="h-5 w-5" />
            {stats && stats.pendingProtocols > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {stats.pendingProtocols > 9 ? '9+' : stats.pendingProtocols}
              </span>
            )}
          </Button>

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto px-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{user.name || 'Usuário'}</div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-xs w-fit ${roleColors[user.role]}`}
                  >
                    {roleLabels[user.role]}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}