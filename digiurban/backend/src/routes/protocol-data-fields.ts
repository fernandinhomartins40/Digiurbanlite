/**
 * ============================================================================
 * PROTOCOL DATA FIELDS ROUTES
 * ============================================================================
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as dataFieldService from '../services/protocol-data-field.service';

const router = Router();

// ============================================================================
// GET - Buscar campos de um protocolo
// ============================================================================

router.get('/protocols/:protocolId/data-fields', authenticateToken, async (req, res) => {
  try {
    const { protocolId } = req.params;

    const fields = await dataFieldService.getProtocolDataFields(protocolId);
    const stats = await dataFieldService.getFieldsStatsByProtocol(protocolId);

    res.json({
      success: true,
      data: {
        fields,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching protocol data fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar campos de dados'
    });
  }
});

// ============================================================================
// GET - Buscar campo específico
// ============================================================================

router.get('/protocols/:protocolId/data-fields/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = await dataFieldService.getDataFieldById(fieldId);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Campo não encontrado'
      });
    }

    res.json({
      success: true,
      data: field
    });
  } catch (error: any) {
    console.error('Error fetching data field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar campo'
    });
  }
});

// ============================================================================
// GET - Estatísticas de campos
// ============================================================================

router.get('/protocols/:protocolId/data-fields-stats', authenticateToken, async (req, res) => {
  try {
    const { protocolId } = req.params;

    const stats = await dataFieldService.getFieldsStatsByProtocol(protocolId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching fields stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar estatísticas'
    });
  }
});

// ============================================================================
// PUT - Aprovar campo
// ============================================================================

router.put('/protocols/:protocolId/data-fields/:fieldId/approve', authenticateToken, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const field = await dataFieldService.approveDataField({
      fieldId,
      validatedBy: userId,
      comment
    });

    res.json({
      success: true,
      data: field,
      message: 'Campo aprovado com sucesso'
    });
  } catch (error: any) {
    console.error('Error approving data field:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao aprovar campo'
    });
  }
});

// ============================================================================
// PUT - Rejeitar campo
// ============================================================================

router.put('/protocols/:protocolId/data-fields/:fieldId/reject', authenticateToken, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Motivo da rejeição é obrigatório'
      });
    }

    const field = await dataFieldService.rejectDataField({
      fieldId,
      validatedBy: userId,
      rejectionReason
    });

    res.json({
      success: true,
      data: field,
      message: 'Campo rejeitado com sucesso'
    });
  } catch (error: any) {
    console.error('Error rejecting data field:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao rejeitar campo'
    });
  }
});

// ============================================================================
// PUT - Corrigir campo (cidadão)
// ============================================================================

router.put('/protocols/:protocolId/data-fields/:fieldId/correct', authenticateToken, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { newValue } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!newValue || !newValue.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Novo valor é obrigatório'
      });
    }

    const field = await dataFieldService.correctDataField({
      fieldId,
      newValue,
      correctedBy: userId
    });

    res.json({
      success: true,
      data: field,
      message: 'Campo corrigido com sucesso'
    });
  } catch (error: any) {
    console.error('Error correcting data field:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao corrigir campo'
    });
  }
});

// ============================================================================
// PUT - Aprovar todos os campos de um protocolo
// ============================================================================

router.put('/protocols/:protocolId/data-fields/approve-all', authenticateToken, async (req, res) => {
  try {
    const { protocolId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const count = await dataFieldService.approveAllDataFields(protocolId, userId);

    res.json({
      success: true,
      data: { count },
      message: `${count} campos aprovados com sucesso`
    });
  } catch (error: any) {
    console.error('Error approving all fields:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao aprovar campos'
    });
  }
});

export default router;
