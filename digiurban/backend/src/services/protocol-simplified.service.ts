/**
 * PROTOCOL SERVICE - VERSÃO SIMPLIFICADA
 *
 * Serviço centralizado para gestão de protocolos no sistema simplificado
 * Implementa o fluxo completo: criar, atualizar, rotear e gerenciar protocolos
 */

import { ProtocolStatus, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateProtocolNumberSafe } from './protocol-number.service'
import { protocolStatusEngine } from './protocol-status.engine'
import { ActorRole } from '../types/protocol-status.types'
import { GeocodingService } from './geocoding.service'

// ========================================
// TYPES & INTERFACES
// ========================================

export interface CreateProtocolInput {
  // Dados básicos
  title: string
  description?: string
  citizenId: string
  serviceId: string
  priority?: number

  // Dados do formulário (para serviços COM_DADOS)
  formData?: Record<string, any>

  // Geolocalização
  latitude?: number
  longitude?: number
  address?: string
  specificLocation?: string // Endereço específico (diferente do endereço do cidadão)
  locationType?: 'CITIZEN_ADDRESS' | 'SPECIFIC_LOCATION' | 'MANUAL_PIN' | 'GPS'

  // Documentos
  documents?: any
  attachments?: string

  // Gestão
  assignedUserId?: string
  createdById?: string
  dueDate?: Date
}

export interface UpdateProtocolStatusInput {
  protocolId: string
  newStatus: ProtocolStatus
  comment?: string
  userId?: string
}

export interface ProtocolFilters {
  status?: ProtocolStatus
  departmentId?: string
  moduleType?: string
  citizenId?: string
  assignedUserId?: string
  createdAt?: {
    gte?: Date
    lte?: Date
  }
}

// ========================================
// PROTOCOL SERVICE CLASS
// ========================================

export class ProtocolServiceSimplified {
  /**
   * Criar novo protocolo
   *
   * Fluxo:
   * 1. Busca informações do serviço
   * 2. Determina se é INFORMATIVO ou COM_DADOS
   * 3. Geocodifica endereço automaticamente (se disponível)
   * 4. Cria o protocolo com dados apropriados
   * 5. Se COM_DADOS, vincula ao módulo via moduleType
   * 6. Cria entrada no histórico
   */
  async createProtocol(data: CreateProtocolInput) {
    const { citizenId, serviceId, formData, specificLocation, locationType, ...rest } = data

    // 1. Buscar serviço para determinar tipo
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: { department: true }
      })

    if (!service) {
      throw new Error('Serviço não encontrado')
    }

    // 2. Buscar cidadão para obter endereço (se necessário)
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { address: true }
    })

    // 3. Geocodificação automática
    let geocodingData: any = {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      specificLocation,
      locationType: locationType || 'CITIZEN_ADDRESS',
      geocodingProvider: null
    }

    // Se já tem coordenadas manuais, marcar como MANUAL_PIN
    if (data.latitude && data.longitude && !locationType) {
      geocodingData.locationType = 'MANUAL_PIN'
      geocodingData.geocodingProvider = 'manual'
    }
    // Se não tem coordenadas, tentar geocodificar
    else if (!data.latitude || !data.longitude) {
      // Determinar endereço a geocodificar (prioridade)
      let addressToGeocode: string | null = null

      if (specificLocation) {
        addressToGeocode = specificLocation
        geocodingData.locationType = 'SPECIFIC_LOCATION'
      } else if (data.address) {
        addressToGeocode = data.address
        geocodingData.locationType = 'CITIZEN_ADDRESS'
      } else if (citizen?.address) {
        // citizen.address é Json, então precisamos formatar corretamente
        let citizenAddress: string

        if (typeof citizen.address === 'string') {
          citizenAddress = citizen.address
        } else if (typeof citizen.address === 'object' && citizen.address !== null) {
          // Formatar objeto de endereço em string legível
          const addr = citizen.address as any
          const parts = [
            addr.logradouro,
            addr.numero,
            addr.complemento,
            addr.bairro,
            addr.cidade,
            addr.uf,
            addr.cep
          ].filter(Boolean)
          citizenAddress = parts.join(', ')
        } else {
          citizenAddress = JSON.stringify(citizen.address)
        }

        addressToGeocode = citizenAddress
        geocodingData.locationType = 'CITIZEN_ADDRESS'
        geocodingData.address = citizenAddress
      }

      // Geocodificar se temos endereço
      if (addressToGeocode) {
        try {
          console.log(`🌍 Geocodificando protocolo: ${addressToGeocode}`)
          const geoResult = await GeocodingService.geocodeAddress(addressToGeocode)

          if (geoResult && GeocodingService.isValidBrazilCoordinates(geoResult.latitude, geoResult.longitude)) {
            geocodingData.latitude = geoResult.latitude
            geocodingData.longitude = geoResult.longitude
            geocodingData.geocodingProvider = geoResult.provider
            geocodingData.address = geoResult.formattedAddress || addressToGeocode
            console.log(`✅ Protocolo geocodificado: ${geoResult.latitude}, ${geoResult.longitude}`)
          } else {
            console.log(`⚠️ Não foi possível geocodificar o endereço`)
          }
        } catch (error) {
          console.error('❌ Erro ao geocodificar protocolo:', error)
          // Continuar criação mesmo se geocodificação falhar
        }
      }
    }

    // 4. Gerar número do protocolo
    const protocolNumber = await generateProtocolNumberSafe()

    // 5. Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        ...rest,
        number: protocolNumber,
        citizenId,
        serviceId,
        departmentId: service.departmentId,
        status: 'VINCULADO',

        // Geolocalização
        latitude: geocodingData.latitude,
        longitude: geocodingData.longitude,
        address: geocodingData.address,
        specificLocation: geocodingData.specificLocation,
        locationType: geocodingData.locationType,
        geocodingProvider: geocodingData.geocodingProvider,

        // Se serviço COM_DADOS, adicionar dados e moduleType
        ...(service.serviceType === 'COM_DADOS' && {
          moduleType: service.moduleType,
          customData: formData
        })
      },
      include: {
        service: true,
        citizen: true,
        department: true
      }
      })

    // 6. Se COM_DADOS, módulo já está vinculado via moduleType
    if (service.serviceType === 'COM_DADOS' && service.moduleType) {
      console.log(`✓ Protocolo ${protocol.number} vinculado ao módulo: ${service.moduleType}`)
    }

    // 7. Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'CRIADO',
        newStatus: 'VINCULADO',
        comment: 'Protocolo criado pelo cidadão',
        userId: data.createdById
      }
    })

    return protocol
  }

  /**
   * Atualizar status do protocolo
   */
  async updateStatus(input: UpdateProtocolStatusInput) {
    const { protocolId, newStatus, comment, userId } = input

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    })

    if (!protocol) {
      throw new Error('Protocolo não encontrado')
    }

    const oldStatus = protocol.status

    // Atualizar protocolo
    const updated = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        status: newStatus,
        ...(newStatus === 'CONCLUIDO' && { concludedAt: new Date() })
      }
    })

    // Registrar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'STATUS_ALTERADO',
        oldStatus,
        newStatus,
        comment,
        userId
      }
    })

    return updated
  }

  /**
   * Adicionar comentário ao protocolo
   */
  async addComment(protocolId: string, comment: string, userId?: string) {
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'COMENTARIO',
        comment,
        userId
      }
    })
  }

  /**
   * Atribuir protocolo a um usuário
   */
  async assignProtocol(protocolId: string, assignedUserId: string, userId?: string) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    })

    if (!protocol) {
      throw new Error('Protocolo não encontrado')
    }

    const updated = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: { assignedUserId }
    })

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'ATRIBUIDO',
        comment: `Protocolo atribuído ao usuário ${assignedUserId}`,
        userId
      }
    })

    return updated
  }

  /**
   * Listar protocolos por departamento
   */
  async listByDepartment(departmentId: string, filters?: ProtocolFilters) {
    return prisma.protocolSimplified.findMany({
      where: {
        departmentId,
        ...filters
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true
          }
      },
        service: {
          select: {
            id: true,
            name: true,
            serviceType: true,
            moduleType: true
          }
      },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
      },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Listar protocolos por módulo
   */
  async listByModule(departmentId: string, moduleType: string) {
    return prisma.protocolSimplified.findMany({
      where: {
        departmentId,
        moduleType
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
      },
        service: {
          select: {
            id: true,
            name: true
          }
      }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Listar protocolos do cidadão
   */
  async listByCitizen(citizenId: string) {
    return prisma.protocolSimplified.findMany({
      where: { citizenId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                id: true,
                name: true
              }
      }
          }
        },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Buscar protocolo por número
   */
  async findByNumber(number: string) {
    return prisma.protocolSimplified.findUnique({
      where: { number },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true
          }
      },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            serviceType: true,
            moduleType: true,
            department: {
              select: {
                id: true,
                name: true
              }
      }
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
      },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
      },
        createdBy: {
          select: {
            id: true,
            name: true
          }
      },
        history: {
          orderBy: { timestamp: 'desc' }
        },
        evaluations: true
      }
    })
  }

  /**
   * Avaliar protocolo
   */
  async evaluateProtocol(protocolId: string, rating: number, comment?: string, wouldRecommend = true) {
    // Verificar se protocolo está concluído
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    })

    if (!protocol) {
      throw new Error('Protocolo não encontrado')
    }

    if (protocol.status !== 'CONCLUIDO') {
      throw new Error('Apenas protocolos concluídos podem ser avaliados')
    }

    return prisma.protocolEvaluationSimplified.create({
      data: {
        protocolId,
        rating,
        comment,
        wouldRecommend
      }
    })
  }

  /**
   * Obter histórico completo do protocolo
   */
  async getHistory(protocolId: string) {
    return prisma.protocolHistorySimplified.findMany({
      where: { protocolId },
      orderBy: { timestamp: 'desc' }
    })
  }

  /**
   * Estatísticas de protocolos por departamento
   */
  async getDepartmentStats(departmentId: string, startDate?: Date, endDate?: Date) {
    const where: any = { departmentId }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [total, byStatus, byModule] = await Promise.all([
      // Total de protocolos
      prisma.protocolSimplified.count({ where }),

      // Por status
      prisma.protocolSimplified.groupBy({
        by: ['status'],
        where,
        _count: true
      }),

      // Por módulo
      prisma.protocolSimplified.groupBy({
        by: ['moduleType'],
        where,
        _count: true
      })
    ])

    return {
      total,
      byStatus,
      byModule
    }
  }
}

// Exportar instância singleton
export const protocolServiceSimplified = new ProtocolServiceSimplified()
