# 🏥 PROPOSTA REALISTA - FLUXO SUS COMPATÍVEL COM UBS E UPA

## 📊 ANÁLISE DA SITUAÇÃO ATUAL

### ✅ O QUE JÁ EXISTE (Implementado)
- **Backend**: Modelos Prisma completos (EquipeSaude, Microarea, FilaAtendimento, EscutaInicial, TriagemEnfermagem)
- **Frontend**: Cadastros de Unidades, Profissionais, Especialidades, Salas, Turnos, Agendas
- **Vínculos**: Profissional-Unidade e Profissional-Especialidade (recém implementado)

### ❌ O QUE FALTA (Crítico para ESF)
- **Interface de Gerenciamento de Equipes ESF**
- **Interface de Gerenciamento de Microáreas**
- **Interface de Gerenciamento de ACS**
- **Fluxo completo de Atendimento** (APIs e UIs)

---

## 🎯 ESTRATÉGIA: IMPLEMENTAÇÃO PROGRESSIVA

### Fase 1: **SOLUÇÃO MÍNIMA VIÁVEL (UPA)**
**Objetivo**: Funcionar 100% em UPA (sem ESF/territorialização)

### Fase 2: **EVOLUÇÃO PARA UBS SEM ESF**
**Objetivo**: UBS tradicionais (sem equipes/território)

### Fase 3: **IMPLEMENTAÇÃO COMPLETA ESF**
**Objetivo**: UBS com ESF, microáreas e ACS

---

## 🚀 FASE 1: UPA - SOLUÇÃO IMEDIATA (2-3 dias)

### Características da UPA
- ❌ Sem ESF (não tem equipes/território)
- ❌ Sem ACS
- ✅ Protocolo Manchester OBRIGATÓRIO
- ✅ Fluxo: Recepção → Classificação Risco → Atendimento
- ✅ Profissionais individuais (não equipes)

### Implementação

#### 1.1. Adicionar à Lista (UPA)
**Arquivo**: `digiurban/frontend/app/admin/apps/saude/atendimento/adicionar/page.tsx`

**Lógica**:
```typescript
// Detectar tipo de unidade
const tipoUnidade = unidadeSelecionada.tipo; // 'UPA' ou 'UBS'

// UPA: Seleciona profissional individual
// UBS sem ESF: Seleciona profissional individual
// UBS com ESF: Seleciona equipe (Fase 3)

if (tipoUnidade === 'UPA') {
  // Obrigatório classificação de risco
  formData.exigeTriagem = true;
}
```

**Campos**:
```typescript
{
  citizenId: string,
  unidadeId: string,
  tipoUnidade: 'UPA' | 'UBS',  // Auto-detectado

  // UPA/UBS sem ESF
  profissionalId?: string,      // Profissional individual

  // UBS com ESF (Fase 3)
  equipeId?: string,            // Equipe responsável

  tipoAtendimento: TipoAtendimento,
  motivoBusca: string,
}
```

#### 1.2. Fluxo UPA (Simplificado)
```
AGUARDANDO
  ↓
EM_CLASSIFICACAO_RISCO (OBRIGATÓRIO - Protocolo Manchester)
  ↓ (define cor: vermelho, laranja, amarelo, verde, azul)
AGUARDANDO_ATENDIMENTO (ordenado por cor + hora chegada)
  ↓
EM_ATENDIMENTO (médico ou enfermeiro)
  ↓
FINALIZADO / ENCAMINHADO / INTERNADO
```

#### 1.3. Enum StatusFila Atualizado
```prisma
enum StatusFila {
  AGUARDANDO                  // Chegou, aguardando triagem/acolhimento

  // UPA
  EM_CLASSIFICACAO_RISCO      // Triagem Manchester (UPA)

  // UBS
  EM_ACOLHIMENTO              // Escuta inicial (UBS)

  // Comum
  AGUARDANDO_ATENDIMENTO      // Após triagem/acolhimento
  EM_ATENDIMENTO              // Consulta

  // Finalizações
  RESOLVIDO_ACOLHIMENTO       // UBS - resolveu com orientação
  EM_PROCEDIMENTO             // Curativo, inalação, vacina
  FINALIZADO                  // Consulta concluída
  ENCAMINHADO_EXTERNO         // UPA, especialista
  INTERNADO                   // Necessita internação
  NAO_AGUARDOU                // Desistiu
  TRANSFERIDO                 // Transferido outra unidade
}
```

#### 1.4. Novo Campo: Tipo de Fluxo
```prisma
model UnidadeSaude {
  // ... campos existentes

  fluxoAtendimento  FluxoAtendimento @default(TRADICIONAL)
}

enum FluxoAtendimento {
  TRADICIONAL   // UPA, UBS sem ESF (profissional individual)
  ESF           // UBS com ESF (equipes e território)
  MISTO         // UBS que atende território + demanda livre
}
```

---

## 📝 FASE 2: UBS TRADICIONAL (SEM ESF) (3-4 dias)

### Características
- ❌ Sem ESF (não tem equipes)
- ❌ Sem territorialização
- ✅ Acolhimento/Escuta Inicial OBRIGATÓRIO
- ✅ Triagem OPCIONAL (só casos que precisam)
- ✅ Profissionais individuais

### Fluxo UBS Tradicional
```
AGUARDANDO
  ↓
EM_ACOLHIMENTO (Técnico/Enfermeiro - SEMPRE)
  ↓ Decisão:
  ├─→ RESOLVIDO_ACOLHIMENTO (orientação)
  ├─→ EM_PROCEDIMENTO (curativo, vacina)
  ├─→ [Opcional] EM_CLASSIFICACAO_RISCO (se urgente)
  └─→ AGUARDANDO_ATENDIMENTO (médico/enfermeiro)
  ↓
EM_ATENDIMENTO
  ↓
FINALIZADO / ENCAMINHADO_EXTERNO
```

### Implementação

#### 2.1. Tela de Acolhimento
**Nova Rota**: `/atendimento/[id]/acolhimento`

**Formulário**:
```typescript
interface AcolhimentoForm {
  // Subjetivo
  motivoBusca: string;           // Já vem da recepção
  queixaPrincipal: string;
  historiaBreve: string;

  // Objetivo (opcional)
  sinaisVitais?: {
    pa?: string;
    temperatura?: number;
    saturacao?: number;
  };

  // Avaliação
  riscoIdentificado: 'BAIXO' | 'MEDIO' | 'ALTO';
  necessitaTriagem: boolean;     // Se ALTO = true

  // Conduta (DECISÃO CRÍTICA)
  conduta:
    | 'RESOLVER_AQUI'            // Orientação bastou
    | 'PROCEDIMENTO'             // Curativo, inalação
    | 'ENFERMEIRO'               // Consulta enfermagem
    | 'MEDICO'                   // Consulta médica
    | 'TRIAGEM_URGENTE'          // Precisa classificação risco
    | 'ENCAMINHAR_UPA'           // Caso agudo
    | 'AGENDAR';                 // Consulta futura

  profissionalEncaminhado?: string;  // Se ENFERMEIRO ou MEDICO
  orientacoes: string;
}
```

#### 2.2. Lógica de Transição de Status
```typescript
const handleAcolhimento = async (data: AcolhimentoForm) => {
  let novoStatus: StatusFila;
  let prioridade: PrioridadeFila = 'NORMAL';

  switch (data.conduta) {
    case 'RESOLVER_AQUI':
      novoStatus = 'RESOLVIDO_ACOLHIMENTO';
      break;

    case 'PROCEDIMENTO':
      novoStatus = 'EM_PROCEDIMENTO';
      break;

    case 'TRIAGEM_URGENTE':
      novoStatus = 'EM_CLASSIFICACAO_RISCO';
      prioridade = 'URGENTE';
      break;

    case 'ENFERMEIRO':
    case 'MEDICO':
      if (data.necessitaTriagem) {
        novoStatus = 'EM_CLASSIFICACAO_RISCO';
      } else {
        novoStatus = 'AGUARDANDO_ATENDIMENTO';
      }
      break;

    case 'ENCAMINHAR_UPA':
      novoStatus = 'ENCAMINHADO_EXTERNO';
      break;

    case 'AGENDAR':
      // Criar agendamento e marcar como finalizado
      novoStatus = 'FINALIZADO';
      break;
  }

  // Atualizar fila
  await updateFilaAtendimento(filaId, {
    status: novoStatus,
    prioridade,
    profissionalEncaminhadoId: data.profissionalEncaminhado,
  });

  // Registrar acolhimento
  await createAcolhimento({
    filaAtendimentoId: filaId,
    profissionalAcolhimentoId: user.id,
    ...data,
  });
};
```

---

## 🌟 FASE 3: UBS COM ESF COMPLETO (5-7 dias)

### Pré-requisitos
✅ Implementar CRUD de Equipes ESF
✅ Implementar CRUD de Microáreas
✅ Implementar Vinculação Cidadão-Equipe

### 3.1. CRUD Equipes ESF

#### Backend API
**Arquivo**: `digiurban/backend/src/routes/saude-cadastros.routes.ts`

```typescript
// GET /api/apps/saude/cadastros/equipes
router.get('/equipes', async (req, res) => {
  const { unidadeId } = req.query;

  const equipes = await prisma.equipeSaude.findMany({
    where: {
      unidadeId: unidadeId as string,
      ativo: true,
    },
    include: {
      unidade: true,
      microareas: {
        include: {
          acs: { select: { id: true, name: true } },
        },
      },
      profissionais: {
        where: { ativo: true },
        include: {
          profissional: {
            select: { id: true, nome: true, categoria: true },
          },
        },
      },
    },
  });

  res.json(equipes);
});

// POST /api/apps/saude/cadastros/equipes
router.post('/equipes', async (req, res) => {
  const { nome, ine, tipo, unidadeId } = req.body;

  const equipe = await prisma.equipeSaude.create({
    data: {
      nome,
      ine,                        // Identificação Nacional de Equipes
      tipo,                       // eSF, eAP, NASF, etc.
      unidadeId,
      ativo: true,
    },
  });

  res.status(201).json(equipe);
});
```

#### Frontend
**Nova Página**: `/cadastros/equipes/page.tsx`

**Formulário de Equipe**:
```typescript
{
  nome: 'Equipe Saúde da Família 01',
  ine: '0000123456789',              // INE nacional
  tipo: 'eSF',                       // eSF, eAP, NASF, eCR, eAD
  unidadeId: string,

  // Composição da equipe (após criação)
  profissionais: [
    { profissionalId, funcao: 'MEDICO', cbo, dataInicio },
    { profissionalId, funcao: 'ENFERMEIRO', cbo, dataInicio },
    { profissionalId, funcao: 'TECNICO_ENFERMAGEM', cbo, dataInicio },
    { profissionalId, funcao: 'ACS', cbo, dataInicio },
  ]
}
```

### 3.2. CRUD Microáreas

#### Backend API
```typescript
// GET /api/apps/saude/cadastros/microareas
router.get('/microareas', async (req, res) => {
  const { equipeId } = req.query;

  const microareas = await prisma.microarea.findMany({
    where: { equipeId: equipeId as string },
    include: {
      acs: { select: { id: true, name: true } },
      _count: { select: { citizens: true } },  // Quantos moradores
    },
  });

  res.json(microareas);
});

// POST /api/apps/saude/cadastros/microareas
router.post('/microareas', async (req, res) => {
  const { numero, descricao, equipeId, acsId } = req.body;

  // Validar que ACS pertence à equipe
  const acsEquipe = await prisma.profissionalEquipe.findFirst({
    where: {
      profissionalId: acsId,
      equipeId,
      ativo: true,
    },
  });

  if (!acsEquipe) {
    return res.status(400).json({
      error: 'ACS não pertence à equipe selecionada'
    });
  }

  const microarea = await prisma.microarea.create({
    data: { numero, descricao, equipeId, acsId },
  });

  res.status(201).json(microarea);
});
```

#### Frontend
**Nova Página**: `/cadastros/equipes/[id]/microareas/page.tsx`

**Formulário de Microárea**:
```typescript
{
  numero: '01',                      // Código da microárea
  descricao: 'Bairro Centro - Ruas A, B e C',
  equipeId: string,                  // Equipe responsável
  acsId: string,                     // ACS responsável (da equipe)
}
```

### 3.3. Vinculação Cidadão-Equipe

#### Atualizar Cadastro de Cidadão
**Arquivo**: `citizens/[id]/page.tsx` ou `citizens/novo/page.tsx`

**Nova Seção**: "Vinculação ESF"
```typescript
<Card>
  <CardHeader>
    <CardTitle>Vinculação com Equipe de Saúde da Família</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Unidade de Referência *</Label>
        <Select
          value={formData.unidadeId}
          onValueChange={(value) => {
            setFormData({ ...formData, unidadeId: value });
            loadEquipesByUnidade(value);
          }}
        >
          <SelectContent>
            {unidades.filter(u => u.tipo === 'UBS').map(...)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Equipe ESF *</Label>
        <Select
          value={formData.equipeId}
          onValueChange={(value) => {
            setFormData({ ...formData, equipeId: value });
            loadMicroareasByEquipe(value);
          }}
          disabled={!formData.unidadeId}
        >
          <SelectContent>
            {equipes.map(e => (
              <SelectItem value={e.id}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Microárea *</Label>
        <Select
          value={formData.microareaId}
          onValueChange={(value) => {
            const microarea = microareas.find(m => m.id === value);
            setFormData({
              ...formData,
              microareaId: value,
              acsId: microarea?.acsId,  // Auto-preenche
            });
          }}
          disabled={!formData.equipeId}
        >
          <SelectContent>
            {microareas.map(m => (
              <SelectItem value={m.id}>
                {m.numero} - {m.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>ACS Responsável</Label>
        <Input
          value={acsNome || '-'}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          ACS responsável pela microárea
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3.4. Adicionar à Lista (ESF)

**Atualizar**: `atendimento/adicionar/page.tsx`

```typescript
useEffect(() => {
  if (selectedCidadao) {
    const tipoUnidade = unidadeSelecionada.tipo;
    const fluxo = unidadeSelecionada.fluxoAtendimento;

    if (fluxo === 'ESF') {
      // Auto-detectar equipe do cidadão
      if (selectedCidadao.equipeVinculadaId) {
        setFormData(prev => ({
          ...prev,
          equipeId: selectedCidadao.equipeVinculadaId,
          microareaId: selectedCidadao.microareaId,
          acsId: selectedCidadao.acsResponsavelId,
        }));
      } else {
        // ALERTA: Cidadão sem equipe vinculada
        setAviso({
          tipo: 'error',
          mensagem: 'Cidadão não está vinculado a nenhuma equipe ESF. Configure no cadastro.',
          acao: () => router.push(`/cadastros/cidadaos/${selectedCidadao.id}`),
        });
      }
    } else {
      // UPA ou UBS tradicional: selecionar profissional
      // (fluxo atual permanece)
    }
  }
}, [selectedCidadao]);

// Renderização condicional
{fluxo === 'ESF' ? (
  // Exibir equipe, microárea e ACS (somente leitura)
  <div>
    <Label>Equipe ESF</Label>
    <Input value={equipeNome} disabled />

    <Label>ACS Responsável</Label>
    <Input value={acsNome} disabled />
  </div>
) : (
  // Selecionar profissional individual
  <div>
    <Label>Profissional *</Label>
    <Select {...profissionalProps} />
  </div>
)}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ FASE 1: UPA (IMEDIATO)
- [ ] Atualizar enum `StatusFila` (adicionar `EM_CLASSIFICACAO_RISCO`)
- [ ] Adicionar campo `fluxoAtendimento` em `UnidadeSaude`
- [ ] Atualizar "Adicionar à Lista" para detectar tipo de unidade
- [ ] Implementar tela de Classificação de Risco (Protocolo Manchester)
- [ ] Atualizar cores da Lista de Atendimentos

### ✅ FASE 2: UBS TRADICIONAL
- [ ] Implementar tela de Acolhimento/Escuta Inicial
- [ ] API para registrar acolhimento (`POST /fila-atendimento/:id/acolhimento`)
- [ ] Lógica de decisão de conduta (resolver/encaminhar/agendar)
- [ ] Atualizar fluxo de transição de status

### ✅ FASE 3: ESF COMPLETO
- [ ] CRUD Equipes ESF (backend + frontend)
  - [ ] API: GET, POST, PUT, DELETE `/cadastros/equipes`
  - [ ] Página `/cadastros/equipes`
  - [ ] Página `/cadastros/equipes/nova`
  - [ ] Página `/cadastros/equipes/[id]` (editar)

- [ ] CRUD Microáreas
  - [ ] API: GET, POST, PUT, DELETE `/cadastros/microareas`
  - [ ] Página `/cadastros/equipes/[id]/microareas`

- [ ] Vinculação Profissional-Equipe
  - [ ] API: POST `/cadastros/equipes/[id]/profissionais`
  - [ ] Interface para adicionar/remover profissionais da equipe

- [ ] Vinculação Cidadão-Equipe
  - [ ] Atualizar cadastro de cidadão com seção ESF
  - [ ] Validação: cidadão só pode ser adicionado se tiver equipe

- [ ] Atualizar "Adicionar à Lista" para ESF
  - [ ] Auto-detectar equipe do cidadão
  - [ ] Exibir equipe, microárea e ACS
  - [ ] Remover seleção de profissional (equipe já define)

### ✅ TESTES
- [ ] Testar fluxo UPA: Recepção → Classificação → Atendimento
- [ ] Testar fluxo UBS: Recepção → Acolhimento → (Triagem) → Atendimento
- [ ] Testar fluxo ESF: Cidadão com equipe → Acolhimento → Atendimento
- [ ] Validar que cidadão sem equipe não entra na fila (ESF)

---

## 🎯 RESULTADO FINAL

### UPA
✅ Recepção → Classificação Risco (Manchester) → Atendimento por cor
✅ Profissionais individuais
✅ 100% compatível com protocolo Manchester

### UBS Tradicional
✅ Recepção → Acolhimento (decisão) → Atendimento
✅ Profissionais individuais
✅ Triagem opcional

### UBS com ESF
✅ Cidadão vinculado à Equipe + Microárea + ACS
✅ Recepção identifica equipe automaticamente
✅ Acolhimento define fluxo (enfermeiro/médico)
✅ 100% alinhado com PEC e-SUS APS

---

## 🔄 MIGRAÇÃO DE DADOS

```sql
-- Adicionar campo fluxoAtendimento
ALTER TABLE "unidade_saude"
ADD COLUMN "fluxoAtendimento" TEXT DEFAULT 'TRADICIONAL';

-- Atualizar UPAs para fluxo tradicional
UPDATE "unidade_saude"
SET "fluxoAtendimento" = 'TRADICIONAL'
WHERE "tipo" = 'UPA';

-- UBS podem ser marcadas como ESF manualmente depois
```

---

**Documento criado em**: 31/01/2026
**Estratégia**: Implementação progressiva (UPA → UBS → ESF)
**Compatibilidade**: 100% SUS/PEC e-SUS APS
