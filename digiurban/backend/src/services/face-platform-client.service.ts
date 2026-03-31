import axios, { type AxiosInstance } from 'axios';

const DEFAULT_FACE_PLATFORM_SERVICE_TOKEN = 'ultrazend-face-service-token';

class FacePlatformClientService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.FACE_PLATFORM_API_URL || 'http://localhost:9006';
    const serviceToken = process.env.FACE_PLATFORM_SERVICE_TOKEN || DEFAULT_FACE_PLATFORM_SERVICE_TOKEN;

    this.api = axios.create({
      baseURL: `${baseURL.replace(/\/$/, '')}/api/face-platform`,
      timeout: Number(process.env.FACE_PLATFORM_TIMEOUT_MS || 20000),
      headers: {
        Authorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getStatus() {
    try {
      const response = await this.api.get('/status');
      return response.data;
    } catch (error: any) {
      const upstreamMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Serviço facial indisponível';

      return {
        available: false,
        status: error?.response?.status || 503,
        message:
          error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND'
            ? 'Serviço facial não está ativo ou acessível em FACE_PLATFORM_API_URL.'
            : upstreamMessage,
      };
    }
  }

  async getDashboard() {
    const response = await this.api.get('/dashboard');
    return response.data;
  }

  async listSchools() {
    const response = await this.api.get('/schools');
    return response.data;
  }

  async listSchoolStudents(schoolId: string) {
    const response = await this.api.get(`/schools/${schoolId}/students`);
    return response.data;
  }

  async listDevices() {
    const response = await this.api.get('/devices');
    return response.data;
  }

  async createDevice(payload: Record<string, unknown>) {
    const response = await this.api.post('/devices', payload);
    return response.data;
  }

  async updateDevice(id: string, payload: Record<string, unknown>) {
    const response = await this.api.put(`/devices/${id}`, payload);
    return response.data;
  }

  async listZones() {
    const response = await this.api.get('/zones');
    return response.data;
  }

  async createZone(payload: Record<string, unknown>) {
    const response = await this.api.post('/zones', payload);
    return response.data;
  }

  async listConfigurations() {
    const response = await this.api.get('/configurations');
    return response.data;
  }

  async upsertSchoolConfiguration(schoolId: string, payload: Record<string, unknown>) {
    const response = await this.api.put(`/configurations/${schoolId}`, payload);
    return response.data;
  }

  async listIdentities() {
    const response = await this.api.get('/identities');
    return response.data;
  }

  async createEnrollment(payload: Record<string, unknown>) {
    const response = await this.api.post('/identities/enrollments', payload);
    return response.data;
  }

  async readBiometry(payload: Record<string, unknown>) {
    const response = await this.api.post('/recognition/read', payload);
    return response.data;
  }

  async listEvents(params: Record<string, unknown>) {
    const response = await this.api.get('/events', { params });
    return response.data;
  }

  async ingestRecognition(payload: Record<string, unknown>) {
    const response = await this.api.post('/events/ingest', payload);
    return response.data;
  }

  async reviewEvent(eventId: string, payload: Record<string, unknown>) {
    const response = await this.api.post(`/events/${eventId}/review`, payload);
    return response.data;
  }
}

export default new FacePlatformClientService();
