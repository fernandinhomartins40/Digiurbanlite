'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  FormInput,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Send,
  Clock,
  FilePlus,
  Users,
  CreditCard
} from 'lucide-react'

interface DynamicProtocolTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  availableTabs: string[]
  primaryTab?: string
  badges?: Record<string, number>
  children: React.ReactNode
}

const TAB_CONFIG: Record<string, { label: string; icon: any }> = {
  resumo: { label: 'Resumo', icon: FileText },
  documentos: { label: 'Documentos', icon: FileText },
  dados: { label: 'Dados', icon: FormInput },
  pendencias: { label: 'Pendências', icon: AlertCircle },
  comunicacao: { label: 'Comunicação', icon: MessageSquare },
  payment: { label: 'Pagamento', icon: CreditCard },

  // Modo Completing
  'resumo-final': { label: 'Resumo Final', icon: CheckCircle },
  'documentos-gerados': { label: 'Documentos Gerados', icon: FilePlus },
  enviar: { label: 'Enviar', icon: Send },

  // Modo Archived
  timeline: { label: 'Timeline', icon: Clock },
  envolvidos: { label: 'Envolvidos', icon: Users }
  // Nota: 'documentos', 'documentos-gerados' e 'comunicacao' são compartilhados entre modos
}

export function DynamicProtocolTabs({
  activeTab,
  onTabChange,
  availableTabs,
  primaryTab,
  badges = {},
  children
}: DynamicProtocolTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className={`grid w-full bg-white shadow-sm mb-4`} style={{
        gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`
      }}>
        {availableTabs.map((tabId) => {
          const config = TAB_CONFIG[tabId]
          if (!config) return null

          const Icon = config.icon
          const isPrimary = tabId === primaryTab
          const badgeCount = badges[tabId]

          return (
            <TabsTrigger
              key={tabId}
              value={tabId}
              className={`flex items-center gap-2 relative ${
                isPrimary ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
              {badgeCount !== undefined && badgeCount > 0 && (
                <Badge
                  variant="outline"
                  className={`ml-auto text-xs ${
                    tabId === 'pendencias'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {badgeCount}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {children}
    </Tabs>
  )
}
