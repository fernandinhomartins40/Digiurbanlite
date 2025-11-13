import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Cultura
 *
 * 8 módulos totais
 */
export const culturaConfig: SecretariaConfig = {
  id: 'cultura',
  name: 'Secretaria de Cultura',
  slug: 'cultura',
  departmentId: 'cultura',

  modules: [
    { id: 'espacos', moduleType: 'RESERVA_ESPACO_CULTURAL' },
    { id: 'oficinas', moduleType: 'INSCRICAO_OFICINA_CULTURAL' },
    { id: 'grupos', moduleType: 'CADASTRO_GRUPO_ARTISTICO' },
    { id: 'projetos', moduleType: 'PROJETO_CULTURAL' },
    { id: 'submissoes', moduleType: 'SUBMISSAO_PROJETO_CULTURAL' },
    { id: 'eventos', moduleType: 'CADASTRO_EVENTO_CULTURAL' },
    { id: 'manifestacoes', moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_CULTURA' }
  ]
};
