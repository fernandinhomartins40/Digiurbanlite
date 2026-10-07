import { useEffect, useState } from 'react';
import type { ServiceSuggestion } from '@/lib/service-suggestions';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface UseServiceSuggestionsResult {
  suggestions: ServiceSuggestion[];
  displayedSuggestions: ServiceSuggestion[];
  hasMore: boolean;
  totalAvailable: number;
  isLoading: boolean;
}

/**
 * Sugestões de serviços da secretaria que o município ainda não tem.
 * Vêm do servidor, que compara com todos os serviços do município (inclusive
 * desativados) e com o catálogo da plataforma.
 */
export function useServiceSuggestions(departmentSlug: string): UseServiceSuggestionsResult {
  const { apiRequest } = useAdminAuth();
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiRequest(`/api/services/suggestions?department=${encodeURIComponent(departmentSlug)}`)
      .then((response: any) => {
        if (!cancelled) setSuggestions(response?.data?.suggestions || []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentSlug]);

  const displayedSuggestions = suggestions.slice(0, 2);
  return {
    suggestions,
    displayedSuggestions,
    hasMore: suggestions.length > displayedSuggestions.length,
    totalAvailable: suggestions.length,
    isLoading,
  };
}
