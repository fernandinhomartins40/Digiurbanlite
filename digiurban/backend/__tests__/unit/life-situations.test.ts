/**
 * Situações de vida (Plano de Produto M3): apontam para serviços que existem
 * no catálogo e só aparecem quando o município tem algum deles ativo.
 */

import { allServices, catalogKeyOf } from '../../src/catalog/services';
import { LIFE_SITUATIONS, servicesForSituation, situationsForServices } from '../../src/catalog/life-situations';

describe('situações de vida', () => {
  it('toda catalogKey citada existe no catálogo de serviços', () => {
    const keys = new Set(allServices.map(catalogKeyOf));
    const missing = LIFE_SITUATIONS.flatMap((s) => s.catalogKeys.filter((k) => !keys.has(k)).map((k) => `${s.slug}: ${k}`));
    expect(missing).toEqual([]);
  });

  it('slugs únicos', () => {
    const slugs = LIFE_SITUATIONS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('"Tive um filho" junta serviços de mais de uma secretaria do catálogo', () => {
    const catalog = allServices.map((d, i) => ({ id: String(i), name: d.name, catalogKey: catalogKeyOf(d), dept: d.departmentCode }));
    const found = servicesForSituation(LIFE_SITUATIONS.find((s) => s.slug === 'tive-um-filho')!, catalog);
    expect(new Set(found.map((s) => s.dept)).size).toBeGreaterThan(1);
  });

  it('acha serviço do município pelo nome (palavra inteira) e põe os do catálogo antes', () => {
    const situation = LIFE_SITUATIONS.find((s) => s.slug === 'perdi-um-familiar')!;
    const found = servicesForSituation(situation, [
      { id: 'a', name: 'Sepultamento no Cemitério Municipal', catalogKey: null },
      { id: 'b', name: 'Benefício Eventual', catalogKey: 'BENEFICIO_EVENTUAL' },
      { id: 'c', name: 'Cemiteriozinho', catalogKey: null },
    ]);
    expect(found.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('município sem os serviços não mostra a situação', () => {
    const result = situationsForServices([{ id: 'x', name: 'Poda de Árvore em Canteiro', catalogKey: 'PODA_CANTEIRO' }]);
    expect(result.map((s) => s.slug)).toEqual(['problema-na-rua']);
    expect(result[0].serviceIds).toEqual(['x']);
  });
});
