import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/sports'

export const sportsService = {
  teams: createCRUDService(`${BASE_PATH}/teams`),
  athletes: createCRUDService(`${BASE_PATH}/athletes`),
  competitions: createCRUDService(`${BASE_PATH}/competitions`),
  events: createCRUDService(`${BASE_PATH}/events`),
  infrastructure: createCRUDService(`${BASE_PATH}/infrastructure`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
