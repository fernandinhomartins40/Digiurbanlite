/**
 * Configuração centralizada da API
 *
 * Em desenvolvimento: usa NEXT_PUBLIC_API_URL (http://localhost:3001)
 * Em produção: usa /api (roteado pelo Nginx para backend:3001)
 */

export const getApiUrl = (): string => {
  // Em produção no browser, usar caminho relativo /api
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // No servidor (SSR), usar URL completa
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

/**
 * Constrói URL completa da API
 * @param endpoint - Endpoint da API (com ou sem /api)
 */
export const getFullApiUrl = (endpoint: string): string => {
  const apiUrl = getApiUrl();

  // Remove /api duplicado se já estiver no endpoint
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint;

  // Garante que começa com /
  const normalizedEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;

  return `${apiUrl}${normalizedEndpoint}`;
};

/**
 * Helper para fazer requisições à API
 */
export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    const url = getFullApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  },

  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const url = getFullApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    const url = getFullApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  delete: async (endpoint: string, options?: RequestInit) => {
    const url = getFullApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  },
};
