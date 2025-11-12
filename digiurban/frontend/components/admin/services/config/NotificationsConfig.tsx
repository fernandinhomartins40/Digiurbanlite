'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'

interface NotificationsConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

interface Notification {
  id: string
  name: string
  trigger: string
  channel: string
  recipients: string
  subject?: string
  body: string
  isActive: boolean
}

export function NotificationsConfig({ formData, onChange }: NotificationsConfigProps) {
  const config = formData.notificationsConfig || {
    notifications: [],
  }

  const [editingNotif, setEditingNotif] = useState<string | null>(null)

  const updateConfig = (updates: any) => {
    onChange('notificationsConfig', { ...config, ...updates })
  }

  const addNotification = () => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      name: 'Nova Notificação',
      trigger: 'created',
      channel: 'email',
      recipients: 'citizen',
      body: 'Olá {{citizenName}}, seu protocolo {{protocolNumber}} foi criado.',
      isActive: true,
    }
    updateConfig({ notifications: [...config.notifications, newNotif] })
    setEditingNotif(newNotif.id)
  }

  const removeNotification = (notifId: string) => {
    updateConfig({ notifications: config.notifications.filter((n: Notification) => n.id !== notifId) })
    if (editingNotif === notifId) setEditingNotif(null)
  }

  const updateNotification = (notifId: string, updates: any) => {
    updateConfig({
      notifications: config.notifications.map((n: Notification) =>
        n.id === notifId ? { ...n, ...updates } : n
      ),
    })
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />
      case 'sms':
        return <MessageSquare className="h-3 w-3" />
      case 'push':
        return <Smartphone className="h-3 w-3" />
      case 'whatsapp':
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      created: 'Protocolo Criado',
      updated: 'Status Atualizado',
      completed: 'Concluído',
      stage_change: 'Mudança de Etapa',
      deadline_near: 'Prazo Próximo',
    }
    return labels[trigger] || trigger
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Sistema de Notificações
              </CardTitle>
              <CardDescription>
                {config.notifications.length} notificação{config.notifications.length !== 1 ? 'ões' : ''} configurada{config.notifications.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={addNotification} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Notificação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.notifications.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">Nenhuma notificação configurada</p>
              <p className="text-xs text-gray-500 mt-2">
                Configure notificações automáticas por email, SMS, WhatsApp ou Push
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.notifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    notif.isActive ? 'hover:border-red-300' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{notif.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getChannelIcon(notif.channel)}
                            <span className="ml-1">{notif.channel}</span>
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getTriggerLabel(notif.trigger)}
                          </Badge>
                          {!notif.isActive && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNotif(editingNotif === notif.id ? null : notif.id)}
                          >
                            {editingNotif === notif.id ? 'Fechar' : 'Editar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notif.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2">{notif.body}</p>

                      {editingNotif === notif.id && (
                        <div className="space-y-4 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                              <Label className="text-xs">Nome da Notificação</Label>
                              <Input
                                value={notif.name}
                                onChange={(e) => updateNotification(notif.id, { name: e.target.value })}
                                placeholder="Ex: Confirmação de Protocolo"
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Quando Enviar (Trigger)</Label>
                              <Select
                                value={notif.trigger}
                                onValueChange={(value) => updateNotification(notif.id, { trigger: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="created">Protocolo Criado</SelectItem>
                                  <SelectItem value="updated">Status Atualizado</SelectItem>
                                  <SelectItem value="completed">Concluído</SelectItem>
                                  <SelectItem value="stage_change">Mudança de Etapa</SelectItem>
                                  <SelectItem value="deadline_near">Prazo Próximo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Canal de Envio</Label>
                              <Select
                                value={notif.channel}
                                onValueChange={(value) => updateNotification(notif.id, { channel: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="sms">SMS</SelectItem>
                                  <SelectItem value="push">Push Notification</SelectItem>
                                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                  <SelectItem value="all">Todos os Canais</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Destinatários</Label>
                              <Select
                                value={notif.recipients}
                                onValueChange={(value) => updateNotification(notif.id, { recipients: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="citizen">Cidadão</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="department">Departamento Responsável</SelectItem>
                                  <SelectItem value="all">Todos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {(notif.channel === 'email' || notif.channel === 'all') && (
                              <div className="space-y-2">
                                <Label className="text-xs">Assunto do Email</Label>
                                <Input
                                  value={notif.subject || ''}
                                  onChange={(e) => updateNotification(notif.id, { subject: e.target.value })}
                                  placeholder="Ex: Protocolo {{protocolNumber}} criado"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            <div className="space-y-2 col-span-2">
                              <Label className="text-xs">Mensagem</Label>
                              <Textarea
                                value={notif.body}
                                onChange={(e) => updateNotification(notif.id, { body: e.target.value })}
                                placeholder="Use variáveis: {{protocolNumber}}, {{citizenName}}, {{status}}"
                                rows={4}
                                className="text-sm"
                              />
                              <p className="text-xs text-gray-500">
                                Variáveis disponíveis: {'{{protocolNumber}}'}, {'{{citizenName}}'}, {'{{status}}'}, {'{{date}}'}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 col-span-2">
                              <Checkbox
                                id={`active_${notif.id}`}
                                checked={notif.isActive}
                                onCheckedChange={(checked) => updateNotification(notif.id, { isActive: checked })}
                              />
                              <Label htmlFor={`active_${notif.id}`} className="text-xs cursor-pointer">
                                Notificação ativa
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {config.notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-900">
              <strong>💡 Canais Disponíveis:</strong> Email (sempre disponível), SMS e WhatsApp (requerem
              configuração de integração), Push (app mobile). Configure as integrações em Configurações do Sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
