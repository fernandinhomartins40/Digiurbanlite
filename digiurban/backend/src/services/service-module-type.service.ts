/**
 * Código técnico do serviço (`moduleType`).
 *
 * É a chave estável que liga o serviço ao fluxo de etapas (ModuleWorkflow), aos
 * dados indexados (Registry: EntityType.code), às etiquetas automáticas e à
 * regra de unicidade de protocolos. NÃO decide mais para qual app o pedido vai
 * (isso é `destination`/`appAction`, ver config/app-catalog.ts).
 *
 * Quem cria serviço pela tela não escolhe nem vê este código: o servidor gera a
 * partir do nome e garante que não repete no município — incluindo serviços
 * desativados e fluxos de etapas (ambos têm unique [tenantId, moduleType]).
 * As consultas passam pela extension de tenant, então a checagem é por município.
 */

import { prisma } from '../lib/prisma';

type Db = Pick<typeof prisma, 'serviceSimplified' | 'moduleWorkflow'>;

/** "Cartão do Estudante" → "CARTAO_DO_ESTUDANTE" */
export function moduleTypeFromName(name: string): string {
  const code = String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return code || 'SERVICO';
}

/** Diz se o código já está em uso no município (serviço ativo ou não, ou fluxo de etapas). */
export async function isModuleTypeTaken(moduleType: string, db: Db = prisma): Promise<{ service?: { id: string; name: string }; workflow?: { id: string; name: string } } | null> {
  const [service, workflow] = await Promise.all([
    db.serviceSimplified.findFirst({ where: { moduleType }, select: { id: true, name: true } }),
    db.moduleWorkflow.findFirst({ where: { moduleType }, select: { id: true, name: true } }),
  ]);
  if (!service && !workflow) return null;
  return { service: service || undefined, workflow: workflow || undefined };
}

/** Gera um código livre a partir do nome: CODIGO, CODIGO_2, CODIGO_3… */
export async function generateUniqueModuleType(name: string, db: Db = prisma): Promise<string> {
  const base = moduleTypeFromName(name);
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = attempt === 1 ? base : `${base}_${attempt}`;
    if (!(await isModuleTypeTaken(candidate, db))) return candidate;
  }
  return `${base}_${Date.now()}`;
}
