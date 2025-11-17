# PROMPT PARA CONVERSÃO DE SEEDS DE SERVIÇOS

## CONTEXTO
Você precisa converter 102 serviços no arquivo `services-simplified-complete.ts` do formato antigo (JSON Schema com properties) para o novo formato (citizenFields + fields).

## ARQUIVO PARA EDITAR
`services-simplified-complete.ts` (arquivo de seeds do Prisma)

## FORMATO ANTIGO (que precisa ser convertido)
```typescript
formSchema: {
  type: 'object',
  properties: {
    // Campos do cidadão (duplicados)
    nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
    cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
    rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
    dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
    email: { type: 'string', format: 'email', title: 'E-mail' },
    telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
    telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },
    cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
    logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
    numero: { type: 'string', title: 'Número', maxLength: 10 },
    complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
    bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
    nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
    estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
    profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
    rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: [...] },

    // Campos específicos do serviço (exemplo)
    pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },
    cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
    tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Consulta', 'Emergência', 'Retorno'] },
    // ... outros campos específicos
  },
  required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'cartaoSUS', 'tipoAtendimento']
}
```

## FORMATO NOVO (como deve ficar)
```typescript
formSchema: {
  citizenFields: [
    'citizen_name',
    'citizen_cpf',
    'citizen_rg',
    'citizen_birthDate',
    'citizen_email',
    'citizen_phone',
    'citizen_phoneSecondary',
    'citizen_zipCode',
    'citizen_address',
    'citizen_addressNumber',
    'citizen_addressComplement',
    'citizen_neighborhood',
    'citizen_motherName',
    'citizen_maritalStatus',
    'citizen_occupation',
    'citizen_familyIncome'
  ],
  fields: [
    {
      id: 'pontoReferencia',
      label: 'Ponto de Referência (opcional)',
      type: 'text',
      maxLength: 200,
      required: false
    },
    {
      id: 'cartaoSUS',
      label: 'Cartão SUS (CNS)',
      type: 'text',
      pattern: '^\\d{15}$',
      minLength: 15,
      maxLength: 15,
      required: true
    },
    {
      id: 'tipoAtendimento',
      label: 'Tipo de Atendimento',
      type: 'select',
      options: ['Consulta', 'Emergência', 'Retorno'],
      required: true
    }
    // ... outros campos específicos
  ]
}
```

## REGRAS DE MAPEAMENTO

### 1. CAMPOS DO CIDADÃO → citizenFields
Sempre que encontrar estes campos no `properties`, remova-os e adicione ao array `citizenFields`:

| Campo Antigo | citizenField |
|--------------|--------------|
| `nome` | `'citizen_name'` |
| `cpf` | `'citizen_cpf'` |
| `rg` | `'citizen_rg'` |
| `dataNascimento` | `'citizen_birthDate'` |
| `email` | `'citizen_email'` |
| `telefone` | `'citizen_phone'` |
| `telefoneSecundario` | `'citizen_phoneSecondary'` |
| `cep` | `'citizen_zipCode'` |
| `logradouro` | `'citizen_address'` |
| `numero` | `'citizen_addressNumber'` |
| `complemento` | `'citizen_addressComplement'` |
| `bairro` | `'citizen_neighborhood'` |
| `nomeMae` | `'citizen_motherName'` |
| `estadoCivil` | `'citizen_maritalStatus'` |
| `profissao` | `'citizen_occupation'` |
| `rendaFamiliar` | `'citizen_familyIncome'` |

**IMPORTANTE:**
- Só adicione `'citizen_occupation'` se o serviço tiver o campo `profissao`
- Só adicione `'citizen_familyIncome'` se o serviço tiver o campo `rendaFamiliar`
- Nem todos os serviços têm todos os campos

### 2. CAMPOS ESPECÍFICOS → fields array
Todos os outros campos vão para o array `fields` como objetos, convertendo:

| Propriedade Antiga | Propriedade Nova |
|-------------------|------------------|
| `title: 'X'` | `label: 'X'` |
| `type: 'string'` | `type: 'text'` (se maxLength ≤ 500)<br>`type: 'textarea'` (se maxLength > 500 ou se for descrição/observações) |
| `type: 'string', format: 'date'` | `type: 'date'` |
| `type: 'string', format: 'email'` | `type: 'email'` |
| `type: 'string', enum: [...]` | `type: 'select', options: [...]` |
| `type: 'boolean'` | `type: 'checkbox'` |
| `type: 'integer'` | `type: 'number'` |
| `type: 'number'` | `type: 'number'` |
| `type: 'array'` | `type: 'array'` (preservar estrutura) |
| `default: valor` | `defaultValue: valor` |

### 3. REQUIRED
- Remova o array `required: [...]` no final do formSchema
- Para cada campo em `fields`, adicione `required: true` ou `required: false`
- Se o campo estava no array `required` antigo → `required: true`
- Se NÃO estava no array `required` antigo → `required: false`
- **NÃO adicione `required` para campos que vão para `citizenFields`**

### 4. CAMPOS ESPECIAIS

#### Arrays (ex: medicamentos, documentos)
Preserve a estrutura completa do array:
```typescript
{
  id: 'medicamentos',
  label: 'Medicamentos Solicitados',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      nome: { type: 'string', title: 'Nome do Medicamento', minLength: 3, maxLength: 200 },
      dosagem: { type: 'string', title: 'Dosagem', maxLength: 50 },
      quantidade: { type: 'integer', title: 'Quantidade', minimum: 1 }
    },
    required: ['nome', 'dosagem', 'quantidade']
  },
  minItems: 1,
  required: true
}
```

#### Campos com pattern
Preserve o pattern:
```typescript
{
  id: 'cpfFamiliar',
  label: 'CPF do Familiar',
  type: 'text',
  pattern: '^\\d{11}$',
  minLength: 11,
  maxLength: 11,
  required: false
}
```

#### Campos de texto longo
Use `type: 'textarea'` para:
- `descricao`, `observacoes`, `justificativa`, `motivoConsulta`, `historico`, etc.
- Qualquer campo com `maxLength > 500`

## CAMPOS QUE SEMPRE FICAM EM fields (NUNCA vão para citizenFields)

Mesmo sendo dados do cidadão, estes ficam em `fields` porque não estão no perfil padrão:
- `pontoReferencia` (complemento de endereço)
- `cartaoSUS`, `alergiasMedicamentos`, `necessidadesEspeciais`, `tipoSanguineo` (dados de saúde)
- `peso`, `altura` (dados físicos)
- `possuiConvenio`, `nomeConvenio` (dados de convênio)
- Todos os campos específicos do serviço

## CAMPOS RELACIONADOS A OUTRAS PESSOAS

**ATENÇÃO:** Campos que se referem a outras pessoas (não o cidadão solicitante) NUNCA vão para citizenFields:

- `nomeAluno`, `cpfAluno`, `dataNascimentoAluno` → ficam em `fields`
- `nomeDependente`, `cpfDependente` → ficam em `fields`
- `nomeResponsavel`, `cpfResponsavel` → ficam em `fields`
- `nomeMedico`, `crmMedico` → ficam em `fields`
- `nomeFamiliarAutorizado`, `cpfFamiliarAutorizado` → ficam em `fields`
- `responsavelTecnico`, `creaResponsavel` → ficam em `fields`

## EXEMPLO COMPLETO DE CONVERSÃO

### ANTES:
```typescript
{
  name: 'Atendimentos - Saúde',
  description: 'Registro geral de atendimentos na área da saúde',
  departmentCode: 'SAUDE',
  serviceType: 'COM_DADOS',
  moduleType: 'ATENDIMENTOS_SAUDE',
  requiresDocuments: false,
  estimatedDays: 1,
  priority: 3,
  formSchema: {
    type: 'object',
    properties: {
      nome: { type: 'string', title: 'Nome Completo do Paciente', minLength: 3, maxLength: 200 },
      cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
      dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
      email: { type: 'string', format: 'email', title: 'E-mail' },
      telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
      cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
      logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
      numero: { type: 'string', title: 'Número', maxLength: 10 },
      bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
      nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },

      cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$' },
      tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Consulta', 'Emergência', 'Retorno'] },
      unidadeSaude: { type: 'string', title: 'Unidade de Saúde', minLength: 3, maxLength: 200 },
      dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
      descricao: { type: 'string', title: 'Descrição/Queixa Principal', minLength: 10, maxLength: 2000 },
      urgente: { type: 'boolean', title: 'Caso Urgente?', default: false }
    },
    required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'cartaoSUS', 'tipoAtendimento', 'unidadeSaude', 'dataAtendimento', 'descricao']
  }
}
```

### DEPOIS:
```typescript
{
  name: 'Atendimentos - Saúde',
  description: 'Registro geral de atendimentos na área da saúde',
  departmentCode: 'SAUDE',
  serviceType: 'COM_DADOS',
  moduleType: 'ATENDIMENTOS_SAUDE',
  requiresDocuments: false,
  estimatedDays: 1,
  priority: 3,
  formSchema: {
    citizenFields: [
      'citizen_name',
      'citizen_cpf',
      'citizen_birthDate',
      'citizen_email',
      'citizen_phone',
      'citizen_zipCode',
      'citizen_address',
      'citizen_addressNumber',
      'citizen_neighborhood',
      'citizen_motherName'
    ],
    fields: [
      {
        id: 'cartaoSUS',
        label: 'Cartão SUS (CNS)',
        type: 'text',
        pattern: '^\\d{15}$',
        required: true
      },
      {
        id: 'tipoAtendimento',
        label: 'Tipo de Atendimento',
        type: 'select',
        options: ['Consulta', 'Emergência', 'Retorno'],
        required: true
      },
      {
        id: 'unidadeSaude',
        label: 'Unidade de Saúde',
        type: 'text',
        minLength: 3,
        maxLength: 200,
        required: true
      },
      {
        id: 'dataAtendimento',
        label: 'Data do Atendimento',
        type: 'date',
        required: true
      },
      {
        id: 'descricao',
        label: 'Descrição/Queixa Principal',
        type: 'textarea',
        minLength: 10,
        maxLength: 2000,
        required: true
      },
      {
        id: 'urgente',
        label: 'Caso Urgente?',
        type: 'checkbox',
        defaultValue: false,
        required: false
      }
    ]
  }
}
```

## INSTRUÇÕES PARA A IA

1. Leia o arquivo `services-simplified-complete.ts` completo
2. Identifique TODOS os serviços que têm `formSchema` com `type: 'object'` e `properties`
3. Para CADA serviço encontrado:
   - Identifique quais campos são do cidadão (use a tabela de mapeamento)
   - Mova esses campos para o array `citizenFields` usando os nomes corretos (citizen_*)
   - Converta os campos restantes para o array `fields` seguindo as regras de conversão
   - Verifique o array `required` antigo para marcar `required: true/false` nos campos de `fields`
   - Remova o `type: 'object'`, `properties` e `required` array antigo
4. **NÃO modifique serviços que já estão no formato novo** (que já têm `citizenFields`)
5. **NÃO modifique serviços INFORMATIVOS** (que não têm formSchema complexo)
6. Preserve todos os comentários, espaçamento e estrutura do arquivo
7. Retorne o arquivo completo modificado

## TOTAL DE SERVIÇOS A CONVERTER
- Aproximadamente 102 serviços com formSchema.properties
- Já foram convertidos 3 serviços de Saúde manualmente
- Faltam aproximadamente 99 serviços para converter

## VERIFICAÇÃO FINAL
Após a conversão, verifique:
- [ ] Todos os serviços COM_DADOS foram convertidos
- [ ] Nenhum campo do cidadão ficou duplicado em fields
- [ ] Todos os campos específicos do serviço estão em fields
- [ ] Arrays complexos foram preservados corretamente
- [ ] O array citizenFields só tem campos citizen_* que existiam no serviço original
- [ ] Campos de outras pessoas (aluno, dependente, etc) ficaram em fields
