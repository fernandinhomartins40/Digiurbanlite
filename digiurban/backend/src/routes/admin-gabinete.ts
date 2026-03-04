import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { adminAuthMiddleware } from '../middleware/admin-auth'
import { GeocodingService } from '../services/geocoding.service'
import { CentralCalendarSourceType } from '@prisma/client'
import { centralCalendarService } from '../services/central-calendar.service'
import logger from '../config/logger.config'
const router = Router()

// Apply tenant middleware first
// Middleware para garantir que apenas ADMIN (Prefeito) pode acessar
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao Gabinete do Prefeito' })
    return
  }
  next()
}

async function syncLegacyAgendaWithCentral(legacyAgendaEventId: string) {
  try {
    await centralCalendarService.syncLegacyGabineteEventByLegacyId(legacyAgendaEventId)
  } catch (error) {
    logger.warn('Falha ao sincronizar agenda legada com agenda centralizada', {
      legacyAgendaEventId,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

// ============================================
// AGENDA EXECUTIVA - CRUD Completo
// ============================================

// Listar eventos da agenda
router.get('/agenda', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, tipo, status } = req.query

    const where: any = {}

    if (startDate && endDate) {
      where.dataHoraInicio = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (status) {
      where.status = status
    }

    const events = await prisma.agendaEvent.findMany({
      where,
      orderBy: { dataHoraInicio: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
      }
      }
    })

    res.json({ success: true, data: events })
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    res.status(500).json({ error: 'Erro ao buscar eventos da agenda' })
  }
})

// Buscar evento específico
router.get('/agenda/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const event = await prisma.agendaEvent.findFirst({
      where: {
        id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
      }
      }
    })

    if (!event) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Erro ao buscar evento:', error)
    res.status(500).json({ error: 'Erro ao buscar evento' })
  }
})

// Criar novo evento
router.post('/agenda', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      tipo,
      titulo,
      descricao,
      dataHoraInicio,
      dataHoraFim,
      local,
      participantes,
      observacoes,
      anexos
    } = req.body

    // Validações básicas
    if (!tipo || !titulo || !dataHoraInicio || !dataHoraFim) {
      res.status(400).json({
        error: 'Campos obrigatórios: tipo, titulo, dataHoraInicio, dataHoraFim'
      })
      return
    }

    const event = await prisma.agendaEvent.create({
      data: {
        tipo,
        titulo,
        descricao,
        dataHoraInicio: new Date(dataHoraInicio),
        dataHoraFim: new Date(dataHoraFim),
        local,
        participantes,
        observacoes,
        anexos: anexos ? JSON.stringify(anexos) : null,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
      }
      }
    })

    await syncLegacyAgendaWithCentral(event.id)

    res.status(201).json({ success: true, data: event })
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    res.status(500).json({ error: 'Erro ao criar evento' })
  }
})

// Atualizar evento
router.put('/agenda/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      tipo,
      titulo,
      descricao,
      dataHoraInicio,
      dataHoraFim,
      local,
      participantes,
      status,
      observacoes,
      anexos
    } = req.body

    // Verificar se evento existe
    const existing = await prisma.agendaEvent.findFirst({
      where: { id }
    })

    if (!existing) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    const event = await prisma.agendaEvent.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(titulo && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(dataHoraInicio && { dataHoraInicio: new Date(dataHoraInicio) }),
        ...(dataHoraFim && { dataHoraFim: new Date(dataHoraFim) }),
        ...(local !== undefined && { local }),
        ...(participantes !== undefined && { participantes }),
        ...(status && { status }),
        ...(observacoes !== undefined && { observacoes }),
        ...(anexos !== undefined && { anexos: anexos ? JSON.stringify(anexos) : null })
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
      }
      }
    })

    await syncLegacyAgendaWithCentral(event.id)

    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    res.status(500).json({ error: 'Erro ao atualizar evento' })
  }
})

// Deletar evento
router.delete('/agenda/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Verificar se evento existe
    const existing = await prisma.agendaEvent.findFirst({
      where: { id }
    })

    if (!existing) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    await prisma.agendaEvent.delete({
      where: { id }
    })

    try {
      await centralCalendarService.removeSourceEvent(CentralCalendarSourceType.GABINETE, id)
    } catch (syncError) {
      logger.warn('Falha ao remover evento legado da agenda centralizada', {
        legacyAgendaEventId: id,
        error: syncError instanceof Error ? syncError.message : String(syncError)
      })
    }

    res.json({ success: true, message: 'Evento excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir evento:', error)
    res.status(500).json({ error: 'Erro ao excluir evento' })
  }
})

// Marcar evento como realizado
router.patch('/agenda/:id/realize', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const event = await prisma.agendaEvent.findFirst({
      where: { id }
    })

    if (!event) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    const updated = await prisma.agendaEvent.update({
      where: { id },
      data: { status: 'REALIZADO' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
      }
      }
    })

    await syncLegacyAgendaWithCentral(updated.id)

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro ao marcar evento como realizado:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do evento' })
  }
})

// Buscar eventos próximos (para notificações)
router.get('/agenda/upcoming', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hours = 24 } = req.query
    const now = new Date()
    const future = new Date(now.getTime() + Number(hours) * 60 * 60 * 1000)

    const upcomingEvents = await prisma.agendaEvent.findMany({
      where: {
        dataHoraInicio: {
          gte: now,
          lte: future
        },
        status: {
          in: ['AGENDADO', 'CONFIRMADO']
        }
      },
      orderBy: { dataHoraInicio: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    res.json({ success: true, data: upcomingEvents })
  } catch (error) {
    console.error('Erro ao buscar eventos próximos:', error)
    res.status(500).json({ error: 'Erro ao buscar eventos próximos' })
  }
})

// Buscar conflitos de horários
router.get('/agenda/conflicts', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.agendaEvent.findMany({
      where: {
        status: {
          not: 'CANCELADO'
        }
      },
      orderBy: { dataHoraInicio: 'asc' }
    })

    const conflicts: Array<{
      event1: any
      event2: any
      overlap: { start: Date; end: Date }
    }> = []

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const e1 = events[i]
        const e2 = events[j]

        // Verificar sobreposição
        if (e1.dataHoraInicio < e2.dataHoraFim && e2.dataHoraInicio < e1.dataHoraFim) {
          conflicts.push({
            event1: e1,
            event2: e2,
            overlap: {
              start: new Date(Math.max(e1.dataHoraInicio.getTime(), e2.dataHoraInicio.getTime())),
              end: new Date(Math.min(e1.dataHoraFim.getTime(), e2.dataHoraFim.getTime()))
            }
          })
        }
      }
    }

    res.json({ success: true, data: conflicts })
  } catch (error) {
    console.error('Erro ao buscar conflitos:', error)
    res.status(500).json({ error: 'Erro ao buscar conflitos' })
  }
})

// ============================================
// MAPA DE DEMANDAS - Apenas Leitura (SELECT)
// ============================================

// Cache de geocodificação para evitar chamadas repetidas
const geocodeCache = new Map<string, { latitude: number; longitude: number; precision: string } | null>()

// Buscar protocolos com geolocalização (coordenadas prioritárias, endereço como fallback)
router.get('/mapa-demandas/protocols', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { categoria, status, startDate, endDate } = req.query

    const baseWhere: any = {}

    if (categoria) {
      baseWhere.service = { category: categoria }
    }
    if (status) {
      baseWhere.status = status
    }
    if (startDate && endDate) {
      baseWhere.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    const selectFields = {
      id: true,
      number: true,
      title: true,
      status: true,
      latitude: true,
      longitude: true,
      address: true,
      locationType: true,
      geocodingProvider: true,
      specificLocation: true,
      createdAt: true,
      service: { select: { name: true, category: true } },
      department: { select: { name: true } },
      citizen: { select: { name: true, address: true } }
    }

    // 1. Buscar protocolos que JÁ têm coordenadas (fonte primária)
    const protocolsWithCoords = await prisma.protocolSimplified.findMany({
      where: {
        ...baseWhere,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: selectFields,
      orderBy: { createdAt: 'desc' }
    })

    // 2. Buscar protocolos SEM coordenadas (candidatos a geocodificação via endereço)
    const protocolsWithoutCoords = await prisma.protocolSimplified.findMany({
      where: {
        ...baseWhere,
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: selectFields,
      orderBy: { createdAt: 'desc' }
    })

    // 3. Geocodificar protocolos sem coordenadas (com cache e rate limit)
    const geocodedProtocols: any[] = []
    let geocodedCount = 0
    const MAX_GEOCODE_PER_REQUEST = 20 // Limitar para não sobrecarregar Nominatim

    for (const protocol of protocolsWithoutCoords) {
      if (geocodedCount >= MAX_GEOCODE_PER_REQUEST) break

      // Construir endereço para geocodificação - priorizar specificLocation > address > citizen.address
      let addressToGeocode: string | null = null

      if (protocol.specificLocation) {
        addressToGeocode = protocol.specificLocation
      } else if (protocol.address) {
        addressToGeocode = protocol.address
      } else if (protocol.citizen?.address) {
        // Parse citizen address JSON
        const addr = protocol.citizen.address as any
        const parts = [
          addr.street || addr.logradouro,
          addr.number || addr.numero,
          addr.neighborhood || addr.bairro,
          addr.city || addr.cidade || addr.municipio,
          addr.state || addr.estado || addr.uf,
          addr.zipcode || addr.cep
        ].filter(Boolean)

        if (parts.length > 0) {
          addressToGeocode = parts.join(', ')
        }
      }

      if (!addressToGeocode) continue

      // Verificar cache
      const cacheKey = addressToGeocode.toLowerCase().trim()
      let geoResult = geocodeCache.get(cacheKey)

      if (geoResult === undefined) {
        // Não está em cache - geocodificar
        try {
          const result = await GeocodingService.geocodeAddress(addressToGeocode)
          if (result && GeocodingService.isValidBrazilCoordinates(result.latitude, result.longitude)) {
            geoResult = {
              latitude: result.latitude,
              longitude: result.longitude,
              precision: result.precision || 'unknown'
            }

            // Salvar coordenadas no banco para futuras consultas
            await prisma.protocolSimplified.update({
              where: { id: protocol.id },
              data: {
                latitude: result.latitude,
                longitude: result.longitude,
                locationType: 'GEOCODED_ADDRESS',
                geocodingProvider: result.provider
              }
            }).catch(err => logger.warn(`Falha ao salvar geocodificação do protocolo ${protocol.number}: ${err.message}`))
          } else {
            geoResult = null
          }
          geocodeCache.set(cacheKey, geoResult)
          geocodedCount++
        } catch (err) {
          geocodeCache.set(cacheKey, null)
          geocodedCount++
        }
      }

      if (geoResult) {
        geocodedProtocols.push({
          ...protocol,
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          locationType: protocol.locationType || 'GEOCODED_ADDRESS',
          geocodingPrecision: geoResult.precision,
          citizen: protocol.citizen ? { name: protocol.citizen.name } : undefined
        })
      }
    }

    // 4. Combinar resultados - protocolos com coordenadas + geocodificados
    const allProtocols = [
      ...protocolsWithCoords.map(p => ({
        id: p.id,
        number: p.number,
        title: p.title,
        status: p.status,
        latitude: p.latitude,
        longitude: p.longitude,
        address: p.address,
        locationType: p.locationType,
        geocodingPrecision: (p.locationType === 'GPS' || p.locationType === 'MANUAL_PIN') ? 'exact' : (p.geocodingProvider ? 'geocoded' : 'exact'),
        createdAt: p.createdAt,
        service: p.service,
        department: p.department,
        citizen: p.citizen ? { name: p.citizen.name } : undefined
      })),
      ...geocodedProtocols
    ]

    logger.info(`Mapa de demandas: ${protocolsWithCoords.length} com coordenadas + ${geocodedProtocols.length} geocodificados (${protocolsWithoutCoords.length - geocodedProtocols.length} sem localização)`)

    res.json({ success: true, data: allProtocols })
  } catch (error) {
    logger.error('Erro ao buscar protocolos com localização:', error)
    res.status(500).json({ error: 'Erro ao buscar dados do mapa' })
  }
})

// Estatísticas agregadas para o mapa
router.get('/mapa-demandas/stats', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Total de protocolos com geolocalização
    const totalWithLocation = await prisma.protocolSimplified.count({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    // Por status
    const byStatus = await prisma.protocolSimplified.groupBy({
      by: ['status'],
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      _count: {
        status: true
      }
    })

    // Por categoria de serviço
    const protocolsWithService = await prisma.protocolSimplified.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        service: {
          select: {
            category: true
          }
        }
      }
    })

    const byCategory = protocolsWithService
      .filter(p => p.service?.category) // Filtrar apenas com categoria
      .reduce((acc: any, p) => {
        const category = p.service!.category || 'Sem Categoria'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})

    res.json({
      success: true,
      data: {
        totalWithLocation,
        byStatus,
        byCategory
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do mapa:', error)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

export default router
