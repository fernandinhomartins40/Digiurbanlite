// ============================================================================
// SECRETARIAS-EDUCACAO.TS - Rotas da Secretaria de Educa��o
// ============================================================================
// VERS�O SIMPLIFICADA - Usa 100% do sistema novo (ProtocolSimplified + MODULE_MAPPING)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
  adminAuthMiddleware,
  requireMinRole
        } from '../middleware/admin-auth';
import { UserRole, ProtocolStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { MODULE_BY_DEPARTMENT } from '../config/module-mapping';
import { protocolStatusEngine } from '../services/protocol-status.engine';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/secretarias/educacao/stats
 * Obter estat�sticas consolidadas da Secretaria de Educa��o
 * VERS�O SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de educa��o
      // ✅ Buscar departamento global
      const educationDept = await prisma.department.findFirst({
        where: { code: 'EDUCACAO' }
      });

      if (!educationDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Educa��o n�o encontrado'
        });
      }

      // M�dulos de educa��o do MODULE_MAPPING
      const educationModules = MODULE_BY_DEPARTMENT.EDUCACAO || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        schoolsCount,
        studentsCount,
        schoolTransportsCount,
        educationAttendancesCount,
        disciplinaryRecordsCount,
        schoolDocumentsCount,
        studentTransfersCount,
        attendanceRecordsCount,
        gradeRecordsCount,
        schoolManagementsCount,
        schoolMealsCount,
      ] = await Promise.all([
        // 1. Estat�sticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: educationDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por m�dulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: educationDept.id,
            moduleType: { in: educationModules }
        },
          _count: { id: true }
        }),

        // 3. Escolas
        prisma.school.count({ where: {} }),

        // 4. Alunos
        prisma.student.count({ where: {} }),

        // 5. Transporte Escolar
        prisma.schoolTransport.count({ where: {} }),

        // 6. Atendimentos Educacionais
        prisma.educationAttendance.count({ where: {} }),

        // 7. Ocorr�ncias Disciplinares
        prisma.disciplinaryRecord.count({ where: {} }),

        // 8. Documentos Escolares
        prisma.schoolDocument.count({ where: {} }),

        // 9. Transfer�ncias
        prisma.studentTransfer.count({ where: {} }),

        // 10. Frequ�ncia
        prisma.attendanceRecord.count({ where: {} }),

        // 11. Notas
        prisma.gradeRecord.count({ where: {} }),

        // 12. Gest�o Escolar
        prisma.schoolManagement.count({ where: {} }),

        // 13. Merenda Escolar
        prisma.schoolMeal.count({ where: {} }),
      ]);

      // Processar estat�sticas de Protocolos
      const protocolData = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
        };

      protocolStats.forEach((item) => {
        const count = item._count?.id || 0;
        protocolData.total += count;

        if (item.status === ProtocolStatus.VINCULADO || item.status === ProtocolStatus.PENDENCIA) {
          protocolData.pending += count;
        } else if (item.status === ProtocolStatus.PROGRESSO) {
          protocolData.inProgress += count;
        } else if (item.status === ProtocolStatus.CONCLUIDO) {
          protocolData.completed += count;
        }
      });

      // Processar estat�sticas por m�dulo
      const moduleStats: Record<string, any> = {};

      protocolsByModule.forEach((item) => {
        if (!item.moduleType) return;

        if (!moduleStats[item.moduleType]) {
          moduleStats[item.moduleType] = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0
        };
        }

        const count = item._count?.id || 0;
        moduleStats[item.moduleType].total += count;

        if (item.status === ProtocolStatus.VINCULADO || item.status === ProtocolStatus.PENDENCIA) {
          moduleStats[item.moduleType].pending += count;
        } else if (item.status === ProtocolStatus.PROGRESSO) {
          moduleStats[item.moduleType].inProgress += count;
        } else if (item.status === ProtocolStatus.CONCLUIDO) {
          moduleStats[item.moduleType].completed += count;
        }
      });

      // Montar resposta consolidada
      const stats = {
        schools: schoolsCount,
        modules: {
          educationAttendances: educationAttendancesCount,
          students: studentsCount,
          schoolTransports: schoolTransportsCount,
          disciplinaryRecords: disciplinaryRecordsCount,
          schoolDocuments: schoolDocumentsCount,
          studentTransfers: studentTransfersCount,
          attendanceRecords: attendanceRecordsCount,
          gradeRecords: gradeRecordsCount,
          schoolManagements: schoolManagementsCount,
          schoolMeals: schoolMealsCount
        },
        protocols: protocolData,
        moduleStats, // Estat�sticas detalhadas por m�dulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Education stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estat�sticas da educa��o'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/educacao/services
 * Listar servi�os da Secretaria de Educa��o
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de educa��o
      // ✅ Buscar departamento global
      const educationDept = await prisma.department.findFirst({
        where: { code: 'EDUCACAO' }
      });

      if (!educationDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Educa��o n�o encontrado'
        });
      }

      // Buscar servi�os simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: educationDept.id,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
        });

      return res.json({
        success: true,
        data: services
        });
    } catch (error) {
      console.error('Get education services error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar servi�os'
        });
    }
  }
);

export default router;
