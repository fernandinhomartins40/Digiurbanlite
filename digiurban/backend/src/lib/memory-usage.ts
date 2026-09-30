/**
 * Uso de memória REAL para o monitoramento do console da plataforma.
 *
 * os.freemem() no Linux não conta o cache de disco como livre — o painel
 * mostrava ~97% em vermelho o tempo todo sem haver falta de memória.
 * Ordem de preferência (mesmo critério do `docker stats`):
 *   1. limite do container (cgroup v2: memory.max/current − inactive_file)
 *   2. memória DISPONÍVEL da máquina (/proc/meminfo: MemTotal − MemAvailable)
 *   3. fallback do Node (os.totalmem/freemem)
 */

import fs from 'fs';
import os from 'os';

export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
  scope: 'container' | 'host';
}

function read(path: string): string | null {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch {
    return null;
  }
}

function fromCgroup(): MemoryUsage | null {
  const max = read('/sys/fs/cgroup/memory.max');
  const current = read('/sys/fs/cgroup/memory.current');
  if (!max || !current || max === 'max') return null; // sem limite → vale a máquina
  const total = Number(max);
  const stat = read('/sys/fs/cgroup/memory.stat') || '';
  const inactiveFile = Number(/^inactive_file (\d+)/m.exec(stat)?.[1] || 0);
  const used = Math.max(0, Number(current) - inactiveFile);
  if (!total || !Number.isFinite(used)) return null;
  return { total, used, free: Math.max(0, total - used), usagePercent: (used / total) * 100, scope: 'container' };
}

function fromMeminfo(): MemoryUsage | null {
  const info = read('/proc/meminfo');
  if (!info) return null;
  const kb = (key: string) => Number(new RegExp(`^${key}:\\s+(\\d+)`, 'm').exec(info)?.[1] || NaN) * 1024;
  const total = kb('MemTotal');
  const available = kb('MemAvailable');
  if (!Number.isFinite(total) || !Number.isFinite(available) || !total) return null;
  const used = total - available;
  return { total, used, free: available, usagePercent: (used / total) * 100, scope: 'host' };
}

export function getMemoryUsage(): MemoryUsage {
  const fromSystem = fromCgroup() || fromMeminfo();
  if (fromSystem) return fromSystem;
  const total = os.totalmem();
  const free = os.freemem();
  return { total, used: total - free, free, usagePercent: ((total - free) / total) * 100, scope: 'host' };
}
