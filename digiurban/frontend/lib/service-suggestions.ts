// Tipos das sugestões de serviços. As sugestões em si vêm do servidor
// (GET /api/services/suggestions), junto com o catálogo da plataforma — um
// lugar só (antes eram ~23 mil linhas aqui no frontend, separadas do catálogo).
export {
  type ServiceSuggestion,
  type FormFieldSuggestion,
  ServiceSubtype,
  ServiceType,
} from './suggestions/types';
