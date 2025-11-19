const { Client } = require('pg');

async function createMissingTables() {
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

    // Criar apenas as tabelas que faltam para os novos microsistemas
    const tables = [
      // Cultura
      `CREATE TABLE IF NOT EXISTS espacos_culturais (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        endereco TEXT NOT NULL,
        capacidade INTEGER,
        status TEXT DEFAULT 'ATIVO',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS livros_biblioteca (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        autor TEXT NOT NULL,
        isbn TEXT,
        categoria TEXT NOT NULL,
        disponivel BOOLEAN DEFAULT true,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS emprestimos_biblioteca (
        id TEXT PRIMARY KEY,
        "livroId" TEXT NOT NULL,
        "citizenId" TEXT NOT NULL,
        "dataEmprestimo" TIMESTAMP(3) NOT NULL,
        "dataDevolucao" TIMESTAMP(3),
        "dataPrevistaDevolucao" TIMESTAMP(3) NOT NULL,
        status TEXT DEFAULT 'ATIVO',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS patrimonio_cultural (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        localizacao TEXT NOT NULL,
        descricao TEXT,
        "dataRegistro" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ATIVO',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      // Esportes
      `CREATE TABLE IF NOT EXISTS atletas (
        id TEXT PRIMARY KEY,
        "citizenId" TEXT NOT NULL,
        modalidade TEXT NOT NULL,
        categoria TEXT NOT NULL,
        "dataInscricao" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ATIVO',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS equipamentos_esportivos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        localizacao TEXT NOT NULL,
        status TEXT DEFAULT 'DISPONIVEL',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      // Habitação
      `CREATE TABLE IF NOT EXISTS conjuntos_habitacionais (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        endereco TEXT NOT NULL,
        "totalUnidades" INTEGER NOT NULL,
        "unidadesOcupadas" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ATIVO',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,

      // Adicionar índices
      `CREATE INDEX IF NOT EXISTS idx_espacos_culturais_tipo ON espacos_culturais(tipo)`,
      `CREATE INDEX IF NOT EXISTS idx_livros_biblioteca_categoria ON livros_biblioteca(categoria)`,
      `CREATE INDEX IF NOT EXISTS idx_atletas_modalidade ON atletas(modalidade)`,
      `CREATE INDEX IF NOT EXISTS idx_equipamentos_esportivos_tipo ON equipamentos_esportivos(tipo)`,
    ];

    console.log(`📊 Criando ${tables.length} tabelas e índices...`);

    for (let i = 0; i < tables.length; i++) {
      const sql = tables[i];
      try {
        await client.query(sql);
        const tableName = sql.match(/CREATE (?:TABLE|INDEX) (?:IF NOT EXISTS )?(\w+)/)[1];
        console.log(`  ✅ ${i + 1}/${tables.length} - ${tableName}`);
      } catch (error) {
        console.error(`  ❌ Erro: ${error.message}`);
      }
    }

    console.log('\n✅ Tabelas criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createMissingTables();
