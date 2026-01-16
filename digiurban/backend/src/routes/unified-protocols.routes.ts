// ============================================================
// UNIFIED PROTOCOLS ROUTES
// ============================================================
// Rotas REST para gerenciamento unificado de protocolos COM_DADOS

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as unifiedProtocolService from '../services/unified-protocol.service';

const router = Router();

// ============================================================
// GET /api/protocols/:id/unified-data
// Obter dados unificados do protocolo
// ============================================================
router.get('/:id/unified-data', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await unifiedProtocolService.getUnifiedProtocol(id);
    res.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar dados unificados:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar dados unificados' });
  }
});

// ============================================================
// GET /api/protocols/:id/fields/stats
// Obter estatísticas de campos
// ============================================================
router.get('/:id/fields/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await unifiedProtocolService.getFieldsStats(id);
    res.json(stats);
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
  }
});

// ============================================================
// PUT /api/protocols/:id/fields/:fieldKey/approve
// Aprovar campo específico
// ============================================================
router.put('/:id/fields/:fieldKey/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, fieldKey } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const result = await unifiedProtocolService.approveField({
      protocolId: id,
      fieldKey,
      validatedBy: userId,
      comment
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao aprovar campo:', error);
    res.status(500).json({ error: error.message || 'Erro ao aprovar campo' });
  }
});

// ============================================================
// PUT /api/protocols/:id/fields/:fieldKey/reject
// Rejeitar campo específico
// ============================================================
router.put('/:id/fields/:fieldKey/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, fieldKey } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
    }

    const result = await unifiedProtocolService.rejectField({
      protocolId: id,
      fieldKey,
      validatedBy: userId,
      rejectionReason
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao rejeitar campo:', error);
    res.status(500).json({ error: error.message || 'Erro ao rejeitar campo' });
  }
});

// ============================================================
// PUT /api/protocols/:id/fields/:fieldKey/correct
// Corrigir campo (cidadão submete nova versão)
// ============================================================
router.put('/:id/fields/:fieldKey/correct', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, fieldKey } = req.params;
    const { newValue } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (newValue === undefined || newValue === null) {
      return res.status(400).json({ error: 'Novo valor é obrigatório' });
    }

    const result = await unifiedProtocolService.correctField({
      protocolId: id,
      fieldKey,
      newValue: String(newValue),
      correctedBy: userId
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao corrigir campo:', error);
    res.status(500).json({ error: error.message || 'Erro ao corrigir campo' });
  }
});

// ============================================================
// POST /api/protocols/:id/fields/bulk-approve
// Aprovar múltiplos campos de uma vez
// ============================================================
router.post('/:id/fields/bulk-approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fieldKeys } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!Array.isArray(fieldKeys) || fieldKeys.length === 0) {
      return res.status(400).json({ error: 'fieldKeys deve ser um array não vazio' });
    }

    const result = await unifiedProtocolService.bulkApproveFields({
      protocolId: id,
      fieldKeys,
      validatedBy: userId
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao aprovar campos em lote:', error);
    res.status(500).json({ error: error.message || 'Erro ao aprovar campos em lote' });
  }
});

// ============================================================
// GET /api/protocols/:id/fields/:fieldKey/history
// Obter histórico completo de um campo
// ============================================================
router.get('/:id/fields/:fieldKey/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, fieldKey } = req.params;

    // Primeiro buscar o campo para pegar o fieldId
    const field = await unifiedProtocolService.getUnifiedProtocol(id);
    const targetField = field.fields.find((f) => f.key === fieldKey);

    if (!targetField) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    const history = await unifiedProtocolService.getFieldHistory(targetField.id);
    res.json(history);
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
  }
});

// ============================================================
// GET /api/protocols/:id/fields/:fieldKey/comparison
// Comparar versões de um campo
// ============================================================
router.get('/:id/fields/:fieldKey/comparison', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, fieldKey } = req.params;
    const comparison = await unifiedProtocolService.getFieldVersionComparison(id, fieldKey);
    res.json(comparison);
  } catch (error: any) {
    console.error('Erro ao comparar versões:', error);
    res.status(500).json({ error: error.message || 'Erro ao comparar versões' });
  }
});

export default router;
