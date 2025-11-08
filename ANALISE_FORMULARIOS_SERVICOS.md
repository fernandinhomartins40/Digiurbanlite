# 📋 ANÁLISE DETALHADA DOS FORMULÁRIOS DE SERVIÇOS
## DigiUrban - Avaliação de Campos e Relevância

**Data:** 08/11/2024
**Objetivo:** Analisar todos os formulários de serviços para garantir campos específicos, relevantes e completos

---

## 🏥 **SECRETARIA DE SAÚDE**

### ✅ **Serviços BEM ESTRUTURADOS:**

#### 1. Agendamento de Consulta Médica
**Status:** ✅ EXCELENTE
**Campos Relevantes:**
- Cartão SUS ✓
- Especialidade (10 opções) ✓
- Unidade Preferencial ✓
- Data/Turno Preferencial ✓
- Motivo da Consulta ✓
- Primeira Consulta (boolean) ✓
- Urgência com justificativa condicional ✓

**Sugestões de Melhoria:**
- ➕ Adicionar: Histórico de alergias medicamentosas
- ➕ Adicionar: Necessidades especiais (cadeirante, intérprete LIBRAS, etc)
- ➕ Adicionar: Possui convênio particular? (para encaminhamento)

#### 2. Controle de Medicamentos
**Status:** ✅ MUITO BOM
**Campos Relevantes:**
- Cartão SUS ✓
- Número e Data da Receita ✓
- Médico + CRM ✓
- Array de medicamentos com dosagem/quantidade/posologia ✓
- Uso contínuo ✓
- Unidade de retirada ✓

**Sugestões de Melhoria:**
- ➕ Adicionar: Tem dificuldade de locomoção? (para entrega domiciliar)
- ➕ Adicionar: Horário preferencial para retirada
- ➕ Adicionar: Autoriza familiar retirar? (Nome + CPF do responsável)

---

### ⚠️ **Serviços QUE PRECISAM MELHORAR:**

#### 3. Atendimentos - Saúde
**Status:** ⚠️ GENÉRICO DEMAIS
**Problema:** É um registro de atendimento ADMINISTRATIVO, não deve ser serviço para cidadão
**Campos Atuais:**
- Tipo, Unidade, Profissional, Especialidade, Data, Descrição, Diagnóstico, Procedimentos, Prescrições

**Recomendação:**
- ❌ **REMOVER** este serviço do portal do cidadão
- ✅ Manter apenas para uso INTERNO da secretaria
- ✅ Cidadão não deve "solicitar um atendimento genérico", deve agendar consulta específica

#### 4. Campanhas de Vacinação
**Status:** ⚠️ INCOMPLETO
**Campos Faltantes:**
- ➕ Cartão de Vacina (número)
- ➕ Cartão SUS
- ➕ Qual campanha? (COVID, Gripe, Multivacinação)
- ➕ Possui contraindicações? (gestante, imunossuprimido)
- ➕ Já tomou dose anterior desta vacina?
- ➕ Unidade preferencial
- ➕ Data/horário preferencial

---

## 🎓 **SECRETARIA DE EDUCAÇÃO**

### ✅ **Serviços BEM ESTRUTURADOS:**

#### 1. Matrícula de Aluno
**Status:** ✅ BOM
**Campos Atuais:**
- Nome do Aluno, CPF, Data Nascimento, Série/Ano, Escola, Necessidades Especiais

**Sugestões de Melhoria:**
- ➕ Endereço do aluno (para transporte escolar)
- ➕ Nome dos responsáveis (pai e mãe)
- ➕ CPF dos responsáveis
- ➕ Telefone de emergência
- ➕ Possui irmãos na mesma escola? (para turma)
- ➕ Renda familiar (para verificação de programas sociais)
- ➕ Frequentou creche/pré-escola antes?
- ➕ Tipo de certidão (nascimento/RG)
- ➕ Cor/Raça (censo escolar)
- ➕ Tipo sanguíneo
- ➕ Alergias alimentares

---

### ⚠️ **Serviços QUE PRECISAM MELHORAR:**

#### 2. Transporte Escolar
**Status:** ⚠️ INCOMPLETO
**Campos Necessários:**
- ➕ Nome do aluno
- ➕ CPF do aluno
- ➕ Série/Ano
- ➕ Escola
- ➕ Endereço COMPLETO (rua, número, bairro, ponto de referência)
- ➕ Distância até a escola (km)
- ➕ Turno (manhã/tarde)
- ➕ Precisa de monitor? (criança especial)
- ➕ Tem condição de locomoção? (cadeirante)
- ➕ Rota atual que atende (se souber)

#### 3. Atendimentos - Educação
**Status:** ⚠️ GENÉRICO - REMOVER DO PORTAL CIDADÃO
**Recomendação:** Igual ao de Saúde, é administrativo

---

## 🤝 **SECRETARIA DE ASSISTÊNCIA SOCIAL**

### ✅ **Serviços BEM ESTRUTURADOS:**

#### 1. Cadastro Único (CadÚnico)
**Status:** ⚠️ SIMPLIFICADO DEMAIS
**O CadÚnico é COMPLEXO! Precisa de:**

**Dados da Família:**
- ➕ Quantidade de pessoas no domicílio
- ➕ Renda per capita
- ➕ Tipo de domicílio (casa/apartamento/barraco)
- ➕ Material de construção
- ➕ Nº de cômodos
- ➕ Abastecimento de água
- ➕ Esgoto sanitário
- ➕ Energia elétrica
- ➕ Coleta de lixo

**Composição Familiar (array):**
- Nome, CPF, Data Nascimento, Parentesco, Escolaridade, Trabalha?, Renda

**Programas Sociais:**
- ➕ Já recebe Bolsa Família?
- ➕ Já recebe BPC?
- ➕ Tem registro em outro município?

---

## 🌾 **SECRETARIA DE AGRICULTURA**

### ✅ **Cadastro de Produtor Rural** (JÁ ATUALIZADO)
**Status:** ✅ EXCELENTE
**Campos Atuais:**
- Dados do Cidadão (nome, CPF, email, telefone, endereço) ✓
- Tipo de Produtor ✓
- DAP ✓
- Área Total ✓
- Principais Produções ✓

**Sugestões de Melhoria:**
- ➕ Tipo de propriedade (própria, arrendada, parceria, assentamento)
- ➕ Coordenadas GPS da propriedade
- ➕ Possui irrigação?
- ➕ Principais criações (animais)
- ➕ Usa agrotóxicos?
- ➕ Certificação orgânica?
- ➕ Participa de cooperativa? Qual?
- ➕ Comercializa para PAA/PNAE?
- ➕ Possui maquinário? Quais?

---

## 📊 **RESUMO GERAL - PROBLEMAS IDENTIFICADOS:**

### 🚨 **CRÍTICO - Remover do Portal do Cidadão:**
1. ❌ Atendimentos - Saúde
2. ❌ Atendimentos - Educação
3. ❌ Atendimentos - Assistência Social
4. ❌ Atendimentos - Agricultura
5. ❌ Atendimentos - Cultura
6. ❌ Atendimentos - Esportes
7. ❌ Todos os "Gestão de..." (são administrativos)

**Motivo:** São serviços de REGISTRO ADMINISTRATIVO, não solicitações de cidadão

---

### ⚠️ **CAMPOS FALTANTES COMUNS EM TODOS OS SERVIÇOS:**

#### **Bloco 1: Dados Básicos do Cidadão** (já implementado)
- ✅ Nome Completo
- ✅ CPF
- ✅ E-mail
- ✅ Telefone
- ✅ Endereço

#### **Bloco 2: Dados Adicionais Importantes** (FALTAM)
- ➕ Data de Nascimento
- ➕ RG
- ➕ Nome da Mãe
- ➕ Estado Civil
- ➕ Profissão/Ocupação
- ➕ Renda Familiar
- ➕ Possui Deficiência? Qual?

---

## 🎯 **PRÓXIMOS PASSOS RECOMENDADOS:**

### **Fase 1: Limpeza (URGENTE)**
1. Remover serviços "Atendimentos - X" do portal do cidadão
2. Remover serviços "Gestão de X" do portal do cidadão
3. Manter apenas no painel administrativo

### **Fase 2: Enriquecimento de Campos**
1. Adicionar campos específicos relevantes por serviço
2. Adicionar validações condicionais
3. Adicionar campos de dados complementares do cidadão

### **Fase 3: Agrupamento Inteligente**
1. Agrupar serviços similares
2. Criar fluxos com etapas
3. Pré-requisitos entre serviços

---

## 📝 **TEMPLATE DE CAMPOS POR TIPO DE SERVIÇO:**

### **A) Serviços de SAÚDE:**
```typescript
{
  // Dados do Cidadão (pré-preenchidos)
  nome, cpf, email, telefone, endereco, dataNascimento,

  // Dados de Saúde
  cartaoSUS: string (15 dígitos),
  alergias: string[],
  condicoesPreExistentes: string[],
  medicamentosEmUso: string[],
  necessidadesEspeciais: string,

  // Dados do Serviço Específico
  ...
}
```

### **B) Serviços de EDUCAÇÃO:**
```typescript
{
  // Dados do Responsável (pré-preenchidos)
  nomeResponsavel, cpfResponsavel, email, telefone, endereco,

  // Dados do Aluno
  nomeAluno: string,
  cpfAluno: string,
  dataNascimentoAluno: date,
  certidaoNascimento: string,
  corRaca: enum,
  tipoSanguineo: string,
  necessidadesEspeciais: string,
  alergiasAlimentares: string[],

  // Dados da Família
  rendaFamiliar: number,
  composicaoFamiliar: number,
  nomeMae: string,
  nomePai: string,

  // Dados do Serviço Específico
  ...
}
```

### **C) Serviços de ASSISTÊNCIA SOCIAL:**
```typescript
{
  // Dados do Cidadão (pré-preenchidos)
  nome, cpf, email, telefone, endereco, dataNascimento,

  // Dados Socioeconômicos
  rendaFamiliar: number,
  rendaPerCapita: number,
  quantidadePessoas: number,
  tipoDomicilio: enum,
  possuiAguaEncanada: boolean,
  possuiEsgoto: boolean,
  possuiEnergiaEletrica: boolean,

  // Programas Sociais Atuais
  recebeBolsaFamilia: boolean,
  recebeBPC: boolean,
  outrosBeneficios: string[],

  // Dados do Serviço Específico
  ...
}
```

---

## ✅ **CONCLUSÃO:**

Os formulários atuais têm uma **boa base**, mas precisam de:

1. **Limpeza:** Remover serviços administrativos (15-20 serviços)
2. **Enriquecimento:** Adicionar campos específicos relevantes
3. **Padronização:** Blocos comuns de dados em todos os serviços
4. **Validações:** Campos condicionais e dependências
5. **Experiência:** Melhor organização visual dos formulários

**Impacto Esperado:**
- ✅ Formulários mais completos e profissionais
- ✅ Menos retrabalho (coleta de dados completa)
- ✅ Melhor atendimento (informações relevantes)
- ✅ Portal mais limpo (menos serviços desnecessários)
