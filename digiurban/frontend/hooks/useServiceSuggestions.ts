import { useMemo } from 'react';
import { getSuggestionsForDepartment, ServiceSuggestion } from '@/lib/service-suggestions';
import { useSecretariaServices } from './useSecretariaServices';

interface UseServiceSuggestionsResult {
  suggestions: ServiceSuggestion[];
  displayedSuggestions: ServiceSuggestion[];
  hasMore: boolean;
  totalAvailable: number;
  isLoading: boolean;
}

/**
 * Hook para obter sugestões inteligentes de serviços
 * Filtra sugestões que ainda não foram criadas
 * Mostra apenas 2 sugestões por vez
 */
export function useServiceSuggestions(departmentCode: string): UseServiceSuggestionsResult {
  const { services, isLoading } = useSecretariaServices(departmentCode);

  const result = useMemo(() => {
    // Obter todas as sugestões disponíveis para esta secretaria
    const allSuggestions = getSuggestionsForDepartment(departmentCode);

    // Filtrar sugestões que ainda não foram criadas
    // Compara nome da sugestão com nomes de serviços existentes (case-insensitive, parcial)
    const availableSuggestions = allSuggestions.filter(suggestion => {
      const suggestionNameLower = suggestion.name.toLowerCase();

      // Verifica se já existe um serviço COM_DADOS com nome similar
      const alreadyExists = services.some(service => {
        if (service.serviceType !== 'COM_DADOS') return false;

        const serviceNameLower = service.name.toLowerCase();

        // Considera como "já existe" se:
        // 1. Os nomes são exatamente iguais
        // 2. O nome do serviço contém o nome da sugestão (ou vice-versa)
        // 3. As primeiras 15 letras são iguais (para variações pequenas)

        if (serviceNameLower === suggestionNameLower) return true;

        if (serviceNameLower.includes(suggestionNameLower) ||
            suggestionNameLower.includes(serviceNameLower)) return true;

        const suggestionStart = suggestionNameLower.slice(0, 15);
        const serviceStart = serviceNameLower.slice(0, 15);
        if (suggestionStart === serviceStart && suggestionStart.length >= 10) return true;

        return false;
      });

      return !alreadyExists;
    });

    // Mostrar apenas as 2 primeiras sugestões
    const displayedSuggestions = availableSuggestions.slice(0, 2);

    return {
      suggestions: availableSuggestions,
      displayedSuggestions,
      hasMore: availableSuggestions.length > 2,
      totalAvailable: availableSuggestions.length,
      isLoading,
    };
  }, [departmentCode, services, isLoading]);

  return result;
}
