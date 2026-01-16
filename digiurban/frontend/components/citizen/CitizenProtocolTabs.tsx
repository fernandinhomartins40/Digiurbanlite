'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  AlertCircle,
  Upload,
  FileCheck,
  MessageSquare,
  Clock
} from 'lucide-react'

interface CitizenProtocolTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  availableTabs: string[]
  primaryTab: string
  badges?: {
    pendings?: number
    messages?: number
    generated?: number
  }
  children: React.ReactNode
}

export function CitizenProtocolTabs({
  activeTab,
  onTabChange,
  availableTabs,
  primaryTab,
  badges = {},
  children
}: CitizenProtocolTabsProps) {
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'resumo':
        return <FileText className="h-4 w-4" />
      case 'pendings':
        return <AlertCircle className="h-4 w-4" />
      case 'documents':
        return <Upload className="h-4 w-4" />
      case 'generated':
        return <FileCheck className="h-4 w-4" />
      case 'messages':
        return <MessageSquare className="h-4 w-4" />
      case 'timeline':
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'resumo':
        return 'Resumo'
      case 'pendings':
        return 'Pendências'
      case 'documents':
        return 'Meus Documentos'
      case 'generated':
        return 'Documentos Gerados'
      case 'messages':
        return 'Mensagens'
      case 'timeline':
        return 'Histórico'
      default:
        return tabId
    }
  }

  const getTabBadge = (tabId: string) => {
    const badgeCount = badges[tabId as keyof typeof badges]
    if (!badgeCount || badgeCount === 0) return null

    // Pendências = vermelho
    if (tabId === 'pendings') {
      return (
        <Badge variant="secondary" className="ml-2 bg-red-600 text-white">
          {badgeCount}
        </Badge>
      )
    }

    // Mensagens = azul
    if (tabId === 'messages') {
      return (
        <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
          {badgeCount}
        </Badge>
      )
    }

    // Outros = cinza
    return (
      <Badge variant="secondary" className="ml-2">
        {badgeCount}
      </Badge>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="inline-flex h-auto flex-wrap gap-2 bg-transparent p-0">
        {availableTabs.map((tabId) => (
          <TabsTrigger
            key={tabId}
            value={tabId}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border
              data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 data-[state=active]:border-blue-300
              data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border-gray-200
              ${tabId === primaryTab ? 'ring-2 ring-blue-200 ring-offset-2' : ''}
            `}
          >
            {getTabIcon(tabId)}
            <span className="font-medium">{getTabLabel(tabId)}</span>
            {getTabBadge(tabId)}
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  )
}
