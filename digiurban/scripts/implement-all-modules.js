/**
 * Script para gerar automaticamente TODOS os 114 módulos
 */

const fs = require('fs');
const path = require('path');

// TODOS os 114 módulos
const MODULES = {
  SAUDE: [
    'ATENDIMENTOS_SAUDE', 'AGENDAMENTO_CONSULTA', 'CONTROLE_MEDICAMENTOS',
    'CAMPANHAS_VACINACAO', 'PROGRAMAS_SAUDE', 'ENCAMINHAMENTO_TFD',
    'SOLICITACAO_EXAMES', 'TRANSPORTE_PACIENTES', 'CADASTRO_PACIENTE',
    'REGISTRO_VACINACAO', 'GESTAO_ACS'
  ],
  EDUCACAO: [
    'ATENDIMENTOS_EDUCACAO', 'MATRICULA_ALUNO', 'TRANSPORTE_ESCOLAR',
    'REGISTRO_OCORRENCIA_ESCOLAR', 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'TRANSFERENCIA_ESCOLAR', 'CONSULTA_FREQUENCIA', 'CONSULTA_NOTAS',
    'GESTAO_ESCOLAR', 'GESTAO_MERENDA', 'CALENDARIO_ESCOLAR'
  ],
  ASSISTENCIA_SOCIAL: [
    'ATENDIMENTOS_ASSISTENCIA_SOCIAL', 'CADASTRO_UNICO', 'SOLICITACAO_BENEFICIO',
    'ENTREGA_EMERGENCIAL', 'INSCRICAO_GRUPO_OFICINA', 'VISITAS_DOMICILIARES',
    'INSCRICAO_PROGRAMA_SOCIAL', 'AGENDAMENTO_ATENDIMENTO_SOCIAL', 'GESTAO_CRAS_CREAS'
  ],
  AGRICULTURA: [
    'ATENDIMENTOS_AGRICULTURA', 'CADASTRO_PRODUTOR_RURAL', 'ASSISTENCIA_TECNICA_RURAL',
    'INSCRICAO_CURSO_RURAL', 'INSCRICAO_PROGRAMA_RURAL', 'CADASTRO_PROPRIEDADE_RURAL'
  ],
  CULTURA: [
    'ATENDIMENTOS_CULTURA', 'RESERVA_ESPACO_CULTURAL', 'INSCRICAO_OFICINA_CULTURAL',
    'CADASTRO_GRUPO_ARTISTICO', 'PROJETO_CULTURAL', 'SUBMISSAO_PROJETO_CULTURAL',
    'CADASTRO_EVENTO_CULTURAL', 'REGISTRO_MANIFESTACAO_CULTURAL', 'AGENDA_CULTURAL'
  ],
  ESPORTES: [
    'ATENDIMENTOS_ESPORTES', 'INSCRICAO_ESCOLINHA_ESPORTIVA', 'CADASTRO_ATLETA',
    'RESERVA_ESPACO_ESPORTIVO', 'INSCRICAO_COMPETICAO', 'CADASTRO_EQUIPE_ESPORTIVA',
    'INSCRICAO_TORNEIO', 'CADASTRO_MODALIDADE_ESPORTIVA', 'CALENDARIO_ESPORTIVO'
  ],
  HABITACAO: [
    'ATENDIMENTOS_HABITACAO', 'INSCRICAO_PROGRAMA_HABITACIONAL', 'REGULARIZACAO_FUNDIARIA',
    'SOLICITACAO_AUXILIO_ALUGUEL', 'CADASTRO_UNIDADE_HABITACIONAL',
    'INSCRICAO_FILA_HABITACAO', 'CONSULTA_ANDAMENTO_HABITACAO'
  ],
  MEIO_AMBIENTE: [
    'ATENDIMENTOS_MEIO_AMBIENTE', 'LICENCA_AMBIENTAL', 'DENUNCIA_AMBIENTAL',
    'PROGRAMA_AMBIENTAL', 'AUTORIZACAO_PODA_CORTE', 'VISTORIA_AMBIENTAL',
    'GESTAO_AREAS_PROTEGIDAS'
  ],
  OBRAS_PUBLICAS: [
    'ATENDIMENTOS_OBRAS', 'SOLICITACAO_REPARO_VIA', 'VISTORIA_TECNICA_OBRAS',
    'CADASTRO_OBRA_PUBLICA', 'INSPECAO_OBRA', 'CONSULTA_OBRAS', 'MAPA_OBRAS'
  ],
  PLANEJAMENTO_URBANO: [
    'ATENDIMENTOS_PLANEJAMENTO', 'APROVACAO_PROJETO', 'ALVARA_CONSTRUCAO',
    'ALVARA_FUNCIONAMENTO', 'SOLICITACAO_CERTIDAO', 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    'CADASTRO_LOTEAMENTO', 'CONSULTA_ZONEAMENTO', 'PLANO_DIRETOR'
  ],
  SEGURANCA_PUBLICA: [
    'ATENDIMENTOS_SEGURANCA', 'REGISTRO_OCORRENCIA', 'SOLICITACAO_RONDA',
    'SOLICITACAO_CAMERA_SEGURANCA', 'DENUNCIA_ANONIMA', 'CADASTRO_PONTO_CRITICO',
    'ALERTA_SEGURANCA', 'REGISTRO_PATRULHA', 'GESTAO_GUARDA_MUNICIPAL',
    'GESTAO_VIGILANCIA', 'MAPA_CRIMINALIDADE'
  ],
  SERVICOS_PUBLICOS: [
    'ATENDIMENTOS_SERVICOS_PUBLICOS', 'ILUMINACAO_PUBLICA', 'LIMPEZA_URBANA',
    'COLETA_ESPECIAL', 'SOLICITACAO_CAPINA', 'SOLICITACAO_DESOBSTRUCAO',
    'SOLICITACAO_PODA_ARVORE', 'GESTAO_EQUIPES_SERVICOS', 'CALENDARIO_COLETA'
  ],
  TURISMO: [
    'ATENDIMENTOS_TURISMO', 'CADASTRO_ESTABELECIMENTO_TURISTICO', 'CADASTRO_GUIA_TURISTICO',
    'INSCRICAO_PROGRAMA_TURISTICO', 'REGISTRO_ATRATIVO_TURISTICO',
    'CADASTRO_ROTEIRO_TURISTICO', 'CADASTRO_EVENTO_TURISTICO',
    'GUIA_TURISTICO_DIGITAL', 'CALENDARIO_EVENTOS_TURISTICOS'
  ],
};

function toCamelCase(str) {
  return str.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('');
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/_/g, '-');
}

function toEntityName(str) {
  return str.toLowerCase().replace(/_/g, '');
}

const SERVICE = (name, entity) => `import { PrismaClient } from '@prisma/client';
import { BaseTabService } from '../core/base';
import { ApprovalConfig, EntityConfig } from '../core/interfaces';

export class ${name}Service extends BaseTabService {
  constructor(prisma: PrismaClient) { super(prisma); }
  getEntityName() { return '${entity}'; }
  getApprovalConfig() { return null; }
  getManagementEntities() { return []; }
  getAvailableKPIs() { return ['total', 'pending', 'completed']; }
}
`;

const CONTROLLER = (name, kebab) => `import { BaseTabController } from '../core/base';
import { ${name}Service } from './${kebab}.service';

export class ${name}Controller extends BaseTabController {
  constructor(service: ${name}Service) { super(service); }
}
`;

const ROUTES = (name, kebab) => `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ${name}Service } from './${kebab}.service';
import { ${name}Controller } from './${kebab}.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new ${name}Service(prisma);
const controller = new ${name}Controller(service);

router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/dashboard', controller.handleGetDashboard);
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
`;

let total = 0;

Object.entries(MODULES).forEach(([dept, mods]) => {
  const dir = path.join(__dirname, '..', 'src', 'modules', dept.toLowerCase());

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  mods.forEach(code => {
    const name = toCamelCase(code);
    const entity = toEntityName(code);
    const kebab = toKebabCase(code);

    fs.writeFileSync(path.join(dir, `${kebab}.service.ts`), SERVICE(name, entity));
    fs.writeFileSync(path.join(dir, `${kebab}.controller.ts`), CONTROLLER(name, kebab));
    fs.writeFileSync(path.join(dir, `${kebab}.routes.ts`), ROUTES(name, kebab));

    total++;
  });

  console.log(`✅ ${dept}: ${mods.length} módulos`);
});

console.log(`\n🎉 TOTAL: ${total} módulos gerados!\n`);
