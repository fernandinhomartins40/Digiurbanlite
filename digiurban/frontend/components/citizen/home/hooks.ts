'use client';

import { useEffect, useState } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

export interface SearchedService {
  id: string;
  name: string;
  description: string | null;
  serviceSubtype?: string | null;
  department?: { id: string; name: string } | null;
}

export interface LifeSituation {
  slug: string;
  title: string;
  description: string;
  serviceIds: string[];
}

export interface SuggestedService {
  id: string;
  name: string;
  department: string | null;
  forTag: string | null;
}

export const isInformationOnly = (subtype?: string | null) =>
  subtype === 'CONSULTA_PUBLICA' || subtype === 'CONSULTA_AUTENTICADA';

/**
 * Busca tolerante do backend (a mesma do DigiBot). `null` = ainda sem resposta
 * ou falhou: a tela usa a busca local como reserva.
 */
export function useServiceSearch(query: string) {
  const { apiRequest } = useCitizenAuth();
  const [results, setResults] = useState<SearchedService[] | null>(null);
  const term = query.trim();

  useEffect(() => {
    setResults(null);
    if (term.length < 2) return;
    let alive = true;
    const timer = setTimeout(() => {
      apiRequest(`/citizen/services/search?q=${encodeURIComponent(term)}`)
        .then((data: any) => alive && setResults(data?.services || []))
        .catch(() => alive && setResults(null));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return results;
}

export function useLifeSituations() {
  const { apiRequest } = useCitizenAuth();
  const [situations, setSituations] = useState<LifeSituation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/citizen/services/situations')
      .then((data: any) => setSituations(data?.situations || []))
      .catch(() => setSituations([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { situations, loading };
}

/** Serviços sugeridos pelas etiquetas do cidadão (GET /citizen/auth/my-tags) */
export function useSuggestedServices() {
  const { apiRequest } = useCitizenAuth();
  const [services, setServices] = useState<SuggestedService[]>([]);

  useEffect(() => {
    apiRequest('/citizen/auth/my-tags')
      .then((data: any) => setServices(data?.data?.services || []))
      .catch(() => setServices([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return services;
}
