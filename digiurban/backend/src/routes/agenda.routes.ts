import { Router, Request, Response } from 'express';
import {
  CentralCalendarEventStatus,
  CentralCalendarSourceType,
  UserRole,
} from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { centralCalendarService } from '../services/central-calendar.service';

const router = Router();

router.use(authenticateToken);

const eventStatuses = new Set(Object.values(CentralCalendarEventStatus));
const sourceTypes = new Set(Object.values(CentralCalendarSourceType));

function toDate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function parseStatusList(value: unknown): CentralCalendarEventStatus[] | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const statuses = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is CentralCalendarEventStatus => eventStatuses.has(item as CentralCalendarEventStatus));

  return statuses.length > 0 ? statuses : undefined;
}

function parseSourceList(value: unknown): CentralCalendarSourceType[] | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const values = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is CentralCalendarSourceType => sourceTypes.has(item as CentralCalendarSourceType));

  return values.length > 0 ? values : undefined;
}

router.get('/calendars/mine', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const calendars = await centralCalendarService.listMyCalendars(userId);
    return res.json({ success: true, data: calendars });
  } catch (error) {
    console.error('Erro ao listar agendas do usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar agendas',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

router.post('/calendars/personal/ensure', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const calendarId = await centralCalendarService.ensurePersonalCalendar(userId);
    return res.json({ success: true, data: { calendarId } });
  } catch (error) {
    console.error('Erro ao garantir agenda pessoal:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao garantir agenda pessoal',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const includeAll =
      req.query.includeAll === 'true' &&
      (req.userRole === UserRole.ADMIN || req.userRole === UserRole.SUPER_ADMIN);

    const events = await centralCalendarService.listVisibleEvents({
      userId,
      includeAll,
      startAt: toDate(req.query.startAt),
      endAt: toDate(req.query.endAt),
      status: parseStatusList(req.query.status),
      sourceType: parseSourceList(req.query.sourceType),
      calendarId: typeof req.query.calendarId === 'string' ? req.query.calendarId : undefined,
    });

    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('Erro ao listar eventos da agenda:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar eventos',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const includeAll =
      req.query.includeAll === 'true' &&
      (req.userRole === UserRole.ADMIN || req.userRole === UserRole.SUPER_ADMIN);

    const event = await centralCalendarService.getVisibleEventById(
      userId,
      req.params.id,
      includeAll
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento não encontrado',
      });
    }

    return res.json({ success: true, data: event });
  } catch (error) {
    console.error('Erro ao buscar evento da agenda:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar evento',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!req.body?.title || !req.body?.startAt || !req.body?.endAt) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, startAt, endAt',
      });
    }

    const startAt = toDate(req.body.startAt);
    const endAt = toDate(req.body.endAt);
    if (!startAt || !endAt) {
      return res.status(400).json({
        success: false,
        error: 'startAt e endAt devem ser datas válidas',
      });
    }

    const canCreateForAnotherUser =
      req.userRole === UserRole.ADMIN || req.userRole === UserRole.SUPER_ADMIN;
    const ownerUserId =
      canCreateForAnotherUser && typeof req.body.ownerUserId === 'string'
        ? req.body.ownerUserId
        : userId;

    const event = await centralCalendarService.createManualEvent(ownerUserId, {
      title: req.body.title,
      description: req.body.description,
      eventType: req.body.eventType,
      location: req.body.location,
      startAt,
      endAt,
      allDay: Boolean(req.body.allDay),
      status:
        typeof req.body.status === 'string' && eventStatuses.has(req.body.status)
          ? req.body.status
          : undefined,
      priority:
        typeof req.body.priority === 'number' && req.body.priority > 0
          ? req.body.priority
          : undefined,
      notes: req.body.notes,
      metadata: req.body.metadata,
      isPrivate: req.body.isPrivate !== undefined ? Boolean(req.body.isPrivate) : undefined,
      sourceType:
        typeof req.body.sourceType === 'string' && sourceTypes.has(req.body.sourceType)
          ? req.body.sourceType
          : CentralCalendarSourceType.MANUAL,
      sourceReferenceId: req.body.sourceReferenceId,
      protocolId: req.body.protocolId,
      protocolStageId: req.body.protocolStageId,
      serviceId: req.body.serviceId,
      departmentId: req.body.departmentId,
      organizationalUnitId: req.body.organizationalUnitId,
      calendarId: req.body.calendarId,
      participants: Array.isArray(req.body.participants) ? req.body.participants : undefined,
      visibility: Array.isArray(req.body.visibility) ? req.body.visibility : undefined,
      links: Array.isArray(req.body.links) ? req.body.links : undefined,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Erro ao criar evento da agenda:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar evento',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const event = await centralCalendarService.updateManualEvent(userId, req.params.id, {
      title: req.body.title,
      description: req.body.description,
      eventType: req.body.eventType,
      location: req.body.location,
      startAt: toDate(req.body.startAt),
      endAt: toDate(req.body.endAt),
      allDay: req.body.allDay !== undefined ? Boolean(req.body.allDay) : undefined,
      status:
        typeof req.body.status === 'string' && eventStatuses.has(req.body.status)
          ? req.body.status
          : undefined,
      priority:
        typeof req.body.priority === 'number' && req.body.priority > 0
          ? req.body.priority
          : undefined,
      notes: req.body.notes,
      metadata: req.body.metadata,
      isPrivate: req.body.isPrivate !== undefined ? Boolean(req.body.isPrivate) : undefined,
      protocolId: req.body.protocolId,
      protocolStageId: req.body.protocolStageId,
      serviceId: req.body.serviceId,
      departmentId: req.body.departmentId,
      organizationalUnitId: req.body.organizationalUnitId,
      calendarId: req.body.calendarId,
      participants: Array.isArray(req.body.participants) ? req.body.participants : undefined,
      visibility: Array.isArray(req.body.visibility) ? req.body.visibility : undefined,
      links: Array.isArray(req.body.links) ? req.body.links : undefined,
    });

    return res.json({ success: true, data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isPermission = message.includes('permissão') || message.includes('não encontrado');

    if (!isPermission) {
      console.error('Erro ao atualizar evento da agenda:', error);
    }

    return res.status(isPermission ? 403 : 500).json({
      success: false,
      error: message,
      details: message,
    });
  }
});

router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const event = await centralCalendarService.markEventCompleted(userId, req.params.id);
    return res.json({ success: true, data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isPermission = message.includes('permissão') || message.includes('não encontrado');

    if (!isPermission) {
      console.error('Erro ao concluir evento da agenda:', error);
    }

    return res.status(isPermission ? 403 : 500).json({
      success: false,
      error: message,
      details: message,
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    await centralCalendarService.deleteEvent(userId, req.params.id);
    return res.json({ success: true, message: 'Evento removido com sucesso' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isPermission = message.includes('permissão') || message.includes('não encontrado');

    if (!isPermission) {
      console.error('Erro ao remover evento da agenda:', error);
    }

    return res.status(isPermission ? 403 : 500).json({
      success: false,
      error: message,
      details: message,
    });
  }
});
