'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  User,
  Hash,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CitizenProtocolSummaryTabProps {
  protocol: {
    number: string
    title: string
    description?: string | null
    status: string
    createdAt: string
    updatedAt: string
    service: {
      name: string
      description?: string | null
      estimatedDays?: number | null
    }
    department: {
      name: string
    }
    citizen: {
      name: string
      cpf?: string
    }
    customData?: Record<string, any>
  }
}

export function CitizenProtocolSummaryTab({ protocol }: CitizenProtocolSummaryTabProps) {
  return (
    <div className="space-y-6">
      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações do Protocolo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="h-4 w-4" />
                <span className="font-medium">Número do Protocolo</span>
              </div>
              <p className="text-base font-semibold text-gray-900 ml-6">
                {protocol.number}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Secretaria</span>
              </div>
              <p className="text-base text-gray-900 ml-6">{protocol.department.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Serviço</span>
              </div>
              <p className="text-base text-gray-900 ml-6">{protocol.service.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">Solicitante</span>
              </div>
              <p className="text-base text-gray-900 ml-6">{protocol.citizen.name}</p>
              {protocol.citizen.cpf && (
                <p className="text-sm text-gray-600 ml-6">CPF: {protocol.citizen.cpf}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Criado em</span>
              </div>
              <p className="text-base text-gray-900 ml-6">
                {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Última Atualização</span>
              </div>
              <p className="text-base text-gray-900 ml-6">
                {format(new Date(protocol.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {protocol.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Descrição</p>
                <p className="text-base text-gray-900">{protocol.description}</p>
              </div>
            </>
          )}

          {protocol.service.estimatedDays && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Prazo Estimado</p>
                <p className="text-base text-gray-900">
                  {protocol.service.estimatedDays} dias úteis
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dados Enviados */}
      {protocol.customData && Object.keys(protocol.customData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Dados Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(protocol.customData).map(([key, value]) => {
                // Pular campos internos ou nulos
                if (key.startsWith('_') || value === null || value === undefined) {
                  return null
                }

                // Formatar label
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .toLowerCase()
                  .replace(/^\w/, c => c.toUpperCase())

                // Formatar valor
                let displayValue = value
                if (typeof value === 'boolean') {
                  displayValue = value ? 'Sim' : 'Não'
                } else if (typeof value === 'object') {
                  displayValue = JSON.stringify(value, null, 2)
                } else if (value === '') {
                  displayValue = '—'
                }

                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-base text-gray-900 break-words">
                      {typeof value === 'boolean' ? (
                        <Badge variant={value ? 'default' : 'secondary'}>
                          {displayValue as string}
                        </Badge>
                      ) : (
                        String(displayValue)
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descrição do Serviço */}
      {protocol.service.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre este Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{protocol.service.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
