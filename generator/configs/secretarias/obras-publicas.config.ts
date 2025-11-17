import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Obras Públicas
 *
 * 4 módulos totais
 */
export const obrasPublicasConfig: SecretariaConfig = {
  id: 'obras-publicas',
  name: 'Secretaria de Obras Públicas',
  slug: 'obras-publicas',
  departmentId: 'obras-publicas',

  modules: [
    { id: 'obras', moduleType: 'CADASTRO_OBRA_PUBLICA' },
    { id: 'inspecoes', moduleType: 'INSPECAO_OBRA' },
    { id: 'vistorias', moduleType: 'VISTORIA_TECNICA_OBRAS' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_OBRAS' }
  ]
};
