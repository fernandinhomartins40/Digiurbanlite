import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/social-assistance'

export const socialAssistanceService = {
  families: createCRUDService(`${BASE_PATH}/families`),
  benefitRequests: createCRUDService(`${BASE_PATH}/benefit-requests`),
  emergencyDeliveries: createCRUDService(`${BASE_PATH}/emergency-deliveries`),
  homeVisits: createCRUDService(`${BASE_PATH}/home-visits`),
  socialPrograms: createCRUDService(`${BASE_PATH}/social-programs`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
