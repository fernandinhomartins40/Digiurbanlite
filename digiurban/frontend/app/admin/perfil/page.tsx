'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Building2,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  Lock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

export default function PerfilPage() {
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Aqui você faria a chamada para atualizar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulação

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      })
      setEditing(false)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao atualizar seu perfil.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Aqui você faria a chamada para alterar a senha
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulação

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      })
      setChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast({
        title: 'Erro ao alterar senha',
        description: 'Ocorreu um erro ao alterar sua senha.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Avatar e Info Básica */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{user.name || 'Usuário'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge
                  variant="secondary"
                  className={`mt-2 ${roleColors[user.role]}`}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Departamento */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.departments && user.departments.length > 0 ? (
                <div className="space-y-2">
                  {user.departments.map((dept) => {
                    const isPrimary = user.primaryDepartment?.id === dept.id
                    return (
                      <div
                        key={dept.id}
                        className={`p-2 rounded-lg ${isPrimary ? 'bg-primary/10 border border-primary' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept.name}</span>
                          {isPrimary && (
                            <Badge variant="default" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : user.department ? (
                <p className="text-sm">{user.department.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Nenhum departamento atribuído</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Edição de Dados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações de contato
                  </CardDescription>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: '',
                      })
                    }}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Altere sua senha de acesso
                  </CardDescription>
                </div>
                {!changingPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangingPassword(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                )}
              </div>
            </CardHeader>
            {changingPassword && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                    }}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
