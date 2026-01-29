# Estrutura do Diretório Cadastros

## Visão Geral

```
frontend/components/apps/saude/cadastros/
├── UnidadeSaudeSelector.tsx       (256 linhas) - Selector de Unidades de Saúde
├── ProfissionalSaudeSelector.tsx  (287 linhas) - Selector de Profissionais
├── EspecialidadeSelector.tsx      (300 linhas) - Selector de Especialidades
├── SalaSelector.tsx               (337 linhas) - Selector de Salas
├── TurnoSelector.tsx              (275 linhas) - Selector de Turnos
├── index.ts                       (15 linhas)  - Exportações centralizadas
├── constants.ts                   (320 linhas) - Constantes e utilitários
├── types.test.ts                  (220 linhas) - Testes de tipos TypeScript
├── ExemploUso.tsx                 (245 linhas) - Componente de exemplo
├── README.md                      (287 linhas) - Documentação completa
└── ESTRUTURA.md                   (este arquivo) - Estrutura do projeto
```

**Total:** 10 arquivos | ~2.542 linhas de código

---

## Componentes Principais

### 1. UnidadeSaudeSelector.tsx
**Função:** Seletor de unidades de saúde (UBS, UPA, Hospitais, etc.)

**Características:**
- Busca por nome ou CNES
- Filtro opcional por tipo
- Badge colorido por tipo de unidade
- Exibição de endereço e telefone

**API:** `/api/apps/saude/cadastros/unidades`

**Props principais:**
- `onSelect` - Callback de seleção
- `selectedUnidade` - Unidade selecionada
- `tipo` - Filtro de tipo (opcional)

---

### 2. ProfissionalSaudeSelector.tsx
**Função:** Seletor de profissionais de saúde

**Características:**
- Busca por nome, CPF ou registro profissional
- Filtro opcional por categoria
- Badge de status (Ativo, Férias, Afastado)
- Exibição de especialidades

**API:** `/api/apps/saude/cadastros/profissionais`

**Props principais:**
- `onSelect` - Callback de seleção
- `selectedProfissional` - Profissional selecionado
- `categoria` - Filtro de categoria (opcional)

---

### 3. EspecialidadeSelector.tsx
**Função:** Seletor de especialidades médicas

**Características:**
- **Seleção única ou múltipla**
- Busca por nome (mínimo 2 caracteres)
- Badge colorido por área
- Exibição de tempo médio de consulta

**API:** `/api/apps/saude/cadastros/especialidades`

**Props principais:**
- `onSelect` - Callback de seleção
- `selectedEspecialidade` - Especialidade(s) selecionada(s)
- `multiple` - Habilitar seleção múltipla

---

### 4. SalaSelector.tsx
**Função:** Seletor de salas/consultórios

**Características:**
- **Requer unidadeId para funcionar**
- Busca por nome ou número
- Filtro opcional por tipo
- Badge de status e tipo
- Exibição de capacidade e equipamentos

**API:** `/api/apps/saude/cadastros/salas`

**Props principais:**
- `onSelect` - Callback de seleção
- `selectedSala` - Sala selecionada
- `unidadeId` - **OBRIGATÓRIO** - ID da unidade
- `tipo` - Filtro de tipo (opcional)

---

### 5. TurnoSelector.tsx
**Função:** Seletor de turnos de trabalho

**Características:**
- Interface dropdown (não autocomplete)
- Carrega todos os turnos ativos
- Badge colorido por turno
- Ícones intuitivos (🌅 manhã, 🌤️ tarde, 🌙 noite)

**API:** `/api/apps/saude/cadastros/turnos`

**Props principais:**
- `onSelect` - Callback de seleção
- `selectedTurno` - Turno selecionado

---

## Arquivos de Suporte

### index.ts
**Função:** Exportações centralizadas

Permite importar múltiplos componentes em uma única linha:
```tsx
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  // ... outros
} from '@/components/apps/saude/cadastros';
```

---

### constants.ts
**Função:** Constantes, enums e funções utilitárias

**Conteúdo:**
- Tipos de unidades de saúde
- Categorias de profissionais
- Status de profissionais e salas
- Tipos de salas
- Áreas de especialidades
- Cores padronizadas (badges)
- Funções de formatação:
  - `formatCPF()`
  - `formatCNES()`
  - `formatCNS()`
  - `formatHora()`
  - `formatTempo()`
  - `calculateAge()`

**Uso:**
```tsx
import { TIPOS_UNIDADE, formatCPF } from '@/components/apps/saude/cadastros/constants';

const cpfFormatado = formatCPF('12345678900'); // "123.456.789-00"
```

---

### types.test.ts
**Função:** Validação de tipos TypeScript

**Características:**
- Não é executável (apenas validação de tipos)
- Garante que interfaces estão corretas
- Testa compatibilidade entre tipos
- Valida campos obrigatórios e opcionais

**Uso:**
```bash
# Verificar tipos
tsc --noEmit
```

---

### ExemploUso.tsx
**Função:** Componente de exemplo demonstrativo

**Características:**
- Demonstra uso de todos os selectors
- Exemplos de seleção única e múltipla
- Validação de dependências entre selectors
- Dicas de implementação

**Nota:** Apenas para referência, não usar em produção

---

### README.md
**Função:** Documentação completa dos componentes

**Conteúdo:**
- Descrição de cada componente
- Props detalhadas
- Exemplos de uso
- Características comuns
- Padrões de cor
- Guia de importação

---

## Fluxo de Uso Típico

### Cenário 1: Agendamento de Consulta

```tsx
import { useState } from 'react';
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  SalaSelector,
  TurnoSelector,
} from '@/components/apps/saude/cadastros';

function AgendamentoConsulta() {
  const [unidade, setUnidade] = useState(null);
  const [profissional, setProfissional] = useState(null);
  const [sala, setSala] = useState(null);
  const [turno, setTurno] = useState(null);

  return (
    <>
      {/* 1. Selecionar UBS */}
      <UnidadeSaudeSelector
        onSelect={setUnidade}
        selectedUnidade={unidade}
        tipo="UBS"
      />

      {/* 2. Selecionar Médico */}
      <ProfissionalSaudeSelector
        onSelect={setProfissional}
        selectedProfissional={profissional}
        categoria="MEDICO"
      />

      {/* 3. Selecionar Consultório (depende de unidade) */}
      {unidade && (
        <SalaSelector
          onSelect={setSala}
          selectedSala={sala}
          unidadeId={unidade.id}
          tipo="CONSULTORIO"
        />
      )}

      {/* 4. Selecionar Turno */}
      <TurnoSelector
        onSelect={setTurno}
        selectedTurno={turno}
      />
    </>
  );
}
```

---

### Cenário 2: Cadastro de Profissional

```tsx
import { useState } from 'react';
import {
  UnidadeSaudeSelector,
  EspecialidadeSelector,
  TurnoSelector,
} from '@/components/apps/saude/cadastros';

function CadastroProfissional() {
  const [unidadeLotacao, setUnidadeLotacao] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [turno, setTurno] = useState(null);

  return (
    <>
      {/* Unidade de Lotação */}
      <UnidadeSaudeSelector
        onSelect={setUnidadeLotacao}
        selectedUnidade={unidadeLotacao}
        label="Unidade de Lotação"
      />

      {/* Especialidades (múltiplas) */}
      <EspecialidadeSelector
        onSelect={setEspecialidades}
        selectedEspecialidade={especialidades}
        multiple={true}
        label="Especialidades do Profissional"
      />

      {/* Turno de Trabalho */}
      <TurnoSelector
        onSelect={setTurno}
        selectedTurno={turno}
        label="Turno de Trabalho"
      />
    </>
  );
}
```

---

## Dependências

### Bibliotecas Externas
- **React**: `useState`, `useEffect`
- **Lucide Icons**: Ícones SVG
- **shadcn/ui**: Componentes de UI

### Componentes shadcn/ui Utilizados
- `Input` - Campo de busca
- `Button` - Botões de ação
- `Card` / `CardContent` - Cards de exibição
- `Badge` - Badges coloridos
- `Label` - Labels de formulário

---

## Padrão de Design

### Visual
- Cards azuis para itens selecionados
- Ícones específicos para cada tipo
- Badges coloridos por categoria/status
- Botão X para limpar seleção
- Loading spinner durante busca

### Funcional
- Debounce de 500ms em buscas
- Mínimo de caracteres antes de buscar
- Error handling automático
- Acessibilidade (ARIA labels)
- Responsivo (mobile-first)

### Código
- TypeScript strict mode
- Interfaces exportadas
- Props bem documentadas
- Código limpo e comentado

---

## Checklist de Implementação

Ao usar estes componentes, certifique-se de:

- [ ] Importar os componentes necessários de `@/components/apps/saude/cadastros`
- [ ] Criar estados com `useState` para armazenar seleções
- [ ] Implementar callbacks `onSelect` para capturar seleções
- [ ] Validar campos obrigatórios antes de submeter
- [ ] Para `SalaSelector`, sempre passar `unidadeId`
- [ ] Para `EspecialidadeSelector`, definir se é `multiple` ou não
- [ ] Implementar tratamento de erros nas APIs
- [ ] Testar responsividade em mobile

---

## Notas de Manutenção

### Adicionar Novo Tipo
1. Adicionar constante em `constants.ts`
2. Adicionar label em `*_LABELS`
3. Adicionar cor em `*_COLORS`

### Adicionar Nova Propriedade
1. Atualizar interface em `[Componente].tsx`
2. Atualizar tipo em `types.test.ts`
3. Atualizar documentação no `README.md`

### Modificar API Endpoint
1. Atualizar URL no componente
2. Atualizar documentação no `README.md`
3. Atualizar exemplo em `ExemploUso.tsx`

---

## Métricas

### Tamanho dos Componentes
- **Menor:** UnidadeSaudeSelector (256 linhas)
- **Maior:** SalaSelector (337 linhas)
- **Média:** ~290 linhas por componente

### Complexidade
- **Simples:** UnidadeSaudeSelector, TurnoSelector
- **Médio:** ProfissionalSaudeSelector
- **Avançado:** EspecialidadeSelector (seleção múltipla), SalaSelector (dependência de unidade)

### Cobertura
- ✅ Interfaces TypeScript completas
- ✅ Acessibilidade (ARIA)
- ✅ Responsividade
- ✅ Error handling
- ✅ Loading states
- ✅ Documentação completa

---

## Próximos Passos

1. **Implementar APIs Backend**
   - Criar endpoints em `/api/apps/saude/cadastros/`
   - Implementar busca com filtros
   - Adicionar paginação se necessário

2. **Testes Unitários**
   - Criar testes com Jest/React Testing Library
   - Testar busca e debounce
   - Testar seleção e limpeza

3. **Storybook** (opcional)
   - Criar stories para cada componente
   - Documentar variações visuais

4. **Melhorias Futuras**
   - Cache de resultados de busca
   - Histórico de seleções recentes
   - Favoritos do usuário
   - Modo offline

---

## Suporte

Para dúvidas ou problemas:
1. Consulte o `README.md` para documentação completa
2. Veja `ExemploUso.tsx` para exemplos práticos
3. Verifique `constants.ts` para valores válidos
4. Execute `tsc --noEmit` para validar tipos

---

**Última atualização:** 2026-01-29
**Versão:** 1.0.0
