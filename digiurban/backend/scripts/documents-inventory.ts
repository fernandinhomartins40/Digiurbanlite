/**
 * INVENTÁRIO DE DOCUMENTOS
 * Lista documentos com caminho inválido, arquivos órfãos e estatísticas rápidas.
 * Uso: ts-node scripts/documents-inventory.ts
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { resolveLocalFilePath } from '../src/utils/document-path';

const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

async function main() {
  const docs = await prisma.protocolDocument.findMany();

  let ok = 0;
  let missingFile = 0;
  let missingUrl = 0;
  const missingList: any[] = [];

  for (const doc of docs) {
    if (!doc.fileUrl) {
      missingUrl++;
      missingList.push({ id: doc.id, protocolId: doc.protocolId, reason: 'fileUrl vazio' });
      continue;
    }

    if (doc.fileUrl.startsWith('http')) {
      ok++;
      continue;
    }

    const resolution = resolveLocalFilePath(doc.fileUrl);
    if (!resolution.found) {
      missingFile++;
      missingList.push({
        id: doc.id,
        protocolId: doc.protocolId,
        fileUrl: doc.fileUrl,
        tried: resolution.tried,
      });
    } else {
      ok++;
    }
  }

  // Arquivos órfãos no diretório de uploads (não referenciados)
  const orphanFiles: string[] = [];
  const allFiles = walkFiles(UPLOAD_BASE_PATH);
  const referenced = new Set(
    docs
      .filter(d => d.fileUrl && !d.fileUrl.startsWith('http'))
      .map(d => (d.fileUrl.startsWith('/') ? d.fileUrl.slice(1) : d.fileUrl))
  );
  for (const f of allFiles) {
    const rel = path.relative(process.cwd(), f);
    if (![...referenced].some(r => rel.endsWith(r))) {
      orphanFiles.push(rel);
    }
  }

  console.log('=== INVENTÁRIO DE DOCUMENTOS ===');
  console.log(`Total docs: ${docs.length}`);
  console.log(`OK (local ou http): ${ok}`);
  console.log(`Com fileUrl vazio: ${missingUrl}`);
  console.log(`Sem arquivo físico: ${missingFile}`);
  console.log(`Arquivos órfãos em uploads: ${orphanFiles.length}`);
  if (missingList.length > 0) {
    console.log('\nDocumentos faltando arquivo ou URL:');
    missingList.slice(0, 50).forEach(d => console.log(d));
    if (missingList.length > 50) console.log(`... (${missingList.length - 50} mais)`);
  }
  if (orphanFiles.length > 0) {
    console.log('\nArquivos órfãos (primeiros 50):');
    orphanFiles.slice(0, 50).forEach(f => console.log(f));
    if (orphanFiles.length > 50) console.log(`... (${orphanFiles.length - 50} mais)`);
  }
}

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
