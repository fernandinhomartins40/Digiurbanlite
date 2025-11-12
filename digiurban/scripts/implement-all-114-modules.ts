/**
 * @file implement-all-114-modules.ts
 * @description Script para implementar automaticamente TODOS os 114 módulos
 * @usage ts-node scripts/implement-all-114-modules.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Definição COMPLETA de TODOS os 114 módulos do sistema
const COMPLETE_MODULES_DATA = {
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

/**
 * Template de Service
 */
const SERVICE_TEMPLATE = (moduleName: string, entityName: string, department: string) => `
import { PrismaClient } from '@prisma/client';
import { BaseTabService } from '../core/base';
import { ApprovalConfig, EntityConfig } from '../core/interfaces';

export class ${moduleName}TabService extends BaseTabService {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return '${entityName}';
  }

  getApprovalConfig(): ApprovalConfig | null {
    // TODO: Configurar se requer aprovação
    return null;
  }

  getManagementEntities(): EntityConfig[] {
    // TODO: Definir entidades gerenciáveis
    return [];
  }

  getAvailableKPIs(): string[] {
    return ['total', 'pending', 'completed', 'avgTime'];
  }
}
`;

/**
 * Template de Controller
 */
const CONTROLLER_TEMPLATE = (moduleName: string) => `
import { BaseTabController } from '../core/base';
import { ${moduleName}TabService } from './${moduleName.toLowerCase()}-tab.service';

export class ${moduleName}TabController extends BaseTabController {
  constructor(service: ${moduleName}TabService) {
    super(service);
  }
}
`;

/**
 * Template de Routes
 */
const ROUTES_TEMPLATE = (moduleName: string) => `
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ${moduleName}TabService } from './${moduleName.toLowerCase()}-tab.service';
import { ${moduleName}TabController } from './${moduleName.toLowerCase()}-tab.controller';

const router = Router();
const prisma = new PrismaClient();
const service = new ${moduleName}TabService(prisma);
const controller = new ${moduleName}TabController(service);

// Aba de Listagem
router.get('/list', controller.handleGetList);
router.get('/:id', controller.handleGetDetails);
router.get('/:id/history', async (req, res) => {
  const history = await controller.getRequestHistory(req.params.id);
  res.json(history);
});

// Aba de Dashboard
router.get('/dashboard', controller.handleGetDashboard);
router.get('/dashboard/kpis', async (req, res) => {
  const kpis = await controller.getKPIs(req.query as any);
  res.json(kpis);
});

// Aba de Gerenciamento
router.get('/management/entities', controller.handleGetManagementEntities);
router.get('/management/:entity', controller.handleListEntity);
router.post('/management/:entity', controller.handleCreateEntity);
router.put('/management/:entity/:id', controller.handleUpdateEntity);
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

export default router;
`;

/**
 * Gera todos os arquivos para um módulo
 */
function generateModuleFiles(moduleCode: string, department: string) {
  const moduleName = toCamelCase(moduleCode);
  const entityName = toEntityName(moduleCode);
  const deptLower = department.toLowerCase();

  const basePath = path.join(__dirname, '..', 'src', 'modules', deptLower);

  // Criar diretório se não existir
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  // Gerar arquivos
  const files = {
    [`${moduleName.toLowerCase()}-tab.service.ts`]: SERVICE_TEMPLATE(moduleName, entityName, department),
    [`${moduleName.toLowerCase()}-tab.controller.ts`]: CONTROLLER_TEMPLATE(moduleName),
    [`${moduleName.toLowerCase()}.routes.ts`]: ROUTES_TEMPLATE(moduleName),
  };

  Object.entries(files).forEach(([filename, content]) => {
    const filepath = path.join(basePath, filename);
    fs.writeFileSync(filepath, content);
    console.log(`✅ Criado: ${filepath}`);
  });
}

/**
 * Converte código para CamelCase
 */
function toCamelCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converte código para nome de entidade
 */
function toEntityName(str: string): string {
  return str.toLowerCase().replace(/_/g, '');
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando geração de TODOS os 114 módulos...\n');

  let totalGenerated = 0;

  Object.entries(COMPLETE_MODULES_DATA).forEach(([department, modules]) => {
    console.log(`\n📁 Gerando módulos de ${department}...`);

    modules.forEach((moduleCode) => {
      generateModuleFiles(moduleCode, department);
      totalGenerated++;
    });

    console.log(`✅ ${department}: ${modules.length} módulos gerados`);
  });

  console.log(`\n🎉 CONCLUÍDO! Total: ${totalGenerated} módulos gerados`);
  console.log('\n📊 Resumo:');
  Object.entries(COMPLETE_MODULES_DATA).forEach(([dept, mods]) => {
    console.log(`  - ${dept}: ${mods.length} módulos`);
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { generateModuleFiles, COMPLETE_MODULES_DATA };
