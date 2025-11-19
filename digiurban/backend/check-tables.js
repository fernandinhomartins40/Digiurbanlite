const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'digiurban',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();

    // Verificar tabelas específicas que estamos usando
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'espacos_culturais',
          'patrimonio_cultural',
          'livros_biblioteca',
          'atletas',
          'equipamentos_esportivos',
          'conjuntos_habitacionais'
        )
      ORDER BY table_name;
    `);

    console.log('\n📊 Tabelas encontradas no banco:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    } else {
      console.log('  ❌ Nenhuma tabela encontrada!');
    }

    // Verificar todas as tabelas
    const allTables = await client.query(`
      SELECT COUNT(*) as total
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);

    console.log(`\n📈 Total de tabelas no schema public: ${allTables.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
