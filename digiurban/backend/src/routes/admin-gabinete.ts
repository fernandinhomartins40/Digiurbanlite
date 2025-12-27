import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { adminAuthMiddleware } from '../middleware/admin-auth'
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

// Buscar protocolos com geolocalização
router.get('/mapa-demandas/protocols', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { categoria, status, startDate, endDate } = req.query

    const where: any = {
      latitude: { not: null },
      longitude: { not: null }
    }

    if (categoria) {
      where.service = {
        category: categoria
      }
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        latitude: true,
        longitude: true,
        address: true,
        locationType: true, // GPS, CITIZEN_ADDRESS, SPECIFIC_LOCATION, MANUAL_PIN
        createdAt: true,
        service: {
          select: {
            name: true,
            category: true
          }
      },
        department: {
          select: {
            name: true
          }
      },
        citizen: {
          select: {
            name: true
          }
      }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: protocols })
  } catch (error) {
    console.error('Erro ao buscar protocolos com localização:', error)
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
