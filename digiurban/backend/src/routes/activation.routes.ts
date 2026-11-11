/**
 * Primeiros passos do município (M5) — montar em /api/admin/activation
 *
 *   GET  /                 lista de ativação + se o cartão foi dispensado (ADMIN)
 *   GET  /cards            cartões do Início já dispensados por quem está logado
 *   POST /dismiss          { card: 'activation' | 'welcome' } dispensa o cartão
 */

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { DISMISSIBLE_CARDS } from '../services/activation/activation-rules';
import { dismissCard, getActivation, getDismissedCards } from '../services/activation/activation.service';

const router = Router();
router.use(adminAuthMiddleware);

router.get('/', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const [activation, dismissed] = await Promise.all([getActivation(), getDismissedCards(req.user!.id)]);
    res.json({ success: true, data: { ...activation, dispensado: dismissed.includes('activation') } });
  } catch (error) {
    console.error('[ACTIVATION] Erro ao montar os primeiros passos:', error);
    res.status(500).json({ error: 'Não foi possível carregar os primeiros passos' });
  }
});

router.get('/cards', async (req, res) => {
  try {
    res.json({ success: true, data: { dismissed: await getDismissedCards(req.user!.id) } });
  } catch (error) {
    console.error('[ACTIVATION] Erro ao ler cartões dispensados:', error);
    res.status(500).json({ error: 'Não foi possível carregar as preferências' });
  }
});

const DismissSchema = z.object({ card: z.enum(DISMISSIBLE_CARDS) });

router.post('/dismiss', async (req, res) => {
  const parsed = DismissSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Cartão inválido' });
  try {
    res.json({ success: true, data: { dismissed: await dismissCard(req.user!.id, parsed.data.card) } });
  } catch (error) {
    console.error('[ACTIVATION] Erro ao dispensar cartão:', error);
    res.status(500).json({ error: 'Não foi possível guardar a escolha' });
  }
});

export default router;
