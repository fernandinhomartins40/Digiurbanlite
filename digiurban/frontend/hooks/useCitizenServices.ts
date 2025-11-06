import { useState, useEffect } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface CitizenService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  departmentId: string;
  department?: Department;
  requiresDocuments: boolean;
  requiredDocuments: string[] | null;
  estimatedDays: number | null;
  priority: number;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseCitizenServicesResult {
  services: CitizenService[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCitizenServices(): UseCitizenServicesResult {
  const [services, setServices] = useState<CitizenService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiRequest } = useCitizenAuth();

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORRIGIDO: Usar apiRequest do contexto (httpOnly cookies com tenant correto)
      const response = await apiRequest('/citizen/services');

      setServices(response.services || []);
    } catch (err: any) {
      console.error('Erro ao buscar serviços:', err);
      setError(err.message || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
  };
}
