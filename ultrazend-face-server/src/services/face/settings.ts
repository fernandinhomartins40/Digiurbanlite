/**
 * Configurações do painel (Super-admin › Privacidade › Biometria facial).
 * Cache curto: mudanças no painel valem em até 1 minuto, sem reiniciar.
 */

import prisma from '../../utils/prisma';
import { DEFAULT_SETTINGS, type DecisionSettings } from './decisions';

export interface EngineSettings extends DecisionSettings {
  recognitionModel: string;
}

let cache: { at: number; value: EngineSettings } | null = null;

export async function getEngineSettings(): Promise<EngineSettings> {
  if (cache && Date.now() - cache.at < 60000) return cache.value;
  let value: EngineSettings = { recognitionModel: 'arcface_mnet', ...DEFAULT_SETTINGS };
  try {
    const row = await prisma.faceEngineSettings.findUnique({ where: { id: 'singleton' } });
    if (row) {
      value = {
        recognitionModel: row.recognitionModel,
        matchThreshold: row.matchThreshold,
        reviewThreshold: row.reviewThreshold,
        minQuality: row.minQuality,
        minLiveness: row.minLiveness,
        challengeYawDegrees: row.challengeYawDegrees,
      };
    }
  } catch {
    // tabela ainda não migrada: padrões
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function getFaceRetentionSettings() {
  try {
    const row = await prisma.privacyRetentionSettings.findUnique({ where: { id: 'singleton' } });
    if (row) return row;
  } catch {
    // padrões abaixo
  }
  return { id: 'singleton', faceUnmatchedImageDays: 7, faceEventImageDays: 90, faceEventDays: 365, faceLastRunAt: null, faceLastRunSummary: null };
}

export function invalidateSettingsCache() {
  cache = null;
}
