/**
 * Rotina (a cada 15 min): procura no mapa o endereço dos pedidos que ainda
 * não têm coordenadas, aos poucos (o serviço gratuito de endereços aceita 1
 * consulta por segundo). Antes isso era feito na hora em que alguém abria o
 * mapa — lento e repetido a cada visita.
 *
 * Endereço que não foi achado fica marcado (geocodingProvider = 'SEM_RESULTADO')
 * para não ser procurado de novo toda vez.
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { GeocodingService } from '../services/geocoding.service';

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
          data: { latitude: result.latitude, longitude: result.longitude, locationType: 'GEOCODED_ADDRESS', geocodingProvider: result.provider },
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

export function initProtocolGeocodingJob(): void {
  cron.schedule('*/15 * * * *', () => {
    forEachActiveTenant('protocol-geocoding', async () => {
      await geocodePendingProtocols();
    }).catch((error) => console.error('[mapa] endereços não procurados:', error));
  });
}
