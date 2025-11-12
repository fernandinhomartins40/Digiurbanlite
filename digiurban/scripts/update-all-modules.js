const fs = require('fs');
const path = require('path');

const MODULES = {
  'assistencia-social': [
    { folder: 'agendamentos', code: 'AGENDAMENTO_ATENDIMENTO_SOCIAL', name: 'Agendamentos', endpoint: 'agendamento-atendimento-social' },
    { folder: 'atendimentos', code: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL', name: 'Atendimentos', endpoint: 'atendimentos-assistencia-social' },
    { folder: 'entregas-emergenciais', code: 'ENTREGA_EMERGENCIAL', name: 'Entregas Emergenciais', endpoint: 'entrega-emergencial' },
    { folder: 'equipamentos', code: 'GESTAO_CRAS_CREAS', name: 'CRAS/CREAS', endpoint: 'gestao-cras-creas' },
    { folder: 'familias-vulneraveis', code: 'CADASTRO_UNICO', name: 'Cadastro Único', endpoint: 'cadastro-unico' },
    { folder: 'inscricoes-grupos', code: 'INSCRICAO_GRUPO_OFICINA', name: 'Grupos e Oficinas', endpoint: 'inscricao-grupo-oficina' },
    { folder: 'inscricoes-programas', code: 'INSCRICAO_PROGRAMA_SOCIAL', name: 'Programas Sociais', endpoint: 'inscricao-programa-social' },
    { folder: 'solicitacoes-beneficios', code: 'SOLICITACAO_BENEFICIO', name: 'Benefícios', endpoint: 'solicitacao-beneficio' },
    { folder: 'visitas-domiciliares', code: 'VISITAS_DOMICILIARES', name: 'Visitas Domiciliares', endpoint: 'visitas-domiciliares' },
  ],
  'agricultura': [
    { folder: 'assistencia-tecnica', code: 'ASSISTENCIA_TECNICA_RURAL', name: 'Assistência Técnica', endpoint: 'assistencia-tecnica-rural' },
    { folder: 'atendimentos', code: 'ATENDIMENTOS_AGRICULTURA', name: 'Atendimentos', endpoint: 'atendimentos-agricultura' },
    { folder: 'capacitacoes', code: 'INSCRICAO_CURSO_RURAL', name: 'Capacitações', endpoint: 'inscricao-curso-rural' },
    { folder: 'produtores', code: 'CADASTRO_PRODUTOR_RURAL', name: 'Produtores Rurais', endpoint: 'cadastro-produtor-rural' },
    { folder: 'programas', code: 'INSCRICAO_PROGRAMA_RURAL', name: 'Programas Rurais', endpoint: 'inscricao-programa-rural' },
    { folder: 'propriedades', code: 'CADASTRO_PROPRIEDADE_RURAL', name: 'Propriedades Rurais', endpoint: 'cadastro-propriedade-rural' },
  ],
  'cultura': [
    { folder: 'atendimentos', code: 'ATENDIMENTOS_CULTURA', name: 'Atendimentos', endpoint: 'atendimentos-cultura' },
    { folder: 'espacos-culturais', code: 'RESERVA_ESPACO_CULTURAL', name: 'Espaços Culturais', endpoint: 'reserva-espaco-cultural' },
    { folder: 'eventos', code: 'CADASTRO_EVENTO_CULTURAL', name: 'Eventos', endpoint: 'cadastro-evento-cultural' },
    { folder: 'grupos-artisticos', code: 'CADASTRO_GRUPO_ARTISTICO', name: 'Grupos Artísticos', endpoint: 'cadastro-grupo-artistico' },
    { folder: 'manifestacoes-culturais', code: 'REGISTRO_MANIFESTACAO_CULTURAL', name: 'Manifestações Culturais', endpoint: 'registro-manifestacao-cultural' },
    { folder: 'oficinas-cursos', code: 'INSCRICAO_OFICINA_CULTURAL', name: 'Oficinas Culturais', endpoint: 'inscricao-oficina-cultural' },
    { folder: 'projetos-culturais', code: 'PROJETO_CULTURAL', name: 'Projetos Culturais', endpoint: 'projeto-cultural' },
  ],
  'esportes': [
    { folder: 'atendimentos', code: 'ATENDIMENTOS_ESPORTES', name: 'Atendimentos', endpoint: 'atendimentos-esportes' },
    { folder: 'atletas', code: 'CADASTRO_ATLETA', name: 'Atletas', endpoint: 'cadastro-atleta' },
    { folder: 'competicoes', code: 'INSCRICAO_COMPETICAO', name: 'Competições', endpoint: 'inscricao-competicao' },
    { folder: 'equipes', code: 'CADASTRO_EQUIPE_ESPORTIVA', name: 'Equipes', endpoint: 'cadastro-equipe-esportiva' },
    { folder: 'escolinhas', code: 'INSCRICAO_ESCOLINHA_ESPORTIVA', name: 'Escolinhas Esportivas', endpoint: 'inscricao-escolinha-esportiva' },
    { folder: 'modalidades', code: 'CADASTRO_MODALIDADE_ESPORTIVA', name: 'Modalidades', endpoint: 'cadastro-modalidade-esportiva' },
    { folder: 'reservas', code: 'RESERVA_ESPACO_ESPORTIVO', name: 'Reservas', endpoint: 'reserva-espaco-esportivo' },
    { folder: 'torneios', code: 'INSCRICAO_TORNEIO', name: 'Torneios', endpoint: 'inscricao-torneio' },
  ],
};

const DEPT_LABELS = {
  'assistencia-social': 'Assistência Social',
  'agricultura': 'Agricultura',
  'cultura': 'Cultura',
  'esportes': 'Esportes',
};

function toPascalCase(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

const TEMPLATE = (funcName, code, name, dept, deptLabel, endpoint) => `'use client';

import { BaseModuleView, ModuleConfig } from '@/components/modules/BaseModuleView';

export default function ${funcName}Page() {
  const config: ModuleConfig = {
    code: '${code}',
    name: '${name}',
    department: '${dept.toUpperCase().replace('-', '_')}',
    apiEndpoint: '${dept}/${endpoint}',
    tabs: { list: true, approval: true, dashboard: true, management: true },
    breadcrumb: [
      { label: 'Admin', href: '/admin' },
      { label: 'Secretarias', href: '/admin/secretarias' },
      { label: '${deptLabel}', href: '/admin/secretarias/${dept}' },
      { label: '${name}' },
    ],
  };
  return <BaseModuleView config={config} />;
}
`;

let totalUpdated = 0;

Object.entries(MODULES).forEach(([dept, modules]) => {
  console.log(`\n📁 ${DEPT_LABELS[dept]}:`);

  modules.forEach(({ folder, code, name, endpoint }) => {
    const filePath = path.join(
      __dirname,
      '..',
      'frontend',
      'app',
      'admin',
      'secretarias',
      dept,
      folder,
      'page.tsx'
    );

    if (fs.existsSync(filePath)) {
      const funcName = toPascalCase(folder);
      const content = TEMPLATE(funcName, code, name, dept, DEPT_LABELS[dept], endpoint);

      fs.writeFileSync(filePath, content);
      console.log(`  ✅ ${folder}/page.tsx`);
      totalUpdated++;
    } else {
      console.log(`  ⚠️  ${folder}/page.tsx (não encontrado)`);
    }
  });
});

console.log(`\n🎉 Total: ${totalUpdated} módulos atualizados!\n`);
