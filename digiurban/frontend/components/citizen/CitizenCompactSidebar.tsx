'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  FileText,
  AlertCircle,
  MessageSquare,
  Users,
  Calendar,
  User as UserIcon,
  Lightbulb
} from 'lucide-react'

interface CitizenCompactSidebarProps {
  estimatedDays?: number
  daysRemaining?: number
  documentsCount: number
  pendingsCount: number
  messagesCount: number
  unreadMessagesCount: number
  citizenLinksCount?: number
  responsibleUser?: {
    name: string
    role?: string
  }
}

export function CitizenCompactSidebar({
  estimatedDays,
  daysRemaining,
  documentsCount,
  pendingsCount,
  messagesCount,
  unreadMessagesCount,
  citizenLinksCount = 0,
  responsibleUser
}: CitizenCompactSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Prazo */}
      {estimatedDays && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Prazo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {daysRemaining !== undefined ? daysRemaining : estimatedDays}
              </span>
              <span className="text-sm text-gray-600">
                {daysRemaining !== undefined ? 'dias restantes' : 'dias úteis'}
              </span>
            </div>
            {daysRemaining !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Progresso</span>
                  <span>{Math.round(((estimatedDays - daysRemaining) / estimatedDays) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${((estimatedDays - daysRemaining) / estimatedDays) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Resumo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
            </div>
            <span className="font-medium text-gray-900">{documentsCount}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Pendências</span>
            </div>
            <span className={`font-medium ${pendingsCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {pendingsCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="h-4 w-4" />
              <span>Mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{messagesCount}</span>
              {unreadMessagesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                  {unreadMessagesCount} nova{unreadMessagesCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {citizenLinksCount > 0 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>Vínculos</span>
              </div>
              <span className="font-medium text-gray-900">{citizenLinksCount}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsável */}
      {responsibleUser && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-gray-900">{responsibleUser.name}</p>
            {responsibleUser.role && (
              <p className="text-sm text-gray-600 mt-1">{responsibleUser.role}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dica */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 font-medium mb-1 flex items-center gap-1">
            <Lightbulb className="h-4 w-4" /> Dica
          </p>
          <p className="text-xs text-blue-800">
            Você receberá notificações por email sempre que houver atualizações no seu protocolo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
