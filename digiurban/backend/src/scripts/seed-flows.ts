/**
 * Script para popular FlowDefinitions no banco de dados
 * Carrega os arquivos JSON dos fluxos e insere no PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const resolveFlowsDir = () => {
  const candidates = [
    process.env.BOT_FLOWS_DIR,
    path.join(__dirname, '../services/bot/flows'),
    path.join(process.cwd(), '../ultrazend-messages-server/src/bot/flows'),
    path.join(process.cwd(), 'ultrazend-messages-server/src/bot/flows'),
    path.join(process.cwd(), 'src/bot/flows'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] || '';
};

const FLOWS_DIR = resolveFlowsDir();

const flowFiles = [
  'menu-principal.json',
  'solicitar-servico.json',
  'consultar-protocolo.json',
  'meu-perfil.json',
  'minha-familia.json',
  'notificacoes.json',
  'ajuda.json',
];

async function seedFlows() {
  console.log('🌱 Iniciando seed de fluxos...\n');

  try {
    for (const fileName of flowFiles) {
      const filePath = path.join(FLOWS_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Arquivo não encontrado: ${fileName}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const flowData = JSON.parse(fileContent);

      console.log(`📄 Processando: ${flowData.name}`);

      // Verifica se já existe NO TENANT atual (unique composta [tenantId, name]
      // — onda 8; findFirst é escopado pela tenant-extension)
      const existing = await prisma.flowDefinition.findFirst({
        where: { name: flowData.name },
      });

      if (existing) {
        // Atualiza
        await prisma.flowDefinition.update({
          where: { id: existing.id },
          data: {
            description: flowData.description,
            version: flowData.version,
            nodes: flowData.nodes,
            metadata: flowData.metadata || {},
            isActive: true,
            isDefault: flowData.name === 'menu_principal', // Menu principal é o default
          },
        });
        console.log(`   ✅ Atualizado: ${flowData.name}\n`);
      } else {
        // Cria novo
        await prisma.flowDefinition.create({
          data: {
            name: flowData.name,
            description: flowData.description,
            version: flowData.version,
            nodes: flowData.nodes,
            metadata: flowData.metadata || {},
            isActive: true,
            isDefault: flowData.name === 'menu_principal',
          },
        });
        console.log(`   ✅ Criado: ${flowData.name}\n`);
      }
    }

    console.log('✅ Seed de fluxos concluído com sucesso!');
    console.log(`📊 Total de fluxos processados: ${flowFiles.length}`);

    // Lista fluxos no banco
    const flows = await prisma.flowDefinition.findMany({
      select: {
        name: true,
        version: true,
        isActive: true,
        isDefault: true,
      },
    });

    console.log('\n📋 Fluxos no banco de dados:');
    flows.forEach((flow) => {
      const tags = [];
      if (flow.isDefault) tags.push('DEFAULT');
      if (flow.isActive) tags.push('ATIVO');
      console.log(`   • ${flow.name} (v${flow.version}) ${tags.join(' ')}`);
    });
  } catch (error) {
    console.error('❌ Erro ao fazer seed de fluxos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o seed
seedFlows()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
