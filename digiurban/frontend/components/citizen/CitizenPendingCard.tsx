'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  FileText,
  Info,
  Calendar,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DocumentUpload } from '@/components/common/DocumentUpload'

export interface ProtocolPending {
  id: string
  protocolId: string
  pendingType?: string
  type: string
  title: string
  description: string
  status: 'PENDING' | 'RESOLVED' | 'CANCELLED' | 'OPEN' | 'IN_PROGRESS' | 'EXPIRED'
  priority: number
  dueDate?: string
  createdAt: string
  resolvedAt?: string
  resolution?: string
  metadata?: any
  blocksProgress?: boolean
}

interface CitizenPendingCardProps {
  pending: ProtocolPending
  onResolve: (resolution: string, file?: File) => Promise<void>
  onResolveWithDocument?: (file: File) => Promise<void>
  isResolving?: boolean
}

export function CitizenPendingCard({ pending, onResolve, onResolveWithDocument, isResolving = false }: CitizenPendingCardProps) {
  const [resolution, setResolution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({})

  const pendingType = pending.pendingType || pending.type || 'OTHER'
  const isDocumentType = pendingType === 'DOCUMENT'
  const isInformationType = ['INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT'].includes(pendingType)
  const isPending = ['PENDING', 'OPEN', 'IN_PROGRESS'].includes(pending.status)
  const isOverdue = Boolean(pending.dueDate && new Date(pending.dueDate) < new Date())

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (isDocumentType && uploadedFile) {
        if (onResolveWithDocument) {
          await onResolveWithDocument(uploadedFile)
        } else {
          await onResolve(`Documento enviado: ${uploadedFile.name}`, uploadedFile)
        }
        setUploadedFile(null)
        return
      }

      if (isInformationType && Object.keys(dynamicFieldValues).length > 0) {
        await onResolve(JSON.stringify(dynamicFieldValues, null, 2))
        setDynamicFieldValues({})
        return
      }

      if (!resolution.trim()) {
        return
      }

      await onResolve(resolution)
      setResolution('')
    } catch (error) {
      console.error('Erro ao resolver pendência:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setDynamicFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return <Badge variant="destructive" className="text-xs">Alta</Badge>
    }
    if (priority === 2) {
      return <Badge className="bg-orange-500 text-white text-xs">Média</Badge>
    }
    return <Badge variant="outline" className="text-xs">Baixa</Badge>
  }

  const getTypeBadge = (type: string) => {
    if (type === 'DOCUMENT') {
      return (
        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
          <FileText className="mr-1 h-3 w-3" />
          Documento
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
        <Info className="mr-1 h-3 w-3" />
        Informação
      </Badge>
    )
  }

  const getStatusIcon = () => {
    switch (pending.status) {
      case 'RESOLVED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="h-5 w-5 text-gray-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusBadge = () => {
    switch (pending.status) {
      case 'RESOLVED':
        return <Badge className="bg-green-600 text-white">Resolvida</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-500 text-white">Em andamento</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-600">Cancelada</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="text-gray-600">Expirada</Badge>
      default:
        return <Badge className="bg-orange-500 text-white">Pendente</Badge>
    }
  }

  return (
    <Card className={`${
      isPending
        ? isOverdue
          ? 'border-red-300 bg-red-50'
          : 'border-orange-300 bg-orange-50'
        : pending.status === 'RESOLVED'
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-gray-50'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-2">
            {getStatusIcon()}
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold leading-tight">
                {pending.title || pending.metadata?.title || 'Pendência'}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {getTypeBadge(pendingType)}
                {getPriorityBadge(pending.priority)}
                {getStatusBadge()}
                {pending.blocksProgress && (
                  <Badge variant="destructive" className="text-xs">
                    Bloqueia fluxo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-gray-700">{pending.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              Criada em {format(new Date(pending.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          {pending.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>
                Prazo: {format(new Date(pending.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                {isOverdue && ' (vencido)'}
              </span>
            </div>
          )}
        </div>

        {pending.status === 'RESOLVED' && pending.resolution && (
          <div className="rounded-lg border border-green-300 bg-green-100 p-3">
            <p className="mb-1 flex items-center gap-1 text-sm font-medium text-green-900">
              <Check className="h-4 w-4" />
              Resolução enviada
            </p>
            <p className="text-sm text-green-800">{pending.resolution}</p>
            {pending.resolvedAt && (
              <p className="mt-2 text-xs text-green-700">
                Resolvida em {format(new Date(pending.resolvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        )}

        {isPending && (
          <div className="space-y-3 border-t pt-2">
            {isDocumentType ? (
              <>
                <div className="mb-2 text-sm font-medium text-gray-700">
                  Enviar documento para resolver esta pendência:
                </div>
                <DocumentUpload
                  documentConfig={{
                    name: pending.metadata?.documentLabel || pending.title || 'Documento solicitado',
                    description: pending.description,
                    required: true,
                    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
                    allowCameraUpload: true,
                    maxSizeMB: 10,
                  }}
                  value={uploadedFile}
                  onChange={setUploadedFile}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting || isResolving}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting || isResolving ? (
                    <>
                      <Clock className="mr-2 h-5 w-5 animate-spin" />
                      Enviando documento...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </>
            ) : isInformationType && Array.isArray(pending.metadata?.fields) && pending.metadata.fields.length > 0 ? (
              <>
                <div className="mb-3 text-sm font-medium text-gray-700">
                  Preencha as informações solicitadas:
                </div>
                <div className="space-y-4">
                  {pending.metadata.fields.map((field: any) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.id}
                          placeholder={field.placeholder || ''}
                          value={dynamicFieldValues[field.id] || ''}
                          onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field.id}
                          type={field.type || 'text'}
                          placeholder={field.placeholder || ''}
                          value={dynamicFieldValues[field.id] || ''}
                          onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                        />
                      )}
                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(dynamicFieldValues).length === 0 || isSubmitting || isResolving}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting || isResolving ? (
                    <>
                      <Clock className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Informações
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Enviar resposta para resolver esta pendência:
                  </label>
                  <Textarea
                    placeholder="Descreva como você resolveu esta pendência ou forneça as informações solicitadas..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!resolution.trim() || isSubmitting || isResolving}
                  className="w-full"
                >
                  {isSubmitting || isResolving ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Resolução
                    </>
                  )}
                </Button>
              </>
            )}
            <p className="text-center text-xs text-gray-500">
              Após o envio, a equipe responsável irá analisar sua resposta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
