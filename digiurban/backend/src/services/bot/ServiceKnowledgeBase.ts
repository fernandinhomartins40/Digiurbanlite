import { prisma } from '../../lib/prisma';

export interface ServiceInfo {
  id: string;
  name: string;
  description: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  type: string;
  priority: number;
  estimatedDays: number | null;
  isActive: boolean;
  keywords?: string[];
}

/**
 * Base de conhecimento de todos os serviços municipais
 * Mapeia os 114+ serviços para facilitar busca e recomendações
 */
export class ServiceKnowledgeBase {
  private servicesCache: ServiceInfo[] = [];
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutos

  constructor() {
    // Carregar cache sem bloquear (fire and forget)
    this.loadServicesCache().catch(err => {
      console.error('⚠️  Erro ao carregar cache de serviços:', err.message);
    });
  }

  /**
   * Carrega todos os serviços no cache
   */
  private async loadServicesCache(): Promise<void> {
    try {
      const services = await prisma.serviceSimplified.findMany({
        where: { isActive: true },
        include: {
          department: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { name: 'asc' }
        ]
      });

      this.servicesCache = services.map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        department: service.department,
        type: service.type,
        priority: service.priority,
        estimatedDays: service.estimatedDays,
        isActive: service.isActive,
        keywords: this.generateKeywords(service.name, service.description)
      }));

      this.lastCacheUpdate = new Date();
      console.log(`✅ Knowledge Base carregada: ${this.servicesCache.length} serviços`);
    } catch (error: any) {
      console.error('❌ Erro ao carregar cache de serviços:', error.message);
      this.servicesCache = [];
    }
  }

  /**
   * Gera keywords para um serviço baseado no nome e descrição
   */
  private generateKeywords(name: string, description: string | null): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();

    // Palavras comuns a ignorar
    const stopWords = new Set([
      'de', 'da', 'do', 'dos', 'das', 'a', 'o', 'os', 'as',
      'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com',
      'e', 'ou', 'que', 'um', 'uma', 'uns', 'umas'
    ]);

    // Extrair palavras únicas (mínimo 3 caracteres)
    const words = text
      .match(/\b[a-záàâãéèêíïóôõöúçñ]{3,}\b/gi) || [];

    const keywords = [...new Set(words)]
      .filter(word => !stopWords.has(word.toLowerCase()))
      .slice(0, 20); // Limitar a 20 keywords

    return keywords;
  }

  /**
   * Busca serviços por termo de pesquisa
   */
  async searchServices(searchTerm: string, limit: number = 10): Promise<ServiceInfo[]> {
    // Atualizar cache se expirado
    if (!this.lastCacheUpdate ||
        (Date.now() - this.lastCacheUpdate.getTime()) > this.CACHE_TTL) {
      await this.loadServicesCache();
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      // Retornar serviços de maior prioridade
      return this.servicesCache.slice(0, limit);
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchWords = normalizedSearch.split(/\s+/);

    // Calcular score de relevância para cada serviço
    const scored = this.servicesCache.map(service => {
      let score = 0;

      const serviceName = service.name.toLowerCase();
      const serviceDesc = (service.description || '').toLowerCase();
      const serviceKeywords = service.keywords || [];

      // Match exato no nome (peso 100)
      if (serviceName.includes(normalizedSearch)) {
        score += 100;
      }

      // Match exato na descrição (peso 50)
      if (serviceDesc.includes(normalizedSearch)) {
        score += 50;
      }

      // Match de palavras individuais (peso 10 cada)
      searchWords.forEach(word => {
        if (word.length < 3) return;

        if (serviceName.includes(word)) score += 10;
        if (serviceDesc.includes(word)) score += 5;

        // Match em keywords (peso 15)
        if (serviceKeywords.some(kw => kw.includes(word))) {
          score += 15;
        }
      });

      // Boost por prioridade (0-10 pontos)
      score += service.priority;

      return { service, score };
    });

    // Filtrar apenas scores > 0 e ordenar por score
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.service);
  }

  /**
   * Busca serviços por departamento
   */
  async getServicesByDepartment(departmentId: string): Promise<ServiceInfo[]> {
    return this.servicesCache.filter(
      service => service.department?.id === departmentId
    );
  }

  /**
   * Busca serviço por ID
   */
  async getServiceById(serviceId: string): Promise<ServiceInfo | null> {
    const service = this.servicesCache.find(s => s.id === serviceId);
    return service || null;
  }

  /**
   * Obter todos os departamentos com seus serviços
   */
  async getDepartmentsWithServices(): Promise<Record<string, ServiceInfo[]>> {
    const departments: Record<string, ServiceInfo[]> = {};

    this.servicesCache.forEach(service => {
      const deptName = service.department?.name || 'Outros';

      if (!departments[deptName]) {
        departments[deptName] = [];
      }

      departments[deptName].push(service);
    });

    return departments;
  }

  /**
   * Obter serviços mais populares (maior prioridade)
   */
  async getPopularServices(limit: number = 10): Promise<ServiceInfo[]> {
    return this.servicesCache
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Obter serviços relacionados a um serviço específico
   */
  async getRelatedServices(serviceId: string, limit: number = 5): Promise<ServiceInfo[]> {
    const targetService = this.servicesCache.find(s => s.id === serviceId);

    if (!targetService) return [];

    // Buscar serviços do mesmo departamento
    const related = this.servicesCache.filter(service =>
      service.id !== serviceId &&
      service.department?.id === targetService.department?.id
    );

    return related.slice(0, limit);
  }

  /**
   * Buscar serviços por tipo
   */
  async getServicesByType(type: string): Promise<ServiceInfo[]> {
    return this.servicesCache.filter(service => service.type === type);
  }

  /**
   * Obter estatísticas da base de conhecimento
   */
  async getStats(): Promise<{
    totalServices: number;
    servicesByDepartment: Record<string, number>;
    servicesByType: Record<string, number>;
    lastUpdate: Date | null;
  }> {
    const servicesByDepartment: Record<string, number> = {};
    const servicesByType: Record<string, number> = {};

    this.servicesCache.forEach(service => {
      const deptName = service.department?.name || 'Outros';
      servicesByDepartment[deptName] = (servicesByDepartment[deptName] || 0) + 1;

      servicesByType[service.type] = (servicesByType[service.type] || 0) + 1;
    });

    return {
      totalServices: this.servicesCache.length,
      servicesByDepartment,
      servicesByType,
      lastUpdate: this.lastCacheUpdate
    };
  }

  /**
   * Forçar atualização do cache
   */
  async refreshCache(): Promise<void> {
    await this.loadServicesCache();
  }

  /**
   * Mapear intent para serviços relevantes
   */
  async getServicesForIntent(intentName: string): Promise<ServiceInfo[]> {
    const intentServiceMap: Record<string, string[]> = {
      'AGENDAR_CONSULTA': [
        'agendamento', 'consulta', 'médico', 'saúde', 'atendimento'
      ],
      'SOLICITAR_SERVICO': [], // Usar busca genérica
      'PESQUISAR_SERVICO': [], // Usar busca genérica
    };

    const keywords = intentServiceMap[intentName];

    if (!keywords || keywords.length === 0) {
      return this.getPopularServices();
    }

    return await this.searchServices(keywords.join(' '));
  }
}

export default new ServiceKnowledgeBase();
