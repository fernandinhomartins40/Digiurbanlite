/**
 * @file health-attendance-tab.service.ts
 * @description Service para o módulo de Atendimentos de Saúde
 * @module modules/health
 *
 * EXEMPLO DE IMPLEMENTAÇÃO - Template para outros módulos
 */

import { PrismaClient } from '@prisma/client';
import { BaseTabService } from '../core/base';
import {
  ApprovalConfig,
  EntityConfig,
  DashboardParams,
  KPIData,
  TrendData,
  DistributionData,
  DashboardData,
} from '../core/interfaces';

/**
 * Service do módulo de Atendimentos de Saúde
 * Implementa as 4 abas: Listagem, Dashboard, Gerenciamento
 * (Não requer aprovação)
 */
export class HealthAttendanceTabService extends BaseTabService {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  // ============================================================================
  // MÉTODOS OBRIGATÓRIOS
  // ============================================================================

  /**
   * Retorna o nome da entidade principal do Prisma
   */
  getEntityName(): string {
    return 'healthAttendance';
  }

  /**
   * Retorna configuração de aprovação
   * Este módulo NÃO requer aprovação
   */
  getApprovalConfig(): ApprovalConfig | null {
    return null;
  }

  /**
   * Retorna configuração de entidades gerenciáveis
   */
  getManagementEntities(): EntityConfig[] {
    return [
      {
        name: 'patient',
        label: 'Paciente',
        pluralLabel: 'Pacientes',
        icon: 'user',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: true,
        fields: [
          {
            name: 'name',
            label: 'Nome Completo',
            type: 'string',
            required: true,
          },
          {
            name: 'cpf',
            label: 'CPF',
            type: 'string',
            required: true,
          },
          {
            name: 'birthDate',
            label: 'Data de Nascimento',
            type: 'date',
            required: true,
          },
          {
            name: 'phone',
            label: 'Telefone',
            type: 'string',
            required: false,
          },
          {
            name: 'email',
            label: 'E-mail',
            type: 'string',
            required: false,
          },
          {
            name: 'susCard',
            label: 'Cartão SUS',
            type: 'string',
            required: false,
          },
          {
            name: 'address',
            label: 'Endereço',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        name: 'healthUnit',
        label: 'Unidade de Saúde',
        pluralLabel: 'Unidades de Saúde',
        icon: 'hospital',
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canImport: false,
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'string',
            required: true,
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
              { value: 'UBS', label: 'UBS - Unidade Básica de Saúde' },
              { value: 'UPA', label: 'UPA - Unidade de Pronto Atendimento' },
              { value: 'HOSPITAL', label: 'Hospital' },
              { value: 'POSTO', label: 'Posto de Saúde' },
            ],
          },
          {
            name: 'address',
            label: 'Endereço',
            type: 'string',
            required: true,
          },
          {
            name: 'phone',
            label: 'Telefone',
            type: 'string',
            required: true,
          },
          {
            name: 'capacity',
            label: 'Capacidade de Atendimento',
            type: 'number',
            required: true,
          },
        ],
      },
    ];
  }

  /**
   * Retorna lista de KPIs disponíveis
   */
  getAvailableKPIs(): string[] {
    return [
      'total',
      'pending',
      'completed',
      'avgTime',
      'byType',
      'byUnit',
      'satisfaction',
    ];
  }

  // ============================================================================
  // MÉTODOS ESPECÍFICOS - DASHBOARD
  // ============================================================================

  /**
   * Sobrescreve cálculo de KPIs para adicionar específicos do módulo
   */
  async calculateKPIs(params: DashboardParams, kpis?: string[]): Promise<KPIData[]> {
    // Obtém KPIs padrão da classe base
    const baseKPIs = await super.calculateKPIs(params, kpis);

    const { dateFrom, dateTo, departmentId } = params.filters;

    const where: any = {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    if (departmentId) {
      where.healthUnitId = departmentId;
    }

    // KPIs específicos de saúde
    const specificKPIs: KPIData[] = [];

    // KPI: Atendimentos por tipo
    if (!kpis || kpis.includes('byType')) {
      const byType = await this.prisma.healthAttendance.groupBy({
        by: ['type'],
        where,
        _count: true,
      });

      specificKPIs.push({
        label: 'Tipos de Atendimento',
        value: byType.length,
        format: 'number',
      });
    }

    // KPI: Tempo médio de atendimento
    if (!kpis || kpis.includes('avgTime')) {
      // TODO: Campo completedAt não existe no schema atual
      // const attendances = await this.prisma.healthAttendance.findMany({
      //   where: {
      //     ...where,
      //     status: 'COMPLETED',
      //     completedAt: { not: null },
      //   },
      //   select: {
      //     createdAt: true,
      //     completedAt: true,
      //   },
      // });

      // if (attendances.length > 0) {
      //   const totalTime = attendances.reduce((sum, att) => {
      //     const start = new Date(att.createdAt).getTime();
      //     const end = new Date(att.completedAt!).getTime();
      //     return sum + (end - start);
      //   }, 0);

        const avgTimeMs = 0; // totalTime / attendances.length;
        const avgTimeHours = Math.round(avgTimeMs / (1000 * 60 * 60));

      specificKPIs.push({
        label: 'Tempo Médio de Atendimento',
        value: avgTimeHours,
        unit: 'horas',
        format: 'duration',
      });
      // }
    }

    // KPI: Satisfação (se houver dados)
    // TODO: Campo satisfactionRating não existe no schema atual
    // if (!kpis || kpis.includes('satisfaction')) {
    //   const satisfactionData = await this.prisma.healthAttendance.aggregate({
    //     where: {
    //       ...where,
    //       satisfactionRating: { not: null },
    //     },
    //     _avg: {
    //       satisfactionRating: true,
    //     },
    //     _count: true,
    //   });

    //   if (satisfactionData._count > 0 && satisfactionData._avg.satisfactionRating) {
    //     specificKPIs.push({
    //       label: 'Satisfação Média',
    //       value: Math.round(satisfactionData._avg.satisfactionRating * 10) / 10,
    //       unit: '/5',
    //       format: 'number',
    //       trend: satisfactionData._avg.satisfactionRating >= 4 ? 'up' : 'down',
    //     });
    //   }
    // }

    return [...baseKPIs, ...specificKPIs];
  }

  /**
   * Sobrescreve dados de distribuição para incluir específicos
   */
  async getDistributionData(
    params: DashboardParams,
    groupBy: string,
  ): Promise<DashboardData['distribution']> {
    const { dateFrom, dateTo } = params.filters;

    const where: any = {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    // Distribuição por tipo de atendimento
    if (groupBy === 'type') {
      const grouped = await this.prisma.healthAttendance.groupBy({
        by: ['type'],
        where,
        _count: true,
      });

      const total = grouped.reduce((sum, item) => sum + item._count, 0);

      return [
        {
          label: 'Por Tipo de Atendimento',
          data: grouped.map((item) => ({
            category: this.getAttendanceTypeLabel(item.type),
            value: item._count,
            percentage: Math.round((item._count / total) * 100),
          })),
        },
      ];
    }

    // Distribuição por unidade de saúde
    // TODO: Campo healthUnitId não existe no schema atual
    // if (groupBy === 'unit') {
    //   const grouped = await this.prisma.healthAttendance.groupBy({
    //     by: ['medicalUnit'],
    //     where,
    //     _count: true,
    //   });

    //   const total = grouped.reduce((sum, item) => sum + (item._count._all || 0), 0);

    //   return [
    //     {
    //       label: 'Por Unidade de Saúde',
    //       data: grouped.map((item) => ({
    //         category: item.medicalUnit || 'Desconhecido',
    //         value: item._count._all || 0,
    //         percentage: Math.round(((item._count._all || 0) / total) * 100),
    //       })),
    //     },
    //   ];
    // }

    // Usa implementação padrão para outros tipos
    return super.getDistributionData(params, groupBy);
  }

  /**
   * Retorna dados de tendência temporal
   */
  async getTrendData(
    params: DashboardParams,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): Promise<DashboardData['trends']> {
    const { dateFrom, dateTo } = params.filters;

    const where: any = {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    // Agrupa por data conforme período
    let groupFormat: string;
    switch (period) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-%W';
        break;
      case 'monthly':
        groupFormat = '%Y-%m';
        break;
      case 'yearly':
        groupFormat = '%Y';
        break;
    }

    // Busca dados (implementação simplificada - ajustar para SQL específico)
    const attendances = await this.prisma.healthAttendance.findMany({
      where,
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa manualmente (em produção, usar query SQL otimizada)
    const grouped = new Map<string, number>();

    attendances.forEach((att) => {
      const date = new Date(att.createdAt);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    const trendData: TrendData[] = Array.from(grouped.entries()).map(([key, value]) => ({
      period: key,
      date: new Date(key),
      value,
      label: key,
    }));

    return [
      {
        label: 'Atendimentos por Período',
        data: trendData,
      },
    ];
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Retorna label amigável para tipo de atendimento
   */
  private getAttendanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CONSULTA: 'Consulta',
      EMERGENCIA: 'Emergência',
      EXAME: 'Exame',
      PROCEDIMENTO: 'Procedimento',
      VACINA: 'Vacinação',
      RETORNO: 'Retorno',
      OUTROS: 'Outros',
    };

    return labels[type] || type;
  }

  /**
   * Valida dados específicos de atendimento
   */
  async validateEntityData(
    entityName: string,
    data: any,
  ): Promise<{ valid: boolean; errors: any[] }> {
    const errors: any[] = [];

    // Validações específicas para paciente
    if (entityName === 'patient') {
      // Validar CPF único
      // TODO: Modelo Patient não existe ou não tem campo cpf
      // if (data.cpf) {
      //   const existing = await this.prisma.patient.findFirst({
      //     where: {
      //       cpf: data.cpf,
      //       id: { not: data.id }, // Excluir o próprio registro em updates
      //     },
      //   });

      //   if (existing) {
      //     errors.push({
      //       field: 'cpf',
      //       message: 'CPF já cadastrado para outro paciente',
      //     });
      //   }
      // }

      // Validar idade mínima
      if (data.birthDate) {
        const birthDate = new Date(data.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 0 || age > 150) {
          errors.push({
            field: 'birthDate',
            message: 'Data de nascimento inválida',
          });
        }
      }
    }

    // Validações específicas para unidade de saúde
    if (entityName === 'healthUnit') {
      if (data.capacity && data.capacity < 0) {
        errors.push({
          field: 'capacity',
          message: 'Capacidade deve ser maior que zero',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
