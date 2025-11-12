import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/health'

export const healthService = {
  specialties: createCRUDService(`${BASE_PATH}/specialties`),
  professionals: createCRUDService(`${BASE_PATH}/professionals`),
  appointments: createCRUDService(`${BASE_PATH}/appointments`),
  medications: createCRUDService(`${BASE_PATH}/medications`),
  vaccinationCampaigns: createCRUDService(`${BASE_PATH}/vaccination-campaigns`),
  vaccinations: createCRUDService(`${BASE_PATH}/vaccinations`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
