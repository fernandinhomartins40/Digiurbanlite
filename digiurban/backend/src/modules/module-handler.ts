/**
 * ============================================================================
 * MODULE HANDLER - Sistema de Roteamento Automático de Módulos
 * ============================================================================
 *
 * Este é o CORAÇÃO do sistema DigiUrban. Ele detecta automaticamente qual
 * módulo usar baseado no serviceType/moduleType e executa as ações corretas.
 *
 * ARQUITETURA:
 *
 * 1. Cidadão solicita serviço → POST /api/citizen/services/:id/request
 * 2. Sistema detecta service.moduleType (ex: "education")
 * 3. ModuleHandler roteia para o handler correto
 * 4. Handler cria Protocol + Entidade específica (ex: StudentEnrollment)
 * 5. Dados persistidos com vínculo protocolId
 * 6. Admin gerencia no painel especializado
 *
 * MÓDULOS SUPORTADOS:
 * - education: Secretaria de Educação
 * - health: Secretaria de Saúde
 * - housing: Secretaria de Habitação
 * - social: Assistência Social
 * - culture: Secretaria de Cultura
 * - sports: Secretaria de Esporte
 * - environment: Meio Ambiente
 * - security: Segurança Pública
 * - urban_planning: Planejamento Urbano
 * - agriculture: Agricultura
 * - tourism: Turismo
 * - public_works: Obras Públicas
 * - public_services: Serviços Públicos
 * - custom: Módulos customizados (tabelas dinâmicas)
 *
 * @author DigiUrban Team
 * @version 2.0
 */

import { prisma } from '../lib/prisma';
import type { ModuleExecutionContext, ModuleExecutionResult, ModuleType } from './types';

// ============================================================================
// MODULE HANDLER CLASS
// ============================================================================

export class ModuleHandler {
  /**
   * Executa ação no módulo apropriado
   */
  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { service } = context;

    try {
      // Se não tem moduleType, é um serviço genérico (sem persistência especializada)
      if (!service.moduleType) {
        return {
          success: true,
          entityType: 'generic'
        };
      }

      // Rotear para o handler correto
      switch (service.moduleType as ModuleType) {
        case 'education':
          return await this.handleEducation(context);

        case 'health':
          return await this.handleHealth(context);

        case 'housing':
          return await this.handleHousing(context);

        case 'social':
          return await this.handleSocial(context);

        case 'culture':
          return await this.handleCulture(context);

        case 'sports':
          return await this.handleSports(context);

        case 'environment':
          return await this.handleEnvironment(context);

        case 'security':
          return await this.handleSecurity(context);

        case 'urban_planning':
          return await this.handleUrbanPlanning(context);

        case 'agriculture':
          return await this.handleAgriculture(context);

        case 'tourism':
          return await this.handleTourism(context);

        case 'public_works':
          return await this.handlePublicWorks(context);

        case 'public_services':
          return await this.handlePublicServices(context);

        case 'custom':
          return await this.handleCustomModule(context);

        default:
          throw new Error(`Módulo desconhecido: ${service.moduleType}`);
      }
    } catch (error) {
      console.error('Erro no ModuleHandler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
  }

  // ==========================================================================
  // HANDLERS ESPECIALIZADOS POR SECRETARIA
  // ==========================================================================

  /**
   * EDUCAÇÃO - Matrículas, transferências, transporte escolar
   */
  private static async handleEducation(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    // Detectar qual entidade criar baseado no moduleEntity
    switch (service.moduleEntity) {
      case 'StudentEnrollment':
        // Criar matrícula escolar
        const enrollment = await prisma.studentEnrollment.create({
          data: {
                        protocol: protocol.number,
            studentName: requestData.studentName,
            birthDate: requestData.birthDate ? new Date(requestData.birthDate) : null,
            parentName: requestData.parentName,
            parentCpf: requestData.parentCpf,
            parentPhone: requestData.parentPhone,
            desiredGrade: requestData.desiredGrade,
            desiredShift: requestData.desiredShift,
            hasSpecialNeeds: requestData.hasSpecialNeeds || false,
            specialNeedsDescription: requestData.specialNeedsDescription,
            previousSchool: requestData.previousSchool,
            address: requestData.address,
            status: 'PENDING',
            enrollmentYear: new Date().getFullYear()
        } as any
      });

        return {
          success: true,
          entityId: enrollment.id,
          entityType: 'StudentEnrollment',
          data: enrollment
        };

      case 'SchoolTransport':
        // Criar solicitação de transporte escolar
        const transport = await prisma.schoolTransport.create({
          data: {
                        protocol: protocol.number,
            studentName: requestData.studentName,
            schoolName: requestData.schoolName,
            address: requestData.address,
            route: requestData.route,
            shift: requestData.shift,
            status: 'PENDING'
        } as any
      });

        return {
          success: true,
          entityId: transport.id,
          entityType: 'SchoolTransport',
          data: transport
        };

      default:
        // Criar registro genérico de educação
        const genericEdu = await prisma.studentAttendance.create({
          data: {
                        protocol: protocol.number,
            studentName: requestData.studentName || 'Não informado',
            description: protocol.description,
            status: 'PENDING',
            requestType: service.moduleEntity || 'OTHER'
        } as any
      });

        return {
          success: true,
          entityId: genericEdu.id,
          entityType: 'StudentAttendance',
          data: genericEdu
        };
      }
  }

  /**
   * SAÚDE - Consultas, exames, medicamentos
   */
  private static async handleHealth(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    switch (service.moduleEntity) {
      case 'Appointment':
        // Criar agendamento de consulta
        const appointment = await prisma.healthAppointment.create({
          data: {
                        protocol: protocol.number,
            patientName: requestData.patientName,
            patientCpf: requestData.patientCpf,
            specialty: requestData.specialty,
            preferredDate: requestData.preferredDate ? new Date(requestData.preferredDate) : null,
            preferredShift: requestData.preferredShift,
            symptoms: requestData.symptoms,
            urgency: requestData.urgency || 'NORMAL',
            status: 'PENDING'
        } as any
      });

        return {
          success: true,
          entityId: appointment.id,
          entityType: 'HealthAppointment',
          data: appointment
        };

      case 'MedicineRequest':
        // Criar solicitação de medicamento
        const medicineRequest = await prisma.medicationDispensing.create({
          data: {
                        protocol: protocol.number,
            patientName: requestData.patientName,
            patientCpf: requestData.patientCpf,
            medication: requestData.medication,
            prescription: requestData.prescription,
            quantity: requestData.quantity,
            status: 'PENDING'
        } as any
      });

        return {
          success: true,
          entityId: medicineRequest.id,
          entityType: 'MedicineRequest',
          data: medicineRequest
        };

      default:
        // Atendimento genérico de saúde
        const genericHealth = await prisma.healthAttendance.create({
          data: {
                        protocol: protocol.number,
            patientName: requestData.patientName || 'Não informado',
            description: protocol.description,
            status: 'PENDING',
            attendanceType: service.moduleEntity || 'OTHER'
        } as any
      });

        return {
          success: true,
          entityId: genericHealth.id,
          entityType: 'HealthAttendance',
          data: genericHealth
        };
      }
  }

  /**
   * HABITAÇÃO - MCMV, regularização, auxílio aluguel
   */
  private static async handleHousing(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers especializados
    const {
      HousingApplicationHandler,
      LotApplicationHandler,
      RegularizationHandler,
      HousingAidHandler
        } = await import('./handlers/housing/index');

    // Rotear para o handler apropriado baseado no moduleEntity
    if (HousingApplicationHandler.canHandle(service.moduleEntity)) {
      return await HousingApplicationHandler.execute(context);
    }
    if (LotApplicationHandler.canHandle(service.moduleEntity)) {
      return await LotApplicationHandler.execute(context);
    }
    if (RegularizationHandler.canHandle(service.moduleEntity)) {
      return await RegularizationHandler.execute(context);
    }
    if (HousingAidHandler.canHandle(service.moduleEntity)) {
      return await HousingAidHandler.execute(context);
    }

    // Fallback: atendimento genérico de habitação
    const { protocol, requestData } = context;
    const genericHousing = await prisma.housingAttendance.create({
      data: {
                protocol: protocol.number,
        applicantName: requestData.applicantName || requestData.citizenName || 'Não informado',
        description: protocol.description,
        status: 'PENDING',
        requestType: service.moduleEntity || 'OTHER'
        } as any
      });

    return {
      success: true,
      entityId: genericHousing.id,
      entityType: 'HousingAttendance',
      data: genericHousing
        };
  }

  /**
   * ASSISTÊNCIA SOCIAL - Benefícios, cesta básica, cadastro único
   */
  private static async handleSocial(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, requestData } = context;

    // Criar solicitação de benefício
    const benefitRequest = await prisma.socialAssistanceAttendance.create({
      data: {
                protocol: protocol.number,
        citizenName: requestData.citizenName || 'Não informado',
        description: protocol.description,
        benefitType: requestData.benefitType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: benefitRequest.id,
      entityType: 'SocialAssistance',
      data: benefitRequest
        };
  }

  /**
   * CULTURA - Oficinas, eventos, espaços culturais
   */
  private static async handleCulture(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers
    const {
      CulturalSpaceHandler,
      CulturalProjectHandler,
      CulturalEventHandler,
      CulturalWorkshopHandler
        } = require('./handlers/culture');

    // Rotear para handler específico baseado em moduleEntity
    if (CulturalSpaceHandler.canHandle(service.moduleEntity)) {
      return await CulturalSpaceHandler.execute(context);
    }
    if (CulturalProjectHandler.canHandle(service.moduleEntity)) {
      return await CulturalProjectHandler.execute(context);
    }
    if (CulturalEventHandler.canHandle(service.moduleEntity)) {
      return await CulturalEventHandler.execute(context);
    }
    if (CulturalWorkshopHandler.canHandle(service.moduleEntity)) {
      return await CulturalWorkshopHandler.execute(context);
    }

    // Fallback genérico
    const { protocol, requestData } = context;
    const culturalAttendance = await prisma.culturalAttendance.create({
      data: {
                protocol: protocol.number,
        citizenId: context.citizenId,
        citizenName: requestData.citizenName || 'Não informado',
        contact: requestData.phone || '',
        phone: requestData.phone || '',
        email: requestData.email,
        type: 'informacoes',
        subject: service.name,
        description: protocol.description,
        status: 'PENDING',
        serviceId: service.id,
        source: 'portal'
        } as any
      });

    return {
      success: true,
      entityId: culturalAttendance.id,
      entityType: 'CulturalAttendance',
      data: culturalAttendance
        };
  }

  /**
   * ESPORTE - Escolinhas, campeonatos, reserva de quadras
   */
  private static async handleSports(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers
    const {
      SportsTeamHandler,
      AthleteHandler,
      CompetitionHandler
        } = require('./handlers/sports');

    // Rotear para handler específico baseado em moduleEntity
    if (SportsTeamHandler.canHandle(service.moduleEntity)) {
      return await SportsTeamHandler.execute(context);
    }
    if (AthleteHandler.canHandle(service.moduleEntity)) {
      return await AthleteHandler.execute(context);
    }
    if (CompetitionHandler.canHandle(service.moduleEntity)) {
      return await CompetitionHandler.execute(context);
    }

    // Fallback genérico
    const { protocol, requestData } = context;
    const sportsAttendance = await prisma.sportsAttendance.create({
      data: {
                protocol: protocol.number,
        citizenId: context.citizenId,
        serviceType: 'informacoes',
        description: protocol.description,
        sport: requestData.sport,
        serviceId: service.id,
        source: 'portal'
        } as any
      });

    return {
      success: true,
      entityId: sportsAttendance.id,
      entityType: 'SportsAttendance',
      data: sportsAttendance
        };
  }

  /**
   * MEIO AMBIENTE - Licenças, denúncias, plantio de árvores
   */
  private static async handleEnvironment(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, requestData } = context;

    const environmentAttendance = await prisma.environmentalAttendance.create({
      data: {
                protocol: protocol.number,
        requesterName: requestData.requesterName || 'Não informado',
        description: protocol.description,
        requestType: requestData.requestType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: environmentAttendance.id,
      entityType: 'EnvironmentAttendance',
      data: environmentAttendance
        };
  }

  /**
   * SEGURANÇA PÚBLICA - Boletins, câmeras, rondas - FASE 7
   */
  private static async handleSecurity(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers especializados de segurança
    const {
      PoliceReportHandler,
      PatrolRequestHandler,
      CameraRequestHandler,
      AnonymousTipHandler
        } = await import('./security/index');

    // Criar instâncias dos handlers
    const policeReportHandler = new PoliceReportHandler();
    const patrolRequestHandler = new PatrolRequestHandler();
    const cameraRequestHandler = new CameraRequestHandler();
    const anonymousTipHandler = new AnonymousTipHandler();

    // Preparar ação do módulo
    const moduleAction = {
      type: 'security',
      entity: service.moduleEntity || '',
      action: 'create',
      data: context.requestData,
      protocol: context.protocol.number,
      serviceId: service.id
    };

    // Rotear para o handler apropriado baseado no moduleEntity
    let result;

    if (policeReportHandler.canHandle(moduleAction)) {
      result = await policeReportHandler.execute(moduleAction, prisma);
    } else if (patrolRequestHandler.canHandle(moduleAction)) {
      result = await patrolRequestHandler.execute(moduleAction, prisma);
    } else if (cameraRequestHandler.canHandle(moduleAction)) {
      result = await cameraRequestHandler.execute(moduleAction, prisma);
    } else if (anonymousTipHandler.canHandle(moduleAction)) {
      result = await anonymousTipHandler.execute(moduleAction, prisma);
    } else {
      // Fallback: criar em tabela genérica de segurança (se existir)
      try {
        const securityAttendance = await prisma.securityAttendance.create({
          data: {
            protocol: context.protocol.number,
            reporterName: context.requestData.reporterName || 'Não informado',
            description: context.protocol.description,
            incidentType: context.requestData.incidentType || 'OTHER',
            status: 'PENDING'
        } as any
      });

        return {
          success: true,
          entityId: securityAttendance.id,
          entityType: 'SecurityAttendance',
          data: securityAttendance
        };
      } catch (error) {
        // Se SecurityAttendance não existe, retornar sucesso genérico
        console.warn('SecurityAttendance model not found, using generic response');
        return {
          success: true,
          entityType: 'SecurityGeneric'
        };
      }
    }

    // Retornar resultado do handler especializado
    return {
      success: result.success,
      entityId: result.policeReport?.id || result.patrolRequest?.id || result.cameraRequest?.id || result.anonymousTip?.id,
      entityType: service.moduleEntity,
      data: result
        };
  }

  /**
   * PLANEJAMENTO URBANO - Alvarás, certidões, projetos
   */
  private static async handleUrbanPlanning(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, requestData } = context;

    const urbanAttendance = await prisma.urbanPlanningAttendance.create({
      data: {
                protocol: protocol.number,
        requesterName: requestData.requesterName || 'Não informado',
        description: protocol.description,
        requestType: requestData.requestType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: urbanAttendance.id,
      entityType: 'UrbanPlanningAttendance',
      data: urbanAttendance
        };
  }

  /**
   * AGRICULTURA - Assistência técnica, sementes, análise de solo
   */
  private static async handleAgriculture(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, requestData } = context;

    const agricultureAttendance = await prisma.agricultureAttendance.create({
      data: {
                protocol: protocol.number,
        producerName: requestData.producerName || 'Não informado',
        description: protocol.description,
        serviceType: requestData.serviceType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: agricultureAttendance.id,
      entityType: 'AgricultureAttendance',
      data: agricultureAttendance
        };
  }

  /**
   * TURISMO - Cadastro de hotéis, guias, eventos
   */
  private static async handleTourism(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers
    const {
      TouristAttractionHandler,
      LocalBusinessHandler,
      TourismProgramHandler
        } = require('./handlers/tourism');

    // Rotear para handler específico baseado em moduleEntity
    if (TouristAttractionHandler.canHandle(service.moduleEntity)) {
      return await TouristAttractionHandler.execute(context);
    }
    if (LocalBusinessHandler.canHandle(service.moduleEntity)) {
      return await LocalBusinessHandler.execute(context);
    }
    if (TourismProgramHandler.canHandle(service.moduleEntity)) {
      return await TourismProgramHandler.execute(context);
    }

    // Fallback genérico
    const { protocol, requestData } = context;
    const tourismAttendance = await prisma.tourismAttendance.create({
      data: {
                protocol: protocol.number,
        citizenId: context.citizenId,
        serviceType: 'informacoes_turisticas',
        subject: service.name,
        description: protocol.description,
        serviceId: service.id,
        source: 'portal'
        } as any
      });

    return {
      success: true,
      entityId: tourismAttendance.id,
      entityType: 'TourismAttendance',
      data: tourismAttendance
        };
  }

  /**
   * OBRAS PÚBLICAS - Buracos, iluminação, pavimentação
   */
  private static async handlePublicWorks(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers especializados
    const { InfrastructureProblemHandler } = await import('./handlers/public-works/infrastructure-problem-handler');
    const { StreetMaintenanceHandler } = await import('./handlers/public-works/street-maintenance-handler');
    const { AccessibilityHandler } = await import('./handlers/public-works/accessibility-handler');
    const { SignageHandler } = await import('./handlers/public-works/signage-handler');

    // Rotear para o handler apropriado baseado no moduleEntity
    if (InfrastructureProblemHandler.canHandle(service.moduleEntity)) {
      return await InfrastructureProblemHandler.execute(context);
    }
    if (StreetMaintenanceHandler.canHandle(service.moduleEntity)) {
      return await StreetMaintenanceHandler.execute(context);
    }
    if (AccessibilityHandler.canHandle(service.moduleEntity)) {
      return await AccessibilityHandler.execute(context);
    }
    if (SignageHandler.canHandle(service.moduleEntity)) {
      return await SignageHandler.execute(context);
    }

    // Fallback: usar modelo genérico
    const { protocol, requestData } = context;
    const worksAttendance = await prisma.publicWorksAttendance.create({
      data: {
                protocol: protocol.number,
        reporterName: requestData.reporterName || 'Não informado',
        description: protocol.description,
        problemType: requestData.problemType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: worksAttendance.id,
      entityType: 'PublicWorksAttendance',
      data: worksAttendance
        };
  }

  /**
   * SERVIÇOS PÚBLICOS - Poda, limpeza, entulho
   */
  private static async handlePublicServices(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { service } = context;

    // Importar handlers especializados
    const {
      TreePruningHandler,
      WasteRemovalHandler,
      PestControlHandler,
      CleaningHandler,
      GarbageCollectionHandler
        } = await import('./handlers/public-services/index');

    // Rotear para o handler apropriado baseado no moduleEntity
    if (TreePruningHandler.canHandle(service.moduleEntity)) {
      return await TreePruningHandler.execute(context);
    }
    if (WasteRemovalHandler.canHandle(service.moduleEntity)) {
      return await WasteRemovalHandler.execute(context);
    }
    if (PestControlHandler.canHandle(service.moduleEntity)) {
      return await PestControlHandler.execute(context);
    }
    if (CleaningHandler.canHandle(service.moduleEntity)) {
      return await CleaningHandler.execute(context);
    }
    if (GarbageCollectionHandler.canHandle(service.moduleEntity)) {
      return await GarbageCollectionHandler.execute(context);
    }

    // Fallback: usar modelo genérico
    const { protocol, requestData } = context;
    const servicesAttendance = await prisma.publicWorksAttendance.create({
      data: {
                protocol: protocol.number,
        requesterName: requestData.requesterName || 'Não informado',
        description: protocol.description,
        serviceType: requestData.serviceType || 'OTHER',
        status: 'PENDING'
        } as any
      });

    return {
      success: true,
      entityId: servicesAttendance.id,
      entityType: 'PublicServicesAttendance',
      data: servicesAttendance
        };
  }

  /**
   * MÓDULOS CUSTOMIZADOS - Tabelas flexíveis
   */
  private static async handleCustomModule(
    context: ModuleExecutionContext
  ): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    // Buscar ou criar tabela customizada
    let customTable = await prisma.customDataTable.findFirst({
      where: {
                moduleType: service.moduleEntity || 'generic'
      }
      });

    // Se não existe, criar tabela dinâmica
    if (!customTable) {
      customTable = await prisma.customDataTable.create({
        data: {
                    tableName: `custom_${service.moduleEntity?.toLowerCase() || 'generic'}`,
          displayName: service.name,
          moduleType: service.moduleEntity || 'generic',
          schema: service.fieldMapping || {},
          fields: service.fieldMapping || {}, // Campo obrigatório - definição dos campos
      }
      });
    }

    // Criar registro na tabela customizada
    const customRecord = await prisma.customDataRecord.create({
      data: {
        tableId: customTable.id,
        protocol: protocol.number,
        serviceId: service.id,
        data: requestData
      }
      });

    return {
      success: true,
      entityId: customRecord.id,
      entityType: 'CustomDataRecord',
      data: customRecord
        };
      }
}
