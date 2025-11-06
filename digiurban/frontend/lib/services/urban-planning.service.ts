import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/urban-planning'

export const urbanPlanningService = {
  urbanProjects: createCRUDService(`${BASE_PATH}/urban-projects`),
  permits: createCRUDService(`${BASE_PATH}/permits`),
  complaints: createCRUDService(`${BASE_PATH}/complaints`),
  publicConsultations: createCRUDService(`${BASE_PATH}/public-consultations`),
  zoning: createCRUDService(`${BASE_PATH}/zoning`),
  projectAnalysis: createCRUDService(`${BASE_PATH}/project-analysis`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
