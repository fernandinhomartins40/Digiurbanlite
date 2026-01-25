const fs = require('fs');
const path = require('path');

const workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const workerDest = path.join(__dirname, '../public/pdf.worker.min.mjs');

// Criar diretório public se não existir
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copiar worker
try {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('✅ PDF.js worker copiado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao copiar PDF.js worker:', error.message);
  process.exit(1);
}
