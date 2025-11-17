/**
 * ============================================================================
 * CITIZEN LOOKUP ROUTES
 * ============================================================================
 *
 * Rotas para busca de cidadãos (usado em pré-preenchimento de formulários)
 * Usado por TODAS as secretarias
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import { getCitizenLookupService } from '../services/citizen-lookup.service';

const router = Router();

// Aplicar autenticação admin
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/citizen-lookup/cpf/:cpf
 * Buscar cidadão por CPF (para pré-preenchimento)
 */
router.get(
  '/cpf/:cpf',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { cpf } = req.params;

      if (!cpf) {
        return res.status(400).json({
          success: false,
          error: 'CPF é obrigatório'
        });
      }

      const service = getCitizenLookupService(prisma);
      const citizen = await service.findByCpf(cpf);

      if (!citizen) {
        return res.status(404).json({
          success: false,
          error: 'Cidadão não encontrado'
        });
      }

      // Retornar apenas dados necessários (sem senha)
      const { password, ...citizenData } = citizen;

      return res.json({
        success: true,
        data: {
          ...citizenData,
          familyMembers: citizen.familyMembers?.map(fm => ({
            id: fm.member.id,
            name: fm.member.name,
            cpf: fm.member.cpf,
            birthDate: fm.member.birthDate,
            relationship: fm.relationship,
            isDependent: fm.isDependent
          }))
        }
      });
    } catch (error: any) {
      console.error('Error in GET /citizen-lookup/cpf/:cpf:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar cidadão',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/admin/citizen-lookup/search?q=nome
 * Buscar cidadãos por nome (autocomplete)
 */
router.get(
  '/search',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "q" (query) é obrigatório'
        });
      }

      const service = getCitizenLookupService(prisma);
      const citizens = await service.searchByName(
        q,
        limit ? parseInt(limit as string) : 10
      );

      return res.json({
        success: true,
        data: citizens.map(c => ({
          id: c.id,
          name: c.name,
          cpf: c.cpf,
          email: c.email,
          phone: c.phone
        }))
      });
    } catch (error: any) {
      console.error('Error in GET /citizen-lookup/search:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar cidadãos',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/admin/citizen-lookup/:id
 * Buscar cidadão por ID (com família)
 */
router.get(
  '/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;

      const service = getCitizenLookupService(prisma);
      const citizen = await service.findById(id);

      if (!citizen) {
        return res.status(404).json({
          success: false,
          error: 'Cidadão não encontrado'
        });
      }

      // Remover senha
      const { password, ...citizenData } = citizen;

      return res.json({
        success: true,
        data: {
          ...citizenData,
          familyMembers: citizen.familyMembers?.map(fm => ({
            id: fm.member.id,
            name: fm.member.name,
            cpf: fm.member.cpf,
            birthDate: fm.member.birthDate,
            relationship: fm.relationship,
            isDependent: fm.isDependent
          }))
        }
      });
    } catch (error: any) {
      console.error('Error in GET /citizen-lookup/:id:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar cidadão',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/admin/citizen-lookup/:id/family
 * Buscar membros da família do cidadão
 */
router.get(
  '/:id/family',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;

      const service = getCitizenLookupService(prisma);
      const familyMembers = await service.getFamilyMembers(id);

      return res.json({
        success: true,
        data: familyMembers.map(fm => ({
          id: (fm as any).member.id,
          name: (fm as any).member.name,
          cpf: (fm as any).member.cpf,
          birthDate: (fm as any).member.birthDate,
          phone: (fm as any).member.phone,
          email: (fm as any).member.email,
          relationship: fm.relationship,
          isDependent: fm.isDependent
        }))
      });
    } catch (error: any) {
      console.error('Error in GET /citizen-lookup/:id/family:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar membros da família',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/admin/citizen-lookup/validate
 * Validar se cidadão pode solicitar serviço
 */
router.post(
  '/validate',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { citizenId } = req.body;

      if (!citizenId) {
        return res.status(400).json({
          success: false,
          error: 'citizenId é obrigatório'
        });
      }

      const service = getCitizenLookupService(prisma);
      const validation = await service.canRequestService(citizenId);

      return res.json({
        success: true,
        data: validation
      });
    } catch (error: any) {
      console.error('Error in POST /citizen-lookup/validate:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao validar cidadão',
        message: error.message
      });
    }
  }
);

export default router;
