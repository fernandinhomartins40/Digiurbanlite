import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Segurança Pública
 *
 * 10 módulos totais
 */
export const segurancaPublicaConfig: SecretariaConfig = {
  id: 'seguranca-publica',
  name: 'Secretaria de Segurança Pública',
  slug: 'seguranca-publica',
  departmentId: 'seguranca-publica',

  modules: [
    { id: 'ocorrencias', moduleType: 'REGISTRO_OCORRENCIA' },
    { id: 'denuncias', moduleType: 'DENUNCIA_ANONIMA' },
    { id: 'rondas', moduleType: 'SOLICITACAO_RONDA' },
    { id: 'cameras', moduleType: 'SOLICITACAO_CAMERA_SEGURANCA' },
    { id: 'pontos-criticos', moduleType: 'CADASTRO_PONTO_CRITICO' },
    { id: 'alertas', moduleType: 'ALERTA_SEGURANCA' },
    { id: 'patrulhas', moduleType: 'REGISTRO_PATRULHA' },
    { id: 'gestao-guarda', moduleType: 'GESTAO_GUARDA_MUNICIPAL' },
    { id: 'vigilancia', moduleType: 'GESTAO_VIGILANCIA' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_SEGURANCA' }
  ]
};
