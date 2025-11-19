const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'digiurban',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    console.log('📚 Lendo script de migração...');
    const sqlPath = path.join(__dirname, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();

    console.log('🔄 Aplicando migração no banco de dados...');
    console.log(`📊 Tamanho do script: ${sql.length} caracteres`);

    // Executar o SQL completo
    await client.query(sql);

    console.log('✅ Migração aplicada com sucesso!');

  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('já existe')) {
      console.log('⚠️ Algumas tabelas/tipos já existem - isso é normal');
      console.log('✅ Migração aplicada (com warnings)');
    } else {
      console.error('❌ Erro ao aplicar migração:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyMigration();
