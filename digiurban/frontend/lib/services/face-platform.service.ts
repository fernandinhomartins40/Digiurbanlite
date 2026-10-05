import { api } from '@/lib/services/api';

/**
 * Biometria facial (painel do servidor). O rosto é analisado no servidor: as
 * telas mandam só as fotos da câmera. Vetores de rosto nunca chegam aqui.
 */
export const facePlatformService = {
  getStatus: async () => {
    const response = await api.get('/admin/face-platform/status');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/admin/face-platform/dashboard');
    return response.data;
  },

  listSchools: async () => {
    const response = await api.get('/admin/face-platform/schools');
    return response.data;
  },

  listSchoolCitizens: async (schoolId: string) => {
    const response = await api.get(`/admin/face-platform/schools/${schoolId}/citizens`);
    return response.data;
  },

  listDevices: async () => {
    const response = await api.get('/admin/face-platform/devices');
    return response.data;
  },

  createDevice: async (payload: any) => {
    const response = await api.post('/admin/face-platform/devices', payload);
    return response.data;
  },

  updateDevice: async (id: string, payload: any) => {
    const response = await api.put(`/admin/face-platform/devices/${id}`, payload);
    return response.data;
  },

  listZones: async () => {
    const response = await api.get('/admin/face-platform/zones');
    return response.data;
  },

  createZone: async (payload: any) => {
    const response = await api.post('/admin/face-platform/zones', payload);
    return response.data;
  },

  listConfigurations: async () => {
    const response = await api.get('/admin/face-platform/configurations');
    return response.data;
  },

  saveConfiguration: async (schoolId: string, payload: any) => {
    const response = await api.put(`/admin/face-platform/configurations/${schoolId}`, payload);
    return response.data;
  },

  /** Só gerente ou mais. Sem vetores; CPF mascarado. */
  listIdentities: async () => {
    const response = await api.get('/admin/face-platform/identities');
    return response.data;
  },

  /** Desafio da prova de vida: o servidor sorteia o lado do giro */
  createChallenge: async (payload: { mode: 'enroll' | 'read'; citizenId?: string }) => {
    const response = await api.post('/admin/face-platform/challenges', payload);
    return response.data as { challengeId: string; direction: 'left' | 'right'; expiresAt: string };
  },

  /** Cadastro presencial com consentimento (titular ou responsável) */
  enrollCitizen: async (
    citizenId: string,
    payload: {
      purpose: 'IDENTITY_VERIFICATION' | 'SCHOOL_SECURITY';
      frames: string[];
      challengeId: string;
      sourceLabel?: string;
      consent: { accepted: boolean; relationship: string; grantedByName?: string; signedTermOnFile?: boolean; note?: string };
    }
  ) => {
    const response = await api.post(`/admin/face-platform/citizens/${citizenId}/enrollments`, payload);
    return response.data;
  },

  /** Leitura ao vivo: com cidadão esperado confirma se é ele; sem, procura no município */
  verify: async (payload: {
    frames: string[];
    challengeId: string;
    expectedCitizenId?: string;
    purpose?: 'IDENTITY_VERIFICATION' | 'SCHOOL_SECURITY';
  }) => {
    const response = await api.post('/admin/face-platform/recognition/verify', payload);
    return response.data;
  },

  listConsents: async (citizenId: string) => {
    const response = await api.get(`/admin/face-platform/citizens/${citizenId}/consents`);
    return response.data;
  },

  revokeConsent: async (citizenId: string, purpose: 'IDENTITY_VERIFICATION' | 'SCHOOL_SECURITY', reason: string) => {
    const response = await api.post(`/admin/face-platform/citizens/${citizenId}/consents/revoke`, { purpose, reason });
    return response.data;
  },

  listEvents: async (params?: Record<string, string | number | undefined>) => {
    const response = await api.get('/admin/face-platform/events', { params });
    return response.data;
  },

  /** Portaria: uma foto da câmera; o servidor reconhece cada rosto e registra */
  ingestFrame: async (payload: { deviceId: string; zoneId?: string; eventType?: 'ENTRY' | 'EXIT' | 'DETECTION'; frame: string }) => {
    const response = await api.post('/admin/face-platform/events/ingest', payload);
    return response.data as { facesDetected: number; events: Array<{ duplicate: boolean; event: any }> };
  },

  reviewEvent: async (eventId: string, decision: 'approve' | 'reject') => {
    const response = await api.post(`/admin/face-platform/events/${eventId}/review`, { decision });
    return response.data;
  },

  /** Foto de cadastro/passagem (coordenador+; cada acesso é registrado) */
  mediaUrl: (kind: 'enrollment' | 'event', id: string) => `/api/admin/face-platform/media/${kind}/${id}`,

  listAccessLogs: async (params?: { citizenId?: string; limit?: number }) => {
    const response = await api.get('/admin/face-platform/access-logs', { params });
    return response.data;
  },
};

export default facePlatformService;
