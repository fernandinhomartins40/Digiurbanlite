import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/public-works'

export const publicWorksService = {
  works: createCRUDService(`${BASE_PATH}/works`),
  inspections: createCRUDService(`${BASE_PATH}/inspections`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
