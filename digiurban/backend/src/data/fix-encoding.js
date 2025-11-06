const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'municipios-brasil.json');
const backupFile = path.join(__dirname, 'municipios-brasil.json.backup');

console.log('🔧 Iniciando correção de encoding...');

try {
  // Fazer backup
  const originalContent = fs.readFileSync(inputFile, 'utf8');
  fs.writeFileSync(backupFile, originalContent, 'utf8');
  console.log('✅ Backup criado:', backupFile);

  // Carregar e parsear JSON
  const municipios = JSON.parse(originalContent);
  console.log(`📊 Total de municípios: ${municipios.length}`);

  // Função para normalizar texto
  function normalizeText(text) {
    if (!text || typeof text !== 'string') return text;

    // Remover caracteres problemáticos e normalizar
    return text
      .normalize('NFC') // Normalização canônica
      .trim();
  }

  // Corrigir cada município
  let corrected = 0;
  municipios.forEach(m => {
    const originalNome = m.nome;
    m.nome = normalizeText(m.nome);

    if (originalNome !== m.nome) {
      console.log(`🔄 Corrigido: "${originalNome}" → "${m.nome}"`);
      corrected++;
    }
  });

  // Salvar arquivo corrigido
  const newContent = JSON.stringify(municipios, null, 2);
  fs.writeFileSync(inputFile, newContent, 'utf8');

  console.log(`\n✅ Arquivo corrigido com sucesso!`);
  console.log(`📝 ${corrected} nomes foram corrigidos`);
  console.log(`💾 Backup salvo em: ${backupFile}`);

} catch (error) {
  console.error('❌ Erro ao corrigir arquivo:', error);
  process.exit(1);
}
