/**
 * Casa do cidadão no mapa (portal/app do cidadão).
 *
 *   GET    /api/citizen/location/home   ponto confirmado ou sugestão pelo endereço
 *   PUT    /api/citizen/location/home   grava { latitude, longitude, source: 'GPS' | 'PIN' }
 *   DELETE /api/citizen/location/home   apaga o ponto
 *
 * O ponto vem do GPS do celular ou do alfinete tocado/arrastado pela pessoa:
 * dado próprio, guardado sem prazo (ver citizen-home-location.service).
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { citizenHomeLocationStatus, clearCitizenHomeLocation, setCitizenHomeLocation } from '../services/citizen-home-location.service';

const router = Router();
router.use(citizenAuthMiddleware as any);

function citizenIdOf(req: Request, res: Response): string | null {
  const citizenId = (req as any).citizenId || (req as any).citizen?.id;
  if (!citizenId) {
    res.status(403).json({ error: 'Somente o próprio cidadão marca a casa no mapa' });
    return null;
  }
  return citizenId;
}

router.get('/home', async (req: Request, res: Response) => {
  const citizenId = citizenIdOf(req, res);
  if (!citizenId) return;
  try {
    const status = await citizenHomeLocationStatus(citizenId);
    if (!status) return res.status(404).json({ error: 'Cidadão não encontrado' });
    return res.json(status);
  } catch (error) {
    console.error('[casa no mapa] ler', error);
    return res.status(500).json({ error: 'Não foi possível carregar o local da casa' });
  }
});

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['GPS', 'PIN']).default('PIN'),
});

router.put('/home', async (req: Request, res: Response) => {
  const citizenId = citizenIdOf(req, res);
  if (!citizenId) return;
  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Ponto inválido' });
  try {
    const saved = await setCitizenHomeLocation(citizenId, parsed.data.latitude, parsed.data.longitude, parsed.data.source);
    return res.json({ confirmed: true, ...saved });
  } catch (error: any) {
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
    console.error('[casa no mapa] gravar', error);
    return res.status(500).json({ error: 'Não foi possível gravar o local da casa' });
  }
});

router.delete('/home', async (req: Request, res: Response) => {
  const citizenId = citizenIdOf(req, res);
  if (!citizenId) return;
  try {
    await clearCitizenHomeLocation(citizenId);
    return res.json({ ok: true });
  } catch (error) {
    console.error('[casa no mapa] apagar', error);
    return res.status(500).json({ error: 'Não foi possível apagar o local da casa' });
  }
});

export default router;
