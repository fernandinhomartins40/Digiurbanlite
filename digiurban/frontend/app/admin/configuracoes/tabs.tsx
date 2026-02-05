import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  Chrome,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UserPreferences, UserSession } from '@/hooks/useAdminPreferences'

interface TabPerfilProps {
  user: any
  profileData: any
  setProfileData: (data: any) => void
  preferences: UserPreferences
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveAvatar: () => void
  handleSaveProfile: () => void
  saving: boolean
}

export function TabPerfil({
  user,
  profileData,
  setProfileData,
  preferences,
  fileInputRef,
  handleAvatarUpload,
  handleRemoveAvatar,
  handleSaveProfile,
  saving
}: TabPerfilProps) {
  const roleLabels: Record<string, string> = {
    USER: 'Funcionário',
    COORDINATOR: 'Coordenador',
    MANAGER: 'Secretário',
    ADMIN: 'Prefeito',
    SUPER_ADMIN: 'Super Admin',
    GUEST: 'Convidado'
  }

  const roleColors: Record<string, string> = {
    USER: 'bg-blue-100 text-blue-800',
    COORDINATOR: 'bg-green-100 text-green-800',
    MANAGER: 'bg-orange-100 text-orange-800',
    ADMIN: 'bg-purple-100 text-purple-800',
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    GUEST: 'bg-gray-100 text-gray-800'
  }

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
    <div className="space-y-6 mt-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Avatar e Info Básica */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={preferences.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL}${preferences.avatarUrl}` : undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center w-full">
                <h3 className="text-xl font-semibold">{user.name || 'Usuário'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge
                  variant="secondary"
                  className={`mt-2 ${roleColors[user.role]}`}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={saving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {preferences.avatarUrl ? 'Alterar Foto' : 'Fazer Upload'}
                </Button>
                {preferences.avatarUrl && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    className="w-full text-red-600 hover:text-red-700"
                    disabled={saving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Foto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Departamento */}
          <Card>
            <CardHeader>
              <CardTitle>Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              {user.departments && user.departments.length > 0 ? (
                <div className="space-y-2">
                  {user.departments.map((dept: any) => {
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
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de contato e dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={profileData.telefone}
                    onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneSecundario">Telefone Secundário</Label>
                  <Input
                    id="telefoneSecundario"
                    type="tel"
                    value={profileData.telefoneSecundario}
                    onChange={(e) => setProfileData({ ...profileData, telefoneSecundario: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={profileData.cpf}
                    onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={profileData.rg}
                    onChange={(e) => setProfileData({ ...profileData, rg: e.target.value })}
                  />
                </div>
              </div>

              {user.cargoEfetivo && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cargo Efetivo</Label>
                      <Input value={user.cargoEfetivo} disabled />
                    </div>

                    {user.matricula && (
                      <div className="space-y-2">
                        <Label>Matrícula</Label>
                        <Input value={user.matricula} disabled />
                      </div>
                    )}

                    {user.dataAdmissao && (
                      <div className="space-y-2">
                        <Label>Data de Admissão</Label>
                        <Input value={format(new Date(user.dataAdmissao), 'dd/MM/yyyy', { locale: ptBR })} disabled />
                      </div>
                    )}

                    {user.situacaoFuncional && (
                      <div className="space-y-2">
                        <Label>Situação Funcional</Label>
                        <Input value={user.situacaoFuncional} disabled />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  Salvar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface TabAparenciaProps {
  localPrefs: UserPreferences | null
  setLocalPrefs: (prefs: UserPreferences | null) => void
}

export function TabAparencia({ localPrefs, setLocalPrefs }: TabAparenciaProps) {
  if (!localPrefs) return null

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>
            Escolha como o sistema deve ser exibido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo de Cor</Label>
            <Select
              value={localPrefs.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') =>
                setLocalPrefs({ ...localPrefs, theme: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Automático (Sistema)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor Primária (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={localPrefs.primaryColor || '#0066CC'}
                onChange={(e) => setLocalPrefs({ ...localPrefs, primaryColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={localPrefs.primaryColor || '#0066CC'}
                onChange={(e) => setLocalPrefs({ ...localPrefs, primaryColor: e.target.value })}
                placeholder="#0066CC"
                className="flex-1"
              />
              {localPrefs.primaryColor && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setLocalPrefs({ ...localPrefs, primaryColor: undefined })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interface</CardTitle>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Compacto</Label>
              <p className="text-sm text-gray-500">
                Reduzir espaçamentos para mostrar mais conteúdo
              </p>
            </div>
            <Switch
              checked={localPrefs.compactMode}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, compactMode: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tamanho da Fonte</Label>
            <Select
              value={localPrefs.fontSize}
              onValueChange={(value: 'small' | 'medium' | 'large') =>
                setLocalPrefs({ ...localPrefs, fontSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acessibilidade</CardTitle>
          <CardDescription>
            Opções para melhorar a acessibilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alto Contraste</Label>
              <p className="text-sm text-gray-500">
                Aumentar contraste para melhor legibilidade
              </p>
            </div>
            <Switch
              checked={localPrefs.highContrast}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, highContrast: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduzir Animações</Label>
              <p className="text-sm text-gray-500">
                Minimizar efeitos de movimento
              </p>
            </div>
            <Switch
              checked={localPrefs.reduceMotion}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, reduceMotion: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Continua nos próximos arquivos...
