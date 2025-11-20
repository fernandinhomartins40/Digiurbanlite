'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface MSRecord {
  id: string;
  [key: string]: any;
}

export interface MSListResult<T = MSRecord> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MSFilters {
  search?: string;
  status?: string;
  [key: string]: any;
}

export interface MSHookOptions {
  endpoint: string;
  initialFilters?: MSFilters;
  pageSize?: number;
  autoFetch?: boolean;
}

export interface MSHookReturn<T = MSRecord> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
  filters: MSFilters;
  setFilters: (filters: MSFilters) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Promise<T>;
}

export function useMS<T = MSRecord>({
  endpoint,
  initialFilters = {},
  pageSize: initialPageSize = 20,
  autoFetch = true,
}: MSHookOptions): MSHookReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<MSFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...filters,
      });

      const response = await fetch(`/api${endpoint}?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MSListResult<T> = await response.json();
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, pageSize, filters, toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (newData: Partial<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const created = await response.json();
        toast({
          title: 'Sucesso',
          description: 'Registro criado com sucesso!',
        });
        await refresh();
        return created;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Erro ao criar registro',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, refresh, toast]
  );

  const update = useCallback(
    async (id: string, updateData: Partial<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api${endpoint}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updated = await response.json();
        toast({
          title: 'Sucesso',
          description: 'Registro atualizado com sucesso!',
        });
        await refresh();
        return updated;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Erro ao atualizar registro',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, refresh, toast]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!confirm('Tem certeza que deseja excluir este registro?')) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api${endpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        toast({
          title: 'Sucesso',
          description: 'Registro excluído com sucesso!',
        });
        await refresh();
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Erro ao excluir registro',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, refresh, toast]
  );

  const getById = useCallback(
    async (id: string): Promise<T> => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api${endpoint}/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Erro ao buscar registro',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, toast]
  );

  return {
    data,
    total,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    setFilters,
    setPage,
    refresh,
    create,
    update,
    remove,
    getById,
  };
}
