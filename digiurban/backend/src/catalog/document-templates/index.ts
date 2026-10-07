/**
 * Catálogo de modelos de documento da plataforma, aplicado a TODO município
 * (antes vinham de um seed antigo e só o município padrão os tinha).
 *
 *  - PROTOCOL: documentos do protocolo (certidão, recibo, alvará, notificação,
 *    parecer, relatório de conclusão) — HTML com variáveis.
 *  - INTERNAL_PROCESS: documentos do processo interno e das contratações da
 *    Lei 14.133 (DFD, ETP, TR, parecer, contrato...) — texto com {{campos}}.
 *
 * Regra "só acrescenta" (como o catálogo de serviços): cria o que falta,
 * melhora o que o município NÃO editou (catalogHash igual ao aplicado) e nunca
 * mexe no que ele editou (catalogHash nulo).
 */

import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { DOCUMENT_TEMPLATES } from '../../services/internal-process/flows/templates';
import { PROTOCOL_TEMPLATES } from './protocol-templates';

export interface CatalogTemplateDefinition {
  code: string;
  scope: 'PROTOCOL' | 'INTERNAL_PROCESS';
  data: Record<string, any>;
}

export function catalogTemplateDefinitions(): CatalogTemplateDefinition[] {
  const protocol = PROTOCOL_TEMPLATES.map((template) => ({
    code: template.code,
    scope: 'PROTOCOL' as const,
    data: {
      ...template,
      outputFormat: template.outputFormat || 'PDF',
      isGlobal: template.isGlobal ?? true,
    },
  }));
  const internal = Object.values(DOCUMENT_TEMPLATES).map((template) => ({
    code: template.key,
    scope: 'INTERNAL_PROCESS' as const,
    data: {
      name: template.title,
      code: template.key,
      description: template.legal || null,
      documentType: 'CUSTOM',
      outputFormat: 'PDF',
      isGlobal: false,
      htmlTemplate: template.body,
      requiresSignature: true,
    },
  }));
  return [...protocol, ...internal];
}

export function catalogTemplateHash(definition: CatalogTemplateDefinition): string {
  return crypto.createHash('sha256').update(JSON.stringify({ scope: definition.scope, ...definition.data })).digest('hex');
}

/** Aplica o catálogo no município (rodar dentro do contexto dele) */
export async function applyDocumentTemplateCatalog(prisma: PrismaClient | any, tenantId: string) {
  const summary = { created: 0, updated: 0, kept: 0 };
  const existing = await prisma.documentTemplate.findMany({
    where: { tenantId },
    select: { id: true, code: true, catalogKey: true, catalogHash: true },
  });
  const byCode = new Map<string, any>(existing.map((row: any) => [row.code, row]));
  for (const definition of catalogTemplateDefinitions()) {
    const hash = catalogTemplateHash(definition);
    const row = byCode.get(definition.code);
    const data = { ...definition.data, scope: definition.scope, catalogKey: definition.code, catalogHash: hash };
    if (!row) {
      await prisma.documentTemplate.create({ data: { ...data, tenantId, createdBy: 'CATALOGO' } });
      summary.created++;
    } else if (row.catalogHash && row.catalogHash !== hash) {
      // o município não editou: recebe a versão nova do catálogo
      await prisma.documentTemplate.update({ where: { id: row.id }, data: { ...data, version: { increment: 1 } } });
      summary.updated++;
    } else {
      summary.kept++;
    }
  }
  return summary;
}
