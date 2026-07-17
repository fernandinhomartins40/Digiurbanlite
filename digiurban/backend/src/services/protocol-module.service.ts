/**
 * ============================================================================
 * PROTOCOL-MODULE SERVICE - Integração Protocolos ↔ Módulos
 * ============================================================================
 *
 * Conecta protocolos simplificados aos módulos usando entidades virtuais em customData.
 * Implementa o fluxo: Protocolo COM_DADOS → customData (entidade virtual) → Aprovação
 */

import { ProtocolStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateProtocolNumberSafe } from './protocol-number.service';
import { protocolStatusEngine } from './protocol-status.engine';
import { familyStatsService } from './family-stats.service';
import { GeolocationService } from './geolocation.service';
import { materializeOnApproval } from './registry/registry-materialize.service';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProtocolWithModuleInput {
  citizenId: string;
  serviceId: string;
  formData: Record<string, any>;
  description?: string;
  createdById?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  attachments?: any[];
}

export interface ApproveProtocolInput {
  protocolId: string;
  userId: string;
  comment?: string;
  additionalData?: Record<string, any>;
}

export interface RejectProtocolInput {
  protocolId: string;
  userId: string;
  reason: string;
}

function extractRequiredInputFieldsFromService(service: {
  formSchema?: unknown;
  formFieldsConfig?: unknown;
}): string[] {
  const requiredFieldIds = new Set<string>();

  let formSchema: Record<string, any> | null = null;
  if (typeof service.formSchema === 'string') {
    try {
      const parsed = JSON.parse(service.formSchema);
      formSchema = parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      formSchema = null;
    }
  } else if (service.formSchema && typeof service.formSchema === 'object') {
    formSchema = service.formSchema as Record<string, any>;
  }

  if (Array.isArray(formSchema?.required)) {
    for (const fieldId of formSchema.required) {
      if (typeof fieldId === 'string' && fieldId.trim()) {
        requiredFieldIds.add(fieldId.trim());
      }
    }
  }

  const formFieldsConfig = Array.isArray(service.formFieldsConfig) ? service.formFieldsConfig : [];
  for (const field of formFieldsConfig) {
    if (!field || typeof field !== 'object') {
      continue;
    }

    const fieldRecord = field as Record<string, any>;
    const rawId = fieldRecord.id ?? fieldRecord.key ?? fieldRecord.name;
    const fieldId = typeof rawId === 'string' ? rawId.trim() : '';
    if (!fieldId || !fieldRecord.required) {
      continue;
    }

    requiredFieldIds.add(fieldId);
  }

  return Array.from(requiredFieldIds);
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ProtocolModuleService {
  /**
   * Criar protocolo COM_DADOS com entidade virtual em customData
   * ou SEM_DADOS apenas com protocolo de acompanhamento
   */
  async createProtocolWithModule(input: CreateProtocolWithModuleInput) {
    const { citizenId, serviceId, formData, description, createdById, latitude, longitude, address, attachments } = input;

    // 1. Buscar serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: { department: true }
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    if (!service.isActive) {
      throw new Error('Serviço inativo');
    }

    // 2. Verificar tipo de serviço
    const isComDados = service.serviceType === 'COM_DADOS';

    // 2.1 Pré-preencher dados de composição familiar (Sprint 3.2)
    let enrichedFormData = { ...formData };
    try {
      const familyPrefillData = await familyStatsService.getFormPrefillData(citizenId);

      // Mesclar dados de composição familiar com formData existente
      // Dados do formulário têm prioridade sobre dados calculados
      enrichedFormData = {
        ...familyPrefillData,
        ...formData // Sobrescreve com dados manuais se existirem
      };
    } catch (error) {
      // Se falhar ao buscar dados familiares, continua com formData original
      console.warn('Não foi possível pré-preencher dados familiares:', error);
    }

    // 2.2 Resolver geolocalização inteligente
    const locationData = latitude && longitude ? { latitude, longitude, address } : undefined;
    const geoResult = await GeolocationService.resolveProtocolLocation(
      serviceId,
      citizenId,
      locationData,
      prisma
    );

    console.log(`📍 [Protocol Module] Geolocalização resolvida: source=${geoResult.source}, lat=${geoResult.latitude}, long=${geoResult.longitude}`);
    if (geoResult.address) {
      console.log(`   Endereço: ${geoResult.address}`);
    }

    // 3. Criar protocolo em transação
    const result = await prisma.$transaction(async (tx) => {
      // Gerar número do protocolo - Sistema centralizado com lock
      const protocolNumber = await generateProtocolNumberSafe(tx);

      // Preparar customData com metadados da entidade virtual e geolocalização
      const customDataPayload = isComDados && service.moduleType
        ? {
            // Dados do formulário (enriquecidos com dados de composição familiar)
            ...enrichedFormData,
            // Metadados da entidade virtual
            _meta: {
              entityType: service.moduleType,
              status: 'PENDING_APPROVAL',
              isActive: false,
              createdAt: new Date().toISOString(),
              approvedAt: null,
              approvedBy: null
            },
            // Metadados de geolocalização
            _geoSource: geoResult.source
          }
        : {
            ...enrichedFormData,
            _geoSource: geoResult.source
          };

      // Mapear source para locationType
      const locationTypeMap: Record<string, string> = {
        'user_location': 'GPS',
        'citizen_address': 'CITIZEN_ADDRESS',
        'none': ''
      };

      // Criar protocolo com geolocalização resolvida
      const protocol = await tx.protocolSimplified.create({
        data: {
          number: protocolNumber,
          title: service.name,
          description: description || service.description || '',
          citizenId,
          serviceId,
          departmentId: service.departmentId,
          status: ProtocolStatus.VINCULADO,
          moduleType: service.moduleType || 'GENERICO',
          customData: customDataPayload as Prisma.JsonObject,
          createdById,
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          address: geoResult.address,
          locationType: locationTypeMap[geoResult.source] || undefined
        }
      });

      // ✅ CORREÇÃO: Documentos agora são criados pela rota citizen-services.ts
      // usando documentUploadService.uploadDocumentsToProtocol() e ensureRequiredProtocolDocuments()
      // Isso evita duplicação e garante que isRequired seja setado corretamente
      //
      // REMOVIDO: Criação de ProtocolDocument aqui (causava duplicatas)
      // Os attachments são passados para a rota que chama este service,
      // e ela é responsável por criar os documentos com a lógica completa.

      // Criar histórico
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: protocol.id,
          action: 'CREATED',
          comment: isComDados
            ? 'Protocolo COM_DADOS criado - aguardando aprovação'
            : 'Protocolo SEM_DADOS criado',
          newStatus: ProtocolStatus.VINCULADO,
          userId: createdById
        }
      });

      return {
        protocol,
        isComDados,
        hasModule: isComDados && !!service.moduleType
      };
    });

    // ============================================================================
    // APLICAR WORKFLOW E SLA (FORA DA TRANSAÇÃO)
    // ✅ RESILIENTE: Se falhar, protocolo continua existindo para correção manual
    // ============================================================================

    // Aplicar workflow se houver moduleType
    if (result.protocol.moduleType) {
      try {
        console.log(`📋 Inicializando workflow para módulo: ${result.protocol.moduleType}`);
        await this.applyWorkflowToProtocol(result.protocol.id, result.protocol.moduleType);
        console.log('   ✓ Workflow inicializado com primeira etapa IN_PROGRESS');
      } catch (error) {
        console.error('⚠️ Erro ao inicializar workflow:', error);
        console.warn('   → Protocolo criado SEM workflow. Admin pode inicializar manualmente via botão "Iniciar Atendimento".');
        // NÃO deletar protocolo, NÃO lançar erro - permite correção manual
      }
    }

    // ============================================================================
    // CRIAR CAMPOS DE DADOS PARA APROVAÇÃO (FORA DA TRANSAÇÃO)
    // ✅ Sistema granular de aprovação por campo
    // ============================================================================
    if (result.isComDados && enrichedFormData && Object.keys(enrichedFormData).length > 0) {
      try {
        console.log(`📝 Criando campos de dados para aprovação granular...`);
        const dataFieldService = await import('./protocol-data-field.service');

        // Determinar quais campos são obrigatórios (pode vir do schema do serviço)
        const requiredFields = extractRequiredInputFieldsFromService(service);

        await dataFieldService.createDataFieldsFromCustomData({
          protocolId: result.protocol.id,
          customData: enrichedFormData,
          requiredFields
        });

        console.log('   ✓ Campos de dados criados para aprovação');
      } catch (error) {
        console.error('⚠️ Erro ao criar campos de dados:', error);
        console.warn('   → Campos de dados não criados. Protocolo pode continuar normalmente.');
        // NÃO bloquear criação do protocolo
      }
    }

    // ============================================================================
    // PROCESSAR CITIZEN LINKS (FORA DA TRANSAÇÃO)
    // ============================================================================

    try {
      const { processProtocolCitizenLinks } = await import('./protocol-citizen-links.service');
      const links = await processProtocolCitizenLinks(
        result.protocol.id,
        serviceId,
        citizenId,
        formData,
        createdById
      );

      if (links.length > 0) {
        console.log(`✅ ${links.length} citizen link(s) processado(s) para protocolo ${result.protocol.id}`);
      }
    } catch (error) {
      console.error('Erro ao processar citizen links:', error);
      // Não falhar a criação do protocolo se citizen links falharem
    }

    // ============================================================================
    // VALIDAÇÃO PÓS-CRIAÇÃO: Verificar workflow e SLA (sem deletar se falhar)
    // ============================================================================

    const validation = await prisma.protocolSimplified.findUnique({
      where: { id: result.protocol.id },
      include: {
        sla: true,
        stages: {
          where: { status: 'IN_PROGRESS' },
          orderBy: { stageOrder: 'asc' },
          take: 1
        }
      }
    });

    if (!validation) {
      console.error('⚠️ VALIDAÇÃO: Protocolo não encontrado após criação');
      // Protocolo foi criado mas não conseguimos validá-lo - continuar
    } else {
      if (!validation.sla) {
        console.warn('⚠️ VALIDAÇÃO: SLA não foi criado');
        console.warn('   → Admin pode criar SLA manualmente via botão "Iniciar Atendimento"');
      }

      if (validation.stages.length === 0) {
        console.warn('⚠️ VALIDAÇÃO: Nenhuma etapa IN_PROGRESS foi criada');
        console.warn('   → Admin pode inicializar workflow manualmente via botão "Iniciar Atendimento"');
      }

      if (validation.sla && validation.stages.length > 0) {
        console.log('✅ Protocolo criado e validado:', result.protocol.number);
        console.log(`   → SLA: ${validation.sla.workingDays} dias úteis`);
        console.log(`   → Workflow: ${validation.stages[0].stageName} (IN_PROGRESS)`);
      }
    }

    // ============================================================================
    // ⭐ HOOK AUTOMÁTICO: CONVERTER PROTOCOLO TFD → SOLICITAÇÃO TFD
    // ============================================================================

    if (result.protocol.moduleType === 'ENCAMINHAMENTOS_TFD') {
      try {
        const protocolToTFDService = (await import('./tfd/protocol-to-tfd.service')).default;
        const solicitacaoTFD = await protocolToTFDService.convertProtocolToTFD(result.protocol.id);

        console.log(`✅ Protocolo ${result.protocol.number} convertido automaticamente para solicitação TFD ${solicitacaoTFD.id}`);
      } catch (error) {
        console.error('❌ Erro ao converter protocolo para TFD:', error);
        // Não falhar a criação do protocolo se conversão TFD falhar
        // O protocolo continua existindo e pode ser convertido manualmente depois
      }
    }

    // ============================================================================
    // ⭐ HOOK AUTOMÁTICO: CONVERTER PROTOCOLO → APPS DE SECRETARIA (NÃO-FATAL)
    // OS de Serviços Públicos e assistência técnica rural entram na fila do app
    // ============================================================================

    try {
      const { convertProtocolToAppOnCreate } = await import('./apps/protocol-to-app.service');
      await convertProtocolToAppOnCreate(result.protocol);
    } catch (error) {
      console.error('❌ Erro ao converter protocolo para app de secretaria (não-fatal):', error);
    }

    return result;
  }

  /**
   * Aplicar workflow ao protocolo
   * ✅ SISTEMA UNIFICADO: Usa service-workflow.service (por serviceId, não moduleType)
   */
  private async applyWorkflowToProtocol(protocolId: string, moduleType: string) {
    try {
      // Importar serviços (NOVO SISTEMA)
      const serviceWorkflowService = await import('./service-workflow.service');
      const slaService = await import('./protocol-sla.service');

      // Buscar protocolo para obter serviceId
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: { service: true }
      });

      if (!protocol || !protocol.service) {
        throw new Error('Protocolo ou serviço não encontrado');
      }

      // 1. Buscar workflow do SERVIÇO (não mais por moduleType)
      const workflow = await serviceWorkflowService.getWorkflowByServiceId(protocol.serviceId);

      if (!workflow) {
        // ✅ AUTO-GERAÇÃO: Se não tem workflow, gerar automaticamente usando subtipo
        console.warn(`⚠️ Workflow não encontrado para serviço "${protocol.service.name}". Gerando workflow automático...`);

        const templateService = await import('./workflow-template.service');

        // Gerar workflow UNIFICADO baseado em subtipo
        const generatedWorkflow = templateService.generateCompleteWorkflowBySubtype(protocol.service as any);

        // Criar workflow no banco usando ServiceWorkflow
        await serviceWorkflowService.createServiceWorkflow({
          serviceId: protocol.serviceId,
          ...generatedWorkflow
        });

        const subtype = protocol.service.serviceSubtype || 'CONSULTIVO';
        console.log(`✅ Workflow UNIFICADO criado automaticamente (${subtype}) para "${protocol.service.name}"`);

        // Aplicar workflow recém-criado (recursão segura - não entra em loop pois workflow agora existe)
        await this.applyWorkflowToProtocol(protocolId, moduleType);
        return;
      }

      // 2. Aplicar workflow (criar etapas baseado no ServiceWorkflow)
      await serviceWorkflowService.applyWorkflowToProtocol(protocolId);

      // 3. Criar SLA se definido
      if (workflow.defaultSLA) {
        await slaService.createSLA({
          protocolId,
          workingDays: workflow.defaultSLA
        });
      }

      console.log(`✅ Workflow '${workflow.name}' aplicado ao protocolo ${protocolId}`);
    } catch (error) {
      console.error('Erro ao aplicar workflow:', error);
      throw error;
    }
  }

  /**
   * Aprovar protocolo e ativar entidade virtual
   */
  async approveProtocol(input: ApproveProtocolInput) {
    const { protocolId, userId, comment, additionalData } = input;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: { service: true }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    // Ativar entidade virtual no customData se for COM_DADOS
    if (protocol.service.serviceType === 'COM_DADOS' && protocol.customData) {
      await prisma.$transaction(async (tx) => {
        const customData = protocol.customData as Record<string, any>;

        // Atualizar metadados da entidade virtual
        const updatedCustomData = {
          ...customData,
          _meta: {
            ...(customData._meta || {}),
            status: 'ACTIVE',
            isActive: true,
            approvedAt: new Date().toISOString(),
            approvedBy: userId
          }
        };

        // Atualizar protocolo com customData atualizado
        await tx.protocolSimplified.update({
          where: { id: protocolId },
          data: {
            customData: updatedCustomData as Prisma.JsonObject
          }
        });

        // ✅ F5 — Materializar no Registry na MESMA transação (atrás de
        // REGISTRY_WRITE; não-fatal). Torna Imóvel/Empresa/Produtor entidades
        // de 1ª classe consultáveis, com dedup por CPF/CNPJ e relações.
        await materializeOnApproval(
          {
            protocolId,
            entityTypeCode: protocol.moduleType || protocol.service.moduleType || 'GENERICO',
            customData: updatedCustomData,
            citizenId: protocol.citizenId,
            status: 'ACTIVE',
          },
          tx
        );
      });
    }

    // Usar motor centralizado de status
    const result = await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.CONCLUIDO,
      actorId: userId,
      actorRole: UserRole.USER,
      comment: comment || 'Protocolo aprovado e concluído',
      metadata: {
        action: 'approval',
        additionalData
      }
    });

    // ⭐ HOOK: cadastros aprovados viram entidade do app de secretaria
    // (produtor/propriedade rural). NÃO-FATAL, padrão materializeOnApproval.
    try {
      const { convertProtocolToAppOnApproval } = await import('./apps/protocol-to-app.service');
      await convertProtocolToAppOnApproval(protocolId);
    } catch (error) {
      console.error('❌ Erro ao converter protocolo aprovado para app de secretaria (não-fatal):', error);
    }

    return result.protocol;
  }

  /**
   * Rejeitar protocolo
   */
  async rejectProtocol(input: RejectProtocolInput) {
    const { protocolId, userId, reason } = input;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    // Usar motor centralizado de status (PENDENCIA para rejeição)
    const result = await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.PENDENCIA,
      actorId: userId,
      actorRole: UserRole.USER,
      comment: `Protocolo rejeitado: ${reason}`,
      reason,
      metadata: {
        action: 'rejection'
      }
    });

    return result.protocol;
  }

  /**
   * Buscar protocolos pendentes por tipo de módulo
   */
  async getPendingProtocolsByModule(
    moduleType: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where: {
          moduleType,
          status: ProtocolStatus.VINCULADO
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
            }
          },
          department: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.protocolSimplified.count({
        where: {
          moduleType,
          status: ProtocolStatus.VINCULADO
        }
      }),
    ]);

    return {
      protocols,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar dados da entidade virtual de um protocolo
   */
  async getVirtualEntity(protocolId: string) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: {
        service: true,
        citizen: true
      }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    if (!protocol.customData) {
      return null;
    }

    const customData = protocol.customData as Record<string, any>;
    const { _meta, ...entityData } = customData;

    return {
      protocolId: protocol.id,
      protocolNumber: protocol.number,
      entityType: protocol.moduleType,
      entityData,
      meta: _meta,
      service: protocol.service,
      citizen: {
        id: protocol.citizen.id,
        name: protocol.citizen.name,
        cpf: protocol.citizen.cpf
      }
    };
  }

  /**
   * Atualizar dados da entidade virtual
   */
  async updateVirtualEntity(
    protocolId: string,
    updates: Record<string, any>,
    userId: string
  ) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    const customData = (protocol.customData as Record<string, any>) || {};
    const { _meta, ...currentData } = customData;

    const updatedCustomData = {
      ...currentData,
      ...updates,
      _meta: {
        ...(_meta || {}),
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    };

    const updatedProtocol = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        customData: updatedCustomData as Prisma.JsonObject
      }
    });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'ENTITY_UPDATED',
        comment: 'Dados da entidade virtual atualizados',
        userId
      }
    });

    return updatedProtocol;
  }
}

export const protocolModuleService = new ProtocolModuleService();
