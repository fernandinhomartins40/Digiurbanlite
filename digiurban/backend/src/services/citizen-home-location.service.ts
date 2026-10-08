/**
 * Ponto da casa do cidadão no mapa.
 *
 * Vem de uma pessoa — o GPS do celular ou o alfinete tocado/arrastado no mapa —
 * então é dado próprio e fica guardado sem prazo (não é resposta do Google).
 * Vale enquanto o endereço do cadastro for o mesmo de quando foi marcado
 * (`homeLocationKey`); mudou o endereço, o ponto deixa de ser usado sozinho.
 *
 * Cada ponto confirmado também vai para o arquivo de endereços (GeoCache) como
 * "confirmado": a próxima busca do mesmo endereço, de qualquer pedido, já sai dele.
 */

import { prisma } from '../lib/prisma';
import { GeocodingService, normalizeQuery, rememberConfirmedLocation } from './geocoding.service';

export type HomeLocationSource = 'GPS' | 'PIN';

/** Endereço do cadastro em texto ({logradouro, numero, ...}) */
export function citizenAddressText(address: unknown): string | null {
  if (!address) return null;
  if (typeof address === 'string') return address.trim() || null;
  if (typeof address !== 'object') return null;
  const value = address as Record<string, any>;
  const parts = [
    value.logradouro || value.street,
    value.numero || value.number,
    value.bairro || value.neighborhood,
    value.cidade || value.city || value.municipio,
    value.uf || value.state || value.estado,
    value.cep || value.zipcode,
  ].filter(Boolean);
  return parts.length >= 2 ? parts.join(', ') : null;
}

export function addressKey(address: unknown): string | null {
  const text = citizenAddressText(address);
  return text ? normalizeQuery(text) : null;
}

/** Ponto da casa, se ainda vale para o endereço atual */
export function homePointOf(citizen: {
  address: unknown;
  homeLatitude: number | null;
  homeLongitude: number | null;
  homeLocationSource: string | null;
  homeLocationKey: string | null;
}): { latitude: number; longitude: number; source: HomeLocationSource } | null {
  if (citizen.homeLatitude === null || citizen.homeLongitude === null) return null;
  const key = addressKey(citizen.address);
  if (!key || key !== citizen.homeLocationKey) return null;
  return { latitude: citizen.homeLatitude, longitude: citizen.homeLongitude, source: (citizen.homeLocationSource as HomeLocationSource) || 'PIN' };
}

const HOME_SELECT = { id: true, address: true, homeLatitude: true, homeLongitude: true, homeLocationSource: true, homeLocationKey: true, homeLocationAt: true } as const;

/** Grava o ponto da casa (GPS ou alfinete) */
export async function setCitizenHomeLocation(citizenId: string, latitude: number, longitude: number, source: HomeLocationSource) {
  if (!GeocodingService.isValidBrazilCoordinates(latitude, longitude)) {
    const error: any = new Error('Ponto fora do Brasil');
    error.statusCode = 400;
    throw error;
  }
  const citizen = await prisma.citizen.findUnique({ where: { id: citizenId }, select: HOME_SELECT });
  if (!citizen) {
    const error: any = new Error('Cidadão não encontrado');
    error.statusCode = 404;
    throw error;
  }
  const text = citizenAddressText(citizen.address);
  if (!text) {
    const error: any = new Error('Cadastre o endereço antes de marcar a casa no mapa');
    error.statusCode = 400;
    throw error;
  }
  await prisma.citizen.update({
    where: { id: citizenId },
    data: { homeLatitude: latitude, homeLongitude: longitude, homeLocationSource: source, homeLocationAt: new Date(), homeLocationKey: normalizeQuery(text) },
  });
  await rememberConfirmedLocation(text, latitude, longitude);
  return { latitude, longitude, source, address: text };
}

export async function clearCitizenHomeLocation(citizenId: string) {
  await prisma.citizen.update({
    where: { id: citizenId },
    data: { homeLatitude: null, homeLongitude: null, homeLocationSource: null, homeLocationAt: null, homeLocationKey: null },
  });
}

/**
 * Situação para a tela: ponto confirmado (se houver) ou sugestão pelo endereço
 * do cadastro (que a pessoa confirma tocando no alfinete).
 */
export async function citizenHomeLocationStatus(citizenId: string) {
  const citizen = await prisma.citizen.findUnique({ where: { id: citizenId }, select: HOME_SELECT });
  if (!citizen) return null;
  const address = citizenAddressText(citizen.address);
  const home = homePointOf(citizen);
  if (home) return { address, confirmed: true, ...home, markedAt: citizen.homeLocationAt };
  let suggestion: { latitude: number; longitude: number } | null = null;
  if (address) {
    const result = await GeocodingService.geocodeAddress(JSON.stringify(citizen.address)).catch(() => null);
    if (result && GeocodingService.isValidBrazilCoordinates(result.latitude, result.longitude)) {
      suggestion = { latitude: result.latitude, longitude: result.longitude };
    }
  }
  return { address, confirmed: false, suggestion };
}
