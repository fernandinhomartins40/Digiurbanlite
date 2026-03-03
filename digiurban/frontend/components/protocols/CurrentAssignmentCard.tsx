'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Clock, User } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CurrentAssignmentCardProps {
  protocolId: string
  onReassign?: () => void
}

interface Assignment {
  id: string
  tipo: 'PRINCIPAL' | 'DELEGADO' | 'ENCAMINHADO' | 'CONSULTA' | 'APOIO'
  situacao: 'ATIVA' | 'CONCLUIDA' | 'CANCELADA' | 'SUBSTITUIDA' | 'PENDENTE'
  assignedByName?: string
  comentario?: string
  motivo?: string
  dataInicio?: string | null
  user?: {
    id: string
    name: string
    email?: string
    role?: string
    department?: {
      name: string
    }
  }
  assignedBy?: {
    id: string
    name: string
  }
}

const parseValidDate = (value?: string | null) => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getTipoLabel = (tipo: Assignment['tipo']) => {
  switch (tipo) {
    case 'PRINCIPAL':
      return 'Principal'
    case 'DELEGADO':
      return 'Delegado'
    case 'ENCAMINHADO':
      return 'Encaminhado'
    case 'CONSULTA':
      return 'Consulta'
    case 'APOIO':
      return 'Apoio'
    default:
      return tipo
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
      const response = await apiRequest(`/protocols/${protocolId}/assignments`)
      const assignments = Array.isArray(response.data?.assignments)
        ? (response.data.assignments as Assignment[])
        : []

      const activeAssignment =
        assignments.find((item) => item.situacao === 'ATIVA' && item.tipo === 'PRINCIPAL') ||
        assignments.find((item) => item.situacao === 'ATIVA') ||
        assignments[0] ||
        null

      setAssignment(activeAssignment)
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

  if (!assignment || !assignment.user) {
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

  const assignedAt = parseValidDate(assignment.dataInicio)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Atribuição Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {assignment.user.name
                .split(' ')
                .map((name) => name[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm truncate">{assignment.user.name}</p>
              <Badge variant="outline" className="text-xs">
                {getTipoLabel(assignment.tipo)}
              </Badge>
            </div>
            {assignment.user.email && (
              <p className="text-xs text-gray-600 truncate">{assignment.user.email}</p>
            )}
            {assignment.user.department?.name && (
              <Badge variant="outline" className="mt-1 text-xs">
                {assignment.user.department.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Atribuído há</span>
            </div>
            <span className="font-medium">
              {assignedAt
                ? formatDistanceToNow(assignedAt, {
                    addSuffix: false,
                    locale: ptBR
                  })
                : 'Data indisponível'}
            </span>
          </div>
          {(assignment.assignedBy?.name || assignment.assignedByName) && (
            <div className="text-xs text-gray-600">
              <span>Por: </span>
              <span className="font-medium">{assignment.assignedBy?.name || assignment.assignedByName}</span>
            </div>
          )}
          {(assignment.comentario || assignment.motivo) && (
            <div className="text-xs text-gray-600 pt-2 border-t">
              <p className="italic line-clamp-3">
                &ldquo;{assignment.comentario || assignment.motivo}&rdquo;
              </p>
            </div>
          )}
        </div>

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
