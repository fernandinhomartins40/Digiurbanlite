'use client'

import { useState, useRef, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { TabPerfil, TabAparencia } from './tabs'
import {
  TabNotificacoes,
  TabPrivacidade,
  TabSistema,
  TabIntegracao,
  TabSeguranca,
  TabAvancado
} from './tabs2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Lock,
  Sliders,
  Save,
  Loader2,
  Upload,
  X,
  Trash2,
  Globe,
  Monitor,
  Smartphone,
  Chrome,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

type TabId = 'perfil' | 'aparencia' | 'notificacoes' | 'privacidade' | 'sistema' | 'integracao' | 'seguranca' | 'avancado'

const roleLabels = {
  USER: 'Funcionário',
  COORDINATOR: 'Coordenador',
  MANAGER: 'Secretário',
  ADMIN: 'Prefeito',
  SUPER_ADMIN: 'Super Admin',
  GUEST: 'Convidado'
}

const roleColors = {
  USER: 'bg-blue-100 text-blue-800',
  COORDINATOR: 'bg-green-100 text-green-800',
  MANAGER: 'bg-orange-100 text-orange-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  GUEST: 'bg-gray-100 text-gray-800'
}

export default function ConfiguracoesPage() {
  const { user } = useAdminAuth()
  const { toast } = useToast()
  const {
    preferences,
    sessions,
    loading,
    saving,
    updatePreferences,
    resetPreferences,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    changePassword,
    loadSessions,
    revokeSession,
    revokeAllSessions,
  } = useAdminPreferences()

  const [activeTab, setActiveTab] = useState<TabId>('perfil')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para edição de perfil
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    telefoneSecundario: user?.telefoneSecundario || '',
    cpf: user?.cpf || '',
    rg: user?.rg || '',
  })

  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Estados para preferências locais (sincronizadas com o backend)
  const [localPrefs, setLocalPrefs] = useState(preferences)

  // Atualizar preferências locais quando carregar do backend
  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences])

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSavePreferences = async () => {
    if (!localPrefs) return
    await updatePreferences(localPrefs)
  }

  const handleResetPreferences = async () => {
    if (confirm('Tem certeza que deseja restaurar todas as preferências para os valores padrão?')) {
      await resetPreferences()
    }
  }

  const handleSaveProfile = async () => {
    await updateProfile(profileData)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Use apenas JPG, PNG, GIF ou WebP',
        variant: 'destructive',
      })
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB',
        variant: 'destructive',
      })
      return
    }

    await uploadAvatar(file)
  }

  const handleRemoveAvatar = async () => {
    if (confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      await removeAvatar()
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

    const success = await changePassword(passwordData)
    if (success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }

  const handleLoadSessions = async () => {
    await loadSessions()
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm('Tem certeza que deseja encerrar esta sessão?')) {
      await revokeSession(sessionId)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (confirm('Tem certeza que deseja encerrar todas as outras sessões? Você permanecerá conectado apenas neste dispositivo.')) {
      await revokeAllSessions()
    }
  }

  if (loading || !user || !preferences) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie suas preferências, perfil e segurança do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resetar
          </Button>
          <Button onClick={handleSavePreferences} disabled={saving}>
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
        </div>
      </div>

      {/* Tabs de configurações */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto">
          <TabsTrigger value="perfil" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <User className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <Palette className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="privacidade" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Privacidade</span>
          </TabsTrigger>
          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
            <>
              <TabsTrigger value="sistema" className="flex flex-col sm:flex-row items-center gap-1 py-2">
                <Settings className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Sistema</span>
              </TabsTrigger>
              <TabsTrigger value="integracao" className="flex flex-col sm:flex-row items-center gap-1 py-2">
                <Database className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Integrações</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="seguranca" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <Lock className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="avancado" className="flex flex-col sm:flex-row items-center gap-1 py-2">
            <Sliders className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Avançado</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA: Perfil */}
        <TabsContent value="perfil">
          <TabPerfil
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            preferences={preferences}
            fileInputRef={fileInputRef}
            handleAvatarUpload={handleAvatarUpload}
            handleRemoveAvatar={handleRemoveAvatar}
            handleSaveProfile={handleSaveProfile}
            saving={saving}
          />
        </TabsContent>

        {/* ABA: Aparência */}
        <TabsContent value="aparencia">
          <TabAparencia
            localPrefs={localPrefs}
            setLocalPrefs={setLocalPrefs}
          />
        </TabsContent>

        {/* ABA: Notificações */}
        <TabsContent value="notificacoes">
          <TabNotificacoes
            localPrefs={localPrefs}
            setLocalPrefs={setLocalPrefs}
          />
        </TabsContent>

        {/* ABA: Privacidade */}
        <TabsContent value="privacidade">
          <TabPrivacidade
            localPrefs={localPrefs}
            setLocalPrefs={setLocalPrefs}
          />
        </TabsContent>

        {/* ABA: Sistema */}
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
          <TabsContent value="sistema">
            <TabSistema
              localPrefs={localPrefs}
              setLocalPrefs={setLocalPrefs}
            />
          </TabsContent>
        )}

        {/* ABA: Integrações */}
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
          <TabsContent value="integracao">
            <TabIntegracao user={user} />
          </TabsContent>
        )}

        {/* ABA: Segurança */}
        <TabsContent value="seguranca">
          <TabSeguranca
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleChangePassword={handleChangePassword}
            sessions={sessions}
            handleLoadSessions={handleLoadSessions}
            handleRevokeSession={handleRevokeSession}
            handleRevokeAllSessions={handleRevokeAllSessions}
            saving={saving}
          />
        </TabsContent>

        {/* ABA: Avançado */}
        <TabsContent value="avancado">
          <TabAvancado
            localPrefs={localPrefs}
            setLocalPrefs={setLocalPrefs}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
