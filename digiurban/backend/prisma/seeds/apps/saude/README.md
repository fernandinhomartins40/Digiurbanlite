# Seeds dos Apps de Saúde

Seeds completos e realistas para os Apps de Saúde integrados ao **Sistema Unificado de Vinculações V2.0**.

## 📋 Visão Geral

Este conjunto de seeds cria um ambiente completo e realista para testes do módulo de Saúde, incluindo:

- ✅ **12 Unidades de Saúde** com estrutura organizacional completa
- ✅ **25 Servidores** com dados profissionais detalhados
- ✅ **35+ Vínculos Funcionais** com múltiplos cenários
- ✅ **8 Equipes de Saúde** (ESF, NASF, CAPS, UPA)
- ✅ **30+ Especialidades Médicas** catalogadas
- ✅ **90+ Códigos CBO** reais do Ministério do Trabalho
- ✅ **40+ Salas de Consultório** distribuídas nas unidades
- ✅ **5 Turnos de Trabalho** configuráveis
- ✅ **Configurações de Agenda** para múltiplos profissionais

## 🏗️ Estrutura dos Seeds

```
📁 seeds/apps/saude/
├── 01-unidades-saude-completas.seed.ts   ← Unidades + Estrutura Organizacional
├── 02-servidores-saude.seed.ts           ← Users + HealthProfessionalData
├── 03-vinculos-profissionais.seed.ts     ← Positions + EmployeeAssignments
├── 04-equipes-saude.seed.ts              ← Teams + EquipeSaude + Members
├── 05-especialidades-cbo.seed.ts         ← Catálogos de Referência
├── 06-agendas-turnos.seed.ts             ← Salas + Turnos + Agendas
├── master-seed-saude.ts                  ← Executa todos na ordem
└── README.md                             ← Esta documentação
```

## 🚀 Como Usar

### Opção 1: Executar Todos os Seeds (Recomendado)

```bash
cd digiurban/backend
npx tsx prisma/seeds/apps/saude/master-seed-saude.ts
```

### Opção 2: Executar Seeds Individualmente

```bash
# Executar na ordem correta:
npx tsx prisma/seeds/apps/saude/01-unidades-saude-completas.seed.ts
npx tsx prisma/seeds/apps/saude/02-servidores-saude.seed.ts
npx tsx prisma/seeds/apps/saude/03-vinculos-profissionais.seed.ts
npx tsx prisma/seeds/apps/saude/04-equipes-saude.seed.ts
npx tsx prisma/seeds/apps/saude/05-especialidades-cbo.seed.ts
npx tsx prisma/seeds/apps/saude/06-agendas-turnos.seed.ts
```

## 📊 Detalhamento dos Seeds

### 01. Unidades de Saúde Completas

Cria **12 unidades de saúde** com vinculação ao Sistema Unificado:

#### Estrutura Organizacional (3 níveis):
```
Secretaria Municipal de Saúde (SMS)
├─ Diretoria de Atenção Básica (DAB)
│  ├─ UBS Central Dr. José Silva
│  ├─ UBS Norte Maria Santos
│  ├─ UBS Sul Vila Esperança
│  ├─ UBS Vila Nova Ana Costa
│  ├─ ESF Jardim Esperança
│  ├─ ESF Parque das Flores
│  └─ Policlínica Municipal
├─ Diretoria de Urgência e Emergência (DUE)
│  ├─ UPA 24h Centro
│  ├─ UPA 24h Norte
│  └─ Hospital Municipal São João
└─ Diretoria de Saúde Mental (DSM)
   ├─ CAPS Centro
   └─ Centro Especializado em Reabilitação
```

**Cada unidade possui:**
- CNES (Cadastro Nacional de Estabelecimentos de Saúde)
- CNPJ
- Endereço completo
- Horários de funcionamento
- Especialidades disponíveis
- Vínculo com `OrganizationalUnit` do sistema unificado

### 02. Servidores de Saúde

Cria **25 servidores** com dados completos:

#### Distribuição por Categoria:
- **8 Médicos:**
  - Dr. João Pedro Silva (Clínico Geral)
  - Dra. Maria Santos Costa (Pediatra)
  - Dr. Carlos Eduardo Oliveira (Ginecologista)
  - Dr. Ricardo Almeida Ferreira (Cardiologista)
  - Dra. Ana Paula Rodrigues (Psiquiatra)
  - Dr. Fernando Lima Souza (Ortopedista)
  - Dra. Juliana Mendes Barbosa (Dermatologista)
  - Dr. Roberto Castro Nunes (Neurologista)

- **6 Enfermeiros:**
  - Enf. Patrícia Lima Santos
  - Enf. Marcos Vieira Lopes
  - Enf. Camila Ferreira Costa
  - Enf. Rafael Souza Martins
  - Enf. Luciana Alves Pereira
  - Enf. André Oliveira Silva

- **4 Técnicos de Enfermagem**
- **3 Dentistas**
- **2 Psicólogos**
- **2 Agentes Comunitários de Saúde (ACS)**

**Cada servidor possui:**
- `User` completo (CPF, RG, endereço, telefone, etc.)
- `HealthProfessionalData` com:
  - Categoria profissional
  - Registro profissional (CRM, COREN, CRO, CRP) **único e realista**
  - CNS (Cartão Nacional de Saúde) - 15 dígitos
  - CBO (Classificação Brasileira de Ocupações) - código real
  - Especialidades
  - Configurações de atendimento

### 03. Vínculos Profissionais

Cria **35+ vínculos** com cenários realistas:

#### Cenários Implementados:
- ✅ Vínculo simples (40h em uma unidade)
- ✅ Múltiplos vínculos (30h + 10h)
- ✅ Vínculos primários e secundários
- ✅ Cargas horárias variadas (20h, 30h, 40h)
- ✅ Diferentes situações (ATIVO, AFASTADO, LICENÇA)

**Cada vínculo cria:**
- `Position` (cargo no sistema unificado)
- `EmployeeAssignment` (vínculo servidor ↔ cargo ↔ unidade)
- `AssignmentAudit` (registro de auditoria completo)

#### Exemplos de Vínculos:
```
Dr. João Pedro Silva
└─ [PRIMÁRIO] UBS Central - 40h (100%) - Clínico Geral

Dr. Carlos Eduardo Oliveira
├─ [PRIMÁRIO] UBS Central - 30h (75%) - Ginecologista
└─ [SECUNDÁRIO] Policlínica - 10h (25%) - Ginecologista

Enf. Camila Ferreira Costa
├─ [PRIMÁRIO] UBS Norte - 30h (75%) - Enfermeira
└─ [SECUNDÁRIO] UBS Sul - 10h (25%) - Apoio matricial
```

### 04. Equipes de Saúde

Cria **8 equipes** integradas ao sistema unificado:

#### Equipes Criadas:
- **4 Equipes ESF** (Estratégia Saúde da Família)
  - ESF 01 - Jardim Esperança (INE: 0001234567)
  - ESF 02 - Parque das Flores (INE: 0002345678)
  - ESF 03 - UBS Central (INE: 0003456789)
  - ESF 04 - UBS Norte (INE: 0004567890)

- **2 Equipes NASF** (Núcleo de Apoio)
  - NASF 01 (INE: 0005678901)
  - NASF 02 (INE: 0006789012)

- **1 Equipe CAPS** (Saúde Mental)
  - Equipe CAPS Centro (INE: 0007890123)

- **1 Equipe UPA** (Urgência e Emergência)
  - Equipe UPA Centro (INE: 0008901234)

**Para cada equipe cria:**
- `EquipeSaude` (app-specific) com INE real
- `Team` (sistema unificado)
- `TeamMember` (membros no sistema unificado)
- `ProfissionalEquipe` (vínculo legado)
- `Microarea` (para equipes ESF)

#### Composição Típica de Equipe ESF:
- 1 Médico (coordenador)
- 1 Enfermeiro
- 1 Técnico de Enfermagem
- 1 Dentista
- 1+ Agentes Comunitários de Saúde

### 05. Especialidades e CBOs

Cataloga dados de referência realistas:

#### Especialidades Médicas (30):
- **Atenção Básica:** Clínica Geral, Medicina de Família, Pediatria, Ginecologia
- **Especialidades Clínicas:** Cardiologia, Endocrinologia, Neurologia, Dermatologia, Psiquiatria, etc.
- **Especialidades Cirúrgicas:** Cirurgia Geral, Ortopedia, Urologia, Oftalmologia, etc.
- **Odontologia:** Geral, Endodontia, Periodontia, Ortodontia
- **Outras:** Enfermagem, Psicologia

#### Códigos CBO (90+):
Códigos **reais** da Classificação Brasileira de Ocupações:

**Médicos:**
- 225100 - Médico Clínico
- 225103 - Médico de Família e Comunidade
- 225142 - Médico Pediatra
- 225260 - Médico Ginecologista
- 225118 - Médico Cardiologista
- 225330 - Médico Psiquiatra
- ... e muitos outros

**Enfermagem:**
- 223565 - Enfermeiro
- 322205 - Técnico de Enfermagem

**Odontologia:**
- 223293 - Cirurgião-Dentista

**Outros:**
- 251510 - Psicólogo Clínico
- 515105 - Agente Comunitário de Saúde

#### Mapeamento Especialidade → CBO:
Relaciona cada especialidade com seus CBOs correspondentes.

### 06. Agendas e Turnos

Configura estrutura completa de agendamento:

#### Salas de Consultório (40+):
- **UBS Central:** 7 salas (consultórios, enfermagem, vacina, curativos, odontologia)
- **UBS Norte:** 5 salas
- **UPA Centro:** 7 salas (triagem, consultórios, procedimentos)
- **CAPS Centro:** 5 salas (psiquiatria, psicologia, enfermagem)
- **Policlínica:** 6 salas especializadas

**Cada sala possui:**
- Tipo (consultório, enfermagem, vacina, etc.)
- Número identificador
- Andar
- Equipamentos disponíveis

#### Turnos de Trabalho (5):
- **Manhã:** 07:00 - 13:00 (Verde)
- **Tarde:** 13:00 - 19:00 (Amarelo)
- **Noite:** 19:00 - 23:00 (Roxo)
- **Integral:** 07:00 - 19:00 (Roxo claro)
- **Plantão 24h:** 00:00 - 23:59 (Vermelho)

#### Configurações de Atendimento:
Por unidade, define:
- Prefixo de senha (A, B, U, P, E)
- Horários de funcionamento
- Obrigatoriedade de triagem
- Permissão de agendamento online
- Limite de dias para agendamento

#### Configurações de Agenda:
Por profissional, define:
- Dias da semana que atende
- Turnos (manhã, tarde, noite)
- Horários específicos
- Duração de consulta (20-50 minutos)
- Vagas totais
- Permissão de agendamento online

**Exemplos:**
```
Dr. João - UBS Central
├─ Segunda: 08:00-12:00 (8 vagas, online)
├─ Terça: 08:00-12:00 (8 vagas, online)
├─ Quarta: 14:00-18:00 (8 vagas, online)
├─ Quinta: 08:00-12:00 (8 vagas, online)
└─ Sexta: 14:00-18:00 (8 vagas, online)

Dra. Ana - CAPS Centro
├─ Segunda: 08:00-12:00 (4 vagas, 50min cada)
├─ Segunda: 14:00-18:00 (4 vagas, 50min cada)
├─ Quarta: 08:00-12:00 (4 vagas, 50min cada)
└─ ... (não permite agendamento online)
```

## 🔗 Integração com Sistema Unificado V2.0

Todos os seeds estão **100% integrados** ao Sistema Unificado:

### Relacionamentos Criados:

```
User (Servidor)
├─ HealthProfessionalData (dados profissionais)
├─ EmployeeAssignment (vínculos funcionais)
│  ├─ Position (cargo)
│  ├─ OrganizationalUnit (unidade organizacional)
│  │  └─ UnidadeSaude (unidade de saúde app-specific)
│  └─ AssignmentAudit (auditoria)
├─ TeamMember (membro de equipe no sistema unificado)
│  └─ Team (equipe unificada)
│     └─ EquipeSaude (equipe app-specific)
└─ ConfiguracaoAgenda (agenda de atendimento)
```

### Fluxo de Dados:

1. **Estrutura Organizacional:**
   ```
   Department (Saúde)
   └─ OrganizationalUnit (Secretaria)
      └─ OrganizationalUnit (Diretoria)
         └─ OrganizationalUnit (Unidade)
            └─ UnidadeSaude (app-specific)
   ```

2. **Vínculo Profissional:**
   ```
   User + HealthProfessionalData
   → EmployeeAssignment
     → Position (cargo)
     → OrganizationalUnit (unidade)
     → AssignmentAudit (auditoria)
   ```

3. **Formação de Equipe:**
   ```
   Team (sistema unificado)
   ├─ TeamMember (membros)
   │  └─ User (servidores)
   └─ EquipeSaude (app-specific)
      ├─ ProfissionalEquipe (legado)
      └─ Microarea (territorialização)
   ```

## ✅ Características dos Seeds

### Idempotência
- ✅ Podem ser executados múltiplas vezes sem duplicar dados
- ✅ Usam `upsert` e `unique constraints` para evitar conflitos

### Realismo
- ✅ Dados baseados no SUS brasileiro
- ✅ CBOs reais do Ministério do Trabalho
- ✅ INEs fictícios mas com formato correto (10 dígitos)
- ✅ CNES e CNPJ fictícios mas realistas
- ✅ Endereços e telefones no formato correto

### Consistência
- ✅ Relacionamentos íntegros entre todas as tabelas
- ✅ Hierarquia organizacional correta
- ✅ Vínculos com auditoria completa
- ✅ Equipes com composição adequada

### Testabilidade
- ✅ Cenários diversos para testes (múltiplos vínculos, equipes, agendas)
- ✅ Dados suficientes para testes end-to-end
- ✅ Cobertura de todos os tipos de unidades (UBS, ESF, UPA, Hospital, CAPS)

## 🔑 Credenciais de Teste

**Email:** `[nome]@saude.sp.gov.br`
**Senha:** `senha123`

### Exemplos:
- `joao.silva@saude.sp.gov.br` - Médico Clínico Geral
- `maria.costa@saude.sp.gov.br` - Médica Pediatra
- `carlos.oliveira@saude.sp.gov.br` - Médico Ginecologista (2 vínculos)
- `ana.rodrigues@saude.sp.gov.br` - Médica Psiquiatra (CAPS)
- `patricia.santos@saude.sp.gov.br` - Enfermeira
- `josefa.silva@saude.sp.gov.br` - Agente Comunitária de Saúde

## 📈 Estatísticas

### Dados Criados:
- 📊 **OrganizationalUnit:** 16 (1 secretaria + 3 diretorias + 12 unidades)
- 🏥 **UnidadeSaude:** 12 unidades
- 👥 **User:** 25 servidores
- 💼 **HealthProfessionalData:** 25 registros
- 🔗 **EmployeeAssignment:** 35+ vínculos
- 📋 **Position:** 13 cargos
- 📝 **AssignmentAudit:** 35+ registros
- 👨‍👩‍👧‍👦 **Team:** 8 equipes
- 🤝 **TeamMember:** 30+ membros
- 🏥 **EquipeSaude:** 8 equipes
- 👔 **ProfissionalEquipe:** 30+ vínculos
- 🏢 **SalaConsultorio:** 40+ salas
- ⏰ **TurnoTrabalho:** 5 turnos
- ⚙️ **ConfiguracaoAtendimento:** 5 configurações
- 📅 **ConfiguracaoAgenda:** 25+ agendas

### Total Aproximado: **280+ registros** criados

## 🧪 Casos de Teste Cobertos

### Vínculos:
- ✅ Vínculo simples (1 servidor, 1 cargo, 1 unidade)
- ✅ Múltiplos vínculos (1 servidor, múltiplos cargos/unidades)
- ✅ Vínculo primário + secundário
- ✅ Diferentes cargas horárias (20h, 30h, 40h)
- ✅ Auditoria completa de vínculos

### Equipes:
- ✅ Equipe ESF completa (médico, enfermeiro, dentista, ACS)
- ✅ Equipe NASF (apoio matricial)
- ✅ Equipe CAPS (saúde mental)
- ✅ Equipe UPA (urgência)
- ✅ Microáreas para ESF

### Agendamento:
- ✅ Múltiplos profissionais com agendas
- ✅ Diferentes turnos (manhã, tarde, integral)
- ✅ Diferentes durações de consulta (20-50 minutos)
- ✅ Agendamento online vs presencial
- ✅ Configurações por unidade

### Hierarquia:
- ✅ Secretaria → Diretoria → Unidade (3 níveis)
- ✅ Vinculação OrganizationalUnit ↔ UnidadeSaude
- ✅ Vinculação Team ↔ EquipeSaude

## 🐛 Troubleshooting

### Erro: "Departamento de Saúde não encontrado"
**Solução:** Execute o seed do sistema unificado primeiro:
```bash
npx tsx prisma/seeds/unified-system.seed.ts
```

### Erro: "Duplicate key violation"
**Solução:** Os seeds são idempotentes, mas se houver conflito, limpe os dados:
```bash
# CUIDADO: Isso vai apagar TODOS os dados
npx prisma migrate reset
```

### Erro: "User not found"
**Solução:** Execute os seeds na ordem correta (use o master-seed).

## 📚 Referências

- [Sistema Unificado de Vinculações V2.0](../../../SISTEMA_UNIFICADO_VINCULACAO.md)
- [Implementação Saúde Unificado](../../../IMPLEMENTACAO_SAUDE_UNIFICADO_COMPLETA.md)
- [Códigos CBO - Ministério do Trabalho](http://www.mtecbo.gov.br/)
- [CNES - Cadastro Nacional de Estabelecimentos de Saúde](http://cnes.datasus.gov.br/)
- [e-SUS Atenção Básica](https://sisaps.saude.gov.br/esus/)

---

**Desenvolvido com** ❤️ **para testes realistas do DigiUrban**

**Data:** Fevereiro/2026
**Versão:** 1.0.0
**Status:** ✅ 100% Completo
