/**
 * Acesso às fontes oficiais de preço: um cliente só, com IPv4 (o PNCP derruba
 * conexões IPv6/keep-alive com frequência), nova tentativa em queda de rede e
 * respostas guardadas no banco (PriceSourceCache) — as APIs do governo levam
 * ~10 s por chamada, então a mesma pergunta não é feita duas vezes no dia.
 */

import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { prisma } from '../../lib/prisma';
import logger from '../../config/logger.config';

export const COMPRAS_BASE = 'https://dadosabertos.compras.gov.br';
export const PNCP_BASE = 'https://pncp.gov.br';

// sem keep-alive: o PNCP fecha conexões paradas e a reutilização vira ECONNRESET
const agent = new https.Agent({ family: 4, keepAlive: false, maxSockets: 6 });

export const sourceHttp: AxiosInstance = axios.create({
  timeout: 45_000,
  httpsAgent: agent,
  headers: { Accept: 'application/json', 'User-Agent': 'DigiUrban-PesquisaPrecos/2.0' },
});

const RETRY_CODES = new Set(['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED', 'EPIPE']);

/**
 * A API do Compras.gov.br, quando demora (~10 s), responde 400 "Erro ao efetuar
 * a consulta" em vez de 504 — e na tentativa seguinte responde normalmente
 * (conferido em 2026-10-14). Esse 400 conta como "tentar de novo".
 */
const isSlowQuery400 = (error: any) => error?.response?.status === 400 && /erro ao efetuar a consulta/i.test(JSON.stringify(error?.response?.data || ''));

export async function getJson<T = any>(url: string, params?: Record<string, unknown>, attempts = 4): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await sourceHttp.get<T>(url, { params });
      return response.data;
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const retry = RETRY_CODES.has(error?.code) || status === 429 || (status >= 500 && status < 600) || isSlowQuery400(error);
      if (!retry || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  const status = lastError?.response?.status;
  logger.warn('[prices] fonte não respondeu', { url, status, code: lastError?.code });
  throw new SourceError(status === 404 ? 'não encontrado' : status ? `respondeu ${status}` : 'sem resposta', status);
}

export class SourceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

/** Resposta guardada por `ttlMs`; erro não é guardado */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = await prisma.priceSourceCache.findUnique({ where: { key } }).catch(() => null);
  if (hit && hit.expiresAt > new Date()) return hit.payload as unknown as T;
  const value = await fn();
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.priceSourceCache
    .upsert({ where: { key }, create: { key, payload: value as any, expiresAt }, update: { payload: value as any, expiresAt } })
    .catch(() => undefined);
  return value;
}

/** Executa no máximo `limit` tarefas ao mesmo tempo */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** AAAA-MM-DD no fuso de Brasília */
export function isoDay(date: Date): string {
  return new Date(date.getTime() - 3 * HOUR).toISOString().slice(0, 10);
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const text = String(value);
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const date = br ? new Date(`${br[3]}-${br[2]}-${br[1]}T12:00:00Z`) : new Date(text.length === 10 ? `${text}T12:00:00Z` : text);
  return Number.isNaN(date.getTime()) ? null : date;
}
