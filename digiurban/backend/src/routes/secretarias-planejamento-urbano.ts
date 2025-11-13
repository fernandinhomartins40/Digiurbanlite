import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { MODULE_BY_DEPARTMENT } from '../config/module-mapping';
import { protocolStatusEngine } from '../services/protocol-status.engine';

const router = Router();

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

router.get('/stats', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. Buscar departamento de Planejamento Urbano
  const dept = await prisma.department.findFirst({
    where: { code: 'PLANEJAMENTO_URBANO' }
  });

  if (!dept) {
    return res.status(404).json({ error: 'Departamento de Planejamento Urbano não encontrado' });
  }

  // 2. Stats dos protocolos por módulo
  const protocolsByModule = await prisma.protocolSimplified.groupBy({
    by: ['moduleType', 'status'],
    where: {
      departmentId: dept.id,
      moduleType: {
        in: MODULE_BY_DEPARTMENT.PLANEJAMENTO_URBANO || []
      }
    },
    _count: true
  });

  // 3. Contagem de registros em cada módulo
  const [
    projectApprovalsCount,
    buildingPermitsCount,
    businessLicensesCount,
    certificateRequestsCount,
    urbanInfractionsCount,
    urbanZoningsCount,
    attendancesCount,
  ] = await Promise.all([
    prisma.projectApproval.count({ where: {} }),
    prisma.buildingPermit.count({ where: {} }),
    prisma.businessLicense.count({ where: {} }),
    prisma.certificateRequest.count({ where: {} }),
    prisma.urbanInfraction.count({ where: {} }),
    prisma.urbanZoning.count({ where: {} }),
    prisma.urbanPlanningAttendance.count({ where: {} }),
  ]);

  // 4. Stats específicas de planejamento urbano
  const [
    projectsUnderReview,
    pendingBuildingPermits,
    pendingBusinessLicenses,
    pendingCertificates,
    openInfractions,
    activeZonings,
    openAttendances,
  ] = await Promise.all([
    prisma.projectApproval.count({
      where: {
        status: 'UNDER_REVIEW'
      }
    }),
    prisma.buildingPermit.count({
      where: {
        status: 'PENDING'
      }
    }),
    prisma.businessLicense.count({
      where: {
        status: 'PENDING'
      }
    }),
    prisma.certificateRequest.count({
      where: {
        status: 'PENDING'
      }
    }),
    prisma.urbanInfraction.count({
      where: {
        status: 'OPEN'
      }
    }),
    prisma.urbanZoning.count({
      where: {
        isActive: true
      }
    }),
    prisma.urbanPlanningAttendance.count({
      where: {
        status: 'OPEN'
      }
    }),
  ]);

  res.json({
    department: {
      id: dept.id,
      name: dept.name,
      code: dept.code
    },
    totalModules: 7,
    protocols: {
      byModule: protocolsByModule,
      total: protocolsByModule.reduce((acc, p) => acc + p._count, 0)
    },
    modules: {
      projectApprovals: {
        total: projectApprovalsCount,
        underReview: projectsUnderReview
      },
      buildingPermits: {
        total: buildingPermitsCount,
        pending: pendingBuildingPermits
      },
      businessLicenses: {
        total: businessLicensesCount,
        pending: pendingBusinessLicenses
      },
      certificateRequests: {
        total: certificateRequestsCount,
        pending: pendingCertificates
      },
      urbanInfractions: {
        total: urbanInfractionsCount,
        open: openInfractions
      },
      urbanZonings: {
        total: urbanZoningsCount,
        active: activeZonings
      },
      attendances: {
        total: attendancesCount,
        open: openAttendances
      }
    },
    summary: {
      totalRecords: projectApprovalsCount + buildingPermitsCount + businessLicensesCount +
                    certificateRequestsCount + urbanInfractionsCount + urbanZoningsCount + attendancesCount,
      pendingActions: projectsUnderReview + pendingBuildingPermits + pendingBusinessLicenses +
                      pendingCertificates + openInfractions + openAttendances
    }
  });
}));

// ============================================================================
// APROVAÇÃO DE PROJETOS
// ============================================================================

router.get('/aprovacao-projetos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['projectName', 'applicantName', 'projectType']
  });

  const projectApprovals = await prisma.projectApproval.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json(projectApprovals);
}));

router.post('/aprovacao-projetos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Atualizar para novo schema do ProjectApproval
  res.status(501).json({ error: 'Not implemented', message: 'Endpoint sendo migrado para novo schema' });
}));

router.put('/aprovacao-projetos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const projectApproval = await prisma.projectApproval.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: projectApproval.count });
}));

router.delete('/aprovacao-projetos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.projectApproval.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// ALVARÁS DE CONSTRUÇÃO
// ============================================================================

router.get('/alvaras-construcao', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['applicantName', 'propertyAddress', 'permitType']
  });

  const buildingPermits = await prisma.buildingPermit.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json(buildingPermits);
}));

router.post('/alvaras-construcao', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Atualizar para novo schema do BuildingPermit
  res.status(501).json({ error: 'Not implemented', message: 'Endpoint sendo migrado para novo schema' });
}));

router.put('/alvaras-construcao/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const buildingPermit = await prisma.buildingPermit.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: buildingPermit.count });
}));

router.delete('/alvaras-construcao/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.buildingPermit.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// ALVARÁS DE FUNCIONAMENTO
// ============================================================================

router.get('/alvaras-funcionamento', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['applicantName', 'businessName', 'businessActivity']
  });

  const businessLicenses = await prisma.businessLicense.findMany({
    where,
    orderBy: { submissionDate: 'desc' }
  });

  res.json(businessLicenses);
}));

router.post('/alvaras-funcionamento', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    applicantName: z.string(),
    applicantCpfCnpj: z.string(),
    applicantPhone: z.string().optional(),
    applicantEmail: z.string().optional(),
    businessName: z.string(),
    businessType: z.string(),
    businessActivity: z.string(),
    propertyAddress: z.string(),
    propertyNumber: z.string().optional(),
    neighborhood: z.string().optional(),
    licenseType: z.string(),
    observations: z.string().optional(),
    documents: z.any().optional()
  });

  const data = schema.parse(req.body);

  const businessLicense = await prisma.businessLicense.create({
    data: {
      ...data,
      status: 'PENDING'
    }
  });

  res.status(201).json(businessLicense);
}));

router.put('/alvaras-funcionamento/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const businessLicense = await prisma.businessLicense.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: businessLicense.count });
}));

router.delete('/alvaras-funcionamento/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.businessLicense.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// CERTIDÕES
// ============================================================================

router.get('/certidoes', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['applicantName', 'certificateType', 'purpose']
  });

  const certificateRequests = await prisma.certificateRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json(certificateRequests);
}));

router.post('/certidoes', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Atualizar para novo schema do CertificateRequest
  res.status(501).json({ error: 'Not implemented', message: 'Endpoint sendo migrado para novo schema' });
}));

router.put('/certidoes/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const certificateRequest = await prisma.certificateRequest.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: certificateRequest.count });
}));

router.delete('/certidoes/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.certificateRequest.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// DENÚNCIAS URBANAS
// ============================================================================

router.get('/denuncias-urbanas', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['complainantName', 'infractionType', 'propertyAddress']
  });

  const urbanInfractions = await prisma.urbanInfraction.findMany({
    where,
    orderBy: { submissionDate: 'desc' }
  });

  res.json(urbanInfractions);
}));

router.post('/denuncias-urbanas', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    complainantName: z.string().optional(),
    complainantPhone: z.string().optional(),
    complainantEmail: z.string().optional(),
    infractionType: z.string(),
    description: z.string(),
    propertyAddress: z.string(),
    propertyNumber: z.string().optional(),
    neighborhood: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    photos: z.any().optional(),
    priority: z.string().optional(),
    observations: z.string().optional(),
    documents: z.any().optional()
  });

  const data = schema.parse(req.body);

  const urbanInfraction = await prisma.urbanInfraction.create({
    data: {
      ...data,
      status: 'OPEN'
    }
  });

  res.status(201).json(urbanInfraction);
}));

router.put('/denuncias-urbanas/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const urbanInfraction = await prisma.urbanInfraction.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: urbanInfraction.count });
}));

router.delete('/denuncias-urbanas/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.urbanInfraction.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// LOTEAMENTOS (ZONEAMENTO URBANO)
// ============================================================================

router.get('/loteamentos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);

  const where = createSafeWhereClause({
    search,
    searchFields: ['name', 'zoneName', 'code', 'zoneType']
  });

  const urbanZonings = await prisma.urbanZoning.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json(urbanZonings);
}));

router.post('/loteamentos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().optional(),
    zoneName: z.string(),
    code: z.string().optional(),
    type: z.string().optional(),
    zoneType: z.string(),
    description: z.string().optional(),
    regulations: z.any().optional(),
    permitedUses: z.any().optional(),
    restrictions: z.any().optional(),
    coordinates: z.any().optional(),
    boundaries: z.any().optional(),
    isActive: z.boolean().optional()
  });

  const data = schema.parse(req.body);

  const urbanZoning = await prisma.urbanZoning.create({
    data: {
      ...data
    }
  });

  res.status(201).json(urbanZoning);
}));

router.put('/loteamentos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const urbanZoning = await prisma.urbanZoning.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: urbanZoning.count });
}));

router.delete('/loteamentos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.urbanZoning.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

// ============================================================================
// ATENDIMENTOS
// ============================================================================

router.get('/atendimentos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);

  const where = createSafeWhereClause({
    search,
    status,
    searchFields: ['citizenName', 'subject', 'description']
  });

  const attendances = await prisma.urbanPlanningAttendance.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json(attendances);
}));

router.post('/atendimentos', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Atualizar para novo schema do UrbanPlanningAttendance
  res.status(501).json({ error: 'Not implemented', message: 'Endpoint sendo migrado para novo schema' });
}));

router.put('/atendimentos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const attendance = await prisma.urbanPlanningAttendance.updateMany({
    where: { id },
    data: req.body
  });

  res.json({ success: true, updated: attendance.count });
}));

router.delete('/atendimentos/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.urbanPlanningAttendance.deleteMany({
    where: { id }
  });

  res.json({ success: true });
}));

export default router;
