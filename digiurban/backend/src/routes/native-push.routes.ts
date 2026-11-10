/**
 * Push dos apps nativos (2026-11-10).
 *
 *   POST   /api/native-push/devices   aparelho logado (cidadão ou servidor) guarda o token
 *   DELETE /api/native-push/devices   sair da conta: tira o token (basta o token)
 *   /api/platform/native-apps/*        Super-admin › Apps nativos: credenciais e teste
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../lib/tenant-context';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { getNativePushSettings, removeNativeDevices, saveNativePushSettings, sendToDevice } from '../services/native-push/native-push.service';
import { looksLikeDeviceToken, parseServiceAccount } from '../services/native-push/rules';
import { logAuditEvent } from '../utils/audit-logger';

const router = Router();

const deviceSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(['ANDROID', 'IOS']),
  portal: z.enum(['citizen', 'admin']).optional(),
});

/** O app manda de qual portal veio: /admin usa a sessão do servidor, /cidadao a do cidadão */
function portalAuth(req: Request, res: Response, next: NextFunction) {
  const middleware = req.body?.portal === 'admin' ? adminAuthMiddleware : citizenAuthMiddleware;
  return (middleware as any)(req, res, next);
}

router.post('/devices', portalAuth, async (req: Request, res: Response) => {
  const parsed = deviceSchema.safeParse(req.body || {});
  if (!parsed.success || !looksLikeDeviceToken(parsed.data.platform, parsed.data.token)) {
    return res.status(400).json({ error: 'Aparelho inválido' });
  }
  const { token, platform, portal } = parsed.data;
  const anyReq = req as any;
  const citizenId: string | undefined = portal !== 'admin' ? anyReq.citizen?.id : undefined;
  const userId: string | undefined = citizenId ? undefined : anyReq.user?.id;
  if (!citizenId && !userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    // o mesmo aparelho pode ter sido de outra pessoa ou de outro município antes
    await runAsPlatform(async () => prisma.nativePushDevice.deleteMany({ where: { token } }));
    await prisma.nativePushDevice.create({
      data: { token, platform, citizenId: citizenId || null, userId: userId || null, tenantId: anyReq.tenantId || tryGetTenantId() || null },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('[native-push] registrar', error);
    return res.status(500).json({ error: 'Erro ao registrar o aparelho' });
  }
});

router.delete('/devices', async (req: Request, res: Response) => {
  const token = String(req.body?.token || req.query.token || '');
  if (token.length < 20) return res.status(400).json({ error: 'Aparelho inválido' });
  try {
    await runAsPlatform(async () => removeNativeDevices({ token }));
    return res.json({ success: true });
  } catch (error) {
    console.error('[native-push] remover', error);
    return res.status(500).json({ error: 'Erro ao remover o aparelho' });
  }
});

export default router;

// ---------------------------------------------------------------- Super-admin

export const platformNativeAppsRouter = Router();
platformNativeAppsRouter.use(platformAuthMiddleware);
const PLATFORM_ADMIN = requirePlatformRole('PLATFORM_ADMIN');

async function status() {
  const settings = await getNativePushSettings();
  const account = parseServiceAccount(settings.fcmServiceAccount);
  const [android, ios] = await runAsPlatform(async () =>
    Promise.all([prisma.nativePushDevice.count({ where: { platform: 'ANDROID' } }), prisma.nativePushDevice.count({ where: { platform: 'IOS' } })])
  );
  return {
    android: { configured: Boolean(account), projectId: account?.project_id || null, clientEmail: account?.client_email || null, devices: android },
    ios: {
      configured: Boolean(settings.apnsKey && settings.apnsKeyId && settings.apnsTeamId),
      hasKey: Boolean(settings.apnsKey),
      keyId: settings.apnsKeyId,
      teamId: settings.apnsTeamId,
      bundleId: settings.apnsBundleId,
      production: settings.apnsProduction,
      devices: ios,
    },
  };
}

platformNativeAppsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await status());
  } catch (error) {
    console.error('[native-apps] status', error);
    res.status(500).json({ error: 'Erro ao carregar a configuração dos apps' });
  }
});

const saveSchema = z.object({
  fcmServiceAccount: z.string().max(20000).optional(),
  apnsKey: z.string().max(5000).optional(),
  apnsKeyId: z.string().max(20).regex(/^[0-9A-Za-z]*$/, 'Key ID inválido (10 letras/números)').optional(),
  apnsTeamId: z.string().max(20).regex(/^[0-9A-Za-z]*$/, 'Team ID inválido (10 letras/números)').optional(),
  apnsBundleId: z.string().max(200).regex(/^[0-9A-Za-z.-]*$/, 'Identificador do app inválido').optional(),
  apnsProduction: z.boolean().optional(),
});

platformNativeAppsRouter.put('/', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  const parsed = saveSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  const input = parsed.data;
  if (input.fcmServiceAccount && !parseServiceAccount(input.fcmServiceAccount)) {
    return res.status(400).json({ error: 'Arquivo do Firebase inválido. Cole o conteúdo inteiro do arquivo .json da conta de serviço (tem "project_id", "client_email" e "private_key").' });
  }
  if (input.apnsKey && !/^[\sA-Za-z0-9+/=-]+$/.test(input.apnsKey.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, ''))) {
    return res.status(400).json({ error: 'Chave da Apple inválida. Cole o conteúdo inteiro do arquivo .p8.' });
  }
  try {
    await saveNativePushSettings(input);
    void logAuditEvent({
      action: 'PLATFORM_NATIVE_APPS_SETTINGS',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id, changed: Object.keys(input) },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    }).catch(() => undefined);
    return res.json(await status());
  } catch (error) {
    console.error('[native-apps] salvar', error);
    return res.status(500).json({ error: 'Erro ao salvar a configuração dos apps' });
  }
});

/** Aviso de teste para um aparelho (token colado) ou para o aparelho mais recente da plataforma */
platformNativeAppsRouter.post('/test', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  const platform = req.body?.platform === 'IOS' ? 'IOS' : 'ANDROID';
  const pasted = String(req.body?.token || '').trim();
  try {
    const device = pasted
      ? { platform, token: pasted }
      : await runAsPlatform(async () => prisma.nativePushDevice.findFirst({ where: { platform }, orderBy: { lastUsed: 'desc' }, select: { id: true, platform: true, token: true } }));
    if (!device) return res.json({ ok: false, message: `Nenhum aparelho ${platform === 'IOS' ? 'iPhone' : 'Android'} registrado ainda. Abra o app, entre na conta e aceite os avisos.` });
    const result = await runAsPlatform(async () =>
      sendToDevice(device, { title: 'Aviso de teste', body: 'Os avisos do app DigiUrban estão funcionando.', data: { url: '/cidadao' }, highPriority: true })
    );
    if (result.ok) return res.json({ ok: true, message: 'Aviso enviado. Confira no aparelho.' });
    const detail = result.body?.error?.message || result.body?.reason || null;
    return res.json({
      ok: false,
      message: result.dropped ? 'O aparelho não existe mais (app desinstalado ou token trocado). Foi retirado da lista.' : 'Não foi enviado. Confira as credenciais.',
      detail,
    });
  } catch (error) {
    return res.json({ ok: false, message: 'Não foi possível enviar agora.', detail: error instanceof Error ? error.message : null });
  }
});
