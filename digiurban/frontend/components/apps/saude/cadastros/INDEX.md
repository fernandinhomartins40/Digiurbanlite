# Índice - Selectors de Cadastros de Saúde

> Componentes reutilizáveis para seleção de entidades cadastradas no sistema de saúde

---

## Início Rápido

```tsx
// Importar componentes
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  EspecialidadeSelector,
  SalaSelector,
  TurnoSelector,
} from '@/components/apps/saude/cadastros';

// Usar no componente
<UnidadeSaudeSelector onSelect={setUnidade} selectedUnidade={unidade} />
```

---

## Documentação

### Leitura Recomendada

1. **[README.md](./README.md)** - Comece aqui!
   - Documentação completa de todos os componentes
   - Props detalhadas
   - Exemplos de uso
   - Características comuns

2. **[ESTRUTURA.md](./ESTRUTURA.md)** - Visão geral
   - Estrutura do projeto
   - Fluxos de uso típicos
   - Checklist de implementação
   - Notas de manutenção

3. **[ExemploUso.tsx](./ExemploUso.tsx)** - Exemplos práticos
   - Componente demonstrativo funcional
   - Uso de todos os selectors juntos
   - Dicas de implementação

---

## Componentes

### Selectors Disponíveis

| Componente | Arquivo | Linhas | Descrição |
|------------|---------|--------|-----------|
| **UnidadeSaudeSelector** | [UnidadeSaudeSelector.tsx](./UnidadeSaudeSelector.tsx) | 256 | Seletor de unidades de saúde (UBS, UPA, Hospital) |
| **ProfissionalSaudeSelector** | [ProfissionalSaudeSelector.tsx](./ProfissionalSaudeSelector.tsx) | 287 | Seletor de profissionais de saúde |
| **EspecialidadeSelector** | [EspecialidadeSelector.tsx](./EspecialidadeSelector.tsx) | 300 | Seletor de especialidades médicas |
| **SalaSelector** | [SalaSelector.tsx](./SalaSelector.tsx) | 337 | Seletor de salas/consultórios |
| **TurnoSelector** | [TurnoSelector.tsx](./TurnoSelector.tsx) | 275 | Seletor de turnos de trabalho |

---

## Utilitários

### Arquivos de Suporte

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| **[index.ts](./index.ts)** | 15 | Exportações centralizadas |
| **[constants.ts](./constants.ts)** | 320 | Constantes, enums e funções utilitárias |
| **[types.test.ts](./types.test.ts)** | 220 | Validação de tipos TypeScript |

---

## Guia Visual

### Fluxo de Importação

```
┌─────────────────────────────────────────────────────────────┐
│  Seu Componente                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  import { UnidadeSaudeSelector }                       │ │
│  │  from '@/components/apps/saude/cadastros';             │ │
│  │                                                         │ │
│  │  export function MeuForm() {                           │ │
│  │    const [unidade, setUnidade] = useState(null);       │ │
│  │    return (                                            │ │
│  │      <UnidadeSaudeSelector                             │ │
│  │        onSelect={setUnidade}                           │ │
│  │        selectedUnidade={unidade}                       │ │
│  │      />                                                │ │
│  │    );                                                  │ │
│  │  }                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  index.ts (Exportações)                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  export { UnidadeSaudeSelector }                       │ │
│  │  from './UnidadeSaudeSelector';                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  UnidadeSaudeSelector.tsx                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Busca por nome/CNES                                 │ │
│  │  - Debounce 500ms                                      │ │
│  │  - Filtro por tipo                                     │ │
│  │  - Badge colorido                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  API Backend                                                │
│  GET /api/apps/saude/cadastros/unidades?search=...         │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependências entre Componentes

```
UnidadeSaudeSelector ─────┐
                          │
                          ├──> SalaSelector
                          │    (requer unidadeId)
                          │
ProfissionalSaudeSelector │
                          │
EspecialidadeSelector ────┤
                          │
TurnoSelector ────────────┘

                (todos independentes, exceto SalaSelector)
```

---

## Casos de Uso

### 1. Agendamento de Consulta
```tsx
UnidadeSaudeSelector (UBS)
    ↓
ProfissionalSaudeSelector (Médico)
    ↓
SalaSelector (Consultório)
    ↓
TurnoSelector (Manhã)
```

### 2. Cadastro de Profissional
```tsx
UnidadeSaudeSelector (Unidade de Lotação)
    ↓
EspecialidadeSelector (múltiplas)
    ↓
TurnoSelector (Turno de Trabalho)
```

### 3. Agendamento de Cirurgia
```tsx
UnidadeSaudeSelector (Hospital)
    ↓
ProfissionalSaudeSelector (Cirurgião)
    ↓
EspecialidadeSelector (Especialidade Cirúrgica)
    ↓
SalaSelector (Sala Cirúrgica)
    ↓
TurnoSelector (Turno)
```

---

## APIs Requeridas

Cada componente espera um endpoint específico:

| Componente | Endpoint | Método |
|------------|----------|--------|
| UnidadeSaudeSelector | `/api/apps/saude/cadastros/unidades` | GET |
| ProfissionalSaudeSelector | `/api/apps/saude/cadastros/profissionais` | GET |
| EspecialidadeSelector | `/api/apps/saude/cadastros/especialidades` | GET |
| SalaSelector | `/api/apps/saude/cadastros/salas` | GET |
| TurnoSelector | `/api/apps/saude/cadastros/turnos` | GET |

### Parâmetros de Query Comuns

- `search` - Termo de busca
- `tipo` - Filtro por tipo (depende do componente)
- `categoria` - Filtro por categoria (ProfissionalSaudeSelector)
- `unidadeId` - Filtro por unidade (SalaSelector)
- `status` - Filtro por status
- `ativo` - Apenas registros ativos (TurnoSelector)

---

## Padrões de Resposta da API

### Formato Esperado

```json
{
  "unidades": [...],        // UnidadeSaudeSelector
  "profissionais": [...],   // ProfissionalSaudeSelector
  "especialidades": [...],  // EspecialidadeSelector
  "salas": [...],           // SalaSelector
  "turnos": [...]           // TurnoSelector
}
```

### Exemplo: Unidade de Saúde

```json
{
  "unidades": [
    {
      "id": "1",
      "nome": "UBS Central",
      "cnes": "1234567",
      "tipo": "UBS",
      "endereco": "Rua Teste, 123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "telefone": "(11) 1234-5678"
    }
  ]
}
```

---

## Características Técnicas

### TypeScript
- ✅ Interfaces totalmente tipadas
- ✅ Props bem definidas
- ✅ Tipos exportados para reuso
- ✅ Validação de tipos com `types.test.ts`

### Acessibilidade
- ✅ ARIA labels em todos os elementos
- ✅ Navegação por teclado
- ✅ Foco gerenciado
- ✅ Screen reader friendly

### Performance
- ✅ Debounce de 500ms
- ✅ Mínimo de caracteres antes de buscar
- ✅ Limpeza de timeouts
- ✅ Otimização de re-renders

### UX
- ✅ Loading states visuais
- ✅ Error handling gracioso
- ✅ Feedback visual imediato
- ✅ Limpeza fácil de seleção

---

## Checklist de Implementação

### Antes de Começar
- [ ] Ler `README.md` completo
- [ ] Verificar estrutura em `ESTRUTURA.md`
- [ ] Explorar `ExemploUso.tsx`

### Durante Implementação
- [ ] Importar componentes necessários
- [ ] Criar estados com `useState`
- [ ] Implementar callbacks `onSelect`
- [ ] Validar campos obrigatórios

### Dependências
- [ ] Instalar shadcn/ui components
- [ ] Instalar lucide-react
- [ ] Configurar Tailwind CSS

### Testes
- [ ] Testar busca e debounce
- [ ] Testar seleção e limpeza
- [ ] Testar em mobile
- [ ] Validar tipos com `tsc --noEmit`

### Produção
- [ ] Implementar APIs backend
- [ ] Configurar error handling
- [ ] Adicionar logging
- [ ] Monitorar performance

---

## Comandos Úteis

```bash
# Validar tipos TypeScript
tsc --noEmit

# Contar linhas de código
find . -name "*.tsx" -o -name "*.ts" | xargs wc -l

# Buscar uso de um componente
grep -r "UnidadeSaudeSelector" ../..

# Listar todos os arquivos
ls -lh
```

---

## Suporte e Recursos

### Documentação
- **README.md** - Documentação completa
- **ESTRUTURA.md** - Estrutura e fluxos
- **INDEX.md** - Este arquivo

### Exemplos
- **ExemploUso.tsx** - Componente demonstrativo

### Código
- **constants.ts** - Constantes e utilitários
- **types.test.ts** - Validação de tipos

### Componentes
- **5 Selectors** - Prontos para uso

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| **Componentes** | 5 |
| **Arquivos totais** | 11 |
| **Linhas de código** | ~2.247 |
| **Linhas de documentação** | ~850 |
| **Interfaces TypeScript** | 10+ |
| **Constantes definidas** | 50+ |
| **Funções utilitárias** | 6 |

---

## Roadmap

### Versão 1.0 (Atual)
- ✅ 5 componentes selectors
- ✅ Documentação completa
- ✅ Exemplo de uso
- ✅ Tipos TypeScript
- ✅ Constantes e utilitários

### Versão 1.1 (Futuro)
- [ ] Testes unitários
- [ ] Storybook
- [ ] Cache de resultados
- [ ] Histórico de seleções

### Versão 2.0 (Planejado)
- [ ] Modo offline
- [ ] Sincronização
- [ ] Favoritos do usuário
- [ ] Sugestões inteligentes

---

## Contato

Para dúvidas, sugestões ou problemas:
1. Consulte a documentação completa
2. Verifique os exemplos de uso
3. Valide os tipos TypeScript
4. Teste com o componente de exemplo

---

**Criado em:** 2026-01-29
**Versão:** 1.0.0
**Status:** Pronto para uso

---

## Links Rápidos

- [README.md](./README.md) - Documentação principal
- [ESTRUTURA.md](./ESTRUTURA.md) - Estrutura do projeto
- [ExemploUso.tsx](./ExemploUso.tsx) - Exemplos práticos
- [constants.ts](./constants.ts) - Constantes e utilitários
- [types.test.ts](./types.test.ts) - Validação de tipos

---

🎯 **Dica:** Comece pelo `README.md` e depois explore o `ExemploUso.tsx`!
