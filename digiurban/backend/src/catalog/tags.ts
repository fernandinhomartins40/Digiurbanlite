/**
 * Etiquetas prontas que todo município recebe junto com o catálogo de serviços.
 * Cada uma diz quais serviços do catálogo (pela chave) dão a etiqueta quando o
 * pedido é concluído. Só características da pessoa ("é produtor rural"), nunca
 * eventos pontuais (corrida, competição, hackathon).
 */

import { catalogKeyOf, allServices } from './services';

export interface CatalogTag {
  name: string;
  description: string;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal' | 'pink' | 'gray';
  /** chaves do catálogo (catalogKey = código técnico do serviço) */
  serviceKeys: string[];
}

export const CATALOG_TAGS: CatalogTag[] = [
  { name: 'Produtor Rural', description: 'Produtor rural, piscicultor ou agroindústria familiar cadastrado', color: 'green', serviceKeys: ['CADASTRO_PRODUTOR', 'CADASTRO_PISCICULTURA', 'CADASTRO_AGROINDUSTRIA'] },
  { name: 'Proprietário Rural', description: 'Tem propriedade rural cadastrada no município', color: 'green', serviceKeys: ['CADASTRO_PROPRIEDADE_RURAL'] },
  { name: 'Feirante', description: 'Inscrito na feira do produtor', color: 'amber', serviceKeys: ['FEIRA_PRODUTOR'] },
  { name: 'Beneficiário de Programa Rural', description: 'Participa de programa rural do município', color: 'green', serviceKeys: ['INSCRICAO_PROGRAMA_RURAL'] },
  { name: 'Família no CadÚnico', description: 'Família com Cadastro Único feito pelo município', color: 'purple', serviceKeys: ['CADASTRO_UNICO'] },
  { name: 'Beneficiário de Programa Social', description: 'Participa de programa social do município', color: 'purple', serviceKeys: ['INSCRICAO_PROGRAMA_SOCIAL', 'BOLSA_FAMILIA_MUNICIPAL'] },
  { name: 'Inscrito em Programa Habitacional', description: 'Inscrito em programa de moradia do município', color: 'teal', serviceKeys: ['INSCRICAO_PROGRAMA_HABITACIONAL', 'INSCRICAO_MCMV_MUNICIPAL', 'CADASTRO_DEFICIT_HABITACIONAL'] },
  { name: 'Família em Área de Risco', description: 'Família cadastrada pela Defesa Civil em área de risco', color: 'red', serviceKeys: ['CADASTRO_FAMILIA_RISCO'] },
  { name: 'Aluno da Rede Municipal', description: 'Matriculado em escola, creche ou EJA do município', color: 'blue', serviceKeys: ['MATRICULA_ESCOLAR', 'INSCRICAO_CRECHE', 'INSCRICAO_EJA'] },
  { name: 'Acompanhado pela Saúde da Família', description: 'Cadastrado no Programa Saúde da Família', color: 'teal', serviceKeys: ['PROGRAMA_SAUDE_FAMILIA'] },
  { name: 'Artista Local', description: 'Artista ou grupo artístico cadastrado no município', color: 'pink', serviceKeys: ['CADASTRO_ARTISTA', 'CADASTRO_GRUPO_ARTISTICO'] },
  { name: 'Atleta', description: 'Atleta cadastrado no município', color: 'blue', serviceKeys: ['CADASTRO_ATLETA'] },
  {
    name: 'Aluno de Escolinha Esportiva',
    description: 'Inscrito em escolinha esportiva do município',
    color: 'blue',
    serviceKeys: [
      'INSCRICAO_ESCOLINHA_FUTEBOL', 'INSCRICAO_ESCOLINHA_BASQUETE', 'INSCRICAO_ESCOLINHA_VOLEI', 'INSCRICAO_ESCOLINHA_NATACAO',
      'INSCRICAO_ESCOLINHA_JUDO', 'INSCRICAO_ESCOLINHA_CAPOEIRA', 'INSCRICAO_ESCOLINHA_GINASTICA',
    ],
  },
  { name: 'Microempreendedor (MEI)', description: 'MEI cadastrado no município', color: 'amber', serviceKeys: ['CADASTRO_MEI'] },
  { name: 'Fornecedor do Município', description: 'Cadastrado como fornecedor da prefeitura', color: 'gray', serviceKeys: ['CADASTRO_FORNECEDOR'] },
  { name: 'Em Busca de Emprego', description: 'Cadastrado no balcão de empregos', color: 'amber', serviceKeys: ['CADASTRO_BALCAO_EMPREGOS'] },
  { name: 'Guia Turístico', description: 'Guia de turismo cadastrado', color: 'teal', serviceKeys: ['CADASTRO_GUIA_TURISTICO'] },
  { name: 'Taxista', description: 'Taxista credenciado', color: 'amber', serviceKeys: ['CREDENCIAMENTO_TAXI'] },
  { name: 'Mototaxista', description: 'Mototaxista credenciado', color: 'amber', serviceKeys: ['CREDENCIAMENTO_MOTOTAXI'] },
  { name: 'Transportador Escolar', description: 'Credenciado no transporte escolar', color: 'amber', serviceKeys: ['CREDENCIAMENTO_TRANSPORTE_ESCOLAR'] },
  { name: 'Voluntário da Defesa Civil', description: 'Voluntário cadastrado na Defesa Civil', color: 'red', serviceKeys: ['CADASTRO_VOLUNTARIO'] },
];

const tagCode = (name: string) =>
  String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'ETIQUETA';

/**
 * Coloca as etiquetas prontas no município e liga aos serviços do catálogo.
 * Respeita o município: etiqueta que já existe (mesmo nome) só ganha os
 * serviços criados AGORA pelo catálogo — o que ele desligou não volta.
 */
export async function applyCatalogTags(db: any, tenantId: string, createdServiceKeys: Set<string>): Promise<{ created: number; linked: number }> {
  const result = { created: 0, linked: 0 };
  const keys = [...new Set(CATALOG_TAGS.flatMap((tag) => tag.serviceKeys))];
  const services: Array<{ id: string; catalogKey: string | null; moduleType: string | null }> = await db.serviceSimplified.findMany({
    where: { tenantId, OR: [{ catalogKey: { in: keys } }, { moduleType: { in: keys } }] },
    select: { id: true, catalogKey: true, moduleType: true },
  });
  const idsFor = (tagKeys: string[], onlyCreated: boolean) =>
    services
      .filter((service) => {
        const key = service.catalogKey || service.moduleType || '';
        return tagKeys.includes(key) && (!onlyCreated || createdServiceKeys.has(key));
      })
      .map((service) => service.id);

  const existingTags: Array<{ id: string; name: string; code: string; triggerServiceIds: string[] }> = await db.citizenCategory.findMany({
    where: { tenantId },
    select: { id: true, name: true, code: true, triggerServiceIds: true },
  });
  const codes = new Set(existingTags.map((tag) => tag.code));

  for (const tag of CATALOG_TAGS) {
    const existing = existingTags.find((item) => item.name.trim().toLowerCase() === tag.name.toLowerCase());
    if (!existing) {
      const serviceIds = idsFor(tag.serviceKeys, false);
      if (serviceIds.length === 0) continue;
      let code = tagCode(tag.name);
      for (let n = 2; codes.has(code); n++) code = `${tagCode(tag.name)}_${n}`;
      codes.add(code);
      await db.citizenCategory.create({
        data: { tenantId, name: tag.name, code, description: tag.description, color: tag.color, department: 'GERAL', triggerServiceIds: serviceIds },
      });
      result.created++;
      continue;
    }
    const fresh = idsFor(tag.serviceKeys, true).filter((id) => !existing.triggerServiceIds.includes(id));
    if (fresh.length) {
      await db.citizenCategory.update({ where: { id: existing.id }, data: { triggerServiceIds: [...existing.triggerServiceIds, ...fresh] } });
      result.linked += fresh.length;
    }
  }
  return result;
}

/** Para o teste: toda chave citada existe no catálogo */
export function unknownTagKeys(): string[] {
  const known = new Set(allServices.map(catalogKeyOf));
  return CATALOG_TAGS.flatMap((tag) => tag.serviceKeys).filter((key) => !known.has(key));
}
