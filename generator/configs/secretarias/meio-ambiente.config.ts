import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Meio Ambiente
 *
 * 7 módulos totais
 */
export const meioAmbienteConfig: SecretariaConfig = {
  id: 'meio-ambiente',
  name: 'Secretaria de Meio Ambiente',
  slug: 'meio-ambiente',
  departmentId: 'meio-ambiente',

  modules: [
    { id: 'licencas', moduleType: 'LICENCA_AMBIENTAL' },
    { id: 'denuncias', moduleType: 'DENUNCIA_AMBIENTAL' },
    { id: 'programas', moduleType: 'PROGRAMA_AMBIENTAL' },
    { id: 'podas', moduleType: 'AUTORIZACAO_PODA_CORTE' },
    { id: 'vistorias', moduleType: 'VISTORIA_AMBIENTAL' },
    { id: 'areas-protegidas', moduleType: 'GESTAO_AREAS_PROTEGIDAS' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE' }
  ]
};
