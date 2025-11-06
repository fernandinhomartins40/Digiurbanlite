import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { tenantMiddleware } from '../middleware/tenant';
import { authenticateToken, requireManager } from '../middleware/auth';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { generateProtocolNumber } from '../utils/protocol-number-generator';
import { MODULE_BY_DEPARTMENT } from '../config/module-mapping';

// ===== TIPOS LOCAIS ISOLADOS =====

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getStringParam(param: unknown): string {
  if (Array.isArray(param)) return String(param[0] || '');
  if (typeof param === 'string') return param;
  if (param && typeof param === 'object' && param !== null) {
    return String(param);
  }
  return '';
}

interface PrismaWhereClause {
  tenantId: string;
  OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
  status?: string;
  type?: string;
  severity?: string;
  occurrenceType?: string;
  [key: string]: unknown;
}

function createSafeWhereClause(params: {
  tenantId: string;
  search?: string;
  status?: string;
  type?: string;
  severity?: string;
  occurrenceType?: string;
  searchFields?: string[];
}): PrismaWhereClause {
  const where: PrismaWhereClause = {
    tenantId: params.tenantId
  };

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

  if (params.status) where.status = params.status;
  if (params.type) where.type = params.type;
  if (params.severity) where.severity = params.severity;
  if (params.occurrenceType) where.occurrenceType = params.occurrenceType;

  return where;
}

const router = Router();

// Apply middleware
router.use(tenantMiddleware);

// ====================== VALIDATION SCHEMAS ======================

const securityAttendanceSchema = z.object({
  protocol: z.string().min(1).optional(),
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
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']).optional(),
  assignedOfficer: z.string().optional(),
  referredTo: z.string().optional(),
});

const securityOccurrenceSchema = z.object({
  protocol: z.string().min(1).optional(),
  occurrenceType: z.string().min(1),
  type: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterCpf: z.string().optional(),
  victimInfo: z.any().optional(),
  officerName: z.string().optional(),
  dateTime: z.string().datetime().optional(),
  occurrenceDate: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED']).optional(),
  evidence: z.any().optional(),
  witnesses: z.any().optional(),
});

const patrolRequestSchema = z.object({
  type: z.enum(['preventive', 'monitoring', 'event', 'complaint']),
  reason: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  requestedDate: z.string().datetime().optional(),
  requestedTime: z.string().optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  duration: z.string().optional(),
  requesterName: z.string().min(1),
  requesterPhone: z.string().min(1),
  requesterEmail: z.string().optional(),
  requesterAddress: z.string().optional(),
  description: z.string().min(1),
  concerns: z.any().optional(),
  additionalInfo: z.string().optional(),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const cameraRequestSchema = z.object({
  type: z.enum(['installation', 'maintenance', 'footage', 'relocation']),
  purpose: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  cameraType: z.enum(['fixed', 'ptz', 'dome', 'speed']).optional(),
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
  requesterType: z.enum(['citizen', 'business', 'institution', 'police']).optional(),
  status: z.enum(['pending', 'analysis', 'approved', 'in_installation', 'completed', 'denied']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const anonymousTipSchema = z.object({
  type: z.enum(['drug_trafficking', 'theft', 'violence', 'vandalism', 'corruption', 'other']),
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
  dangerLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['received', 'under_review', 'investigating', 'resolved', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  isAnonymous: z.boolean().optional(),
  anonymityLevel: z.enum(['partial', 'full']).optional(),
});

const criticalPointSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  address: z.string().optional(),
  coordinates: z.any(),
  pointType: z.string().min(1),
  riskType: z.any().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  recommendations: z.string().optional(),
  recommendedActions: z.any().optional(),
  patrolFrequency: z.string().optional(),
  monitoringLevel: z.enum(['BASIC', 'NORMAL', 'INTENSIVE', 'CONSTANT']).optional(),
  observations: z.string().optional(),
});

const securityAlertSchema = z.object({
  title: z.string().min(1),
  alertType: z.string().min(1),
  type: z.string().optional(),
  message: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  targetArea: z.string().optional(),
  coordinates: z.any().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  isActive: z.boolean().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  targetAudience: z.string().optional(),
  affectedAreas: z.any().optional(),
  channels: z.any().optional(),
  createdBy: z.string().optional(),
});

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
  status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  checkpoints: z.any().optional(),
  incidents: z.any().optional(),
  observations: z.string().optional(),
  gpsTrack: z.any().optional(),
});

const municipalGuardSchema = z.object({
  name: z.string().min(1),
  badge: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  phone: z.string().min(1),
  email: z.string().optional(),
  address: z.string().optional(),
  position: z.enum(['guard', 'sergeant', 'lieutenant', 'captain']),
  admissionDate: z.string().datetime(),
  status: z.enum(['active', 'on_leave', 'suspended', 'retired']).optional(),
  specialties: z.any().optional(),
  certifications: z.any().optional(),
  assignedVehicle: z.string().optional(),
  assignedRadio: z.string().optional(),
  assignedBadge: z.string().optional(),
  equipment: z.any().optional(),
  shift: z.enum(['morning', 'afternoon', 'night', 'rotating']).optional(),
  workSchedule: z.any().optional(),
  availability: z.enum(['available', 'on_patrol', 'off_duty', 'unavailable']).optional(),
  notes: z.string().optional(),
  emergencyContact: z.any().optional(),
  isActive: z.boolean().optional(),
});

const surveillanceSystemSchema = z.object({
  systemName: z.string().min(1),
  systemCode: z.string().optional(),
  type: z.enum(['camera', 'alarm', 'sensor', 'integrated']),
  location: z.string().min(1),
  address: z.string().optional(),
  coordinates: z.any().optional(),
  area: z.string().optional(),
  zone: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  installationDate: z.string().datetime().optional(),
  warrantyExpires: z.string().datetime().optional(),
  cameraType: z.enum(['fixed', 'ptz', 'dome', 'speed']).optional(),
  resolution: z.enum(['720p', '1080p', '4K']).optional(),
  hasNightVision: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  recordingDays: z.number().int().optional(),
  status: z.enum(['operational', 'maintenance', 'offline', 'damaged']).optional(),
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
  createdBy: z.string().optional(),
});

// ====================== STATS ROUTE ======================

router.get(
  '/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;

    // Buscar departamento de Segurança Pública
    const dept = await prisma.department.findFirst({
      where: { code: 'SEGURANCA_PUBLICA' }
    });

    if (!dept) {
      return res.status(404).json({
        success: false,
        error: 'DEPARTMENT_NOT_FOUND',
        message: 'Departamento de Segurança Pública não encontrado'
      });
    }

    // Stats por módulo usando ProtocolSimplified
    const protocolsByModule = await prisma.protocolSimplified.groupBy({
      by: ['moduleType', 'status'],
      where: {
        tenantId,
        departmentId: dept.id,
        moduleType: {
          in: MODULE_BY_DEPARTMENT.SEGURANCA_PUBLICA || []
        },
      },
      _count: {
        id: true,
      },
    });

    // Contar registros nos módulos
    const [
      securityAttendanceCount,
      securityOccurrenceCount,
      patrolRequestCount,
      cameraRequestCount,
      anonymousTipCount,
      criticalPointCount,
      securityAlertCount,
      securityPatrolCount,
      municipalGuardCount,
      surveillanceSystemCount,
    ] = await Promise.all([
      prisma.securityAttendance.count({ where: { tenantId } }),
      prisma.securityOccurrence.count({ where: { tenantId } }),
      prisma.patrolRequest.count({ where: { tenantId } }),
      prisma.cameraRequest.count({ where: { tenantId } }),
      prisma.anonymousTip.count({ where: { tenantId } }),
      prisma.criticalPoint.count({ where: { tenantId } }),
      prisma.securityAlert.count({ where: { tenantId } }),
      prisma.securityPatrol.count({ where: { tenantId } }),
      prisma.municipalGuard.count({ where: { tenantId } }),
      prisma.surveillanceSystem.count({ where: { tenantId } }),
    ]);

    // Agrupar stats por módulo
    const moduleStats: Record<string, { total: number; byStatus: Record<string, number> }> = {};

    protocolsByModule.forEach(item => {
      const moduleType = item.moduleType || 'UNKNOWN';
      if (!moduleStats[moduleType]) {
        moduleStats[moduleType] = { total: 0, byStatus: {} };
      }
      moduleStats[moduleType].total += item._count.id;
      moduleStats[moduleType].byStatus[item.status] = item._count.id;
    });

    const response = {
      success: true,
      data: {
        department: {
          id: dept.id,
          name: dept.name,
          code: dept.code,
        },
        protocolStats: moduleStats,
        moduleCounts: {
          securityAttendances: securityAttendanceCount,
          securityOccurrences: securityOccurrenceCount,
          patrolRequests: patrolRequestCount,
          cameraRequests: cameraRequestCount,
          anonymousTips: anonymousTipCount,
          criticalPoints: criticalPointCount,
          securityAlerts: securityAlertCount,
          securityPatrols: securityPatrolCount,
          municipalGuards: municipalGuardCount,
          surveillanceSystems: surveillanceSystemCount,
        },
        totalRegistros:
          securityAttendanceCount +
          securityOccurrenceCount +
          patrolRequestCount +
          cameraRequestCount +
          anonymousTipCount +
          criticalPointCount +
          securityAlertCount +
          securityPatrolCount +
          municipalGuardCount +
          surveillanceSystemCount,
      },
    };

    return res.json(response);
  })
);

// ====================== SECURITY ATTENDANCE ROUTES ======================

router.get(
  '/atendimentos',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const urgency = getStringParam(req.query.urgency);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      searchFields: ['citizenName', 'citizenCpf', 'subject', 'description']
    });

    if (urgency) where.urgency = urgency;

    const [data, total] = await Promise.all([
      prisma.securityAttendance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityAttendance.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/atendimentos',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = securityAttendanceSchema.parse(req.body);

    const protocolNumber = data.protocol || generateProtocolNumber();

    const attendance = await prisma.securityAttendance.create({
      data: {
        tenantId,
        protocol: protocolNumber,
        citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        contact: data.contact,
        serviceType: data.serviceType,
        attendanceType: data.attendanceType,
        subject: data.subject,
        description: data.description,
        urgency: data.urgency || 'NORMAL',
        location: data.location,
        evidence: data.evidence,
        status: data.status || 'PENDING',
        assignedOfficer: data.assignedOfficer,
        referredTo: data.referredTo,
      },
    });

    return res.status(201).json({
      success: true,
      data: attendance,
      message: 'Atendimento criado com sucesso',
    });
  })
);

// ====================== SECURITY OCCURRENCE ROUTES ======================

router.get(
  '/ocorrencias',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const severity = getStringParam(req.query.severity);
    const occurrenceType = getStringParam(req.query.occurrenceType);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      severity,
      occurrenceType,
      searchFields: ['description', 'location', 'reporterName']
    });

    const [data, total] = await Promise.all([
      prisma.securityOccurrence.findMany({
        where,
        orderBy: { occurrenceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityOccurrence.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/ocorrencias',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = securityOccurrenceSchema.parse(req.body);

    const protocolNumber = data.protocol || generateProtocolNumber();

    const occurrence = await prisma.securityOccurrence.create({
      data: {
        tenantId,
        protocol: protocolNumber,
        occurrenceType: data.occurrenceType,
        type: data.type,
        severity: data.severity,
        description: data.description,
        location: data.location,
        coordinates: data.coordinates,
        reporterName: data.reporterName,
        reporterPhone: data.reporterPhone,
        reporterCpf: data.reporterCpf,
        victimInfo: data.victimInfo,
        officerName: data.officerName,
        dateTime: data.dateTime ? new Date(data.dateTime) : null,
        occurrenceDate: data.occurrenceDate ? new Date(data.occurrenceDate) : new Date(),
        status: data.status || 'OPEN',
        evidence: data.evidence,
        witnesses: data.witnesses,
      },
    });

    return res.status(201).json({
      success: true,
      data: occurrence,
      message: 'Ocorrência registrada com sucesso',
    });
  })
);

// ====================== PATROL REQUEST ROUTES ======================

router.get(
  '/solicitacoes-ronda',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const type = getStringParam(req.query.type);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      type,
      searchFields: ['location', 'requesterName', 'description']
    });

    const [data, total] = await Promise.all([
      prisma.patrolRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.patrolRequest.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/solicitacoes-ronda',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = patrolRequestSchema.parse(req.body);

    const request = await prisma.patrolRequest.create({
      data: {
        tenantId,
        type: data.type,
        reason: data.reason,
        location: data.location,
        coordinates: data.coordinates,
        area: data.area,
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
        requestedTime: data.requestedTime,
        frequency: data.frequency,
        duration: data.duration,
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail,
        requesterAddress: data.requesterAddress,
        description: data.description,
        concerns: data.concerns,
        additionalInfo: data.additionalInfo,
        status: data.status || 'pending',
        priority: data.priority || 'normal',
      },
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Solicitação de ronda criada com sucesso',
    });
  })
);

// ====================== CAMERA REQUEST ROUTES ======================

router.get(
  '/solicitacoes-cameras',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const type = getStringParam(req.query.type);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      type,
      searchFields: ['location', 'requesterName', 'justification']
    });

    const [data, total] = await Promise.all([
      prisma.cameraRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cameraRequest.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/solicitacoes-cameras',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = cameraRequestSchema.parse(req.body);

    const request = await prisma.cameraRequest.create({
      data: {
        tenantId,
        type: data.type,
        purpose: data.purpose,
        location: data.location,
        coordinates: data.coordinates,
        area: data.area,
        address: data.address,
        cameraType: data.cameraType,
        quantity: data.quantity || 1,
        justification: data.justification,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        incidentTime: data.incidentTime,
        timeRange: data.timeRange,
        incidentDescription: data.incidentDescription,
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail,
        requesterDocument: data.requesterDocument,
        requesterType: data.requesterType,
        status: data.status || 'pending',
        priority: data.priority || 'normal',
      },
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Solicitação de câmera criada com sucesso',
    });
  })
);

// ====================== ANONYMOUS TIP ROUTES ======================

router.get(
  '/denuncias-anonimas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const type = getStringParam(req.query.type);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      type,
      searchFields: ['description', 'location']
    });

    const [data, total] = await Promise.all([
      prisma.anonymousTip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.anonymousTip.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/denuncias-anonimas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = anonymousTipSchema.parse(req.body);

    const tipNumber = `TIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const feedbackCode = `FB-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

    const tip = await prisma.anonymousTip.create({
      data: {
        tenantId,
        type: data.type,
        category: data.category,
        description: data.description,
        location: data.location,
        coordinates: data.coordinates,
        suspectInfo: data.suspectInfo,
        vehicleInfo: data.vehicleInfo,
        timeframe: data.timeframe,
        frequency: data.frequency,
        hasEvidence: data.hasEvidence || false,
        evidenceType: data.evidenceType,
        evidenceNotes: data.evidenceNotes,
        isUrgent: data.isUrgent || false,
        dangerLevel: data.dangerLevel,
        tipNumber,
        status: data.status || 'received',
        priority: data.priority || 'normal',
        isAnonymous: data.isAnonymous !== false,
        anonymityLevel: data.anonymityLevel || 'full',
        feedbackCode,
      },
    });

    return res.status(201).json({
      success: true,
      data: tip,
      message: 'Denúncia anônima registrada com sucesso',
    });
  })
);

// ====================== CRITICAL POINT ROUTES ======================

router.get(
  '/pontos-criticos',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const riskLevel = getStringParam(req.query.riskLevel);
    const isActive = req.query.isActive === 'true';
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      searchFields: ['name', 'location', 'description']
    });

    if (riskLevel) where.riskLevel = riskLevel;
    if (req.query.isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.criticalPoint.findMany({
        where,
        orderBy: { riskLevel: 'desc' },
        skip,
        take: limit,
      }),
      prisma.criticalPoint.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/pontos-criticos',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = criticalPointSchema.parse(req.body);

    const point = await prisma.criticalPoint.create({
      data: {
        tenantId,
        name: data.name,
        location: data.location,
        address: data.address,
        coordinates: data.coordinates,
        pointType: data.pointType,
        riskType: data.riskType,
        riskLevel: data.riskLevel,
        description: data.description,
        recommendations: data.recommendations || '',
        recommendedActions: data.recommendedActions,
        patrolFrequency: data.patrolFrequency,
        monitoringLevel: data.monitoringLevel || 'NORMAL',
        isActive: true,
        observations: data.observations,
      },
    });

    return res.status(201).json({
      success: true,
      data: point,
      message: 'Ponto crítico cadastrado com sucesso',
    });
  })
);

// ====================== SECURITY ALERT ROUTES ======================

router.get(
  '/alertas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const severity = getStringParam(req.query.severity);
    const isActive = req.query.isActive === 'true';
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      severity,
      searchFields: ['title', 'message', 'description']
    });

    if (req.query.isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityAlert.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/alertas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = securityAlertSchema.parse(req.body);

    const alert = await prisma.securityAlert.create({
      data: {
        tenantId,
        title: data.title,
        alertType: data.alertType,
        type: data.type,
        message: data.message,
        description: data.description,
        location: data.location,
        targetArea: data.targetArea,
        coordinates: data.coordinates,
        severity: data.severity,
        priority: data.priority || 'MEDIUM',
        isActive: data.isActive !== false,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        targetAudience: data.targetAudience,
        affectedAreas: data.affectedAreas,
        channels: data.channels || ['web', 'app'],
        createdBy: data.createdBy || req.user.name || 'Sistema',
      },
    });

    return res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerta de segurança criado com sucesso',
    });
  })
);

// ====================== SECURITY PATROL ROUTES ======================

router.get(
  '/patrulhas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      searchFields: ['route', 'officerName', 'guardName']
    });

    const [data, total] = await Promise.all([
      prisma.securityPatrol.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityPatrol.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/patrulhas',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = securityPatrolSchema.parse(req.body);

    const patrol = await prisma.securityPatrol.create({
      data: {
        tenantId,
        patrolType: data.patrolType,
        route: data.route,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        guardId: data.guardId,
        guardName: data.guardName,
        officerName: data.officerName,
        officerBadge: data.officerBadge,
        vehicle: data.vehicle,
        status: data.status || 'ACTIVE',
        checkpoints: data.checkpoints,
        incidents: data.incidents,
        observations: data.observations,
        gpsTrack: data.gpsTrack,
      },
    });

    return res.status(201).json({
      success: true,
      data: patrol,
      message: 'Patrulha registrada com sucesso',
    });
  })
);

// ====================== MUNICIPAL GUARD ROUTES ======================

router.get(
  '/guardas-municipais',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const position = getStringParam(req.query.position);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      searchFields: ['name', 'badge', 'cpf']
    });

    if (position) where.position = position;

    const [data, total] = await Promise.all([
      prisma.municipalGuard.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.municipalGuard.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/guardas-municipais',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = municipalGuardSchema.parse(req.body);

    const badge = data.badge || `GM-${Date.now()}`;

    const guard = await prisma.municipalGuard.create({
      data: {
        tenantId,
        name: data.name,
        badge,
        cpf: data.cpf,
        rg: data.rg,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        position: data.position,
        admissionDate: new Date(data.admissionDate),
        status: data.status || 'active',
        specialties: data.specialties,
        certifications: data.certifications,
        assignedVehicle: data.assignedVehicle,
        assignedRadio: data.assignedRadio,
        assignedBadge: data.assignedBadge,
        equipment: data.equipment,
        shift: data.shift,
        workSchedule: data.workSchedule,
        availability: data.availability || 'available',
        notes: data.notes,
        emergencyContact: data.emergencyContact,
        isActive: data.isActive !== false,
      },
    });

    return res.status(201).json({
      success: true,
      data: guard,
      message: 'Guarda municipal cadastrado com sucesso',
    });
  })
);

// ====================== SURVEILLANCE SYSTEM ROUTES ======================

router.get(
  '/sistemas-vigilancia',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const type = getStringParam(req.query.type);
    const page = parseInt(getStringParam(req.query.page)) || 1;
    const limit = parseInt(getStringParam(req.query.limit)) || 20;
    const skip = (page - 1) * limit;

    const where = createSafeWhereClause({
      tenantId,
      search,
      status,
      type,
      searchFields: ['systemName', 'systemCode', 'location']
    });

    const [data, total] = await Promise.all([
      prisma.surveillanceSystem.findMany({
        where,
        orderBy: { systemName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.surveillanceSystem.count({ where }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/sistemas-vigilancia',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.tenantId;
    const data = surveillanceSystemSchema.parse(req.body);

    const systemCode = data.systemCode || `SYS-${Date.now()}`;

    const system = await prisma.surveillanceSystem.create({
      data: {
        tenantId,
        systemName: data.systemName,
        systemCode,
        type: data.type,
        location: data.location,
        address: data.address,
        coordinates: data.coordinates,
        area: data.area,
        zone: data.zone,
        manufacturer: data.manufacturer,
        model: data.model,
        installationDate: data.installationDate ? new Date(data.installationDate) : null,
        warrantyExpires: data.warrantyExpires ? new Date(data.warrantyExpires) : null,
        cameraType: data.cameraType,
        resolution: data.resolution,
        hasNightVision: data.hasNightVision || false,
        hasAudio: data.hasAudio || false,
        recordingDays: data.recordingDays,
        status: data.status || 'operational',
        coverageArea: data.coverageArea,
        viewAngle: data.viewAngle,
        range: data.range,
        ipAddress: data.ipAddress,
        connectionType: data.connectionType,
        bandwidth: data.bandwidth,
        isMonitored: data.isMonitored !== false,
        monitoringCenter: data.monitoringCenter,
        alerts: data.alerts,
        integratedWith: data.integratedWith,
        apiAccess: data.apiAccess || false,
        notes: data.notes,
        technicalSpecs: data.technicalSpecs,
        isActive: data.isActive !== false,
        createdBy: data.createdBy || req.user.name || 'Sistema',
      },
    });

    return res.status(201).json({
      success: true,
      data: system,
      message: 'Sistema de vigilância cadastrado com sucesso',
    });
  })
);

// ====================== ERROR HANDLING ======================

router.use((error: unknown, _req: any, res: Response, _next: NextFunction) => {
  console.error('Erro nas rotas de segurança pública:', error);

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details: error.issues,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      details: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'Erro desconhecido',
  });
});

export default router;
