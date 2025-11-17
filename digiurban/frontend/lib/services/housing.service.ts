import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/housing'

export const housingService = {
  programs: createCRUDService(`${BASE_PATH}/programs`),
  registrations: createCRUDService(`${BASE_PATH}/registrations`),
  units: createCRUDService(`${BASE_PATH}/units`),
  regularization: createCRUDService(`${BASE_PATH}/regularization`),
  attendances: createCRUDService(`${BASE_PATH}/attendances`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
