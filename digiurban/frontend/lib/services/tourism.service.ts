import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/tourism'

export const tourismService = {
  attractions: createCRUDService(`${BASE_PATH}/attractions`),
  establishments: createCRUDService(`${BASE_PATH}/establishments`),
  events: createCRUDService(`${BASE_PATH}/events`),
  routes: createCRUDService(`${BASE_PATH}/routes`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
