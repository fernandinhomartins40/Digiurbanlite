import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/environment'

export const environmentService = {
  licenses: createCRUDService(`${BASE_PATH}/licenses`),
  complaints: createCRUDService(`${BASE_PATH}/complaints`),
  inspections: createCRUDService(`${BASE_PATH}/inspections`),
  protectedAreas: createCRUDService(`${BASE_PATH}/protected-areas`),
  programs: createCRUDService(`${BASE_PATH}/programs`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
