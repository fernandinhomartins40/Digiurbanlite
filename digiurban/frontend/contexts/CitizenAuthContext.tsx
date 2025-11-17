'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Address } from '@/shared/types/address.types';

interface TenantInfo {
  id: string;
  name: string;
  nomeMunicipio?: string | null;
  ufMunicipio?: string | null;
  codigoIbge?: string | null;
  status: string;
}

/**
 * Interface do Cidadão - Alinhada com o schema do Prisma
 * IMPORTANTE: address usa o tipo Address padronizado (nomenclatura em português)
 */
interface Citizen {
  id: string;
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  phoneSecondary?: string;
  birthDate?: string;
  rg?: string;
  motherName?: string;
  maritalStatus?: string;
  occupation?: string;
  familyIncome?: string;
  address?: Address; // ✅ Tipo padronizado: cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia
  isActive: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED';
  createdAt: string;
  lastLogin?: string;
  protocols?: any[];
  familyAsHead?: any[];
  notifications?: any[];
  tenant?: TenantInfo;
}

/**
 * Interface para atualização de perfil
 * IMPORTANTE: address usa o tipo Address padronizado (nomenclatura em português)
 */
interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  phoneSecondary?: string;
  birthDate?: string;
  rg?: string;
  motherName?: string;
  maritalStatus?: string;
  occupation?: string;
  familyIncome?: string;
  address?: Address; // ✅ Tipo padronizado
}

interface CitizenAuthContextType {
  citizen: Citizen | null;
  tenantId: string | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  login: (cpfOrEmail: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCitizenData: () => Promise<boolean>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; message?: string }>;
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>;
}

/**
 * Interface para registro de cidadão
 * IMPORTANTE: address usa o tipo Address padronizado (nomenclatura em português)
 */
interface RegisterData {
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  address?: Address; // ✅ Tipo padronizado
}

const CitizenAuthContext = createContext<CitizenAuthContextType | null>(null);

export function CitizenAuthProvider({ children }: { children: React.ReactNode }) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar autenticação ao carregar (via cookie httpOnly)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ CORRIGIDO: Não tentamos mais ler httpOnly cookie
        // Backend gerencia tenantId automaticamente via JWT
        await fetchCitizenData();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ SEGURANÇA: Função para fazer requisições autenticadas (usa cookies automáticos)
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      // ✅ CORRIGIDO: Não precisa enviar X-Tenant-ID - backend extrai do JWT cookie
      ...(tenantId && { 'X-Tenant-ID': tenantId }), // Opcional: apenas se tenantId já estiver em state
      ...options.headers
    };

    const { getFullApiUrl } = await import('@/lib/api-config');
    const cleanEndpoint = endpoint.replace(/^\/api/, '');
    const url = getFullApiUrl(cleanEndpoint);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // ✅ CRÍTICO: Enviar cookies automaticamente
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));

      // Se 401, token inválido ou expirado
      if (response.status === 401) {
        console.log('[CitizenAuth] Token inválido ou expirado, limpando autenticação...');
        setTenantId(null);
        setTenant(null);
        setCitizen(null);

        // Redirecionar para login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/cidadao/login';
          }, 100);
        }
        throw new Error('Token expirado');
      }

      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  const fetchCitizenData = async () => {
    try {
      console.log('🔍 [CitizenAuth] Buscando dados do cidadão...');
      const data = await apiRequest('/auth/citizen/me');

      console.log('✅ [CitizenAuth] Dados do cidadão recebidos:', {
        name: data.citizen?.name,
        email: data.citizen?.email,
        hasAddress: !!data.citizen?.address,
        hasPhone: !!data.citizen?.phone,
        tenantId: data.tenantId
      });

      setCitizen(data.citizen);

      // ✅ Armazenar tenantId e tenant completo se vierem do backend
      if (data.tenantId) {
        setTenantId(data.tenantId);
      }
      if (data.tenant) {
        setTenant(data.tenant);
      }

      return true;
    } catch (error) {
      console.error('❌ [CitizenAuth] Erro ao buscar dados do cidadão:', error);
      // ✅ CORRIGIDO: Não fazer logout se estiver na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        await logout();
      }
      return false;
    }
  };

  const login = async (cpfOrEmail: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { getFullApiUrl } = await import('@/lib/api-config');

      // ✅ LOGIN INTELIGENTE: backend identifica automaticamente o tenant do cidadão
      const response = await fetch(getFullApiUrl('/auth/citizen/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NÃO enviar X-Tenant-ID - backend identifica automaticamente
        },
        credentials: 'include', // ✅ CRÍTICO: Receber cookies
        body: JSON.stringify({
          login: cpfOrEmail,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();

        // ✅ SEGURANÇA: Token agora vem em cookie httpOnly, não em JSON
        setCitizen(data.citizen);

        // ✅ Backend retorna tenantId no response
        if (data.tenantId) {
          setTenantId(data.tenantId);
        }

        return true;
      } else {
        const errorData = await response.json();
        console.error('Erro no login:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { getFullApiUrl } = await import('@/lib/api-config');

      const response = await fetch(getFullApiUrl('/auth/citizen/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NÃO enviar X-Tenant-ID - será determinado pelo município selecionado
        },
        credentials: 'include', // ✅ CRÍTICO: Receber cookies
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const responseData = await response.json();

        // ✅ SEGURANÇA: Token agora vem em cookie httpOnly, não em JSON
        setCitizen(responseData.data?.citizen || responseData.citizen);

        // ✅ Backend retorna tenantId no response
        if (responseData.tenantId) {
          setTenantId(responseData.tenantId);
        }

        return true;
      } else {
        const errorData = await response.json();
        console.error('Erro no cadastro:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { getFullApiUrl } = await import('@/lib/api-config');

      // ✅ SEGURANÇA: Chamar endpoint de logout para limpar cookie httpOnly
      await fetch(getFullApiUrl('/auth/citizen/logout'), {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignorar erro - vamos limpar localmente de qualquer forma
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setTenantId(null);
      setTenant(null);
      setCitizen(null);
      router.push('/cidadao/login');
    }
  };

  const refreshCitizenData = async (): Promise<boolean> => {
    return await fetchCitizenData();
  };

  const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);

      const response = await apiRequest('/auth/citizen/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success) {
        // Atualizar dados do cidadão no state
        setCitizen(response.citizen);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.error || 'Erro ao atualizar perfil' };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar perfil. Tente novamente.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value: CitizenAuthContextType = {
    citizen,
    tenantId,
    tenant,
    isLoading,
    login,
    register,
    logout,
    refreshCitizenData,
    updateProfile,
    apiRequest
  };

  return (
    <CitizenAuthContext.Provider value={value}>
      {children}
    </CitizenAuthContext.Provider>
  );
}

export function useCitizenAuth() {
  const context = useContext(CitizenAuthContext);
  if (!context) {
    throw new Error('useCitizenAuth deve ser usado dentro de CitizenAuthProvider');
  }
  return context;
}

// Hook para proteger rotas
export function useCitizenProtectedRoute() {
  const { citizen, isLoading } = useCitizenAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !citizen) {
      router.push('/cidadao/login');
    }
  }, [citizen, isLoading, router]);

  return { citizen, isLoading };
}