import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import { generateUniqueModuleType, moduleTypeFromName } from '../../src/services/service-module-type.service';

describe('moduleTypeFromName', () => {
  it('gera código em maiúsculas, sem acento e com underscore', () => {
    expect(moduleTypeFromName('Cartão do Estudante')).toBe('CARTAO_DO_ESTUDANTE');
    expect(moduleTypeFromName('  Poda / Remoção de Árvore!! ')).toBe('PODA_REMOCAO_DE_ARVORE');
  });

  it('usa SERVICO quando o nome não tem letras ou números', () => {
    expect(moduleTypeFromName('***')).toBe('SERVICO');
    expect(moduleTypeFromName('')).toBe('SERVICO');
  });
});

describe('generateUniqueModuleType', () => {
  const dbWith = (servicesTaken: string[], workflowsTaken: string[]) =>
    ({
      serviceSimplified: {
        findFirst: async ({ where }: any) => (servicesTaken.includes(where.moduleType) ? { id: 's', name: 'x' } : null),
      },
      moduleWorkflow: {
        findFirst: async ({ where }: any) => (workflowsTaken.includes(where.moduleType) ? { id: 'w', name: 'y' } : null),
      },
    }) as any;

  it('devolve o código do nome quando está livre', async () => {
    await expect(generateUniqueModuleType('Cartão do Estudante', dbWith([], []))).resolves.toBe('CARTAO_DO_ESTUDANTE');
  });

  it('acrescenta _2, _3… quando o código já é usado por serviço (mesmo desativado) ou fluxo de etapas', async () => {
    const db = dbWith(['CARTAO_DO_ESTUDANTE'], ['CARTAO_DO_ESTUDANTE_2']);
    await expect(generateUniqueModuleType('Cartão do Estudante', db)).resolves.toBe('CARTAO_DO_ESTUDANTE_3');
  });
});
