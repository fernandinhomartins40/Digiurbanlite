# 🧪 GUIA DE TESTE: Sistema de Aprovação de Dados Corrigido

## 📋 PRÉ-REQUISITOS

1. Backend rodando: `cd digiurban/backend && npm run dev`
2. Frontend rodando: `cd digiurban/frontend && npm run dev`
3. Usuário admin autenticado
4. Protocolo criado com campos de dados

---

## 🎯 CENÁRIO DE TESTE 1: Aprovação Automática de Stage

### Objetivo
Verificar que a stage completa automaticamente quando todos os campos obrigatórios são aprovados.

### Passos

1. **Criar Protocolo com Dados**
   - Acesse: `/admin/protocolos`
   - Criar novo protocolo com serviço que tem formulário
   - Preencher todos os campos obrigatórios

2. **Acessar Protocolo Criado**
   - Abrir protocolo: `/admin/protocolos/[id]`
   - Verificar que está na stage "Análise de Dados" (ou similar)
   - Acessar aba "Dados"

3. **Aprovar Campos Individualmente**
   - Aprovar campo 1 → ⏳ Stage continua IN_PROGRESS
   - Aprovar campo 2 → ⏳ Stage continua IN_PROGRESS
   - ...
   - Aprovar campo N (último obrigatório) → ✅ **STAGE COMPLETA AUTOMATICAMENTE**

4. **Verificar Resultado**
   - ✅ Stage "Análise de Dados" mudou para COMPLETED
   - ✅ Próxima stage iniciou automaticamente (se houver)
   - ✅ Badge "Dados" mostra progresso 100%
   - ✅ Cidadão recebeu notificação

### Logs Esperados

```bash
✅ [Orchestrator] Campo de dados aprovado: Nome do Campo
✅ [Orchestrator] Campo de dados aprovado: Outro Campo
🎉 [Orchestrator] Todos os 5 campos obrigatórios aprovados!
🚀 [Orchestrator] Completando stage automaticamente: Análise de Dados
✅ [Orchestrator] Stage concluída: Análise de Dados (2)
➡️ [Orchestrator] Iniciando próxima stage: [Nome da Próxima Stage]
```

---

## 🎯 CENÁRIO DE TESTE 2: Aprovar Todos de Uma Vez

### Objetivo
Verificar que o botão "Aprovar Todos" também dispara a aprovação automática da stage.

### Passos

1. **Acessar Protocolo com Campos Pendentes**
   - Abrir protocolo: `/admin/protocolos/[id]`
   - Acessar aba "Dados"
   - Verificar que há campos pendentes

2. **Usar "Aprovar Todos"**
   - Clicar no botão "Aprovar Todos (X)"
   - Confirmar ação

3. **Verificar Resultado**
   - ✅ Todos os campos mudaram para APPROVED
   - ✅ Stage completou automaticamente
   - ✅ Próxima stage iniciou (se houver)

### Logs Esperados

```bash
✅ 5 campos aprovados em lote (protocolo xxx-xxx)
✅ [Orchestrator] Campo de dados aprovado: Campo 1
✅ [Orchestrador] Campo de dados aprovado: Campo 2
...
🎉 [Orchestrator] Todos os 5 campos obrigatórios aprovados!
🚀 [Orchestrator] Completando stage automaticamente: Análise de Dados
```

---

## 🎯 CENÁRIO DE TESTE 3: Stage Sem Nome Específico

### Objetivo
Verificar que o fallback funciona quando não há stage com nome "análise/dados/validação".

### Passos

1. **Criar Workflow Customizado**
   - Criar serviço com stage chamada "Revisão Interna"
   - Criar protocolo com esse serviço

2. **Aprovar Todos os Campos**
   - Aprovar todos os campos obrigatórios

3. **Verificar Resultado**
   - ✅ Protocolo muda de VINCULADO → PROGRESSO
   - ✅ Interação criada informando aprovação
   - ⚠️ Stage não completa automaticamente (esperado)

### Logs Esperados

```bash
✅ [Orchestrator] Campo de dados aprovado: Campo
🎉 [Orchestrator] Todos os X campos obrigatórios aprovados!
⚠️ [Orchestrator] Nenhuma stage de análise encontrada - mudando protocolo para PROGRESSO
```

---

## 🎯 CENÁRIO DE TESTE 4: Campos Opcionais

### Objetivo
Verificar que campos opcionais não bloqueiam a aprovação automática.

### Passos

1. **Criar Protocolo**
   - Serviço com 3 campos obrigatórios + 2 opcionais

2. **Aprovar Apenas Obrigatórios**
   - Aprovar os 3 campos obrigatórios
   - Deixar os 2 opcionais pendentes

3. **Verificar Resultado**
   - ✅ Stage completa mesmo com opcionais pendentes
   - ✅ Sistema considera apenas obrigatórios

---

## 🎯 CENÁRIO DE TESTE 5: Comparação com Documentos

### Objetivo
Verificar que dados e documentos se comportam da mesma forma.

### Passos

1. **Criar Protocolo Completo**
   - Serviço com documentos E dados
   - Stage 1: "Análise Documental"
   - Stage 2: "Análise de Dados"

2. **Aprovar Documentos**
   - Aprovar todos os documentos obrigatórios
   - ✅ Stage 1 completa automaticamente
   - ✅ Stage 2 inicia

3. **Aprovar Dados**
   - Aprovar todos os campos obrigatórios
   - ✅ Stage 2 completa automaticamente
   - ✅ Próxima stage inicia (se houver)

### Resultado Esperado
- ✅ Comportamento idêntico entre documentos e dados
- ✅ Ambos completam stages automaticamente
- ✅ Ambos avançam no workflow

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Interface Frontend

- [ ] Badge "Dados" mostra contagem correta (X/Y aprovados)
- [ ] Barra de progresso atualiza ao aprovar campos
- [ ] Botão "Aprovar Todos" funciona corretamente
- [ ] Stage muda visualmente de IN_PROGRESS → COMPLETED
- [ ] Próxima stage aparece como IN_PROGRESS
- [ ] Timeline do workflow atualiza

### Backend

- [ ] Logs mostram aprovação de cada campo
- [ ] Logs mostram detecção de "todos aprovados"
- [ ] Logs mostram stage sendo completada
- [ ] Logs mostram próxima stage iniciando
- [ ] Histórico do protocolo registra ações

### Database

- [ ] ProtocolDataField.status = 'APPROVED'
- [ ] ProtocolDataField.validatedBy = [userId]
- [ ] ProtocolDataField.validatedAt = [timestamp]
- [ ] ProtocolStage.status = 'COMPLETED'
- [ ] ProtocolStage.completedAt = [timestamp]
- [ ] ProtocolHistorySimplified tem entradas corretas

### Notificações

- [ ] Cidadão recebe notificação de aprovação
- [ ] Cidadão recebe notificação de avanço de stage
- [ ] Interações aparecem na aba "Comunicação"

---

## 🐛 TROUBLESHOOTING

### Stage não completa automaticamente

**Possíveis Causas**:
1. Nome da stage não inclui "análise", "dados" ou "validação"
2. Stage não está com status IN_PROGRESS
3. Ainda há campos obrigatórios não aprovados

**Verificação**:
```sql
-- Verificar campos pendentes
SELECT * FROM "ProtocolDataField"
WHERE "protocolId" = '[ID]'
AND "isRequired" = true
AND "status" != 'APPROVED';

-- Verificar stage atual
SELECT * FROM "ProtocolStage"
WHERE "protocolId" = '[ID]'
AND "status" = 'IN_PROGRESS';
```

### Erro "workflowOrchestrator is not defined"

**Causa**: Import do orquestrador falhou

**Solução**: Verificar que o import está correto no service

### Stage completa mas não avança

**Causa**: Próxima stage tem bloqueios

**Verificação**: Verificar logs para ver motivo do bloqueio

---

## ✅ CRITÉRIOS DE SUCESSO

Para considerar o teste bem-sucedido:

1. ✅ Stage completa automaticamente ao aprovar último campo obrigatório
2. ✅ Próxima stage inicia automaticamente (se houver)
3. ✅ Cidadão recebe notificações apropriadas
4. ✅ Histórico registra todas as ações
5. ✅ Comportamento idêntico ao de documentos
6. ✅ Sem erros no console (frontend e backend)
7. ✅ Logs mostram fluxo completo de aprovação

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs do backend em tempo real
2. Verificar estado no banco de dados
3. Comparar com comportamento de documentos
4. Consultar CHANGELOG_APPROVAL_SYSTEM_FIX.md
