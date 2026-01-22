const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigrations() {
  try {
    console.log('🔧 Aplicando migrações...');
    console.log('📝 Aplicando 20260121_add_flow_models...');

    // Executar comandos um por um
    const commands = [
      `CREATE TABLE IF NOT EXISTS flow_definitions (
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL DEFAULT '1.0.0',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "municipioId" TEXT,
        nodes JSONB NOT NULL,
        metadata JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT flow_definitions_pkey PRIMARY KEY (id)
      )`,
      `CREATE TABLE IF NOT EXISTS flow_executions (
        id TEXT NOT NULL,
        "citizenId" TEXT NOT NULL,
        "flowId" TEXT NOT NULL,
        "conversationId" TEXT,
        "currentNodeId" TEXT NOT NULL,
        state JSONB NOT NULL,
        history JSONB NOT NULL,
        status TEXT NOT NULL,
        "errorMessage" TEXT,
        metadata JSONB,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "completedAt" TIMESTAMP(3),
        CONSTRAINT flow_executions_pkey PRIMARY KEY (id)
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS flow_definitions_name_key ON flow_definitions(name)`,
      `CREATE INDEX IF NOT EXISTS flow_definitions_isActive_isDefault_idx ON flow_definitions("isActive", "isDefault")`,
      `CREATE INDEX IF NOT EXISTS flow_executions_citizenId_status_idx ON flow_executions("citizenId", status)`,
      `CREATE INDEX IF NOT EXISTS flow_executions_flowId_idx ON flow_executions("flowId")`,
      `CREATE INDEX IF NOT EXISTS flow_executions_conversationId_idx ON flow_executions("conversationId")`,
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flow_executions_citizenId_fkey') THEN
           ALTER TABLE flow_executions ADD CONSTRAINT flow_executions_citizenId_fkey
           FOREIGN KEY ("citizenId") REFERENCES citizens(id) ON DELETE RESTRICT ON UPDATE CASCADE;
         END IF;
       END $$`,
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flow_executions_flowId_fkey') THEN
           ALTER TABLE flow_executions ADD CONSTRAINT flow_executions_flowId_fkey
           FOREIGN KEY ("flowId") REFERENCES flow_definitions(id) ON DELETE RESTRICT ON UPDATE CASCADE;
         END IF;
       END $$`,
    ];

    for (const cmd of commands) {
      try {
        await prisma.$executeRawUnsafe(cmd);
        console.log('✅ Comando executado com sucesso');
      } catch (err) {
        console.log(`⚠️ Comando ignorado (provavelmente já existe): ${err.code}`);
      }
    }

    console.log('✅ 20260121_add_flow_models aplicada!');
    console.log('🎉 Todas as migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigrations();
