/**
 * ✅ HELPER: Normalizar dados de serviço
 *
 * Garante que requiredDocuments seja sempre um array,
 * evitando erros ".map is not a function" no frontend
 */
export function normalizeServiceData<T extends { requiredDocuments?: any }>(service: T): T {
  return {
    ...service,
    requiredDocuments: Array.isArray(service.requiredDocuments)
      ? service.requiredDocuments
      : []
  };
}

/**
 * Normaliza array de serviços
 */
export function normalizeServicesData<T extends { requiredDocuments?: any }>(services: T[]): T[] {
  return services.map(normalizeServiceData);
}
