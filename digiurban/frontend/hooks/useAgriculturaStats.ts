'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface AgriculturaStats {
  producers: {
    total: number;
    active: number;
    new: number;
    growth: number;
    productionTypes?: Array<{
      type: string;
      count: number;
    }>;
  };
  production: {
    totalArea: number;
    plantedArea: number;
    harvestEstimate: number;
    productivity: number;
  };
  budget: {
    allocated: number;
    used: number;
    available: number;
    projects: number;
    executionRate?: number;
  };
  services: Array<{
    name: string;
    count: number;
    protocols?: number;
  }>;
  monthly: {
    protocols: Array<{ month: string; protocols: number }>;
    producers: Array<{ month: string; producers: number }>;
  };
  protocols?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  properties?: {
    total: number;
    totalArea: number;
    cultivatedArea: number;
  };
  technicalAssistance?: {
    totalActive: number;
    pending: number;
    inProgress: number;
    completedThisMonth: number;
  };
}

export function useAgriculturaStats() {
  const [stats, setStats] = useState<AgriculturaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Buscar estatísticas consolidadas do dashboard
        const dashboardResponse = await apiClient.get('/admin/agriculture/dashboard');

        if (dashboardResponse.data?.success) {
          const data = dashboardResponse.data.data;

          // Buscar estatísticas adicionais em paralelo
          const [producersStatsRes, propertiesStatsRes, agricultureDept] = await Promise.allSettled([
            apiClient.get('/admin/agriculture/producers/stats'),
            apiClient.get('/admin/agriculture/propriedades/stats'),
            apiClient.get('/departments?code=AGRICULTURA')
          ]);

          // Combinar dados
          const consolidatedStats: AgriculturaStats = {
            producers: data.producers || {
              total: 0,
              active: 0,
              new: 0,
              growth: 0
            },
            production: data.production || {
              totalArea: 0,
              plantedArea: 0,
              harvestEstimate: 0,
              productivity: 0
            },
            budget: data.budget || {
              allocated: 0,
              used: 0,
              available: 0,
              projects: 0
            },
            services: data.services || [],
            monthly: data.monthly || {
              protocols: [],
              producers: []
            }
          };

          // Adicionar dados de produtores se disponíveis
          if (producersStatsRes.status === 'fulfilled' && producersStatsRes.value?.data?.success) {
            consolidatedStats.producers = {
              ...consolidatedStats.producers,
              ...producersStatsRes.value.data.data
            };
          }

          // Adicionar dados de propriedades se disponíveis
          if (propertiesStatsRes.status === 'fulfilled' && propertiesStatsRes.value?.data?.success) {
            consolidatedStats.properties = propertiesStatsRes.value.data.data;
          }

          // Calcular estatísticas de protocolos baseado no department de agricultura
          try {
            // Pegar departmentId de agricultura
            let departmentId = null;
            if (agricultureDept.status === 'fulfilled' && agricultureDept.value?.data?.success) {
              const depts = agricultureDept.value.data.data;
              departmentId = depts?.[0]?.id;
            }

            if (departmentId) {
              const protocolsRes = await apiClient.get(
                `/admin/protocolos?departmentId=${departmentId}`
              );

              if (protocolsRes.data?.success && protocolsRes.data?.data) {
                const protocols = protocolsRes.data.data;
                consolidatedStats.protocols = {
                  total: protocols.length,
                  pending: protocols.filter((p: any) => p.status === 'PENDENCIA').length,
                  inProgress: protocols.filter((p: any) => p.status === 'PROGRESSO').length,
                  completed: protocols.filter((p: any) => p.status === 'CONCLUIDO').length
                };
              }
            } else {
              consolidatedStats.protocols = {
                total: 0,
                pending: 0,
                inProgress: 0,
                completed: 0
              };
            }
          } catch (e) {
            // Se falhar, usar valores padrão
            consolidatedStats.protocols = {
              total: 0,
              pending: 0,
              inProgress: 0,
              completed: 0
            };
          }

          // Adicionar estatísticas de assistência técnica (mock por enquanto)
          consolidatedStats.technicalAssistance = {
            totalActive: 0,
            pending: 0,
            inProgress: 0,
            completedThisMonth: 0
          };

          setStats(consolidatedStats);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching agricultura stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
