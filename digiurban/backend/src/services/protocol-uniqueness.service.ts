import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Resultado da validação de unicidade
 */
export interface UniquenessValidationResult {
  canCreate: boolean;
  reason?: string;
  errorMessage?: string;
  existingProtocolNumber?: string;
}

/**
 * Regras de unicidade para escopo CUSTOM
 */
interface CustomUniquenessRules {
  moduleType: string;
  validationFunction: string; // Nome da função de validação customizada
  errorMessage?: string;
}

/**
 * Regras de unicidade para escopo CITIZEN_PER_FIELD
 */
interface FieldUniquenessRules {
  field: string; // Campo do customData a ser verificado (ex: "cpfDependente")
  fieldLabel: string; // Label do campo para mensagens de erro
  errorMessage?: string;
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

/**
 * Valida se um cidadão pode criar um novo protocolo para um serviço
 */
export async function validateProtocolUniqueness(
  citizenId: string,
  serviceId: string,
  customData?: any
): Promise<UniquenessValidationResult> {
  try {
    // Buscar configuração do serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        allowMultipleActiveProtocols: true,
        uniquenessScope: true,
        uniquenessRules: true,
        moduleType: true,
      },
    });

    if (!service) {
      return {
        canCreate: false,
        reason: 'SERVICE_NOT_FOUND',
        errorMessage: 'Serviço não encontrado',
      };
    }

    // Se permite múltiplos protocolos ativos, liberar imediatamente
    if (service.allowMultipleActiveProtocols) {
      return { canCreate: true };
    }

    // Se não permite múltiplos, mas não tem escopo definido, assumir escopo CITIZEN
    const scope = service.uniquenessScope || 'CITIZEN';

    // Validar conforme escopo
    switch (scope) {
      case 'CITIZEN':
        return await validateCitizenScope(citizenId, serviceId, service.name);

      case 'CUSTOM':
        return await validateCustomScope(
          citizenId,
          serviceId,
          service.name,
          service.moduleType,
          service.uniquenessRules as unknown as CustomUniquenessRules,
          customData
        );

      case 'CITIZEN_PER_FIELD':
        return await validateFieldScope(
          citizenId,
          serviceId,
          service.name,
          service.uniquenessRules as unknown as FieldUniquenessRules,
          customData
        );

      default:
        console.warn(
          `[UNIQUENESS] Escopo desconhecido: ${scope}. Liberando criação.`
        );
        return { canCreate: true };
    }
  } catch (error) {
    console.error('[UNIQUENESS] Erro ao validar unicidade:', error);
    // Em caso de erro, liberar criação (fail-safe)
    return {
      canCreate: true,
      reason: 'VALIDATION_ERROR',
    };
  }
}

// ============================================================================
// VALIDADORES POR ESCOPO
// ============================================================================

/**
 * Escopo CITIZEN: 1 protocolo ativo por cidadão
 */
async function validateCitizenScope(
  citizenId: string,
  serviceId: string,
  serviceName: string
): Promise<UniquenessValidationResult> {
  const activeProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      serviceId,
      status: {
        in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'],
      },
    },
    select: {
      number: true,
      status: true,
    },
  });

  if (activeProtocol) {
    return {
      canCreate: false,
      reason: 'ACTIVE_PROTOCOL_EXISTS',
      errorMessage: `Você já possui uma solicitação ativa de "${serviceName}" (Protocolo: ${activeProtocol.number}). Aguarde a conclusão antes de solicitar novamente.`,
      existingProtocolNumber: activeProtocol.number,
    };
  }

  return { canCreate: true };
}

/**
 * Escopo CUSTOM: Validação específica por módulo
 */
async function validateCustomScope(
  citizenId: string,
  serviceId: string,
  serviceName: string,
  moduleType: string | null,
  rules: CustomUniquenessRules,
  customData?: any
): Promise<UniquenessValidationResult> {
  if (!moduleType || !rules) {
    console.warn(
      '[UNIQUENESS] Escopo CUSTOM sem moduleType ou rules. Liberando criação.'
    );
    return { canCreate: true };
  }

  // Roteamento para validações customizadas por módulo
  switch (moduleType) {
    case 'CADASTRO_PRODUTOR':
      return await validateCadastroProdutor(citizenId, serviceId, serviceName);

    case 'CADASTRO_PROPRIEDADE':
      return await validateCadastroPropriedade(
        citizenId,
        serviceId,
        serviceName,
        customData
      );

    case 'LICENCA_FUNCIONAMENTO':
      return await validateLicencaFuncionamento(
        citizenId,
        serviceId,
        serviceName,
        customData
      );

    default:
      console.warn(
        `[UNIQUENESS] Módulo ${moduleType} sem validação customizada. Usando validação CITIZEN.`
      );
      return await validateCitizenScope(citizenId, serviceId, serviceName);
  }
}

/**
 * Escopo CITIZEN_PER_FIELD: Validação por campo específico
 */
async function validateFieldScope(
  citizenId: string,
  serviceId: string,
  serviceName: string,
  rules: FieldUniquenessRules,
  customData?: any
): Promise<UniquenessValidationResult> {
  if (!rules || !rules.field) {
    console.warn('[UNIQUENESS] Escopo CITIZEN_PER_FIELD sem field. Liberando criação.');
    return { canCreate: true };
  }

  if (!customData || !customData[rules.field]) {
    // Se não há valor no campo, liberar (pode ser validado em outro lugar)
    return { canCreate: true };
  }

  const fieldValue = customData[rules.field];

  // Buscar protocolo ativo com mesmo valor no campo
  const existingProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      serviceId,
      status: {
        in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'],
      },
      customData: {
        path: [rules.field],
        equals: fieldValue,
      },
    },
    select: {
      number: true,
      status: true,
    },
  });

  if (existingProtocol) {
    const fieldLabel = rules.fieldLabel || rules.field;
    const errorMessage =
      rules.errorMessage ||
      `Você já possui uma solicitação ativa de "${serviceName}" com ${fieldLabel}: ${fieldValue} (Protocolo: ${existingProtocol.number}).`;

    return {
      canCreate: false,
      reason: 'DUPLICATE_FIELD_VALUE',
      errorMessage,
      existingProtocolNumber: existingProtocol.number,
    };
  }

  return { canCreate: true };
}

// ============================================================================
// VALIDAÇÕES CUSTOMIZADAS POR MÓDULO
// ============================================================================

/**
 * CADASTRO_PRODUTOR: 1 cadastro ativo por cidadão
 */
async function validateCadastroProdutor(
  citizenId: string,
  serviceId: string,
  serviceName: string
): Promise<UniquenessValidationResult> {
  // Buscar qualquer cadastro ativo de produtor (mesmo que seja outro serviço do módulo)
  const activeProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      moduleType: 'CADASTRO_PRODUTOR',
      status: {
        in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'],
      },
    },
    select: {
      number: true,
      status: true,
    },
  });

  if (activeProtocol) {
    return {
      canCreate: false,
      reason: 'ACTIVE_PRODUCER_REGISTRATION',
      errorMessage: `Você já possui um cadastro de produtor rural ativo (Protocolo: ${activeProtocol.number}). Aguarde a conclusão antes de solicitar novo cadastro.`,
      existingProtocolNumber: activeProtocol.number,
    };
  }

  return { canCreate: true };
}

/**
 * CADASTRO_PROPRIEDADE: 1 cadastro por endereço específico
 */
async function validateCadastroPropriedade(
  citizenId: string,
  serviceId: string,
  serviceName: string,
  customData?: any
): Promise<UniquenessValidationResult> {
  if (!customData || !customData.enderecoPropriedade) {
    // Se não há endereço, liberar (pode ser validado em outro lugar)
    return { canCreate: true };
  }

  const endereco = customData.enderecoPropriedade;

  // Buscar cadastro ativo com mesmo endereço
  const existingProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      moduleType: 'CADASTRO_PROPRIEDADE',
      status: {
        in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'],
      },
      customData: {
        path: ['enderecoPropriedade'],
        equals: endereco,
      },
    },
    select: {
      number: true,
      customData: true,
    },
  });

  if (existingProtocol) {
    return {
      canCreate: false,
      reason: 'DUPLICATE_PROPERTY_ADDRESS',
      errorMessage: `Você já possui um cadastro ativo para a propriedade no endereço "${endereco}" (Protocolo: ${existingProtocol.number}).`,
      existingProtocolNumber: existingProtocol.number,
    };
  }

  return { canCreate: true };
}

/**
 * LICENCA_FUNCIONAMENTO: 1 licença ativa por CNPJ
 */
async function validateLicencaFuncionamento(
  citizenId: string,
  serviceId: string,
  serviceName: string,
  customData?: any
): Promise<UniquenessValidationResult> {
  if (!customData || !customData.cnpj) {
    // Se não há CNPJ, liberar (pode ser validado em outro lugar)
    return { canCreate: true };
  }

  const cnpj = customData.cnpj;

  // Buscar licença ativa com mesmo CNPJ
  const existingProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      moduleType: 'LICENCA_FUNCIONAMENTO',
      status: {
        in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'],
      },
      customData: {
        path: ['cnpj'],
        equals: cnpj,
      },
    },
    select: {
      number: true,
    },
  });

  if (existingProtocol) {
    return {
      canCreate: false,
      reason: 'DUPLICATE_CNPJ',
      errorMessage: `Você já possui uma solicitação de licença de funcionamento ativa para o CNPJ ${cnpj} (Protocolo: ${existingProtocol.number}).`,
      existingProtocolNumber: existingProtocol.number,
    };
  }

  return { canCreate: true };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se um serviço permite duplicatas
 */
export async function serviceAllowsDuplicates(
  serviceId: string
): Promise<boolean> {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    select: { allowMultipleActiveProtocols: true },
  });

  return service?.allowMultipleActiveProtocols ?? true;
}

/**
 * Busca configuração de unicidade de um serviço
 */
export async function getServiceUniquenessConfig(serviceId: string) {
  return await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    select: {
      allowMultipleActiveProtocols: true,
      uniquenessScope: true,
      uniquenessRules: true,
    },
  });
}
