# 🔄 Arquitetura Bidirecional de APPs - Guia de Implementação

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Fundamentais](#conceitos-fundamentais)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Implementação Passo a Passo](#implementação-passo-a-passo)
5. [Exemplo Prático: APP TFD](#exemplo-prático-app-tfd)
6. [Padrões e Convenções](#padrões-e-convenções)
7. [Checklist de Implementação](#checklist-de-implementação)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A **Arquitetura Bidirecional de APPs** permite que APPs internos (microsistemas) funcionem de forma autônoma, mas integrada com o sistema de Serviços e Protocolos, seguindo estes princípios:

### Princípios Fundamentais

1. **APPs NÃO modificam dados de Serviços/Protocolos**
   - APPs apenas **lêem** e **mapeiam** dados de protocolos
   - Jamais alteram estruturas de serviços existentes

2. **APPs possuem suas próprias tabelas**
   - Dados gerenciados pelos CRUDs do APP
   - Fonte autoritativa para dados específicos do domínio

3. **Fluxo Bidirecional**
   ```
   APP Tables (ex: Especialidades, Destinos)
        ↓ enumSource (fornece dados)
   Service Forms (formulários de serviços)
        ↓ customData (armazena referências)
   Protocols (protocolos criados)
        ↓ leitura + mapeamento
   APP Interface (lê e exibe)
   ```

4. **Dados Dinâmicos via API**
   - Endpoint `/api/{app}/enums/{entity}` retorna dados do APP
   - Formulários referenciam via `enumSource`
   - Sem hardcoded, 100% dinâmico

---

## 🧠 Conceitos Fundamentais

### 1. Single Source of Truth (Fonte Única da Verdade)

Cada tipo de dado tem **UMA** fonte autoritativa:

| Dado | Fonte | Onde Usar |
|------|-------|-----------|
| Especialidades médicas | `especialidades_tfd` | Formulários TFD, filtros, relatórios |
| Destinos frequentes | `destinos_tfd` | Formulários TFD, planejamento de viagens |
| Veículos | `veiculos_tfd` | Agendamento de viagens |
| Motoristas | `motoristas_tfd` | Escalas, viagens |
| **Protocolos** | `protocols_simplified` | Dashboard, listagens (nunca duplicar!) |

### 2. enumSource Pattern

Padrão para popular campos de formulários dinamicamente:

```typescript
// No formSchema do serviço
{
  type: 'select',
  name: 'especialidade',
  label: 'Especialidade Médica',
  enumSource: '/api/tfd/enums/especialidades', // ← busca dinâmica
  enumValueField: 'nome',                        // campo usado como value
  enumLabelField: 'nome',                        // campo exibido ao usuário
  required: true
}
```

**Benefícios:**
- ✅ Sem dados hardcoded
- ✅ Atualização automática quando APP adiciona/remove itens
- ✅ Centralização de dados
- ✅ Consistência em todo o sistema

### 3. customData Storage

Protocolos armazenam dados específicos em `customData` (JSONB):

```typescript
// Exemplo: Protocolo TFD
{
  id: "proto123",
  number: "2025-000005",
  moduleType: "ENCAMINHAMENTOS_TFD",
  customData: {
    especialidade: "Cardiologia",           // do APP
    cidadeDestino: "Curitiba - PR",         // do APP
    hospitalDestino: "Hospital das Clínicas",
    prioridade: "URGENTE",
    dataPreferencialConsulta: "2025-03-15",
    // ... outros dados específicos
  }
}
```

**APP lê e mapeia:**
```typescript
const solicitacoes = protocols.map(p => ({
  id: p.id,
  protocolId: p.number,
  especialidade: p.customData.especialidade,  // ← mapeamento
  cidadeDestino: p.customData.cidadeDestino,
  status: p.status,
  // ...
}));
```

---

## 🔄 Fluxo de Dados

### Fluxo Completo (Exemplo TFD)

```
1. GESTÃO (Admin cadastra dados do APP)
   ┌─────────────────────────────┐
   │ Admin acessa:               │
   │ /admin/apps/saude/tfd/      │
   │   configuracoes/            │
   │     especialidades          │
   │     destinos                │
   └──────────┬──────────────────┘
              ↓
   ┌─────────────────────────────┐
   │ CRUD cria/edita/exclui      │
   │ registros em:               │
   │ - especialidades_tfd        │
   │ - destinos_tfd              │
   └──────────┬──────────────────┘
              ↓
2. DISPONIBILIZAÇÃO (Dados viram enums)
   ┌─────────────────────────────┐
   │ API Endpoint:               │
   │ GET /api/tfd/enums/         │
   │     especialidades          │
   │ Retorna: [                  │
   │   { id, nome, ... },        │
   │   { id, nome, ... }         │
   │ ]                           │
   └──────────┬──────────────────┘
              ↓
3. USO EM FORMULÁRIOS (Serviços usam enums)
   ┌─────────────────────────────┐
   │ Formulário de Serviço TFD   │
   │ Campo "especialidade":      │
   │   enumSource: '/api/tfd/    │
   │     enums/especialidades'   │
   │                             │
   │ → SELECT dinâmico com       │
   │   dados do APP              │
   └──────────┬──────────────────┘
              ↓
4. CRIAÇÃO DE PROTOCOLO (Cidadão solicita)
   ┌─────────────────────────────┐
   │ Cidadão preenche formulário │
   │ Seleciona:                  │
   │ - Especialidade: Cardiologia│
   │ - Destino: Curitiba         │
   └──────────┬──────────────────┘
              ↓
   ┌─────────────────────────────┐
   │ Sistema cria Protocolo:     │
   │ moduleType: ENCAM_TFD       │
   │ customData: {               │
   │   especialidade: "Cardio",  │
   │   cidadeDestino: "Curitiba" │
   │ }                           │
   └──────────┬──────────────────┘
              ↓
5. LEITURA NO APP (APP exibe dados)
   ┌─────────────────────────────┐
   │ APP TFD Dashboard:          │
   │ GET /api/protocols?         │
   │   moduleType=ENCAM_TFD      │
   │                             │
   │ Mapeia customData →         │
   │   interface do APP          │
   └─────────────────────────────┘
```

---

## 📝 Implementação Passo a Passo

### FASE 1: Backend - Tabelas e CRUDs

#### 1.1. Criar Modelos no Prisma Schema

```prisma
// backend/prisma/schema.prisma

// Exemplo: Especialidades TFD
model EspecialidadeTFD {
  id        String   @id @default(cuid())
  nome      String   @unique
  descricao String?
  ativo     Boolean  @default(true)
  ordem     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ativo])
  @@index([ordem])
  @@map("especialidades_tfd")
}

// Exemplo: Destinos TFD
model DestinoTFD {
  id             String   @id @default(cuid())
  cidade         String
  estado         String
  hospital       String?
  especialidades Json?
  distanciaKm    Int?
  tempoViagem    String?
  observacoes    String?
  ativo          Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([cidade, estado, hospital])
  @@index([ativo])
  @@index([cidade])
  @@map("destinos_tfd")
}
```

**Padrões:**
- ✅ Use `ativo: Boolean` para soft delete
- ✅ Use `ordem: Int` para controle de exibição
- ✅ Use `@map()` para nomes de tabelas em snake_case
- ✅ Crie índices em campos de busca/filtro

#### 1.2. Criar Service com CRUDs Completos

```typescript
// backend/src/services/{app}/{app}.service.ts

class TFDService {
  // ==================== ESPECIALIDADES ====================

  async listarEspecialidades(apenasAtivas: boolean = true) {
    return await prisma.especialidadeTFD.findMany({
      where: apenasAtivas ? { ativo: true } : undefined,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  async findEspecialidadeById(id: string) {
    return await prisma.especialidadeTFD.findUnique({
      where: { id },
    });
  }

  async createEspecialidade(data: {
    nome: string;
    descricao?: string;
    ordem?: number;
  }) {
    return await prisma.especialidadeTFD.create({
      data,
    });
  }

  async updateEspecialidade(
    id: string,
    data: Partial<{
      nome: string;
      descricao: string;
      ordem: number;
      ativo: boolean;
    }>
  ) {
    return await prisma.especialidadeTFD.update({
      where: { id },
      data,
    });
  }

  async deleteEspecialidade(id: string) {
    // Soft delete
    return await prisma.especialidadeTFD.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
```

**Padrões:**
- ✅ Métodos: `listar`, `findById`, `create`, `update`, `delete`
- ✅ Soft delete (set `ativo: false`)
- ✅ Filtros opcionais (ex: `apenasAtivas`)
- ✅ Ordenação padrão

#### 1.3. Criar Rotas REST

```typescript
// backend/src/routes/{app}.routes.ts

// ==================== ESPECIALIDADES ====================
router.get('/especialidades', async (req, res) => {
  try {
    const apenasAtivas = req.query.apenasAtivas !== 'false';
    const especialidades = await tfdService.listarEspecialidades(apenasAtivas);
    res.json(especialidades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.findEspecialidadeById(req.params.id);
    if (!especialidade) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }
    res.json(especialidade);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/especialidades', async (req, res) => {
  try {
    const especialidade = await tfdService.createEspecialidade(req.body);
    res.status(201).json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.updateEspecialidade(
      req.params.id,
      req.body
    );
    res.json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.deleteEspecialidade(req.params.id);
    res.json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

**Padrões de Rotas:**
```
GET    /api/{app}/entidades          → Listar (200)
GET    /api/{app}/entidades/:id      → Buscar (200 ou 404)
POST   /api/{app}/entidades          → Criar (201)
PUT    /api/{app}/entidades/:id      → Atualizar (200)
DELETE /api/{app}/entidades/:id      → Excluir (200)
```

---

### FASE 2: Backend - Endpoint de Enums Dinâmicos

#### 2.1. Criar Endpoint Genérico de Enums

```typescript
// backend/src/routes/{app}.routes.ts

/**
 * Endpoint genérico para buscar dados dinâmicos de entidades do APP
 * Usado por formulários de serviços via enumSource
 */
router.get('/enums/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { filters } = req.query;

    let parsedFilters: any = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        // Ignora se não for JSON válido
      }
    }

    switch (entity) {
      case 'especialidades':
        const especialidades = await tfdService.listarEspecialidades(true);
        return res.json(especialidades);

      case 'veiculos':
        const veiculosFilters = parsedFilters.status
          ? { status: parsedFilters.status }
          : {};
        const veiculos = await tfdService.listarVeiculos(veiculosFilters);
        return res.json(veiculos);

      case 'motoristas':
        const motoristasFilters = parsedFilters.status
          ? { status: parsedFilters.status }
          : {};
        const motoristas = await tfdService.listarMotoristas(motoristasFilters);
        return res.json(motoristas);

      case 'destinos':
        const destinos = await tfdService.listarDestinos(true);
        return res.json(destinos);

      default:
        return res.status(404).json({ error: `Entity '${entity}' not found` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Características:**
- ✅ URL: `/api/{app}/enums/{entity}`
- ✅ Suporta filtros via query string
- ✅ Retorna apenas dados ativos por padrão
- ✅ Extensível para novas entidades

#### 2.2. Exemplo de Uso

```bash
# Buscar todas as especialidades ativas
GET /api/tfd/enums/especialidades

# Buscar veículos disponíveis
GET /api/tfd/enums/veiculos?filters={"status":"DISPONIVEL"}

# Buscar destinos
GET /api/tfd/enums/destinos
```

---

### FASE 3: Frontend - Hooks e Componentes

#### 3.1. Criar Hook Genérico

```typescript
// frontend/hooks/useAppEnums.ts

/**
 * Hook para buscar enums dinâmicos de APPs internos
 */
export function useAppEnums<T = any>(
  appName: string,
  entity: string,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/${appName}/enums/${entity}`;

        if (filters && Object.keys(filters).length > 0) {
          const params = new URLSearchParams();
          params.append('filters', JSON.stringify(filters));
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ao buscar ${entity}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(`Erro ao buscar ${entity}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (appName && entity) {
      fetchData();
    }
  }, [appName, entity, JSON.stringify(filters)]);

  return { data, loading, error };
}

// Hooks específicos
export function useTFDEspecialidades() {
  return useAppEnums('tfd', 'especialidades');
}

export function useTFDVeiculos(filters?: { status?: string }) {
  return useAppEnums('tfd', 'veiculos', filters);
}
```

#### 3.2. Usar nos Componentes

```typescript
// Exemplo: Campo de formulário
import { useTFDEspecialidades } from '@/hooks/useAppEnums';

function FormularioTFD() {
  const { data: especialidades, loading } = useTFDEspecialidades();

  return (
    <select name="especialidade">
      {loading && <option>Carregando...</option>}
      {especialidades.map(esp => (
        <option key={esp.id} value={esp.nome}>
          {esp.nome}
        </option>
      ))}
    </select>
  );
}
```

#### 3.3. Criar Páginas de Gerenciamento

```typescript
// frontend/app/admin/apps/{secretaria}/{app}/configuracoes/{entidade}/page.tsx

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState([]);

  const loadEspecialidades = async () => {
    const response = await fetch('/api/tfd/especialidades?apenasAtivas=false');
    const data = await response.json();
    setEspecialidades(data);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tfd/especialidades/${id}`, { method: 'DELETE' });
    loadEspecialidades();
  };

  // ... renderizar tabela com ações de CRUD
}
```

**Estrutura de Pastas:**
```
frontend/app/admin/apps/
  {secretaria}/
    {app}/
      page.tsx                    → Dashboard do APP
      configuracoes/
        especialidades/
          page.tsx               → CRUD Especialidades
        destinos/
          page.tsx               → CRUD Destinos
      frota/
        veiculos/
          page.tsx               → CRUD Veículos
        motoristas/
          page.tsx               → CRUD Motoristas
```

---

### FASE 4: Seeds e Dados Iniciais

#### 4.1. Criar Seed File

```typescript
// backend/prisma/seeds/{app}-inicial.seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTFD() {
  console.log('🏥 Populando dados iniciais do APP TFD...\n');

  // ============= ESPECIALIDADES =============
  const especialidades = [
    { nome: 'Cardiologia', ordem: 1 },
    { nome: 'Oncologia', ordem: 2 },
    { nome: 'Neurologia', ordem: 3 },
    // ...
  ];

  for (const esp of especialidades) {
    await prisma.especialidadeTFD.upsert({
      where: { nome: esp.nome },
      update: {},
      create: esp,
    });
  }

  console.log(`   ✅ ${especialidades.length} especialidades criadas\n`);

  // ============= DESTINOS =============
  const destinos = [
    {
      cidade: 'Curitiba',
      estado: 'PR',
      hospital: 'Hospital de Clínicas - UFPR',
      especialidades: ['Oncologia', 'Cardiologia', 'Neurologia'],
      distanciaKm: 80,
      tempoViagem: '1h30min',
    },
    // ...
  ];

  for (const dest of destinos) {
    await prisma.destinoTFD.upsert({
      where: {
        cidade_estado_hospital: {
          cidade: dest.cidade,
          estado: dest.estado,
          hospital: dest.hospital || '',
        },
      },
      update: {},
      create: dest,
    });
  }

  console.log(`   ✅ ${destinos.length} destinos criados\n`);
}

seedTFD()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 4.2. Executar Seed

```bash
# Executar seed manualmente
npx ts-node prisma/seeds/{app}-inicial.seed.ts

# Ou adicionar ao package.json
{
  "scripts": {
    "seed:tfd": "ts-node prisma/seeds/tfd-inicial.seed.ts"
  }
}
```

---

### FASE 5: Usar enumSource em Formulários de Serviços

#### 5.1. Atualizar formSchema do Serviço

**ANTES (hardcoded):**
```typescript
{
  type: 'select',
  name: 'especialidade',
  label: 'Especialidade Médica *',
  options: [
    'Cardiologia',
    'Oncologia',
    'Neurologia',
    // ... hardcoded!
  ],
  required: true
}
```

**DEPOIS (dinâmico com enumSource):**
```typescript
{
  type: 'select',
  name: 'especialidade',
  label: 'Especialidade Médica *',
  enumSource: '/api/tfd/enums/especialidades',
  enumValueField: 'nome',
  enumLabelField: 'nome',
  required: true
}
```

**Com campo personalizado:**
```typescript
{
  type: 'select',
  name: 'destinoId',
  label: 'Destino *',
  enumSource: '/api/tfd/enums/destinos',
  enumValueField: 'id',                           // value = ID
  enumLabelField: (item) =>                       // label customizado
    `${item.cidade} - ${item.estado} (${item.hospital})`,
  required: true
}
```

#### 5.2. Como o Sistema Usa enumSource

```typescript
// Sistema busca dados automaticamente ao renderizar formulário
fetch('/api/tfd/enums/especialidades')
  .then(data => {
    // data = [
    //   { id: '123', nome: 'Cardiologia', ... },
    //   { id: '456', nome: 'Oncologia', ... }
    // ]

    // Renderiza <select> dinamicamente:
    // <option value="Cardiologia">Cardiologia</option>
    // <option value="Oncologia">Oncologia</option>
  });
```

---

### FASE 6: Leitura de Protocolos no APP

#### 6.1. Dashboard do APP

```typescript
// frontend/app/admin/apps/{secretaria}/{app}/page.tsx

export default function TFDDashboard() {
  const [stats, setStats] = useState({});

  const loadStats = async () => {
    // ✅ Buscar protocolos TFD diretamente
    const response = await fetch('/api/protocols?moduleType=ENCAMINHAMENTOS_TFD');
    const data = await response.json();
    const protocols = data.protocols || data.data || [];

    // Calcular estatísticas
    const total = protocols.length;
    const porStatus = protocols.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalSolicitacoes: total,
      aguardandoAnalise: porStatus['VINCULADO'] || 0,
      emAndamento: porStatus['EM_ANDAMENTO'] || 0,
      concluidos: porStatus['CONCLUIDO'] || 0,
    });
  };

  return (
    <div>
      <h1>Dashboard TFD</h1>
      <div>Total de Solicitações: {stats.totalSolicitacoes}</div>
      {/* ... */}
    </div>
  );
}
```

#### 6.2. Listagem de Solicitações

```typescript
// frontend/app/admin/apps/{secretaria}/{app}/solicitacoes/page.tsx

const loadSolicitacoes = async () => {
  // ✅ Buscar protocolos
  let url = '/api/protocols?moduleType=ENCAMINHAMENTOS_TFD';
  if (statusFilter !== 'all') url += `&status=${statusFilter}`;

  const response = await fetch(url);
  const data = await response.json();

  // ✅ Mapear customData para formato do APP
  const solicitacoesMapeadas = (data.protocols || []).map((protocol) => {
    const customData = protocol.customData || {};
    return {
      id: protocol.id,
      protocolId: protocol.number,
      citizenName: protocol.citizen?.name || 'Não informado',
      especialidade: customData.especialidade || 'Não informado',
      cidadeDestino: customData.cidadeDestino || 'Não informado',
      status: protocol.status,
      prioridade: customData.prioridade || 'ROTINA',
      dataConsulta: customData.dataPreferencialConsulta || null,
      createdAt: protocol.createdAt,
    };
  });

  setSolicitacoes(solicitacoesMapeadas);
};
```

**Importante:**
- ✅ SEMPRE buscar de `/api/protocols`
- ✅ NUNCA duplicar dados em tabelas do APP
- ✅ Mapear `customData` para interface do APP

---

## 📊 Exemplo Prático: APP TFD

### Estrutura Completa Implementada

#### Backend

**Tabelas:**
```
especialidades_tfd    → Especialidades médicas
destinos_tfd          → Cidades/hospitais de destino
veiculos_tfd          → Frota (já existia)
motoristas_tfd        → Motoristas (já existia)
solicitacoes_tfd      → Solicitações (já existia)
```

**Endpoints:**
```
# CRUD Especialidades
GET    /api/tfd/especialidades
GET    /api/tfd/especialidades/:id
POST   /api/tfd/especialidades
PUT    /api/tfd/especialidades/:id
DELETE /api/tfd/especialidades/:id

# CRUD Destinos
GET    /api/tfd/destinos
GET    /api/tfd/destinos/:id
POST   /api/tfd/destinos
PUT    /api/tfd/destinos/:id
DELETE /api/tfd/destinos/:id

# Enums Dinâmicos
GET    /api/tfd/enums/especialidades
GET    /api/tfd/enums/destinos
GET    /api/tfd/enums/veiculos
GET    /api/tfd/enums/motoristas
```

#### Frontend

**Páginas:**
```
/admin/apps/saude/tfd
  ├── page.tsx                              → Dashboard
  ├── solicitacoes/page.tsx                 → Lista de solicitações
  ├── configuracoes/
  │   ├── especialidades/page.tsx           → Gerenciar especialidades
  │   └── destinos/page.tsx                 → Gerenciar destinos
  └── frota/
      ├── veiculos/page.tsx                 → Gerenciar veículos
      └── motoristas/page.tsx               → Gerenciar motoristas
```

**Hooks:**
```typescript
useAppEnums('tfd', 'especialidades')  → Buscar especialidades
useTFDEspecialidades()                → Atalho específico
useTFDVeiculos({ status: 'DISPONIVEL' })  → Veículos disponíveis
```

#### Formulário de Serviço

```typescript
// Serviço "Encaminhamento TFD"
formSchema: [
  {
    type: 'select',
    name: 'especialidade',
    label: 'Especialidade Médica *',
    enumSource: '/api/tfd/enums/especialidades',
    enumValueField: 'nome',
    enumLabelField: 'nome',
    required: true
  },
  {
    type: 'select',
    name: 'cidadeDestino',
    label: 'Cidade de Destino *',
    enumSource: '/api/tfd/enums/destinos',
    enumValueField: (item) => `${item.cidade} - ${item.estado}`,
    enumLabelField: (item) =>
      `${item.cidade} - ${item.estado} ${item.hospital ? `(${item.hospital})` : ''}`,
    required: true
  }
]
```

---

## 🎨 Padrões e Convenções

### Nomenclatura

| Item | Padrão | Exemplo |
|------|--------|---------|
| Tabela | `{entidade}_{app}` | `especialidades_tfd` |
| Model Prisma | `{Entidade}{APP}` | `EspecialidadeTFD` |
| Service | `{APP}Service` | `TFDService` |
| Routes | `{app}.routes.ts` | `tfd.routes.ts` |
| Hook | `use{APP}{Entidade}` | `useTFDEspecialidades` |
| Página | `{entidade}/page.tsx` | `especialidades/page.tsx` |

### Estrutura de Arquivos

```
backend/
  prisma/
    schema.prisma              → Modelos do APP
    seeds/
      {app}-inicial.seed.ts    → Dados iniciais
    migrations/
      create_{app}_tables.sql  → SQL de criação
  src/
    services/
      {app}/
        {app}.service.ts       → Lógica de negócio
    routes/
      {app}.routes.ts          → Endpoints REST

frontend/
  hooks/
    use{APP}{Entidade}.ts      → Hooks específicos
    useAppEnums.ts             → Hook genérico
  app/admin/apps/
    {secretaria}/
      {app}/
        page.tsx               → Dashboard
        configuracoes/
          {entidade}/
            page.tsx           → CRUD páginas
```

### Status Codes HTTP

```
200 OK           → GET, PUT, DELETE bem-sucedidos
201 Created      → POST bem-sucedido
400 Bad Request  → Dados inválidos
404 Not Found    → Recurso não encontrado
500 Server Error → Erro interno
```

### Soft Delete

Sempre use `ativo: Boolean` em vez de deletar:

```typescript
// ❌ NÃO fazer
await prisma.especialidade.delete({ where: { id } });

// ✅ Fazer
await prisma.especialidade.update({
  where: { id },
  data: { ativo: false }
});
```

---

## ✅ Checklist de Implementação

Use esta checklist ao implementar um novo APP:

### Backend

- [ ] **Modelos Prisma criados**
  - [ ] Campos `ativo`, `createdAt`, `updatedAt`
  - [ ] Índices em campos de busca
  - [ ] `@@map()` para snake_case

- [ ] **Service criado**
  - [ ] CRUD completo: `listar`, `findById`, `create`, `update`, `delete`
  - [ ] Soft delete implementado
  - [ ] Filtros opcionais

- [ ] **Rotas criadas**
  - [ ] GET, POST, PUT, DELETE
  - [ ] Tratamento de erros
  - [ ] Status codes corretos

- [ ] **Endpoint de enums criado**
  - [ ] `/api/{app}/enums/:entity`
  - [ ] Suporte a filtros
  - [ ] Todas entidades incluídas

- [ ] **Seeds criados**
  - [ ] Dados iniciais relevantes
  - [ ] `upsert` para evitar duplicatas

### Frontend

- [ ] **Hooks criados**
  - [ ] `useAppEnums` genérico
  - [ ] Hooks específicos (`use{APP}{Entidade}`)

- [ ] **Páginas de CRUD criadas**
  - [ ] Listagem com tabela
  - [ ] Modal/Form de criação/edição
  - [ ] Confirmação de exclusão
  - [ ] Toasts de feedback

- [ ] **Dashboard do APP criado**
  - [ ] Busca protocolos via `/api/protocols`
  - [ ] Mapeia `customData`
  - [ ] Estatísticas calculadas

- [ ] **Listagem de protocolos criada**
  - [ ] Filtros (status, busca)
  - [ ] Paginação
  - [ ] Link para detalhes

### Integração

- [ ] **formSchema atualizado**
  - [ ] `enumSource` em vez de `options`
  - [ ] `enumValueField` e `enumLabelField` corretos

- [ ] **Testes realizados**
  - [ ] CRUD funcionando
  - [ ] Enums populando formulários
  - [ ] Protocolos sendo criados
  - [ ] APP exibindo protocolos

---

## 🆘 Troubleshooting

### Problema: Enums não aparecem no formulário

**Sintomas:**
- Campo de select vazio
- Erro no console do browser

**Soluções:**
1. Verificar se endpoint `/api/{app}/enums/{entity}` responde:
   ```bash
   curl http://localhost:3001/api/tfd/enums/especialidades
   ```

2. Verificar se há dados no banco:
   ```bash
   npx prisma studio
   # Abrir tabela especialidades_tfd
   ```

3. Verificar se `enumSource` está correto no formSchema:
   ```typescript
   enumSource: '/api/tfd/enums/especialidades', // ← verificar URL
   ```

### Problema: Protocolo não aparece no APP

**Sintomas:**
- Dashboard mostra 0 solicitações
- Protocolo existe no banco

**Soluções:**
1. Verificar `moduleType` do protocolo:
   ```sql
   SELECT "moduleType" FROM "ProtocolSimplified" WHERE number = '2025-XXXXX';
   -- Deve ser: ENCAMINHAMENTOS_TFD
   ```

2. Verificar filtro na busca:
   ```typescript
   // Deve incluir moduleType correto
   fetch('/api/protocols?moduleType=ENCAMINHAMENTOS_TFD')
   ```

3. Verificar mapeamento de `customData`:
   ```typescript
   // customData pode estar null ou vazio
   const customData = protocol.customData || {};
   ```

### Problema: Tabelas não existem no banco

**Sintomas:**
- Erro: `The table does not exist`

**Soluções:**
1. Executar SQL de criação:
   ```bash
   psql -U postgres -d digiurban -f prisma/migrations/create_{app}_tables.sql
   ```

2. Ou via Prisma:
   ```bash
   npx prisma db push --accept-data-loss
   ```

3. Regenerar Prisma Client:
   ```bash
   npx prisma generate
   ```

### Problema: Seed falha

**Sintomas:**
- Erro de chave única
- Erro de tabela não existe

**Soluções:**
1. Verificar se tabelas existem primeiro
2. Usar `upsert` em vez de `create`
3. Verificar constraints de unique:
   ```typescript
   await prisma.especialidadeTFD.upsert({
     where: { nome: esp.nome }, // ← campo unique
     update: {},
     create: esp,
   });
   ```

---

## 🚀 Próximos APPs a Implementar

Seguindo este guia, implemente os demais APPs:

| Secretaria | APP | Entidades Principais |
|------------|-----|---------------------|
| Saúde | CRAS | Programas, Benefícios, Encaminhamentos |
| Saúde | Farmácia | Medicamentos, Estoque, Dispensações |
| Educação | Transporte Escolar | Rotas, Veículos, Motoristas |
| Educação | Merenda Escolar | Cardápios, Fornecedores, Estoque |
| Obras | Fiscalização | Tipos de Obra, Status, Equipes |
| Agricultura | Máquinas Agrícolas | Máquinas, Manutenções, Agendamentos |

**Para cada APP, repita as 6 fases deste guia!**

---

## 📚 Referências

- [Documentação Prisma](https://www.prisma.io/docs)
- [REST API Best Practices](https://restfulapi.net/)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

## 📝 Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2025-01-XX | Versão inicial - Piloto APP TFD completo |

---

**Desenvolvido por:** Claude Code
**Projeto:** DigiUrban - Sistema Super App Municipal
**Piloto:** APP TFD (Tratamento Fora do Domicílio)
