/**
 * API Client - Centralized API calling utility
 * Garante que todas as requisições vão para o backend correto
 */

const getBaseUrl = () => {
  // Em desenvolvimento: usa a variável de ambiente ou fallback
  // Em produção: usa a mesma origem (nginx faz o proxy)
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export const apiClient = {
  /**
   * Constrói a URL completa para uma requisição
   * @param path - Caminho relativo (ex: '/admin/secretarias/agricultura/services')
   * @returns URL completa (ex: 'http://localhost:3001/api/admin/secretarias/agricultura/services')
   */
  getUrl: (path: string): string => {
    const baseUrl = getBaseUrl();
    // Remove /api do início do path se existir, para evitar duplicação
    const cleanPath = path.startsWith('/api/') ? path.substring(4) : path;
    const cleanPath2 = cleanPath.startsWith('/api') ? cleanPath.substring(4) : cleanPath;
    // Garante que o path começa com /
    const finalPath = cleanPath2.startsWith('/') ? cleanPath2 : `/${cleanPath2}`;
    return `${baseUrl}${finalPath}`;
  },

  /**
   * Realiza uma requisição GET
   */
  get: async (path: string, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  },

  /**
   * Realiza uma requisição POST
   */
  post: async (path: string, data?: any, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },

  /**
   * Realiza uma requisição PUT
   */
  put: async (path: string, data?: any, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },

  /**
   * Realiza uma requisição DELETE
   */
  delete: async (path: string, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  },

  /**
   * Realiza uma requisição PATCH
   */
  patch: async (path: string, data?: any, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  },

  /**
   * Realiza upload de arquivos (FormData)
   */
  upload: async (path: string, formData: FormData, options: RequestInit = {}) => {
    const url = apiClient.getUrl(path);
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      // Não define Content-Type para FormData (navegador define automaticamente com boundary)
      body: formData,
      ...options,
    });
  },
};
