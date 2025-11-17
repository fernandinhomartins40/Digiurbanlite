# 🗺️ MAPEAMENTO COMPLETO - CAMPOS DE VINCULAÇÃO DE CIDADÃOS

## 📋 Índice

1. [Resumo Executivo](#resumo-executivo)
2. [Matriz de Campos por Departamento](#matriz-de-campos-por-departamento)
3. [Mapeamento Legacy → Citizen Links](#mapeamento-legacy--citizen-links)
4. [Priorização de Implementação](#priorização-de-implementação)
5. [Checklist de Transformação](#checklist-de-transformação)

---

## 🎯 RESUMO EXECUTIVO

### Estatísticas Gerais

- **Total de Serviços Analisados**: 267 (backend seeds)
- **Serviços COM_DADOS**: 70 serviços
- **Serviços com Campos de Vinculação**: 26 serviços
- **Departamentos Afetados**: 3 principais (Educação, Saúde, Assistência Social)

### Campos Identificados para Transformação

| Tipo de Campo | Quantidade | Departamentos |
|---------------|------------|---------------|
| CPF de Terceiros | 8 campos únicos | Educação, Saúde |
| Nome de Terceiros | 12 campos únicos | Educação, Saúde, Assistência Social |
| Data de Nascimento de Terceiros | 4 campos | Educação, Saúde, Assistência Social |
| Parentesco/Relacionamento | 6 enums | Educação, Saúde, Assistência Social |
| Arrays de Familiares | 2 estruturas | Assistência Social |
| Contagem de Familiares | 8 campos | Assistência Social, Habitação |

---

## 📊 MATRIZ DE CAMPOS POR DEPARTAMENTO

### 🎓 EDUCAÇÃO (13 serviços, 7 com campos de vinculação)

#### Serviço: Matrícula Escolar
**Campos Legacy:**
```typescript
{
  nomeAluno: string,
  dataNascimentoAluno: date,
  sexoAluno: enum,
  nomeResponsavel: string,
  cpfResponsavel: string (^\d{11}$),
  parentescoResponsavel: enum [Pai, Mãe, Avô/Avó, Tio(a), Irmão(ã), Outro]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      relationship: parentescoResponsavel, // da FamilyComposition
      role: "BENEFICIARY",
      contextData: {
        sexo: sexoAluno
      },
      isVerified: true // se encontrado em FamilyComposition
    }
  ]
}
```

#### Serviço: Matrícula de Aluno (expandida)
**Campos Legacy:**
```typescript
{
  nomeAluno: string,
  dataNascimentoAluno: date,
  cpfAluno: string,
  rgAluno: string,
  certidaoNascimento: string,
  nomeMaeAluno: string,
  nomePaiAluno: string,
  sexoAluno: enum,
  racaCorAluno: enum,
  grauParentesco: enum [Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã) maior, Tutor Legal, Outro],
  possuiGuardaJudicial: boolean
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      relationship: grauParentesco,
      role: "BENEFICIARY",
      contextData: {
        sexo: sexoAluno,
        racaCor: racaCorAluno,
        certidaoNascimento: certidaoNascimento,
        possuiGuardaJudicial: possuiGuardaJudicial,
        nomeMae: nomeMaeAluno,
        nomePai: nomePaiAluno
      },
      isVerified: true
    }
  ]
}
```

#### Serviço: Transporte Escolar
**Campos Legacy:**
```typescript
{
  nomeAluno: string,
  dataNascimentoAluno: date,
  cpfAluno: string
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      role: "BENEFICIARY",
      contextData: {
        serie: serie,
        turno: turno,
        numeroMatricula: numeroMatricula
      }
    }
  ]
}
```

#### Serviço: Registro de Ocorrência Escolar
**Campos Legacy:**
```typescript
{
  nomeAluno: string,
  dataNascimentoAluno: date,
  cpfAluno: string,
  testemunhas: string // texto livre com múltiplos nomes
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      role: "BENEFICIARY"
    },
    // Testemunhas - opcional, pode continuar como texto livre
  ]
}
```

#### Serviço: Solicitação de Documento Escolar
**Campos Legacy:**
```typescript
{
  vinculoComAluno: enum [Próprio Aluno (maior), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã), Tutor Legal, Procurador, Outro],
  possuiProcuracao: boolean,
  nomeAluno: string,
  cpfAluno: string,
  dataNascimentoAluno: date
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      relationship: vinculoComAluno,
      role: "BENEFICIARY",
      contextData: {
        possuiProcuracao: possuiProcuracao
      }
    }
  ]
}
```

#### Serviço: Consulta de Frequência / Consulta de Notas
**Campos Legacy:**
```typescript
{
  vinculoComAluno: enum [Próprio Aluno (maior), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã), Tutor Legal, Outro],
  nomeAluno: string,
  matricula: string
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      relationship: vinculoComAluno,
      role: "BENEFICIARY",
      contextData: {
        matricula: matricula,
        serie: serie,
        turma: turma
      }
    }
  ]
}
```

---

### 🏥 SAÚDE (8 serviços, 4 com campos de vinculação)

#### Serviço: Controle de Medicamentos
**Campos Legacy:**
```typescript
{
  autorizaFamiliarRetirar: boolean,
  nomeFamiliarAutorizado: string,
  cpfFamiliarAutorizado: string (^\d{11}$),
  parentescoFamiliar: enum [Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Neto(a), Outro]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_familiar",
      linkType: "AUTHORIZED_PERSON",
      relationship: parentescoFamiliar,
      role: "AUTHORIZED",
      contextData: {
        autorizaRetirar: autorizaFamiliarRetirar
      },
      isVerified: true
    }
  ]
}
```

#### Serviço: Encaminhamento TFD
**Campos Legacy:**
```typescript
{
  necessitaAcompanhante: boolean,
  nomeAcompanhante: string,
  cpfAcompanhante: string (^\d{11}$),
  rgAcompanhante: string,
  telefoneAcompanhante: string,
  parentescoAcompanhante: enum [Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Neto(a), Outro]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: necessitaAcompanhante ? [
    {
      linkedCitizenId: "cuid_do_acompanhante",
      linkType: "COMPANION",
      relationship: parentescoAcompanhante,
      role: "COMPANION",
      contextData: {
        rg: rgAcompanhante,
        telefone: telefoneAcompanhante
      },
      isVerified: true
    }
  ] : []
}
```

#### Serviço: Transporte de Pacientes
**Campos Legacy:**
```typescript
{
  necessitaAcompanhante: boolean,
  nomeAcompanhante: string,
  cpfAcompanhante: string,
  parentescoAcompanhante: enum [Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Outro]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: necessitaAcompanhante ? [
    {
      linkedCitizenId: "cuid_do_acompanhante",
      linkType: "COMPANION",
      relationship: parentescoAcompanhante,
      role: "COMPANION",
      isVerified: true
    }
  ] : []
}
```

#### Serviço: Cartão Nacional de Saúde
**Campos Legacy:**
```typescript
{
  nomePai: string,
  nomeSocial: string,
  sexo: enum
}
```

**Transformação → Citizen Links:**
```typescript
// Opcional - nomePai pode ficar como texto livre
// Ou criar vínculo se pai estiver cadastrado:
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_pai",
      linkType: "FAMILY_MEMBER",
      relationship: "PARENT",
      role: "OTHER"
    }
  ]
}
```

---

### 🤝 ASSISTÊNCIA SOCIAL (16 serviços, 4 com campos de vinculação)

#### Serviço: Cadastro Único (CadÚnico) - **CRÍTICO**
**Campos Legacy:**
```typescript
{
  membrosFamilia: [
    {
      parentesco: enum [Responsável, Cônjuge, Filho(a), Enteado(a), Pai/Mãe, Outro],
      nome: string, // implícito
      dataNascimento: date, // implícito
      renda: number
    }
  ]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: membrosFamilia.map(membro => ({
    linkedCitizenId: "cuid_do_membro", // buscar ou criar
    linkType: "FAMILY_MEMBER",
    relationship: membro.parentesco,
    role: membro.parentesco === 'Responsável' ? 'RESPONSIBLE' : 'DEPENDENT',
    contextData: {
      renda: membro.renda
    },
    isVerified: true // verificar contra FamilyComposition
  }))
}
```

#### Serviço: Bolsa Família
**Campos Legacy:**
```typescript
{
  nisResponsavel: string (^\d{11}$),
  criancasEscola: [
    {
      nome: string, // implícito
      dataNascimento: date, // implícito
      escola: string,
      frequencia: number
    }
  ]
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: criancasEscola.map(crianca => ({
    linkedCitizenId: "cuid_da_crianca",
    linkType: "DEPENDENT",
    relationship: "SON", // ou "DAUGHTER"
    role: "DEPENDENT",
    contextData: {
      escola: crianca.escola,
      frequencia: crianca.frequencia
    },
    isVerified: true
  }))
}
```

#### Serviço: Solicitação de Benefício Social
**Campos Legacy:**
```typescript
{
  quantidadePessoasFamilia: number,
  quantidadeCriancas: number, // 0-12 anos
  quantidadeAdolescentes: number, // 13-17 anos
  quantidadeIdosos: number, // 60+ anos
  quantidadePCD: number
}
```

**Transformação → Citizen Links:**
```typescript
// Mantém como campos numéricos
// OU vincula membros da FamilyComposition:
{
  linkedCitizens: // buscar de FamilyComposition onde headId = citizenId
}
```

#### Serviço: Entrega Emergencial
**Campos Legacy:**
```typescript
{
  quantidadePessoasFamilia: number,
  quantidadeCriancas: number
}
```

**Transformação → Citizen Links:**
```typescript
// Similar ao anterior - mantém numérico ou vincula
```

---

### 🏃 ESPORTES (7 serviços, 3 com campos de vinculação)

#### Serviço: Inscrição em Escolinha
**Campos Legacy:**
```typescript
{
  nomeAluno: string, // implícito
  dataNascimentoAluno: date, // implícito
  responsavelNome: string,
  responsavelCPF: string
}
```

**Transformação → Citizen Links:**
```typescript
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid_do_aluno",
      linkType: "STUDENT",
      role: "BENEFICIARY",
      contextData: {
        modalidade: modalidade,
        categoria: categoria
      }
    }
  ]
}
```

---

## 🔄 MAPEAMENTO LEGACY → CITIZEN LINKS

### Template de Transformação

```typescript
// ANTES (Legacy customData)
{
  nome[Pessoa]: string,
  cpf[Pessoa]: string,
  dataNascimento[Pessoa]: date,
  parentesco[Pessoa]: enum,
  ...outrosCampos
}

// DEPOIS (Citizen Links)
{
  linkedCitizens: [
    {
      linkedCitizenId: "cuid", // buscar em Citizen por CPF
      linkType: CitizenLinkType, // STUDENT, COMPANION, etc
      relationship: string, // da FamilyComposition ou do form
      role: ServiceRole, // BENEFICIARY, RESPONSIBLE, etc
      contextData: { ...outrosCampos },
      isVerified: boolean // true se encontrado em FamilyComposition
    }
  ]
}
```

### Regras de Transformação

#### 1. **Detecção de Campos**
```typescript
const citizenLinkPatterns = {
  cpf: /^cpf([A-Z][a-z]+)$/,      // cpfAluno, cpfAcompanhante
  nome: /^nome([A-Z][a-z]+)$/,    // nomeAluno, nomeResponsavel
  data: /^dataNascimento([A-Z][a-z]+)$/,
  parentesco: /^parentesco([A-Z][a-z]+)$/
}
```

#### 2. **Mapeamento de Tipos**
```typescript
const linkTypeMapping = {
  Aluno: "STUDENT",
  Acompanhante: "COMPANION",
  FamiliarAutorizado: "AUTHORIZED_PERSON",
  Responsavel: "GUARDIAN",
  Membro: "FAMILY_MEMBER",
  Crianca: "DEPENDENT"
}
```

#### 3. **Mapeamento de Roles**
```typescript
const roleMapping = {
  STUDENT: "BENEFICIARY",
  COMPANION: "COMPANION",
  AUTHORIZED_PERSON: "AUTHORIZED",
  GUARDIAN: "RESPONSIBLE",
  DEPENDENT: "BENEFICIARY",
  FAMILY_MEMBER: "OTHER"
}
```

---

## 📈 PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### Fase 1: CRÍTICO (Implementação Imediata) ⭐⭐⭐

| Serviço | Departamento | Impacto | Complexidade |
|---------|--------------|---------|--------------|
| Matrícula Escolar | Educação | ALTO | MÉDIA |
| Matrícula de Aluno | Educação | ALTO | ALTA |
| Cadastro Único (CadÚnico) | Assistência Social | ALTO | ALTA |
| Inscrição em Escolinha | Esportes | MÉDIO | MÉDIA |

**Justificativa**: Serviços com maior volume de uso e dados críticos de menores.

### Fase 2: IMPORTANTE (Alta Prioridade) ⭐⭐

| Serviço | Departamento | Impacto | Complexidade |
|---------|--------------|---------|--------------|
| Transporte Escolar | Educação | ALTO | BAIXA |
| Controle de Medicamentos | Saúde | ALTO | MÉDIA |
| Encaminhamento TFD | Saúde | MÉDIO | MÉDIA |
| Transporte de Pacientes | Saúde | MÉDIO | BAIXA |
| Bolsa Família | Assistência Social | ALTO | MÉDIA |

**Justificativa**: Serviços essenciais com vinculação clara de dependentes.

### Fase 3: RECOMENDADO (Prioridade Normal) ⭐

| Serviço | Departamento | Impacto | Complexidade |
|---------|--------------|---------|--------------|
| Registro de Ocorrência Escolar | Educação | MÉDIO | BAIXA |
| Solicitação de Documento Escolar | Educação | MÉDIO | BAIXA |
| Consulta de Frequência | Educação | BAIXO | BAIXA |
| Consulta de Notas | Educação | BAIXO | BAIXA |
| Solicitação de Benefício Social | Assistência Social | MÉDIO | MÉDIA |
| Entrega Emergencial | Assistência Social | MÉDIO | BAIXA |

### Fase 4: OPCIONAL (Conforme Demanda)

| Serviço | Departamento | Impacto | Complexidade |
|---------|--------------|---------|--------------|
| Cartão Nacional de Saúde | Saúde | BAIXO | BAIXA |
| Inscrição em Programa Social | Assistência Social | BAIXO | BAIXA |
| Cadastro de Atleta | Esportes | BAIXO | BAIXA |

---

## ✅ CHECKLIST DE TRANSFORMAÇÃO

### Para Cada Serviço:

#### Backend (Seeds)

- [ ] Identificar campos de vínculo no formSchema
- [ ] Adicionar campo `linkedCitizensConfig` ao seed:
  ```typescript
  linkedCitizensConfig: {
    enabled: true,
    types: [
      {
        linkType: "STUDENT",
        role: "BENEFICIARY",
        fields: {
          cpf: "cpfAluno",
          nome: "nomeAluno",
          dataNascimento: "dataNascimentoAluno",
          parentesco: "parentescoResponsavel"
        },
        contextFields: ["serie", "turno", "escola"]
      }
    ]
  }
  ```
- [ ] Modificar handler POST para processar citizen links
- [ ] Adicionar validação de vínculo familiar
- [ ] Testar criação de links múltiplos

#### Frontend (Formulários)

- [ ] Identificar formulário correspondente
- [ ] Adicionar `CitizenLinkSelector` ao formulário
- [ ] Configurar `contextFields` específicos
- [ ] Implementar validação de campos obrigatórios
- [ ] Testar fluxo de seleção e submissão

#### Migration de Dados

- [ ] Executar script de migração (dry-run)
- [ ] Validar dados migrados
- [ ] Executar script de migração (produção)
- [ ] Verificar integridade dos links criados

#### Testes

- [ ] Teste unitário de transformação
- [ ] Teste de integração (criação de protocolo)
- [ ] Teste de validação familiar
- [ ] Teste de edge cases (sem vínculo, múltiplos vínculos)
- [ ] Teste de performance (bulk links)

---

## 📝 RESUMO DE CAMPOS POR TIPO

### CPF de Terceiros (8 campos únicos)

```
cpfResponsavel (Educação)
cpfAluno (Educação)
cpfFamiliarAutorizado (Saúde)
cpfAcompanhante (Saúde)
nisResponsavel (Assistência Social)
cpf_acompanhante (Sugestões Saúde)
cpf_mae (Sugestões Assistência Social)
responsavelCPF (Esportes)
```

### Nome de Terceiros (12 campos únicos)

```
nomeAluno (Educação - 6 serviços)
nomeResponsavel (Educação - 2 serviços)
nomeMaeAluno (Educação)
nomePaiAluno (Educação)
nomeAcompanhante (Saúde - 2 serviços)
nomeFamiliarAutorizado (Saúde)
nomePai (Saúde)
membrosFamilia[].nome (Assistência Social)
criancasEscola[].nome (Assistência Social)
nomeAluno (Esportes)
responsavelNome (Esportes)
```

### Data de Nascimento de Terceiros (4 campos)

```
dataNascimentoAluno (Educação - 6 serviços)
membrosFamilia[].dataNascimento (Assistência Social)
criancasEscola[].dataNascimento (Assistência Social)
data_nascimento_bebe (Sugestões)
data_nascimento_crianca (Sugestões)
```

### Parentesco/Relacionamento (6 enums)

```
parentescoResponsavel: [Pai, Mãe, Avô/Avó, Tio(a), Irmão(ã), Outro]
grauParentesco: [Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã) maior, Tutor Legal, Outro]
parentescoFamiliar: [Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Neto(a), Outro]
parentescoAcompanhante: [Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Neto(a), Outro]
vinculoComAluno: [Próprio Aluno (maior), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã), Tutor Legal, Procurador, Outro]
membrosFamilia[].parentesco: [Responsável, Cônjuge, Filho(a), Enteado(a), Pai/Mãe, Outro]
```

---

## 🎯 MATRIZ DE IMPACTO

| Departamento | Serviços Afetados | Campos Transformados | Prioridade |
|--------------|-------------------|----------------------|------------|
| **Educação** | 7 / 13 (54%) | 15 campos | ⭐⭐⭐ |
| **Saúde** | 4 / 8 (50%) | 8 campos | ⭐⭐ |
| **Assistência Social** | 4 / 16 (25%) | 12 campos (+ arrays) | ⭐⭐⭐ |
| **Esportes** | 3 / 7 (43%) | 4 campos | ⭐ |
| **Habitação** | 0 / 2 (0%) | Contagem apenas | - |
| **Outros** | 0 / 21 (0%) | - | - |

---

## 📚 EXEMPLOS DE CÓDIGO

### Exemplo 1: Handler Backend com Citizen Links

```typescript
// Em secretarias-educacao.ts

router.post('/matricula-escolar', async (req, res) => {
  const { citizenData, formData } = req.body

  // Criar protocolo
  const protocol = await protocolModuleService.createProtocolWithModule({
    citizenId: citizen.id,
    serviceId,
    formData,
    createdById: userId
  })

  // Processar citizen links
  const citizenLinks = await citizenLinkTransformer.transformLegacyData(
    formData,
    citizen.id,
    'MATRICULA_ESCOLAR'
  )

  // Criar links
  if (citizenLinks.length > 0) {
    await prisma.protocolCitizenLink.createMany({
      data: citizenLinks.map(link => ({
        protocolId: protocol.id,
        ...link
      }))
    })
  }

  return res.json({ success: true, data: { protocol, links: citizenLinks } })
})
```

### Exemplo 2: Formulário Frontend com CitizenLinkSelector

```tsx
// Em app/cidadao/servicos/[id]/solicitar/page.tsx

<form onSubmit={handleSubmit}>
  {/* Campos padrão do cidadão */}
  <CitizenFieldsCard fields={citizenFields} formData={formData} />

  {/* Campos customizados */}
  <CustomFieldsCard fields={customFields} formData={formData} />

  {/* Seletor de cidadãos vinculados */}
  <CitizenLinkSelector
    citizenId={citizen.id}
    linkType="STUDENT"
    role="BENEFICIARY"
    onLinkSelect={(link) => {
      setFormData({
        ...formData,
        linkedStudents: [...(formData.linkedStudents || []), link]
      })
    }}
    onLinkRemove={(link) => {
      setFormData({
        ...formData,
        linkedStudents: formData.linkedStudents?.filter(l => l.id !== link.id)
      })
    }}
    selectedLinks={formData.linkedStudents || []}
    contextFields={[
      { name: 'serie', label: 'Série', type: 'select', options: SERIES, required: true },
      { name: 'turno', label: 'Turno', type: 'select', options: TURNOS, required: true }
    ]}
  />

  <Button type="submit">Solicitar Matrícula</Button>
</form>
```

---

**Desenvolvido por**: Claude Agent SDK
**Data**: Novembro 2025
**Versão**: 1.0.0
