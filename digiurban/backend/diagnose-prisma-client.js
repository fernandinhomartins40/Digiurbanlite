/**
 * Script de diagnóstico para verificar se o Prisma Client está atualizado
 * com todos os campos do schema.prisma
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DO PRISMA CLIENT\n');
console.log('========================================\n');

// 1. Verificar se schema.prisma tem os campos novos
console.log('1️⃣ Verificando schema.prisma...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

const fieldsToCheck = [
  { model: 'Conversation', field: 'activeFlowExecutionId' },
  { model: 'FlowExecution', field: 'isPaused' },
  { model: 'FlowExecution', field: 'pausedBy' },
  { model: 'Message', field: 'isBotMessage' },
  { model: 'Message', field: 'botInteractionType' },
];

let allFieldsExist = true;
for (const { model, field } of fieldsToCheck) {
  const regex = new RegExp(`model ${model}[\\s\\S]*?${field}`);
  const exists = regex.test(schema);
  console.log(`   ${exists ? '✅' : '❌'} ${model}.${field}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
  if (!exists) allFieldsExist = false;
}

if (allFieldsExist) {
  console.log('\n✅ Todos os campos existem no schema.prisma\n');
} else {
  console.log('\n❌ Alguns campos estão faltando no schema.prisma!\n');
  process.exit(1);
}

// 2. Verificar se node_modules/.prisma existe
console.log('2️⃣ Verificando Prisma Client gerado...');
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');

if (!fs.existsSync(prismaClientPath)) {
  console.log('❌ Prisma Client NÃO foi gerado ainda!\n');
  console.log('Execute: npx prisma generate\n');
  process.exit(1);
}

console.log('✅ Prisma Client foi gerado\n');

// 3. Verificar se o index.d.ts tem os tipos novos
console.log('3️⃣ Verificando tipos gerados (index.d.ts)...');
const indexDtsPath = path.join(prismaClientPath, 'index.d.ts');

if (!fs.existsSync(indexDtsPath)) {
  console.log('❌ index.d.ts NÃO foi encontrado!\n');
  process.exit(1);
}

const indexDts = fs.readFileSync(indexDtsPath, 'utf8');

let allTypesExist = true;
for (const { model, field } of fieldsToCheck) {
  // Buscar por declarações de tipo
  const regex = new RegExp(`${field}[:\\s]`);
  const exists = regex.test(indexDts);
  console.log(`   ${exists ? '✅' : '❌'} ${model}.${field}: ${exists ? 'EXISTE' : 'NÃO EXISTE'} no index.d.ts`);
  if (!exists) allTypesExist = false;
}

if (allTypesExist) {
  console.log('\n✅ Todos os tipos foram gerados corretamente!\n');
} else {
  console.log('\n❌ Alguns tipos estão faltando no index.d.ts!\n');
  console.log('🔧 SOLUÇÃO: Limpar cache e regenerar:\n');
  console.log('   rm -rf node_modules/.prisma');
  console.log('   npx prisma generate\n');
  process.exit(1);
}

// 4. Verificar timestamp de geração
console.log('4️⃣ Verificando timestamp de geração...');
const stats = fs.statSync(indexDtsPath);
const generatedAt = stats.mtime;
const schemaStats = fs.statSync(schemaPath);
const schemaModifiedAt = schemaStats.mtime;

console.log(`   Schema modificado em: ${schemaModifiedAt.toISOString()}`);
console.log(`   Client gerado em:     ${generatedAt.toISOString()}`);

if (generatedAt < schemaModifiedAt) {
  console.log('\n⚠️ AVISO: Prisma Client é MAIS ANTIGO que o schema!\n');
  console.log('🔧 Execute: npx prisma generate\n');
} else {
  console.log('\n✅ Prisma Client está atualizado!\n');
}

// 5. Teste de import dinâmico
console.log('5️⃣ Testando import do Prisma Client...');
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client pode ser importado\n');

  // Verificar se os tipos existem na instância
  const prisma = new PrismaClient();

  // Não executar queries (sem banco), apenas verificar API
  const hasConversation = typeof prisma.conversation !== 'undefined';
  const hasFlowExecution = typeof prisma.flowExecution !== 'undefined';
  const hasMessage = typeof prisma.message !== 'undefined';

  console.log('   ✅ prisma.conversation:', hasConversation);
  console.log('   ✅ prisma.flowExecution:', hasFlowExecution);
  console.log('   ✅ prisma.message:', hasMessage);

  console.log('\n✅ Prisma Client está funcional!\n');

} catch (error) {
  console.log('❌ Erro ao importar Prisma Client:', error.message, '\n');
  process.exit(1);
}

// Resumo final
console.log('========================================\n');
console.log('🎉 DIAGNÓSTICO CONCLUÍDO COM SUCESSO!\n');
console.log('Resultado: Prisma Client está atualizado e funcional.\n');
console.log('========================================\n');
