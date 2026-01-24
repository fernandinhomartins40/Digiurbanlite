'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { GitBranch, MessageSquare } from 'lucide-react'
import { ProtocolStage, ProtocolInteraction } from '@/types/protocol-enhancements'
import { ProtocolStagesTab } from './ProtocolStagesTab'
import { ProtocolInteractionsTab } from './ProtocolInteractionsTab'

interface ProtocolCommunicationTabProps {
  protocolId: string
  stages: ProtocolStage[]
  interactions?: ProtocolInteraction[]
  onRefresh: () => void
}

export function ProtocolCommunicationTab({
  protocolId,
  stages,
  interactions = [],
  onRefresh
}: ProtocolCommunicationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'messages'>('timeline')

  const unreadCount = interactions.filter(i => !i.isRead).length

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comunicação e Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{stages.length}</p>
              <p className="text-xs text-gray-600 mt-1">Etapas Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {stages.filter(s => s.status === 'COMPLETED').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Concluídas</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">{interactions.length}</p>
              <p className="text-xs text-gray-600 mt-1">Mensagens</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-700">{unreadCount}</p>
              <p className="text-xs text-gray-600 mt-1">Não Lidas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Timeline e Mensagens */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'timeline' | 'messages')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span>Timeline do Workflow</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {stages.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Mensagens</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Timeline do Workflow */}
        <TabsContent value="timeline" className="mt-4">
          <ProtocolStagesTab
            protocolId={protocolId}
            stages={stages}
            onRefresh={onRefresh}
          />
        </TabsContent>

        {/* Mensagens e Interações */}
        <TabsContent value="messages" className="mt-4">
          <ProtocolInteractionsTab
            protocolId={protocolId}
            isServer={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
