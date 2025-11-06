/**
 * ROTAS ADMIN SECRETARIAS
 * Conforme PLANO_IMPLEMENTACAO_COMPLETO.md Fase 8.2
 *
 * Estas rotas fornecem acesso direto aos dados do Prisma para painéis administrativos.
 * NÃO são rotas de processamento de serviços (isso é feito pelos Handlers via ModuleHandler).
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
const router = Router();

// ============================================================
// EDUCAÇÃO
// ============================================================

router.get('/educacao/matriculas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, source, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (source) where.source = source;

      const [total, enrollments] = await Promise.all([
        prisma.studentEnrollment.count({ where }),
        prisma.studentEnrollment.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: enrollments, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/educacao/transportes',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, transports] = await Promise.all([
        prisma.schoolTransport.count({ where }),
        prisma.schoolTransport.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: transports, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/educacao/merenda',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, meals] = await Promise.all([
        prisma.schoolMeal.count({ where }),
        prisma.schoolMeal.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: meals, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SAÚDE
// ============================================================

router.get('/saude/consultas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, appointments] = await Promise.all([
        prisma.healthAppointment.count({ where }),
        prisma.healthAppointment.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: appointments, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/exames',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, exams] = await Promise.all([
        prisma.healthAppointment.count({ where }),
        prisma.healthAppointment.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: exams, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/medicamentos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, medications] = await Promise.all([
        prisma.medicationDispensing.count({ where }),
        prisma.medicationDispensing.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: medications, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/vacinas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, vaccinations] = await Promise.all([
        prisma.vaccination.count({ where }),
        prisma.vaccination.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: vaccinations, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ASSISTÊNCIA SOCIAL
// ============================================================

router.get('/assistencia-social/beneficios',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, benefits] = await Promise.all([
        prisma.socialProgram.count({ where }),
        prisma.socialProgram.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: benefits, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/assistencia-social/programas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, programs] = await Promise.all([
        prisma.socialProgram.count({ where }),
        prisma.socialProgram.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: programs, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/assistencia-social/visitas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, visits] = await Promise.all([
        prisma.homeVisit.count({ where }),
        prisma.homeVisit.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: visits, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// CULTURA
// ============================================================

router.get('/cultura/eventos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, events] = await Promise.all([
        prisma.culturalEvent.count({ where }),
        prisma.culturalEvent.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: events, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/cultura/espacos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, spaces] = await Promise.all([
        prisma.culturalSpace.count({ where }),
        prisma.culturalSpace.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: spaces, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/cultura/projetos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, projects] = await Promise.all([
        prisma.culturalProject.count({ where }),
        prisma.culturalProject.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: projects, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ESPORTES
// ============================================================

router.get('/esportes/inscricoes',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, enrollments] = await Promise.all([
        prisma.sportsAttendance.count({ where }),
        prisma.sportsAttendance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: enrollments, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/esportes/reservas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, reservations] = await Promise.all([
        prisma.sportsAttendance.count({ where }),
        prisma.sportsAttendance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: reservations, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// TURISMO
// ============================================================

router.get('/turismo/atrativos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, attractions] = await Promise.all([
        prisma.touristAttraction.count({ where }),
        prisma.touristAttraction.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: attractions, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/turismo/eventos',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, events] = await Promise.all([
        prisma.tourismAttendance.count({ where }),
        prisma.tourismAttendance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: events, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// HABITAÇÃO
// ============================================================

router.get('/habitacao/lotes',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, lots] = await Promise.all([
        prisma.housingApplication.count({ where }),
        prisma.housingApplication.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: lots, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/habitacao/mcmv',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, mcmv] = await Promise.all([
        prisma.housingApplication.count({ where }),
        prisma.housingApplication.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: mcmv, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/habitacao/regularizacao',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, regularizations] = await Promise.all([
        prisma.landRegularization.count({ where }),
        prisma.landRegularization.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: regularizations, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// OBRAS PÚBLICAS
// ============================================================

router.get('/obras-publicas/problemas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, issues] = await Promise.all([
        prisma.publicWorksAttendance.count({ where }),
        prisma.publicWorksAttendance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: issues, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/obras-publicas/manutencao',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, maintenance] = await Promise.all([
        prisma.publicWorksAttendance.count({ where }),
        prisma.publicWorksAttendance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: maintenance, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SERVIÇOS PÚBLICOS
// ============================================================

router.get('/servicos-publicos/limpeza',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, cleaning] = await Promise.all([
        prisma.publicServiceRequest.count({ where }),
        prisma.publicServiceRequest.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: cleaning, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/servicos-publicos/poda',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, pruning] = await Promise.all([
        prisma.publicServiceRequest.count({ where }),
        prisma.publicServiceRequest.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: pruning, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/servicos-publicos/entulho',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, debris] = await Promise.all([
        prisma.publicServiceRequest.count({ where }),
        prisma.publicServiceRequest.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: debris, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// MEIO AMBIENTE
// ============================================================

router.get('/meio-ambiente/licencas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, licenses] = await Promise.all([
        prisma.environmentalLicense.count({ where }),
        prisma.environmentalLicense.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: licenses, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/meio-ambiente/arvores',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, authorizations] = await Promise.all([
        prisma.treeAuthorization.count({ where }),
        prisma.treeAuthorization.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: authorizations, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/meio-ambiente/denuncias',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, complaints] = await Promise.all([
        prisma.environmentalComplaint.count({ where }),
        prisma.environmentalComplaint.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: complaints, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// AGRICULTURA
// ============================================================

router.get('/agricultura/assistencias',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, assistances] = await Promise.all([
        prisma.technicalAssistance.count({ where }),
        prisma.technicalAssistance.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: assistances, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/agricultura/sementes',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, distributions] = await Promise.all([
        prisma.seedDistribution.count({ where }),
        prisma.seedDistribution.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: distributions, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// PLANEJAMENTO URBANO
// ============================================================

router.get('/planejamento-urbano/alvaras',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, permits] = await Promise.all([
        prisma.buildingPermit.count({ where }),
        prisma.buildingPermit.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: permits, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/planejamento-urbano/certidoes',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, certificates] = await Promise.all([
        prisma.urbanCertificate.count({ where }),
        prisma.urbanCertificate.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: certificates, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/planejamento-urbano/numeracao',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, numberings] = await Promise.all([
        prisma.propertyNumbering.count({ where }),
        prisma.propertyNumbering.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: numberings, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SEGURANÇA PÚBLICA
// ============================================================

router.get('/seguranca-publica/ocorrencias',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, occurrences] = await Promise.all([
        prisma.securityOccurrence.count({ where }),
        prisma.securityOccurrence.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: occurrences, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/seguranca-publica/rondas',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, patrols] = await Promise.all([
        prisma.securityPatrol.count({ where }),
        prisma.securityPatrol.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: patrols, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/seguranca-publica/denuncias',
  
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const [total, reports] = await Promise.all([
        prisma.securityOccurrence.count({ where }),
        prisma.securityOccurrence.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        })
      ]);

      res.json({ data: reports, total, page: Number(page), limit: Number(limit) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
