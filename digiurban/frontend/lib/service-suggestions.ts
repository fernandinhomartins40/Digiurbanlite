// Arquivo principal de sugestões de serviços
// IMPORTANTE: As sugestões agora estão organizadas em arquivos modulares em ./suggestions/
// Cada secretaria tem seu próprio arquivo com 50 sugestões completas

export {
  SUGGESTIONS_POOL,
  getSuggestionsForDepartment,
  type ServiceSuggestion,
  type FormFieldSuggestion
} from './suggestions/index';
