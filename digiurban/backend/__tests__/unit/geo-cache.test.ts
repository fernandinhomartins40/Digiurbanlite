/**
 * Arquivo de endereços (GeoCache): mesma busca = mesma chave, sem consultar de
 * novo; Google só depois dos grátis e guardado no máximo 30 dias.
 */

const store = new Map<string, any>();
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    geoCache: {
      findUnique: jest.fn(async ({ where }: any) => store.get(where.queryKey) || null),
      update: jest.fn(async () => ({})),
      upsert: jest.fn(async ({ where, create }: any) => {
        store.set(where.queryKey, { id: where.queryKey, ...create });
        return create;
      }),
    },
  },
}));
jest.mock('../../src/lib/tenant-context', () => ({ runAsPlatform: (fn: any) => fn() }));
const settings = { enabled: true, browserKey: 'b', serverKey: 'AIzaServer', mapId: null };
jest.mock('../../src/services/maps/maps-settings.service', () => ({ getMapsSettings: async () => settings }));
jest.mock('axios', () => ({ get: jest.fn() }));

import axios from 'axios';
import { GeocodingService, cacheExpiry, normalizeQuery } from '../../src/services/geocoding.service';

const get = axios.get as jest.Mock;

describe('arquivo de endereços', () => {
  beforeEach(() => {
    store.clear();
    get.mockReset();
  });

  it('normaliza acento, caixa e pontuação', () => {
    expect(normalizeQuery('  Rua São João, 10 - Centro ')).toBe(normalizeQuery('rua sao joao 10 centro'));
  });

  it('validade: grátis sem prazo, Google 30 dias, não achou 7 dias', () => {
    const now = new Date('2026-10-08T00:00:00Z');
    expect(cacheExpiry('nominatim', now)).toBeNull();
    expect(cacheExpiry('google', now)?.toISOString()).toBe('2026-11-07T00:00:00.000Z');
    expect(cacheExpiry(null, now)?.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it('a segunda busca do mesmo endereço não consulta ninguém', async () => {
    get.mockResolvedValueOnce({ data: [{ lat: '-15.79', lon: '-47.88', display_name: 'Brasília', importance: 0.9, address: {} }] });
    const first = await GeocodingService.geocodeAddress('Brasília, DF');
    expect(first?.provider).toBe('nominatim');
    const calls = get.mock.calls.length;
    const second = await GeocodingService.geocodeAddress('brasilia df');
    expect(second?.latitude).toBeCloseTo(-15.79);
    expect(get.mock.calls.length).toBe(calls);
  });

  it('Google só quando os grátis não acham, e guarda com prazo', async () => {
    get.mockImplementation(async (url: string) => {
      if (url.includes('googleapis')) {
        return { data: { status: 'OK', results: [{ formatted_address: 'Rua X', place_id: 'p1', geometry: { location: { lat: -10, lng: -50 }, location_type: 'ROOFTOP' } }] } };
      }
      return { data: [] };
    });
    const result = await GeocodingService.geocodeAddress('Rua Inexistente 1, Cidade, UF');
    expect(result?.provider).toBe('google');
    const row = store.get(`geo:${normalizeQuery('Rua Inexistente 1, Cidade, UF')}`);
    expect(row.provider).toBe('google');
    expect(row.expiresAt).toBeInstanceOf(Date);
  });
});
