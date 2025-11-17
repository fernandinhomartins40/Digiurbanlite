# Sistema de Ajuda Inteligente - Digiurban

## 📚 Visão Geral

Sistema de ajuda contextual e didático implementado em toda a aplicação Digiurban. Fornece documentação interativa, tutoriais passo a passo e solução de problemas diretamente na interface.

## 🎯 Objetivos

- Reduzir a complexidade percebida da aplicação
- Fornecer ajuda contextual sem necessidade de documentação externa
- Linguagem didática voltada ao usuário final (servidores públicos)
- Interface visual rica com emojis, ícones e navegação intuitiva

## 📁 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── types/
│   │   └── help-system.ts          # Tipos TypeScript do sistema
│   └── content/
│       └── help/
│           ├── README.md            # Esta documentação
│           ├── workflows-help.ts    # Conteúdo de ajuda para Workflows
│           └── [futuras-páginas].ts # Conteúdos de outras páginas
│
└── components/
    └── common/
        ├── HelpButton.tsx           # Botão de ajuda (flutuante ou inline)
        └── HelpModal.tsx            # Modal principal com conteúdo
```

## 🚀 Como Usar em uma Nova Página

### Passo 1: Criar o Conteúdo de Ajuda

Crie um arquivo em `src/content/help/[nome-da-pagina]-help.ts`:

```typescript
import type { HelpContent } from '@/src/types/help-system'

export const minhaPageHelpContent: HelpContent = {
  pageTitle: 'Central de Ajuda - Minha Página',
  pageDescription: 'Descrição breve do que esta página faz',

  quickTips: [
    'Dica rápida 1',
    'Dica rápida 2',
    'Dica rápida 3'
  ],

  sections: [
    {
      id: 'introducao',
      emoji: '🎯',
      title: 'Introdução',
      description: 'O que é esta funcionalidade',
      steps: [
        {
          id: 'passo-1',
          title: 'Primeiro Passo',
          description: 'Explicação detalhada do que fazer...',
          tips: ['Dica importante'],
          warnings: ['Cuidado com isso']
        }
      ],
      faqs: [
        {
          question: 'Como faço X?',
          answer: 'Você faz X desta forma...'
        }
      ]
    }
  ],

  troubleshooting: [
    {
      problem: 'Erro comum que acontece',
      solution: 'Solução para este erro'
    }
  ]
}
```

### Passo 2: Integrar na Página

```tsx
'use client'

import { useState } from 'react'
import { HelpButton } from '@/components/common/HelpButton'
import { HelpModal } from '@/components/common/HelpModal'
import { minhaPageHelpContent } from '@/src/content/help/minha-page-help'

export default function MinhaPage() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div>
      {/* Header com botão inline */}
      <div className="flex items-center justify-between">
        <h1>Minha Página</h1>
        <HelpButton
          onClick={() => setShowHelp(true)}
          position="inline"
          label="Como usar?"
          size="md"
        />
      </div>

      {/* Conteúdo da página */}
      {/* ... */}

      {/* Modal de ajuda */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        content={minhaPageHelpContent}
      />

      {/* Botão flutuante (opcional) */}
      <HelpButton
        onClick={() => setShowHelp(true)}
        position="fixed"
        label="Precisa de ajuda?"
      />
    </div>
  )
}
```

## 📖 Estrutura do Conteúdo

### HelpContent

```typescript
interface HelpContent {
  pageTitle: string              // Título da central de ajuda
  pageDescription: string         // Descrição da página
  sections: HelpSection[]         // Seções de conteúdo
  quickTips?: string[]            // Dicas rápidas (opcional)
  troubleshooting?: {             // Solução de problemas (opcional)
    problem: string
    solution: string
  }[]
}
```

### HelpSection

```typescript
interface HelpSection {
  id: string                      // ID único da seção
  title: string                   // Título da seção
  emoji: string                   // Emoji representativo (ex: 🔄)
  description: string             // Descrição da seção
  steps: HelpStep[]               // Passos da seção
  faqs?: HelpFAQ[]                // Perguntas frequentes (opcional)
}
```

### HelpStep

```typescript
interface HelpStep {
  id: string                      // ID único do passo
  title: string                   // Título do passo
  description: string             // Descrição detalhada
  icon?: string                   // Ícone (opcional)
  image?: string                  // URL da imagem (opcional)
  videoUrl?: string               // URL do vídeo tutorial (opcional)
  tips?: string[]                 // Dicas importantes (opcional)
  warnings?: string[]             // Avisos/cuidados (opcional)
  relatedLinks?: {                // Links relacionados (opcional)
    label: string
    url: string
  }[]
}
```

### HelpFAQ

```typescript
interface HelpFAQ {
  question: string                // Pergunta
  answer: string                  // Resposta
  relatedSteps?: string[]         // IDs de passos relacionados (opcional)
}
```

## 🎨 Componentes

### HelpButton

Botão de ajuda com 2 modos:

**Modo Inline** (dentro do layout):
```tsx
<HelpButton
  onClick={() => setShowHelp(true)}
  position="inline"
  label="Como usar?"
  size="md"
/>
```

**Modo Fixed** (flutuante no canto inferior direito):
```tsx
<HelpButton
  onClick={() => setShowHelp(true)}
  position="fixed"
  label="Precisa de ajuda?"
  size="lg"
/>
```

Props:
- `onClick`: Função chamada ao clicar
- `position`: `'fixed'` | `'inline'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `label`: Texto do botão/tooltip

### HelpModal

Modal principal que exibe o conteúdo de ajuda:

```tsx
<HelpModal
  isOpen={showHelp}
  onClose={() => setShowHelp(false)}
  content={helpContent}
/>
```

Props:
- `isOpen`: Boolean - se modal está aberto
- `onClose`: Função - callback para fechar
- `content`: HelpContent - conteúdo a exibir

**Recursos:**
- ✅ Busca em tempo real
- ✅ Navegação por abas/seções
- ✅ Expansão de passos (acordeão)
- ✅ Cards com dicas, avisos e links
- ✅ Seção de solução de problemas
- ✅ Design responsivo
- ✅ Animações suaves

## 📝 Boas Práticas

### 1. Linguagem Didática
- Use linguagem simples e direta
- Evite jargões técnicos desnecessários
- Explique siglas na primeira menção
- Use exemplos práticos do dia a dia

### 2. Estruturação
- Divida conteúdo em seções lógicas (5-7 seções ideais)
- 3-5 passos por seção
- Cada passo deve ser autocontido
- Use hierarquia clara (seção → passo → sub-informações)

### 3. Visual
- Use emojis relevantes (1 por seção)
- Adicione dicas importantes em destaque
- Avisos/warnings para cuidados críticos
- Imagens/vídeos para processos complexos

### 4. Perguntas Frequentes
- Base em dúvidas reais dos usuários
- Respostas concisas (2-3 linhas)
- Inclua em todas as seções principais

### 5. Solução de Problemas
- Liste erros comuns primeiro
- Soluções passo a passo
- Links para documentação adicional quando necessário

## 🎯 Exemplo Completo: Workflows

Ver arquivo: `src/content/help/workflows-help.ts`

**Estrutura:**
- 5 seções principais:
  1. 🔄 O que são Workflows?
  2. ➕ Criando Workflows
  3. ⚙️ Gerenciando Workflows
  4. 🚀 Aplicação Prática
  5. 💼 Casos de Uso Reais

- 15 passos detalhados
- 30+ dicas práticas
- 15+ avisos importantes
- 8 problemas comuns com soluções

## 🔄 Roadmap

### Próximas Páginas a Implementar

1. **Serviços** (`services-help.ts`)
   - Como criar serviços
   - Configuração de campos
   - Documentos obrigatórios

2. **Protocolos** (`protocols-help.ts`)
   - Tramitação
   - Análise e aprovação
   - Consulta e acompanhamento

3. **Usuários e Equipe** (`team-help.ts`)
   - Gerenciamento de equipe
   - Permissões e roles
   - Departamentos

4. **Dashboard** (`dashboard-help.ts`)
   - Métricas e indicadores
   - Relatórios
   - Exportação de dados

5. **Cidadão Portal** (`citizen-help.ts`)
   - Como solicitar serviços
   - Acompanhar protocolos
   - Perfil e documentos

### Melhorias Futuras

- [ ] Vídeos tutoriais embarcados
- [ ] Tour guiado interativo (onboarding)
- [ ] Busca global de ajuda
- [ ] Histórico de ajudas visualizadas
- [ ] Feedback "Esta ajuda foi útil?"
- [ ] Exportar ajuda para PDF
- [ ] Ajuda contextual inline (tooltips)
- [ ] Chatbot de ajuda (integração com IA)

## 📊 Métricas de Sucesso

- Redução de tickets de suporte
- Tempo médio de onboarding de novos usuários
- Taxa de conclusão de tarefas sem ajuda externa
- Satisfação do usuário com a documentação

## 🤝 Contribuindo

Para adicionar ajuda a uma nova página:

1. Crie arquivo em `src/content/help/[nome]-help.ts`
2. Siga a estrutura do `workflows-help.ts`
3. Integre com HelpButton e HelpModal
4. Teste a navegação e busca
5. Revise linguagem (didática, sem jargões)
6. Peça feedback de usuários finais

---

**Desenvolvido com ❤️ para simplificar a administração pública**
