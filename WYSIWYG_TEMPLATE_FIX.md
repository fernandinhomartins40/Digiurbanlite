# Correção do Editor WYSIWYG para Templates Complexos

## 📋 Problema Identificado

O editor WYSIWYG (TipTap) estava mostrando código HTML bruto ao invés de renderizar visualmente os templates. Isso acontecia porque:

1. **TipTap remove tags desconhecidas** - Por padrão, o TipTap remove elementos HTML que não fazem parte das suas extensões básicas
2. **Atributos eram perdidos** - Atributos `style`, `class`, e `data-*` eram descartados durante o parsing
3. **Divs customizadas não suportadas** - Elementos `<div>` com classes customizadas eram removidos ou convertidos

## ✅ Solução Implementada

### 1. Extensão CustomDiv
```typescript
const CustomDiv = Node.create({
  name: 'customDiv',
  group: 'block',
  content: 'block*',

  parseHTML() {
    return [{ tag: 'div' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },

  addAttributes() {
    return {
      class: { default: null },
      style: { default: null },
      'data-signature-width': { default: null },
      'data-signature-height': { default: null },
    }
  },
})
```

**O que faz:**
- Captura TODAS as tags `<div>` do HTML
- Preserva atributos `class`, `style`, e `data-*`
- Renderiza as divs com todos os atributos intactos
- Permite conteúdo block dentro das divs

### 2. CustomHTML Expandido
```typescript
const CustomHTML = Extension.create({
  name: 'customHTML',

  addGlobalAttributes() {
    return [{
      types: ['heading', 'paragraph', 'textStyle', 'tableCell', 'tableHeader'],
      attributes: {
        style: {
          default: null,
          parseHTML: element => element.getAttribute('style'),
          renderHTML: attributes => attributes.style ? { style: attributes.style } : {}
        },
        class: {
          default: null,
          parseHTML: element => element.getAttribute('class'),
          renderHTML: attributes => attributes.class ? { class: attributes.class } : {}
        },
      },
    }]
  },
})
```

**O que faz:**
- Adiciona suporte a `style` e `class` em múltiplos tipos de nós
- Preserva estilos inline em headings, parágrafos, células de tabela
- Mantém classes CSS em todos os elementos

### 3. Configurações do Editor

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false, // Evita interpretação de HTML como código
    }),
    Image.configure({
      inline: true,
      allowBase64: true, // Suporta imagens base64
    }),
    Table.configure({
      HTMLAttributes: {
        style: 'width: 100%; border-collapse: collapse;',
      },
    }),
    CustomDiv, // ← Suporte a divs customizadas
    CustomHTML, // ← Preservar atributos
  ],
  parseOptions: {
    preserveWhitespace: 'full', // Manter espaços em branco
  },
  enableInputRules: false, // Desabilitar regras automáticas
  enablePasteRules: false, // Desabilitar transformações ao colar
})
```

## 🎯 Resultado

### Antes ❌
```html
<!-- Editor mostrava isso como texto: -->
{{#if municipalityLogo}}
<img src="{{municipalityLogo}}" alt="Logo" style="max-width: 150px;">
{{/if}}
<h1 style="text-align: center;">{{municipalityName}}</h1>
```

### Depois ✅
```
[Logo renderizado visualmente]
Título Centralizado (H1 renderizado)
```

- ✅ Templates renderizados visualmente como Word
- ✅ Variáveis Handlebars `{{variavel}}` visíveis e editáveis
- ✅ Divs com classes preservadas (ex: `signature-placeholder`)
- ✅ Estilos inline funcionando
- ✅ Tabelas renderizadas corretamente
- ✅ Usuários leigos podem editar sem ver código HTML

## 📁 Arquivos Modificados

1. **`WysiwygTemplateEditor.tsx`**
   - Linha 16: Import de `Node` e `mergeAttributes`
   - Linha 58-75: Nova extensão `CustomDiv`
   - Linha 77-109: `CustomHTML` expandido
   - Linha 114-148: Configurações do editor atualizadas

2. **`edit/page.tsx`**
   - Já estava usando `WysiwygTemplateEditor` corretamente
   - Nenhuma mudança necessária

## 🚀 Deploy

Para aplicar as mudanças no servidor:

```bash
# Via script automático
./deploy-to-server.sh

# Ou manualmente
ssh root@digiurban.com.br
cd digiurban
git pull
docker compose -f docker-compose.vps.yml build digiurban
docker compose -f docker-compose.vps.yml up -d digiurban
```

## 🧪 Como Testar

1. Acesse `/admin/templates-documentos/[id]/edit`
2. Verifique se o HTML está renderizado visualmente
3. Edite o conteúdo como se fosse Word
4. Clique em "Visualizar Resultado" para ver o preview
5. Salve e gere um documento PDF para testar

## 📚 Referências

- [TipTap Node Extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#node-extensions)
- [TipTap Global Attributes](https://tiptap.dev/docs/editor/extensions/functionality#global-attributes)
- [Preserving HTML in TipTap](https://github.com/ueberdosis/tiptap/discussions/1451)

---

**Data:** 2026-02-08
**Status:** ✅ Implementado e testado
**Próximos passos:** Deploy no servidor de produção
