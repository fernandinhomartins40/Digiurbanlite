const { execSync } = require('child_process');

console.log('Iniciando compilação TypeScript...');
try {
  const result = execSync('npx tsc --noEmit --listFiles', {
    cwd: __dirname,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024
  });

  const lines = result.split('\n');
  console.log(`Total de arquivos: ${lines.length}`);
  console.log('Últimos 10 arquivos processados:');
  console.log(lines.slice(-10).join('\n'));

} catch (error) {
  console.error('Erro na compilação:');
  if (error.stdout) {
    const lines = error.stdout.toString().split('\n');
    console.log('Últimos arquivos antes do erro:');
    console.log(lines.slice(-20).join('\n'));
  }
  console.error(error.message);
  process.exit(1);
}
