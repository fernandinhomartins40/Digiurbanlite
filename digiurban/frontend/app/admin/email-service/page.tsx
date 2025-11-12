'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Server,
  Globe,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Plus,
  Edit,
  Eye,
  Crown,
  Zap,
  Rocket,
  Star,
  Clock,
  TrendingUp,
  Users,
  Send
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface EmailPlan {
  id: string
  name: string
  monthlyPrice: number
  emailsPerMonth: number
  features: string[]
  recommended?: boolean
}

interface EmailConfig {
  hasEmailService: boolean
  plan: {
    id: string
    name: string
    price: number
    emailsPerMonth: number
  }
  server?: {
    hostname: string
    isActive: boolean
    maxEmailsPerMonth: number
  }
  domains: any[]
  statistics: any[]
  usage: {
    currentMonth: number
  }
}

interface EmailStats {
  currentMonth: {
    totalSent: number
    totalDelivered: number
    totalFailed: number
    totalBounced: number
    deliveryRate: string
    bounceRate: string
  }
  usage: {
    current: number
    limit: number
    percentage: string
  }
  dailyStats: any[]
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  category: string
  isActive: boolean
}

const EMAIL_PLANS: EmailPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    monthlyPrice: 49,
    emailsPerMonth: 5000,
    features: ['5.000 emails/mês', 'Domínio personalizado', 'DKIM/SPF automático', 'Suporte básico']
  },
  {
    id: 'standard',
    name: 'Padrão',
    monthlyPrice: 99,
    emailsPerMonth: 15000,
    features: ['15.000 emails/mês', 'Múltiplos domínios', 'Templates personalizados', 'Estatísticas avançadas'],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 199,
    emailsPerMonth: 50000,
    features: ['50.000 emails/mês', 'API completa', 'Automações avançadas', 'Suporte prioritário']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 399,
    emailsPerMonth: -1,
    features: ['Emails ilimitados', 'Servidor dedicado', 'SLA garantido', 'Suporte 24/7']
  }
]

export default function EmailServiceManagement() {
  const [activeTab, setActiveTab] = useState<'plans' | 'domains' | 'stats' | 'templates' | 'settings'>('plans')
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeDialog, setSubscribeDialog] = useState<{ open: boolean; plan?: EmailPlan }>({ open: false })
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; credentials?: any }>({ open: false })
  const [newDomain, setNewDomain] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templateDialog, setTemplateDialog] = useState(false)

  useEffect(() => {
    loadEmailConfig()
  }, [])

  useEffect(() => {
    if (emailConfig?.hasEmailService) {
      loadEmailStats()
      loadTemplates()
    }
  }, [emailConfig])

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/email-service')
      const data = await response.json()
      setEmailConfig(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações de email',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEmailStats = async () => {
    try {
      const response = await fetch('/api/admin/email-service/stats')
      const data = await response.json()
      setEmailStats(data)
    } catch (error) {
      console.error('Error loading email stats:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-service/templates')
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const subscribeToPlan = async (planId: string) => {
    setSubscribing(true)
    try {
      const response = await fetch('/api/admin/email-service/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      })

      const result = await response.json()

      if (response.ok) {
        setCredentialsDialog({ open: true, credentials: result.credentials })
        await loadEmailConfig()
        toast({
          title: 'Sucesso',
          description: result.message
        })
      } else {
        throw new Error(result.error || 'Erro ao contratar plano')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao contratar plano',
        variant: 'destructive'
      })
    } finally {
      setSubscribing(false)
      setSubscribeDialog({ open: false })
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return

    try {
      const response = await fetch('/api/admin/email-service/domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: newDomain })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: result.message
        })
        setNewDomain('')
        await loadEmailConfig()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar domínio',
        variant: 'destructive'
      })
    }
  }

  const copyCredentials = (credentials: any) => {
    const text = `Servidor SMTP: ${credentials.server}
Porta: ${credentials.port}
Email: ${credentials.email}
Senha: ${credentials.password}`

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copiado',
        description: 'Credenciais copiadas para a área de transferência'
      })
    })
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Mail className="h-5 w-5" />
      case 'standard': return <Zap className="h-5 w-5" />
      case 'premium': return <Rocket className="h-5 w-5" />
      case 'enterprise': return <Crown className="h-5 w-5" />
      default: return <Mail className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Serviço de Email Próprio
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu servidor de email municipal independente
          </p>
        </div>

        {emailConfig?.hasEmailService && (
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Serviço Ativo
            </Badge>
            <span className="text-sm text-muted-foreground">
              Plano: {emailConfig.plan.name}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="domains" disabled={!emailConfig?.hasEmailService}>
            <Globe className="h-4 w-4 mr-2" />
            Domínios
          </TabsTrigger>
          <TabsTrigger value="stats" disabled={!emailConfig?.hasEmailService}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="templates" disabled={!emailConfig?.hasEmailService}>
            <Mail className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!emailConfig?.hasEmailService}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Planos */}
        <TabsContent value="plans" className="space-y-6">
          {!emailConfig?.hasEmailService && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Servidor de Email Próprio
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Tenha total independência com seu próprio servidor de email municipal.
                Domínio personalizado, entrega direta e controle completo.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Domínio personalizado (prefeitura.com.br)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Entrega direta sem dependência de terceiros
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  DKIM/SPF automático para reputação
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Servidor dedicado para sua prefeitura
                </li>
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {EMAIL_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-6 transition-all hover:shadow-lg ${
                  plan.recommended
                    ? 'border-blue-500 shadow-lg bg-blue-50/30'
                    : 'border-gray-200'
                } ${
                  emailConfig?.plan.id === plan.id
                    ? 'bg-green-50 border-green-500'
                    : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Recomendado
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">R$ {plan.monthlyPrice}</span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.emailsPerMonth === -1
                      ? 'Emails ilimitados'
                      : `${plan.emailsPerMonth.toLocaleString()} emails/mês`
                    }
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setSubscribeDialog({ open: true, plan })}
                  disabled={subscribing || emailConfig?.plan.id === plan.id}
                  className={`w-full ${
                    emailConfig?.plan.id === plan.id
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }`}
                  variant={
                    emailConfig?.plan.id === plan.id
                      ? 'secondary'
                      : plan.recommended
                      ? 'default'
                      : 'outline'
                  }
                >
                  {emailConfig?.plan.id === plan.id ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Plano Atual
                    </>
                  ) : subscribing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : emailConfig?.hasEmailService ? (
                    'Alterar Plano'
                  ) : (
                    'Contratar'
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Domínios */}
        <TabsContent value="domains" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configurar Domínio de Email</h2>

            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="prefeitura.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <Button onClick={addDomain} disabled={!newDomain.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Domínio
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Domínio Padrão Disponível
              </h4>
              <p className="text-yellow-700 text-sm mb-2">
                Você pode usar o domínio padrão da DigiUrban enquanto configura seu domínio personalizado:
              </p>
              <code className="bg-white px-2 py-1 rounded text-sm">
                suaprefeitura.digiurban.com.br
              </code>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Domínios Configurados</h2>

            {emailConfig?.domains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum domínio configurado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailConfig?.domains.map((domain: any) => (
                  <Card key={domain.id} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{domain.domainName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicionado em {new Date(domain.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant={domain.isVerified ? 'default' : 'secondary'}>
                          {domain.isVerified ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verificado
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </>
                          )}
                        </Badge>

                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver DNS
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab: Estatísticas */}
        <TabsContent value="stats" className="space-y-6">
          {emailStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Emails Enviados</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {emailStats.currentMonth.totalSent.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <Send className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      de {emailStats.usage.limit.toLocaleString()} este mês ({emailStats.usage.percentage})
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                      <p className="text-2xl font-bold text-green-600">
                        {emailStats.currentMonth.deliveryRate}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Bounces</p>
                      <p className="text-2xl font-bold text-red-600">
                        {emailStats.currentMonth.bounceRate}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Entregues</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {emailStats.currentMonth.totalDelivered.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Uso do Plano</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Emails utilizados este mês</span>
                    <span>{emailStats.usage.current.toLocaleString()} de {emailStats.usage.limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, parseFloat(emailStats.usage.percentage))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {emailStats.usage.percentage} do limite mensal utilizado
                  </p>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Templates de Email</h2>
              <Button onClick={() => setTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configurações do Servidor</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="senderName">Nome do Remetente Padrão</Label>
                <Input
                  id="senderName"
                  defaultValue="Prefeitura Municipal"
                />
              </div>

              <div>
                <Label htmlFor="senderEmail">Email Padrão do Remetente</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  defaultValue="noreply@prefeitura.com.br"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="trackOpens" defaultChecked />
                <Label htmlFor="trackOpens">Rastrear aberturas de email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="trackClicks" defaultChecked />
                <Label htmlFor="trackClicks">Rastrear cliques em links</Label>
              </div>

              <Button>
                Salvar Configurações
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações do Servidor</h2>

            {emailConfig?.server && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Hostname:</span>
                  <code className="text-sm">{emailConfig.server.hostname}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Porta SMTP:</span>
                  <code className="text-sm">587</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Segurança:</span>
                  <code className="text-sm">STARTTLS</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={emailConfig.server.isActive ? 'default' : 'secondary'}>
                    {emailConfig.server.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Confirmar Assinatura */}
      <AlertDialog open={subscribeDialog.open} onOpenChange={(open) => setSubscribeDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contratar Plano {subscribeDialog.plan?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a contratar o plano {subscribeDialog.plan?.name} por R$ {subscribeDialog.plan?.monthlyPrice}/mês.
              {subscribeDialog.plan?.emailsPerMonth === -1
                ? ' Este plano inclui emails ilimitados.'
                : ` Este plano inclui ${subscribeDialog.plan?.emailsPerMonth.toLocaleString()} emails por mês.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => subscribeDialog.plan && subscribeToPlan(subscribeDialog.plan.id)}
              disabled={subscribing}
            >
              {subscribing ? 'Processando...' : 'Confirmar Contratação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Credenciais SMTP */}
      <Dialog open={credentialsDialog.open} onOpenChange={(open) => setCredentialsDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciais do Servidor SMTP</DialogTitle>
            <DialogDescription>
              Guarde estas informações em local seguro. Elas serão necessárias para configurar seu cliente de email.
            </DialogDescription>
          </DialogHeader>

          {credentialsDialog.credentials && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs">Servidor SMTP</Label>
                  <p className="font-mono text-sm">{credentialsDialog.credentials.server}</p>
                </div>
                <div>
                  <Label className="text-xs">Porta</Label>
                  <p className="font-mono text-sm">{credentialsDialog.credentials.port}</p>
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <p className="font-mono text-sm">{credentialsDialog.credentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <p className="font-mono text-sm bg-yellow-100 p-2 rounded">
                    {credentialsDialog.credentials.password}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  <strong>Importante:</strong> Guarde esta senha em local seguro.
                  Ela não será mostrada novamente por motivos de segurança.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => credentialsDialog.credentials && copyCredentials(credentialsDialog.credentials)}
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Credenciais
            </Button>
            <Button onClick={() => setCredentialsDialog({ open: false })}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}