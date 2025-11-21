import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAgriculturaApi() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiCall = useCallback(
    async (
      endpoint: string,
      options?: RequestInit & UseApiOptions
    ) => {
      setLoading(true);
      setError(null);

      try {
        const { onSuccess, onError, ...fetchOptions } = options || {};

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro na requisição');
        }

        const data = await response.json();

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options?.onError) {
          options.onError(error);
        } else {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          });
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { apiCall, loading, error };
}

// Hook específico para Produtores Rurais
export function useProdutores() {
  const { apiCall, loading, error } = useAgriculturaApi();

  const listProdutores = useCallback(
    (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiCall(`/agricultura/produtores?${params}`);
    },
    [apiCall]
  );

  const getProdutorById = useCallback(
    (id: string) => apiCall(`/agricultura/produtores/${id}`),
    [apiCall]
  );

  const createProdutor = useCallback(
    (data: any) =>
      apiCall('/agricultura/produtores', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const updateProdutor = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/produtores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const deleteProdutor = useCallback(
    (id: string) =>
      apiCall(`/agricultura/produtores/${id}`, {
        method: 'DELETE',
      }),
    [apiCall]
  );

  const getStatistics = useCallback(
    () => apiCall('/agricultura/produtores/statistics'),
    [apiCall]
  );

  const emitirCarteirinha = useCallback(
    (id: string) =>
      apiCall(`/agricultura/produtores/${id}/carteirinha`, {
        method: 'POST',
      }),
    [apiCall]
  );

  const uploadFoto = useCallback(
    (id: string, fotoUrl: string) =>
      apiCall(`/agricultura/produtores/${id}/foto`, {
        method: 'POST',
        body: JSON.stringify({ fotoUrl }),
      }),
    [apiCall]
  );

  return {
    listProdutores,
    getProdutorById,
    createProdutor,
    updateProdutor,
    deleteProdutor,
    getStatistics,
    emitirCarteirinha,
    uploadFoto,
    loading,
    error,
  };
}

// Hook específico para Propriedades Rurais
export function usePropriedades() {
  const { apiCall, loading, error } = useAgriculturaApi();

  const listPropriedades = useCallback(
    (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiCall(`/agricultura/propriedades?${params}`);
    },
    [apiCall]
  );

  const getPropriedadeById = useCallback(
    (id: string) => apiCall(`/agricultura/propriedades/${id}`),
    [apiCall]
  );

  const createPropriedade = useCallback(
    (data: any) =>
      apiCall('/agricultura/propriedades', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const updatePropriedade = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/propriedades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const getStatistics = useCallback(
    () => apiCall('/agricultura/propriedades/statistics'),
    [apiCall]
  );

  const addFoto = useCallback(
    (id: string, foto: any) =>
      apiCall(`/agricultura/propriedades/${id}/fotos`, {
        method: 'POST',
        body: JSON.stringify(foto),
      }),
    [apiCall]
  );

  return {
    listPropriedades,
    getPropriedadeById,
    createPropriedade,
    updatePropriedade,
    getStatistics,
    addFoto,
    loading,
    error,
  };
}

// Hook específico para Sementes e Mudas
export function useSementes() {
  const { apiCall, loading, error } = useAgriculturaApi();

  const listEstoque = useCallback(
    () => apiCall('/agricultura/estoque-sementes'),
    [apiCall]
  );

  const getEstoqueById = useCallback(
    (id: string) => apiCall(`/agricultura/estoque-sementes/${id}`),
    [apiCall]
  );

  const createEstoque = useCallback(
    (data: any) =>
      apiCall('/agricultura/estoque-sementes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const updateEstoque = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/estoque-sementes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const getEstoqueBaixo = useCallback(
    () => apiCall('/agricultura/estoque-sementes/baixo'),
    [apiCall]
  );

  const getEstoqueStatistics = useCallback(
    () => apiCall('/agricultura/estoque-sementes/statistics'),
    [apiCall]
  );

  const createDistribuicao = useCallback(
    (data: any) =>
      apiCall('/agricultura/distribuicoes-sementes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const listDistribuicoes = useCallback(
    (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiCall(`/agricultura/distribuicoes-sementes?${params}`);
    },
    [apiCall]
  );

  const getDistribuicaoStatistics = useCallback(
    (ano?: number) => {
      const params = ano ? `?ano=${ano}` : '';
      return apiCall(`/agricultura/distribuicoes-sementes/statistics${params}`);
    },
    [apiCall]
  );

  return {
    listEstoque,
    getEstoqueById,
    createEstoque,
    updateEstoque,
    getEstoqueBaixo,
    getEstoqueStatistics,
    createDistribuicao,
    listDistribuicoes,
    getDistribuicaoStatistics,
    loading,
    error,
  };
}

// Hook específico para Assistência Técnica
export function useAssistenciaTecnica() {
  const { apiCall, loading, error } = useAgriculturaApi();

  const listTecnicos = useCallback(
    () => apiCall('/agricultura/tecnicos'),
    [apiCall]
  );

  const getTecnicoById = useCallback(
    (id: string) => apiCall(`/agricultura/tecnicos/${id}`),
    [apiCall]
  );

  const createTecnico = useCallback(
    (data: any) =>
      apiCall('/agricultura/tecnicos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const listSolicitacoes = useCallback(
    (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiCall(`/agricultura/solicitacoes-assistencia?${params}`);
    },
    [apiCall]
  );

  const createSolicitacao = useCallback(
    (data: any) =>
      apiCall('/agricultura/solicitacoes-assistencia', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const getSolicitacaoById = useCallback(
    (id: string) => apiCall(`/agricultura/solicitacoes-assistencia/${id}`),
    [apiCall]
  );

  const updateSolicitacao = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/solicitacoes-assistencia/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const createVisita = useCallback(
    (data: any) =>
      apiCall('/agricultura/visitas-assistencia', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const getVisitaById = useCallback(
    (id: string) => apiCall(`/agricultura/visitas-assistencia/${id}`),
    [apiCall]
  );

  const updateVisita = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/visitas-assistencia/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const confirmarVisita = useCallback(
    (id: string) =>
      apiCall(`/agricultura/visitas-assistencia/${id}/confirmar`, {
        method: 'PATCH',
      }),
    [apiCall]
  );

  const iniciarVisita = useCallback(
    (id: string) =>
      apiCall(`/agricultura/visitas-assistencia/${id}/iniciar`, {
        method: 'PATCH',
      }),
    [apiCall]
  );

  const concluirVisita = useCallback(
    (id: string, data: any) =>
      apiCall(`/agricultura/visitas-assistencia/${id}/concluir`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    [apiCall]
  );

  const getStatistics = useCallback(
    (ano?: number) => {
      const params = ano ? `?ano=${ano}` : '';
      return apiCall(`/agricultura/solicitacoes-assistencia/statistics${params}`);
    },
    [apiCall]
  );

  return {
    listTecnicos,
    getTecnicoById,
    createTecnico,
    listSolicitacoes,
    createSolicitacao,
    getSolicitacaoById,
    updateSolicitacao,
    createVisita,
    getVisitaById,
    updateVisita,
    confirmarVisita,
    iniciarVisita,
    concluirVisita,
    getStatistics,
    loading,
    error,
  };
}
