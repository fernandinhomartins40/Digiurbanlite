/**
 * Google Maps configurado pelo painel (Super-admin › Chaves de API › Google
 * Maps) — o operador não edita .env. Guardado cifrado em platform_secrets:
 *  - chave do navegador (Maps JavaScript API; fica visível na página, então
 *    deve ser restrita no Google por site e por API);
 *  - ID do mapa (opcional, estilo do Google);
 *  - chave do servidor (opcional, Geocoding API, restrita pelo IP do servidor):
 *    usada só quando o OpenStreetMap não acha o endereço;
 *  - liga/desliga. Desligado ou sem chave: os mapas usam o OpenStreetMap.
 */

import { prisma } from '../../lib/prisma';
import { runAsPlatform } from '../../lib/tenant-context';
import { openSecret, sealSecret } from '../platform-secrets.service';

const KEYS = {
  browserKey: 'google_maps_browser_key',
  serverKey: 'google_maps_server_key',
  mapId: 'google_maps_map_id',
  enabled: 'google_maps_enabled',
} as const;

export interface MapsSettings {
  enabled: boolean;
  browserKey: string | null;
  serverKey: string | null;
  mapId: string | null;
}

let cache: { at: number; value: MapsSettings } | null = null;

async function read(key: string): Promise<string | null> {
  const row = await runAsPlatform(async () => prisma.platformSecret.findUnique({ where: { key } }));
  if (!row) return null;
  try {
    return openSecret(row.valueEnc);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null) {
  await runAsPlatform(async () => {
    if (value === null || value === '') {
      await prisma.platformSecret.deleteMany({ where: { key } });
      return;
    }
    await prisma.platformSecret.upsert({
      where: { key },
      create: { key, valueEnc: sealSecret(value) },
      update: { valueEnc: sealSecret(value), rotatedAt: new Date() },
    });
  });
}

/** Configuração atual (cache de 60 s) */
export async function getMapsSettings(): Promise<MapsSettings> {
  if (cache && Date.now() - cache.at < 60000) return cache.value;
  const [browserKey, serverKey, mapId, enabled] = await Promise.all([read(KEYS.browserKey), read(KEYS.serverKey), read(KEYS.mapId), read(KEYS.enabled)]);
  const value = { enabled: enabled === 'true', browserKey, serverKey, mapId };
  cache = { at: Date.now(), value };
  return value;
}

/** Salvar. Campo ausente = mantém; string vazia = apaga. */
export async function saveMapsSettings(input: { browserKey?: string; serverKey?: string; mapId?: string; enabled?: boolean }) {
  const clean = (value: string) => value.trim();
  if (input.browserKey !== undefined) await write(KEYS.browserKey, clean(input.browserKey));
  if (input.serverKey !== undefined) await write(KEYS.serverKey, clean(input.serverKey));
  if (input.mapId !== undefined) await write(KEYS.mapId, clean(input.mapId));
  if (input.enabled !== undefined) await write(KEYS.enabled, input.enabled ? 'true' : 'false');
  cache = null;
  return getMapsSettings();
}

/** "AIza…a1B2" para mostrar sem expor a chave */
export function keyPreview(key: string | null): string | null {
  return key ? `${key.slice(0, 4)}…${key.slice(-4)}` : null;
}

/** Formato de chave do Google (AIza + 35 caracteres) */
export function looksLikeGoogleKey(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key.trim());
}
