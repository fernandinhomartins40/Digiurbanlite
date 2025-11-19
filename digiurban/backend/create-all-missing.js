const { Client } = require('pg');
const fs = require('fs');

async function createAllMissing() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'digiurban',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    // Ler migration.sql e extrair apenas os CREATE TABLE statements
    const sql = fs.readFileSync('migration.sql', 'utf-8');

    // Extrair todos os CREATE TABLE statements
    const tableMatches = sql.match(/CREATE TABLE[^;]+;/g) || [];

    console.log(`📊 Encontrados ${tableMatches.length} CREATE TABLE statements`);
    console.log('🔄 Criando tabelas que não existem...\n');

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (let i = 0; i < tableMatches.length; i++) {
      let statement = tableMatches[i];

      // Adicionar IF NOT EXISTS se não tiver
      if (!statement.includes('IF NOT EXISTS')) {
        statement = statement.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');
      }

      try {
        await client.query(statement);
        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/)[1];
        created++;
        if ((created + existing) % 20 === 0) {
          console.log(`✅ Progresso: ${created + existing}/${tableMatches.length}`);
        }
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('já existe')) {
          existing++;
        } else {
          errors++;
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/)?.[1] || 'unknown';
          if (errors < 10) { // Mostrar apenas primeiros 10 erros
            console.error(`  ⚠️  Erro em ${tableName}: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log(`\n✅ Concluído!`);
    console.log(`  Criadas: ${created}`);
    console.log(`  Já existiam: ${existing}`);
    console.log(`  Erros: ${errors}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAllMissing();
