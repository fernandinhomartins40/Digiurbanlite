# Componentes Selectors - Cadastros de Saúde

Este diretório contém componentes reutilizáveis (Selectors) para seleção de entidades cadastradas no sistema de saúde. Todos os componentes seguem o mesmo padrão de design e funcionalidade do `CidadaoSelector`.

## Componentes Disponíveis

### 1. UnidadeSaudeSelector
Seletor de unidades de saúde com busca por nome ou CNES.

**Props:**
- `onSelect: (unidade: UnidadeSaude | null) => void` - Callback quando uma unidade é selecionada
- `selectedUnidade?: UnidadeSaude | null` - Unidade atualmente selecionada
- `label?: string` - Label do campo (padrão: "Buscar Unidade de Saúde")
- `required?: boolean` - Se o campo é obrigatório (padrão: true)
- `tipo?: string` - Filtrar por tipo (UBS, UPA, HOSPITAL, etc.)

**Exemplo de uso:**
```tsx
import { UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';

<UnidadeSaudeSelector
  onSelect={(unidade) => setUnidadeSelecionada(unidade)}
  selectedUnidade={unidadeSelecionada}
  tipo="UBS" // Opcional: filtrar apenas UBS
/>
```

**API:** `GET /api/apps/saude/cadastros/unidades?search={term}&tipo={tipo}`

---

### 2. ProfissionalSaudeSelector
Seletor de profissionais de saúde com busca por nome, CPF ou registro profissional.

**Props:**
- `onSelect: (profissional: ProfissionalSaude | null) => void` - Callback quando um profissional é selecionado
- `selectedProfissional?: ProfissionalSaude | null` - Profissional atualmente selecionado
- `label?: string` - Label do campo (padrão: "Buscar Profissional de Saúde")
- `required?: boolean` - Se o campo é obrigatório (padrão: true)
- `categoria?: string` - Filtrar por categoria (MEDICO, ENFERMEIRO, etc.)

**Exemplo de uso:**
```tsx
import { ProfissionalSaudeSelector } from '@/components/apps/saude/cadastros';

<ProfissionalSaudeSelector
  onSelect={(prof) => setProfissionalSelecionado(prof)}
  selectedProfissional={profissionalSelecionado}
  categoria="MEDICO" // Opcional: filtrar apenas médicos
/>
```

**API:** `GET /api/apps/saude/cadastros/profissionais?search={term}&categoria={categoria}&status=ATIVO`

---

### 3. EspecialidadeSelector
Seletor de especialidades médicas com suporte para seleção múltipla.

**Props:**
- `onSelect: (especialidade: Especialidade | Especialidade[] | null) => void` - Callback quando especialidade(s) é(são) selecionada(s)
- `selectedEspecialidade?: Especialidade | Especialidade[] | null` - Especialidade(s) atualmente selecionada(s)
- `label?: string` - Label do campo (padrão: "Buscar Especialidade")
- `required?: boolean` - Se o campo é obrigatório (padrão: true)
- `multiple?: boolean` - Permitir seleção múltipla (padrão: false)

**Exemplo de uso:**
```tsx
import { EspecialidadeSelector } from '@/components/apps/saude/cadastros';

// Seleção única
<EspecialidadeSelector
  onSelect={(esp) => setEspecialidade(esp)}
  selectedEspecialidade={especialidade}
/>

// Seleção múltipla
<EspecialidadeSelector
  onSelect={(esps) => setEspecialidades(esps)}
  selectedEspecialidade={especialidades}
  multiple={true}
/>
```

**API:** `GET /api/apps/saude/cadastros/especialidades?search={term}`

---

### 4. SalaSelector
Seletor de salas/consultórios com filtro por unidade e tipo.

**Props:**
- `onSelect: (sala: Sala | null) => void` - Callback quando uma sala é selecionada
- `selectedSala?: Sala | null` - Sala atualmente selecionada
- `label?: string` - Label do campo (padrão: "Buscar Sala")
- `required?: boolean` - Se o campo é obrigatório (padrão: true)
- `unidadeId?: string` - **OBRIGATÓRIO** - ID da unidade para filtrar salas
- `tipo?: string` - Filtrar por tipo (CONSULTORIO, CIRURGICA, etc.)

**Exemplo de uso:**
```tsx
import { SalaSelector } from '@/components/apps/saude/cadastros';

<SalaSelector
  onSelect={(sala) => setSalaSelecionada(sala)}
  selectedSala={salaSelecionada}
  unidadeId={unidadeSelecionada?.id} // Obrigatório!
  tipo="CONSULTORIO" // Opcional
/>
```

**API:** `GET /api/apps/saude/cadastros/salas?unidadeId={unidadeId}&tipo={tipo}&search={term}`

---

### 5. TurnoSelector
Seletor de turnos de trabalho com interface dropdown.

**Props:**
- `onSelect: (turno: Turno | null) => void` - Callback quando um turno é selecionado
- `selectedTurno?: Turno | null` - Turno atualmente selecionado
- `label?: string` - Label do campo (padrão: "Selecionar Turno")
- `required?: boolean` - Se o campo é obrigatório (padrão: true)

**Exemplo de uso:**
```tsx
import { TurnoSelector } from '@/components/apps/saude/cadastros';

<TurnoSelector
  onSelect={(turno) => setTurnoSelecionado(turno)}
  selectedTurno={turnoSelecionado}
/>
```

**API:** `GET /api/apps/saude/cadastros/turnos?ativo=true`

---

## Características Comuns

Todos os componentes compartilham:

### 1. Padrão Visual Consistente
- Card azul quando item está selecionado
- Ícone específico para cada tipo de entidade
- Badges coloridos para categorias/status
- Botão X para limpar seleção

### 2. Funcionalidades
- **Debounce**: 500ms em todas as buscas (exceto TurnoSelector que carrega todos)
- **Loading states**: Spinner durante carregamento
- **Error handling**: Tratamento de erros de API
- **Acessibilidade**: ARIA labels em todos os elementos interativos
- **Responsivo**: Funciona em mobile e desktop

### 3. Busca Inteligente
- Mínimo de caracteres antes de buscar (3 chars na maioria, 2 no EspecialidadeSelector)
- Busca automática com debounce
- Limpeza de resultados ao apagar busca

### 4. TypeScript
- Interfaces totalmente tipadas
- Exportadas para reutilização
- Props bem documentadas

## Importação Centralizada

Use o arquivo `index.ts` para importar múltiplos componentes:

```tsx
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  EspecialidadeSelector,
  SalaSelector,
  TurnoSelector,
} from '@/components/apps/saude/cadastros';

// Importar tipos também
import type {
  UnidadeSaude,
  ProfissionalSaude,
  Especialidade,
  Sala,
  Turno,
} from '@/components/apps/saude/cadastros';
```

## Exemplo de Uso Completo

```tsx
'use client';

import { useState } from 'react';
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  SalaSelector,
  TurnoSelector,
  type UnidadeSaude,
  type ProfissionalSaude,
  type Sala,
  type Turno,
} from '@/components/apps/saude/cadastros';

export function AgendamentoForm() {
  const [unidade, setUnidade] = useState<UnidadeSaude | null>(null);
  const [profissional, setProfissional] = useState<ProfissionalSaude | null>(null);
  const [sala, setSala] = useState<Sala | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);

  return (
    <form className="space-y-4">
      <UnidadeSaudeSelector
        onSelect={setUnidade}
        selectedUnidade={unidade}
        tipo="UBS"
      />

      <ProfissionalSaudeSelector
        onSelect={setProfissional}
        selectedProfissional={profissional}
        categoria="MEDICO"
      />

      {unidade && (
        <SalaSelector
          onSelect={setSala}
          selectedSala={sala}
          unidadeId={unidade.id}
          tipo="CONSULTORIO"
        />
      )}

      <TurnoSelector
        onSelect={setTurno}
        selectedTurno={turno}
      />
    </form>
  );
}
```

## Dependências

Todos os componentes utilizam:
- **React**: `useState`, `useEffect`
- **Lucide Icons**: Ícones específicos para cada componente
- **shadcn/ui**: `Input`, `Button`, `Card`, `Badge`, `Label`

## Padrões de Cor

### Tipos de Unidade
- UBS: Verde
- UPA: Amarelo
- Hospital: Azul
- Clínica: Roxo
- Pronto Socorro: Vermelho
- CAPS: Índigo
- Laboratório: Rosa

### Status de Profissional
- Ativo: Verde
- Férias: Amarelo
- Afastado: Vermelho
- Licença: Laranja
- Inativo: Cinza

### Tipos de Sala
- Consultório: Azul
- Cirúrgica: Vermelho
- Emergência: Laranja
- Exames: Verde
- Internação: Roxo
- Procedimentos: Amarelo
- Observação: Índigo
- Enfermagem: Rosa
- Odontologia: Ciano
- Vacina: Teal

## Notas Importantes

1. **SalaSelector** requer `unidadeId` para funcionar
2. **EspecialidadeSelector** pode retornar array ou objeto único dependendo da prop `multiple`
3. **TurnoSelector** carrega todos os turnos ativos de uma vez (sem paginação)
4. Todos os componentes chamam `onSelect(null)` ao limpar seleção
5. As APIs devem retornar objetos no formato esperado pelas interfaces
