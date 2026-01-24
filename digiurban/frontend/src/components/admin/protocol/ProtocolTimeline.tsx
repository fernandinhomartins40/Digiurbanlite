'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  User,
  Upload,
  Download,
  GitBranch,
  SkipForward,
  FileCheck,
  FileX,
  FileClock,
  UserPlus
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimelineEvent {
  id: string
  type: 'stage' | 'document' | 'pending' | 'interaction' | 'protocol' | 'citizen-link'
  timestamp: Date
  actor?: {
    id: string
    name: string
    type: 'user' | 'citizen' | 'system'
  }
  title: string
  description?: string
  metadata?: any
  status?: string
}

interface ProtocolTimelineProps {
  protocol: {
    id: string
    protocolNumber: string
    createdAt: Date | string
    updatedAt: Date | string
    status: string
  }
  stages?: Array<{
    id: string
    stageName: string
    status: string
    startedAt?: Date | string
    completedAt?: Date | string
    notes?: string
    assignedTo?: { id: string; name: string }
  }>
  documents?: Array<{
    id: string
    documentType: string
    status: string
    uploadedAt?: Date | string
    reviewedAt?: Date | string
    uploadedBy?: { id: string; name: string }
    reviewedBy?: { id: string; name: string }
    rejectionReason?: string
  }>
  pendings?: Array<{
    id: string
    description: string
    status: string
    createdAt: Date | string
    resolvedAt?: Date | string
    createdBy?: { id: string; name: string }
    resolvedBy?: { id: string; name: string }
    resolution?: string
  }>
  interactions?: Array<{
    id: string
    message: string
    interactionType: string
    createdAt: Date | string
    sender?: { id: string; name: string }
    isFromCitizen?: boolean
  }>
  citizenLinks?: Array<{
    id: string
    relationshipType: string
    createdAt: Date | string
    linkedCitizen: { id: string; name: string }
    createdBy?: { id: string; name: string }
  }>
  exportable?: boolean
}

export function ProtocolTimeline({
  protocol,
  stages = [],
  documents = [],
  pendings = [],
  interactions = [],
  citizenLinks = [],
  exportable = false
}: ProtocolTimelineProps) {
  // Agregar todos os eventos em uma linha do tempo unificada
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []

    // Evento de criação do protocolo
    events.push({
      id: `protocol-created`,
      type: 'protocol',
      timestamp: new Date(protocol.createdAt),
      title: 'Protocolo Criado',
      description: `Protocolo ${protocol.protocolNumber} foi criado`,
      status: 'created',
      actor: { id: 'system', name: 'Sistema', type: 'system' }
    })

    // Eventos de stages
    stages.forEach(stage => {
      if (stage.startedAt) {
        events.push({
          id: `stage-${stage.id}-started`,
          type: 'stage',
          timestamp: new Date(stage.startedAt),
          title: `Etapa Iniciada: ${stage.stageName}`,
          description: stage.notes || undefined,
          status: 'started',
          actor: stage.assignedTo
            ? { id: stage.assignedTo.id, name: stage.assignedTo.name, type: 'user' }
            : { id: 'system', name: 'Sistema', type: 'system' }
        })
      }

      if (stage.completedAt) {
        events.push({
          id: `stage-${stage.id}-completed`,
          type: 'stage',
          timestamp: new Date(stage.completedAt),
          title: `Etapa Concluída: ${stage.stageName}`,
          description: stage.notes || undefined,
          status: stage.status,
          actor: stage.assignedTo
            ? { id: stage.assignedTo.id, name: stage.assignedTo.name, type: 'user' }
            : { id: 'system', name: 'Sistema', type: 'system' }
        })
      }
    })

    // Eventos de documentos
    documents.forEach(doc => {
      if (doc.uploadedAt) {
        events.push({
          id: `document-${doc.id}-uploaded`,
          type: 'document',
          timestamp: new Date(doc.uploadedAt),
          title: `Documento Enviado: ${doc.documentType}`,
          status: 'uploaded',
          actor: doc.uploadedBy
            ? { id: doc.uploadedBy.id, name: doc.uploadedBy.name, type: 'citizen' }
            : undefined
        })
      }

      if (doc.reviewedAt) {
        events.push({
          id: `document-${doc.id}-reviewed`,
          type: 'document',
          timestamp: new Date(doc.reviewedAt),
          title: `Documento ${doc.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}: ${doc.documentType}`,
          description: doc.rejectionReason || undefined,
          status: doc.status,
          actor: doc.reviewedBy
            ? { id: doc.reviewedBy.id, name: doc.reviewedBy.name, type: 'user' }
            : undefined
        })
      }
    })

    // Eventos de pendências
    pendings.forEach(pending => {
      events.push({
        id: `pending-${pending.id}-created`,
        type: 'pending',
        timestamp: new Date(pending.createdAt),
        title: 'Pendência Criada',
        description: pending.description,
        status: 'created',
        actor: pending.createdBy
          ? { id: pending.createdBy.id, name: pending.createdBy.name, type: 'user' }
          : undefined
      })

      if (pending.resolvedAt) {
        events.push({
          id: `pending-${pending.id}-resolved`,
          type: 'pending',
          timestamp: new Date(pending.resolvedAt),
          title: 'Pendência Resolvida',
          description: pending.resolution || pending.description,
          status: pending.status,
          actor: pending.resolvedBy
            ? { id: pending.resolvedBy.id, name: pending.resolvedBy.name, type: 'user' }
            : undefined
        })
      }
    })

    // Eventos de interações
    interactions.forEach(interaction => {
      events.push({
        id: `interaction-${interaction.id}`,
        type: 'interaction',
        timestamp: new Date(interaction.createdAt),
        title: interaction.isFromCitizen ? 'Mensagem do Cidadão' : 'Mensagem Enviada',
        description: interaction.message,
        metadata: { interactionType: interaction.interactionType },
        actor: interaction.sender
          ? {
              id: interaction.sender.id,
              name: interaction.sender.name,
              type: interaction.isFromCitizen ? 'citizen' : 'user'
            }
          : undefined
      })
    })

    // Eventos de vínculos de cidadãos
    citizenLinks.forEach(link => {
      events.push({
        id: `citizen-link-${link.id}`,
        type: 'citizen-link',
        timestamp: new Date(link.createdAt),
        title: 'Pessoa Vinculada',
        description: `${link.linkedCitizen.name} (${link.relationshipType})`,
        actor: link.createdBy
          ? { id: link.createdBy.id, name: link.createdBy.name, type: 'user' }
          : undefined
      })
    })

    // Ordenar por timestamp (mais recente primeiro)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [protocol, stages, documents, pendings, interactions, citizenLinks])

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'protocol':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'stage':
        if (event.status === 'COMPLETED') {
          return <CheckCircle2 className="h-5 w-5 text-green-600" />
        } else if (event.status === 'FAILED') {
          return <XCircle className="h-5 w-5 text-red-600" />
        } else if (event.status === 'SKIPPED') {
          return <SkipForward className="h-5 w-5 text-gray-400" />
        }
        return <GitBranch className="h-5 w-5 text-blue-600" />
      case 'document':
        if (event.status === 'APPROVED') {
          return <FileCheck className="h-5 w-5 text-green-600" />
        } else if (event.status === 'REJECTED') {
          return <FileX className="h-5 w-5 text-red-600" />
        } else if (event.status === 'uploaded') {
          return <Upload className="h-5 w-5 text-blue-600" />
        }
        return <FileClock className="h-5 w-5 text-yellow-600" />
      case 'pending':
        if (event.status === 'RESOLVED') {
          return <CheckCircle2 className="h-5 w-5 text-green-600" />
        }
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'interaction':
        return <MessageSquare className="h-5 w-5 text-purple-600" />
      case 'citizen-link':
        return <UserPlus className="h-5 w-5 text-indigo-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'protocol':
        return 'bg-blue-50 border-blue-200'
      case 'stage':
        if (event.status === 'COMPLETED') return 'bg-green-50 border-green-200'
        if (event.status === 'FAILED') return 'bg-red-50 border-red-200'
        if (event.status === 'SKIPPED') return 'bg-gray-50 border-gray-200'
        return 'bg-blue-50 border-blue-200'
      case 'document':
        if (event.status === 'APPROVED') return 'bg-green-50 border-green-200'
        if (event.status === 'REJECTED') return 'bg-red-50 border-red-200'
        return 'bg-blue-50 border-blue-200'
      case 'pending':
        if (event.status === 'RESOLVED') return 'bg-green-50 border-green-200'
        return 'bg-orange-50 border-orange-200'
      case 'interaction':
        return 'bg-purple-50 border-purple-200'
      case 'citizen-link':
        return 'bg-indigo-50 border-indigo-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const handleExport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const exportUrl = `${apiUrl}/protocols/${protocol.id}/timeline/export`

      const response = await fetch(exportUrl, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar timeline')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `timeline_protocolo_${protocol.protocolNumber}_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Erro ao exportar timeline:', error)
      alert('Erro ao exportar timeline em PDF')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Linha do Tempo Completa
          </h3>
          <p className="text-sm text-gray-600">
            {timelineEvents.length} evento{timelineEvents.length !== 1 ? 's' : ''} registrado{timelineEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {exportable && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {timelineEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Nenhum evento registrado ainda</p>
            </CardContent>
          </Card>
        ) : (
          timelineEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Linha vertical conectando eventos */}
              {index < timelineEvents.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
              )}

              {/* Card do Evento */}
              <Card className={`border ${getEventColor(event)}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Ícone */}
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-200 shrink-0">
                      {getEventIcon(event)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      {/* Título e Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </div>

                      {/* Descrição */}
                      {event.description && (
                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}

                      {/* Actor */}
                      {event.actor && (
                        <div className="flex items-center gap-2 mt-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {event.actor.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.actor.type === 'user'
                              ? 'Servidor'
                              : event.actor.type === 'citizen'
                              ? 'Cidadão'
                              : 'Sistema'}
                          </Badge>
                        </div>
                      )}

                      {/* Metadata adicional */}
                      {event.metadata?.interactionType && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.metadata.interactionType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
