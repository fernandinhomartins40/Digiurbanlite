/**
 * Cliente do serviço de biometria facial (ultrazend-face, rede interna).
 *
 * Toda chamada leva:
 * - o token interno do painel (Super-admin › Chaves de API › Comunicação interna);
 * - o MUNICÍPIO da requisição (X-Tenant-Id) — o serviço filtra tudo por ele;
 * - quem está agindo (servidor/cidadão), para o registro de acesso da LGPD.
 */

import axios, { type AxiosInstance } from 'axios';
import { tryGetTenantId } from '../lib/tenant-context';
import { acceptedInternalTokens } from './platform-secrets.service';

export interface FaceActorHeaders {
  type: 'USER' | 'CITIZEN' | 'SYSTEM';
  id?: string | null;
  role?: string | null;
}

export type FacePurpose = 'IDENTITY_VERIFICATION' | 'SCHOOL_SECURITY';

export class FacePlatformError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function normalizeUpstreamError(error: any, fallbackMessage: string) {
  const status = Number(error?.response?.status) || (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' ? 503 : 500);
  const upstreamMessage = error?.response?.data?.message || error?.response?.data?.error;
  const message =
    status === 503 || !upstreamMessage
      ? status >= 500
        ? 'O serviço de biometria facial está indisponível no momento. Tente novamente em instantes.'
        : fallbackMessage
      : String(upstreamMessage);
  return new FacePlatformError(message, status, status < 500 ? error?.response?.data?.details : undefined);
}

async function serviceToken() {
  const { db } = await acceptedInternalTokens().catch(() => ({ db: [] as string[] }));
  return db[0] || process.env.FACE_PLATFORM_SERVICE_TOKEN || '';
}

class FacePlatformClientService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.FACE_PLATFORM_API_URL || 'http://localhost:9006';
    this.api = axios.create({
      baseURL: `${baseURL.replace(/\/$/, '')}/api/face-platform`,
      timeout: Number(process.env.FACE_PLATFORM_TIMEOUT_MS || 45000),
      headers: { 'Content-Type': 'application/json' },
      maxBodyLength: 30 * 1024 * 1024,
    });
    this.api.interceptors.request.use(async (config) => {
      const token = await serviceToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  private headers(actor?: FaceActorHeaders, tenantId?: string | null) {
    const tenant = tenantId || tryGetTenantId();
    if (!tenant) throw new FacePlatformError('Município da requisição não identificado', 400);
    return {
      'X-Tenant-Id': tenant,
      'X-Actor-Type': actor?.type || 'SYSTEM',
      ...(actor?.id ? { 'X-Actor-Id': actor.id } : {}),
      ...(actor?.role ? { 'X-Actor-Role': actor.role } : {}),
    };
  }

  private async call<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    options: { actor?: FaceActorHeaders; data?: unknown; params?: Record<string, unknown>; fallback: string }
  ): Promise<T> {
    try {
      const response = await this.api.request({
        method,
        url,
        data: options.data,
        params: options.params,
        headers: this.headers(options.actor),
      });
      return response.data as T;
    } catch (error: any) {
      if (error instanceof FacePlatformError) throw error;
      throw normalizeUpstreamError(error, options.fallback);
    }
  }

  async getStatus() {
    try {
      return await this.call('get', '/status', { fallback: 'Serviço facial indisponível' });
    } catch (error: any) {
      return {
        available: false,
        status: error?.status || 503,
        message: error?.message || 'Serviço facial indisponível',
        providers: { recognition: { available: false }, liveness: { available: false } },
      };
    }
  }

  getDashboard() { return this.call('get', '/dashboard', { fallback: 'Erro ao carregar o painel facial' }); }
  listSchools() { return this.call('get', '/schools', { fallback: 'Erro ao listar escolas' }); }
  listSchoolCitizens(schoolId: string) { return this.call('get', `/schools/${encodeURIComponent(schoolId)}/citizens`, { fallback: 'Erro ao listar alunos' }); }
  listDevices() { return this.call('get', '/devices', { fallback: 'Erro ao listar dispositivos' }); }
  createDevice(payload: Record<string, unknown>) { return this.call('post', '/devices', { data: payload, fallback: 'Erro ao criar dispositivo' }); }
  updateDevice(id: string, payload: Record<string, unknown>) { return this.call('put', `/devices/${encodeURIComponent(id)}`, { data: payload, fallback: 'Erro ao atualizar dispositivo' }); }
  listZones() { return this.call('get', '/zones', { fallback: 'Erro ao listar zonas' }); }
  createZone(payload: Record<string, unknown>) { return this.call('post', '/zones', { data: payload, fallback: 'Erro ao criar zona' }); }
  listConfigurations() { return this.call('get', '/configurations', { fallback: 'Erro ao listar configurações' }); }
  upsertSchoolConfiguration(schoolId: string, payload: Record<string, unknown>) {
    return this.call('put', `/configurations/${encodeURIComponent(schoolId)}`, { data: payload, fallback: 'Erro ao salvar configuração' });
  }

  listIdentities(actor: FaceActorHeaders) { return this.call('get', '/identities', { actor, fallback: 'Erro ao listar biometrias' }); }
  getCitizenBiometry(citizenId: string, actor: FaceActorHeaders) {
    return this.call('get', `/citizens/${encodeURIComponent(citizenId)}/biometry`, { actor, fallback: 'Erro ao carregar a biometria' });
  }

  createChallenge(subject: string, actor: FaceActorHeaders) {
    return this.call<{ challengeId: string; direction: 'left' | 'right'; expiresAt: string }>('post', '/challenges', {
      actor,
      data: { subject },
      fallback: 'Erro ao iniciar a validação',
    });
  }

  createEnrollment(
    citizenId: string,
    payload: {
      purpose: FacePurpose;
      frames: string[];
      challengeId: string;
      sourceType: string;
      sourceLabel?: string | null;
      consent?: Record<string, unknown> | null;
    },
    actor: FaceActorHeaders
  ) {
    return this.call('post', `/citizens/${encodeURIComponent(citizenId)}/enrollments`, { actor, data: payload, fallback: 'Erro ao cadastrar a biometria' });
  }

  verify(
    payload: {
      frames: string[];
      challengeId: string;
      challengeSubject: string;
      expectedCitizenId?: string | null;
      purpose: FacePurpose;
      sourceType: string;
    },
    actor: FaceActorHeaders
  ) {
    return this.call('post', '/recognition/verify', { actor, data: payload, fallback: 'Erro na leitura biométrica' });
  }

  deleteCitizenBiometry(citizenId: string, actor: FaceActorHeaders, reason?: string | null) {
    return this.call('delete', `/citizens/${encodeURIComponent(citizenId)}/biometry`, { actor, data: { reason }, fallback: 'Erro ao excluir a biometria' });
  }

  listConsents(citizenId: string, actor: FaceActorHeaders) {
    return this.call('get', `/citizens/${encodeURIComponent(citizenId)}/consents`, { actor, fallback: 'Erro ao carregar consentimentos' });
  }
  grantConsent(citizenId: string, purpose: FacePurpose, consent: Record<string, unknown>, actor: FaceActorHeaders) {
    return this.call('post', `/citizens/${encodeURIComponent(citizenId)}/consents`, { actor, data: { purpose, consent }, fallback: 'Erro ao registrar consentimento' });
  }
  revokeConsent(citizenId: string, purpose: FacePurpose, reason: string, actor: FaceActorHeaders) {
    return this.call('post', `/citizens/${encodeURIComponent(citizenId)}/consents/revoke`, { actor, data: { purpose, reason }, fallback: 'Erro ao revogar consentimento' });
  }

  listEvents(params: Record<string, unknown>) { return this.call('get', '/events', { params, fallback: 'Erro ao listar registros' }); }
  ingestRecognition(payload: { deviceId: string; zoneId?: string | null; eventType?: string; frame: string }, actor: FaceActorHeaders) {
    return this.call('post', '/events/ingest', { actor, data: payload, fallback: 'Erro ao registrar a passagem' });
  }
  reviewEvent(eventId: string, decision: 'approve' | 'reject', actor: FaceActorHeaders) {
    return this.call('post', `/events/${encodeURIComponent(eventId)}/review`, { actor, data: { decision }, fallback: 'Erro ao revisar o registro' });
  }

  async getMedia(kind: 'enrollment' | 'event', id: string, actor: FaceActorHeaders) {
    try {
      const response = await this.api.get(`/media/${kind}/${encodeURIComponent(id)}`, {
        headers: this.headers(actor),
        responseType: 'arraybuffer',
      });
      return { buffer: Buffer.from(response.data), mimeType: String(response.headers['content-type'] || 'image/jpeg') };
    } catch (error: any) {
      if (error instanceof FacePlatformError) throw error;
      if (error?.response?.data) {
        try {
          error.response.data = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
        } catch {
          // segue com a mensagem padrão
        }
      }
      throw normalizeUpstreamError(error, 'Foto não encontrada');
    }
  }

  listAccessLogs(params: { citizenId?: string; limit?: number }) {
    return this.call('get', '/access-logs', { params, fallback: 'Erro ao carregar o registro de acesso' });
  }

  /** Plataforma: avisa que a configuração do motor mudou (vale na hora) */
  async notifySettingsChanged() {
    try {
      await this.api.post('/maintenance/settings-changed', {});
    } catch {
      // o serviço relê sozinho em até 1 minuto
    }
  }
  async runRetentionNow() {
    try {
      const response = await this.api.post('/maintenance/retention', {});
      return response.data;
    } catch (error) {
      throw normalizeUpstreamError(error, 'Erro ao aplicar o prazo de guarda da biometria');
    }
  }
}

export default new FacePlatformClientService();
