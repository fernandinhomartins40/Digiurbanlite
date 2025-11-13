import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Planejamento Urbano
 *
 * 6 módulos totais
 */
export const planejamentoUrbanoConfig: SecretariaConfig = {
  id: 'planejamento-urbano',
  name: 'Secretaria de Planejamento Urbano',
  slug: 'planejamento-urbano',
  departmentId: 'planejamento-urbano',

  modules: [
    { id: 'alvara-construcao', moduleType: 'ALVARA_CONSTRUCAO' },
    { id: 'alvara-funcionamento', moduleType: 'ALVARA_FUNCIONAMENTO' },
    { id: 'projetos', moduleType: 'APROVACAO_PROJETO' },
    { id: 'denuncias', moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR' },
    { id: 'loteamentos', moduleType: 'CADASTRO_LOTEAMENTO' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_PLANEJAMENTO' }
  ]
};
