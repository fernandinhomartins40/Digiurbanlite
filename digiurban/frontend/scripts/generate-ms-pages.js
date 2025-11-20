const fs = require('fs');
const path = require('path');

// Lista de todos os 78 MS
const allMS = [
  'consultas-especializadas',
  'agenda-medica',
  'exames',
  'medicamentos',
  'vacinas',
  'tfd',
  'transporte-escolar',
  'matriculas',
  'merenda',
  'material-escolar',
  'uniforme',
  'atividades-extras',
  'auxilio-emergencial',
  'cesta-basica',
  'cras',
  'creas',
  'bolsa-familia',
  'cadastro-unico',
  'insumos-agricolas',
  'comercializacao',
  'cadastro-produtor',
  'assistencia-tecnica',
  'credito-agricola',
  'distribuicao-sementes',
  'projetos-culturais',
  'lei-incentivo',
  'espacos-culturais',
  'eventos-culturais',
  'artistas-cadastro',
  'patrimonio',
  'escolinhas',
  'projetos-esportivos',
  'eventos-esportivos',
  'quadras',
  'atletas-cadastro',
  'competicoes',
  'casa-popular',
  'regularizacao-fundiaria',
  'melhorias-habitacionais',
  'aluguel-social',
  'lotes-urbanizados',
  'cadastro-habitacional',
  'licenciamento',
  'poda-arvores',
  'coleta-seletiva',
  'denuncia-ambiental',
  'educacao-ambiental',
  'areas-verdes',
  'tapa-buracos',
  'iluminacao-publica',
  'drenagem',
  'calcamento',
  'sinalizacao',
  'pavimentacao',
  'alvara-construcao',
  'fiscalizacao-obras',
  'habite-se',
  'parcelamento-solo',
  'zoneamento',
  'certidoes',
  'cadastro-turistico',
  'eventos-turisticos',
  'guias-turismo',
  'hospedagem',
  'informacoes-turisticas',
  'roteiros-turisticos',
  'canil-municipal',
  'cemiterio',
  'controle-zoonoses',
  'defesa-civil',
  'feira-livre',
  'limpeza-publica',
  'ronda-escolar',
  'transporte-publico',
  'videomonitoramento',
  'guarda-municipal',
  'iluminacao-seguranca',
  'protecao-comunitaria',
];

// Template do arquivo page.tsx
const generatePageContent = (msId) => {
  // Converter kebab-case para PascalCase
  const pascalCase = msId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function ${pascalCase}Page() {
  const config = allMSConfigs['${msId}'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: ${msId}
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
`;
};

// Diretório base
const baseDir = path.join(__dirname, '..', 'app', 'admin', 'ms');

// Criar diretórios e arquivos
let created = 0;
let updated = 0;
let errors = 0;

allMS.forEach((msId) => {
  const msDir = path.join(baseDir, msId);
  const pageFile = path.join(msDir, 'page.tsx');

  try {
    // Criar diretório se não existir
    if (!fs.existsSync(msDir)) {
      fs.mkdirSync(msDir, { recursive: true });
    }

    // Gerar conteúdo
    const content = generatePageContent(msId);

    // Escrever arquivo
    if (fs.existsSync(pageFile)) {
      // Arquivo já existe, sobrescrever
      fs.writeFileSync(pageFile, content, 'utf8');
      updated++;
      console.log(`✓ Atualizado: ${msId}`);
    } else {
      // Criar novo arquivo
      fs.writeFileSync(pageFile, content, 'utf8');
      created++;
      console.log(`✓ Criado: ${msId}`);
    }
  } catch (error) {
    errors++;
    console.error(`✗ Erro em ${msId}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Resumo da geração dos Micro Sistemas:`);
console.log(`  Criados: ${created}`);
console.log(`  Atualizados: ${updated}`);
console.log(`  Erros: ${errors}`);
console.log(`  Total processado: ${created + updated + errors} / ${allMS.length}`);
console.log('='.repeat(60));
