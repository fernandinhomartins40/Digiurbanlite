import { PrismaClient } from '@prisma/client';
import { OllamaService } from '../digiurban/backend/src/services/bot/OllamaService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const ollama = new OllamaService();

/**
 * Script para gerar dataset de treinamento do Phi-4 com serviços municipais
 */
async function generateTrainingData() {
  console.log('🔍 Buscando serviços municipais...');

  const services = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      requiredDocuments: true,
      estimatedDays: true,
    },
  });

  console.log(`✅ ${services.length} serviços encontrados`);

  console.log('📝 Gerando dataset de treinamento...');
  const dataset = await ollama.generateTrainingDataset(services);

  const outputPath = path.join(__dirname, '..', 'ollama-training-data.txt');
  fs.writeFileSync(outputPath, dataset);

  console.log(`✅ Dataset salvo em: ${outputPath}`);
  console.log(`📊 Total de exemplos: ${dataset.split('---').length}`);

  console.log('\n🎓 Para treinar o modelo, execute:');
  console.log(`1. Criar Modelfile customizado:`);
  console.log(`   cat > Modelfile <<'EOF'`);
  console.log(`FROM phi4`);
  console.log(``);
  console.log(`PARAMETER temperature 0.3`);
  console.log(`PARAMETER top_p 0.9`);
  console.log(`PARAMETER num_predict 200`);
  console.log(``);
  console.log(`SYSTEM """`);
  console.log(`Você é o DigiBot, assistente virtual especializado em serviços municipais.`);
  console.log(`Seu objetivo é identificar a intenção do cidadão e sugerir ações relevantes.`);
  console.log(`Sempre responda em JSON válido com: intent, confidence, parameters, suggestedCards.`);
  console.log(`"""`);
  console.log(`EOF`);
  console.log(``);
  console.log(`2. Criar modelo customizado:`);
  console.log(`   ollama create digibot-phi4 -f Modelfile`);
  console.log(``);
  console.log(`3. Testar modelo:`);
  console.log(`   ollama run digibot-phi4 "Preciso solicitar alvará de funcionamento"`);
  console.log(``);
  console.log(`4. Atualizar .env:`);
  console.log(`   OLLAMA_MODEL=digibot-phi4`);
  console.log(``);
  console.log(`💡 Dica: Use o dataset gerado (${path.basename(outputPath)}) para fine-tuning avançado!`);
}

/**
 * Testa o modelo Ollama
 */
async function testOllamaModel() {
  console.log('\n🧪 Testando modelo Ollama...');

  // Verifica saúde
  const isHealthy = await ollama.healthCheck();
  if (!isHealthy) {
    console.error('❌ Ollama não está rodando! Execute: ollama serve');
    process.exit(1);
  }
  console.log('✅ Ollama está rodando');

  // Lista modelos disponíveis
  const models = await ollama.listModels();
  console.log(`📦 Modelos disponíveis: ${models.join(', ')}`);

  if (models.length === 0) {
    console.error('❌ Nenhum modelo encontrado! Execute: ollama pull phi4');
    process.exit(1);
  }

  // Testa reconhecimento com exemplo
  console.log('\n🧪 Testando reconhecimento de intenção...');
  const testMessages = [
    'Olá, bom dia!',
    'Preciso agendar uma consulta médica',
    'Como solicito alvará de funcionamento?',
    'Qual o status do protocolo 2025001234?',
  ];

  for (const message of testMessages) {
    try {
      console.log(`\n📝 Mensagem: "${message}"`);
      const result = await ollama.recognizeIntent(message, {}, []);
      console.log(`   Intent: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
      if (result.suggestedCards && result.suggestedCards.length > 0) {
        console.log(`   Cards sugeridos:`);
        result.suggestedCards.forEach((card, i) => {
          console.log(`     ${i + 1}. ${card.title} - ${card.actionLabel}`);
        });
      }
    } catch (error: any) {
      console.error(`   ❌ Erro: ${error.message}`);
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';

  try {
    switch (command) {
      case 'generate':
        await generateTrainingData();
        break;
      case 'test':
        await testOllamaModel();
        break;
      case 'all':
        await generateTrainingData();
        await testOllamaModel();
        break;
      default:
        console.log('Uso: npm run train-phi4 [generate|test|all]');
        console.log('  generate - Gera dataset de treinamento');
        console.log('  test     - Testa modelo Ollama');
        console.log('  all      - Executa ambos');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
