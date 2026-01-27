import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES
// ============================================================================

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  moduleType: string;
  departmentCode: string;
  createdAt: string;
}

interface CategorySuggestion {
  id: string;
  serviceId: string;
  categoryId: string;
  matchType: string; // 'EXACT', 'PATTERN', 'SEMANTIC', 'MANUAL'
  confidence: number; // 0-100
  matchDetails: any;
  status: string; // 'PENDING', 'APPROVED', 'REJECTED', 'AUTO_ASSIGNED'
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  service: Service;
  category: Category;
}

interface SuggestionStats {
  pending: number;
  approved: number;
  rejected: number;
  autoAssigned: number;
  total: number;
  byDepartment: Array<{
    departmentCode: string;
    total: number;
    pending: number;
  }>;
}

interface ServiceSuggestions {
  service: Service;
  pending: CategorySuggestion[];
  autoAssigned: Array<{
    id: string;
    serviceId: string;
    categoryId: string;
    assignmentType: string;
    confidence: number;
    active: boolean;
    category: Category;
  }>;
  stats: {
    pendingCount: number;
    autoAssignedCount: number;
    totalCategories: number;
  };
}

interface UseCategorySuggestionsResult {
  suggestions: CategorySuggestion[];
  loading: boolean;
  error: string | null;
  stats: SuggestionStats | null;
  refetch: () => void;
  approveSuggestion: (id: string, notes?: string) => Promise<void>;
  rejectSuggestion: (id: string, reason?: string) => Promise<void>;
  approveMultiple: (ids: string[]) => Promise<void>;
  getServiceSuggestions: (serviceId: string) => Promise<ServiceSuggestions | null>;
  analyzeService: (serviceId: string) => Promise<void>;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

interface UseCategorySuggestionsParams {
  departmentCode?: string;
  serviceId?: string;
  categoryId?: string;
  minConfidence?: number;
  autoRefresh?: boolean; // Refresh automático a cada X segundos
  refreshInterval?: number; // Intervalo em ms (padrão: 30000 = 30s)
}

export function useCategorySuggestions(
  params?: UseCategorySuggestionsParams
): UseCategorySuggestionsResult {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [stats, setStats] = useState<SuggestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, apiRequest } = useAdminAuth();

  // ========================================================================
  // FETCH: Buscar sugestões pendentes
  // ========================================================================
  const fetchSuggestions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.departmentCode) {
        queryParams.append('departmentCode', params.departmentCode);
      }
      if (params?.serviceId) {
        queryParams.append('serviceId', params.serviceId);
      }
      if (params?.categoryId) {
        queryParams.append('categoryId', params.categoryId);
      }
      if (params?.minConfidence) {
        queryParams.append('minConfidence', params.minConfidence.toString());
      }

      const data = await apiRequest(
        `/category-suggestions/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );

      if (data.success) {
        setSuggestions(data.suggestions || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar sugestões');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar sugestões';
      setError(errorMessage);
      console.error('[useCategorySuggestions] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [user, params?.departmentCode, params?.serviceId, params?.categoryId, params?.minConfidence, apiRequest]);

  // ========================================================================
  // FETCH: Buscar estatísticas
  // ========================================================================
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const data = await apiRequest('/category-suggestions/stats');

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('[useCategorySuggestions] Erro ao buscar stats:', err);
    }
  }, [user, apiRequest]);

  // ========================================================================
  // ACTION: Aprovar sugestão
  // ========================================================================
  const approveSuggestion = async (id: string, notes?: string) => {
    try {
      const data = await apiRequest(`/category-suggestions/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });

      if (data.success) {
        toast.success(data.message || 'Sugestão aprovada com sucesso');

        // Atualizar lista local removendo a sugestão aprovada
        setSuggestions((prev) => prev.filter((s) => s.id !== id));

        // Atualizar stats
        await fetchStats();
      } else {
        throw new Error(data.message || 'Erro ao aprovar sugestão');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao aprovar sugestão';
      toast.error(errorMessage);
      throw err;
    }
  };

  // ========================================================================
  // ACTION: Rejeitar sugestão
  // ========================================================================
  const rejectSuggestion = async (id: string, reason?: string) => {
    try {
      const data = await apiRequest(`/category-suggestions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (data.success) {
        toast.success(data.message || 'Sugestão rejeitada');

        // Atualizar lista local removendo a sugestão rejeitada
        setSuggestions((prev) => prev.filter((s) => s.id !== id));

        // Atualizar stats
        await fetchStats();
      } else {
        throw new Error(data.message || 'Erro ao rejeitar sugestão');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao rejeitar sugestão';
      toast.error(errorMessage);
      throw err;
    }
  };

  // ========================================================================
  // ACTION: Aprovar múltiplas sugestões
  // ========================================================================
  const approveMultiple = async (suggestionIds: string[]) => {
    try {
      const data = await apiRequest('/category-suggestions/approve-multiple', {
        method: 'POST',
        body: JSON.stringify({ suggestionIds }),
      });

      if (data.success) {
        toast.success(data.message || `${data.results.approved} sugestões aprovadas`);

        // Atualizar lista local removendo sugestões aprovadas
        setSuggestions((prev) => prev.filter((s) => !suggestionIds.includes(s.id)));

        // Atualizar stats
        await fetchStats();
      } else {
        throw new Error(data.message || 'Erro ao aprovar sugestões');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao aprovar sugestões';
      toast.error(errorMessage);
      throw err;
    }
  };

  // ========================================================================
  // FETCH: Buscar sugestões de um serviço específico
  // ========================================================================
  const getServiceSuggestions = async (serviceId: string): Promise<ServiceSuggestions | null> => {
    try {
      const data = await apiRequest(`/category-suggestions/service/${serviceId}`);

      if (data.success) {
        return {
          service: data.service,
          pending: data.pending || [],
          autoAssigned: data.autoAssigned || [],
          stats: data.stats,
        };
      } else {
        throw new Error(data.message || 'Erro ao buscar sugestões do serviço');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar sugestões do serviço';
      toast.error(errorMessage);
      return null;
    }
  };

  // ========================================================================
  // ACTION: Re-analisar serviço manualmente
  // ========================================================================
  const analyzeService = async (serviceId: string) => {
    try {
      const data = await apiRequest(`/category-suggestions/analyze-service/${serviceId}`, {
        method: 'POST',
      });

      if (data.success) {
        toast.success(data.message || 'Análise concluída');

        // Recarregar sugestões
        await fetchSuggestions();
        await fetchStats();
      } else {
        throw new Error(data.message || 'Erro ao analisar serviço');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao analisar serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  // ========================================================================
  // EFFECT: Carregar dados iniciais
  // ========================================================================
  useEffect(() => {
    fetchSuggestions();
    fetchStats();
  }, [fetchSuggestions, fetchStats]);

  // ========================================================================
  // EFFECT: Auto-refresh
  // ========================================================================
  useEffect(() => {
    if (!params?.autoRefresh) return;

    const interval = params.refreshInterval || 30000; // Padrão: 30s

    const timer = setInterval(() => {
      fetchSuggestions();
      fetchStats();
    }, interval);

    return () => clearInterval(timer);
  }, [params?.autoRefresh, params?.refreshInterval, fetchSuggestions, fetchStats]);

  // ========================================================================
  // RETURN
  // ========================================================================
  return {
    suggestions,
    loading,
    error,
    stats,
    refetch: fetchSuggestions,
    approveSuggestion,
    rejectSuggestion,
    approveMultiple,
    getServiceSuggestions,
    analyzeService,
  };
}
