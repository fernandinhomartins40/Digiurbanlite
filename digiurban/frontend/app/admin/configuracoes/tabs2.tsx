import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Chrome,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UserPreferences, UserSession } from '@/hooks/useAdminPreferences'

interface TabNotificacoesProps {
  localPrefs: UserPreferences | null
  setLocalPrefs: (prefs: UserPreferences | null) => void
}

export function TabNotificacoes({ localPrefs, setLocalPrefs }: TabNotificacoesProps) {
  if (!localPrefs) return null

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Escolha como deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações do Navegador</Label>
              <p className="text-sm text-gray-500">
                Receber notificações push no navegador
              </p>
            </div>
            <Switch
              checked={localPrefs.browserNotifications}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, browserNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-gray-500">
                Receber alertas importantes por email
              </p>
            </div>
            <Switch
              checked={localPrefs.emailNotifications}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Som de Notificação</Label>
              <p className="text-sm text-gray-500">
                Reproduzir som ao receber notificações
              </p>
            </div>
            <Switch
              checked={localPrefs.soundEnabled}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, soundEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais eventos devem gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Novo Protocolo Criado</Label>
            <Switch
              checked={localPrefs.notifyNewProtocol}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyNewProtocol: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Protocolo Atualizado</Label>
            <Switch
              checked={localPrefs.notifyProtocolUpdate}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyProtocolUpdate: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Protocolo Atribuído a Mim</Label>
            <Switch
              checked={localPrefs.notifyAssignment}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyAssignment: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>SLA Vencido ou Próximo</Label>
            <Switch
              checked={localPrefs.notifyOverdueSLA}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyOverdueSLA: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Novo Cidadão Cadastrado</Label>
            <Switch
              checked={localPrefs.notifyNewCitizen}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyNewCitizen: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Mensagens Recebidas</Label>
            <Switch
              checked={localPrefs.notifyMessages}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyMessages: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Documentos Pendentes</Label>
            <Switch
              checked={localPrefs.notifyDocuments}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifyDocuments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Atualizações do Sistema</Label>
            <Switch
              checked={localPrefs.notifySystemUpdates}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notifySystemUpdates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Silêncio</CardTitle>
          <CardDescription>
            Definir período em que não deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar Horário de Silêncio</Label>
            <Switch
              checked={localPrefs.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, quietHoursEnabled: checked })
              }
            />
          </div>

          {localPrefs.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart">Início</Label>
                <Input
                  id="quietHoursStart"
                  type="time"
                  value={localPrefs.quietHoursStart || '22:00'}
                  onChange={(e) =>
                    setLocalPrefs({ ...localPrefs, quietHoursStart: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd">Fim</Label>
                <Input
                  id="quietHoursEnd"
                  type="time"
                  value={localPrefs.quietHoursEnd || '07:00'}
                  onChange={(e) =>
                    setLocalPrefs({ ...localPrefs, quietHoursEnd: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface TabPrivacidadeProps {
  localPrefs: UserPreferences | null
  setLocalPrefs: (prefs: UserPreferences | null) => void
}

export function TabPrivacidade({ localPrefs, setLocalPrefs }: TabPrivacidadeProps) {
  if (!localPrefs) return null

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Visibilidade</CardTitle>
          <CardDescription>
            Controle o que outros usuários podem ver sobre você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Status Online</Label>
              <p className="text-sm text-gray-500">
                Outros usuários podem ver quando você está online
              </p>
            </div>
            <Switch
              checked={localPrefs.showOnlineStatus}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, showOnlineStatus: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Histórico de Atividades</Label>
              <p className="text-sm text-gray-500">
                Manter registro visível das suas ações no sistema
              </p>
            </div>
            <Switch
              checked={localPrefs.showActivityHistory}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, showActivityHistory: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados e Analytics</CardTitle>
          <CardDescription>
            Controle como seus dados são utilizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Coleta de Analytics</Label>
              <p className="text-sm text-gray-500">
                Ajudar a melhorar o sistema compartilhando dados de uso anônimos
              </p>
            </div>
            <Switch
              checked={localPrefs.allowAnalytics}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, allowAnalytics: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TabSistemaProps {
  localPrefs: UserPreferences | null
  setLocalPrefs: (prefs: UserPreferences | null) => void
}

export function TabSistema({ localPrefs, setLocalPrefs }: TabSistemaProps) {
  if (!localPrefs) return null

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Localização e Idioma</CardTitle>
          <CardDescription>
            Configurações regionais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select
              value={localPrefs.timezone}
              onValueChange={(value) =>
                setLocalPrefs({ ...localPrefs, timezone: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select
              value={localPrefs.language}
              onValueChange={(value) =>
                setLocalPrefs({ ...localPrefs, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato de Data</Label>
            <Select
              value={localPrefs.dateFormat}
              onValueChange={(value) =>
                setLocalPrefs({ ...localPrefs, dateFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato de Hora</Label>
            <Select
              value={localPrefs.timeFormat}
              onValueChange={(value: '12h' | '24h') =>
                setLocalPrefs({ ...localPrefs, timeFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas (14:30)</SelectItem>
                <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TabIntegracaoProps {
  user: any
}

export function TabIntegracao({ user }: TabIntegracaoProps) {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações Disponíveis</CardTitle>
          <CardDescription>
            Gerencie as integrações com sistemas externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">e-SUS PEC</h4>
              <p className="text-sm text-gray-500">
                Sistema de Prontuário Eletrônico do Cidadão
              </p>
            </div>
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Configurar
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Email Server</h4>
              <p className="text-sm text-gray-500">
                Servidor de email Ultrazend
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Ativo
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">WhatsApp Business</h4>
              <p className="text-sm text-gray-500">
                Notificações via WhatsApp
              </p>
            </div>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              Não Configurado
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">SMS Gateway</h4>
              <p className="text-sm text-gray-500">
                Envio de SMS para cidadãos
              </p>
            </div>
            <Badge variant="outline" className="text-gray-600 border-gray-600">
              Não Configurado
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TabSegurancaProps {
  passwordData: any
  setPasswordData: (data: any) => void
  showPassword: any
  setShowPassword: (show: any) => void
  handleChangePassword: () => void
  sessions: UserSession[]
  handleLoadSessions: () => void
  handleRevokeSession: (sessionId: string) => void
  handleRevokeAllSessions: () => void
  saving: boolean
}

export function TabSeguranca({
  passwordData,
  setPasswordData,
  showPassword,
  setShowPassword,
  handleChangePassword,
  sessions,
  handleLoadSessions,
  handleRevokeSession,
  handleRevokeAllSessions,
  saving
}: TabSegurancaProps) {
  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />
      case 'tablet':
        return <Monitor className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPassword({ ...showPassword, current: !showPassword.current })
                }
              >
                {showPassword.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
              >
                {showPassword.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Mínimo de 6 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                }
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleChangePassword} disabled={saving}>
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Gerencie os dispositivos conectados à sua conta
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSessions}
              >
                Atualizar
              </Button>
              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAllSessions}
                  className="text-red-600 hover:text-red-700"
                >
                  Encerrar Todas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhuma sessão ativa encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{session.browser || 'Navegador Desconhecido'}</h4>
                        <Badge variant="outline" className="text-xs">
                          {session.device || 'desktop'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {session.os || 'Sistema Desconhecido'}
                      </p>
                      {session.ipAddress && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.ipAddress} {session.location && `• ${session.location}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Última atividade: {format(new Date(session.lastActivity), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface TabAvancadoProps {
  localPrefs: UserPreferences | null
  setLocalPrefs: (prefs: UserPreferences | null) => void
}

export function TabAvancado({ localPrefs, setLocalPrefs }: TabAvancadoProps) {
  if (!localPrefs) return null

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Visualização de Protocolos</CardTitle>
          <CardDescription>
            Configurar como os protocolos são exibidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Visualização Padrão</Label>
            <Select
              value={localPrefs.defaultProtocolView}
              onValueChange={(value: 'table' | 'grid' | 'kanban') =>
                setLocalPrefs({ ...localPrefs, defaultProtocolView: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Tabela</SelectItem>
                <SelectItem value="grid">Grade</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Protocolos por Página</Label>
            <Select
              value={String(localPrefs.protocolsPerPage)}
              onValueChange={(value) =>
                setLocalPrefs({ ...localPrefs, protocolsPerPage: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Arquivados por Padrão</Label>
              <p className="text-sm text-gray-500">
                Incluir protocolos arquivados na listagem
              </p>
            </div>
            <Switch
              checked={localPrefs.showArchivedByDefault}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, showArchivedByDefault: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo Desenvolvedor</CardTitle>
          <CardDescription>
            Opções avançadas para desenvolvedores e depuração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Modo Desenvolvedor</Label>
              <p className="text-sm text-gray-500">
                Habilitar console de debug e ferramentas avançadas
              </p>
            </div>
            <Switch
              checked={localPrefs.developerMode}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, developerMode: checked })
              }
            />
          </div>

          {localPrefs.developerMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Modo Desenvolvedor Ativo</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este modo é destinado apenas para desenvolvedores. Algumas funcionalidades
                    podem expor informações sensíveis do sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
