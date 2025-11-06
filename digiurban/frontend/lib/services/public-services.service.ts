import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/public-services'

export const publicServicesService = {
  requests: createCRUDService(`${BASE_PATH}/requests`),
  cleaning: createCRUDService(`${BASE_PATH}/cleaning`),
  streetLighting: createCRUDService(`${BASE_PATH}/street-lighting`),
  specialCollection: createCRUDService(`${BASE_PATH}/special-collection`),
  teams: createCRUDService(`${BASE_PATH}/teams`),
  problemsPhotos: createCRUDService(`${BASE_PATH}/problems-photos`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
