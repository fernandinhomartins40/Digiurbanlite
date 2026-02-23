# Quick Fix Recommendations - Top 20 Critical Issues

## Instructions
For each issue below, add the missing documents to the service's requiredDocuments array.


## GROUP 1: CREATE MISSING SERVICE DEFINITIONS (39 services)

These workflows have NO matching service. You must create the service definition.


### 1. ENCAMINHAMENTOS_TFD
**Action:** Create service in appropriate seed file
**Required docs:** ['Atestado Médico', 'Exames', 'Guia de Encaminhamento']
```typescript
{
  moduleType: 'ENCAMINHAMENTOS_TFD',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'Atestado Médico',
    'Exames',
    'Guia de Encaminhamento',
  ],
  // ... other fields
}
```


### 2. INSCRICAO_PROGRAMA_RURAL
**Action:** Create service in appropriate seed file
**Required docs:** ['CPF', 'Cadastro de Produtor', 'DAP']
```typescript
{
  moduleType: 'INSCRICAO_PROGRAMA_RURAL',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'CPF',
    'Cadastro de Produtor',
    'DAP',
  ],
  // ... other fields
}
```


### 3. SOLICITACAO_MAQUINAS
**Action:** Create service in appropriate seed file
**Required docs:** ['CPF', 'Comprovante de Propriedade ou Posse']
```typescript
{
  moduleType: 'SOLICITACAO_MAQUINAS',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'CPF',
    'Comprovante de Propriedade ou Posse',
  ],
  // ... other fields
}
```


### 4. SOLICITACAO_BENEFICIO
**Action:** Create service in appropriate seed file
**Required docs:** ['CPF', 'Comprovante de Residência', 'RG']
```typescript
{
  moduleType: 'SOLICITACAO_BENEFICIO',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'CPF',
    'Comprovante de Residência',
    'RG',
  ],
  // ... other fields
}
```


### 5. CADASTRO_EVENTO_CULTURAL
**Action:** Create service in appropriate seed file
**Required docs:** ['CPF/CNPJ Responsável', 'Projeto do Evento']
```typescript
{
  moduleType: 'CADASTRO_EVENTO_CULTURAL',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'CPF/CNPJ Responsável',
    'Projeto do Evento',
  ],
  // ... other fields
}
```


### 6. RESERVA_ESPACO_CULTURAL
**Action:** Create service in appropriate seed file
**Required docs:** ['CPF/CNPJ', 'Projeto do Evento']
```typescript
{
  moduleType: 'RESERVA_ESPACO_CULTURAL',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'CPF/CNPJ',
    'Projeto do Evento',
  ],
  // ... other fields
}
```


### 7. INSCRICAO_COMPETICAO
**Action:** Create service in appropriate seed file
**Required docs:** ['Atestado Médico', 'Ficha de Inscrição']
```typescript
{
  moduleType: 'INSCRICAO_COMPETICAO',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'Atestado Médico',
    'Ficha de Inscrição',
  ],
  // ... other fields
}
```


### 8. INSCRICAO_ESCOLINHA
**Action:** Create service in appropriate seed file
**Required docs:** ['Atestado Médico', 'Comprovante de Residência', 'RG']
```typescript
{
  moduleType: 'INSCRICAO_ESCOLINHA',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'Atestado Médico',
    'Comprovante de Residência',
    'RG',
  ],
  // ... other fields
}
```


### 9. PROGRAMA_AMBIENTAL
**Action:** Create service in appropriate seed file
**Required docs:** ['Documento de Identidade']
```typescript
{
  moduleType: 'PROGRAMA_AMBIENTAL',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'Documento de Identidade',
  ],
  // ... other fields
}
```


### 10. AUTORIZACAO_DEMOLICAO
**Action:** Create service in appropriate seed file
**Required docs:** ['ART', 'Comprovante de Propriedade', 'Matrícula do Imóvel', 'Projeto de Demolição']
```typescript
{
  moduleType: 'AUTORIZACAO_DEMOLICAO',
  name: 'TODO: Add service name',
  requiredDocuments: [
    'ART',
    'Comprovante de Propriedade',
    'Matrícula do Imóvel',
    'Projeto de Demolição',
  ],
  // ... other fields
}
```


... and 29 more (see full report)


## GROUP 2: UPDATE EXISTING SERVICES (Top 10)


### 1. CREDENCIAMENTO_TAXI (transport-transit.seed.ts)
**Missing:** 7 documents
**Current service docs:** ['CNH Categoria B (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Taxista', 'Vistoria do Veículo']

**Add these to requiredDocuments:**
  - 'Atestado de Antecedentes'
  - 'Atestado de Saúde'
  - 'CPF'
  - 'CRLV'
  - 'Certidões'
  - 'RG'
  - 'Seguro'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CNH Categoria B (mínimo)',
  'Certidão de Antecedentes Criminais',
  'Comprovante de Residência',
  'Curso de Formação de Taxista',
  'Vistoria do Veículo',
  'Atestado de Antecedentes', // ADDED
  'Atestado de Saúde', // ADDED
  'CPF', // ADDED
  'CRLV', // ADDED
  'Certidões', // ADDED
  'RG', // ADDED
  'Seguro', // ADDED
]
```


### 2. CREDENCIAMENTO_MOTOTAXI (transport-transit.seed.ts)
**Missing:** 6 documents
**Current service docs:** ['CNH Categoria A (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Mototaxista', 'Vistoria da Motocicleta']

**Add these to requiredDocuments:**
  - 'Atestado de Saúde'
  - 'CPF'
  - 'CRLV'
  - 'Certidões'
  - 'RG'
  - 'Seguro'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CNH Categoria A (mínimo)',
  'Certidão de Antecedentes Criminais',
  'Comprovante de Residência',
  'Curso de Formação de Mototaxista',
  'Vistoria da Motocicleta',
  'Atestado de Saúde', // ADDED
  'CPF', // ADDED
  'CRLV', // ADDED
  'Certidões', // ADDED
  'RG', // ADDED
  'Seguro', // ADDED
]
```


### 3. CADASTRO_VOLUNTARIO (civil-defense.seed.ts)
**Missing:** 5 documents
**Current service docs:** []

**Add these to requiredDocuments:**
  - 'Atestado de Antecedentes'
  - 'CPF'
  - 'Comprovante de Residência'
  - 'Currículo'
  - 'RG'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'Atestado de Antecedentes', // ADDED
  'CPF', // ADDED
  'Comprovante de Residência', // ADDED
  'Currículo', // ADDED
  'RG', // ADDED
]
```


### 4. CREDENCIAMENTO_TRANSPORTE_ESCOLAR (transport-transit.seed.ts)
**Missing:** 5 documents
**Current service docs:** ['CNH Categoria D', 'Certidão de Antecedentes Criminais', 'Curso de Transporte Escolar', 'Vistoria do Veículo', 'CRLV', 'Seguro Obrigatório']

**Add these to requiredDocuments:**
  - 'Atestado de Saúde'
  - 'CPF'
  - 'Certidões'
  - 'Curso Transporte Escolar'
  - 'RG'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CNH Categoria D',
  'Certidão de Antecedentes Criminais',
  'Curso de Transporte Escolar',
  'Vistoria do Veículo',
  'CRLV',
  'Seguro Obrigatório',
  'Atestado de Saúde', // ADDED
  'CPF', // ADDED
  'Certidões', // ADDED
  'Curso Transporte Escolar', // ADDED
  'RG', // ADDED
]
```


### 5. REGULARIZACAO_OBRA (public-works.seed.ts)
**Missing:** 5 documents
**Current service docs:** ['Projeto As-Built', 'ART', 'Matrícula do Imóvel', 'Fotos da Edificação']

**Add these to requiredDocuments:**
  - 'COMPROVANTE_RESIDENCIA'
  - 'CPF'
  - 'ESCRITURA_IMOVEL'
  - 'LAUDO_TECNICO'
  - 'RG'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'Projeto As-Built',
  'ART',
  'Matrícula do Imóvel',
  'Fotos da Edificação',
  'COMPROVANTE_RESIDENCIA', // ADDED
  'CPF', // ADDED
  'ESCRITURA_IMOVEL', // ADDED
  'LAUDO_TECNICO', // ADDED
  'RG', // ADDED
]
```


### 6. CADASTRO_UNICO (social.seed.ts)
**Missing:** 4 documents
**Current service docs:** ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda']

**Add these to requiredDocuments:**
  - 'CPF'
  - 'Comprovante de Residência'
  - 'RG'
  - 'Título de Eleitor'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CadÚnico',
  'Documentos Pessoais',
  'Comprovante de Renda',
  'CPF', // ADDED
  'Comprovante de Residência', // ADDED
  'RG', // ADDED
  'Título de Eleitor', // ADDED
]
```


### 7. INSCRICAO_PROGRAMA_SOCIAL (social.seed.ts)
**Missing:** 4 documents
**Current service docs:** ['CadÚnico', 'Documentos Pessoais']

**Add these to requiredDocuments:**
  - 'CPF'
  - 'Comprovante de Renda'
  - 'Comprovante de Residência'
  - 'RG'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CadÚnico',
  'Documentos Pessoais',
  'CPF', // ADDED
  'Comprovante de Renda', // ADDED
  'Comprovante de Residência', // ADDED
  'RG', // ADDED
]
```


### 8. LAUDO_VISTORIA_SEGURANCA (public-safety.seed.ts)
**Missing:** 4 documents
**Current service docs:** ['Alvará de Funcionamento', 'CNPJ']

**Add these to requiredDocuments:**
  - 'CPF'
  - 'Comprovante de Propriedade'
  - 'Fotos'
  - 'Relatório de Vistoria'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'Alvará de Funcionamento',
  'CNPJ',
  'CPF', // ADDED
  'Comprovante de Propriedade', // ADDED
  'Fotos', // ADDED
  'Relatório de Vistoria', // ADDED
]
```


### 9. CADASTRO_ESTABELECIMENTO_TURISTICO (tourism.seed.ts)
**Missing:** 4 documents
**Current service docs:** ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social']

**Add these to requiredDocuments:**
  - 'Comprovante de Endereço'
  - 'Comprovantes'
  - 'Fotos'
  - 'Relatório de Vistoria'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'CNPJ',
  'Alvará de Funcionamento',
  'Contrato Social',
  'Comprovante de Endereço', // ADDED
  'Comprovantes', // ADDED
  'Fotos', // ADDED
  'Relatório de Vistoria', // ADDED
]
```


### 10. APROVACAO_LOTEAMENTO (public-works.seed.ts)
**Missing:** 4 documents
**Current service docs:** ['Projeto de Loteamento', 'Memorial Descritivo', 'Matrícula do Terreno', 'ART', 'Licença Ambiental']

**Add these to requiredDocuments:**
  - 'CPF/CNPJ'
  - 'Certidões Negativas'
  - 'Levantamento Topográfico'
  - 'Matrícula do Imóvel'

**Updated requiredDocuments array:**
```typescript
requiredDocuments: [
  'Projeto de Loteamento',
  'Memorial Descritivo',
  'Matrícula do Terreno',
  'ART',
  'Licença Ambiental',
  'CPF/CNPJ', // ADDED
  'Certidões Negativas', // ADDED
  'Levantamento Topográfico', // ADDED
  'Matrícula do Imóvel', // ADDED
]
```
