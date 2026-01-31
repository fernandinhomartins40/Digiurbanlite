# 🏥 PROPOSTA DE CORREÇÃO - FLUXO DE ATENDIMENTO SUS/ESF

## 📊 RESUMO EXECUTIVO

### Problema Identificado
O sistema atual não reflete corretamente o funcionamento das **Equipes de Saúde da Família (ESF)**, onde:
- Cidadãos são vinculados a **EQUIPES**, não a profissionais individuais
- **Acolhimento/Escuta Inicial** é obrigatório e define o fluxo
- **Triagem** é opcional, só para casos que necessitam priorização
- **Enfermeiro da ESF** tem papel central na coordenação do cuidado

---

## 🔴 ERROS CRÍTICOS ATUAIS

### 1. Adicionar à Fila - Seleção de Profissional Individual
**CÓDIGO ATUAL (ERRADO)**:
```typescript
// digiurban/frontend/app/admin/apps/saude/atendimento/adicionar/page.tsx
const [formData, setFormData] = useState({
  profissionalId: '',  // ❌ ERRADO: recepção escolhe médico/enfermeiro
  tipoAtendimento: 'DEMANDA_ESPONTANEA',
  motivoChegada: '',
});
```

**PROBLEMA**:
- Na ESF, **recepção NÃO escolhe profissional**
- Recepção identifica a **EQUIPE** do cidadão (território/microárea)
- Quem define se vai para enfermeiro ou médico é o **ACOLHIMENTO**

**CORREÇÃO**:
```typescript
const [formData, setFormData] = useState({
  equipeId: '',        // ✅ CORRETO: equipe responsável
  tipoAtendimento: 'DEMANDA_ESPONTANEA',
  motivoBusca: '',     // ✅ Nomenclatura PEC e-SUS
  acompanhante: '',
});
```

---

### 2. Falta Vinculação Cidadão-Equipe

**PROBLEMA**:
- Cidadão não possui vínculo cadastrado com equipe ESF
- Sem ACS responsável
- Sem microárea definida

**CORREÇÃO NO SCHEMA**:
```prisma
model Citizen {
  // ... campos existentes

  // ✅ NOVO: Vinculação ESF
  equipeVinculadaId String?
  equipeVinculada   EquipeSaude? @relation("CidadaoEquipe", fields: [equipeVinculadaId], references: [id])

  microareaId      String?
  microarea        Microarea?   @relation(fields: [microareaId], references: [id])

  acsResponsavelId String?
  acsResponsavel   User?        @relation("CidadaoACS", fields: [acsResponsavelId], references: [id])
}

model Microarea {
  id             String   @id @default(cuid())
  codigo         String   // Ex: "01", "02"
  descricao      String?  // Ex: "Bairro Centro - Quadra A"
  equipeId       String
  equipe         EquipeSaude @relation(fields: [equipeId], references: [id])

  acsResponsavel User     @relation("ACSMicroarea", fields: [acsId], references: [id])
  acsId          String

  cidadaos       Citizen[]

  @@unique([equipeId, codigo])
  @@map("microareas")
}
```

---

### 3. Status "EM_ESCUTA_INICIAL" vs "EM_TRIAGEM" - Confusão

**PROBLEMA**:
- Sistema trata ambos como obrigatórios
- Na prática, **Acolhimento é SEMPRE obrigatório**
- **Triagem é OPCIONAL** (só casos urgentes/complexos)

**FLUXO CORRETO**:
```
AGUARDANDO
  ↓
EM_ACOLHIMENTO (SEMPRE - define próximo passo)
  ↓
├─→ RESOLVIDO_ACOLHIMENTO (orientação bastou)
├─→ EM_PROCEDIMENTO (curativo, inalação, etc.)
├─→ AGENDADO (consulta futura)
├─→ [OPCIONAL] EM_TRIAGEM → AGUARDANDO_ATENDIMENTO
└─→ AGUARDANDO_ATENDIMENTO (enfermeiro ou médico)
  ↓
EM_ATENDIMENTO (enfermeiro ou médico)
  ↓
FINALIZADO
```

**NOVO ENUM StatusFila**:
```prisma
enum StatusFila {
  AGUARDANDO              // Chegou, está na fila
  EM_ACOLHIMENTO          // Acolhimento/Escuta Inicial
  RESOLVIDO_ACOLHIMENTO   // Resolvido com orientação
  EM_PROCEDIMENTO         // Curativo, inalação, etc.
  AGENDADO                // Marcou consulta futura
  EM_TRIAGEM              // [Opcional] Triagem enfermagem
  AGUARDANDO_ATENDIMENTO  // Após acolhimento/triagem
  EM_ATENDIMENTO          // Consulta médica/enfermagem
  FINALIZADO              // Concluído
  NAO_AGUARDOU            // Saiu antes de ser atendido
  ENCAMINHADO_EXTERNO     // UPA, especialista
}
```

---

## ✅ PROPOSTA DE IMPLEMENTAÇÃO

### FASE 1: Corrigir Vinculação Equipe-Cidadão

#### 1.1. Migração do Banco de Dados
```sql
-- Adicionar campos de vinculação ESF ao Citizen
ALTER TABLE "citizens" ADD COLUMN "equipeVinculadaId" TEXT;
ALTER TABLE "citizens" ADD COLUMN "microareaId" TEXT;
ALTER TABLE "citizens" ADD COLUMN "acsResponsavelId" TEXT;

-- Criar tabela Microarea
CREATE TABLE "microareas" (
  "id" TEXT PRIMARY KEY,
  "codigo" TEXT NOT NULL,
  "descricao" TEXT,
  "equipeId" TEXT NOT NULL REFERENCES "equipe_saude"("id"),
  "acsId" TEXT NOT NULL REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX "microareas_equipe_codigo_unique" ON "microareas"("equipeId", "codigo");

-- Foreign keys
ALTER TABLE "citizens"
  ADD CONSTRAINT "fk_citizen_equipe"
  FOREIGN KEY ("equipeVinculadaId") REFERENCES "equipe_saude"("id");

ALTER TABLE "citizens"
  ADD CONSTRAINT "fk_citizen_microarea"
  FOREIGN KEY ("microareaId") REFERENCES "microareas"("id");

ALTER TABLE "citizens"
  ADD CONSTRAINT "fk_citizen_acs"
  FOREIGN KEY ("acsResponsavelId") REFERENCES "users"("id");
```

#### 1.2. Interface de Vinculação no Cadastro do Cidadão
- Adicionar seção "Vinculação ESF" no formulário de cidadão
- Campos:
  - **Unidade de Saúde** (CNES)
  - **Equipe** (INE - filtrada por unidade)
  - **Microárea** (filtrada por equipe)
  - **ACS Responsável** (auto-preenchido da microárea)

---

### FASE 2: Refatorar "Adicionar à Lista"

#### 2.1. Nova Lógica de Recepção

**Arquivo**: `digiurban/frontend/app/admin/apps/saude/atendimento/adicionar/page.tsx`

**ANTES**:
```typescript
<Label>Profissional *</Label>
<Select value={formData.profissionalId} ...>
  {profissionais.map(prof => ...)}
</Select>
```

**DEPOIS**:
```typescript
// Auto-detectar equipe do cidadão
useEffect(() => {
  if (selectedCidadao?.equipeVinculada) {
    setFormData(prev => ({
      ...prev,
      equipeId: selectedCidadao.equipeVinculada.id
    }));
  } else {
    // Alerta: cidadão sem equipe vinculada
    setAviso('Cidadão não possui equipe vinculada. Configure no cadastro.');
  }
}, [selectedCidadao]);

<div>
  <Label>Equipe ESF *</Label>
  <Input
    value={selectedCidadao?.equipeVinculada?.nome || 'Não vinculado'}
    disabled
  />
  <p className="text-xs text-muted-foreground">
    Equipe identificada pelo território do cidadão
  </p>
</div>

<div>
  <Label>ACS Responsável</Label>
  <Input
    value={selectedCidadao?.acsResponsavel?.name || '-'}
    disabled
  />
</div>
```

#### 2.2. Payload da API Corrigido
```typescript
const response = await fetch('/api/saude/fila-atendimento', {
  method: 'POST',
  body: JSON.stringify({
    citizenId: selectedCidadao.id,
    unidadeId: unidadeSelecionada.id,
    equipeId: selectedCidadao.equipeVinculada?.id,  // ✅ Equipe, não profissional
    tipoAtendimento: formData.tipoAtendimento,
    motivoBusca: formData.motivoChegada,
    vacinacao: formData.tipoAtendimento === 'VACINA',
  }),
});
```

---

### FASE 3: Implementar Tela de Acolhimento

#### 3.1. Nova Rota
`/admin/apps/saude/atendimento/[id]/acolhimento/page.tsx`

#### 3.2. Formulário de Acolhimento

**Campos**:
```typescript
{
  // Subjetivo
  motivoBusca: string,          // Já preenchido da recepção
  historiaBreve: string,         // O que o cidadão relata
  tempoEvolucao: string,         // "Há 3 dias", "Desde ontem"

  // Objetivo (opcional)
  pressaoArterial: string,       // Se necessário
  temperatura: number,
  observacoesVisuais: string,

  // Classificação
  riscoVulnerabilidade: 'BAIXO' | 'MEDIO' | 'ALTO',

  // Conduta (DECISÃO CRÍTICA)
  conduta: 'RESOLVER_AQUI' | 'ENFERMEIRO' | 'MEDICO' | 'PROCEDIMENTO' | 'AGENDAR' | 'UPA',
  orientacoesFornecidas: string,
  encaminharPara: string,        // Se conduta = ENFERMEIRO ou MEDICO
  agendamento: Date,             // Se conduta = AGENDAR
}
```

#### 3.3. Lógica de Fluxo
```typescript
const handleSubmitAcolhimento = async (data) => {
  let novoStatus: StatusFila;

  switch (data.conduta) {
    case 'RESOLVER_AQUI':
      novoStatus = 'RESOLVIDO_ACOLHIMENTO';
      break;
    case 'PROCEDIMENTO':
      novoStatus = 'EM_PROCEDIMENTO';
      break;
    case 'AGENDAR':
      novoStatus = 'AGENDADO';
      // Criar agendamento
      break;
    case 'ENFERMEIRO':
    case 'MEDICO':
      // Se caso complexo/urgente, pode passar por triagem
      const precisaTriagem = data.riscoVulnerabilidade === 'ALTO';
      novoStatus = precisaTriagem ? 'EM_TRIAGEM' : 'AGUARDANDO_ATENDIMENTO';
      break;
    case 'UPA':
      novoStatus = 'ENCAMINHADO_EXTERNO';
      break;
  }

  await fetch(`/api/saude/fila-atendimento/${filaId}/acolhimento`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      novoStatus,
      profissionalAcolhimentoId: user.id,
    }),
  });
};
```

---

### FASE 4: Melhorar Triagem (Opcional mas Recomendada)

#### 4.1. Gatilho para Triagem
Apenas quando:
- Acolhimento identificou **risco alto**
- Demanda espontânea com **sinais de urgência**
- Profissional do acolhimento solicita avaliação enfermeiro

#### 4.2. Protocolo Manchester Simplificado
```typescript
const classificarRisco = (sinaisVitais, queixas) => {
  // Vermelho - Emergência
  if (
    sinaisVitais.pa > '180/120' ||
    sinaisVitais.saturacao < 90 ||
    queixas.includes('dor torácica intensa')
  ) {
    return { cor: 'VERMELHO', tempoMax: 0 };
  }

  // Laranja - Muito Urgente
  if (sinaisVitais.temperatura > 39 || sinaisVitais.pa > '160/100') {
    return { cor: 'LARANJA', tempoMax: 10 };
  }

  // ... demais cores
};
```

---

### FASE 5: Atualizar Lista de Atendimentos

#### 5.1. Agrupar por Equipe
```typescript
// Organizar atendimentos por equipe
const atendimentosPorEquipe = atendimentos.reduce((acc, atend) => {
  const equipeId = atend.equipe?.id || 'SEM_EQUIPE';
  if (!acc[equipeId]) {
    acc[equipeId] = {
      equipe: atend.equipe,
      atendimentos: [],
    };
  }
  acc[equipeId].atendimentos.push(atend);
  return acc;
}, {});
```

#### 5.2. Cores por Status Atualizado
```typescript
const getStatusConfig = (status: StatusFila) => {
  const configs = {
    AGUARDANDO: { cor: 'bg-gray-100', label: 'Aguardando Acolhimento', icon: Clock },
    EM_ACOLHIMENTO: { cor: 'bg-blue-100', label: 'Em Acolhimento', icon: Activity },
    EM_TRIAGEM: { cor: 'bg-yellow-100', label: 'Em Triagem', icon: Stethoscope },
    AGUARDANDO_ATENDIMENTO: { cor: 'bg-green-100', label: 'Aguardando Consulta', icon: Users },
    EM_ATENDIMENTO: { cor: 'bg-purple-100', label: 'Em Atendimento', icon: Stethoscope },
    RESOLVIDO_ACOLHIMENTO: { cor: 'bg-green-200', label: 'Resolvido', icon: CheckCircle },
    // ... demais status
  };
  return configs[status];
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Adicionar campos vinculação ESF ao modelo Citizen
- [ ] Criar modelo Microarea
- [ ] Criar migração SQL
- [ ] Atualizar enum StatusFila com novos status
- [ ] Criar tabela AcolhimentoEnfermagem (equivalente a TriagemEnfermagem)
- [ ] Atualizar API `/api/saude/fila-atendimento` para aceitar equipeId
- [ ] Criar API `/api/saude/fila-atendimento/[id]/acolhimento`
- [ ] Atualizar lógica de transição de status

### Frontend
- [ ] Adicionar seção "Vinculação ESF" no cadastro de cidadão
- [ ] Criar página de gerenciamento de microáreas
- [ ] Refatorar página "Adicionar à Lista" (remover seleção de profissional)
- [ ] Criar página "Acolhimento/Escuta Inicial"
- [ ] Atualizar cores e labels da Lista de Atendimentos
- [ ] Adicionar filtro por equipe na Lista
- [ ] Implementar painel por equipe (cada equipe vê sua fila)

### Testes
- [ ] Testar fluxo completo: Recepção → Acolhimento → Atendimento
- [ ] Validar que cidadão sem equipe não pode ser adicionado
- [ ] Testar diferentes condutas do acolhimento
- [ ] Verificar atualização de status em tempo real

---

## 🎯 IMPACTO ESPERADO

### Antes (Incorreto)
❌ Recepção escolhe médico ou enfermeiro individual
❌ Cidadão não tem vínculo com equipe/território
❌ Fluxo de acolhimento ignorado ou confuso
❌ Triagem obrigatória sempre

### Depois (Correto - Alinhado SUS/ESF)
✅ Recepção identifica equipe por território
✅ Cidadão vinculado a equipe, ACS, microárea
✅ Acolhimento decide fluxo (enfermeiro/médico/resolver)
✅ Triagem opcional, só quando necessário
✅ Enfermeiro como coordenador do cuidado
✅ 100% alinhado com PEC e-SUS APS

---

## 📚 FONTES

- [Protocolo de Manchester - Hospital São Camilo](https://hospitalsaocamilosp.org.br/entenda-as-cores-de-classificacao-no-protocolo-de-manchester/)
- [Acolhimento e Triagem - COREN-SP](https://portal.coren-sp.gov.br/wp-content/uploads/2022/09/PARECER_023_2022_Acolhimento_Triagem_Classificacao_Risco_AB.pdf)
- [Manual PEC e-SUS APS](https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/)
- [Guia de Atendimento - Ribeirão Preto](https://www.ribeiraopreto.sp.gov.br/portal/pdf/saude1288202307.pdf)
- [Fluxo Atendimento UBS - UFMG](https://www.nescon.medicina.ufmg.br/biblioteca/imagem/fluxo-atendimento-interno-externo-ubs.pdf)

---

**Documento criado em:** 31/01/2026
**Baseado em:** Pesquisa web 2025 + Manual PEC e-SUS + Análise do código DigiUrban
