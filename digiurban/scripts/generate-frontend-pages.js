/**
 * Script para gerar páginas frontend para todos os 114 módulos
 * Cada página usa o BaseModuleView com as 4 abas padrão
 */

const fs = require('fs');
const path = require('path');

const MODULES = {
  SAUDE: {
    name: 'Saúde',
    path: 'saude',
    modules: [
      { code: 'ATENDIMENTOS_SAUDE', name: 'Atendimentos de Saúde', route: 'atendimentos' },
      { code: 'AGENDAMENTO_CONSULTA', name: 'Agendamento de Consulta', route: 'agendamentos' },
      { code: 'CONTROLE_MEDICAMENTOS', name: 'Controle de Medicamentos', route: 'medicamentos' },
      { code: 'CAMPANHAS_VACINACAO', name: 'Campanhas de Vacinação', route: 'vacinacao' },
      { code: 'PROGRAMAS_SAUDE', name: 'Programas de Saúde', route: 'programas' },
      { code: 'ENCAMINHAMENTO_TFD', name: 'Encaminhamento TFD', route: 'tfd' },
      { code: 'SOLICITACAO_EXAMES', name: 'Solicitação de Exames', route: 'exames' },
      { code: 'TRANSPORTE_PACIENTES', name: 'Transporte de Pacientes', route: 'transporte' },
      { code: 'CADASTRO_PACIENTE', name: 'Cadastro de Paciente', route: 'pacientes' },
      { code: 'REGISTRO_VACINACAO', name: 'Registro de Vacinação', route: 'registro-vacinacao' },
      { code: 'GESTAO_ACS', name: 'Gestão de ACS', route: 'acs' },
    ],
  },
  EDUCACAO: {
    name: 'Educação',
    path: 'educacao',
    modules: [
      { code: 'ATENDIMENTOS_EDUCACAO', name: 'Atendimentos de Educação', route: 'atendimentos' },
      { code: 'MATRICULA_ALUNO', name: 'Matrícula de Aluno', route: 'matriculas' },
      { code: 'TRANSPORTE_ESCOLAR', name: 'Transporte Escolar', route: 'transporte' },
      { code: 'REGISTRO_OCORRENCIA_ESCOLAR', name: 'Registro de Ocorrência Escolar', route: 'ocorrencias' },
      { code: 'SOLICITACAO_DOCUMENTO_ESCOLAR', name: 'Solicitação de Documento Escolar', route: 'documentos' },
      { code: 'TRANSFERENCIA_ESCOLAR', name: 'Transferência Escolar', route: 'transferencias' },
      { code: 'CONSULTA_FREQUENCIA', name: 'Consulta de Frequência', route: 'frequencia' },
      { code: 'CONSULTA_NOTAS', name: 'Consulta de Notas', route: 'notas' },
      { code: 'GESTAO_ESCOLAR', name: 'Gestão Escolar', route: 'gestao-escolar' },
      { code: 'GESTAO_MERENDA', name: 'Gestão de Merenda', route: 'merenda' },
      { code: 'CALENDARIO_ESCOLAR', name: 'Calendário Escolar', route: 'calendario' },
    ],
  },
  ASSISTENCIA_SOCIAL: {
    name: 'Assistência Social',
    path: 'assistencia-social',
    modules: [
      { code: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL', name: 'Atendimentos de Assistência Social', route: 'atendimentos' },
      { code: 'CADASTRO_UNICO', name: 'Cadastro Único', route: 'cadastro-unico' },
      { code: 'SOLICITACAO_BENEFICIO', name: 'Solicitação de Benefício', route: 'beneficios' },
      { code: 'ENTREGA_EMERGENCIAL', name: 'Entrega Emergencial', route: 'entregas-emergenciais' },
      { code: 'INSCRICAO_GRUPO_OFICINA', name: 'Inscrição em Grupo/Oficina', route: 'inscricoes-grupos' },
      { code: 'VISITAS_DOMICILIARES', name: 'Visitas Domiciliares', route: 'visitas-domiciliares' },
      { code: 'INSCRICAO_PROGRAMA_SOCIAL', name: 'Inscrição em Programa Social', route: 'inscricoes-programas' },
      { code: 'AGENDAMENTO_ATENDIMENTO_SOCIAL', name: 'Agendamento de Atendimento Social', route: 'agendamentos' },
      { code: 'GESTAO_CRAS_CREAS', name: 'Gestão CRAS/CREAS', route: 'equipamentos' },
    ],
  },
};

function toKebabCase(str) {
  return str.toLowerCase().replace(/_/g, '-');
}

const PAGE_TEMPLATE = (deptName, deptPath, moduleName, moduleCode, moduleRoute) => `'use client'

import { BaseModuleView, ModuleConfig } from '@/components/modules/BaseModuleView'

/**
 * ${moduleName}
 *
 * Módulo completo com 4 abas:
 * 1. Listagem - Visualizar todas as solicitações
 * 2. Aprovação - Aprovar/rejeitar pendências
 * 3. Dashboard - Métricas e indicadores
 * 4. Gerenciamento - CRUD de dados mestres
 */

export default function Page() {
  const config: ModuleConfig = {
    code: '${moduleCode}',
    name: '${moduleName}',
    department: '${deptPath.toUpperCase()}',
    apiEndpoint: '${deptPath}/${toKebabCase(moduleCode)}',
    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },
    breadcrumb: [
      { label: 'Admin', href: '/admin' },
      { label: 'Secretarias', href: '/admin/secretarias' },
      { label: '${deptName}', href: '/admin/secretarias/${deptPath}' },
      { label: '${moduleName}' },
    ],
  }

  return <BaseModuleView config={config} />
}
`;

let totalPages = 0;

console.log('🚀 GERANDO PÁGINAS FRONTEND...\n');

Object.entries(MODULES).forEach(([dept, deptData]) => {
  console.log(`📁 ${deptData.name}:`);

  deptData.modules.forEach((module) => {
    const dir = path.join(
      __dirname,
      '..',
      'frontend',
      'app',
      'admin',
      'secretarias',
      deptData.path,
      module.route + '-tab'
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = PAGE_TEMPLATE(
      deptData.name,
      deptData.path,
      module.name,
      module.code,
      module.route
    );

    fs.writeFileSync(path.join(dir, 'page.tsx'), content);

    console.log(`  ✅ ${module.route}-tab/page.tsx`);
    totalPages++;
  });

  console.log('');
});

console.log(`\n🎉 TOTAL: ${totalPages} páginas geradas!\n`);
console.log('📝 Cada página tem:');
console.log('  - Aba de Listagem');
console.log('  - Aba de Aprovação');
console.log('  - Aba de Dashboard');
console.log('  - Aba de Gerenciamento');
console.log('\n✅ Pronto para uso!');
