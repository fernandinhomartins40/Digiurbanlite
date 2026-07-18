/**
 * PROTOCOL SERVICE - VERSÃO SIMPLIFICADA
 *
 * Serviço centralizado para gestão de protocolos no sistema simplificado
 * Implementa o fluxo completo: criar, atualizar, rotear e gerenciar protocolos
 */

import { ProtocolStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateProtocolNumberSafe } from './protocol-number.service'
import { GeocodingService } from './geocoding.service'
import { PROTOCOL_HISTORY_ACTIONS } from '../config/protocol-history-actions'

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
        // citizen.address é Json - manter como JSON para busca estruturada
        let citizenAddress: string

        if (typeof citizen.address === 'string') {
          citizenAddress = citizen.address
        } else if (typeof citizen.address === 'object' && citizen.address !== null) {
          // Manter como JSON para que GeocodingService use busca estruturada
          citizenAddress = JSON.stringify(citizen.address)
        } else {
          citizenAddress = JSON.stringify(citizen.address)
        }

        addressToGeocode = citizenAddress
        geocodingData.locationType = 'CITIZEN_ADDRESS'
        // Guardar endereço formatado para exibição
        if (typeof citizen.address === 'object' && citizen.address !== null) {
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
          geocodingData.address = parts.join(', ')
        } else {
          geocodingData.address = citizenAddress
        }
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

            // Adicionar precisão ao customData se disponível
            if (geoResult.precision && geoResult.confidence) {
              console.log(`✅ Protocolo geocodificado: ${geoResult.latitude}, ${geoResult.longitude} (precisão: ${geoResult.precision}, confiança: ${geoResult.confidence}/10)`)

              // Aviso se precisão for baixa
              if (geoResult.precision === 'street') {
                console.log(`⚠️ Precisão de RUA - coordenadas podem não corresponder ao número exato`)
              } else if (geoResult.precision === 'neighborhood' || geoResult.precision === 'city') {
                console.log(`⚠️ Precisão baixa (${geoResult.precision}) - considere usar GPS para localização exata`)
              }
            } else {
              console.log(`✅ Protocolo geocodificado: ${geoResult.latitude}, ${geoResult.longitude}`)
            }
          } else {
            console.log(`⚠️ Não foi possível geocodificar o endereço`)
          }
        } catch (error) {
          console.error('❌ Erro ao geocodificar protocolo:', error)
          // Continuar criação mesmo se geocodificação falhar
        }
      }
    }

    // 4/5. Gerar número E criar protocolo na MESMA transação — o lock de
    // numeração só vale enquanto a transação está aberta.
    const protocol = await prisma.$transaction(async (tx) => {
      const protocolNumber = await generateProtocolNumberSafe(tx)

      return tx.protocolSimplified.create({
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
    })

    // 6. Se COM_DADOS, módulo já está vinculado via moduleType
    if (service.serviceType === 'COM_DADOS' && service.moduleType) {
      console.log(`✓ Protocolo ${protocol.number} vinculado ao módulo: ${service.moduleType}`)
    }

    // 7. Criar histórico (ação canônica — ver protocol-history-actions.ts)
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: PROTOCOL_HISTORY_ACTIONS.CREATED,
        newStatus: 'VINCULADO',
        comment: 'Protocolo criado pelo cidadão',
        userId: data.createdById
      }
    })

    return protocol
  }

  // ⚠️ REMOVIDO: updateStatus() — era um caminho paralelo que atualizava o
  // status SEM validação, notificações nem SLA. Toda mudança de status DEVE
  // passar por protocolStatusEngine.updateStatus().

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
      // Manter os dois campos de atribuição em sincronia — listagens filtram
      // por ambos (assignedUserId legado + currentAssignedUserId V2)
      data: { assignedUserId, currentAssignedUserId: assignedUserId }
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
   * ⚠️ Filtros passam por whitelist — NUNCA espalhar req.query direto no
   * where do Prisma (injeção de filtros arbitrários via query string).
   */
  async listByDepartment(departmentId: string, filters?: ProtocolFilters) {
    const safeFilters: any = {}
    if (filters?.status) safeFilters.status = filters.status
    if (filters?.moduleType) safeFilters.moduleType = filters.moduleType
    if (filters?.citizenId) safeFilters.citizenId = filters.citizenId
    if (filters?.assignedUserId) {
      safeFilters.OR = [
        { assignedUserId: filters.assignedUserId },
        { currentAssignedUserId: filters.assignedUserId }
      ]
    }
    if (filters?.createdAt?.gte || filters?.createdAt?.lte) {
      safeFilters.createdAt = {}
      if (filters.createdAt.gte) safeFilters.createdAt.gte = new Date(filters.createdAt.gte)
      if (filters.createdAt.lte) safeFilters.createdAt.lte = new Date(filters.createdAt.lte)
    }

    return prisma.protocolSimplified.findMany({
      where: {
        departmentId,
        ...safeFilters
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
    // findFirst: "number" é unique composto [tenantId, number] — a
    // tenant-extension escopa a busca ao município corrente.
    return prisma.protocolSimplified.findFirst({
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
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Avaliação deve ser um número inteiro entre 1 e 5')
    }

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

    // Uma avaliação por protocolo (há unique no banco; checagem antecipada
    // para mensagem amigável)
    const existing = await prisma.protocolEvaluationSimplified.findFirst({
      where: { protocolId }
    })

    if (existing) {
      throw new Error('Este protocolo já foi avaliado')
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
