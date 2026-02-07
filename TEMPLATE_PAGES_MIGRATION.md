# Migração de Modais para Páginas - Templates de Documentos

## Data: 2026-02-07

## Resumo
Migração da funcionalidade de visualização e edição de templates de documentos de **modais** para **páginas dedicadas** na seção `/admin/templates-documentos`.

## Motivação
- **Melhor experiência do usuário**: Páginas dedicadas oferecem mais espaço e contexto
- **URLs compartilháveis**: Possibilidade de compartilhar links diretos para visualizar/editar templates específicos
- **Navegação mais intuitiva**: Uso de botões de "voltar" e navegação padrão do navegador
- **Separação de responsabilidades**: Cada página tem uma função clara e focada
- **Consistência**: Alinha com padrões modernos de UX em aplicações web

## Mudanças Implementadas

### 1. Novas Páginas Criadas

#### `/admin/templates-documentos/[id]/view`
**Arquivo**: `digiurban/frontend/app/admin/templates-documentos/[id]/view/page.tsx`

**Funcionalidades**:
- Visualização completa do template com preview em iframe
- Duas abas: "Visualização do Documento" e "Informações e Variáveis"
- Badges com tipo, formato, status e versão do template
- Botão "Editar Template" (se usuário tiver permissão)
- Botão "Voltar" para retornar à lista
- Preview com substituição de variáveis por valores de exemplo
- Lista detalhada de variáveis disponíveis
- Informações técnicas do template

**Características**:
- Loading state com spinner
- Tratamento de erros com redirecionamento
- Verificação de permissões
- Design responsivo com tabs

#### `/admin/templates-documentos/[id]/edit`
**Arquivo**: `digiurban/frontend/app/admin/templates-documentos/[id]/edit/page.tsx`

**Funcionalidades**:
- Edição simplificada (apenas 3 campos editáveis: nome, descrição, status)
- Duas abas: "Informações Básicas" e "Informações Técnicas"
- Informações técnicas somente leitura (HTML, CSS, variáveis, etc.)
- Alerta explicativo sobre limitações da edição
- Validação de formulário
- Botões "Salvar" e "Cancelar"
- Verificação de permissões (SUPER_ADMIN, ADMIN, MANAGER)

**Características**:
- Loading state com spinner
- Tratamento de erros com toast
- Redirect após salvar com sucesso
- Campos técnicos read-only com explicação clara

### 2. Página Principal Atualizada

**Arquivo**: `digiurban/frontend/app/admin/templates-documentos/page.tsx`

**Mudanças**:
- ❌ Removido: Imports de `TemplateViewModal` e `TemplateEditModal`
- ❌ Removido: Estados `viewModalOpen`, `editModalOpen`, `selectedTemplate`
- ❌ Removido: Funções `handleSaveTemplate` (lógica movida para página de edição)
- ✅ Adicionado: Import do `useRouter` do Next.js
- ✅ Modificado: `handleViewTemplate` agora navega para `/[id]/view`
- ✅ Modificado: `handleEditTemplate` agora navega para `/[id]/edit`
- ❌ Removido: Renderização dos componentes de modal no final da página

**Antes**:
```tsx
const handleViewTemplate = (template: DocumentTemplate) => {
  setSelectedTemplate(template)
  setViewModalOpen(true)
}

const handleEditTemplate = async (template: DocumentTemplate) => {
  const result = await apiRequest(`/document-templates/${template.id}`)
  if (result.success) {
    setSelectedTemplate(result.data)
    setEditModalOpen(true)
  }
}
```

**Depois**:
```tsx
const handleViewTemplate = (templateId: string) => {
  router.push(`/admin/templates-documentos/${templateId}/view`)
}

const handleEditTemplate = (templateId: string) => {
  router.push(`/admin/templates-documentos/${templateId}/edit`)
}
```

## Arquivos Modificados

### Criados
1. `digiurban/frontend/app/admin/templates-documentos/[id]/view/page.tsx` (novo)
2. `digiurban/frontend/app/admin/templates-documentos/[id]/edit/page.tsx` (novo)

### Modificados
1. `digiurban/frontend/app/admin/templates-documentos/page.tsx`

### Não Modificados (mas podem ser removidos futuramente)
1. `digiurban/frontend/src/components/admin/templates/TemplateViewModal.tsx` (depreciado)
2. `digiurban/frontend/src/components/admin/templates/TemplateEditModal.tsx` (depreciado)

**Nota**: Os arquivos de modal foram mantidos por compatibilidade, mas não são mais usados. Podem ser removidos em uma refatoração futura se não houver outros usos.

## Benefícios da Migração

### 1. **UX Aprimorada**
- ✅ Páginas full-screen oferecem mais espaço para visualização
- ✅ Navegação com botão "voltar" é mais intuitiva
- ✅ Preview do template em tela maior (iframe de 800px vs espaço limitado do modal)
- ✅ Abas organizadas com ScrollArea para conteúdo extenso

### 2. **SEO e Compartilhamento**
- ✅ URLs compartilháveis: `/admin/templates-documentos/abc123/view`
- ✅ Possibilidade de bookmarking de templates específicos
- ✅ Histórico de navegação funcional (botões voltar/avançar do browser)

### 3. **Manutenibilidade**
- ✅ Código mais organizado com responsabilidades separadas
- ✅ Menos estados complexos na página principal
- ✅ Cada página tem um propósito único e claro
- ✅ Mais fácil de testar e debugar

### 4. **Performance**
- ✅ Lazy loading de páginas (Next.js code splitting automático)
- ✅ Menor bundle inicial da página principal
- ✅ Dados carregados apenas quando necessário

### 5. **Consistência**
- ✅ Alinha com padrão usado em outras páginas admin
- ✅ Segue convenções do Next.js App Router
- ✅ Padrão comum em aplicações modernas (GitHub, GitLab, etc.)

## Fluxo de Navegação

```
/admin/templates-documentos
  │
  ├─> [Clique em "Visualizar"]
  │   └─> /admin/templates-documentos/[id]/view
  │       │
  │       ├─> [Clique em "Editar Template"]
  │       │   └─> /admin/templates-documentos/[id]/edit
  │       │       └─> [Salvar] → Redirect para /admin/templates-documentos
  │       │
  │       └─> [Clique em "Voltar" ou ícone]
  │           └─> /admin/templates-documentos
  │
  └─> [Clique em "Editar"]
      └─> /admin/templates-documentos/[id]/edit
          └─> [Salvar] → Redirect para /admin/templates-documentos
```

## Verificação de Permissões

Ambas as páginas implementam verificação de permissões:

### Página de Visualização (`/view`)
- ✅ Todos os usuários autenticados podem visualizar
- ✅ Botão "Editar" visível apenas para: SUPER_ADMIN, ADMIN, MANAGER

### Página de Edição (`/edit`)
- ❌ Redirect automático se usuário não tem permissão
- ✅ Acesso permitido apenas para: SUPER_ADMIN, ADMIN, MANAGER
- ✅ Toast de erro + redirect para lista se acesso negado

## Estados e Loading

### Loading States
Ambas as páginas implementam loading states elegantes:
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando template...</p>
      </div>
    </div>
  )
}
```

### Error Handling
- Toast notifications para erros
- Redirect automático para lista em caso de erro crítico
- Mensagens de erro amigáveis em português

## Compatibilidade

### Breaking Changes
- ❌ Nenhuma! A API permanece a mesma
- ✅ Componentes antigos (modais) ainda existem, apenas não são mais usados

### Backwards Compatibility
- ✅ Todas as rotas API existentes continuam funcionando
- ✅ Tipos TypeScript não foram alterados
- ✅ Nenhuma mudança no backend necessária

## Testes Realizados

- ✅ TypeScript compilation: `npx tsc --noEmit` - PASSOU
- ✅ Navegação: Lista → View → Edit → Lista
- ✅ Verificação de permissões em ambas as páginas
- ✅ Preview de template com variáveis substituídas
- ✅ Salvamento de alterações
- ✅ Tratamento de erros

## Próximos Passos (Opcional)

1. **Remover componentes deprecados** (se não usados em outro lugar):
   - `TemplateViewModal.tsx`
   - `TemplateEditModal.tsx`

2. **Adicionar testes automatizados**:
   - Testes E2E para fluxo de navegação
   - Testes de permissões
   - Testes de validação de formulário

3. **Melhorias futuras**:
   - Adicionar breadcrumbs para navegação
   - Implementar histórico de versões do template
   - Adicionar preview em tempo real na página de edição (se editores WYSIWYG forem habilitados)

## Conclusão

A migração foi concluída com sucesso, mantendo **100% de compatibilidade** com o código existente enquanto oferece uma **experiência de usuário significativamente melhor**. As páginas dedicadas são mais **intuitivas**, **compartilháveis** e **consistentes** com padrões modernos de aplicações web.

**Status**: ✅ **COMPLETO e PRODUÇÃO-READY**
