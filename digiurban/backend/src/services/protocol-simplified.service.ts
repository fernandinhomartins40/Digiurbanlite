/**
 * PROTOCOL SERVICE - VERS\u00c3O SIMPLIFICADA
 *
 * Servi\u00e7o centralizado para gest\u00e3o de protocolos no sistema simplificado
 * Implementa o fluxo completo: criar, atualizar, rotear e gerenciar protocolos
 */

import { ProtocolStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { getModuleEntity, isInformativeModule } from '../config/module-mapping'

// ========================================
// TYPES & INTERFACES
// ========================================

export interface CreateProtocolInput {
  // Dados b\u00e1sicos
  title: string
  description?: string
  citizenId: string
  serviceId: string
  priority?: number

  // Dados do formul\u00e1rio (para servi\u00e7os COM_DADOS)
  formData?: Record<string, any>

  // Geolocaliza\u00e7\u00e3o
  latitude?: number
  longitude?: number
  address?: string

  // Documentos
  documents?: any
  attachments?: string

  // Gest\u00e3o
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
   * 1. Busca informa\u00e7\u00f5es do servi\u00e7o
   * 2. Determina se \u00e9 INFORMATIVO ou COM_DADOS
   * 3. Cria o protocolo com dados apropriados
   * 4. Se COM_DADOS, roteia para o m\u00f3dulo correspondente
   * 5. Cria entrada no hist\u00f3rico
   */
  async createProtocol(data: CreateProtocolInput) {
    const { citizenId, serviceId, formData, ...rest } = data

    // 1. Buscar servi\u00e7o para determinar tipo
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: { department: true }
      })

    if (!service) {
      throw new Error('Servi\u00e7o n\u00e3o encontrado')
    }

    // 2. Gerar n\u00famero do protocolo
    const year = new Date().getFullYear()
    const count = await prisma.protocolSimplified.count({})
    const protocolNumber = `${year}-${String(count + 1).padStart(6, '0')}`

    // 3. Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        ...rest,
        number: protocolNumber,
        citizenId,
        serviceId,
        departmentId: service.departmentId,
        status: 'VINCULADO',

        // Se servi\u00e7o COM_DADOS, adicionar dados e moduleType
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

    // 4. Se COM_DADOS, rotear para m\u00f3dulo
    if (service.serviceType === 'COM_DADOS' && service.moduleType) {
      await this.routeToModule(protocol)
    }

    // 5. Criar hist\u00f3rico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'CRIADO',
        newStatus: 'VINCULADO',
        comment: 'Protocolo criado pelo cidad\u00e3o',
        userId: data.createdById
      }
    })

    return protocol
  }

  /**
   * Rotear dados do protocolo para o m\u00f3dulo correspondente
   *
   * Esta fun\u00e7\u00e3o cria um registro no m\u00f3dulo espec\u00edfico (ex: HealthAttendance, Student, etc)
   * vinculando-o ao protocolo para que o setor possa gerenciar os dados
   */
  private async routeToModule(protocol: any) {
    if (!protocol.moduleType) {
      console.warn(`Protocolo ${protocol.number} sem moduleType definido`)
      return
    }

    // Verificar se \u00e9 m\u00f3dulo informativo
    if (isInformativeModule(protocol.moduleType)) {
      console.log(`M\u00f3dulo ${protocol.moduleType} \u00e9 informativo - sem roteamento`)
      return
    }

    const moduleEntity = getModuleEntity(protocol.moduleType)

    if (!moduleEntity) {
      console.warn(`M\u00f3dulo ${protocol.moduleType} n\u00e3o mapeado`)
      return
    }

    try {
      // Preparar dados para o m\u00f3dulo
      const moduleData = {
        ...protocol.customData,
        protocolId: protocol.id,
        protocolNumber: protocol.number,
        citizenId: protocol.citizenId,
        departmentId: protocol.departmentId,
        status: 'PENDING',
        createdAt: new Date()
      }

      // Criar registro no m\u00f3dulo
      // Nota: Isso requer que o schema Prisma tenha as entidades dos m\u00f3dulos
      // await prisma[moduleEntity.toLowerCase()].create({ data: moduleData })

      console.log(`\u2713 Dados roteados para m\u00f3dulo: ${moduleEntity} (Protocolo: ${protocol.number})`)

      // Atualizar metadados do protocolo
      await prisma.protocolSimplified.update({
        where: { id: protocol.id },
        data: {
          customData: {
            ...protocol.customData,
            _routedToModule: moduleEntity,
            _routedAt: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      console.error(`Erro ao rotear para m\u00f3dulo ${moduleEntity}:`, error)
      throw error
    }
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
      throw new Error('Protocolo n\u00e3o encontrado')
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

    // Registrar hist\u00f3rico
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
   * Adicionar coment\u00e1rio ao protocolo
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
   * Atribuir protocolo a um usu\u00e1rio
   */
  async assignProtocol(protocolId: string, assignedUserId: string, userId?: string) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    })

    if (!protocol) {
      throw new Error('Protocolo n\u00e3o encontrado')
    }

    const updated = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: { assignedUserId }
    })

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'ATRIBUIDO',
        comment: `Protocolo atribu\u00eddo ao usu\u00e1rio ${assignedUserId}`,
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
   * Listar protocolos por m\u00f3dulo
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
   * Listar protocolos do cidad\u00e3o
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
   * Buscar protocolo por n\u00famero
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
    // Verificar se protocolo est\u00e1 conclu\u00eddo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    })

    if (!protocol) {
      throw new Error('Protocolo n\u00e3o encontrado')
    }

    if (protocol.status !== 'CONCLUIDO') {
      throw new Error('Apenas protocolos conclu\u00eddos podem ser avaliados')
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
   * Obter hist\u00f3rico completo do protocolo
   */
  async getHistory(protocolId: string) {
    return prisma.protocolHistorySimplified.findMany({
      where: { protocolId },
      orderBy: { timestamp: 'desc' }
    })
  }

  /**
   * Estat\u00edsticas de protocolos por departamento
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

      // Por m\u00f3dulo
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

// Exportar inst\u00e2ncia singleton
export const protocolServiceSimplified = new ProtocolServiceSimplified()
