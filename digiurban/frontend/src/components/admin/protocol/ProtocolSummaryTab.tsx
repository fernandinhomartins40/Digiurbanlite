'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Calendar,
  FileText,
  Building,
  Hash,
  MapPin,
  Phone,
  Mail,
  Users
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CitizenLinksDisplay } from '@/components/protocol/CitizenLinksDisplay'

interface AddressObject {
  uf?: string
  cep?: string
  bairro?: string
  cidade?: string
  numero?: string
  logradouro?: string
  complemento?: string
  pontoReferencia?: string
}

interface ProtocolSummaryTabProps {
  protocol: {
    id: string
    protocolNumber: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    citizen?: {
      id: string
      name: string
      email?: string
      cpf: string
      phone?: string
      address?: string | AddressObject
      city?: string
      state?: string
    }
    service?: {
      id: string
      name: string
      description?: string
      department?: {
        id: string
        name: string
      }
    }
    assignedTo?: {
      id: string
      name: string
      email: string
    }
    moduleType?: string
    metadata?: any
  }
  citizenLinks?: any[]
}

export function ProtocolSummaryTab({ protocol, citizenLinks }: ProtocolSummaryTabProps) {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Data não disponível'
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'Data inválida'
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      return 'Data inválida'
    }
  }

  const formatAddress = (address: string | AddressObject | undefined): string => {
    if (!address) return ''

    if (typeof address === 'string') {
      return address
    }

    // É um objeto
    const parts = []
    if (address.logradouro) parts.push(address.logradouro)
    if (address.numero) parts.push(address.numero)
    if (address.bairro) parts.push(`- ${address.bairro}`)
    if (address.complemento) parts.push(`(${address.complemento})`)

    const line1 = parts.join(' ')
    const line2Parts = []
    if (address.cidade) line2Parts.push(address.cidade)
    if (address.uf) line2Parts.push(address.uf)
    if (address.cep) line2Parts.push(`CEP: ${address.cep}`)

    return line1 + (line2Parts.length > 0 ? '\n' + line2Parts.join(' - ') : '')
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      VINCULADO: { label: 'Vinculado', className: 'bg-blue-50 text-blue-700' },
      PROGRESSO: { label: 'Em Progresso', className: 'bg-yellow-50 text-yellow-700' },
      CONCLUIDO: { label: 'Concluído', className: 'bg-green-50 text-green-700' },
      PENDENCIA: { label: 'Pendente', className: 'bg-orange-50 text-orange-700' },
      CANCELADO: { label: 'Cancelado', className: 'bg-red-50 text-red-700' },
      ATUALIZACAO: { label: 'Atualização', className: 'bg-purple-50 text-purple-700' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-50 text-gray-700' }
  }

  const statusInfo = getStatusLabel(protocol.status)

  return (
    <div className="space-y-4">
      {/* Informações do Protocolo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações do Protocolo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-600">Número do Protocolo</p>
            </div>
            <p className="text-sm font-medium text-gray-900">{protocol.protocolNumber}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Status atual</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-600">Data de Criação</p>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(protocol.createdAt)}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-600">Última Atualização</p>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(protocol.updatedAt)}</p>
          </div>

          {protocol.assignedTo && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-600">Responsável pelo Atendimento</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{protocol.assignedTo.name}</p>
              <p className="text-xs text-gray-600">{protocol.assignedTo.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do Serviço */}
      {protocol.service && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Serviço Solicitado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Nome do Serviço</p>
              <p className="text-sm font-medium text-gray-900">{protocol.service.name}</p>
            </div>

            {protocol.service.description && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Descrição</p>
                <p className="text-sm text-gray-700">{protocol.service.description}</p>
              </div>
            )}

            {protocol.service.department && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Departamento</p>
                <Badge variant="outline" className="text-xs">
                  <Building className="h-3 w-3 mr-1" />
                  {protocol.service.department.name}
                </Badge>
              </div>
            )}

            {protocol.moduleType && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Tipo de Módulo</p>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {protocol.moduleType}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações do Cidadão */}
      {protocol.citizen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Cidadão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Nome Completo</p>
              <p className="text-sm font-medium text-gray-900">{protocol.citizen.name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">CPF</p>
                <p className="text-sm text-gray-900">{protocol.citizen.cpf}</p>
              </div>

              {protocol.citizen.email && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-600">E-mail</p>
                  </div>
                  <p className="text-sm text-gray-900 break-words">{protocol.citizen.email}</p>
                </div>
              )}

              {protocol.citizen.phone && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-600">Telefone</p>
                  </div>
                  <p className="text-sm text-gray-900">{protocol.citizen.phone}</p>
                </div>
              )}
            </div>

            {(protocol.citizen.address || protocol.citizen.city) && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <p className="text-xs text-gray-600">Endereço</p>
                </div>
                {protocol.citizen.address && (
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {formatAddress(protocol.citizen.address)}
                  </p>
                )}
                {!protocol.citizen.address && (protocol.citizen.city || protocol.citizen.state) && (
                  <p className="text-sm text-gray-600">
                    {protocol.citizen.city}{protocol.citizen.state && `, ${protocol.citizen.state}`}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vínculos Cidadãos (se existirem) */}
      {citizenLinks && citizenLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pessoas Vinculadas ({citizenLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CitizenLinksDisplay
              protocolId={protocol.id}
              citizenLinks={citizenLinks}
              editable={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Metadados Adicionais (se existirem) */}
      {protocol.metadata && Object.keys(protocol.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(protocol.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
                  <p className="text-xs text-gray-600 font-medium">{key}</p>
                  <p className="text-sm text-gray-900 text-right break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
