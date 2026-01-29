# Guia Rápido - PEC e-SUS DigiUrban

## Início Rápido

### 1. Configuração Inicial

#### Backend
```bash
cd digiurban/backend

# As tabelas já estão no schema Prisma, apenas rode:
npx prisma generate
npx prisma db push
```

#### Frontend
```bash
cd digiurban/frontend

# Instalar dependências (se necessário)
npm install
```

### 2. Adicionar Rotas no Express

No arquivo principal do Express (ex: `backend/src/app.ts` ou `backend/src/server.ts`):

```typescript
import saudeRoutes from './routes/saude';

// Adicione após outras rotas
app.use('/api/saude', saudeRoutes);
```

### 3. Usar Componentes no Frontend

#### Exemplo 1: Página de Fila de Atendimento

```typescript
// Em app/admin/apps/saude/fila/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AdicionarAtendimentoDialog } from '@/components/saude';

export default function FilaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const unidadeId = 'sua-unidade-id'; // Obter do contexto

  const handleAdicionar = async (data: any) => {
    const response = await fetch('/api/saude/fila-atendimento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Recarregar lista
    }
  };

  return (
    <div className="p-6">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar à Fila
      </Button>

      <AdicionarAtendimentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAdicionar}
        unidadeId={unidadeId}
      />
    </div>
  );
}
```

#### Exemplo 2: Prontuário Completo

```typescript
// Em app/admin/apps/saude/prontuario/[id]/page.tsx
'use client';

import { ProntuarioPage } from '@/components/saude';

export default function ProntuarioRoute({ params }: { params: { id: string } }) {
  return <ProntuarioPage citizenId={params.id} />;
}
```

#### Exemplo 3: Triagem de Enfermagem

```typescript
'use client';

import { useState } from 'react';
import { TriagemEnfermagemDialog } from '@/components/saude';

export default function TriagemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const filaAtendimento = { /* dados da fila */ };
  const currentUserId = 'enfermeiro-id';

  const handleSalvar = async (data: any) => {
    const response = await fetch('/api/saude/triagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Sucesso
    }
  };

  return (
    <div>
      <TriagemEnfermagemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSalvar}
        filaAtendimento={filaAtendimento}
        currentUserId={currentUserId}
      />
    </div>
  );
}
```

### 4. Endpoints da API

#### Fila de Atendimento
```typescript
// Adicionar à fila
POST /api/saude/fila-atendimento
Body: {
  citizenId: string,
  profissionalId: string,
  equipeId?: string,
  tipoAtendimento: string,
  motivoBusca: string,
  vacinacao: boolean,
  unidadeId: string
}

// Listar fila
GET /api/saude/fila-atendimento?unidadeId=xxx&data=2026-01-29

// Atualizar status
PATCH /api/saude/fila-atendimento/:id/status
Body: { status: 'EM_CONSULTA' }

// Chamar próximo
POST /api/saude/fila-atendimento/chamar-proximo
Body: { unidadeId: string, profissionalId: string }
```

#### Escuta Inicial
```typescript
// Criar escuta inicial
POST /api/saude/escuta-inicial
Body: {
  filaAtendimentoId: string,
  profissionalId: string,
  motivoBusca: string,
  riscoEsperado: 'NAO_URGENTE' | ...,
  vulnerabilidadeSocial: 'BAIXA' | 'MEDIA' | 'ALTA',
  condutaDefinida: string,
  // ... outros campos
}

// Buscar por fila
GET /api/saude/escuta-inicial/fila/:filaId
```

#### Triagem
```typescript
// Criar triagem
POST /api/saude/triagem
Body: {
  filaAtendimentoId: string,
  enfermeiroId: string,
  queixaPrincipal: string,
  classificacaoRisco: 'EMERGENCIA' | ...,
  // ... outros campos
}

// Estatísticas
GET /api/saude/triagem/estatisticas?unidadeId=xxx&dataInicio=...&dataFim=...
```

#### Equipes
```typescript
// Criar equipe
POST /api/saude/equipes
Body: {
  ine: string,
  nome: string,
  tipo: 'eSF' | 'eAP' | ...,
  unidadeId: string
}

// Listar equipes
GET /api/saude/equipes?unidadeId=xxx

// Criar microárea
POST /api/saude/equipes/:id/microareas
Body: {
  numero: string,
  descricao?: string,
  acsId?: string
}
```

#### Atividades Coletivas
```typescript
// Criar atividade
POST /api/saude/atividades-coletivas
Body: {
  tipo: 'GRUPO_HIPERTENSOS' | ...,
  tema: string,
  dataHora: Date,
  local: string,
  unidadeId: string,
  numeroParticipantes: number,
  praticasSaude: string[]
}

// Adicionar participante
POST /api/saude/atividades-coletivas/:id/participantes
Body: {
  citizenId: string,
  pressaoArterial?: string,
  glicemia?: number,
  avaliacaoAlterada: boolean
}
```

### 5. Estrutura de Pastas Recomendada

```
app/admin/apps/saude/
├── atendimento/
│   ├── fila/page.tsx              # Lista fila + Dialog Adicionar
│   ├── escuta-inicial/page.tsx    # Escuta Inicial
│   ├── triagem/page.tsx           # Triagem
│   └── consulta/page.tsx          # Consulta SOAP
├── prontuario/
│   └── [id]/page.tsx              # Prontuário completo
├── vacinas/
│   └── [citizenId]/page.tsx       # Vacinação
├── exames/
│   └── page.tsx                   # Exames
├── atividades-coletivas/
│   ├── page.tsx                   # Lista atividades
│   └── nova/page.tsx              # Nova atividade
├── equipes/
│   └── page.tsx                   # Gestão de equipes
├── agenda/
│   └── page.tsx                   # Configuração agenda
└── relatorios/
    └── page.tsx                   # Relatórios
```

### 6. Tipos TypeScript

Todos os tipos estão em `frontend/types/saude.ts`:

```typescript
import {
  FilaAtendimento,
  EscutaInicial,
  TriagemEnfermagem,
  TipoAtendimentoFila,
  StatusFila,
  ClassificacaoManchester,
  CORES_MANCHESTER,
  CORES_STATUS_FILA
} from '@/types/saude';
```

### 7. Cores e Badges

Use as constantes de cores para manter consistência:

```typescript
import { CORES_MANCHESTER, CORES_STATUS_FILA } from '@/types/saude';

// Exemplo
<Badge className={CORES_MANCHESTER[classificacao]}>
  {classificacao}
</Badge>
```

### 8. Validações

Todos os formulários têm validação embutida:

```typescript
// Os dialogs validam automaticamente
// Mostre alertas em caso de erro
if (!campo) {
  alert('Preencha todos os campos obrigatórios');
  return;
}
```

### 9. Loading States

Todos os componentes têm estados de loading:

```typescript
const [loading, setLoading] = useState(false);

// Durante submissão
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Salvando...
    </>
  ) : (
    'Salvar'
  )}
</Button>
```

### 10. Próximos Passos

1. **Testar os Endpoints:**
   - Use Postman ou Insomnia
   - Teste cada rota criada

2. **Integrar com Autenticação:**
   - Adicionar middleware de auth nas rotas
   - Obter userId do token JWT

3. **Adicionar WebSocket para Fila:**
   - Atualização em tempo real
   - Notificação de chamada

4. **Implementar Relatórios:**
   - Gráficos com Chart.js ou Recharts
   - Exportação para PDF/Excel

5. **Integração e-SUS:**
   - Configurar credenciais API
   - Implementar sincronização

## Dicas

### Performance
- Use `React.memo()` em componentes grandes
- Implemente paginação nas listas
- Cache de dados com React Query

### UX
- Adicione confirmações antes de ações críticas
- Mostre feedback visual de sucesso/erro
- Implemente undo/redo onde apropriado

### Segurança
- Valide permissões no backend
- Sanitize inputs
- Use HTTPS em produção
- Implemente rate limiting

## Suporte

Documentação completa: `IMPLEMENTACAO-PEC-ESUS-COMPLETA.md`

Schema Prisma: `backend/prisma/schema.prisma`

Types: `frontend/types/saude.ts`

---

**Versão:** 1.0.0
**Data:** 29/01/2026
