/**
 * Catálogo de serviços: "só acrescenta". Cria o que falta, melhora o que o
 * município não editou e nunca mexe no que ele editou (nem religa desligado).
 */

import { allServices, applyServiceCatalog, catalogFields, catalogHashOf, catalogKeyOf } from '../../src/catalog/services';

function fakeDb(departments: Array<{ id: string; code: string }>, services: any[]) {
  let seq = 0;
  return {
    services,
    department: { findMany: async () => departments },
    serviceSimplified: {
      findMany: async () => services.map((service) => ({ ...service })),
      create: async ({ data }: any) => {
        const row = { id: `new${++seq}`, ...data };
        services.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = services.find((service) => service.id === where.id);
        Object.assign(row, data);
        return row;
      },
    },
  };
}

const def = allServices.find((item) => item.departmentCode === 'SAUDE')!;
const dept = { id: 'd-saude', code: 'SAUDE' };

describe('catálogo de serviços', () => {
  it('cada item tem chave única', () => {
    const keys = allServices.map(catalogKeyOf);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('município novo recebe os serviços da secretaria, ligados', async () => {
    const db = fakeDb([dept], []);
    const result = await applyServiceCatalog(db, 't1');
    const expected = allServices.filter((item) => item.departmentCode === 'SAUDE').length;
    expect(result.created).toBe(expected);
    expect(db.services.every((service) => service.isActive && service.catalogKey && service.catalogHash)).toBe(true);
  });

  it('não mexe no que o município editou nem religa o que ele desligou', async () => {
    const fields = catalogFields(def);
    const edited = {
      id: 's1',
      tenantId: 't1',
      departmentId: dept.id,
      moduleType: def.moduleType || null,
      ...fields,
      description: 'Texto da prefeitura',
      estimatedDays: 99,
      isActive: false,
      catalogKey: catalogKeyOf(def),
      catalogHash: 'impressao-antiga',
    };
    const db = fakeDb([dept], [edited]);
    const result = await applyServiceCatalog(db, 't1');
    const row = db.services.find((service) => service.id === 's1');
    expect(row.description).toBe('Texto da prefeitura');
    expect(row.estimatedDays).toBe(99);
    expect(row.isActive).toBe(false);
    expect(result.keptEdited).toBeGreaterThanOrEqual(1);
  });

  it('serviço não editado recebe a melhoria do catálogo', async () => {
    const old = { ...catalogFields(def), description: 'versão antiga do catálogo' };
    const untouched = {
      id: 's2',
      tenantId: 't1',
      departmentId: dept.id,
      moduleType: def.moduleType || null,
      ...old,
      isActive: true,
      catalogKey: catalogKeyOf(def),
      catalogHash: catalogHashOf(old),
    };
    const db = fakeDb([dept], [untouched]);
    await applyServiceCatalog(db, 't1');
    const row = db.services.find((service) => service.id === 's2');
    expect(row.description).toBe(def.description);
    expect(row.catalogHash).toBe(catalogHashOf(catalogFields(def)));
  });

  it('serviço antigo (sem impressão) só ganha a base, sem ser alterado', async () => {
    const legacy = {
      id: 's3',
      tenantId: 't1',
      departmentId: dept.id,
      moduleType: def.moduleType || null,
      ...catalogFields(def),
      description: 'antiga',
      isActive: true,
      catalogKey: null,
      catalogHash: null,
    };
    const db = fakeDb([dept], [legacy]);
    await applyServiceCatalog(db, 't1');
    const row = db.services.find((service) => service.id === 's3');
    expect(row.description).toBe('antiga');
    expect(row.catalogKey).toBe(catalogKeyOf(def));
    expect(row.catalogHash).toBe(catalogHashOf(row));
  });
});

import { normalizeFormSchema } from '../../src/utils/form-schema-normalize';

describe('formulário do serviço num formato só', () => {
  it('lista de campos da tela vira JSON Schema com obrigatórios no lugar certo', () => {
    const schema = normalizeFormSchema({
      fields: [
        { id: 'area', type: 'number', label: 'Área', required: true },
        { id: 'tipo', type: 'select', label: 'Tipo', required: false, options: ['A', 'B'] },
      ],
      properties: { area: { type: 'number', title: 'Área', required: true } },
    });
    expect(schema.required).toEqual(['area']);
    expect(schema.properties.area.required).toBeUndefined();
    expect(schema.properties.tipo).toMatchObject({ type: 'string', title: 'Tipo', enum: ['A', 'B'] });
    expect(schema.fields).toHaveLength(2);
  });

  it('JSON Schema do catálogo fica como está', () => {
    const catalog = { type: 'object', properties: { x: { type: 'string', title: 'X' } }, required: ['x'] };
    expect(normalizeFormSchema(catalog)).toEqual(catalog);
  });
});
