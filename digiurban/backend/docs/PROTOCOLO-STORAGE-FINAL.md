# 📁 SISTEMA DE ARMAZENAMENTO DE PROTOCOLOS - VERSÃO SIMPLIFICADA

> **Status**: Produção sem dados legados - Zero retrocompatibilidade

---

## 🎯 REGRA DE OURO

**UM ÚNICO PADRÃO. SEM EXCEÇÕES.**

```
/uploads/protocols/{protocolId}/{filename}
```

**Exemplo real:**
```
/uploads/protocols/cm5x1y2z3/1735689123456-RG.pdf
```

---

## 📂 ESTRUTURA DE DIRETÓRIOS

```
uploads/
└── protocols/
    ├── cm5x1y2z3/              # Protocolo ID
    │   ├── 1735689123456-RG.pdf
    │   ├── 1735689123457-CPF.pdf
    │   └── 1735689123458-CompResidencia.pdf
    ├── cm5x1y2z4/
    │   └── 1735689123459-Certidao.pdf
    └── ...
```

---

## 🔧 API DE ARMAZENAMENTO

### Criar Diretório do Protocolo

```typescript
import { ensureProtocolDir } from '../config/upload';

const protocolDir = ensureProtocolDir(protocolId);
// Cria /uploads/protocols/{protocolId}/ se não existir
```

### Obter URL Pública

```typescript
import { getProtocolFileUrl } from '../config/upload';

const fileUrl = getProtocolFileUrl(protocolId, filename);
// Retorna: /uploads/protocols/{protocolId}/{filename}
```

### Obter Caminho Físico

```typescript
import { getProtocolFilePath } from '../config/upload';

const filePath = getProtocolFilePath(protocolId, filename);
// Retorna: {cwd}/uploads/protocols/{protocolId}/{filename}
```

### Extrair Filename de URL

```typescript
import { extractFilename } from '../config/upload';

const filename = extractFilename(fileUrl);
// "/uploads/protocols/abc/file.pdf" => "file.pdf"
```

---

## 📋 FLUXO DE UPLOAD

### 1. Cidadão Cria Protocolo

```typescript
// POST /api/citizen/protocols
router.post('/', upload.array('documents'), async (req, res) => {
  // 1. Arquivos temporários salvos em /uploads/documents (multer)
  const tempFiles = req.files;

  // 2. Criar protocolo no banco
  const protocol = await prisma.protocolSimplified.create({ ... });

  // 3. Criar diretório do protocolo
  const protocolDir = ensureProtocolDir(protocol.id);

  // 4. Mover arquivos para diretório final
  const uploadedDocs = tempFiles.map(file => {
    const newPath = path.join(protocolDir, file.filename);
    fs.renameSync(file.path, newPath);  // Move de temp para final

    return {
      url: getProtocolFileUrl(protocol.id, file.filename),  // ✅ Padrão único
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  });

  // 5. Criar registros no banco
  await createPendingDocumentsForProtocol(protocol.id, service, uploadedDocs);
});
```

### 2. Download de Documento

```typescript
// GET /api/protocols/:protocolId/documents/:documentId/download
router.get('/:protocolId/documents/:documentId/download', async (req, res) => {
  const document = await getDocumentById(documentId);

  // ✅ Simples: um único padrão
  const filename = extractFilename(document.fileUrl);
  const filePath = getProtocolFilePath(document.protocolId, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  // Stream do arquivo
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
```

---

## 🗑️ DELEÇÃO AUTOMÁTICA

### Middleware Cascade Delete

**Ativado globalmente em `src/lib/prisma.ts`:**

```typescript
import { cascadeDeleteMiddleware } from '../middleware/prisma-cascade-delete.middleware';

prisma.$use(cascadeDeleteMiddleware);
```

### Comportamento

| Ação | Efeito no Filesystem |
|------|---------------------|
| `ProtocolDocument.delete()` | Deleta arquivo físico |
| `ProtocolSimplified.delete()` | Deleta diretório completo |
| `ProtocolDocument.deleteMany()` | Deleta múltiplos arquivos |
| `ProtocolSimplified.deleteMany()` | Deleta múltiplos diretórios |

**Exemplo:**

```typescript
// Deletar protocolo
await prisma.protocolSimplified.delete({
  where: { id: protocolId }
});

// ✅ Middleware automaticamente deleta:
// - Diretório: /uploads/protocols/{protocolId}/
// - Todos os arquivos dentro dele
```

---

## 🧹 CLEANUP AUTOMÁTICO

### Job Semanal de Órfãos

**Arquivo:** `src/jobs/cleanup-orphan-files.job.ts`

**Executa:**
1. Escaneia `/uploads/protocols/`
2. Verifica se protocolo existe no banco
3. Verifica se cada arquivo tem registro no banco
4. Deleta arquivos/diretórios órfãos

**Agendar:**

```typescript
import cron from 'node-cron';
import { cleanupOrphanFiles } from './jobs/cleanup-orphan-files.job';

// Todo domingo às 3h da manhã
cron.schedule('0 3 * * 0', async () => {
  await cleanupOrphanFiles();
});
```

**Executar manualmente:**

```bash
# Dry-run (simulação)
node -r ts-node/register src/jobs/cleanup-orphan-files.job.ts --dry-run

# Execução real
node -r ts-node/register src/jobs/cleanup-orphan-files.job.ts
```

---

## 🔍 AUDITORIA E INTEGRIDADE

### Validação de Documento

```typescript
import { validateDocumentIntegrity } from '../services/document-integrity.service';

const result = await validateDocumentIntegrity(documentId);

console.log(result);
// {
//   valid: true,
//   documentId: "...",
//   fileExists: true,
//   currentStatus: "UPLOADED",
//   expectedStatuses: ["UPLOADED", "UNDER_REVIEW", "APPROVED"],
//   reason: "Documento íntegro"
// }
```

### Auditoria de Protocolo

```typescript
import { validateProtocolIntegrity } from '../services/document-integrity.service';

const result = await validateProtocolIntegrity(protocolId);

console.log(result);
// {
//   protocolId: "...",
//   protocolNumber: "2025/001",
//   totalDocuments: 5,
//   validDocuments: 5,
//   invalidDocuments: 0,
//   details: [...]
// }
```

### Rotas de API

```bash
# Auditoria de protocolo
GET /api/protocols/{protocolId}/documents/audit

# Auditoria global (ADMIN)
GET /api/admin/documents/audit/all

# Verificar documento
GET /api/protocols/{protocolId}/documents/{documentId}/integrity

# Reconciliar (resetar para PENDING se arquivo não existe)
POST /api/protocols/{protocolId}/documents/{documentId}/reconcile
```

---

## 📜 VERSIONAMENTO

### Como Funciona

Quando um documento é re-enviado:

1. **Versão atual** vira histórico
2. **Nova versão** é criada com `version++`
3. `previousDocId` aponta para versão anterior

**Tabela:**

```
┌─────────────┬─────────┬──────────────┬────────────┐
│ Document ID │ Version │ previousDocId│ Status     │
├─────────────┼─────────┼──────────────┼────────────┤
│ doc_v1      │    1    │     null     │ REJECTED   │
│ doc_v2      │    2    │   doc_v1     │ APPROVED   │
│ doc_v3      │    3    │   doc_v2     │ UPLOADED   │ ← Atual
└─────────────┴─────────┴──────────────┴────────────┘
```

### Rotas de Versionamento

```bash
# Listar todas as versões
GET /api/protocols/{protocolId}/documents/{documentId}/versions

# Download de versão específica
GET /api/protocols/{protocolId}/documents/{documentId}/version/{versionId}/download

# Restaurar versão antiga
POST /api/protocols/{protocolId}/documents/{documentId}/restore-version
Body: { "versionId": "doc_v2" }
```

---

## 🛡️ SEGURANÇA

### Validação de Acesso

```typescript
// Cidadão: Apenas seus protocolos
if (user.role === 'CITIZEN') {
  where.citizenId = userId;
}

// Manager: Apenas seu departamento
if (user.role === 'MANAGER') {
  where.departmentId = user.departmentId;
}

// Admin: Todos os protocolos
```

### Prevenção de Path Traversal

```typescript
// ❌ NUNCA aceitar fileUrl do cliente diretamente
const fileUrl = req.body.fileUrl;  // PERIGO!

// ✅ SEMPRE construir fileUrl no servidor
const fileUrl = getProtocolFileUrl(protocolId, filename);
```

### MIME Type Validation

```typescript
// Multer valida MIME types aceitos
const allowedMimes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  // ...
];
```

---

## 📊 CHECKLIST DE DESENVOLVIMENTO

### Upload de Documento

- [ ] Usar `upload.array('documents')` ou `upload.single('document')`
- [ ] Criar protocolo no banco primeiro
- [ ] Criar diretório: `ensureProtocolDir(protocolId)`
- [ ] Mover arquivo: `fs.renameSync(tempPath, finalPath)`
- [ ] Gerar URL: `getProtocolFileUrl(protocolId, filename)`
- [ ] Salvar no banco com status `UPLOADED`

### Download de Documento

- [ ] Buscar documento no banco
- [ ] Extrair filename: `extractFilename(fileUrl)`
- [ ] Obter caminho: `getProtocolFilePath(protocolId, filename)`
- [ ] Verificar existência: `fs.existsSync(filePath)`
- [ ] Stream: `fs.createReadStream(filePath).pipe(res)`

### Deleção de Protocolo

- [ ] Usar Prisma delete (cascade automático)
- [ ] OU usar job de cleanup para órfãos

---

## 🚫 ANTI-PATTERNS

### ❌ NÃO FAZER

```typescript
// ❌ Múltiplos formatos de fileUrl
fileUrl: "/uploads/documents/file.pdf"
fileUrl: "/app/backend/uploads/protocols/abc/file.pdf"
fileUrl: "https://cdn.example.com/file.pdf"

// ❌ Lógica de resolução complexa
if (fileUrl.startsWith('/uploads/documents')) { ... }
else if (fileUrl.startsWith('/app/backend')) { ... }
else if (path.isAbsolute(fileUrl)) { ... }

// ❌ Aceitar fileUrl do cliente
const fileUrl = req.body.fileUrl;  // PERIGO DE SEGURANÇA

// ❌ Salvar em múltiplos diretórios
/uploads/documents/
/uploads/protocols/
/uploads/temp/
```

### ✅ FAZER

```typescript
// ✅ UM ÚNICO padrão
fileUrl: getProtocolFileUrl(protocolId, filename)

// ✅ Resolução simples
const filename = extractFilename(fileUrl);
const filePath = getProtocolFilePath(protocolId, filename);

// ✅ SEMPRE gerar fileUrl no servidor
const fileUrl = getProtocolFileUrl(protocol.id, file.filename);

// ✅ UM ÚNICO diretório
/uploads/protocols/{protocolId}/
```

---

## 📞 TROUBLESHOOTING

### Erro: "Arquivo não encontrado"

**Causa:** fileUrl no banco não corresponde ao arquivo físico

**Solução:**
```bash
# Executar auditoria
curl GET /api/admin/documents/audit/all

# Reconciliar documentos problemáticos
curl POST /api/protocols/{protocolId}/documents/{documentId}/reconcile
```

### Erro: "Diretório não existe"

**Causa:** Protocolo criado mas diretório não foi criado

**Solução:**
```typescript
// Sempre criar diretório ANTES de mover arquivos
const protocolDir = ensureProtocolDir(protocol.id);
```

### Espaço em disco crescendo

**Causa:** Arquivos órfãos acumulando

**Solução:**
```bash
# Executar cleanup manual
node -r ts-node/register src/jobs/cleanup-orphan-files.job.ts --dry-run
node -r ts-node/register src/jobs/cleanup-orphan-files.job.ts
```

---

## 🎯 COMANDOS ÚTEIS

```bash
# Ver tamanho de uploads
du -sh uploads/protocols

# Contar protocolos
ls uploads/protocols | wc -l

# Ver protocolo específico
ls -lh uploads/protocols/cm5x1y2z3/

# Backup de uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Restaurar backup
tar -xzf uploads-backup-20250106.tar.gz
```

---

**Última atualização:** 06/01/2026
**Sistema:** Produção sem dados legados
**Padrão:** `/uploads/protocols/{protocolId}/{filename}` (ÚNICO)
