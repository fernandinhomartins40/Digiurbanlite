import { SecretariaConfig} from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Turismo
 *
 * 7 módulos totais
 */
export const turismoConfig: SecretariaConfig = {
  id: 'turismo',
  name: 'Secretaria de Turismo',
  slug: 'turismo',
  departmentId: 'turismo',

  modules: [
    { id: 'guias', moduleType: 'CADASTRO_GUIA_TURISTICO' },
    { id: 'estabelecimentos', moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO' },
    { id: 'eventos', moduleType: 'CADASTRO_EVENTO_TURISTICO' },
    { id: 'roteiros', moduleType: 'CADASTRO_ROTEIRO_TURISTICO' },
    { id: 'programas', moduleType: 'INSCRICAO_PROGRAMA_TURISTICO' },
    { id: 'atrativos', moduleType: 'REGISTRO_ATRATIVO_TURISTICO' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_TURISMO' }
  ]
};
