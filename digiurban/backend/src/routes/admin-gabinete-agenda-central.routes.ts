import { Router, Request, Response, NextFunction } from 'express'
import { CentralCalendarEventStatus, CentralCalendarSourceType } from '@prisma/client'
import { adminAuthMiddleware } from '../middleware/admin-auth'
import {
  centralCalendarService,
  CentralCalendarEventWithRelations
} from '../services/central-calendar.service'

const router = Router()

const GABINETE_SOURCE_TYPES: CentralCalendarSourceType[] = [CentralCalendarSourceType.GABINETE]

const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao Gabinete do Prefeito' })
    return
  }
  next()
}

const LEGACY_TO_CENTRAL_STATUS: Record<string, CentralCalendarEventStatus> = {
  AGENDADO: CentralCalendarEventStatus.SCHEDULED,
  CONFIRMADO: CentralCalendarEventStatus.CONFIRMED,
  REALIZADO: CentralCalendarEventStatus.COMPLETED,
  CANCELADO: CentralCalendarEventStatus.CANCELED
}

const CENTRAL_TO_LEGACY_STATUS: Record<CentralCalendarEventStatus, string> = {
  SCHEDULED: 'AGENDADO',
  CONFIRMED: 'CONFIRMADO',
  IN_PROGRESS: 'CONFIRMADO',
  COMPLETED: 'REALIZADO',
  CANCELED: 'CANCELADO',
  NO_SHOW: 'CANCELADO'
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed
}

function parseLegacyStatus(status: unknown): CentralCalendarEventStatus | undefined {
  if (typeof status !== 'string') {
    return undefined
  }

  return LEGACY_TO_CENTRAL_STATUS[status.trim().toUpperCase()]
}

function toLegacyStatus(status: CentralCalendarEventStatus): string {
  return CENTRAL_TO_LEGACY_STATUS[status] || 'AGENDADO'
}

function toLegacyEvent(event: CentralCalendarEventWithRelations) {
  const metadata =
    event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
      ? (event.metadata as Record<string, unknown>)
      : {}

  return {
    id: event.id,
    tipo: event.eventType || 'OUTRO',
    titulo: event.title,
    descricao: event.description || null,
    dataHoraInicio: event.startAt,
    dataHoraFim: event.endAt,
    local: event.location || null,
    participantes: metadata.legacyParticipantes ?? null,
    status: toLegacyStatus(event.status),
    observacoes: event.notes || null,
    anexos: metadata.legacyAnexos ?? null,
    createdById: event.ownerUserId,
    createdBy: event.ownerUser
      ? {
          id: event.ownerUser.id,
          name: event.ownerUser.name,
          email: event.ownerUser.email
        }
      : null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }
}

async function listGabineteEvents(userId: string, query: Request['query']) {
  const startAt = parseDate(query.startDate)
  const endAt = parseDate(query.endDate)
  const status = parseLegacyStatus(query.status)
  const tipo = typeof query.tipo === 'string' && query.tipo.trim().length > 0 ? query.tipo.trim() : undefined

  const events = await centralCalendarService.listVisibleEvents({
    userId,
    includeAll: true,
    startAt,
    endAt,
    status: status ? [status] : undefined,
    sourceType: GABINETE_SOURCE_TYPES
  })

  const filtered = tipo ? events.filter((event) => event.eventType === tipo) : events
  return filtered.map(toLegacyEvent)
}

router.get('/', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const events = await listGabineteEvents(req.user!.id, req.query)
    res.json({ success: true, data: events })
  } catch (error) {
    console.error('Erro ao buscar eventos da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao buscar eventos da agenda' })
  }
})

router.get('/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await centralCalendarService.getVisibleEventById(req.user!.id, req.params.id, true)

    if (!event || !GABINETE_SOURCE_TYPES.includes(event.sourceType)) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    res.json({ success: true, data: toLegacyEvent(event) })
  } catch (error) {
    console.error('Erro ao buscar evento da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao buscar evento' })
  }
})

router.post('/', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
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

    if (!tipo || !titulo || !dataHoraInicio || !dataHoraFim) {
      res.status(400).json({
        error: 'Campos obrigatórios: tipo, titulo, dataHoraInicio, dataHoraFim'
      })
      return
    }

    const parsedStatus = status === undefined ? undefined : parseLegacyStatus(status)
    if (status !== undefined && !parsedStatus) {
      res.status(400).json({ error: 'Status inválido para agenda do gabinete' })
      return
    }

    const created = await centralCalendarService.createManualEvent(req.user!.id, {
      title: titulo,
      description: descricao || undefined,
      eventType: tipo,
      location: local || undefined,
      startAt: new Date(dataHoraInicio),
      endAt: new Date(dataHoraFim),
      status: parsedStatus || CentralCalendarEventStatus.SCHEDULED,
      notes: observacoes || undefined,
      isPrivate: false,
      sourceType: CentralCalendarSourceType.GABINETE,
      metadata: {
        legacyParticipantes: participantes ?? null,
        legacyAnexos: anexos ?? null
      }
    })

    res.status(201).json({ success: true, data: toLegacyEvent(created) })
  } catch (error) {
    console.error('Erro ao criar evento da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao criar evento' })
  }
})

router.put('/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await centralCalendarService.getVisibleEventById(req.user!.id, req.params.id, true)
    if (!existing || !GABINETE_SOURCE_TYPES.includes(existing.sourceType)) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

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

    const parsedStatus = status === undefined ? undefined : parseLegacyStatus(status)
    if (status !== undefined && !parsedStatus) {
      res.status(400).json({ error: 'Status inválido para agenda do gabinete' })
      return
    }

    const metadata =
      existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {}

    if (participantes !== undefined) {
      metadata.legacyParticipantes = participantes
    }

    if (anexos !== undefined) {
      metadata.legacyAnexos = anexos
    }

    const updated = await centralCalendarService.updateManualEvent(req.user!.id, req.params.id, {
      ...(tipo !== undefined && { eventType: tipo }),
      ...(titulo !== undefined && { title: titulo }),
      ...(descricao !== undefined && { description: descricao }),
      ...(dataHoraInicio && { startAt: new Date(dataHoraInicio) }),
      ...(dataHoraFim && { endAt: new Date(dataHoraFim) }),
      ...(local !== undefined && { location: local }),
      ...(parsedStatus && { status: parsedStatus }),
      ...(observacoes !== undefined && { notes: observacoes }),
      ...(participantes !== undefined || anexos !== undefined ? { metadata } : {})
    })

    res.json({ success: true, data: toLegacyEvent(updated) })
  } catch (error) {
    console.error('Erro ao atualizar evento da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao atualizar evento' })
  }
})

router.delete('/:id', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await centralCalendarService.getVisibleEventById(req.user!.id, req.params.id, true)
    if (!existing || !GABINETE_SOURCE_TYPES.includes(existing.sourceType)) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    await centralCalendarService.deleteEvent(req.user!.id, req.params.id)
    res.json({ success: true, message: 'Evento excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir evento da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao excluir evento' })
  }
})

router.patch('/:id/realize', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await centralCalendarService.getVisibleEventById(req.user!.id, req.params.id, true)
    if (!existing || !GABINETE_SOURCE_TYPES.includes(existing.sourceType)) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    const updated = await centralCalendarService.markEventCompleted(req.user!.id, req.params.id)
    res.json({ success: true, data: toLegacyEvent(updated) })
  } catch (error) {
    console.error('Erro ao concluir evento da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do evento' })
  }
})

router.get('/upcoming', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const hoursRaw = Number(req.query.hours || 24)
    const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : 24
    const now = new Date()
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000)

    const events = await centralCalendarService.listVisibleEvents({
      userId: req.user!.id,
      includeAll: true,
      startAt: now,
      endAt: future,
      status: [CentralCalendarEventStatus.SCHEDULED, CentralCalendarEventStatus.CONFIRMED],
      sourceType: GABINETE_SOURCE_TYPES
    })

    res.json({ success: true, data: events.map(toLegacyEvent) })
  } catch (error) {
    console.error('Erro ao buscar eventos próximos da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao buscar eventos próximos' })
  }
})

router.get('/conflicts', adminAuthMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await centralCalendarService.listVisibleEvents({
      userId: req.user!.id,
      includeAll: true,
      sourceType: GABINETE_SOURCE_TYPES
    })

    const normalizedEvents = events
      .filter((event) => event.status !== CentralCalendarEventStatus.CANCELED)
      .map(toLegacyEvent)

    const conflicts: Array<{
      event1: any
      event2: any
      overlap: { start: Date; end: Date }
    }> = []

    for (let i = 0; i < normalizedEvents.length; i++) {
      for (let j = i + 1; j < normalizedEvents.length; j++) {
        const event1 = normalizedEvents[i]
        const event2 = normalizedEvents[j]

        const start1 = new Date(event1.dataHoraInicio)
        const end1 = new Date(event1.dataHoraFim)
        const start2 = new Date(event2.dataHoraInicio)
        const end2 = new Date(event2.dataHoraFim)

        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            event1,
            event2,
            overlap: {
              start: new Date(Math.max(start1.getTime(), start2.getTime())),
              end: new Date(Math.min(end1.getTime(), end2.getTime()))
            }
          })
        }
      }
    }

    res.json({ success: true, data: conflicts })
  } catch (error) {
    console.error('Erro ao buscar conflitos da agenda centralizada:', error)
    res.status(500).json({ error: 'Erro ao buscar conflitos' })
  }
})

export default router
