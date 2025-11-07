import { useState, useEffect } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  category: string | null;
  estimatedDays: number | null;
}

interface Department {
  id: string;
  name: string;
}

interface Citizen {
  id: string;
  name: string;
  cpf: string;
}

interface ProtocolHistory {
  id: string;
  action: string;
  comment: string | null;
  timestamp: Date;
}

interface Protocol {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  service: Service;
  department: Department;
  citizen: Citizen;
  history: ProtocolHistory[];
  _count: {
    history: number;
    evaluations: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseProtocolsResult {
  protocols: Protocol[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  refetch: () => void;
  stats: {
    total: number;
    pendente: number;
    em_andamento: number;
    concluido: number;
  };
}

interface FetchProtocolsParams {
  status?: string;
  page?: number;
  limit?: number;
  includeFamily?: boolean;
}

export function useCitizenProtocols(params?: FetchProtocolsParams): UseProtocolsResult {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const { citizen, apiRequest } = useCitizenAuth();

  const fetchProtocols = async () => {
    if (!citizen) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== 'todos') {
        queryParams.append('status', params.status.toUpperCase());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.includeFamily) {
        queryParams.append('include_family', 'true');
      }

      // ✅ CORRIGIDO: Usar apiRequest do contexto (httpOnly cookies com tenant correto)
      const data = await apiRequest(
        `/citizen/protocols${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );

      // A API retorna { protocols, pagination } diretamente
      if (data.protocols) {
        setProtocols(data.protocols);
        setPagination(data.pagination);
      } else {
        throw new Error('Erro ao buscar protocolos');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar protocolos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, [citizen, params?.status, params?.page, params?.limit, params?.includeFamily]);

  // Calcular estatísticas baseadas nos protocolos carregados
  const stats = {
    total: protocols.length,
    pendente: protocols.filter(p => p.status === 'VINCULADO').length,
    em_andamento: protocols.filter(p => ['EM_ANDAMENTO', 'AGUARDANDO_DOCUMENTOS'].includes(p.status)).length,
    concluido: protocols.filter(p => p.status === 'CONCLUIDO').length,
  };

  return {
    protocols,
    loading,
    error,
    pagination,
    refetch: fetchProtocols,
    stats,
  };
}
