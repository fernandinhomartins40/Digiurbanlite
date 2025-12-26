/**
 * ============================================================================
 * GEOLOCATION SERVICE
 * ============================================================================
 * Serviço para resolver geolocalização de protocolos com estratégia inteligente
 *
 * Estratégias:
 * 1. user_location: Usuário forneceu localização específica (sempre prioritária)
 * 2. citizen_address: Usa endereço cadastrado do cidadão (com geocodificação automática)
 * 3. none: Sem geolocalização (serviços que não necessitam)
 */

import { PrismaClient } from '@prisma/client';
import { GeocodingService } from './geocoding.service';

interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface GeoResult {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  source: 'user_location' | 'citizen_address' | 'none';
}

export class GeolocationService {
  /**
   * Determina geolocalização do protocolo com estratégia de fallback
   */
  static async resolveProtocolLocation(
    serviceId: string,
    citizenId: string,
    providedLocation: LocationData | undefined,
    prisma: PrismaClient
  ): Promise<GeoResult> {

    // 1. Se usuário forneceu localização específica, usar SEMPRE (prioridade máxima)
    if (providedLocation?.latitude && providedLocation?.longitude) {
      console.log('📍 [Geolocation] Usando localização fornecida pelo usuário');
      return {
        latitude: providedLocation.latitude,
        longitude: providedLocation.longitude,
        address: providedLocation.address || null,
        source: 'user_location'
      };
    }

    // 2. Verificar se serviço REQUER geolocalização específica
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        moduleType: true,
        category: true,
      }
    });

    if (!service) {
      console.log('⚠️ [Geolocation] Serviço não encontrado');
      return {
        latitude: null,
        longitude: null,
        address: null,
        source: 'none'
      };
    }

    const requiresSpecificLocation = this.serviceRequiresSpecificLocation(service);

    // 3. Se serviço NÃO requer localização específica, usar endereço do cidadão
    if (!requiresSpecificLocation) {
      console.log(`📍 [Geolocation] Serviço "${service.name}" não requer localização específica, usando endereço do cidadão`);
      return await this.getCitizenAddressLocation(citizenId, prisma);
    }

    // 4. Serviço requer localização específica mas não foi fornecida
    console.log(`⚠️ [Geolocation] Serviço "${service.name}" requer localização específica mas não foi fornecida`);
    return {
      latitude: null,
      longitude: null,
      address: null,
      source: 'none'
    };
  }

  /**
   * Serviços que NECESSITAM geolocalização específica do problema
   */
  private static serviceRequiresSpecificLocation(service: any): boolean {
    // Lista de módulos que SEMPRE requerem localização específica
    const REQUIRES_SPECIFIC_LOCATION = [
      // Obras Públicas
      'SOLICITACAO_REPARO_VIA',        // Tapa-buraco, pavimentação
      'VISTORIA_TECNICA_OBRAS',        // Vistoria de obras
      'APROVACAO_PROJETO_CONSTRUCAO',  // Aprovação de projeto

      // Serviços Públicos
      'DESOBSTRUCAO_BUEIRO',           // Bueiro obstruído
      'SOLICITACAO_PODA',              // Poda de árvore
      'SOLICITACAO_ILUMINACAO',        // Iluminação pública
      'SOLICITACAO_SINALIZACAO',       // Sinalização viária
      'SOLICITACAO_SEMAFORO',          // Semáforo
      'COLETA_ENTULHO',                // Coleta de entulho
      'LIMPEZA_TERRENO',               // Limpeza de terreno

      // Meio Ambiente
      'DENUNCIA_AMBIENTAL',            // Denúncia ambiental
      'SOLICITACAO_ANALISE_AMBIENTAL', // Análise ambiental

      // Fiscalização
      'FISCALIZACAO_OBRA',             // Fiscalização de obra
      'FISCALIZACAO_POSTURA',          // Fiscalização de postura
      'FISCALIZACAO_SANITARIA',        // Fiscalização sanitária
    ];

    // Verificar se o moduleType está na lista
    if (service?.moduleType && REQUIRES_SPECIFIC_LOCATION.includes(service.moduleType)) {
      return true;
    }

    // Fallback: categorias que geralmente precisam de localização específica
    const CATEGORIES_REQUIRING_LOCATION = [
      'Manutenção',
      'Vistoria',
      'Fiscalização',
      'Limpeza',
      'Poda',
      'Iluminação',
      'Pavimentação',
      'Obras',
      'Infraestrutura',
      'Denúncia'
    ];

    const requiresByCategory = CATEGORIES_REQUIRING_LOCATION.includes(service?.category);

    if (requiresByCategory) {
      console.log(`📍 [Geolocation] Serviço "${service.name}" requer localização por categoria: ${service.category}`);
    }

    return requiresByCategory;
  }

  /**
   * Busca endereço do cidadão e retorna como fallback
   */
  private static async getCitizenAddressLocation(
    citizenId: string,
    prisma: PrismaClient
  ): Promise<GeoResult> {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          id: true,
          name: true,
          address: true
        }
      });

      if (!citizen?.address) {
        console.log('⚠️ [Geolocation] Cidadão não possui endereço cadastrado');
        return {
          latitude: null,
          longitude: null,
          address: null,
          source: 'none'
        };
      }

      // Parse do JSON address
      const addr = citizen.address as any;

      // Montar endereço completo
      const addressParts = [
        addr.street || addr.logradouro,
        addr.number || addr.numero,
        addr.complement || addr.complemento,
        addr.neighborhood || addr.bairro,
        addr.city || addr.cidade || addr.municipio,
        addr.state || addr.estado || addr.uf,
        addr.zipcode || addr.cep
      ].filter(Boolean);

      if (addressParts.length === 0) {
        console.log('⚠️ [Geolocation] Endereço do cidadão está vazio');
        return {
          latitude: null,
          longitude: null,
          address: null,
          source: 'none'
        };
      }

      const fullAddress = addressParts.join(', ');

      console.log(`✅ [Geolocation] Usando endereço do cidadão "${citizen.name}": ${fullAddress}`);

      // Geocodificar endereço automaticamente usando JSON estruturado
      try {
        console.log(`🌍 [Geolocation] Geocodificando endereço do cidadão...`);

        // Passar endereço como JSON para busca estruturada
        const addressJson = JSON.stringify(citizen.address);
        const geoResult = await GeocodingService.geocodeAddress(addressJson);

        if (geoResult && GeocodingService.isValidBrazilCoordinates(geoResult.latitude, geoResult.longitude)) {
          console.log(`✅ [Geolocation] Endereço geocodificado com sucesso: ${geoResult.latitude}, ${geoResult.longitude} (${geoResult.provider})`);
          return {
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            address: geoResult.formattedAddress || fullAddress,
            source: 'citizen_address'
          };
        } else {
          console.log(`⚠️ [Geolocation] Não foi possível geocodificar o endereço, retornando apenas texto`);
        }
      } catch (error) {
        console.error(`❌ [Geolocation] Erro ao geocodificar endereço:`, error);
      }

      // Fallback: retornar apenas endereço textual sem coordenadas
      return {
        latitude: null,
        longitude: null,
        address: fullAddress,
        source: 'citizen_address'
      };
    } catch (error) {
      console.error('❌ [Geolocation] Erro ao buscar endereço do cidadão:', error);
      return {
        latitude: null,
        longitude: null,
        address: null,
        source: 'none'
      };
    }
  }

  /**
   * Valida se dados de localização são válidos
   */
  static isValidLocation(location: LocationData | undefined): boolean {
    if (!location) return false;

    const { latitude, longitude } = location;

    // Validar range de coordenadas
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    // Latitude: -90 a 90
    if (latitude < -90 || latitude > 90) {
      return false;
    }

    // Longitude: -180 a 180
    if (longitude < -180 || longitude > 180) {
      return false;
    }

    return true;
  }

  /**
   * Formata coordenadas para exibição
   */
  static formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
