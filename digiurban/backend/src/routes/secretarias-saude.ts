// ============================================================================
// SECRETARIAS-SAUDE.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../lib/prisma';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';

import {
  adminAuthMiddleware,
  requirePermission,
  addDataFilter
        } from '../middleware/admin-auth';
import { requireManager } from '../middleware/auth';
// ====================== TIPOS E INTERFACES ISOLADAS ======================

// Interfaces para Where Clauses tipadas - alinhadas com Prisma
interface HealthAppointmentWhereInput {

  isActive?: boolean;
  status?: string;
  patientName?: { contains: string; mode: 'insensitive' };
  patientCpf?: { contains: string };
  appointmentDate?: Date | { gte?: Date; lte?: Date };
  speciality?: string;
  OR?: Array<{
    patientName?: { contains: string; mode: 'insensitive' };
    patientCpf?: { contains: string };
  }>;
}

interface MedicationWhereInput {

  isActive?: boolean;
  name?: { contains: string; mode: 'insensitive' };
  type?: string;
  category?: string;
  status?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
}

interface HealthCampaignWhereInput {

  isActive?: boolean;
  name?: { contains: string; mode: 'insensitive' };
  type?: string;
  status?: string;
  target?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
}

interface HealthAttendanceWhereInput {

  isActive?: boolean;
  citizenId?: string;
  type?: string;
  status?: string;
  serviceType?: string;
  OR?: Array<{
    citizenName?: { contains: string; mode: 'insensitive' };
    protocol?: { contains: string; mode: 'insensitive' };
  }>;
}

interface HealthUnitWhereInput {

  isActive?: boolean;
  name?: { contains: string; mode: 'insensitive' };
  type?: string;
  status?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    address?: { contains: string; mode: 'insensitive' };
  }>;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;

}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

interface AuthenticatedRequest {
  user: User;
  tenant: Tenant;

  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Record<string, unknown>;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ====================== HELPER FUNCTIONS ======================

function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  return '';
}

function getNumberParam(param: string | string[] | undefined): number {
  const stringValue = getStringParam(param);
  const parsed = parseInt(stringValue, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  const response: SuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  return response;
}

function createErrorResponse(error: string, message: string): ErrorResponse {
  return { success: false, error, message };
}

function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

function handleAsyncRoute(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as AuthenticatedRequest, res)).catch(next);
  };
}

function validateSchemaAndRespond<T>(schema: z.ZodSchema<T>, data: unknown, res: Response): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Dados inválidos'));
      return null;
    }
    throw error;
  }
}

// ====================== MIDDLEWARE LOCAIS ======================

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(adminAuthMiddleware);

// Validation schemas (migrados do arquivo -new)
const healthAttendanceSchema = z.object({
  protocol: z.string().min(1).optional(), // Agora opcional, será gerado automaticamente
  citizenName: z.string().min(1),
  citizenCPF: z.string().min(11).max(11),
  contact: z.string().min(1),
  type: z.enum([
    'APPOINTMENT_REQUEST',
    'EXAM_REQUEST',
    'MEDICATION_REQUEST',
    'HOME_VISIT',
    'VACCINATION',
    'HEALTH_CERTIFICATE',
    'COMPLAINT',
    'GENERAL_INFORMATION',
    'OTHERS',
  ]),
  status: z
    .enum(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFERRED'])
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
  urgency: z.enum(['NORMAL', 'HIGH', 'CRITICAL']).optional(),
  medicalUnit: z.string().optional(),
  appointmentDate: z.string().datetime().optional(),
  symptoms: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
        });

const healthUnitSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  address: z.string().min(1),
  contact: z.string().min(1),
  manager: z.string().min(1),
  specialties: z.array(z.object({
    id: z.string(),
    name: z.string(),
    cbo: z.string(),
    isActive: z.boolean(),
    requiresReferral: z.boolean()
  })).optional(),
  capacity: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
        });

const vaccinationCampaignSchema = z.object({
  name: z.string().min(1),
  vaccine: z.string().min(1),
  targetGroup: z.string().min(1).optional(),
  targetAudience: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    type: z.enum(['HEALTH_UNIT', 'SCHOOL', 'COMMUNITY_CENTER', 'MOBILE_UNIT']),
    capacity: z.number(),
    responsible: z.string(),
    contact: z.string(),
    isActive: z.boolean()
  })).optional(),
  goal: z.number().int().positive().optional(),
  achieved: z.number().int().min(0).optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
        });

/**
 * GET /api/secretarias/saude/atendimentos
 * Listar atendimentos médicos
 */
router.get('/atendimentos', handleAsyncRoute(async (req, res) => {
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const date = getStringParam(req.query.date);
  const speciality = getStringParam(req.query.speciality);

  const where: Prisma.HealthAppointmentWhereInput = {};

  if (search) {
    where.OR = [
      { patientName: { contains: search } },
      { patientCpf: { contains: search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    const dateObj = new Date(date);
    where.appointmentDate = {
      gte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0),
      lte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999)
        };
  }

  if (speciality) {
    where.speciality = speciality;
  }

  const atendimentos = await prisma.healthAppointment.findMany({
    where,
    orderBy: { createdAt: 'desc' }
        });

  const stats = {
    total: atendimentos.length,
    completed: atendimentos.filter(a => a.status === 'COMPLETED').length,
    pending: atendimentos.filter(a => a.status === 'SCHEDULED').length,
    emergency: atendimentos.filter(a => a.priority === 'EMERGENCY').length
        };

  res.json(createSuccessResponse({ atendimentos, stats }, 'Atendimentos encontrados'));
}));

/**
 * POST /api/secretarias/saude/atendimentos
 * Criar novo atendimento médico
 */
router.post('/atendimentos', handleAsyncRoute(async (req, res) => {
  const {
    patientName,
    patientCpf,
    patientBirthDate,
    patientPhone,
    appointmentDate,
    appointmentTime,
    doctorId,
    speciality,
    priority,
    symptoms,
    observations
        } = req.body;

  if (!patientName || !patientCpf || !appointmentDate || !appointmentTime) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Nome do paciente, CPF, data e horário são obrigatórios'));
    return;
  }

  const appointment = await prisma.healthAppointment.create({
    data: {
      citizenId: 'temp-citizen-id', // TODO: Vincular ao citizen real
      patientName: String(patientName),
      patientCpf: String(patientCpf),
      patientBirthDate: patientBirthDate ? new Date(String(patientBirthDate)) : null,
      patientPhone: patientPhone ? String(patientPhone) : null,
      appointmentDate: new Date(String(appointmentDate)),
      appointmentTime: String(appointmentTime),
      doctorId: doctorId ? String(doctorId) : null,
      speciality: speciality ? String(speciality) : 'GENERAL',
      priority: priority ? String(priority) : 'NORMAL',
      status: 'SCHEDULED',
      symptoms: symptoms ? String(symptoms) : null,
      observations: observations ? String(observations) : null
        }
        });

  res.status(201).json(createSuccessResponse(appointment, 'Atendimento agendado com sucesso'));
}));

/**
 * GET /api/secretarias/saude/medicamentos
 * Listar estoque de medicamentos
 */
router.get('/medicamentos', handleAsyncRoute(async (req, res) => {
  const search = getStringParam(req.query.search);
  const category = getStringParam(req.query.category);
  const lowStock = getStringParam(req.query.lowStock);

  const where: MedicationWhereInput = {
    isActive: true
        };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (lowStock === 'true') {
    // Buscar medicamentos com estoque baixo usando lógica simples
    const allMedications = await prisma.medication.findMany({
      where: {
          isActive: true
        },
      orderBy: { name: 'asc' }
        });

    const medicamentos = allMedications.filter(m => m.currentStock <= m.minimumStock);

    const stats = {
      total: medicamentos.length,
      lowStock: medicamentos.length,
      outOfStock: medicamentos.filter(m => m.currentStock === 0).length
        };

    res.json(createSuccessResponse({ medicamentos, stats }, 'Medicamentos com estoque baixo'));
    return;
  }

  const medicamentos = await prisma.medication.findMany({
    where,
    orderBy: { name: 'asc' }
        });

  const stats = {
    total: medicamentos.length,
    lowStock: medicamentos.filter(m => m.currentStock <= m.minimumStock).length,
    outOfStock: medicamentos.filter(m => m.currentStock === 0).length
        };

  res.json(createSuccessResponse({ medicamentos, stats }, 'Medicamentos encontrados'));
}));

/**
 * POST /api/secretarias/saude/medicamentos/dispensar
 * Dispensar medicamento
 */
router.post('/medicamentos/dispensar', handleAsyncRoute(async (req, res) => {
  const { medicationId, patientName, patientCpf, quantity, prescriptionId, observations } = req.body;

  if (!medicationId || !patientName || !patientCpf || !quantity) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Medicamento, paciente e quantidade são obrigatórios'));
    return;
  }

  const quantityNum = Number(quantity);

  // Verificar estoque
  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,

      isActive: true
        }
        });

  if (!medication) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Medicamento não encontrado'));
    return;
  }

  if (medication.currentStock < quantityNum) {
    res.status(400).json(createErrorResponse('INSUFFICIENT_STOCK', 'Estoque insuficiente'));
    return;
  }

  // Criar registro de dispensação
  const dispensacao = await prisma.medicationDispense.create({
    data: {
      protocol: `MED-${Date.now()}`,
      citizenId: 'temp-citizen-id', // TODO: Vincular ao citizen real
      medicationName: String(medicationId),
      dosage: '1x ao dia', // Valor padrão
      quantity: Number(quantity),
      dispenseDate: new Date(),
      prescriptionId: prescriptionId ? String(prescriptionId) : undefined,
      pharmacistName: req.user?.name || 'system',
      dispensedBy: req.user?.id || 'system',
      observations: observations ? String(observations) : undefined
        }
        });

  // Atualizar estoque
  await prisma.medication.update({
    where: { id: String(medicationId) },
    data: {
      currentStock: {
        decrement: Number(quantity)
        }
        }
        });

  res.status(201).json(createSuccessResponse(dispensacao, 'Medicamento dispensado com sucesso'));
}));

/**
 * GET /api/secretarias/saude/campanhas
 * Listar campanhas de saúde ativas
 */
router.get('/campanhas', handleAsyncRoute(async (req, res) => {
  const search = getStringParam(req.query.search);
  const type = getStringParam(req.query.type);
  const status = getStringParam(req.query.status);

  const where: HealthCampaignWhereInput = {
    isActive: true
        };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  const campanhas = await prisma.healthCampaign.findMany({
    where,
    orderBy: { createdAt: 'desc' }
        });

  const stats = {
    total: campanhas.length,
    active: campanhas.filter((c: { status: string }) => c.status === 'ACTIVE').length,
    planned: campanhas.filter((c: { status: string }) => c.status === 'PLANNED').length,
    totalEnrollments: 0, // Será calculado dinamicamente se necessário
  };

  res.json(createSuccessResponse({ campanhas, stats }, 'Campanhas de saúde encontradas'));
}));

/**
 * POST /api/secretarias/saude/campanhas/:id/inscrever
 * Inscrever paciente em campanha
 */
router.post('/campanhas/:id/inscrever', handleAsyncRoute(async (req, res) => {
  const { id } = req.params;
  const { patientName, patientCpf, patientBirthDate, patientPhone, observations } = req.body;

  if (!patientName || !patientCpf) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Nome e CPF do paciente são obrigatórios'));
    return;
  }

  // Verificar se campanha existe e está ativa
  const campaign = await prisma.healthCampaign.findFirst({
    where: {
      id,

      isActive: true,
      status: 'ACTIVE'
        }
        });

  if (!campaign) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Campanha não encontrada ou não está ativa'));
    return;
  }

  // Verificar se paciente já está inscrito
  const existingEnrollment = await prisma.campaignEnrollment.findFirst({
    where: {
      campaignId: id,
      citizen: {
        cpf: patientCpf
      }
        }
        });

  if (existingEnrollment) {
    res.status(400).json(createErrorResponse('ALREADY_EXISTS', 'Paciente já está inscrito nesta campanha'));
    return;
  }

  const enrollment = await prisma.campaignEnrollment.create({
    data: {
      protocol: `CAMP-${Date.now()}`,
      citizenId: 'temp-citizen-id', // TODO: Vincular ao citizen real
      campaignId: id,
      patientBirthDate: patientBirthDate ? new Date(String(patientBirthDate)) : undefined,
      patientPhone: patientPhone ? String(patientPhone) : undefined,
      enrollmentDate: new Date(),
      enrolledBy: req.user?.id || 'system',
      observations: observations ? String(observations) : undefined
        }
        });

  res.status(201).json(createSuccessResponse(enrollment, 'Paciente inscrito na campanha com sucesso'));
}));

/**
 * GET /api/secretarias/saude/dashboard
 * Dashboard com indicadores da saúde
 */
router.get('/dashboard', handleAsyncRoute(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Consultas do mês
  const appointmentsThisMonth = await prisma.healthAppointment.count({
    where: {
      appointmentDate: {
        gte: startOfMonth,
        lte: endOfMonth
        }
        }
        });

  // Emergências ativas
  const activeEmergencies = await prisma.healthAppointment.count({
    where: {
      priority: 'EMERGENCY',
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS']
        }
        }
        });

  // Medicamentos com estoque baixo (calculado manualmente)
  const allMedications = await prisma.medication.findMany({
    where: {
      isActive: true
        }
        });
  const lowStockMedications = allMedications.filter(m => m.currentStock <= m.minimumStock).length;

  // Campanhas ativas
  const activeCampaigns = await prisma.healthCampaign.count({
    where: {
      isActive: true,
      status: 'ACTIVE'
        }
        });

  // Especialidades mais procuradas
  const topSpecialities = await prisma.healthAppointment.groupBy({
    by: ['speciality'],
    where: {
      appointmentDate: {
        gte: startOfMonth,
        lte: endOfMonth
        }
        },
    _count: {
      id: true
        },
    orderBy: {
      _count: {
        id: 'desc'
        }
        },
    take: 5
        });

  const indicators = {
    appointmentsThisMonth,
    activeEmergencies,
    lowStockMedications,
    activeCampaigns,
    topSpecialities
        };

  res.json(createSuccessResponse(indicators, 'Indicadores de saúde'));
}));

/**
 * GET /api/secretarias/saude/stats
 * Estatísticas usando nova estrutura (ProtocolSimplified + MODULE_BY_DEPARTMENT)
 */
router.get('/stats', handleAsyncRoute(async (req, res) => {
  // 1. Buscar departamento de Saúde
  const healthDept = await prisma.department.findFirst({
    where: { code: 'SAUDE' }
  });

  if (!healthDept) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Departamento de Saúde não encontrado'));
    return;
  }

  // 2. Módulos de Saúde conforme MODULE_MAPPING
  const healthModules = [
    'ATENDIMENTOS_SAUDE',
    'AGENDAMENTOS_MEDICOS',
    'CONTROLE_MEDICAMENTOS',
    'CAMPANHAS_SAUDE',
    'PROGRAMAS_SAUDE',
    'ENCAMINHAMENTOS_TFD',
    'EXAMES',
    'TRANSPORTE_PACIENTES',
    'VACINACAO',
    'CADASTRO_PACIENTE',
    'GESTAO_ACS'
  ];

  // 3. Stats por módulo usando ProtocolSimplified
  const protocolsByModule = await prisma.protocolSimplified.groupBy({
    by: ['moduleType', 'status'],
    where: {
      departmentId: healthDept.id,
      moduleType: { in: healthModules }
        },
    _count: { id: true }
        });

  // 4. Contar registros em cada módulo
  const [
    healthAttendancesCount,
    healthAppointmentsCount,
    medicationDispensesCount,
    healthCampaignsCount,
    healthProgramsCount,
    healthTransportsCount,
    healthExamsCount,
    healthTransportRequestsCount,
    vaccinationsCount,
    patientsCount,
    communityHealthAgentsCount,
  ] = await Promise.all([
    prisma.healthAttendance.count({ where: {} }),
    prisma.healthAppointment.count({ where: {} }),
    prisma.medicationDispense.count({ where: {} }),
    prisma.healthCampaign.count({ where: {} }),
    prisma.healthProgram.count({ where: {} }),
    prisma.healthTransport.count({ where: {} }),
    prisma.healthExam.count({ where: {} }),
    prisma.healthTransportRequest.count({ where: {} }),
    prisma.vaccination.count({ where: {} }),
    prisma.patient.count({ where: {} }),
    prisma.communityHealthAgent.count({ where: {} }),
  ]);

  // 5. Montar resposta
  const stats = {
    department: {
      id: healthDept.id,
      name: healthDept.name,
      code: healthDept.code
        },
    modules: {
      healthAttendances: healthAttendancesCount,
      healthAppointments: healthAppointmentsCount,
      medicationDispenses: medicationDispensesCount,
      healthCampaigns: healthCampaignsCount,
      healthPrograms: healthProgramsCount,
      healthTransports: healthTransportsCount,
      healthExams: healthExamsCount,
      healthTransportRequests: healthTransportRequestsCount,
      vaccinations: vaccinationsCount,
      patients: patientsCount,
      communityHealthAgents: communityHealthAgentsCount
        },
    protocolsByModule: protocolsByModule.reduce((acc: any, item) => {
      const module = item.moduleType || 'unknown';
      if (!acc[module]) acc[module] = {};
      const status = item.status || 'unknown';
      acc[module][status] = item._count.id;
      return acc;
    }, {}),
    totals: {
      totalProtocols: protocolsByModule.reduce((sum, item) => sum + item._count.id, 0),
      totalModuleRecords: healthAttendancesCount + healthAppointmentsCount + medicationDispensesCount +
        healthCampaignsCount + healthProgramsCount + healthTransportsCount + healthExamsCount +
        healthTransportRequestsCount + vaccinationsCount + patientsCount + communityHealthAgentsCount
        }
  };

  res.json(createSuccessResponse(stats, 'Estatísticas da Secretaria de Saúde'));
}));

// ========== ROTAS MIGRADAS DO ARQUIVO -NEW ==========
// HEALTH ATTENDANCE ENDPOINTS
router.get('/health-attendances', requireManager, handleAsyncRoute(async (req, res) => {
  const page = getStringParam(req.query.page) || '1';
  const limit = getStringParam(req.query.limit) || '10';
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const type = getStringParam(req.query.type);
  const urgency = getStringParam(req.query.urgency);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { citizenCPF: { contains: search } },
      { protocol: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (urgency) where.urgency = urgency;

  const [attendances, total] = await Promise.all([
    prisma.healthAttendance.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
        }),
    prisma.healthAttendance.count({ where }),
  ]);

  res.json(createPaginatedResponse(attendances, pageNum, limitNum, total));
}));

router.post('/health-attendances', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(healthAttendanceSchema, req.body, res);
  if (!validatedData) return;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Gerar número do protocolo - Sistema centralizado com lock
      const protocolNumber = await generateProtocolNumberSafe(tx);

      // Buscar cidadão pelo CPF
      const citizen = await tx.citizen.findFirst({
        where: { cpf: validatedData.citizenCPF }
      });
      const citizenId = citizen?.id || validatedData.citizenCPF; // fallback para CPF

      // Buscar um serviço padrão de saúde para o protocolo
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

      const attendance = await tx.healthAttendance.create({
        data: {
          protocol: protocolNumber,
          citizenId: 'temp-citizen-id', // TODO: Vincular ao citizen real
          citizenCPF: validatedData.citizenCPF,
          contact: validatedData.contact,
          type: validatedData.type,
          status: validatedData.status || 'PENDING',
          description: validatedData.description,
          observations: validatedData.observations,
          responsible: validatedData.responsible,
          attachments: validatedData.attachments ? (JSON.stringify(validatedData.attachments) as any) : undefined,
          urgency: validatedData.urgency || 'NORMAL',
          medicalUnit: validatedData.medicalUnit,
          appointmentDate: validatedData.appointmentDate ? new Date(validatedData.appointmentDate) : undefined,
          symptoms: validatedData.symptoms,
          priority: validatedData.priority
        }
        });

      return { protocol, attendance };
    });

    res.status(201).json({
      success: true,
      message: 'Atendimento criado com sucesso',
      data: {
        protocol: result.protocol,
        attendance: result.attendance
        }
        });
  } catch (error) {
    console.error('Error creating health attendance with protocol:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro ao criar atendimento'));
  }
}));

router.get('/health-attendances/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const attendance = await prisma.healthAttendance.findUnique({
    where: {
      id: req.params.id
        }
        });

  if (!attendance) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Atendimento não encontrado'));
    return;
  }

  res.json(createSuccessResponse(attendance, 'Atendimento encontrado'));
}));

router.put('/health-attendances/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(healthAttendanceSchema.partial(), req.body, res);
  if (!validatedData) return;

  const attendance = await prisma.healthAttendance.update({
    where: {
      id: req.params.id
        },
    data: {
      protocol: validatedData.protocol,
      citizenCPF: validatedData.citizenCPF,
      contact: validatedData.contact,
      type: validatedData.type,
      status: validatedData.status,
      description: validatedData.description,
      observations: validatedData.observations,
      responsible: validatedData.responsible,
      attachments: validatedData.attachments ? (JSON.stringify(validatedData.attachments) as any) : undefined,
      urgency: validatedData.urgency,
      medicalUnit: validatedData.medicalUnit,
      appointmentDate: validatedData.appointmentDate ? new Date(validatedData.appointmentDate) : undefined,
      symptoms: validatedData.symptoms,
      priority: validatedData.priority
        }
        });

  res.json(createSuccessResponse(attendance, 'Atendimento atualizado com sucesso'));
}));

router.delete('/health-attendances/:id', requireManager, handleAsyncRoute(async (req, res) => {
  await prisma.healthAttendance.delete({
    where: {
      id: req.params.id
        }
        });

  res.status(204).send();
}));

router.get('/health-attendances/stats', requireManager, handleAsyncRoute(async (req, res) => {
  const [statusStats, urgencyStats, typeStats] = await Promise.all([
    prisma.healthAttendance.groupBy({
      by: ['status'],
            _count: { _all: true }
        }),
    prisma.healthAttendance.groupBy({
      by: ['urgency'],
            _count: { _all: true }
        }),
    prisma.healthAttendance.groupBy({
      by: ['type'],
            _count: { _all: true }
        }),
  ]);

  const stats = { statusStats, urgencyStats, typeStats };
  res.json(createSuccessResponse(stats, 'Estatísticas de atendimentos'));
}));

// HEALTH UNIT ENDPOINTS
router.get('/health-units', requireManager, handleAsyncRoute(async (req, res) => {
  const page = getStringParam(req.query.page) || '1';
  const limit = getStringParam(req.query.limit) || '10';
  const search = getStringParam(req.query.search);
  const type = getStringParam(req.query.type);
  const status = getStringParam(req.query.status);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { manager: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) where.type = type;
  if (status) where.status = status;

  const [units, total] = await Promise.all([
    prisma.healthUnit.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' }
        }),
    prisma.healthUnit.count({ where }),
  ]);

  res.json(createPaginatedResponse(units, pageNum, limitNum, total));
}));

router.post('/health-units', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(healthUnitSchema, req.body, res);
  if (!validatedData) return;

  const unit = await prisma.healthUnit.create({
    data: {
      name: validatedData.name,
      type: validatedData.type,
      address: validatedData.address,
      contact: validatedData.contact,
      manager: validatedData.manager,
      specialties: validatedData.specialties ? (JSON.stringify(validatedData.specialties) as any) : undefined,
      capacity: validatedData.capacity,
      status: validatedData.status || 'ACTIVE'
        }
        });

  res.status(201).json(createSuccessResponse(unit, 'Unidade de saúde criada com sucesso'));
}));

router.get('/health-units/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const unit = await prisma.healthUnit.findUnique({
    where: {
      id: req.params.id
        }
        });

  if (!unit) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Unidade de saúde não encontrada'));
    return;
  }

  res.json(createSuccessResponse(unit, 'Unidade de saúde encontrada'));
}));

router.put('/health-units/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(healthUnitSchema.partial(), req.body, res);
  if (!validatedData) return;

  const unit = await prisma.healthUnit.update({
    where: {
      id: req.params.id
        },
    data: {
      name: validatedData.name,
      type: validatedData.type,
      address: validatedData.address,
      contact: validatedData.contact,
      manager: validatedData.manager,
      specialties: validatedData.specialties ? (JSON.stringify(validatedData.specialties) as any) : undefined,
      capacity: validatedData.capacity,
      status: validatedData.status
        }
        });

  res.json(createSuccessResponse(unit, 'Unidade de saúde atualizada com sucesso'));
}));

router.delete('/health-units/:id', requireManager, handleAsyncRoute(async (req, res) => {
  await prisma.healthUnit.delete({
    where: {
      id: req.params.id
        }
        });

  res.status(204).send();
}));

router.get('/health-units/stats', requireManager, handleAsyncRoute(async (req, res) => {
  const typeStats = await prisma.healthUnit.groupBy({
    by: ['type'],
        _count: { _all: true },
    _sum: { capacity: true }
        });

  const totalUnits = await prisma.healthUnit.count({});

  const activeUnits = await prisma.healthUnit.count({
    where: { status: 'ACTIVE' }
        });

  const totalCapacity = await prisma.healthUnit.aggregate({
        _sum: { capacity: true }
        });

  const stats = {
    typeStats,
    totalUnits,
    activeUnits,
    totalCapacity: totalCapacity._sum.capacity || 0
        };

  res.json(createSuccessResponse(stats, 'Estatísticas das unidades de saúde'));
}));

// VACCINATION CAMPAIGN ENDPOINTS
router.get('/vaccination-campaigns', requireManager, handleAsyncRoute(async (req, res) => {
  const page = getStringParam(req.query.page) || '1';
  const limit = getStringParam(req.query.limit) || '10';
  const search = getStringParam(req.query.search);
  const status = getStringParam(req.query.status);
  const vaccine = getStringParam(req.query.vaccine);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { vaccine: { contains: search, mode: 'insensitive' } },
      { targetAudience: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (vaccine) where.vaccine = vaccine;

  const [campaigns, total] = await Promise.all([
    prisma.vaccinationCampaign.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { startDate: 'desc' }
        }),
    prisma.vaccinationCampaign.count({ where }),
  ]);

  res.json(createPaginatedResponse(campaigns, pageNum, limitNum, total));
}));

router.post('/vaccination-campaigns', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(vaccinationCampaignSchema, req.body, res);
  if (!validatedData) return;

  // Validate dates
  const startDate = new Date(validatedData.startDate);
  const endDate = new Date(validatedData.endDate);

  if (endDate < startDate) {
    res.status(400).json(createErrorResponse('INVALID_DATES', 'Data de fim deve ser posterior à data de início'));
    return;
  }

  const campaign = await prisma.vaccinationCampaign.create({
    data: {
      name: validatedData.name,
      vaccine: validatedData.vaccine,
      targetGroup: validatedData.targetGroup || validatedData.targetAudience,
      targetAudience: validatedData.targetAudience,
      startDate,
      endDate,
      locations: validatedData.locations ? (JSON.stringify(validatedData.locations) as any) : undefined,
      goal: validatedData.goal,
      achieved: validatedData.achieved,
      status: validatedData.status || 'PLANNED'
        }
        });

  res.status(201).json(createSuccessResponse(campaign, 'Campanha de vacinação criada com sucesso'));
}));

router.get('/vaccination-campaigns/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const campaign = await prisma.vaccinationCampaign.findUnique({
    where: {
      id: req.params.id
        }
        });

  if (!campaign) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'Campanha de vacinação não encontrada'));
    return;
  }

  res.json(createSuccessResponse(campaign, 'Campanha de vacinação encontrada'));
}));

router.put('/vaccination-campaigns/:id', requireManager, handleAsyncRoute(async (req, res) => {
  const validatedData = validateSchemaAndRespond(vaccinationCampaignSchema.partial(), req.body, res);
  if (!validatedData) return;

  // Validate dates if provided
  if (validatedData.startDate && validatedData.endDate) {
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      res.status(400).json(createErrorResponse('INVALID_DATES', 'Data de fim deve ser posterior à data de início'));
      return;
    }
  }

  const campaign = await prisma.vaccinationCampaign.update({
    where: {
      id: req.params.id
        },
    data: {
      name: validatedData.name,
      vaccine: validatedData.vaccine,
      targetGroup: validatedData.targetGroup || validatedData.targetAudience,
      targetAudience: validatedData.targetAudience,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      locations: validatedData.locations ? (JSON.stringify(validatedData.locations) as any) : undefined,
      goal: validatedData.goal,
      achieved: validatedData.achieved,
      status: validatedData.status
        }
        });

  res.json(createSuccessResponse(campaign, 'Campanha de vacinação atualizada com sucesso'));
}));

router.delete('/vaccination-campaigns/:id', requireManager, handleAsyncRoute(async (req, res) => {
  await prisma.vaccinationCampaign.delete({
    where: {
      id: req.params.id
        }
        });

  res.status(204).send();
}));

router.get('/vaccination-campaigns/stats', requireManager, handleAsyncRoute(async (req, res) => {
  const statusStats = await prisma.vaccinationCampaign.groupBy({
    by: ['status'],
        _count: { _all: true }
        });

  const vaccineStats = await prisma.vaccinationCampaign.groupBy({
    by: ['vaccine'],
        _count: { _all: true },
    _sum: { achieved: true, goal: true }
        });

  const totalCampaigns = await prisma.vaccinationCampaign.count({});

  const activeCampaigns = await prisma.vaccinationCampaign.count({
    where: { status: 'ACTIVE' }
        });

  const stats = {
    statusStats,
    vaccineStats,
    totalCampaigns,
    activeCampaigns
        };

  res.json(createSuccessResponse(stats, 'Estatísticas das campanhas de vacinação'));
}));

// Update vaccination progress endpoint
router.patch('/vaccination-campaigns/:id/progress', requireManager, handleAsyncRoute(async (req, res) => {
  const { achieved } = req.body;

  if (typeof achieved !== 'number' || achieved < 0) {
    res.status(400).json(createErrorResponse('INVALID_VALUE', 'Valor de progresso inválido'));
    return;
  }

  const campaign = await prisma.vaccinationCampaign.update({
    where: {
      id: req.params.id
        },
    data: { achieved }
        });

  res.json(createSuccessResponse(campaign, 'Progresso da campanha atualizado com sucesso'));
}));

export default router;
