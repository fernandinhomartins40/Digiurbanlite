# Sistema de Gerenciamento de Documentos

## Visão Geral

O sistema de gerenciamento de documentos do DigiUrban foi projetado para ser robusto, seguro e flexível, permitindo que cada serviço configure seus próprios requisitos de documentação.

## Arquitetura

### Backend

#### 1. Validação de Documentos (`src/utils/document-validation.ts`)

Responsável por validar arquivos baseado em configurações dinâmicas:

```typescript
interface DocumentConfig {
  name: string;
  description?: string;
  required: boolean;
  acceptedFormats: string[];
  allowCameraUpload: boolean;
  maxSizeMB: number;
}
```

**Funções principais:**
- `validateFile()` - Valida um arquivo contra configuração específica
- `validateDocuments()` - Valida múltiplos arquivos
- `getAllowedMimeTypes()` - Converte formatos em MIME types
- `getAllowedExtensions()` - Converte formatos em extensões de arquivo
- `normalizeDocumentConfigs()` - Normaliza configurações do banco de dados

#### 2. Upload Seguro (`src/middleware/secure-upload.ts`)

Middleware de segurança para upload com múltiplas camadas de proteção:

**Recursos de segurança:**
- ✅ Sanitização de nomes de arquivo
- ✅ Detecção de assinaturas maliciosas (magic numbers)
- ✅ Validação de MIME type e extensão
- ✅ Bloqueio de extensões perigosas (.exe, .bat, .sh, etc.)
- ✅ Geração de nomes únicos e seguros
- ✅ Verificação de path traversal
- ✅ Organização por data (uploads/documents/YYYY/MM/)
- ✅ Permissões de diretório seguras (0o750)

**Funções principais:**
- `createSecureUploadMiddleware()` - Cria middleware com validação
- `validateUploadedFilesMiddleware()` - Valida após upload
- `sanitizeFilename()` - Remove caracteres perigosos
- `generateSecureFilename()` - Gera nome único
- `checkForMaliciousContent()` - Verifica assinaturas maliciosas
- `secureDeleteFile()` - Deleta arquivo com verificação de segurança
- `secureMoveFile()` - Move arquivo com verificação de segurança

#### 3. Tipos (`src/types/document.types.ts`)

Definições de tipos TypeScript para todo o sistema de documentos:

- `DocumentConfig` - Configuração de documento
- `ProtocolDocument` - Documento armazenado
- `DocumentValidationResult` - Resultado de validação
- `UploadedFileInfo` - Informações de arquivo enviado
- `DocumentUploadRequest/Response` - Requisição/resposta de upload
- `FileMetadata` - Metadados de arquivo
- `UploadSecurityConfig` - Configuração de segurança
- `DocumentAudit` - Auditoria de documento
- `DocumentPermissions` - Permissões de acesso

#### 4. Configurações Existentes

**`src/config/upload.ts`** - Configuração básica de multer
- Tamanho máximo: 10MB
- Formatos permitidos: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX

**`src/middleware/upload.ts`** - Middleware de upload por protocolo
- Organiza por protocolo: `uploads/protocols/[protocolId]/`
- Validação de MIME type e extensão
- Tamanho máximo: 5MB por arquivo
- Máximo: 10 arquivos por upload

### Frontend

#### 1. Utilitários de Documento (`lib/document-utils.ts`)

Funções auxiliares para manipulação de documentos:

**Validação:**
- `validateFile()` - Valida arquivo antes do upload
- `validateFiles()` - Valida múltiplos arquivos
- `getAcceptAttribute()` - Gera atributo accept para input

**Formatação:**
- `formatFileSize()` - Formata tamanho em bytes para texto legível
- `formatAcceptedFormats()` - Formata lista de formatos

**Processamento:**
- `compressImage()` - Comprime imagens grandes
- `fileToBase64()` - Converte arquivo para base64
- `createFilePreview()` - Cria preview de imagem

**Utilitários:**
- `isImageFormat()` - Verifica se é formato de imagem
- `canUseCameraUpload()` - Verifica se permite câmera
- `sanitizeFilename()` - Sanitiza nome de arquivo
- `downloadFile()` - Faz download de arquivo
- `normalizeDocumentConfig()` - Normaliza configuração

#### 2. Componente DocumentsStep (`components/admin/services/steps/DocumentsStep.tsx`)

Interface para configuração de documentos em serviços:

**Campos configuráveis:**
- ☑️ Obrigatório - Documento é obrigatório para o serviço
- 📷 Permitir Digitalização - Permite uso de câmera para digitalizar
- 📄 Formatos Aceitos - Seleciona formatos permitidos
- 📏 Tamanho Máximo (MB) - Define limite de tamanho

**Opções de formatos:**
- PDF, JPG, PNG (padrão)
- Apenas PDF
- Apenas Imagens (JPG, PNG)
- Todos os documentos (inclui DOC/DOCX)

## Banco de Dados

### Schema Prisma

Os documentos são armazenados como JSON no Prisma:

```prisma
model ServiceSimplified {
  requiredDocuments Json? // Array de DocumentConfig
  // ...
}

model ProtocolSimplified {
  documents Json? // Array de ProtocolDocument
  // ...
}

model ProtocolDocument {
  documentType String
  isRequired   Boolean
  status       DocumentStatus
  fileName     String?
  fileUrl      String?
  fileSize     Int?
  mimeType     String?
  // ...
}
```

### Normalização

Os campos JSON precisam ser parseados do formato string:

```typescript
// Backend
let normalizedDocs = service.requiredDocuments
if (typeof normalizedDocs === 'string') {
  normalizedDocs = JSON.parse(normalizedDocs)
}

// Frontend
import { normalizeRequiredDocuments } from '@/lib/normalize-documents'
const docs = normalizeRequiredDocuments(service.requiredDocuments)
```

## Fluxo de Upload

### 1. Configuração do Serviço (Admin)

```
Admin acessa /admin/servicos/[id]/editar
  ↓
Navega para aba "Documentos"
  ↓
Adiciona documentos necessários
  ↓
Para cada documento, configura:
  - Nome e descrição
  - Obrigatório ou opcional
  - Formatos aceitos (PDF, JPG, etc.)
  - Permite digitalização por câmera
  - Tamanho máximo em MB
  ↓
Salva configurações no campo requiredDocuments (JSON)
```

### 2. Solicitação de Serviço (Cidadão)

```
Cidadão acessa /cidadao/servicos/[id]/solicitar
  ↓
Backend retorna serviço com requiredDocuments parseado
  ↓
Frontend normaliza configurações de documentos
  ↓
Para cada documento configurado:
  - Mostra campo de upload
  - Aplica validação de formato e tamanho
  - Se permitir câmera, mostra opção de digitalizar
  - Valida obrigatoriedade
  ↓
Cidadão faz upload dos arquivos
  ↓
Frontend valida antes de enviar
  ↓
Backend valida novamente (segurança)
  ↓
Arquivos salvos em uploads/documents/YYYY/MM/
  ↓
Informações salvas no campo documents do protocolo
```

### 3. Validação em Camadas

**Camada 1 - Frontend (UX):**
```typescript
const validation = validateFile(file, documentConfig)
if (!validation.valid) {
  showError(validation.error)
  return
}
```

**Camada 2 - Backend (Segurança):**
```typescript
// Middleware multer
fileFilter: (req, file, cb) => {
  if (blockedExtensions.includes(ext)) {
    cb(new Error('Extensão bloqueada'))
    return
  }
  // ...
}

// Validação pós-upload
if (checkForMaliciousContent(file.path)) {
  fs.unlinkSync(file.path)
  throw new Error('Arquivo suspeito')
}
```

## Segurança

### Proteções Implementadas

1. **Validação de Tipo**
   - MIME type whitelist
   - Extensão whitelist
   - Verificação dupla (MIME + extensão)

2. **Sanitização**
   - Remoção de caracteres especiais
   - Prevenção de path traversal
   - Limitação de tamanho de nome

3. **Detecção de Malware**
   - Verificação de magic numbers
   - Bloqueio de executáveis
   - Bloqueio de scripts

4. **Controle de Acesso**
   - Verificação de propriedade do protocolo
   - Autorização familiar
   - Verificação de status do protocolo

5. **Armazenamento Seguro**
   - Arquivos fora do webroot
   - Permissões de diretório restritas (750)
   - Organização por protocolo/data
   - Nomes de arquivo únicos e aleatórios

### Extensões Bloqueadas

```typescript
'.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
'.vbs', '.js', '.jar', '.wsf', '.sh', '.app',
'.deb', '.rpm', '.dmg', '.pkg'
```

### Limites de Segurança

- **Tamanho máximo global:** 50MB
- **Tamanho máximo por documento:** Configurável (1-50MB)
- **Número máximo de arquivos:** 20
- **Tempo de upload:** 2 minutos (configurável)

## Formatos Suportados

### Documentos
- **PDF** - Documentos portáteis
- **DOC/DOCX** - Microsoft Word
- **XLS/XLSX** - Microsoft Excel

### Imagens
- **JPG/JPEG** - Fotos e digitalizações
- **PNG** - Imagens com transparência
- **GIF** - Imagens animadas (raro uso)

## API Endpoints

### Upload de Documentos
```
POST /api/documents/upload/:protocolId
Content-Type: multipart/form-data

Body:
  documents: File[] (até 10 arquivos)

Response:
{
  success: true,
  message: "Documentos enviados com sucesso",
  files: [
    {
      originalName: "cpf.pdf",
      filename: "1234567890_abc123_cpf.pdf",
      size: 1024000,
      mimetype: "application/pdf",
      uploadedAt: "2025-11-10T..."
    }
  ]
}
```

### Listar Documentos
```
GET /api/documents/:protocolId

Response:
{
  success: true,
  protocol: {
    id: "...",
    number: "2025001234"
  },
  documents: [
    {
      originalName: "cpf.pdf",
      filename: "...",
      exists: true,
      currentSize: 1024000,
      lastModified: "2025-11-10T..."
    }
  ]
}
```

### Download de Documento
```
GET /api/documents/:protocolId/download/:filename

Response: (Binary file)
Headers:
  Content-Disposition: attachment; filename="cpf.pdf"
  Content-Type: application/pdf
```

### Remover Documento
```
DELETE /api/documents/:protocolId/:filename

Response:
{
  success: true,
  message: "Documento removido com sucesso"
}
```

### Informações de Limites
```
GET /api/documents/info/limits

Response:
{
  success: true,
  limits: {
    maxFileSize: 5242880,
    maxFiles: 10,
    allowedTypes: [...],
    allowedExtensions: [...]
  }
}
```

## Boas Práticas

### Para Desenvolvedores

1. **Sempre validar no backend**, mesmo que tenha validação no frontend
2. **Usar funções de segurança** (`secureDeleteFile`, `secureMoveFile`)
3. **Normalizar configurações** antes de usar
4. **Logar eventos de upload** para auditoria
5. **Limpar arquivos temporários** em caso de erro

### Para Administradores

1. **Configurar formatos apropriados** para cada tipo de documento
2. **Limitar tamanho** conforme necessidade real
3. **Habilitar câmera apenas para documentos visuais**
4. **Marcar como obrigatório** apenas documentos essenciais
5. **Revisar periodicamente** configurações de documentos

## Troubleshooting

### Problema: Upload falha com "MIME type não permitido"

**Causa:** Arquivo tem MIME type diferente do esperado

**Solução:**
1. Verificar se o formato está na lista de `acceptedFormats`
2. Verificar se o navegador detecta o MIME type corretamente
3. Adicionar o MIME type ao `MIME_TYPE_MAP` se necessário

### Problema: "Arquivo excede tamanho máximo"

**Causa:** Arquivo maior que `maxSizeMB` configurado

**Solução:**
1. Comprimir o arquivo antes do upload
2. Aumentar `maxSizeMB` na configuração do documento
3. Para imagens, usar a função `compressImage()` do frontend

### Problema: Documentos não aparecem na edição de serviço

**Causa:** `requiredDocuments` como string, não como array

**Solução:**
1. Aplicar `normalizeRequiredDocuments()` ao carregar
2. Verificar parsing no backend
3. Verificar se o campo foi salvo como JSON válido

## Melhorias Futuras

- [ ] Integração com antivírus (ClamAV)
- [ ] Suporte a assinatura digital
- [ ] OCR para extração de texto de documentos
- [ ] Versionamento de documentos
- [ ] Compressão automática de imagens
- [ ] Suporte a ZIP de múltiplos arquivos
- [ ] Preview de documentos no navegador
- [ ] Marca d'água em documentos
- [ ] Criptografia de documentos sensíveis
- [ ] Auditoria completa de acessos
