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
  code: string
  monthlyPrice: number
  maxEmailsPerMonth: number
  maxAccounts: number
  features: string[]
  isActive: boolean
  recommended?: boolean
}

interface EmailConfig {
  hasEmailService: boolean
  plan: {
    id: string
    name: string
    code: string
    price: number
    emailsPerMonth: number
    maxAccounts: number
  }
  server?: {
    hostname: string
    isActive: boolean
    subscription: {
      planConfig: {
        maxEmailsPerMonth: number
      }
    }
  }
  domains: any[]
  accounts: any[]
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

export default function EmailServiceManagement() {
  const [activeTab, setActiveTab] = useState<'plans' | 'domains' | 'stats' | 'templates' | 'settings'>('plans')
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [availablePlans, setAvailablePlans] = useState<EmailPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeDialog, setSubscribeDialog] = useState<{ open: boolean; plan?: EmailPlan }>({ open: false })
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; credentials?: any }>({ open: false })
  const [newDomain, setNewDomain] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templateDialog, setTemplateDialog] = useState(false)

  useEffect(() => {
    loadEmailConfig()
    loadAvailablePlans()
  }, [])

  useEffect(() => {
    if (emailConfig?.hasEmailService) {
      loadEmailStats()
      loadTemplates()
    }
  }, [emailConfig])

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/email-service', {
        credentials: 'include' // ✅ Enviar cookie de autenticação
      })
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

  const loadAvailablePlans = async () => {
    try {
      const response = await fetch('/api/admin/email-service/available-plans', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success && data.plans) {
        // Marcar o plano "STANDARD" como recomendado
        const plansWithRecommendation = data.plans.map((plan: EmailPlan) => ({
          ...plan,
          recommended: plan.code === 'STANDARD'
        }))
        setAvailablePlans(plansWithRecommendation)
      }
    } catch (error) {
      console.error('Error loading available plans:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar planos disponíveis',
        variant: 'destructive'
      })
    }
  }

  const loadEmailStats = async () => {
    try {
      const response = await fetch('/api/admin/email-service/stats', {
        credentials: 'include' // ✅ Enviar cookie de autenticação
      })
      const data = await response.json()
      setEmailStats(data)
    } catch (error) {
      console.error('Error loading email stats:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-service/templates', {
        credentials: 'include' // ✅ Enviar cookie de autenticação
      })
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
        credentials: 'include', // ✅ Enviar cookie de autenticação
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
        credentials: 'include', // ✅ Enviar cookie de autenticação
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

  const getPlanIcon = (planCode: string) => {
    switch (planCode.toUpperCase()) {
      case 'BASIC': return <Mail className="h-5 w-5" />
      case 'STANDARD': return <Zap className="h-5 w-5" />
      case 'PREMIUM': return <Rocket className="h-5 w-5" />
      case 'ENTERPRISE': return <Crown className="h-5 w-5" />
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Server className="h-5 w-5 md:h-6 md:w-6" />
            Serviço de Email Próprio
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seu servidor de email municipal independente
          </p>
        </div>

        {emailConfig?.hasEmailService && (
          <div className="flex items-center gap-2 flex-wrap">
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
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-5 min-w-max md:min-w-0">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Planos</span>
            </TabsTrigger>
            <TabsTrigger value="domains" disabled={!emailConfig?.hasEmailService} className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Domínios</span>
            </TabsTrigger>
            <TabsTrigger value="stats" disabled={!emailConfig?.hasEmailService} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger value="templates" disabled={!emailConfig?.hasEmailService} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!emailConfig?.hasEmailService} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Planos */}
        <TabsContent value="plans" className="space-y-6">
          {!emailConfig?.hasEmailService && (
            <Card className="p-4 sm:p-6 bg-blue-50 border-blue-200">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Servidor de Email Próprio
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Tenha total independência com seu próprio servidor de email municipal.
                Domínio personalizado, entrega direta e controle completo.
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Domínio personalizado (prefeitura.com.br)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Entrega direta sem dependência de terceiros</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>DKIM/SPF automático para reputação</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Servidor dedicado para sua prefeitura</span>
                </li>
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {availablePlans.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Carregando planos disponíveis...</p>
              </div>
            ) : (
              availablePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative p-4 sm:p-6 transition-all hover:shadow-lg ${
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
                      <Badge className="bg-blue-500 text-white text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Recomendado
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      {getPlanIcon(plan.code)}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">R$ {plan.monthlyPrice}</span>
                      <span className="text-sm sm:text-base text-gray-600">/mês</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {plan.maxEmailsPerMonth === -1 || plan.maxEmailsPerMonth >= 999999
                        ? 'Emails ilimitados'
                        : `${plan.maxEmailsPerMonth.toLocaleString()} emails/mês`
                      }
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6 min-h-[120px]">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => setSubscribeDialog({ open: true, plan })}
                    disabled={subscribing || emailConfig?.plan.id === plan.id}
                    className={`w-full text-sm ${
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
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab: Domínios */}
        <TabsContent value="domains" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configurar Domínio de Email</h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="prefeitura.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <Button onClick={addDomain} disabled={!newDomain.trim()} className="sm:w-auto">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{domain.domainName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicionado em {new Date(domain.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
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
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Ver DNS</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Emails Enviados</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {emailStats.currentMonth.totalSent.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 ml-2">
                      <Send className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground break-words">
                      de {emailStats.usage.limit.toLocaleString()} este mês ({emailStats.usage.percentage})
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Taxa de Entrega</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {emailStats.currentMonth.deliveryRate}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center flex-shrink-0 ml-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Taxa de Bounces</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">
                        {emailStats.currentMonth.bounceRate}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0 ml-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Entregues</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {emailStats.currentMonth.totalDelivered.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0 ml-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4">Uso do Plano</h2>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                    <span>Emails utilizados este mês</span>
                    <span className="font-semibold">{emailStats.usage.current.toLocaleString()} de {emailStats.usage.limit.toLocaleString()}</span>
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
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
              <h2 className="text-base sm:text-lg font-semibold">Templates de Email</h2>
              <Button onClick={() => setTemplateDialog(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base break-words">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{template.subject}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                          {template.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
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
          <Card className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Configurações do Servidor</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="senderName" className="text-sm">Nome do Remetente Padrão</Label>
                <Input
                  id="senderName"
                  defaultValue="Prefeitura Municipal"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="senderEmail" className="text-sm">Email Padrão do Remetente</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  defaultValue="noreply@prefeitura.com.br"
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Switch id="trackOpens" defaultChecked />
                <Label htmlFor="trackOpens" className="text-sm cursor-pointer">Rastrear aberturas de email</Label>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Switch id="trackClicks" defaultChecked />
                <Label htmlFor="trackClicks" className="text-sm cursor-pointer">Rastrear cliques em links</Label>
              </div>

              <Button className="w-full sm:w-auto">
                Salvar Configurações
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Informações do Servidor</h2>

            {emailConfig?.server && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium">Hostname:</span>
                  <code className="text-xs sm:text-sm break-all">{emailConfig.server.hostname}</code>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium">Porta SMTP:</span>
                  <code className="text-xs sm:text-sm">587</code>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium">Segurança:</span>
                  <code className="text-xs sm:text-sm">STARTTLS</code>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium">Status:</span>
                  <Badge variant={emailConfig.server.isActive ? 'default' : 'secondary'} className="text-xs w-fit">
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
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Contratar Plano {subscribeDialog.plan?.name}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Você está prestes a contratar o plano {subscribeDialog.plan?.name} por R$ {subscribeDialog.plan?.monthlyPrice}/mês.
              {subscribeDialog.plan?.maxEmailsPerMonth === -1 || (subscribeDialog.plan?.maxEmailsPerMonth ?? 0) >= 999999
                ? ' Este plano inclui emails ilimitados.'
                : ` Este plano inclui ${subscribeDialog.plan?.maxEmailsPerMonth.toLocaleString()} emails por mês.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => subscribeDialog.plan && subscribeToPlan(subscribeDialog.plan.id)}
              disabled={subscribing}
              className="w-full sm:w-auto"
            >
              {subscribing ? 'Processando...' : 'Confirmar Contratação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Credenciais SMTP */}
      <Dialog open={credentialsDialog.open} onOpenChange={(open) => setCredentialsDialog({ open })}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Credenciais do Servidor SMTP</DialogTitle>
            <DialogDescription className="text-sm">
              Guarde estas informações em local seguro. Elas serão necessárias para configurar seu cliente de email.
            </DialogDescription>
          </DialogHeader>

          {credentialsDialog.credentials && (
            <div className="space-y-4">
              <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs">Servidor SMTP</Label>
                  <p className="font-mono text-xs sm:text-sm break-all">{credentialsDialog.credentials.server}</p>
                </div>
                <div>
                  <Label className="text-xs">Porta</Label>
                  <p className="font-mono text-xs sm:text-sm">{credentialsDialog.credentials.port}</p>
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <p className="font-mono text-xs sm:text-sm break-all">{credentialsDialog.credentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <p className="font-mono text-xs sm:text-sm bg-yellow-100 p-2 rounded break-all">
                    {credentialsDialog.credentials.password}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  <strong>Importante:</strong> Guarde esta senha em local seguro.
                  Ela não será mostrada novamente por motivos de segurança.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => credentialsDialog.credentials && copyCredentials(credentialsDialog.credentials)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Credenciais
            </Button>
            <Button onClick={() => setCredentialsDialog({ open: false })} className="w-full sm:w-auto">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}