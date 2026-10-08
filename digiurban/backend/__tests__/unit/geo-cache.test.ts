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
const settings = { enabled: true, browserKey: 'b', serverKey: 'AIzaServer', mapId: null, googleRetentionDays: 30 };
jest.mock('../../src/services/maps/maps-settings.service', () => ({ getMapsSettings: async () => settings }));
jest.mock('axios', () => ({ get: jest.fn() }));

import axios from 'axios';
import { GeocodingService, cacheExpiry, normalizeQuery, pickBest, rememberConfirmedLocation } from '../../src/services/geocoding.service';
import { homePointOf } from '../../src/services/citizen-home-location.service';

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
    expect(cacheExpiry('google', now, 0)).toBeNull();
    expect(cacheExpiry('google', now, 365)?.toISOString()).toBe('2027-10-08T00:00:00.000Z');
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

  it('endereço do cadastro (JSON) e em texto dão a mesma chave', () => {
    const json = JSON.stringify({ logradouro: 'Rua São João', numero: '10', bairro: 'Centro', cidade: 'Pindamonhangaba', uf: 'SP', cep: '12400-000' });
    expect(normalizeQuery(json)).toBe(normalizeQuery('Rua Sao Joao, 10, Centro, Pindamonhangaba, SP, 12400-000'));
  });

  it('ponto confirmado (GPS/alfinete) fica sem prazo e responde a próxima busca', async () => {
    await rememberConfirmedLocation('Rua A, 5, Centro, Cidade, UF', -20.1, -45.2);
    const row = store.get(`geo:${normalizeQuery('Rua A, 5, Centro, Cidade, UF')}`);
    expect(row.provider).toBe('confirmado');
    expect(row.expiresAt).toBeNull();
    const calls = get.mock.calls.length;
    const result = await GeocodingService.geocodeAddress('rua a 5 centro cidade uf');
    expect(result?.latitude).toBeCloseTo(-20.1);
    expect(get.mock.calls.length).toBe(calls);
  });

  it('casa marcada só vale para o mesmo endereço', () => {
    const address = { logradouro: 'Rua A', numero: '5', cidade: 'Cidade', uf: 'UF' };
    const base = { homeLatitude: -20, homeLongitude: -45, homeLocationSource: 'GPS', homeLocationKey: normalizeQuery('Rua A, 5, Cidade, UF') };
    expect(homePointOf({ address, ...base })?.source).toBe('GPS');
    expect(homePointOf({ address: { ...address, numero: '7' }, ...base })).toBeNull();
  });

  it('grátis achou só a rua: pergunta ao Google e fica com o número da casa', async () => {
    get.mockImplementation(async (url: string) => {
      if (url.includes('googleapis')) {
        return { data: { status: 'OK', results: [{ formatted_address: 'Rua B, 12', place_id: 'p2', geometry: { location: { lat: -11, lng: -51 }, location_type: 'ROOFTOP' } }] } };
      }
      return { data: [{ lat: '-11.1', lon: '-51.1', display_name: 'Rua B', importance: 0.5, place_rank: 26, addresstype: 'road', address: { road: 'Rua B' } }] };
    });
    const result = await GeocodingService.geocodeAddress('Rua B, 12, Cidade, UF');
    expect(result?.provider).toBe('google');
    expect(result?.precision).toBe('house');
  });

  it('pickBest: empate fica com o Google; grátis melhor fica com o grátis', () => {
    const free = { latitude: 1, longitude: 1, provider: 'nominatim', precision: 'house' } as any;
    const google = { latitude: 2, longitude: 2, provider: 'google', precision: 'street' } as any;
    expect(pickBest(free, google)?.provider).toBe('nominatim');
    expect(pickBest({ ...free, precision: 'street' }, google)?.provider).toBe('google');
    expect(pickBest(null, google)?.provider).toBe('google');
  });
});
