# ⚠️ ARQUIVOS LEGADOS - NÃO USAR

## Sistema Atual: FlowEngine (Motor de Fluxos Baseado em JSON)

O sistema de fluxos do DigiBot foi completamente reescrito para usar um motor baseado em definições JSON.

### ✅ Arquivos ATIVOS (Use estes):

#### Motor de Fluxos
- `flow/FlowEngine.ts` - Motor principal de execução
- `flow/FlowStateManager.ts` - Gerenciador de estado das execuções
- `flow/NodeExecutors.ts` - Executores para cada tipo de nodo
- `flow/ActionHandlers.ts` - Handlers para ações (criar protocolo, buscar serviços, etc)
- `flow/TemplateEngine.ts` - Engine de templates ({{variavel}})
- `flow/InputValidator.ts` - Validador de inputs

#### Definições de Fluxos (JSON)
- `flows/menu-principal.json`
- `flows/solicitar-servico.json`
- `flows/consultar-protocolo.json`
- `flows/meu-perfil.json`
- `flows/minha-familia.json`
- `flows/notificacoes.json`
- `flows/ajuda.json`

#### Scripts
- `../../scripts/seed-flows.ts` - Script para popular fluxos no banco

### ❌ Arquivos LEGADOS (NÃO use mais):

Estes arquivos foram substituídos pelo novo sistema e devem ser removidos:

- `ConversationFlowManager.ts` - **DEPRECATED**: Substituído por FlowEngine
- `FlowManager.ts` - **DEPRECATED**: Substituído por FlowEngine
- `BotService.ts` - **DEPRECATED**: Lógica migrada para FlowEngine + ActionHandlers
- `BotServiceEnhanced.ts` - **DEPRECATED**: Lógica migrada para FlowEngine + ActionHandlers

### 📚 Como Funciona o Novo Sistema

#### 1. Definição de Fluxos (JSON)

Os fluxos são definidos em arquivos JSON com a seguinte estrutura:

```json
{
  "name": "nome_do_fluxo",
  "description": "Descrição do fluxo",
  "version": "1.0.0",
  "metadata": {
    "icon": "📋",
    "color": "#4CAF50",
    "category": "main"
  },
  "nodes": [
    {
      "id": "start",
      "type": "message",
      "config": {
        "text": "Mensagem para o usuário"
      },
      "transitions": [
        { "to": "next_node" }
      ]
    }
  ]
}
```

#### 2. Tipos de Nodos

- **message**: Exibe uma mensagem
- **question**: Pergunta com input de texto livre
- **menu**: Menu de opções (com matching inteligente)
- **action**: Executa uma ação no backend
- **condition**: Avalia condições e roteia
- **form**: Formulário dinâmico
- **upload**: Upload de arquivos
- **location**: Solicita localização
- **end**: Finaliza o fluxo

#### 3. Actions Disponíveis

Ações que podem ser executadas via nodos tipo "action":

- `searchServices` - Busca serviços
- `listServices` - Lista todos os serviços
- `listServiceCategories` - Lista categorias
- `getService` - Obtém detalhes de um serviço
- `createProtocol` - Cria protocolo real
- `getProtocols` - Busca protocolos do cidadão
- `getProtocolByNumber` - Busca protocolo por número
- `addProtocolComment` - Adiciona comentário ao protocolo
- `getCitizenProfile` - Obtém perfil do cidadão
- `updateCitizenProfile` - Atualiza perfil
- `getFamilyMembers` - Lista membros da família
- `getNotifications` - Lista notificações
- `markNotificationsAsRead` - Marca notificações como lidas
- `formatProtocolReview` - Formata dados para revisão
- `startFlow` - Inicia outro fluxo (tratado especialmente)

#### 4. Templates

Use templates para inserir variáveis no texto:

```json
{
  "text": "Olá, {{citizenName}}! Seu protocolo {{protocolNumber}} foi criado."
}
```

#### 5. Transições Condicionais

Para nodos tipo "menu", as transições podem ser condicionais:

```json
{
  "transitions": [
    { "when": "opcao_1", "to": "node_1" },
    { "when": "opcao_2", "to": "node_2" },
    { "to": "node_default" }  // Sem 'when' = default
  ]
}
```

### 🚀 Como Criar um Novo Fluxo

1. Crie um arquivo JSON em `flows/`
2. Defina a estrutura do fluxo com nodos e transições
3. Execute o seed: `npx ts-node src/scripts/seed-flows.ts`
4. O fluxo estará disponível automaticamente

### 🎯 Vantagens do Novo Sistema

1. **Configurável**: Fluxos são JSON, não código
2. **Versionável**: Fácil de versionar e reverter
3. **Testável**: Engine desacoplado, fácil de testar
4. **Escalável**: Adicionar novos tipos de nodos é simples
5. **Gerenciável**: Interface admin para criar/editar fluxos
6. **Rastreável**: Todas as execuções são salvas no banco
7. **Analytics**: Estatísticas e métricas por fluxo

### 📊 Admin Panel

Acesse `/admin/bot-flows` para:
- Listar todos os fluxos
- Criar novos fluxos
- Editar fluxos existentes (com editor JSON)
- Ver analytics e estatísticas
- Ativar/desativar fluxos
- Duplicar fluxos
- Ver execuções ativas

### 🔧 Manutenção

Para atualizar um fluxo existente:

1. Edite o arquivo JSON em `flows/`
2. Incremente a versão
3. Execute o seed novamente
4. O fluxo será atualizado automaticamente

### 📝 Migração de Código Legado

Se você ainda tem código no sistema legado, siga estes passos:

1. Identifique o fluxo no código legado
2. Mapeie os steps para nodos JSON
3. Crie o arquivo JSON equivalente
4. Teste o novo fluxo
5. Delete o código legado

### 🆘 Suporte

Se tiver dúvidas sobre o novo sistema:
- Veja os fluxos existentes em `flows/` como referência
- Consulte `ActionHandlers.ts` para ações disponíveis
- Verifique `NodeExecutors.ts` para tipos de nodos
- Acesse `/admin/bot-flows` para gerenciar via interface

---

**Data de Migração**: 20/01/2025
**Versão do Sistema**: 2.0.0
**Motor**: FlowEngine
