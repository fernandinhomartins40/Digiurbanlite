import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/culture'

export const cultureService = {
  culturalSpaces: createCRUDService(`${BASE_PATH}/cultural-spaces`),
  events: createCRUDService(`${BASE_PATH}/events`),
  artisticGroups: createCRUDService(`${BASE_PATH}/artistic-groups`),
  workshops: createCRUDService(`${BASE_PATH}/workshops`),
  manifestations: createCRUDService(`${BASE_PATH}/manifestations`),
  projects: createCRUDService(`${BASE_PATH}/projects`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
