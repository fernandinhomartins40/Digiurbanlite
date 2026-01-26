// Arquivo central que reúne todas as sugestões de serviços
import { ServiceSuggestion } from './types';
import { administracaoSuggestions } from './administracao';
import { agriculturaSuggestions } from './agricultura';
import { assistenciasocialSuggestions } from './assistencia-social';
import { culturaSuggestions } from './cultura';
import { defesaCivilSuggestions } from './defesa-civil';
import { desenvolvimentoEconomicoSuggestions } from './desenvolvimento-economico';
import { educacaoSuggestions } from './educacao';
import { esportesSuggestions } from './esportes';
import { financasSuggestions } from './financas';
import { habitacaoSuggestions } from './habitacao';
import { meioambienteSuggestions } from './meio-ambiente';
import { mobilidadeUrbanaSuggestions } from './mobilidade-urbana';
import { obraspublicasSuggestions } from './obras-publicas';
import { planejamentourbanoSuggestions } from './planejamento-urbano';
import { politicasMulheresSuggestions } from './politicas-mulheres';
import { saudeSuggestions } from './saude';
import { segurancapublicaSuggestions } from './seguranca-publica';
import { servicospublicosSuggestions } from './servicos-publicos';
import { tecnologiaInovacaoSuggestions } from './tecnologia-inovacao';
import { transporteTransitoSuggestions } from './transporte-transito';
import { turismoSuggestions } from './turismo';

export const SUGGESTIONS_POOL: Record<string, ServiceSuggestion[]> = {
  'administracao': administracaoSuggestions,
  'agricultura': agriculturaSuggestions,
  'assistencia-social': assistenciasocialSuggestions,
  'cultura': culturaSuggestions,
  'defesa-civil': defesaCivilSuggestions,
  'desenvolvimento-economico': desenvolvimentoEconomicoSuggestions,
  'educacao': educacaoSuggestions,
  'esportes': esportesSuggestions,
  'financas': financasSuggestions,
  'habitacao': habitacaoSuggestions,
  'meio-ambiente': meioambienteSuggestions,
  'mobilidade-urbana': mobilidadeUrbanaSuggestions,
  'obras-publicas': obraspublicasSuggestions,
  'planejamento-urbano': planejamentourbanoSuggestions,
  'politicas-mulheres': politicasMulheresSuggestions,
  'saude': saudeSuggestions,
  'seguranca-publica': segurancapublicaSuggestions,
  'servicos-publicos': servicospublicosSuggestions,
  'tecnologia-inovacao': tecnologiaInovacaoSuggestions,
  'transporte-transito': transporteTransitoSuggestions,
  'turismo': turismoSuggestions,
};

export function getSuggestionsForDepartment(departmentCode: string): ServiceSuggestion[] {
  return SUGGESTIONS_POOL[departmentCode] || [];
}

export * from './types';
