/**
 * Backup REAL do banco (todas as tabelas, todos os municípios) com pg_dump.
 *
 * Substitui o antigo "backup" em JSON do painel, que copiava só 12 tabelas e
 * cujo "restaurar" apagava tabelas inteiras. Restauração NÃO é feita pelo
 * painel: é um procedimento de servidor (pg_restore), documentado na tela.
 *
 * Usa MIGRATE_DATABASE_URL (credencial elevada) quando existe: com RLS armado,
 * o role da aplicação (digiurban_app) não enxerga todas as linhas e o pg_dump
 * falharia ("query would be affected by row-level security policy").
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export const BACKUP_EXTENSION = '.dump';
const DUMP_TIMEOUT_MS = 15 * 60 * 1000;

/** URL aceita pelo pg_dump: sem parâmetros exclusivos do Prisma (schema, connection_limit…) */
export function pgDumpConnectionUrl(): string {
  const raw = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL não configurada');
  const url = new URL(raw);
  const keep = new URLSearchParams();
  const sslmode = url.searchParams.get('sslmode');
  if (sslmode) keep.set('sslmode', sslmode);
  url.search = keep.toString();
  return url.toString();
}

export interface BackupResult {
  fileName: string;
  size: number;
  durationMs: number;
}

export async function createDatabaseBackup(backupDir: string): Promise<BackupResult> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `digiurban-${stamp}${BACKUP_EXTENSION}`;
  const filePath = path.join(backupDir, fileName);
  const started = Date.now();

  await new Promise<void>((resolve, reject) => {
    // Formato "custom" (-Fc): comprimido e restaurável seletivamente com pg_restore
    const child = spawn(
      'pg_dump',
      ['--format=custom', '--no-owner', '--no-privileges', '--file', filePath, '--dbname', pgDumpConnectionUrl()],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Backup excedeu o tempo limite de 15 minutos'));
    }, DUMP_TIMEOUT_MS);
    child.on('error', (err: any) => {
      clearTimeout(timer);
      reject(
        err?.code === 'ENOENT'
          ? new Error('pg_dump não está instalado neste servidor (pacote postgresql-client)')
          : err
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      // Não repassar a URL (tem senha) — só a mensagem do pg_dump, sem credenciais
      else reject(new Error((stderr || `pg_dump saiu com código ${code}`).replace(/postgres(ql)?:\/\/[^\s]+/g, '[conexão]').trim()));
    });
  }).catch(async (error) => {
    await fs.unlink(filePath).catch(() => undefined);
    throw error;
  });

  const stats = await fs.stat(filePath);
  return { fileName, size: stats.size, durationMs: Date.now() - started };
}

/** Passo a passo de restauração exibido no painel (procedimento de servidor) */
export const RESTORE_INSTRUCTIONS = [
  'Restauração é feita no servidor, com o sistema em manutenção — nunca pelo painel.',
  '1. Baixe o arquivo .dump e confirme a data/hora do backup desejado.',
  '2. Pare o app: docker compose -f docker-compose.vps.yml stop digiurban',
  '3. Copie o arquivo para o container do banco: docker cp ARQUIVO.dump digiurban-postgres:/tmp/',
  '4. Restaure: docker exec digiurban-postgres pg_restore --clean --if-exists --no-owner -U <usuario> -d digiurban /tmp/ARQUIVO.dump',
  '5. Suba o app: docker compose -f docker-compose.vps.yml start digiurban',
];
