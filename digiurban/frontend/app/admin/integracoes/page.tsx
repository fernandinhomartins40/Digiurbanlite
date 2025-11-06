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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Building2,
  Users,
  Heart,
  GraduationCap,
  Car,
  MapPin,
  MessageSquare,
  Mail,
  Smartphone,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  Activity,
  Clock,
  Search,
  Zap,
  Globe,
  Shield,
  FileText,
  Database,
  Link
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Integration {
  id: string
  name: string
  type: string
  provider: string
  isActive: boolean
  lastSync?: string
  config: any
  logs: {
    id: string
    action: string
    status: string
    createdAt: string
  }[]
}

interface IntegrationProvider {
  id: string
  name: string
  type: 'government' | 'banking' | 'communication' | 'health' | 'education'
  icon: React.ReactNode
  description: string
  status: 'available' | 'limited' | 'unavailable'
  features: string[]
  setupRequired: boolean
}

const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  // Governamentais
  {
    id: 'receita-federal',
    name: 'Receita Federal',
    type: 'government',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Consulta de CPF e CNPJ na base oficial da Receita Federal',
    status: 'available',
    features: ['Validação de CPF', 'Consulta CNPJ', 'Situação cadastral'],
    setupRequired: true
  },
  {
    id: 'ibge',
    name: 'IBGE',
    type: 'government',
    icon: <MapPin className="h-5 w-5" />,
    description: 'Dados demográficos e códigos de localidades',
    status: 'available',
    features: ['Códigos de municípios', 'Dados populacionais', 'Divisões territoriais'],
    setupRequired: false
  },
  {
    id: 'datasus',
    name: 'DataSUS',
    type: 'health',
    icon: <Heart className="h-5 w-5" />,
    description: 'Integração com sistemas de saúde do Ministério da Saúde',
    status: 'limited',
    features: ['Validação Cartão SUS', 'CNES', 'Dados epidemiológicos'],
    setupRequired: true
  },
  {
    id: 'tse',
    name: 'TSE - Título Eleitor',
    type: 'government',
    icon: <Users className="h-5 w-5" />,
    description: 'Validação de títulos eleitorais',
    status: 'unavailable',
    features: ['Validação de formato', 'Consulta local'],
    setupRequired: false
  },

  // Comunicação
  {
    id: 'viacep',
    name: 'ViaCEP',
    type: 'communication',
    icon: <MapPin className="h-5 w-5" />,
    description: 'Consulta gratuita de CEP e endereços',
    status: 'available',
    features: ['Consulta CEP', 'Dados de endereço', 'API gratuita'],
    setupRequired: false
  },
  {
    id: 'zenvia-sms',
    name: 'Zenvia SMS',
    type: 'communication',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Envio de SMS para notificações municipais',
    status: 'available',
    features: ['SMS em massa', 'Confirmação entrega', 'Templates'],
    setupRequired: true
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    type: 'communication',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Atendimento cidadão via WhatsApp oficial',
    status: 'available',
    features: ['Chat automatizado', 'Templates aprovados', 'API oficial'],
    setupRequired: true
  },

  // Financeiro
  {
    id: 'pix-bacen',
    name: 'PIX - Banco Central',
    type: 'banking',
    icon: <Zap className="h-5 w-5" />,
    description: 'Recebimento de pagamentos via PIX',
    status: 'available',
    features: ['QR Code dinâmico', 'Webhooks', 'Pagamento 24/7'],
    setupRequired: true
  }
]

export default function IntegrationsManagement() {
  const [activeTab, setActiveTab] = useState<'available' | 'configured' | 'logs'>('available')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [setupDialog, setSetupDialog] = useState<{ open: boolean; provider?: IntegrationProvider }>({ open: false })
  const [testDialog, setTestDialog] = useState<{ open: boolean; integration?: Integration }>({ open: false })
  const [testing, setTesting] = useState(false)
  const [setupForm, setSetupForm] = useState<any>({})
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    loadIntegrations()
    loadLogs()
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      const data = await response.json()
      setIntegrations(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar integrações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/integrations/logs?limit=50')
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const setupIntegration = async () => {
    if (!setupDialog.provider) return

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: setupDialog.provider.name,
          type: setupDialog.provider.type,
          provider: setupDialog.provider.id,
          config: setupForm.config || {},
          credentials: setupForm.credentials || {}
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Integração configurada com sucesso'
        })
        await loadIntegrations()
        setSetupDialog({ open: false })
        setSetupForm({})
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao configurar integração')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao configurar integração',
        variant: 'destructive'
      })
    }
  }

  const testIntegration = async (integration: Integration) => {
    setTesting(true)
    try {
      const response = await fetch(`/api/integrations/${integration.provider}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Teste Bem-sucedido',
          description: 'A integração está funcionando corretamente'
        })
      } else {
        toast({
          title: 'Teste Falhou',
          description: result.error || 'A integração não está funcionando',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao testar integração',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
      setTestDialog({ open: false })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'limited': return 'text-yellow-600'
      case 'unavailable': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="h-4 w-4" />
      case 'limited': return <AlertTriangle className="h-4 w-4" />
      case 'unavailable': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'government': return <Building2 className="h-4 w-4" />
      case 'banking': return <Zap className="h-4 w-4" />
      case 'communication': return <MessageSquare className="h-4 w-4" />
      case 'health': return <Heart className="h-4 w-4" />
      case 'education': return <GraduationCap className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'government': return 'Governamental'
      case 'banking': return 'Bancário/Financeiro'
      case 'communication': return 'Comunicação'
      case 'health': return 'Saúde'
      case 'education': return 'Educação'
      default: return 'Outro'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando integrações...</span>
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
            <Link className="h-6 w-6" />
            Integrações Externas
          </h1>
          <p className="text-muted-foreground">
            Configure integrações com sistemas governamentais e serviços externos
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            {integrations.filter(i => i.isActive).length} ativas
          </Badge>
          <Badge variant="outline">
            {integrations.length} configuradas
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Disponíveis
          </TabsTrigger>
          <TabsTrigger value="configured" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuradas
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Integrações Disponíveis */}
        <TabsContent value="available" className="space-y-6">
          <div className="grid gap-6">
            {['government', 'communication', 'banking', 'health'].map(type => (
              <Card key={type} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {getTypeIcon(type)}
                  <h2 className="text-lg font-semibold">{getTypeLabel(type)}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INTEGRATION_PROVIDERS.filter(p => p.type === type).map(provider => {
                    const isConfigured = integrations.some(i => i.provider === provider.id)

                    return (
                      <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {provider.icon}
                            <h3 className="font-semibold text-sm">{provider.name}</h3>
                          </div>

                          <div className={`flex items-center gap-1 ${getStatusColor(provider.status)}`}>
                            {getStatusIcon(provider.status)}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          {provider.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          {provider.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        {provider.status === 'available' ? (
                          isConfigured ? (
                            <Badge variant="default" className="w-full justify-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Configurado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setSetupDialog({ open: true, provider })}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Configurar
                            </Button>
                          )
                        ) : provider.status === 'limited' ? (
                          <Badge variant="secondary" className="w-full justify-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Requer credenciamento
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-full justify-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não disponível
                          </Badge>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Integrações Configuradas */}
        <TabsContent value="configured" className="space-y-6">
          {integrations.length === 0 ? (
            <Card className="p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
              <p className="text-muted-foreground mb-4">
                Configure integrações para automatizar processos e validações
              </p>
              <Button onClick={() => setActiveTab('available')}>
                Ver Integrações Disponíveis
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {integrations.map(integration => (
                <Card key={integration.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(integration.type)}
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Provider: {integration.provider}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                        {integration.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>

                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Última sincronização: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTestDialog({ open: true, integration })}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Testar
                        </Button>

                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {integration.logs.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Últimas atividades:</h4>
                      <div className="space-y-1">
                        {integration.logs.slice(0, 3).map(log => (
                          <div key={log.id} className="flex items-center gap-2 text-xs">
                            <Badge
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                              className="w-16 justify-center"
                            >
                              {log.status}
                            </Badge>
                            <span>{log.action}</span>
                            <span className="text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log de Atividades</h2>
              <Button size="sm" variant="outline" onClick={loadLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'destructive'}
                    className="w-20 justify-center"
                  >
                    {log.status}
                  </Badge>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.integration?.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm">{log.action}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.entityType}: {log.entityId}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Configurar Integração */}
      <Dialog open={setupDialog.open} onOpenChange={(open) => setSetupDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configurar {setupDialog.provider?.name}
            </DialogTitle>
            <DialogDescription>
              {setupDialog.provider?.description}
            </DialogDescription>
          </DialogHeader>

          {setupDialog.provider && (
            <div className="space-y-4">
              {setupDialog.provider.setupRequired ? (
                <div className="space-y-4">
                  <div>
                    <Label>Configurações da API</Label>
                    <Textarea
                      placeholder="Insira as configurações em JSON (opcional)"
                      value={setupForm.config || ''}
                      onChange={(e) => setSetupForm({ ...setupForm, config: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Credenciais</Label>
                    <Textarea
                      placeholder="Insira as credenciais em JSON (chaves de API, tokens, etc.)"
                      value={setupForm.credentials || ''}
                      onChange={(e) => setSetupForm({ ...setupForm, credentials: e.target.value })}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      <strong>Segurança:</strong> As credenciais são criptografadas e armazenadas com segurança.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    Esta integração não requer configuração adicional.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Recursos disponíveis:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {setupDialog.provider.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSetupDialog({ open: false })}
            >
              Cancelar
            </Button>
            <Button onClick={setupIntegration}>
              Configurar Integração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Testar Integração */}
      <AlertDialog open={testDialog.open} onOpenChange={(open) => setTestDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Testar Integração
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja testar a conectividade com {testDialog.integration?.name}?
              Isso verificará se as credenciais e configurações estão corretas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => testDialog.integration && testIntegration(testDialog.integration)}
              disabled={testing}
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                'Executar Teste'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}