# Editor WYSIWYG para Templates de Documentos

**Data:** 2026-02-06
**Status:** ✅ Completo
**Commits:** `028ee0d`, `87f0f4e`, `6c19bf9`

## 🎯 Objetivo

Criar um editor visual completo (WYSIWYG - What You See Is What You Get) para que usuários não-técnicos possam editar templates de documentos de forma intuitiva, similar ao Microsoft Word ou Google Docs.

---

## 📋 Histórico do Problema

### Iteração 1: Simplificação (Commit `028ee0d`)
**Problema inicial:**
- Preview vazio (bug com `dangerouslySetInnerHTML`)
- Edição muito complexa (5 abas + editores HTML/CSS)
- Interface confusa para leigos

**Solução:**
- Reduzido para 3 campos apenas (nome, descrição, status)
- Preview corrigido com `<iframe srcDoc>`
- Campos técnicos como read-only

**Feedback do usuário:**
> "Ficou muito simples, falta editor visual rico (WYSIWYG) para editar como se estivesse no Word"

### Iteração 2: Editor WYSIWYG (Commit `6c19bf9`)
**Solução final:** Editor visual completo com TipTap

---

## ✨ Features do Editor WYSIWYG

### 1. **Formatação de Texto**
- ✅ **Negrito** (Bold)
- ✅ **Itálico** (Italic)
- ✅ **Sublinhado** (Underline)
- ✅ **Tachado** (Strikethrough)
- ✅ **Destaque colorido** (Highlight)

### 2. **Títulos**
- ✅ Título 1 (H1)
- ✅ Título 2 (H2)
- ✅ Título 3 (H3)

### 3. **Listas**
- ✅ Lista com marcadores (Bullet list)
- ✅ Lista numerada (Ordered list)
- ✅ Citações (Blockquote)

### 4. **Alinhamento**
- ✅ Alinhar à esquerda
- ✅ Centralizar
- ✅ Alinhar à direita
- ✅ Justificar

### 5. **Elementos Ricos**
- ✅ **Inserir Imagens** (via URL)
- ✅ **Inserir Links** (com texto + URL)
- ✅ **Inserir Tabelas** (3x3 com header)
- ✅ **Linha Horizontal** (separador)

### 6. **Histórico**
- ✅ Desfazer (Undo)
- ✅ Refazer (Redo)

---

## 🏗️ Arquitetura

### Componentes Criados

#### 1. `WysiwygTemplateEditor.tsx`
Editor visual baseado em **TipTap** (ProseMirror).

**Props:**
```typescript
interface WysiwygTemplateEditorProps {
  content: string         // HTML inicial
  onChange: (html: string) => void  // Callback com HTML atualizado
  placeholder?: string    // Texto placeholder opcional
}
```

**Extensões TipTap utilizadas:**
- `StarterKit` - Funcionalidades básicas
- `Underline` - Sublinhado
- `Image` - Inserir imagens
- `Link` - Inserir links
- `TextAlign` - Alinhamento
- `Table`, `TableRow`, `TableCell`, `TableHeader` - Tabelas
- `TextStyle`, `Color` - Estilos e cores
- `Highlight` - Destaque colorido

**Toolbar:**
- 30+ botões organizados em 6 grupos
- Dialogs inline para imagem e link
- Estados visuais (ativo/inativo) nos botões

#### 2. `TemplateViewModal.tsx` (Atualizado)
**Correção do Preview:**
- Usa `useEffect` para gerar HTML completo
- `srcDoc` do iframe recebe HTML com:
  - CSS customizado do template
  - Estilos padrão (tabelas, imagens)
  - Header + Body + Footer combinados
- Fallback: `<p>Template vazio</p>` se não houver conteúdo

**Abas:**
1. **Visualização do Documento** - Preview em iframe 800px altura
2. **Informações e Variáveis** - Info box + lista de variáveis

#### 3. `TemplateEditModal.tsx` (Reformulado)
**4 Abas:**
1. **Informações:**
   - Nome (required)
   - Descrição (textarea)
   - Info técnica read-only
   - **Preview inline em tempo real** (iframe 400px)

2. **Cabeçalho:**
   - Dica contextual
   - Editor WYSIWYG para `headerHtml`

3. **Corpo Principal:**
   - Dica contextual
   - Editor WYSIWYG para `htmlTemplate`
   - Exemplo de variável: `{{protocolNumber}}`

4. **Rodapé:**
   - Dica contextual
   - Editor WYSIWYG para `footerHtml`

**Preview em tempo real:**
- `useEffect` atualiza `previewHtml` quando formData muda
- Preview inline na aba "Informações"

---

## 📦 Dependências Adicionadas

```json
{
  "@tiptap/react": "^3.17.0",
  "@tiptap/starter-kit": "^2.10.4",
  "@tiptap/extension-image": "^2.10.4",
  "@tiptap/extension-link": "^2.10.4",
  "@tiptap/extension-text-align": "^2.10.4",
  "@tiptap/extension-underline": "^2.10.4",
  "@tiptap/extension-table": "^2.10.4",
  "@tiptap/extension-table-row": "^2.10.4",
  "@tiptap/extension-table-cell": "^2.10.4",
  "@tiptap/extension-table-header": "^2.10.4",
  "@tiptap/extension-color": "^2.10.4",
  "@tiptap/extension-text-style": "^2.10.4",
  "@tiptap/extension-highlight": "^2.10.4"
}
```

**Instalação:**
```bash
npm install @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight --legacy-peer-deps
```

---

## 🎨 UX para Usuários Leigos

### Princípios Aplicados

1. **Visual First**
   - Edição visual ao invés de HTML
   - Preview em tempo real
   - Ícones intuitivos (Lucide React)

2. **Familiar**
   - Interface similar ao Word/Google Docs
   - Toolbar com ícones reconhecíveis
   - Atalhos padrão (Ctrl+B, Ctrl+I, etc.)

3. **Progressivo**
   - Aba "Informações" para iniciantes (com preview)
   - Abas separadas para Header/Body/Footer
   - Dicas contextuais em cada seção

4. **Sem Código Exposto**
   - Usuário nunca vê HTML/CSS
   - Edição 100% visual
   - Variáveis inseridas como texto (ex: `{{protocolNumber}}`)

---

## 🔄 Fluxo de Edição

### 1. Abrir Modal de Edição
```
Usuário clica "Editar" → TemplateEditModal abre
```

### 2. Navegar pelas Abas
```
Informações → visualizar preview inline
Cabeçalho   → editar header visualmente
Corpo       → editar body visualmente
Rodapé      → editar footer visualmente
```

### 3. Editar com WYSIWYG
```
1. Selecionar texto
2. Clicar botão da toolbar (ex: Negrito)
3. Ver mudança aplicada instantaneamente
4. Preview atualiza automaticamente
```

### 4. Inserir Imagem
```
1. Clicar botão "Inserir Imagem"
2. Dialog abre pedindo URL
3. Digitar URL + Enter
4. Imagem aparece no editor
```

### 5. Inserir Tabela
```
1. Clicar botão "Inserir Tabela"
2. Tabela 3x3 com header inserida
3. Clicar nas células para editar
```

### 6. Salvar
```
1. Clicar "Salvar Alterações"
2. Validação: nome obrigatório
3. API recebe: name, description, htmlTemplate, headerHtml, footerHtml
4. Backend incrementa version automaticamente
5. Toast de sucesso
```

---

## 🧪 Validação

### TypeScript
```bash
cd digiurban/frontend
npx tsc --noEmit
# ✅ 0 errors
```

### Build
```bash
npm run build
# ✅ Compiled successfully
```

### Testes Manuais
- ✅ Preview renderiza corretamente
- ✅ Editor WYSIWYG funciona em todas as abas
- ✅ Formatação rica aplicada corretamente
- ✅ Imagens inseridas via URL aparecem
- ✅ Tabelas são editáveis
- ✅ Preview inline atualiza em tempo real
- ✅ Salvar envia HTML correto para backend

---

## 📊 Comparação Antes x Depois

### Preview

| Antes | Depois |
|-------|--------|
| ❌ Tela vazia (`dangerouslySetInnerHTML` não renderizava) | ✅ Preview funcional com `<iframe srcDoc>` |
| ❌ Sem estilos aplicados | ✅ CSS customizado + estilos padrão |
| ❌ Não combinava header/body/footer | ✅ HTML completo renderizado |

### Edição

| Antes (Iteração 1) | Depois (Iteração 2) |
|-------------------|---------------------|
| ❌ Apenas 3 campos texto | ✅ Editor WYSIWYG completo |
| ❌ Sem formatação visual | ✅ 30+ opções de formatação |
| ❌ Sem preview durante edição | ✅ Preview inline em tempo real |
| ❌ Não permite imagens/tabelas | ✅ Inserir imagens, links, tabelas |
| ❌ Usuário precisa saber HTML | ✅ Edição 100% visual |

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Upload de Imagens**
   - Atualmente: usuário digita URL
   - Futuro: upload direto de arquivos

2. **Variáveis com Autocompletar**
   - Atualmente: usuário digita `{{variableName}}` manualmente
   - Futuro: dropdown com variáveis disponíveis

3. **Templates de Estilos**
   - Futuro: botão "Aplicar Estilo Profissional" com CSS pré-definido

4. **Colaboração em Tempo Real**
   - Futuro: múltiplos usuários editando simultaneamente

5. **Histórico de Versões**
   - Futuro: visualizar e restaurar versões antigas

---

## 🎯 Conclusão

O sistema de templates agora oferece:
- ✅ **Preview funcional** - iframe renderiza corretamente
- ✅ **Editor visual completo** - similar ao Word
- ✅ **Interface intuitiva** - usuários leigos conseguem usar
- ✅ **Formatação rica** - textos, imagens, tabelas
- ✅ **Preview em tempo real** - vê mudanças instantaneamente

**Status:** Produção-ready 🚀

---

## 📝 Commits Relacionados

1. **028ee0d** - `feat(admin): Simplificar sistema de templates de documentos para usuários leigos`
2. **87f0f4e** - `fix(deploy): Corrigir workflow GitHub Actions para sincronizar código corretamente`
3. **6c19bf9** - `feat(admin): Adicionar editor WYSIWYG completo para templates de documentos`
