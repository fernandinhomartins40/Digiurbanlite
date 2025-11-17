'use client'

import React, { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  Settings,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'

export interface PageSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  component: ReactNode
  permissions?: string[]
  stats?: {
    total: number
    completed: number
    pending: number
  }
}

export interface PageAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  permissions?: string[]
}

export interface BasePageTemplateProps {
  // Header Configuration
  title: string
  description: string
  secretaria: string
  pageName: string

  // Page Sections
  sections: PageSection[]

  // Quick Actions
  quickActions?: PageAction[]

  // Stats Overview
  stats?: {
    protocolsAtivos: number
    servicosDisponiveis: number
    atendimentosMes: number
    tempoMedioAtendimento: number
  }

  // Sidebar Menu
  sidebarItems?: Array<{
    id: string
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    active?: boolean
  }>

  // Custom Content
  customHeader?: ReactNode
  customFooter?: ReactNode

  // Callbacks
  onServiceGeneration?: () => void
  onProtocolUpdate?: (protocolId: string, status: string) => void
  onReportGeneration?: (reportType: string) => void
}

export default function BasePageTemplate({
  title,
  description,
  secretaria,
  pageName,
  sections,
  quickActions = [],
  stats,
  sidebarItems = [],
  customHeader,
  customFooter,
  onServiceGeneration,
  onProtocolUpdate,
  onReportGeneration
}: BasePageTemplateProps) {

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const getSecretariaColor = (sec: string) => {
    const colors: Record<string, string> = {
      'saude': 'bg-red-100 text-red-800',
      'educacao': 'bg-blue-100 text-blue-800',
      'assistencia-social': 'bg-green-100 text-green-800',
      'cultura': 'bg-purple-100 text-purple-800',
      'seguranca': 'bg-orange-100 text-orange-800',
      'planejamento': 'bg-indigo-100 text-indigo-800',
      'agricultura': 'bg-emerald-100 text-emerald-800',
      'esportes': 'bg-yellow-100 text-yellow-800',
      'turismo': 'bg-pink-100 text-pink-800',
      'habitacao': 'bg-cyan-100 text-cyan-800',
      'meio-ambiente': 'bg-teal-100 text-teal-800',
      'obras': 'bg-slate-100 text-slate-800',
      'servicos-publicos': 'bg-gray-100 text-gray-800'
    }
    return colors[sec] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <Badge className={getSecretariaColor(secretaria)}>
                      {secretaria.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {pageName}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                {onServiceGeneration && (
                  <Button onClick={onServiceGeneration} variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Gerar Serviços
                  </Button>
                )}

                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    onClick={action.onClick}
                    variant={action.variant || 'default'}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {customHeader && (
              <div className="mt-4">
                {customHeader}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protocolos Ativos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.protocolsAtivos)}</div>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços Disponíveis</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.servicosDisponiveis)}</div>
                <p className="text-xs text-muted-foreground">Catálogo ativo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atendimentos/Mês</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.atendimentosMes)}</div>
                <p className="text-xs text-muted-foreground">Média mensal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tempoMedioAtendimento}h</div>
                <p className="text-xs text-muted-foreground">Por atendimento</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex gap-6">
          {/* Sidebar */}
          {sidebarItems.length > 0 && (
            <div className="w-64 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navegação</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md
                          ${item.active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Sections */}
          <div className="flex-1">
            <Tabs defaultValue={sections[0]?.id} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                {sections.slice(0, 4).map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="flex items-center">
                    <section.icon className="w-4 h-4 mr-2" />
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <section.icon className="w-5 h-5 mr-2" />
                            {section.title}
                          </CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>

                        {section.stats && (
                          <div className="flex space-x-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{section.stats.total}</div>
                              <div className="text-gray-500">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-green-600">{section.stats.completed}</div>
                              <div className="text-gray-500">Concluídos</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-orange-600">{section.stats.pending}</div>
                              <div className="text-gray-500">Pendentes</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {section.component}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Custom Footer */}
      {customFooter && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {customFooter}
          </div>
        </div>
      )}
    </div>
  )
}