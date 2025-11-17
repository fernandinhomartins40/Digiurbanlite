/**
 * ============================================================================
 * CITIZEN LINKS VALIDATION ROUTES
 * ============================================================================
 * Rotas para validação de vínculos familiares
 */

import { Router } from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import { citizenLinkValidationService } from '../services/citizen-link-validation.service';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/citizens/:citizenId/family-members
 * Buscar membros da família de um cidadão
 */
router.get('/:citizenId/family-members', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { relationship, onlyDependents } = req.query;

    const result = await citizenLinkValidationService.getFamilyMembers(citizenId, {
      relationship: relationship as string,
      onlyDependents: onlyDependents === 'true'
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: { familyMembers: result.data }
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar membros da família'
    });
  }
});

/**
 * POST /api/admin/citizens/:citizenId/validate-family-link
 * Validar vínculo familiar entre dois cidadãos
 */
router.post('/:citizenId/validate-family-link', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { memberCitizenId, expectedRelationship } = req.body;

    if (!memberCitizenId) {
      return res.status(400).json({
        success: false,
        error: 'memberCitizenId é obrigatório'
      });
    }

    const result = await citizenLinkValidationService.validateFamilyLink(
      citizenId,
      memberCitizenId,
      expectedRelationship
    );

    return res.json({
      success: result.isValid,
      data: result
    });
  } catch (error) {
    console.error('Error validating family link:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao validar vínculo familiar'
    });
  }
});

/**
 * GET /api/admin/citizens/:citizenId/available-for-link
 * Buscar cidadãos disponíveis para vinculação (membros da família)
 */
router.get('/:citizenId/available-for-link', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { linkType } = req.query;

    const result = await citizenLinkValidationService.getAvailableCitizensForLink(
      citizenId,
      linkType as string
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: { citizens: result.data }
    });
  } catch (error) {
    console.error('Error fetching available citizens:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar cidadãos disponíveis'
    });
  }
});

export default router;
