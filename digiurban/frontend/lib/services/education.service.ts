import { api, createCRUDService } from './api'

const BASE_PATH = '/api/secretarias/education'

export const educationService = {
  schools: createCRUDService(`${BASE_PATH}/schools`),
  students: createCRUDService(`${BASE_PATH}/students`),
  attendance: createCRUDService(`${BASE_PATH}/attendance`),
  transport: createCRUDService(`${BASE_PATH}/transport`),
  meals: createCRUDService(`${BASE_PATH}/meals`),
  incidents: createCRUDService(`${BASE_PATH}/incidents`),
  events: createCRUDService(`${BASE_PATH}/events`),
  stats: () => api.get(`${BASE_PATH}/stats`),
}
