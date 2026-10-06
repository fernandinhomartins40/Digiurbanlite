/**
 * Copia o motor ONNX do navegador (onnxruntime-web, MIT) para public/doc-scanner,
 * onde o scanner de documentos o carrega só quando a câmera inteligente abre.
 * Uma linha de execução (sem SharedArrayBuffer): só o .wasm simples.
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '../node_modules/onnxruntime-web/dist');
const dest = path.join(__dirname, '../public/doc-scanner');
const files = ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];

fs.mkdirSync(dest, { recursive: true });
try {
  for (const file of files) fs.copyFileSync(path.join(dist, file), path.join(dest, file));
  console.log('✅ onnxruntime-web copiado para public/doc-scanner');
} catch (error) {
  console.error('❌ Erro ao copiar onnxruntime-web:', error.message);
  process.exit(1);
}
