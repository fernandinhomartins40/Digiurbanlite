import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireManager } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { MODULE_BY_DEPARTMENT } from '../config/module-mapping';

const router = Router();

// Apply middleware
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStringParam(param: unknown): string {
  if (Array.isArray(param)) return String(param[0] || '');
  if (typeof param === 'string') return param;
  return '';
}

interface PrismaWhereClause {

  OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
  status?: string;
  type?: string;
  [key: string]: unknown;
}

function createSafeWhereClause(params: {
  search?: string;
  status?: string;
  type?: string;
  searchFields?: string[];
}): PrismaWhereClause {
  const where: PrismaWhereClause = {};

  if (params.search && params.searchFields) {
    const searchConditions: Array<Record<string, { contains: string; mode: 'insensitive' }>> = [];
    params.searchFields.forEach(field => {
      searchConditions.push({
        [field]: { contains: params.search!, mode: 'insensitive' }
      });
  });
    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.type) {
    where.type = params.type;
  }

  return where;
}

// ============================================================================
// STATS - Dashboard principal
// ============================================================================

router.get('/stats', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. Buscar departamento de Segurança Pública
  const dept = await prisma.department.findFirst({
    where: { code: 'SEGURANCA_PUBLICA' }
  });

  if (!dept) {
    res.status(404).json({ error: 'Departamento de Segurança Pública não encontrado' });
    return;
  }

  // 2. Stats dos protocolos por módulo
  const protocolsByModule = await prisma.protocolSimplified.groupBy({
    by: ['moduleType', 'status'],
    where: {
      departmentId: dept.id,
      moduleType: {
        in: MODULE_BY_DEPARTMENT.SEGURANCA_PUBLICA || []
      }
    },
    _count: true
  });

  // 3. Contagem de registros em cada módulo
  const [
    attendancesCount,
    occurrencesCount,
    patrolRequestsCount,
    cameraRequestsCount,
    anonymousTipsCount,
    criticalPointsCount,
    alertsCount,
    patrolsCount,
    guardsCount,
    surveillanceSystemsCount,
  ] = await Promise.all([
    prisma.securityAttendance.count({ where: {} }),
    prisma.securityOccurrence.count({ where: {} }),
    prisma.patrolRequest.count({ where: {} }),
    prisma.cameraRequest.count({ where: {} }),
    prisma.anonymousTip.count({ where: {} }),
    prisma.criticalPoint.count({ where: { isActive: true } }),
    prisma.securityAlert.count({ where: { isActive: true } }),
    prisma.securityPatrol.count({ where: {} }),
    prisma.municipalGuard.count({ where: { isActive: true } }),
    prisma.surveillanceSystem.count({ where: { isActive: true } }),
  ]);

  // 4. Stats específicas de segurança
  const [
    openOccurrences,
    urgentOccurrences,
    activePatrols,
    pendingPatrolRequests,
    recentTips,
    highRiskPoints,
  ] = await Promise.all([
    prisma.securityOccurrence.count({
      where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    }),
    prisma.securityOccurrence.count({
      where: {
      severity: { in: ['HIGH', 'CRITICAL'] }
      }
    }),
    prisma.securityPatrol.count({
      where: {
      status: 'ACTIVE'
      }
    }),
    prisma.patrolRequest.count({
      where: {
      status: 'pending'
      }
    }),
    prisma.anonymousTip.count({
      where: {
      status: 'received',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
    }
      }
    }),
    prisma.criticalPoint.count({
      where: {
      isActive: true,
        riskLevel: { in: ['HIGH', 'CRITICAL'] }
      }
    }),
  ]);

  res.json({
    department: {
      id: dept.id,
      name: dept.name,
      code: dept.code
    },
    modules: {
      attendances: attendancesCount,
      occurrences: occurrencesCount,
      patrolRequests: patrolRequestsCount,
      cameraRequests: cameraRequestsCount,
      anonymousTips: anonymousTipsCount,
      criticalPoints: criticalPointsCount,
      alerts: alertsCount,
      patrols: patrolsCount,
      guards: guardsCount,
      surveillanceSystems: surveillanceSystemsCount
    },
    highlights: {
      openOccurrences,
      urgentOccurrences,
      activePatrols,
      pendingPatrolRequests,
      recentTips,
      highRiskPoints
    },
    protocols: {
      byModule: protocolsByModule
    }
  });
}));

// ============================================================================
// 1. SECURITY ATTENDANCE
// ============================================================================

const securityAttendanceSchema = z.object({
  citizenName: z.string().min(1),
  citizenCpf: z.string().optional(),
  contact: z.string().min(1),
  serviceType: z.string().min(1),
  attendanceType: z.string().optional(),
  subject: z.string().min(1),
  description: z.string().min(1),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  location: z.string().optional(),
  evidence: z.any().optional(),
  status: z.string().optional()
  });

router.get('/attendances', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['citizenName', 'protocol', 'description']
  });

  const [data, total] = await Promise.all([
    prisma.securityAttendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.securityAttendance.count({ where }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/attendances', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = securityAttendanceSchema.parse(req.body);

  const protocolNumber = `SEC-${Date.now()}`;

  const attendance = await prisma.securityAttendance.create({
    data: {
      protocol: protocolNumber,
      ...validated
    }
  });

  res.status(201).json(attendance);
}));

router.put('/attendances/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = securityAttendanceSchema.partial().parse(req.body);

  const attendance = await prisma.securityAttendance.update({
    where: { id },
    data: validated
  });

  res.json(attendance);
}));

router.delete('/attendances/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.securityAttendance.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 2. SECURITY OCCURRENCE
// ============================================================================

const securityOccurrenceSchema = z.object({
  occurrenceType: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterCpf: z.string().optional(),
  victimInfo: z.any().optional(),
  officerName: z.string().optional(),
  occurrenceDate: z.string().datetime().optional(),
  status: z.string().optional(),
  evidence: z.any().optional(),
  witnesses: z.any().optional()
  });

router.get('/occurrences', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['protocol', 'description', 'location', 'reporterName']
  });

  const [data, total] = await Promise.all([
    prisma.securityOccurrence.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.securityOccurrence.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/occurrences', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = securityOccurrenceSchema.parse(req.body);

  const protocolNumber = `OCC-${Date.now()}`;

  const occurrence = await prisma.securityOccurrence.create({
    data: {
      protocol: protocolNumber,
      ...validated,
      occurrenceDate: validated.occurrenceDate ? new Date(validated.occurrenceDate) : new Date()
    }
  });

  res.status(201).json(occurrence);
}));

router.put('/occurrences/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = securityOccurrenceSchema.partial().parse(req.body);

  const occurrence = await prisma.securityOccurrence.update({
    where: { id },
    data: {
      ...validated,
      occurrenceDate: validated.occurrenceDate ? new Date(validated.occurrenceDate) : undefined
    }
  });

  res.json(occurrence);
}));

router.delete('/occurrences/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.securityOccurrence.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 3. PATROL REQUEST
// ============================================================================

const patrolRequestSchema = z.object({
  type: z.string().min(1),
  reason: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  requestedDate: z.string().datetime().optional(),
  requestedTime: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  requesterName: z.string().min(1),
  requesterPhone: z.string().min(1),
  requesterEmail: z.string().optional(),
  requesterAddress: z.string().optional(),
  description: z.string().min(1),
  concerns: z.any().optional(),
  additionalInfo: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional()
  });

router.get('/patrol-requests', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['location', 'requesterName', 'description']
  });

  const [data, total] = await Promise.all([
    prisma.patrolRequest.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.patrolRequest.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/patrol-requests', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = patrolRequestSchema.parse(req.body);

  const protocolNumber = `PATROL-${Date.now()}`;

  const patrolRequest = await prisma.patrolRequest.create({
    data: {
      protocol: protocolNumber,
      ...validated,
      requestedDate: validated.requestedDate ? new Date(validated.requestedDate) : null
    }
  });

  res.status(201).json(patrolRequest);
}));

router.put('/patrol-requests/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = patrolRequestSchema.partial().parse(req.body);

  const patrolRequest = await prisma.patrolRequest.update({
    where: { id },
    data: {
      ...validated,
      requestedDate: validated.requestedDate ? new Date(validated.requestedDate) : undefined
    }
  });

  res.json(patrolRequest);
}));

router.delete('/patrol-requests/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.patrolRequest.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 4. CAMERA REQUEST
// ============================================================================

const cameraRequestSchema = z.object({
  type: z.string().min(1),
  purpose: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  cameraType: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  justification: z.string().min(1),
  incidentDate: z.string().datetime().optional(),
  incidentTime: z.string().optional(),
  timeRange: z.any().optional(),
  incidentDescription: z.string().optional(),
  requesterName: z.string().min(1),
  requesterPhone: z.string().min(1),
  requesterEmail: z.string().optional(),
  requesterDocument: z.string().optional(),
  requesterType: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional()
  });

router.get('/camera-requests', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['location', 'requesterName', 'justification']
  });

  const [data, total] = await Promise.all([
    prisma.cameraRequest.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.cameraRequest.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/camera-requests', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = cameraRequestSchema.parse(req.body);

  const protocolNumber = `CAM-${Date.now()}`;

  const cameraRequest = await prisma.cameraRequest.create({
    data: {
      protocol: protocolNumber,
      ...validated,
      incidentDate: validated.incidentDate ? new Date(validated.incidentDate) : null
    }
  });

  res.status(201).json(cameraRequest);
}));

router.put('/camera-requests/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = cameraRequestSchema.partial().parse(req.body);

  const cameraRequest = await prisma.cameraRequest.update({
    where: { id },
    data: {
      ...validated,
      incidentDate: validated.incidentDate ? new Date(validated.incidentDate) : undefined
    }
  });

  res.json(cameraRequest);
}));

router.delete('/camera-requests/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.cameraRequest.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 5. ANONYMOUS TIP
// ============================================================================

const anonymousTipSchema = z.object({
  type: z.string().min(1),
  category: z.string().optional(),
  description: z.string().min(1),
  location: z.string().optional(),
  coordinates: z.any().optional(),
  suspectInfo: z.any().optional(),
  vehicleInfo: z.any().optional(),
  timeframe: z.string().optional(),
  frequency: z.string().optional(),
  hasEvidence: z.boolean().optional(),
  evidenceType: z.any().optional(),
  evidenceNotes: z.string().optional(),
  isUrgent: z.boolean().optional(),
  dangerLevel: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional()
  });

router.get('/anonymous-tips', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    type: getStringParam(req.query.type),
    searchFields: ['tipNumber', 'description', 'location']
  });

  const [data, total] = await Promise.all([
    prisma.anonymousTip.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.anonymousTip.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/anonymous-tips', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = anonymousTipSchema.parse(req.body);

  const tipNumber = `TIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const feedbackCode = `FB-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
  const protocolNumber = `TIP-${Date.now()}`;

  const anonymousTip = await prisma.anonymousTip.create({
    data: {
      protocol: protocolNumber,
      tipNumber,
      feedbackCode,
      ...validated
    }
  });

  res.status(201).json(anonymousTip);
}));

router.put('/anonymous-tips/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = anonymousTipSchema.partial().parse(req.body);

  const anonymousTip = await prisma.anonymousTip.update({
    where: { id },
    data: validated
  });

  res.json(anonymousTip);
}));

router.delete('/anonymous-tips/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.anonymousTip.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 6. CRITICAL POINT
// ============================================================================

const criticalPointSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  address: z.string().optional(),
  coordinates: z.any(),
  pointType: z.string().min(1),
  riskType: z.any().optional(),
  riskLevel: z.string().min(1),
  description: z.string().min(1),
  recommendations: z.string().optional(),
  recommendedActions: z.any().optional(),
  patrolFrequency: z.string().optional(),
  monitoringLevel: z.string().optional(),
  isActive: z.boolean().optional(),
  observations: z.string().optional()
  });

router.get('/critical-points', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    searchFields: ['name', 'location', 'description']
  });

  const [data, total] = await Promise.all([
    prisma.criticalPoint.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.criticalPoint.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/critical-points', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = criticalPointSchema.parse(req.body);

  const criticalPoint = await prisma.criticalPoint.create({
    data: {
      ...validated,
      monitoringLevel: validated.monitoringLevel || 'NORMAL',
      recommendations: validated.recommendations || ''
    }
  });

  res.status(201).json(criticalPoint);
}));

router.put('/critical-points/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = criticalPointSchema.partial().parse(req.body);

  const criticalPoint = await prisma.criticalPoint.update({
    where: { id },
    data: validated
  });

  res.json(criticalPoint);
}));

router.delete('/critical-points/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.criticalPoint.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 7. SECURITY ALERT
// ============================================================================

const securityAlertSchema = z.object({
  title: z.string().min(1),
  alertType: z.string().min(1),
  message: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  targetArea: z.string().optional(),
  coordinates: z.any().optional(),
  severity: z.string().min(1),
  priority: z.string().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  targetAudience: z.string().optional(),
  affectedAreas: z.any().optional(),
  channels: z.any().optional(),
  createdBy: z.string().optional()
  });

router.get('/alerts', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    searchFields: ['title', 'message', 'location']
  });

  const [data, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.securityAlert.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/alerts', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = securityAlertSchema.parse(req.body);

  const alert = await prisma.securityAlert.create({
    data: {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
      channels: (validated as any).channels || [],
      createdBy: req.user?.id || 'system'
    }
  });

  res.status(201).json(alert);
}));

router.put('/alerts/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = securityAlertSchema.partial().parse(req.body);

  const alert = await prisma.securityAlert.update({
    where: { id },
    data: {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined
    }
  });

  res.json(alert);
}));

router.delete('/alerts/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.securityAlert.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 8. SECURITY PATROL
// ============================================================================

const securityPatrolSchema = z.object({
  patrolType: z.string().min(1),
  route: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  guardId: z.string().optional(),
  guardName: z.string().optional(),
  officerName: z.string().min(1),
  officerBadge: z.string().optional(),
  vehicle: z.string().optional(),
  status: z.string().optional(),
  checkpoints: z.any().optional(),
  incidents: z.any().optional(),
  observations: z.string().optional(),
  gpsTrack: z.any().optional()
  });

router.get('/patrols', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['route', 'officerName', 'guardName']
  });

  const [data, total] = await Promise.all([
    prisma.securityPatrol.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' }
    }),
    prisma.securityPatrol.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/patrols', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = securityPatrolSchema.parse(req.body);

  const patrol = await prisma.securityPatrol.create({
    data: {
      ...validated,
      startTime: new Date(validated.startTime),
      endTime: validated.endTime ? new Date(validated.endTime) : null
    }
  });

  res.status(201).json(patrol);
}));

router.put('/patrols/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = securityPatrolSchema.partial().parse(req.body);

  const patrol = await prisma.securityPatrol.update({
    where: { id },
    data: {
      ...validated,
      startTime: validated.startTime ? new Date(validated.startTime) : undefined,
      endTime: validated.endTime ? new Date(validated.endTime) : undefined
    }
  });

  res.json(patrol);
}));

router.delete('/patrols/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.securityPatrol.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 9. MUNICIPAL GUARD
// ============================================================================

const municipalGuardSchema = z.object({
  name: z.string().min(1),
  badge: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  phone: z.string().min(1),
  email: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  admissionDate: z.string().datetime().optional(),
  status: z.string().optional(),
  specialties: z.any().optional(),
  certifications: z.any().optional(),
  assignedVehicle: z.string().optional(),
  assignedRadio: z.string().optional(),
  equipment: z.any().optional(),
  shift: z.string().optional(),
  workSchedule: z.any().optional(),
  availability: z.string().optional(),
  notes: z.string().optional(),
  emergencyContact: z.any().optional(),
  isActive: z.boolean().optional()
  });

router.get('/guards', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['name', 'badge', 'cpf']
  });

  const [data, total] = await Promise.all([
    prisma.municipalGuard.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    }),
    prisma.municipalGuard.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/guards', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = municipalGuardSchema.parse(req.body);

  const badge = validated.badge || `GM-${Date.now()}`;

  const guard = await prisma.municipalGuard.create({
    data: {
      ...validated,
      badge,
      position: (validated as any).position || 'guard',
      birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      admissionDate: validated.admissionDate ? new Date(validated.admissionDate) : new Date()
    }
  });

  res.status(201).json(guard);
}));

router.put('/guards/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = municipalGuardSchema.partial().parse(req.body);

  const guard = await prisma.municipalGuard.update({
    where: { id },
    data: {
      ...validated,
      birthDate: validated.birthDate ? new Date(validated.birthDate) : undefined,
      admissionDate: validated.admissionDate ? new Date(validated.admissionDate) : undefined
    }
  });

  res.json(guard);
}));

router.delete('/guards/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.municipalGuard.delete({
    where: { id }
  });

  res.status(204).send();
}));

// ============================================================================
// 10. SURVEILLANCE SYSTEM
// ============================================================================

const surveillanceSystemSchema = z.object({
  systemName: z.string().min(1),
  systemCode: z.string().optional(),
  type: z.string().min(1),
  location: z.string().min(1),
  address: z.string().optional(),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  zone: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  installationDate: z.string().datetime().optional(),
  warrantyExpires: z.string().datetime().optional(),
  cameraType: z.string().optional(),
  resolution: z.string().optional(),
  hasNightVision: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  recordingDays: z.number().int().optional(),
  status: z.string().optional(),
  coverageArea: z.string().optional(),
  viewAngle: z.string().optional(),
  range: z.string().optional(),
  ipAddress: z.string().optional(),
  connectionType: z.string().optional(),
  bandwidth: z.string().optional(),
  isMonitored: z.boolean().optional(),
  monitoringCenter: z.string().optional(),
  alerts: z.any().optional(),
  integratedWith: z.any().optional(),
  apiAccess: z.boolean().optional(),
  notes: z.string().optional(),
  technicalSpecs: z.any().optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional()
  });

router.get('/surveillance-systems', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(getStringParam(req.query.page) || '1');
  const limit = parseInt(getStringParam(req.query.limit) || '10');
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const skip = (page - 1) * limit;

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['systemName', 'systemCode', 'location']
  });

  const [data, total] = await Promise.all([
    prisma.surveillanceSystem.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { systemName: 'asc' }
    }),
    prisma.surveillanceSystem.count({ where: where as any }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/surveillance-systems', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validated = surveillanceSystemSchema.parse(req.body);

  const systemCode = validated.systemCode || `SYS-${Date.now()}`;

  const system = await prisma.surveillanceSystem.create({
    data: {
      ...validated,
      systemCode,
      installationDate: validated.installationDate ? new Date(validated.installationDate) : null,
      warrantyExpires: validated.warrantyExpires ? new Date(validated.warrantyExpires) : null
    }
  });

  res.status(201).json(system);
}));

router.put('/surveillance-systems/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validated = surveillanceSystemSchema.partial().parse(req.body);

  const system = await prisma.surveillanceSystem.update({
    where: { id },
    data: {
      ...validated,
      installationDate: validated.installationDate ? new Date(validated.installationDate) : undefined,
      warrantyExpires: validated.warrantyExpires ? new Date(validated.warrantyExpires) : undefined
    }
  });

  res.json(system);
}));

router.delete('/surveillance-systems/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.surveillanceSystem.delete({
    where: { id }
  });

  res.status(204).send();
}));

export default router;
