/**
 * Google Maps.
 *
 *   /api/platform/maps/*   Super-admin: chaves, liga/desliga, teste e números do arquivo de endereços
 *   GET /api/maps/config   servidor logado: qual mapa usar (google | osm) e a chave do navegador
 */

import axios from 'axios';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { getMapsSettings, keyPreview, looksLikeGoogleKey, saveMapsSettings } from '../services/maps/maps-settings.service';
import { geoCacheStats } from '../services/geocoding.service';
import { logAuditEvent } from '../utils/audit-logger';

export const platformMapsRouter = Router();
platformMapsRouter.use(platformAuthMiddleware);
const PLATFORM_ADMIN = requirePlatformRole('PLATFORM_ADMIN');

async function status() {
  const settings = await getMapsSettings();
  return {
    enabled: settings.enabled,
    hasBrowserKey: Boolean(settings.browserKey),
    browserKeyPreview: keyPreview(settings.browserKey),
    // a chave do navegador já aparece em toda página com mapa; aqui serve para a prévia
    browserKey: settings.browserKey,
    hasServerKey: Boolean(settings.serverKey),
    serverKeyPreview: keyPreview(settings.serverKey),
    mapId: settings.mapId,
    provider: settings.enabled && settings.browserKey ? 'google' : 'osm',
    cache: await geoCacheStats().catch(() => null),
  };
}

platformMapsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await status());
  } catch (error) {
    console.error('[maps] status', error);
    res.status(500).json({ error: 'Erro ao carregar a configuração do mapa' });
  }
});

const saveSchema = z.object({
  browserKey: z.string().max(100).optional(),
  serverKey: z.string().max(100).optional(),
  mapId: z.string().max(100).regex(/^[0-9A-Za-z_-]*$/, 'ID do mapa inválido').optional(),
  enabled: z.boolean().optional(),
});

platformMapsRouter.put('/', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  const parsed = saveSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  const input = parsed.data;
  for (const field of ['browserKey', 'serverKey'] as const) {
    const value = input[field];
    if (value && !looksLikeGoogleKey(value)) {
      return res.status(400).json({ error: 'A chave do Google começa com "AIza" e tem 39 caracteres. Confira se copiou inteira.' });
    }
  }
  const current = await getMapsSettings();
  if (input.enabled && !(input.browserKey ?? current.browserKey)) {
    return res.status(400).json({ error: 'Informe a chave do navegador antes de ligar o Google Maps.' });
  }
  try {
    await saveMapsSettings(input);
    void logAuditEvent({
      action: 'PLATFORM_MAPS_SETTINGS',
      resource: req.originalUrl,
      method: req.method,
      details: {
        context: 'platform',
        platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id,
        changed: Object.keys(input),
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    }).catch(() => undefined);
    return res.json(await status());
  } catch (error) {
    console.error('[maps] salvar', error);
    return res.status(500).json({ error: 'Erro ao salvar a configuração do mapa' });
  }
});

/** Testa a chave do servidor procurando um endereço conhecido no Google */
platformMapsRouter.post('/test', PLATFORM_ADMIN, async (_req: Request, res: Response) => {
  const settings = await getMapsSettings();
  if (!settings.serverKey) return res.status(400).json({ error: 'Nenhuma chave do servidor salva.' });
  try {
    const response = await axios.get<any>('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: 'Praça dos Três Poderes, Brasília, DF, Brasil', key: settings.serverKey, language: 'pt-BR' },
      timeout: 10000,
    });
    const data = response.data || {};
    if (data.status === 'OK') {
      return res.json({ ok: true, message: `Funcionou: ${data.results?.[0]?.formatted_address || 'endereço encontrado'}` });
    }
    const hints: Record<string, string> = {
      REQUEST_DENIED: 'O Google recusou. Confira se a "Geocoding API" está ativada no projeto e se a restrição de IP inclui o servidor.',
      OVER_QUERY_LIMIT: 'Limite do Google atingido ou faturamento não ativado no projeto.',
      OVER_DAILY_LIMIT: 'Faturamento não ativado no projeto do Google.',
    };
    return res.json({ ok: false, message: hints[data.status] || `O Google respondeu: ${data.status}`, detail: data.error_message || null });
  } catch (error) {
    return res.json({ ok: false, message: 'Não foi possível falar com o Google agora.', detail: error instanceof Error ? error.message : null });
  }
});

export const mapsConfigRouter = Router();
mapsConfigRouter.use(adminAuthMiddleware as any);

/** Qual mapa a tela usa. Sem chave ou desligado: OpenStreetMap. */
mapsConfigRouter.get('/config', async (_req: Request, res: Response) => {
  try {
    const settings = await getMapsSettings();
    const google = settings.enabled && Boolean(settings.browserKey);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json(google ? { provider: 'google', browserKey: settings.browserKey, mapId: settings.mapId } : { provider: 'osm', browserKey: null, mapId: null });
  } catch {
    res.json({ provider: 'osm', browserKey: null, mapId: null });
  }
});
