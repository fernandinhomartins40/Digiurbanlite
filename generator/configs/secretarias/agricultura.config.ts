import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Agricultura
 *
 * 6 módulos totais
 */
export const agriculturaConfig: SecretariaConfig = {
  id: 'agricultura',
  name: 'Secretaria de Agricultura',
  slug: 'agricultura',
  departmentId: 'agricultura',

  modules: [
    { id: 'propriedades', moduleType: 'CADASTRO_PROPRIEDADE_RURAL' },
    { id: 'produtores', moduleType: 'CADASTRO_PRODUTOR' },
    { id: 'cursos', moduleType: 'INSCRICAO_CURSO_RURAL' },
    { id: 'programas', moduleType: 'INSCRICAO_PROGRAMA_RURAL' },
    { id: 'assistencia', moduleType: 'ASSISTENCIA_TECNICA' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_AGRICULTURA' }
  ]
};
