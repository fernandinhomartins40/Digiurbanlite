import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const routesPath = path.join(
  repoRoot,
  'digiurban-ai',
  'src',
  'generated',
  'admin-routes.generated.json',
);
const seedsPath = path.join(repoRoot, 'ai-training', 'data', 'seed-examples.json');
const outputPath = path.join(repoRoot, 'ai-training', 'data', 'digiurban-lora-dataset.jsonl');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRecord(entry) {
  return {
    instruction: normalizeText(entry.instruction),
    input: normalizeText(entry.input || ''),
    output: normalizeText(entry.output),
    group: normalizeText(entry.group || 'general'),
  };
}

function buildRouteExamples(route) {
  const title = normalizeText(route.title);
  const summary = normalizeText(route.summary);
  const category = normalizeText(route.category);
  const pathValue = normalizeText(route.path);
  const keywords = Array.isArray(route.keywords) ? route.keywords.slice(0, 6).join(', ') : '';

  return [
    {
      group: 'navegacao_aplicacao',
      instruction: `Onde fica ${title} na DigiUrban?`,
      input: '',
      output: `${title} fica em ${pathValue}. ${summary}`,
    },
    {
      group: 'navegacao_aplicacao',
      instruction: `Explique rapidamente para que serve a tela ${title}.`,
      input: '',
      output: `${title}: ${summary} Categoria: ${category}.`,
    },
    {
      group: 'navegacao_aplicacao',
      instruction: `Quais palavras ajudam a encontrar ${title}?`,
      input: '',
      output: `Use termos como: ${keywords || title}. Caminho principal: ${pathValue}.`,
    },
  ];
}

function main() {
  const routes = readJson(routesPath);
  const seeds = readJson(seedsPath);

  const dataset = [
    ...seeds.map(toRecord),
    ...routes.flatMap((route) => buildRouteExamples(route).map(toRecord)),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    dataset.map((item) => JSON.stringify(item)).join('\n') + '\n',
    'utf8',
  );

  console.log(`Dataset gerado com ${dataset.length} exemplos em ${outputPath}`);
}

main();
