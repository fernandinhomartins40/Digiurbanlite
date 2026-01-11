# Guia de Integração - Sistema Completo de Documentos e Digitalização

## Visão Geral

Sistema completo e integrado de gerenciamento de documentos com:
- ✅ Upload seguro com validação em múltiplas camadas
- ✅ Digitalização por câmera com preview e otimização
- ✅ OCR inteligente para extração de dados
- ✅ Integração completa com motor de protocolos
- ✅ Armazenamento seguro e organizado
- ✅ Validação dinâmica baseada em configurações de serviço

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ DocumentUpload   │────│ DocumentScanner  │              │
│  │ Component        │    │ Component        │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                        │                         │
│           └────────────┬───────────┘                         │
│                        │                                     │
│                   document-utils.ts                          │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                    HTTP API
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                        │            BACKEND                   │
├────────────────────────┼─────────────────────────────────────┤
│                        │                                      │
│            document-upload.routes.ts                          │
│                        │                                      │
│         ┌──────────────┼──────────────┐                      │
│         │              │              │                       │
│  secure-upload    document-upload  document-processing       │
│  middleware.ts    service.ts       service.ts                │
│         │              │              │                       │
│         └──────────────┼──────────────┘                      │
│                        │                                      │
│                        ├── protocol-document.service.ts      │
│                        │                                      │
│                        ├── protocol-simplified.service.ts    │
│                        │                                      │
│                        └── document-validation.ts            │
│                                     │                         │
└─────────────────────────────────────┼─────────────────────────┘
                                      │
                              ┌───────┴────────┐
                              │                │
                         Database         File System
                       (Prisma/PG)    (uploads/protocols/)
```

## Componentes

### Frontend

#### 1. DocumentScanner (`components/common/DocumentScanner.tsx`)

Componente de digitalização de documentos via câmera:

**Características:**
- Acesso à câmera do dispositivo (frontal/traseira)
- Preview em tempo real com overlay de guia
- Controle de zoom (1x-3x)
- Captura e confirmação de foto
- Compressão automática de imagens
- Validação antes do envio
- Interface intuitiva e moderna

**Uso:**
```tsx
<DocumentScanner
  documentName="CPF"
  acceptedFormats={['jpg', 'jpeg', 'png']}
  maxSizeMB={5}
  onCapture={(file) => handleFileCapture(file)}
  onCancel={() => setShowScanner(false)}
/>
```

#### 2. DocumentUpload (`components/common/DocumentUpload.tsx`)

Componente de upload com suporte a arquivo e câmera:

**Características:**
- Botão de digitalização por câmera (se permitido)
- Seletor de arquivo tradicional
- Preview de arquivos enviados
- Validação client-side
- Feedback visual de status
- Remoção de arquivo

**Uso:**
```tsx
<DocumentUpload
  documentConfig={{
    name: "CPF",
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMB: 5,
    allowCameraUpload: true
  }}
  value={file}
  onChange={setFile}
/>
```

#### 3. Utilitários (`lib/document-utils.ts`)

Funções auxiliares para manipulação de documentos:

```typescript
// Validar arquivo
const validation = validateFile(file, documentConfig)

// Comprimir imagem
const compressed = await compressImage(file, maxSizeMB, quality)

// Formatar tamanho
const sizeStr = formatFileSize(bytes)

// Obter atributo accept
const accept = getAcceptAttribute(['pdf', 'jpg', 'png'])

// Verificar permissão de câmera
const canUseCamera = canUseCameraUpload(documentConfig)
```

### Backend

#### 1. Middleware de Upload Seguro (`middleware/secure-upload.ts`)

Middleware com múltiplas camadas de segurança:

**Recursos:**
- Sanitização de nomes de arquivo
- Detecção de conteúdo malicioso (magic numbers)
- Bloqueio de extensões perigosas
- Validação de MIME type e extensão
- Geração de nomes únicos com crypto
- Organização por data (YYYY/MM)
- Permissões de diretório seguras

**Uso:**
```typescript
const upload = createSecureUploadMiddleware(documentConfigs, {
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 10
})

router.post('/upload', upload.array('documents', 10), handler)
```

#### 2. Serviço de Upload de Documentos (`services/document-upload.service.ts`)

Serviço integrado com protocolo:

**Métodos:**
- `uploadDocumentsToProtocol()` - Upload completo com validação
- `validateServiceDocuments()` - Valida contra configurações de serviço
- `deleteDocument()` - Remove documento com segurança
- `getServiceDocumentRequirements()` - Obtém requisitos de documentos
- `checkProtocolDocumentsComplete()` - Verifica status de documentos

**Uso:**
```typescript
const result = await documentUploadService.uploadDocumentsToProtocol({
  protocolId,
  files,
  uploadedBy: userId,
  documentTypes: ['CPF', 'RG'],
  citizenId
})
```

#### 3. Serviço de Processamento (`services/document-processing.service.ts`)

Processamento inteligente com OCR:

**Recursos:**
- OCR com Tesseract.js (português)
- Extração de informações estruturadas (CPF, RG, nome, datas)
- Análise de qualidade de imagem
- Otimização automática para melhor OCR
- Validação de CPF
- Conversão de formatos (HEIC para JPEG)
- Rotação automática baseada em EXIF

**Uso:**
```typescript
// Processar documento
const result = await documentProcessingService.processDocument(imagePath, 'CPF')

// OCR simples
const ocrResult = await documentProcessingService.performOCR(imagePath)

// Validar CPF
const isValid = documentProcessingService.validateCPF('12345678900')

// Comparar informações
const comparison = documentProcessingService.compareDocumentInfo(
  extracted,
  provided
)
```

#### 4. Validação de Documentos (`utils/document-validation.ts`)

Validação dinâmica baseada em configurações:

**Funções:**
- `validateFile()` - Valida arquivo individual
- `validateDocuments()` - Valida múltiplos arquivos
- `getAllowedMimeTypes()` - Obtém MIME types permitidos
- `getAllowedExtensions()` - Obtém extensões permitidas
- `normalizeDocumentConfigs()` - Normaliza configurações

**Uso:**
```typescript
const validation = validateFile(file, {
  name: "CPF",
  required: true,
  acceptedFormats: ['pdf', 'jpg'],
  maxSizeMB: 5,
  allowCameraUpload: true
})

if (!validation.valid) {
  console.error(validation.error)
}
```

## Rotas da API

### Upload de Documentos

#### POST `/api/document-upload/protocol/:protocolId`

Upload de documentos para protocolo:

**Request:**
```typescript
POST /api/document-upload/protocol/abc123
Content-Type: multipart/form-data

documents: File[]
documentTypes: '["CPF","RG"]' // Opcional, JSON string
```

**Response:**
```json
{
  "success": true,
  "message": "Documentos enviados com sucesso",
  "protocol": {
    "id": "abc123",
    "number": "2025001234"
  },
  "uploadedDocuments": [
    {
      "id": "doc1",
      "documentType": "CPF",
      "fileName": "1234567890_abc_cpf.jpg",
      "fileUrl": "uploads/protocols/abc123/...",
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "status": "UPLOADED"
    }
  ],
  "warnings": []
}
```

### Requisitos de Documentos

#### GET `/api/document-upload/service/:serviceId/requirements`

Obtém requisitos de documentos de um serviço:

**Response:**
```json
{
  "success": true,
  "requirements": [
    {
      "name": "CPF",
      "required": true,
      "acceptedFormats": ["pdf", "jpg", "png"],
      "maxSizeMB": 5,
      "allowCameraUpload": true
    }
  ]
}
```

### Status de Documentos

#### GET `/api/document-upload/protocol/:protocolId/status`

Verifica status dos documentos do protocolo:

**Response:**
```json
{
  "success": true,
  "status": {
    "complete": false,
    "total": 3,
    "uploaded": 2,
    "pending": 1,
    "missingDocuments": ["Comprovante de Endereço"]
  }
}
```

### Processamento OCR

#### POST `/api/document-upload/process-ocr`

Processa documento com OCR:

**Request:**
```typescript
POST /api/document-upload/process-ocr
Content-Type: multipart/form-data

document: File
documentType: 'CPF'
```

**Response:**
```json
{
  "success": true,
  "ocrResult": {
    "text": "REPÚBLICA FEDERATIVA DO BRASIL...",
    "confidence": 87.5,
    "language": "por",
    "processingTime": 2500
  },
  "extractedInfo": {
    "type": "CPF",
    "cpf": "12345678900",
    "name": "JOÃO DA SILVA",
    "birthDate": "01/01/1990"
  },
  "imageQuality": {
    "score": 85,
    "issues": [],
    "recommendations": []
  }
}
```

## Fluxo Completo de Upload

### 1. Cidadão Solicita Serviço

```typescript
// 1. Buscar requisitos do serviço
const response = await fetch(`/api/document-upload/service/${serviceId}/requirements`)
const { requirements } = await response.json()

// 2. Renderizar campos de upload
requirements.map(req => (
  <DocumentUpload
    key={req.name}
    documentConfig={req}
    value={files[req.name]}
    onChange={(file) => setFiles({ ...files, [req.name]: file })}
  />
))

// 3. Após criação do protocolo, fazer upload
const formData = new FormData()
Object.keys(files).forEach(docType => {
  formData.append('documents', files[docType])
})
formData.append('documentTypes', JSON.stringify(Object.keys(files)))

const uploadResponse = await fetch(
  `/api/document-upload/protocol/${protocolId}`,
  {
    method: 'POST',
    body: formData
  }
)
```

### 2. Backend Processa Upload

```typescript
// 1. Middleware de segurança valida arquivos
// 2. DocumentUploadService processa

const result = await documentUploadService.uploadDocumentsToProtocol({
  protocolId,
  files,
  uploadedBy: citizenId,
  documentTypes,
  citizenId
})

// 3. Para cada arquivo:
//    - Valida contra configurações do serviço
//    - Verifica conteúdo malicioso
//    - Move para diretório do protocolo
//    - Cria registro em ProtocolDocument
//    - Atualiza campo documents do protocolo (JSON)

// 4. Cria histórico e notificações
// 5. Verifica se todos documentos obrigatórios foram enviados
```

### 3. Processamento com OCR (Opcional)

```typescript
// Admin pode processar documento com OCR
const formData = new FormData()
formData.append('document', documentFile)
formData.append('documentType', 'CPF')

const ocrResponse = await fetch('/api/document-upload/process-ocr', {
  method: 'POST',
  body: formData
})

const { extractedInfo } = await ocrResponse.json()

// Usar informações extraídas para validação ou preenchimento automático
if (extractedInfo.cpf) {
  autofillCPF(extractedInfo.cpf)
}
```

## Integração com Motor de Protocolos

### Criação de Protocolo com Documentos

```typescript
// 1. Criar protocolo
const protocol = await ProtocolServiceSimplified.createProtocol({
  title: "Solicitação de Serviço X",
  citizenId,
  serviceId,
  formData: { /* dados do formulário */ }
})

// 2. Upload de documentos
const uploadResult = await documentUploadService.uploadDocumentsToProtocol({
  protocolId: protocol.id,
  files: documentFiles,
  uploadedBy: citizenId
})

// 3. Motor verifica documentos obrigatórios
const docCheck = await documentUploadService.checkProtocolDocumentsComplete(
  protocol.id
)

if (!docCheck.complete) {
  // Manter protocolo como PENDENTE até todos docs serem enviados
  console.log('Documentos faltantes:', docCheck.missingDocuments)
}
```

### Validação em Etapas do Workflow

```typescript
// Em um módulo/handler específico
async beforeTransition(protocolId: string, toStage: string) {
  if (toStage === 'ANALISE') {
    // Verificar se todos documentos foram aprovados
    const check = await documentService.checkAllDocumentsApproved(protocolId)

    if (!check.allApproved) {
      throw new Error(
        `Documentos pendentes de aprovação: ${check.pending} de ${check.total}`
      )
    }
  }
}
```

## Banco de Dados

### Modelos Utilizados

#### ProtocolSimplified
```prisma
model ProtocolSimplified {
  id        String @id
  documents Json?  // Array de ProtocolDocument (resumo)
  // ...
}
```

#### ProtocolDocument
```prisma
model ProtocolDocument {
  id           String @id
  protocolId   String
  documentType String
  isRequired   Boolean
  status       DocumentStatus  // PENDING, UPLOADED, UNDER_REVIEW, APPROVED, REJECTED
  fileName     String?
  fileUrl      String?
  fileSize     Int?
  mimeType     String?
  uploadedBy   String?
  uploadedAt   DateTime?
  validatedBy  String?
  validatedAt  DateTime?
  // ...
}
```

#### ServiceSimplified
```prisma
model ServiceSimplified {
  id                String  @id
  requiredDocuments Json?   // Array de DocumentConfig
  // ...
}
```

## Segurança

### Camadas de Proteção

1. **Client-side** (Frontend)
   - Validação de formato
   - Validação de tamanho
   - Preview antes de envio

2. **Upload** (Middleware)
   - Filtro de MIME type
   - Filtro de extensão
   - Bloqueio de executáveis
   - Sanitização de nomes

3. **Pós-Upload** (Middleware)
   - Verificação de magic numbers
   - Verificação de integridade
   - Análise de conteúdo malicioso

4. **Serviço** (Business Logic)
   - Validação contra configurações
   - Verificação de permissões
   - Verificação de protocolo

5. **Storage** (File System)
   - Diretórios seguros (750)
   - Nomes únicos e aleatórios
   - Organização isolada por protocolo

## Dependências

### Backend
```json
{
  "tesseract.js": "^5.0.0",    // OCR
  "sharp": "^0.33.0",           // Processamento de imagem
  "multer": "^1.4.5-lts.1"      // Upload de arquivos
}
```

### Frontend
```json
{
  // Já incluídos no projeto
  "react": "^18.0.0",
  "next": "^14.0.0"
}
```

## Performance

### Otimizações Implementadas

1. **Compressão de Imagens**
   - Automática para imagens > maxSizeMB
   - Qualidade ajustável (padrão: 80%)
   - Redimensionamento para max 2048px

2. **Processamento Assíncrono**
   - OCR roda em worker separado
   - Upload paralelo de múltiplos arquivos

3. **Cache**
   - Preview de imagens em memory
   - Worker do OCR reusável

4. **Validação Antecipada**
   - Client-side antes de upload
   - Feedback imediato ao usuário

## Próximas Melhorias

- [ ] Suporte a arrastar e soltar (drag & drop)
- [ ] Upload em lote com progress bar individual
- [ ] Edição de imagem (corte, rotação, filtros)
- [ ] Comparação facial com foto do documento
- [ ] Detecção automática de tipo de documento
- [ ] Assinatura digital de documentos
- [ ] Criptografia end-to-end para documentos sensíveis
- [ ] Backup automático em cloud storage (S3, GCS)
- [ ] Auditoria completa de acessos
- [ ] Versionamento de documentos
