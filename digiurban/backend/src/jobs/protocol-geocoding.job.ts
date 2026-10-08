/**
 * Rotina (a cada 15 min): procura no mapa o endereço dos pedidos que ainda
 * não têm coordenadas, aos poucos (o serviço gratuito de endereços aceita 1
 * consulta por segundo). Antes isso era feito na hora em que alguém abria o
 * mapa — lento e repetido a cada visita.
 *
 * Endereço que não foi achado fica marcado (geocodingProvider = 'SEM_RESULTADO')
 * para não ser procurado de novo toda vez.
 *
 * Toda busca passa pelo arquivo de endereços (GeoCache): o mesmo endereço não
 * é consultado duas vezes. Coordenada vinda do Google vale o prazo do painel
 * (padrão 30 dias, regra do Google; 0 = para sempre): depois disso o pedido
 * volta para a fila e é procurado de novo (primeiro nos serviços grátis). A rotina diária limpa o que venceu no arquivo.
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { GeocodingService } from '../services/geocoding.service';
import { getMapsSettings } from '../services/maps/maps-settings.service';

const PER_TENANT = 15;

function addressOf(protocol: { specificLocation: string | null; address: string | null; citizen: { address: unknown } | null }): string | null {
  if (protocol.specificLocation) return protocol.specificLocation;
  if (protocol.address) return protocol.address;
  const value = protocol.citizen?.address as Record<string, any> | null;
  if (!value || typeof value !== 'object') return null;
  const parts = [value.logradouro || value.street, value.numero || value.number, value.bairro || value.neighborhood, value.cidade || value.city, value.uf || value.state, value.cep || value.zipcode].filter(Boolean);
  return parts.length >= 2 ? parts.join(', ') : null;
}

export async function geocodePendingProtocols(): Promise<number> {
  const pending = await prisma.protocolSimplified.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
      NOT: { geocodingProvider: 'SEM_RESULTADO' },
      status: { notIn: ['CANCELADO'] },
    },
    orderBy: { createdAt: 'desc' },
    take: PER_TENANT,
    select: { id: true, specificLocation: true, address: true, citizen: { select: { address: true } } },
  });
  let found = 0;
  for (const protocol of pending) {
    const address = addressOf(protocol);
    if (!address) {
      await prisma.protocolSimplified.update({ where: { id: protocol.id }, data: { geocodingProvider: 'SEM_RESULTADO' } }).catch(() => undefined);
      continue;
    }
    try {
      const result = await GeocodingService.geocodeAddress(address);
      if (result && GeocodingService.isValidBrazilCoordinates(result.latitude, result.longitude)) {
        await prisma.protocolSimplified.update({
          where: { id: protocol.id },
          data: { latitude: result.latitude, longitude: result.longitude, locationType: 'GEOCODED_ADDRESS', geocodingProvider: result.provider, geocodedAt: new Date() },
        });
        found++;
      } else {
        await prisma.protocolSimplified.update({ where: { id: protocol.id }, data: { geocodingProvider: 'SEM_RESULTADO' } });
      }
    } catch {
      // serviço fora do ar: tenta de novo na próxima rodada
    }
  }
  return found;
}

/** Coordenadas do Google mais velhas que o prazo do painel saem do pedido (voltam para a fila) */
export async function expireGoogleCoordinates(now = new Date()): Promise<number> {
  const days = (await getMapsSettings()).googleRetentionDays;
  if (days === 0) return 0; // "para sempre"
  const limit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.protocolSimplified.updateMany({
    where: { geocodingProvider: 'google', OR: [{ geocodedAt: null }, { geocodedAt: { lt: limit } }] },
    data: { latitude: null, longitude: null, geocodingProvider: null, geocodedAt: null },
  });
  return result.count;
}

/** Apaga do arquivo de endereços o que venceu */
export async function cleanupGeoCache(now = new Date()): Promise<number> {
  const result = await runAsPlatform(async () => prisma.geoCache.deleteMany({ where: { expiresAt: { lt: now } } }));
  return result.count;
}

export function initProtocolGeocodingJob(): void {
  cron.schedule('*/15 * * * *', () => {
    forEachActiveTenant('protocol-geocoding', async () => {
      await geocodePendingProtocols();
    }).catch((error) => console.error('[mapa] endereços não procurados:', error));
  });
  cron.schedule('20 4 * * *', () => {
    cleanupGeoCache().catch((error) => console.error('[mapa] limpeza do arquivo de endereços:', error));
    forEachActiveTenant('protocol-geocoding-expire', async () => {
      await expireGoogleCoordinates();
    }).catch((error) => console.error('[mapa] renovação de coordenadas:', error));
  });
}
