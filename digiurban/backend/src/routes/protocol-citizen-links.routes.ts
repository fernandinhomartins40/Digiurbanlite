/**
 * ============================================================================
 * PROTOCOL CITIZEN LINKS ROUTES - Vinculação de Cidadãos em Protocolos
 * ============================================================================
 * Gerencia vínculos entre protocolos e cidadãos (alunos, dependentes, etc)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole, CitizenLinkType, ServiceRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

// ========================================
// LISTAR VÍNCULOS DE UM PROTOCOLO
// ========================================

/**
 * GET /api/admin/protocols/:protocolId/citizen-links
 * Listar todos os vínculos de cidadãos de um protocolo
 */
router.get('/:protocolId/citizen-links', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { protocolId } = req.params;

    const links = await prisma.protocolCitizenLink.findMany({
      where: { protocolId },
      include: {
        linkedCitizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true,
            rg: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      success: true,
      data: { links }
    });
  } catch (error: any) {
    console.error('Error fetching protocol citizen links:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar vínculos do protocolo'
    });
  }
});

// ========================================
// CRIAR VÍNCULO
// ========================================

/**
 * POST /api/admin/protocols/:protocolId/citizen-links
 * Criar novo vínculo de cidadão no protocolo
 */
router.post('/:protocolId/citizen-links', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { protocolId } = req.params;
    const {
      linkedCitizenId,
      linkType,
      relationship,
      role,
      contextData,
      autoVerify = true
    } = req.body;

    // Validações
    if (!linkedCitizenId) {
      return res.status(400).json({
        success: false,
        error: 'linkedCitizenId é obrigatório'
      });
    }

    if (!linkType) {
      return res.status(400).json({
        success: false,
        error: 'linkType é obrigatório'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'role é obrigatório'
      });
    }

    // Verificar se protocolo existe
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { citizenId: true }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Verificar se cidadão existe
    const citizen = await prisma.citizen.findUnique({
      where: { id: linkedCitizenId }
    });

    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: 'Cidadão não encontrado'
      });
    }

    // Verificar se já existe vínculo
    const existingLink = await prisma.protocolCitizenLink.findFirst({
      where: {
        protocolId,
        linkedCitizenId,
        linkType
      }
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'Vínculo já existe para este cidadão neste protocolo'
      });
    }

    // Verificar vínculo na composição familiar (se autoVerify = true)
    let isVerified = false;
    let verifiedAt = null;
    let verifiedBy = null;

    if (autoVerify && relationship) {
      const familyLink = await prisma.familyComposition.findFirst({
        where: {
          headId: protocol.citizenId,
          memberId: linkedCitizenId,
          relationship: relationship
        }
      });

      if (familyLink) {
        isVerified = true;
        verifiedAt = new Date();
        verifiedBy = userId;
      }
    }

    // Criar vínculo
    const link = await prisma.protocolCitizenLink.create({
      data: {
        protocolId,
        linkedCitizenId,
        linkType: linkType as CitizenLinkType,
        relationship,
        role: role as ServiceRole,
        contextData: contextData || {},
        isVerified,
        verifiedAt,
        verifiedBy
      },
      include: {
        linkedCitizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true,
            rg: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: { link },
      message: isVerified
        ? 'Vínculo criado e verificado automaticamente'
        : 'Vínculo criado (não verificado)'
    });
  } catch (error: any) {
    console.error('Error creating protocol citizen link:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar vínculo'
    });
  }
});

// ========================================
// ATUALIZAR VÍNCULO
// ========================================

/**
 * PUT /api/admin/protocols/:protocolId/citizen-links/:linkId
 * Atualizar vínculo existente
 */
router.put('/:protocolId/citizen-links/:linkId', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { protocolId, linkId } = req.params;
    const {
      linkType,
      relationship,
      role,
      contextData
    } = req.body;

    // Verificar se vínculo existe
    const existingLink = await prisma.protocolCitizenLink.findUnique({
      where: { id: linkId }
    });

    if (!existingLink || existingLink.protocolId !== protocolId) {
      return res.status(404).json({
        success: false,
        error: 'Vínculo não encontrado'
      });
    }

    // Atualizar vínculo
    const link = await prisma.protocolCitizenLink.update({
      where: { id: linkId },
      data: {
        ...(linkType && { linkType: linkType as CitizenLinkType }),
        ...(relationship !== undefined && { relationship }),
        ...(role && { role: role as ServiceRole }),
        ...(contextData !== undefined && { contextData })
      },
      include: {
        linkedCitizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { link },
      message: 'Vínculo atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating protocol citizen link:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar vínculo'
    });
  }
});

// ========================================
// VERIFICAR VÍNCULO MANUALMENTE
// ========================================

/**
 * POST /api/admin/protocols/:protocolId/citizen-links/:linkId/verify
 * Verificar manualmente um vínculo
 */
router.post('/:protocolId/citizen-links/:linkId/verify', requireMinRole(UserRole.COORDINATOR), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { protocolId, linkId } = req.params;

    // Verificar se vínculo existe
    const existingLink = await prisma.protocolCitizenLink.findUnique({
      where: { id: linkId }
    });

    if (!existingLink || existingLink.protocolId !== protocolId) {
      return res.status(404).json({
        success: false,
        error: 'Vínculo não encontrado'
      });
    }

    // Verificar vínculo
    const link = await prisma.protocolCitizenLink.update({
      where: { id: linkId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: userId
      },
      include: {
        linkedCitizen: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { link },
      message: 'Vínculo verificado com sucesso'
    });
  } catch (error: any) {
    console.error('Error verifying protocol citizen link:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar vínculo'
    });
  }
});

// ========================================
// REMOVER VÍNCULO
// ========================================

/**
 * DELETE /api/admin/protocols/:protocolId/citizen-links/:linkId
 * Remover vínculo de cidadão
 */
router.delete('/:protocolId/citizen-links/:linkId', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { protocolId, linkId } = req.params;

    // Verificar se vínculo existe
    const existingLink = await prisma.protocolCitizenLink.findUnique({
      where: { id: linkId }
    });

    if (!existingLink || existingLink.protocolId !== protocolId) {
      return res.status(404).json({
        success: false,
        error: 'Vínculo não encontrado'
      });
    }

    // Remover vínculo
    await prisma.protocolCitizenLink.delete({
      where: { id: linkId }
    });

    return res.json({
      success: true,
      message: 'Vínculo removido com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting protocol citizen link:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao remover vínculo'
    });
  }
});

export default router;
