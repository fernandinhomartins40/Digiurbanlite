import { useState, useEffect } from 'react';

/**
 * Hook para buscar enums dinâmicos de APPs internos
 *
 * @param appName Nome do APP (ex: 'tfd', 'cras', etc)
 * @param entity Entidade a buscar (ex: 'especialidades', 'veiculos', 'motoristas')
 * @param filters Filtros opcionais para a busca
 *
 * @example
 * // Buscar especialidades ativas do APP TFD
 * const { data: especialidades, loading } = useAppEnums('tfd', 'especialidades');
 *
 * @example
 * // Buscar veículos disponíveis do APP TFD
 * const { data: veiculos, loading } = useAppEnums('tfd', 'veiculos', { status: 'DISPONIVEL' });
 */
export function useAppEnums<T = any>(
  appName: string,
  entity: string,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/${appName}/enums/${entity}`;

        if (filters && Object.keys(filters).length > 0) {
          const params = new URLSearchParams();
          params.append('filters', JSON.stringify(filters));
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erro ao buscar ${entity}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(`Erro ao buscar ${entity} do APP ${appName}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (appName && entity) {
      fetchData();
    }
  }, [appName, entity, JSON.stringify(filters)]);

  return { data, loading, error };
}

/**
 * Hook específico para TFD - Especialidades
 */
export function useTFDEspecialidades() {
  return useAppEnums('tfd', 'especialidades');
}

/**
 * Hook específico para TFD - Veículos
 */
export function useTFDVeiculos(filters?: { status?: string }) {
  return useAppEnums('tfd', 'veiculos', filters);
}

/**
 * Hook específico para TFD - Motoristas
 */
export function useTFDMotoristas(filters?: { status?: string }) {
  return useAppEnums('tfd', 'motoristas', filters);
}

/**
 * Hook específico para TFD - Destinos
 */
export function useTFDDestinos() {
  return useAppEnums('tfd', 'destinos');
}
