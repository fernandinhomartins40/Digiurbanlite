/**
 * ============================================================================
 * HANDLER REGISTRY - Sistema Automático de Registro
 * ============================================================================
 *
 * Este arquivo centraliza o mapeamento de moduleType -> Handler
 * Elimina a necessidade de imports manuais e garante integração automática
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface ModuleHandler {
  /**
   * Criar entidade do módulo a partir dos dados do protocolo
   */
  createEntity?(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }>;

  /**
   * Ativar entidade (quando protocolo é aprovado)
   */
  activateEntity?(
    entityId: string,
    prisma: PrismaClient
  ): Promise<void>;

  /**
   * Buscar entidade por ID do protocolo
   */
  findByProtocolId?(
    protocolId: string,
    prisma: PrismaClient
  ): Promise<any | null>;

  /**
   * Atualizar entidade
   */
  updateEntity?(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any>;

  /**
   * Deletar entidade (soft delete preferencial)
   */
  deleteEntity?(
    entityId: string,
    prisma: PrismaClient
  ): Promise<void>;

  /**
   * Validar dados do formulário
   */
  validateFormData?(
    formData: Record<string, any>
  ): { valid: boolean; errors?: string[] };

  /**
   * Executar ação do módulo (padrão BaseModuleHandler)
   */
  execute?(action: any, tx: any): Promise<any>;

  /**
   * Type do módulo
   */
  moduleType?: string;

  /**
   * Nome da entidade
   */
  entityName?: string;
}

// ============================================================================
// REGISTRY MAP
// ============================================================================

const HANDLER_REGISTRY: Map<string, ModuleHandler> = new Map();

// ============================================================================
// FUNÇÕES DE REGISTRO
// ============================================================================

/**
 * Registrar handler para um moduleType
 */
export function registerHandler(
  moduleType: string,
  handler: ModuleHandler
): void {
  if (HANDLER_REGISTRY.has(moduleType)) {
    console.warn(`⚠️  Handler for ${moduleType} is being overwritten`);
  }
  HANDLER_REGISTRY.set(moduleType, handler);
  console.log(`✅ Registered handler for ${moduleType}`);
}

/**
 * Obter handler por moduleType
 */
export function getHandler(moduleType: string): ModuleHandler | undefined {
  return HANDLER_REGISTRY.get(moduleType);
}

/**
 * Verificar se moduleType tem handler registrado
 */
export function hasHandler(moduleType: string): boolean {
  return HANDLER_REGISTRY.has(moduleType);
}

/**
 * Listar todos os moduleTypes registrados
 */
export function getRegisteredModuleTypes(): string[] {
  return Array.from(HANDLER_REGISTRY.keys());
}

/**
 * Obter estatísticas do registry
 */
export function getRegistryStats(): {
  totalHandlers: number;
  handlersByDepartment: Record<string, number>;
} {
  const moduleTypes = getRegisteredModuleTypes();
  const byDepartment: Record<string, number> = {};

  // Agrupar por prefixo (departamento)
  moduleTypes.forEach(type => {
    const prefix = type.split('_')[0];
    byDepartment[prefix] = (byDepartment[prefix] || 0) + 1;
  });

  return {
    totalHandlers: moduleTypes.length,
    handlersByDepartment: byDepartment
  };
}

/**
 * Inicializar todos os handlers (chamado ao iniciar servidor)
 */
export async function initializeHandlers(): Promise<void> {
  console.log('\n🔧 Initializing Module Handlers...\n');

  try {
    // ========== FASE 1: AGRICULTURA ==========
    const agriculture = await import('./agriculture/index');
    if (agriculture.registerAgricultureHandlers) {
      agriculture.registerAgricultureHandlers();
    }

    // ========== FASE 2: CORE HANDLERS (Saúde, Educação, Assistência Social) ==========
    // Usar handlers reais de core/handlers que já estão implementados
    console.log('\n📦 Loading core handlers...\n');

    const coreHealth = await import('../../core/handlers/health/index');
    if (coreHealth.registerHealthHandlers) {
      coreHealth.registerHealthHandlers();
    }

    const coreEducation = await import('../../core/handlers/education/index');
    if (coreEducation.registerEducationHandlers) {
      coreEducation.registerEducationHandlers();
    }

    const coreSocial = await import('../../core/handlers/social-assistance/index');
    if (coreSocial.registerSocialAssistanceHandlers) {
      coreSocial.registerSocialAssistanceHandlers();
    }

    // Cultura
    const culture = await import('./culture/index');
    if (culture.registerCultureHandlers) {
      culture.registerCultureHandlers();
    }

    // Esportes
    const sports = await import('./sports/index');
    if (sports.registerSportHandlers) {
      sports.registerSportHandlers();
    }

    // Habitação
    const housing = await import('./housing/index');
    if (housing.registerHousingHandlers) {
      housing.registerHousingHandlers();
    }

    // Meio Ambiente
    const environment = await import('./environment/index');
    if (environment.registerEnvironmentHandlers) {
      environment.registerEnvironmentHandlers();
    }

    // Obras Públicas
    const publicWorks = await import('./public-works/index');
    if (publicWorks.registerPublicWorksHandlers) {
      publicWorks.registerPublicWorksHandlers();
    }

    // Planejamento Urbano
    const urbanPlanning = await import('./urban-planning/index');
    if (urbanPlanning.registerUrbanPlanningHandlers) {
      urbanPlanning.registerUrbanPlanningHandlers();
    }

    // Segurança Pública
    const security = await import('./security/index');
    if (security.registerSecurityHandlers) {
      security.registerSecurityHandlers();
    }

    // Serviços Públicos
    const publicServices = await import('./public-services/index');
    if (publicServices.registerPublicServicesHandlers) {
      publicServices.registerPublicServicesHandlers();
    }

    // Turismo
    const tourism = await import('./tourism/index');
    if (tourism.registerTourismHandlers) {
      tourism.registerTourismHandlers();
    }

    // Aguardar registro de todos
    await new Promise(resolve => setTimeout(resolve, 500));

    const stats = getRegistryStats();
    console.log(`\n✅ ${stats.totalHandlers} handlers registered successfully\n`);
    console.log('📋 Handlers by Department:');
    Object.entries(stats.handlersByDepartment).forEach(([dept, count]) => {
      console.log(`   - ${dept}: ${count} handlers`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error initializing handlers:', error);
    // Não lançar erro para não quebrar o servidor
    // Handlers serão carregados sob demanda
  }
}

// ============================================================================
// HELPER PARA CRIAR HANDLERS
// ============================================================================

/**
 * Factory para criar handlers padrão com menos boilerplate
 */
export function createStandardHandler<T>(config: {
  entityName: string; // Nome da entidade no Prisma (ex: 'ruralProducer')
  mapFormData: (formData: Record<string, any>, citizenId: string) => Partial<T>;
  validateFormData?: (formData: Record<string, any>) => { valid: boolean; errors?: string[] };
}): ModuleHandler {
  return {
    async createEntity(protocolId, formData, citizenId, prisma) {
      try {
        const data = {
          ...config.mapFormData(formData, citizenId),
          protocolId,
          status: 'PENDING',
          isActive: false
        };

        const entity = await (prisma as any)[config.entityName].create({
          data
        });

        return entity;
      } catch (error: any) {
        console.error(`Error creating ${config.entityName}:`, error);
        throw new Error(`Failed to create ${config.entityName}: ${error.message}`);
      }
    },

    async activateEntity(entityId, prisma) {
      try {
        await (prisma as any)[config.entityName].update({
          where: { id: entityId },
          data: {
            status: 'ACTIVE',
            isActive: true,
            approvedAt: new Date()
          }
        });
      } catch (error: any) {
        console.error(`Error activating ${config.entityName}:`, error);
        throw new Error(`Failed to activate ${config.entityName}: ${error.message}`);
      }
    },

    async findByProtocolId(protocolId, prisma) {
      try {
        return await (prisma as any)[config.entityName].findFirst({
          where: { protocolId }
        });
      } catch (error: any) {
        console.error(`Error finding ${config.entityName} by protocolId:`, error);
        return null;
      }
    },

    async updateEntity(entityId, data, prisma) {
      try {
        return await (prisma as any)[config.entityName].update({
          where: { id: entityId },
          data: {
            ...data,
            updatedAt: new Date()
          }
        });
      } catch (error: any) {
        console.error(`Error updating ${config.entityName}:`, error);
        throw new Error(`Failed to update ${config.entityName}: ${error.message}`);
      }
    },

    async deleteEntity(entityId, prisma) {
      try {
        // Soft delete
        await (prisma as any)[config.entityName].update({
          where: { id: entityId },
          data: {
            isActive: false,
            deletedAt: new Date()
          }
        });
      } catch (error: any) {
        console.error(`Error deleting ${config.entityName}:`, error);
        throw new Error(`Failed to delete ${config.entityName}: ${error.message}`);
      }
    },

    validateFormData(formData) {
      if (config.validateFormData) {
        return config.validateFormData(formData);
      }
      return { valid: true };
    }
  };
}

// ============================================================================
// INTEGRAÇÃO COM PROTOCOLO
// ============================================================================

/**
 * Criar entidade via handler e protocolo
 */
export async function createEntityWithHandler(
  moduleType: string,
  protocolId: string,
  formData: Record<string, any>,
  citizenId: string,
  prisma: PrismaClient
): Promise<{ success: boolean; entity?: any; error?: string }> {
  try {
    const handler = getHandler(moduleType);

    if (!handler) {
      return {
        success: false,
        error: `No handler registered for module type: ${moduleType}`
      };
    }

    // Validar dados
    if (handler.validateFormData) {
      const validation = handler.validateFormData(formData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        };
      }
    }

    // Criar entidade
    if (!handler.createEntity) {
      return {
        success: false,
        error: 'Handler does not implement createEntity method'
      };
    }
    const entity = await handler.createEntity(protocolId, formData, citizenId, prisma);

    return {
      success: true,
      entity
    };

  } catch (error: any) {
    console.error(`Error in createEntityWithHandler for ${moduleType}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ativar entidade quando protocolo é aprovado
 */
export async function activateEntityByProtocol(
  moduleType: string,
  protocolId: string,
  prisma: PrismaClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const handler = getHandler(moduleType);

    if (!handler) {
      return {
        success: false,
        error: `No handler registered for module type: ${moduleType}`
      };
    }

    if (!handler.findByProtocolId || !handler.activateEntity) {
      return {
        success: false,
        error: 'Handler does not implement required methods'
      };
    }

    // Buscar entidade
    const entity = await handler.findByProtocolId(protocolId, prisma);

    if (!entity) {
      return {
        success: false,
        error: `Entity not found for protocol: ${protocolId}`
      };
    }

    // Ativar entidade
    await handler.activateEntity(entity.id, prisma);

    return { success: true };

  } catch (error: any) {
    console.error(`Error in activateEntityByProtocol for ${moduleType}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  registerHandler,
  getHandler,
  hasHandler,
  getRegisteredModuleTypes,
  getRegistryStats,
  initializeHandlers,
  createStandardHandler,
  createEntityWithHandler,
  activateEntityByProtocol
};
