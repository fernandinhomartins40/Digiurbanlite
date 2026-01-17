import { prisma } from '../../lib/prisma';
import { ServiceKnowledgeBase, ServiceInfo } from './ServiceKnowledgeBase';

/**
 * Engine de recomendação de serviços baseado em IA e histórico do cidadão
 */
export class RecommendationEngine {
  private knowledgeBase: ServiceKnowledgeBase;

  constructor() {
    this.knowledgeBase = new ServiceKnowledgeBase();
  }

  /**
   * Obtém recomendações personalizadas para um cidadão
   */
  async getRecommendations(
    citizenId: string,
    context?: string,
    limit: number = 5
  ): Promise<ServiceInfo[]> {
    try {
      // 1. Buscar histórico de protocolos do cidadão
      const protocols = await prisma.protocolSimplified.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // 2. Extrair departamentos e serviços mais utilizados
      const departmentCounts: Record<string, number> = {};
      const serviceCounts: Record<string, number> = {};

      protocols.forEach((protocol: any) => {
        const deptId = protocol.departmentId;
        const serviceId = protocol.serviceId;

        if (deptId) {
          departmentCounts[deptId] = (departmentCounts[deptId] || 0) + 1;
        }

        if (serviceId) {
          serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1;
        }
      });

      // 3. Se houver contexto (mensagem), buscar serviços relacionados
      let contextualServices: ServiceInfo[] = [];
      if (context && context.trim().length > 0) {
        contextualServices = await this.knowledgeBase.searchServices(context, limit * 2);
      }

      // 4. Buscar serviços dos departamentos mais usados
      const topDepartments = Object.entries(departmentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([deptId]) => deptId);

      let departmentServices: ServiceInfo[] = [];
      for (const deptId of topDepartments) {
        const services = await this.knowledgeBase.getServicesByDepartment(deptId);
        departmentServices.push(...services);
      }

      // 5. Buscar serviços populares
      const popularServices = await this.knowledgeBase.getPopularServices(limit * 2);

      // 6. Combinar e pontuar serviços
      const allServices = [
        ...contextualServices,
        ...departmentServices,
        ...popularServices
      ];

      // Remover duplicatas e calcular score
      const serviceScores = new Map<string, { service: ServiceInfo; score: number }>();

      allServices.forEach(service => {
        if (!serviceScores.has(service.id)) {
          let score = 0;

          // Pontos por contexto (peso 100)
          if (contextualServices.find(s => s.id === service.id)) {
            score += 100;
          }

          // Pontos por departamento usado (peso 50)
          if (service.department?.id && departmentCounts[service.department.id]) {
            score += 50 * departmentCounts[service.department.id];
          }

          // Pontos por serviço já usado (peso -50 para evitar repetição)
          if (serviceCounts[service.id]) {
            score -= 50; // Penalizar serviços já usados
          }

          // Pontos por prioridade (peso 10)
          score += service.priority * 10;

          // Pontos por popularidade
          const popularIndex = popularServices.findIndex(s => s.id === service.id);
          if (popularIndex !== -1) {
            score += (popularServices.length - popularIndex) * 5;
          }

          serviceScores.set(service.id, { service, score });
        }
      });

      // 7. Ordenar por score e retornar top N
      return Array.from(serviceScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.service);

    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      // Fallback: retornar serviços populares
      return await this.knowledgeBase.getPopularServices(limit);
    }
  }

  /**
   * Recomenda próximos passos baseado no último protocolo
   */
  async recommendNextSteps(citizenId: string): Promise<{
    message: string;
    recommendations: ServiceInfo[];
  }> {
    try {
      // Buscar último protocolo
      const lastProtocol = await prisma.protocolSimplified.findFirst({
        where: { citizenId },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastProtocol || !lastProtocol.serviceId) {
        return {
          message: 'Explore nossos serviços disponíveis:',
          recommendations: await this.knowledgeBase.getPopularServices(5)
        };
      }

      // Buscar serviços relacionados
      const related = await this.knowledgeBase.getRelatedServices(
        lastProtocol.serviceId,
        5
      );

      // Mapear status para mensagens personalizadas
      const statusMessages: Record<string, string> = {
        'PENDING': `Seu protocolo #${lastProtocol.number} está pendente. Enquanto isso, veja outros serviços que podem te interessar:`,
        'IN_ANALYSIS': `Estamos analisando seu protocolo #${lastProtocol.number}. Confira outros serviços disponíveis:`,
        'APPROVED': `Ótimo! Seu protocolo #${lastProtocol.number} foi aprovado. Veja outros serviços que podem te ajudar:`,
        'COMPLETED': `Protocolo #${lastProtocol.number} concluído! Que tal conhecer outros serviços?`,
        'REJECTED': `Lamentamos, mas o protocolo #${lastProtocol.number} foi rejeitado. Podemos te ajudar com:`,
        'CANCELLED': `Você cancelou o protocolo #${lastProtocol.number}. Veja outras opções:`
      };

      const message = statusMessages[lastProtocol.status] ||
        'Baseado no seu histórico, você pode se interessar por:';

      return {
        message,
        recommendations: related
      };

    } catch (error) {
      console.error('Erro ao recomendar próximos passos:', error);
      return {
        message: 'Veja nossos serviços mais populares:',
        recommendations: await this.knowledgeBase.getPopularServices(5)
      };
    }
  }

  /**
   * Recomenda serviços baseado em perfil do cidadão
   */
  async recommendByProfile(citizenId: string, limit: number = 5): Promise<ServiceInfo[]> {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });

      if (!citizen) {
        return await this.knowledgeBase.getPopularServices(limit);
      }

      // Inferir necessidades baseado no perfil
      const searchTerms: string[] = [];

      // Se idade > 60, recomendar serviços para idosos
      const age = this.calculateAge(citizen.birthDate);
      if (age && age >= 60) {
        searchTerms.push('idoso', 'terceira idade');
      }

      // Lógica de serviços por bairro/região pode ser adicionada aqui

      // Buscar serviços baseado nos termos inferidos
      if (searchTerms.length > 0) {
        return await this.knowledgeBase.searchServices(
          searchTerms.join(' '),
          limit
        );
      }

      // Fallback: serviços populares
      return await this.knowledgeBase.getPopularServices(limit);

    } catch (error) {
      console.error('Erro ao recomendar por perfil:', error);
      return await this.knowledgeBase.getPopularServices(limit);
    }
  }

  /**
   * Calcula idade baseado na data de nascimento
   */
  private calculateAge(birthDate: Date | null | undefined): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Recomenda serviços complementares
   */
  async recommendComplementary(
    serviceId: string,
    limit: number = 3
  ): Promise<ServiceInfo[]> {
    try {
      const service = await this.knowledgeBase.getServiceById(serviceId);

      if (!service) {
        return [];
      }

      // Buscar serviços do mesmo departamento
      const departmentServices = service.department?.id
        ? await this.knowledgeBase.getServicesByDepartment(service.department.id)
        : [];

      // Remover o próprio serviço
      const filtered = departmentServices.filter(s => s.id !== serviceId);

      return filtered.slice(0, limit);

    } catch (error) {
      console.error('Erro ao recomendar complementares:', error);
      return [];
    }
  }

  /**
   * Obtém tendências de uso de serviços
   */
  async getTrending(limit: number = 10): Promise<ServiceInfo[]> {
    try {
      // Buscar serviços mais solicitados nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingServices = await prisma.protocolSimplified.groupBy({
        by: ['serviceId'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          serviceId: true
        },
        orderBy: {
          _count: {
            serviceId: 'desc'
          }
        },
        take: limit
      });

      // Buscar informações completas dos serviços
      const serviceIds = trendingServices.map((t: any) => t.serviceId).filter(Boolean) as string[];

      const services: ServiceInfo[] = [];
      for (const serviceId of serviceIds) {
        const service = await this.knowledgeBase.getServiceById(serviceId);
        if (service) {
          services.push(service);
        }
      }

      return services;

    } catch (error) {
      console.error('Erro ao buscar trending:', error);
      return await this.knowledgeBase.getPopularServices(limit);
    }
  }
}

export default new RecommendationEngine();
