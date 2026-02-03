'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Clock, User } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CurrentAssignmentCardProps {
  protocolId: string
  onReassign?: () => void
}

interface Assignment {
  id: string
  assignedUserId: string | null
  assignedTeamId: string | null
  assignedAt: string
  comment?: string
  assignedBy?: {
    name: string
  }
  assignedUser?: {
    id: string
    name: string
    email?: string
    role?: string
    employee?: {
      department?: {
        name: string
      }
    }
  }
  assignedTeam?: {
    id: string
    name: string
    description?: string
    memberCount?: number
  }
}

export function CurrentAssignmentCard({ protocolId, onReassign }: CurrentAssignmentCardProps) {
  const { apiRequest } = useAdminAuth()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentAssignment()
  }, [protocolId])

  const loadCurrentAssignment = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/api/protocols/${protocolId}/assignments`)

      if (response.success && response.data?.assignments?.length > 0) {
        // Pegar a atribuição mais recente que não tenha sido encerrada
        const activeAssignment = response.data.assignments.find(
          (a: Assignment) => !a.assignedUser?.employee && !a.assignedTeam
        ) || response.data.assignments[0]

        setAssignment(activeAssignment)
      } else {
        setAssignment(null)
      }
    } catch (error) {
      console.error('Erro ao carregar atribuição atual:', error)
      setAssignment(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Atribuição Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Atribuição Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <UserPlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-3">Protocolo não atribuído</p>
            {onReassign && (
              <Button size="sm" onClick={onReassign}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir Agora
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const isTeamAssignment = !!assignment.assignedTeamId
  const isUserAssignment = !!assignment.assignedUserId

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {isTeamAssignment ? (
            <>
              <Users className="h-4 w-4" />
              Equipe Atribuída
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              Servidor Atribuído
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Atribuição de Servidor */}
        {isUserAssignment && assignment.assignedUser && (
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {assignment.assignedUser.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{assignment.assignedUser.name}</p>
              {assignment.assignedUser.email && (
                <p className="text-xs text-gray-600 truncate">{assignment.assignedUser.email}</p>
              )}
              {assignment.assignedUser.employee?.department && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {assignment.assignedUser.employee.department.name}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Atribuição de Equipe */}
        {isTeamAssignment && assignment.assignedTeam && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{assignment.assignedTeam.name}</p>
              {assignment.assignedTeam.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{assignment.assignedTeam.description}</p>
              )}
              {assignment.assignedTeam.memberCount && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {assignment.assignedTeam.memberCount} membro(s)
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Metadata da Atribuição */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Atribuído há</span>
            </div>
            <span className="font-medium">
              {formatDistanceToNow(new Date(assignment.assignedAt), {
                addSuffix: false,
                locale: ptBR
              })}
            </span>
          </div>
          {assignment.assignedBy && (
            <div className="text-xs text-gray-600">
              <span>Por: </span>
              <span className="font-medium">{assignment.assignedBy.name}</span>
            </div>
          )}
          {assignment.comment && (
            <div className="text-xs text-gray-600 pt-2 border-t">
              <p className="italic line-clamp-2">&ldquo;{assignment.comment}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Botão de Reatribuir */}
        {onReassign && (
          <Button size="sm" variant="outline" className="w-full" onClick={onReassign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Reatribuir
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
