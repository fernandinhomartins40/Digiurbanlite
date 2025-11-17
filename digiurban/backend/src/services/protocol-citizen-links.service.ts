/**
 * ============================================================================
 * PROTOCOL CITIZEN LINKS SERVICE
 * ============================================================================
 * Serviço centralizado para processar vinculação de cidadãos em protocolos
 * com base na configuração linkedCitizensConfig do serviço.
 */

import { prisma } from '../lib/prisma';
import { CitizenLinkType, ServiceRole } from '@prisma/client';

interface LinkedCitizenLinkConfig {
  linkType: CitizenLinkType | string;
  role: ServiceRole | string;
  label: string;
  description?: string;
  required?: boolean;
  mapFromLegacyFields?: {
    cpf?: string;
    name?: string;
    birthDate?: string;
    [key: string]: string | undefined;
  };
  contextFields?: Array<{
    id: string;
    sourceField?: string;
    value?: any;
  }>;
  expectedRelationships?: string[];
}

interface LinkedCitizenConfig {
  enabled: boolean;
  links: LinkedCitizenLinkConfig[];
}

interface CitizenLinkData {
  linkedCitizenId: string;
  linkType: CitizenLinkType;
  relationship?: string;
  role: ServiceRole;
  contextData?: any;
  isVerified?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

/**
 * Processa automaticamente os citizen links para um protocolo
 * baseado na configuração do serviço e nos dados do formulário
 */
export async function processProtocolCitizenLinks(
  protocolId: string,
  serviceId: string,
  citizenId: string,
  formData: any,
  userId?: string
): Promise<CitizenLinkData[]> {
  try {
    // 1. Buscar configuração do serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      select: { linkedCitizensConfig: true }
    });

    if (!service || !service.linkedCitizensConfig) {
      console.log('[protocol-citizen-links] Service has no linkedCitizensConfig');
      return [];
    }

    const config = service.linkedCitizensConfig as unknown as LinkedCitizenConfig;

    if (!config.enabled || !config.links || config.links.length === 0) {
      console.log('[protocol-citizen-links] Citizen links not enabled for service');
      return [];
    }

    const createdLinks: CitizenLinkData[] = [];

    // 2. Processar cada configuração de link
    for (const linkConfig of config.links) {
      // 2.1 Tentar encontrar cidadão vinculado nos dados do formulário
      let linkedCitizenId: string | null = null;
      let contextData: any = {};

      // Se houver mapeamento de campos legacy, tentar encontrar o cidadão
      if (linkConfig.mapFromLegacyFields) {
        const { cpf, name, birthDate } = linkConfig.mapFromLegacyFields;

        // Buscar por CPF (mais confiável)
        if (cpf && formData[cpf]) {
          const citizen = await prisma.citizen.findFirst({
            where: { cpf: formData[cpf].replace(/\D/g, '') }
          });
          if (citizen) {
            linkedCitizenId = citizen.id;
          }
        }

        // Se não encontrou por CPF, tentar por nome + data nascimento
        if (!linkedCitizenId && name && birthDate && formData[name] && formData[birthDate]) {
          const citizen = await prisma.citizen.findFirst({
            where: {
              name: { contains: formData[name], mode: 'insensitive' },
              birthDate: new Date(formData[birthDate])
            }
          });
          if (citizen) {
            linkedCitizenId = citizen.id;
          }
        }
      }

      // Se linkedCitizenId foi fornecido explicitamente no formData
      if (!linkedCitizenId && formData.linkedCitizenId) {
        linkedCitizenId = formData.linkedCitizenId;
      }

      // Se linkedCitizens foi fornecido (array de IDs)
      if (!linkedCitizenId && formData.linkedCitizens && Array.isArray(formData.linkedCitizens)) {
        // Pegar o primeiro cidadão vinculado do tipo correto
        const matchingLink = formData.linkedCitizens.find(
          (link: any) => link.linkType === linkConfig.linkType
        );
        if (matchingLink) {
          linkedCitizenId = matchingLink.linkedCitizenId;
          if (matchingLink.contextData) {
            contextData = matchingLink.contextData;
          }
        }
      }

      // Se não encontrou cidadão e é obrigatório, pular
      if (!linkedCitizenId) {
        if (linkConfig.required) {
          console.warn(`[protocol-citizen-links] Required citizen link not found: ${linkConfig.linkType}`);
        }
        continue;
      }

      // 2.2 Coletar campos de contexto do formulário
      if (linkConfig.contextFields) {
        for (const field of linkConfig.contextFields) {
          if (field.sourceField && formData[field.sourceField] !== undefined) {
            contextData[field.id] = formData[field.sourceField];
          } else if (field.value !== undefined) {
            contextData[field.id] = field.value;
          }
        }
      }

      // 2.3 Verificar relacionamento na composição familiar
      let isVerified = false;
      let relationship: string | undefined;

      if (linkConfig.expectedRelationships && linkConfig.expectedRelationships.length > 0) {
        const familyLink = await prisma.familyComposition.findFirst({
          where: {
            headId: citizenId,
            memberId: linkedCitizenId,
            relationship: { in: linkConfig.expectedRelationships as any }
          }
        });

        if (familyLink) {
          isVerified = true;
          relationship = familyLink.relationship;
        }
      }

      // 2.4 Criar vínculo
      const link = await prisma.protocolCitizenLink.create({
        data: {
          protocolId,
          linkedCitizenId,
          linkType: linkConfig.linkType as CitizenLinkType,
          relationship,
          role: linkConfig.role as ServiceRole,
          contextData: Object.keys(contextData).length > 0 ? contextData : null,
          isVerified,
          verifiedAt: isVerified ? new Date() : null,
          verifiedBy: isVerified && userId ? userId : null
        }
      });

      createdLinks.push({
        linkedCitizenId: link.linkedCitizenId,
        linkType: link.linkType,
        relationship: link.relationship || undefined,
        role: link.role,
        contextData: link.contextData || undefined,
        isVerified: link.isVerified,
        verifiedAt: link.verifiedAt || undefined,
        verifiedBy: link.verifiedBy || undefined
      });

      console.log(`[protocol-citizen-links] Created link: ${link.linkType} for protocol ${protocolId}`);
    }

    return createdLinks;
  } catch (error) {
    console.error('[protocol-citizen-links] Error processing citizen links:', error);
    throw error;
  }
}

/**
 * Busca todos os citizen links de um protocolo
 */
export async function getProtocolCitizenLinks(protocolId: string) {
  return await prisma.protocolCitizenLink.findMany({
    where: { protocolId },
    include: {
      linkedCitizen: {
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          phone: true,
          birthDate: true,
          rg: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Atualiza um citizen link existente
 */
export async function updateProtocolCitizenLink(
  linkId: string,
  data: {
    linkType?: CitizenLinkType;
    relationship?: string;
    role?: ServiceRole;
    contextData?: any;
  }
) {
  return await prisma.protocolCitizenLink.update({
    where: { id: linkId },
    data: {
      ...(data.linkType && { linkType: data.linkType }),
      ...(data.relationship !== undefined && { relationship: data.relationship }),
      ...(data.role && { role: data.role }),
      ...(data.contextData !== undefined && { contextData: data.contextData })
    },
    include: {
      linkedCitizen: {
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          phone: true,
          birthDate: true
        }
      }
    }
  });
}

/**
 * Remove um citizen link
 */
export async function deleteProtocolCitizenLink(linkId: string) {
  return await prisma.protocolCitizenLink.delete({
    where: { id: linkId }
  });
}
