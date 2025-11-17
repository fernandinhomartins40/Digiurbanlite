// Arquivo central que reúne todas as sugestões de serviços
import { ServiceSuggestion } from './types';
import { agriculturaSuggestions } from './agricultura';
import { assistenciasocialSuggestions } from './assistencia-social';
import { culturaSuggestions } from './cultura';
import { educacaoSuggestions } from './educacao';
import { esportesSuggestions } from './esportes';
import { habitacaoSuggestions } from './habitacao';
import { meioambienteSuggestions } from './meio-ambiente';
import { obraspublicasSuggestions } from './obras-publicas';
import { planejamentourbanoSuggestions } from './planejamento-urbano';
import { saudeSuggestions } from './saude';
import { segurancapublicaSuggestions } from './seguranca-publica';
import { servicospublicosSuggestions } from './servicos-publicos';
import { turismoSuggestions } from './turismo';

export const SUGGESTIONS_POOL: Record<string, ServiceSuggestion[]> = {
  'agricultura': agriculturaSuggestions,
  'assistencia-social': assistenciasocialSuggestions,
  'cultura': culturaSuggestions,
  'educacao': educacaoSuggestions,
  'esportes': esportesSuggestions,
  'habitacao': habitacaoSuggestions,
  'meio-ambiente': meioambienteSuggestions,
  'obras-publicas': obraspublicasSuggestions,
  'planejamento-urbano': planejamentourbanoSuggestions,
  'saude': saudeSuggestions,
  'seguranca-publica': segurancapublicaSuggestions,
  'servicos-publicos': servicospublicosSuggestions,
  'turismo': turismoSuggestions,
};

export function getSuggestionsForDepartment(departmentCode: string): ServiceSuggestion[] {
  return SUGGESTIONS_POOL[departmentCode] || [];
}

export * from './types';
