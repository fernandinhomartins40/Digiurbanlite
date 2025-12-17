'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, FileText, Info, Calendar, Send, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DocumentUploadField } from '@/components/ui/document-upload-field'
import { DocumentType } from '@/components/ui/camera-capture'

export interface ProtocolPending {
  id: string
  protocolId: string
  pendingType: string
  type: string // tipo do enum PendingType do backend
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

  // Detectar tipo de pendência
  const pendingType = pending.type || pending.pendingType || 'OTHER'
  const isDocumentType = pendingType === 'DOCUMENT'
  const isInformationType = ['INFORMATION', 'CORRECTION', 'VALIDATION'].includes(pendingType)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (isDocumentType && uploadedFile) {
        // Resolver com documento
        if (onResolveWithDocument) {
          await onResolveWithDocument(uploadedFile)
        } else {
          await onResolve(`Documento enviado: ${uploadedFile.name}`, uploadedFile)
        }
        setUploadedFile(null)
      } else if (isInformationType && Object.keys(dynamicFieldValues).length > 0) {
        // Resolver com campos dinâmicos
        const fieldsResolution = JSON.stringify(dynamicFieldValues, null, 2)
        await onResolve(fieldsResolution)
        setDynamicFieldValues({})
      } else {
        // Resolver com texto
        if (!resolution.trim()) return
        await onResolve(resolution)
        setResolution('')
      }
    } catch (error) {
      console.error('Erro ao resolver pendência:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setDynamicFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return <Badge variant="destructive" className="text-xs">Alta</Badge>
    } else if (priority === 2) {
      return <Badge className="bg-orange-500 text-white text-xs">Média</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Baixa</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'DOCUMENT') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <FileText className="h-3 w-3 mr-1" />
          Documento
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          <Info className="h-3 w-3 mr-1" />
          Informação
        </Badge>
      )
    }
  }

  const getStatusIcon = () => {
    switch (pending.status) {
      case 'RESOLVED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-gray-600" />
      case 'PENDING':
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusBadge = () => {
    switch (pending.status) {
      case 'RESOLVED':
        return <Badge className="bg-green-600 text-white">Resolvida</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-600">Cancelada</Badge>
      case 'PENDING':
      default:
        return <Badge className="bg-orange-500 text-white">Pendente</Badge>
    }
  }

  const isPending = pending.status === 'PENDING' || pending.status === 'OPEN' || pending.status === 'IN_PROGRESS'
  const isOverdue = pending.dueDate && new Date(pending.dueDate) < new Date()

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
          <div className="flex items-start gap-2 flex-1">
            {getStatusIcon()}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-base leading-tight">
                {pending.metadata?.title || 'Pendência'}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {getTypeBadge(pending.pendingType)}
                {getPriorityBadge(pending.priority)}
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Descrição */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700 leading-relaxed">{pending.description}</p>
        </div>

        {/* Informações de Data */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              Criada em {format(new Date(pending.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          {pending.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>
                Prazo: {format(new Date(pending.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                {isOverdue && ' (Vencido)'}
              </span>
            </div>
          )}
        </div>

        {/* Resolução (se já foi resolvida) */}
        {pending.status === 'RESOLVED' && pending.resolution && (
          <div className="p-3 rounded-lg bg-green-100 border border-green-300">
            <p className="text-sm font-medium text-green-900 mb-1">✓ Resolução enviada</p>
            <p className="text-sm text-green-800">{pending.resolution}</p>
            {pending.resolvedAt && (
              <p className="text-xs text-green-700 mt-2">
                Resolvida em {format(new Date(pending.resolvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        )}

        {/* Formulário de Resolução (apenas se pendente) */}
        {isPending && (
          <div className="space-y-3 pt-2 border-t">
            {/* TIPO 1: Upload de Documento */}
            {isDocumentType ? (
              <>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Enviar documento para resolver esta pendência:
                </div>
                <DocumentUploadField
                  id={`doc-${pending.id}`}
                  label="Documento Solicitado"
                  description={pending.description}
                  required
                  documentType={(pending.metadata?.documentType as DocumentType) || 'documento_generico'}
                  value={uploadedFile}
                  onChange={setUploadedFile}
                  maxSizeMB={10}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting || isResolving}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting || isResolving ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Enviando documento...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </>
            ) : isInformationType && pending.metadata?.fields ? (
              /* TIPO 2: Campos Dinâmicos */
              <>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Preencha as informações solicitadas:
                </div>
                <div className="space-y-4">
                  {pending.metadata.fields.map((field: any) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
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
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar Informações
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* TIPO 3: Texto Livre (padrão) */
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Resolução
                    </>
                  )}
                </Button>
              </>
            )}
            <p className="text-xs text-gray-500 text-center">
              Após enviar, a equipe responsável irá analisar sua resposta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
