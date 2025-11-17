import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/security'

export const securityService = {
  occurrences: createCRUDService(`${BASE_PATH}/occurrences`),
  alerts: createCRUDService(`${BASE_PATH}/alerts`),
  patrols: createCRUDService(`${BASE_PATH}/patrols`),
  criticalPoints: createCRUDService(`${BASE_PATH}/critical-points`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
