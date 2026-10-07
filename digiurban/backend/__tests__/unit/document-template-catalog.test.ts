/**
 * Catálogo de modelos de documento: todo município recebe os modelos, e a
 * regra "só acrescenta" nunca mexe no que o município editou.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import { applyDocumentTemplateCatalog, catalogTemplateDefinitions, catalogTemplateHash } from '../../src/catalog/document-templates';
import { DOCUMENT_TEMPLATES } from '../../src/services/internal-process/flows/templates';

function fakePrisma(rows: any[]) {
  const created: any[] = [];
  const updated: any[] = [];
  return {
    created,
    updated,
    documentTemplate: {
      findMany: jest.fn(async () => rows),
      create: jest.fn(async ({ data }: any) => created.push(data)),
      update: jest.fn(async ({ where, data }: any) => updated.push({ id: where.id, data })),
    },
  };
}

describe('catálogo de modelos de documento', () => {
  const definitions = catalogTemplateDefinitions();

  it('tem os modelos do protocolo e todos os do processo interno, sem código repetido', () => {
    const codes = definitions.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of ['CERTIDAO_PROTOCOLO', 'RECIBO_ATENDIMENTO', 'AUTORIZACAO_ALVARA', 'NOTIFICACAO_OFICIAL', 'PARECER_TECNICO', 'RELATORIO_CONCLUSAO']) {
      expect(definitions.find((item) => item.code === code)?.scope).toBe('PROTOCOL');
    }
    for (const key of Object.keys(DOCUMENT_TEMPLATES)) {
      expect(definitions.find((item) => item.code === key)?.scope).toBe('INTERNAL_PROCESS');
    }
  });

  it('nenhum modelo afirma validade ICP-Brasil (a assinatura é avançada, Lei 14.063)', () => {
    for (const definition of definitions) {
      expect(String(definition.data.htmlTemplate)).not.toMatch(/2\.200-2|ICP-Brasil/i);
    }
  });

  it('município novo recebe tudo', async () => {
    const prisma = fakePrisma([]);
    const summary = await applyDocumentTemplateCatalog(prisma, 't1');
    expect(summary.created).toBe(definitions.length);
    expect(prisma.created.every((data) => data.tenantId === 't1' && data.catalogHash)).toBe(true);
  });

  it('só acrescenta: atualiza o que não foi editado e não mexe no editado', async () => {
    const [first, second, third] = definitions;
    const prisma = fakePrisma([
      { id: 'a', code: first.code, catalogKey: first.code, catalogHash: 'versao-antiga' }, // não editado, catálogo mudou
      { id: 'b', code: second.code, catalogKey: second.code, catalogHash: null }, // editado pelo município
      { id: 'c', code: third.code, catalogKey: third.code, catalogHash: catalogTemplateHash(third) }, // já igual
    ]);
    const summary = await applyDocumentTemplateCatalog(prisma, 't1');
    expect(prisma.updated.map((item) => item.id)).toEqual(['a']);
    expect(summary.kept).toBe(2);
    expect(summary.created).toBe(definitions.length - 3);
  });
});
