import { api } from '@/lib/services/api';

export const facePlatformService = {
  getDashboard: async () => {
    const response = await api.get('/admin/face-platform/dashboard');
    return response.data;
  },

  listSchools: async () => {
    const response = await api.get('/admin/face-platform/schools');
    return response.data;
  },

  listSchoolStudents: async (schoolId: string) => {
    const response = await api.get(`/admin/face-platform/schools/${schoolId}/students`);
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

  listIdentities: async () => {
    const response = await api.get('/admin/face-platform/identities');
    return response.data;
  },

  createEnrollment: async (payload: any) => {
    const response = await api.post('/admin/face-platform/identities/enrollments', payload);
    return response.data;
  },

  listEvents: async (params?: Record<string, string | number | undefined>) => {
    const response = await api.get('/admin/face-platform/events', { params });
    return response.data;
  },

  ingestEvent: async (payload: any) => {
    const response = await api.post('/admin/face-platform/events/ingest', payload);
    return response.data;
  },

  reviewEvent: async (eventId: string, decision: 'approve' | 'reject') => {
    const response = await api.post(`/admin/face-platform/events/${eventId}/review`, { decision });
    return response.data;
  },
};

export default facePlatformService;
