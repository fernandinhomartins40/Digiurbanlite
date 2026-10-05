/**
 * Cliente do motor facial (ultrazend-face-engine, UniFace). Rede interna apenas.
 */

import axios from 'axios';
import type { EngineFrame } from './decisions';

const engineUrl = (process.env.FACE_ENGINE_URL || 'http://ultrazend-face-engine:8000').replace(/\/$/, '');

const api = axios.create({
  baseURL: engineUrl,
  timeout: Number(process.env.FACE_ENGINE_TIMEOUT_MS || 30000),
  headers: process.env.FACE_ENGINE_TOKEN ? { Authorization: `Bearer ${process.env.FACE_ENGINE_TOKEN}` } : {},
  maxBodyLength: 30 * 1024 * 1024,
});

export interface EngineAnalysis {
  model: { name: string; provider: string; version: string };
  frames: EngineFrame[];
}

function engineError(error: any) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const wrapped = new Error(
    status && status < 500 && detail
      ? String(detail)
      : 'O serviço de reconhecimento facial está indisponível no momento. Tente novamente em instantes.'
  ) as Error & { status?: number };
  wrapped.status = status && status < 500 ? 400 : 503;
  return wrapped;
}

export async function analyzeFrames(
  frames: string[],
  options: { model: string; multi?: boolean; maxFaces?: number }
): Promise<EngineAnalysis> {
  try {
    const response = await api.post('/v1/analyze', {
      frames,
      model: options.model,
      multi: Boolean(options.multi),
      maxFaces: options.maxFaces || 10,
    });
    return response.data as EngineAnalysis;
  } catch (error) {
    throw engineError(error);
  }
}

export async function engineStatus() {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { available: true, ...response.data };
  } catch (error: any) {
    return { available: false, message: error?.message || 'Motor facial indisponível' };
  }
}
