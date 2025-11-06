import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireManager } from '../middleware/auth';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';
import { asyncHandler } from '../utils/express-helpers';
import { generateProtocolNumber } from '../utils/protocol-number-generator';

// ===== TIPOS LOCAIS ISOLADOS - SEM DEPENDÊNCIAS CENTRALIZADAS =====

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total: number;
  page: number; // Propriedade adicional para compatibilidade
  limit: number; // Propriedade adicional para compatibilidade
  totalPages: number; // Propriedade adicional para compatibilidade
}

// Helper para query params seguros - SEM ANY!
function getStringParam(param: unknown): string {
  if (Array.isArray(param)) return String(param[0] || '');
  if (typeof param === 'string') return param;
  if (param && typeof param === 'object' && param !== null) {
    return String(param);
  }
  return '';
}

// Tipo genérico para Where Clause - SEM ANY!
interface PrismaWhereClause {

  OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
  status?: string;
  type?: string;
  category?: string;
  [key: string]: unknown;
}

// Helper para criar where clauses seguras - SEM ANY!
function createSafeWhereClause(params: {
 // OBRIGATÓRIO!
  search?: string;
  status?: string;
  type?: string;
  category?: string;
  searchFields?: string[];
}): PrismaWhereClause {
  const where: PrismaWhereClause = {};

  // já é obrigatório na interface

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

  if (params.category) {
    where.category = params.category;
  }

  return where;
}

// TIPOS ESPECÍFICOS PARA CULTURA - ISOLADOS E LIMPOS

interface ArtisticGroupWhereInput {

  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    responsible?: { contains: string; mode: 'insensitive' };
  }>;
  category?: string;
  status?: string;
}

interface CulturalManifestationWhereInput {

  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
  type?: string;
  status?: string;
}

interface CulturalWorkshopWhereInput {

  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    instructor?: { contains: string; mode: 'insensitive' };
  }>;
  category?: string;
  status?: string;
}

interface CulturalProjectWhereInput {

  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    responsible?: { contains: string; mode: 'insensitive' };
  }>;
  type?: string;
  currentStatus?: string;
}

const router = Router();

// Apply middleware
// Validation schemas
const culturalAttendanceSchema = z.object({
  protocol: z.string().min(1).optional(), // Agora opcional, será gerado automaticamente
  citizenName: z.string().min(1),
  contact: z.string().min(1),
  type: z.enum([
    'AUTHORIZATION_EVENT',
    'ARTIST_REGISTRATION',
    'PUBLIC_NOTICE_REGISTRATION',
    'CULTURAL_SPACE_USE',
    'PROJECT_SUPPORT',
    'ARTISTIC_SUPPORT',
    'INFORMATION',
    'GENERAL_INFORMATION',
    'OTHERS',
  ]),
  status: z
    .enum(['PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'OPEN'])
    .optional(),
  description: z.string().min(1),
  observations: z.string().optional(),
  responsible: z.string().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    url: z.string(),
    description: z.string().optional()
  })).optional(),
  category: z.string().optional(),
  requestedLocation: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  estimatedAudience: z.number().int().positive().optional(),
  requestedBudget: z.number().positive().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
        });

const artisticGroupSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  foundationDate: z.string().datetime().optional(),
  responsible: z.string().min(1),
  contact: z.string().min(1),
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    joinDate: z.string().datetime(),
    contact: z.string().optional(),
    isActive: z.boolean()
  })).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
        });

const culturalManifestationSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  currentSituation: z.string().min(1),
  knowledgeHolders: z.array(z.object({
    id: z.string(),
    name: z.string(),
    age: z.number().optional(),
    role: z.string(),
    contact: z.string(),
    knowledgeAreas: z.array(z.string()),
    community: z.string().optional()
  })).optional(),
  safeguardActions: z.array(z.object({
    id: z.string(),
    type: z.enum(['DOCUMENTATION', 'TRANSMISSION', 'PROMOTION', 'RESEARCH', 'PROTECTION']),
    title: z.string(),
    description: z.string(),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    responsible: z.string(),
    budget: z.number().optional()
  })).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
        });

const culturalWorkshopSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  instructor: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  schedule: z.string().min(1),
  maxParticipants: z.number().int().positive(),
  currentParticipants: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  // Campos customizáveis para formulário de inscrição
  customFields: z.any().optional(), // Array de campos adicionais
  requiredDocuments: z.any().optional(), // Array de documentos necessários
  enrollmentSettings: z.any().optional(), // Configurações de inscrição
});

const culturalProjectSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  responsible: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  currentStatus: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
        });

// CULTURAL ATTENDANCE ENDPOINTS
router.get('/cultural-attendances', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '10';
    const search = getStringParam(req.query.search);
    const status = getStringParam(req.query.status);
    const type = getStringParam(req.query.type);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verificação removida (single tenant)

    const where = createSafeWhereClause({

      search,
      status,
      type,
      searchFields: ['citizenName', 'protocol', 'description']
    });

    // Criação de where clause compatível com Prisma - SEM ANY!
    const prismaWhere = {
      ...(where.status && { status: where.status }),
      ...(where.type && { type: where.type }),
      ...(where.OR && { OR: where.OR })
    };

    const [attendances, total] = await Promise.all([
      prisma.culturalAttendance.findMany({
        where: prismaWhere as any,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
        }),
      prisma.culturalAttendance.count({ where: prismaWhere as any }),
    ]);

    const response = {
      data: attendances,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
        }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cultural attendances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.post('/cultural-attendances', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalAttendanceSchema.parse(req.body);

    // Verificação removida (single tenant)

    const result = await prisma.$transaction(async (tx) => {
      // Gerar número do protocolo
      const protocolNumber = generateProtocolNumber();

      // Buscar cidadão pelo nome (cultura não usa CPF)
      const citizen = await tx.citizen.findFirst({
        where: { name: validatedData.citizenName }
      });
      const citizenId = citizen?.id || validatedData.citizenName; // fallback para nome

      // Buscar um serviço padrão de cultura para o protocolo
      const defaultService = await tx.serviceSimplified.findFirst({
        select: { id: true, departmentId: true }
      });

      if (!defaultService) {
        throw new Error('Nenhum serviço disponível para criar protocolo');
      }

      // Criar protocolo
      const protocol = await tx.protocolSimplified.create({
        data: {
  
          citizenId,
          serviceId: defaultService.id,
          departmentId: defaultService.departmentId,
          number: protocolNumber,
          title: validatedData.description.substring(0, 100),
          description: validatedData.description,
          status: 'VINCULADO' as any,
          priority: 3
        }
        });

      // Criar attendance vinculado ao protocolo
      const attendance = await tx.culturalAttendance.create({
        data: {
          protocol: protocolNumber,
          citizenName: validatedData.citizenName,
          contact: validatedData.contact,
          type: validatedData.type,
          status: validatedData.status as any,
          description: validatedData.description,
          observations: validatedData.observations,
          eventDate: validatedData.eventDate ? new Date(validatedData.eventDate) : new Date(),
          category: validatedData.category,
          priority: validatedData.priority,
          attachments: validatedData.attachments,
          requestedBudget: validatedData.requestedBudget
        }
        });

      return { protocol, attendance };
    });

    res.status(201).json({
      success: true,
      message: 'Atendimento cultural criado com sucesso',
      data: {
        protocol: result.protocol,
        attendance: result.attendance
        }
        });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error creating cultural attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/cultural-attendances/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attendance = await prisma.culturalAttendance.findUnique({
      where: {
        id: req.params.id
        }
        });

    if (!attendance) {
      res.status(404).json({ error: 'Cultural attendance not found' });
      return;
    }

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching cultural attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.put('/cultural-attendances/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalAttendanceSchema.partial().parse(req.body);

    const attendance = await prisma.culturalAttendance.update({
      where: {
        id: req.params.id
        },
      data: {
        ...validatedData,
        eventDate: validatedData.eventDate ? new Date(validatedData.eventDate) : undefined
        }
        });

    res.json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error updating cultural attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.delete('/cultural-attendances/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.culturalAttendance.delete({
      where: {
        id: req.params.id
        }
        });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting cultural attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/cultural-attendances/stats', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await prisma.culturalAttendance.groupBy({
      by: ['status'],
      _count: { _all: true }
        });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching cultural attendance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// ARTISTIC GROUP ENDPOINTS
router.get('/artistic-groups', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '10';
    const search = getStringParam(req.query.search);
    const category = getStringParam(req.query.category);
    const status = getStringParam(req.query.status);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: ArtisticGroupWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { responsible: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const [groups, total] = await Promise.all([
      prisma.artisticGroup.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
        }),
      prisma.artisticGroup.count({ where }),
    ]);

    const response = {
      data: groups,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
        }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching artistic groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.post('/artistic-groups', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = artisticGroupSchema.parse(req.body);

    const group = await prisma.artisticGroup.create({
      data: {
        ...validatedData,
        foundationDate: validatedData.foundationDate
          ? new Date(validatedData.foundationDate)
          : undefined
        }
        });

    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error creating artistic group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/artistic-groups/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const group = await prisma.artisticGroup.findUnique({
      where: {
        id: req.params.id
        }
        });

    if (!group) {
      res.status(404).json({ error: 'Artistic group not found' });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching artistic group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.put('/artistic-groups/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = artisticGroupSchema.partial().parse(req.body);

    const group = await prisma.artisticGroup.update({
      where: {
        id: req.params.id
        },
      data: {
        ...validatedData,
        foundationDate: validatedData.foundationDate
          ? new Date(validatedData.foundationDate)
          : undefined
        }
        });

    res.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error updating artistic group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.delete('/artistic-groups/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.artisticGroup.delete({
      where: {
        id: req.params.id
        }
        });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting artistic group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// CULTURAL MANIFESTATION ENDPOINTS
router.get('/cultural-manifestations', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '10';
    const search = getStringParam(req.query.search);
    const type = getStringParam(req.query.type);
    const status = getStringParam(req.query.status);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: CulturalManifestationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;

    const [manifestations, total] = await Promise.all([
      prisma.culturalManifestation.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
        }),
      prisma.culturalManifestation.count({ where }),
    ]);

    const response = {
      data: manifestations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
        }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cultural manifestations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.post('/cultural-manifestations', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalManifestationSchema.parse(req.body);

    const manifestation = await prisma.culturalManifestation.create({
      data: {
        ...validatedData
        }
        });

    res.status(201).json(manifestation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error creating cultural manifestation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/cultural-manifestations/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const manifestation = await prisma.culturalManifestation.findUnique({
      where: {
        id: req.params.id
        }
        });

    if (!manifestation) {
      res.status(404).json({ error: 'Cultural manifestation not found' });
      return;
    }

    res.json(manifestation);
  } catch (error) {
    console.error('Error fetching cultural manifestation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.put('/cultural-manifestations/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalManifestationSchema.partial().parse(req.body);

    const manifestation = await prisma.culturalManifestation.update({
      where: {
        id: req.params.id
        },
      data: validatedData
        });

    res.json(manifestation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error updating cultural manifestation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.delete('/cultural-manifestations/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.culturalManifestation.delete({
      where: {
        id: req.params.id
        }
        });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting cultural manifestation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// CULTURAL WORKSHOP ENDPOINTS
router.get('/cultural-workshops', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '10';
    const search = getStringParam(req.query.search);
    const category = getStringParam(req.query.category);
    const status = getStringParam(req.query.status);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: CulturalWorkshopWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { instructor: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const [workshops, total] = await Promise.all([
      prisma.culturalWorkshop.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { startDate: 'desc' }
        }),
      prisma.culturalWorkshop.count({ where }),
    ]);

    const response = {
      data: workshops,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
        }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cultural workshops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.post('/cultural-workshops', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalWorkshopSchema.parse(req.body);

    const workshop = await prisma.culturalWorkshop.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate)
        }
        });

    res.status(201).json(workshop);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error creating cultural workshop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/cultural-workshops/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workshop = await prisma.culturalWorkshop.findUnique({
      where: {
        id: req.params.id
        }
        });

    if (!workshop) {
      res.status(404).json({ error: 'Cultural workshop not found' });
      return;
    }

    res.json(workshop);
  } catch (error) {
    console.error('Error fetching cultural workshop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.put('/cultural-workshops/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalWorkshopSchema.partial().parse(req.body);

    const workshop = await prisma.culturalWorkshop.update({
      where: {
        id: req.params.id
        },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
        }
        });

    res.json(workshop);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error updating cultural workshop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.delete('/cultural-workshops/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.culturalWorkshop.delete({
      where: {
        id: req.params.id
        }
        });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting cultural workshop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// CULTURAL PROJECT ENDPOINTS
router.get('/cultural-projects', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = getStringParam(req.query.page) || '1';
    const limit = getStringParam(req.query.limit) || '10';
    const search = getStringParam(req.query.search);
    const type = getStringParam(req.query.type);
    const status = getStringParam(req.query.status);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: CulturalProjectWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { responsible: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.currentStatus = status;

    const [projects, total] = await Promise.all([
      prisma.culturalProject.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
        }),
      prisma.culturalProject.count({ where }),
    ]);

    const response = {
      data: projects,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
        }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cultural projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.post('/cultural-projects', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalProjectSchema.parse(req.body);

    const project = await prisma.culturalProject.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
        }
        });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error creating cultural project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.get('/cultural-projects/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = await prisma.culturalProject.findUnique({
      where: {
        id: req.params.id
        }
        });

    if (!project) {
      res.status(404).json({ error: 'Cultural project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching cultural project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.put('/cultural-projects/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = culturalProjectSchema.partial().parse(req.body);

    const project = await prisma.culturalProject.update({
      where: {
        id: req.params.id
        },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
        }
        });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Error updating cultural project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

router.delete('/cultural-projects/:id', authenticateToken, requireManager, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.culturalProject.delete({
      where: {
        id: req.params.id
        }
        });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting cultural project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

export default router;
