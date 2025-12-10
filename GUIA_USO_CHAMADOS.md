# 📘 GUIA DE USO - SISTEMA DE CHAMADOS

## 🎯 Para que serve?

O sistema de chamados permite que o **Prefeito** ou **Secretários** abram protocolos de atendimento **em nome de cidadãos**, criando um fluxo **TOP-DOWN** (governo → cidadão).

---

## 👥 Quem pode usar?

✅ **ADMIN** (Prefeito)
✅ **MANAGER** (Secretários)
❌ **COORDINATOR** (Coordenadores)
❌ **USER** (Funcionários)

---

## 📍 Como acessar?

### **Opção 1: Menu Lateral**
```
Painel Admin → Menu "Gestão" → "Criar Chamado"
```

### **Opção 2: URL Direta**
```
https://seudominio.com.br/admin/chamados
```

---

## 🔄 PASSO A PASSO

### **1️⃣ BUSCAR CIDADÃO**

1. Na primeira seção, digite o **nome do cidadão** no campo de busca
2. Aguarde os resultados aparecerem (busca automática)
3. Clique no cidadão desejado na lista
4. Um card **verde** aparecerá confirmando a seleção

**Dicas:**
- ⚡ A busca acontece automaticamente enquanto você digita
- 🔍 Digite pelo menos 2 caracteres
- 📋 Mostra: Nome, CPF, Email
- 🔄 Pode clicar em "Alterar" para trocar

---

### **2️⃣ BUSCAR SERVIÇO**

1. Na segunda seção, digite o **nome do serviço**
2. Aguarde os resultados aparecerem
3. Clique no serviço desejado
4. Um card **verde** aparecerá confirmando a seleção

**Dicas:**
- 🏢 Mostra o departamento responsável
- ⏱️ Mostra prazo estimado (quando disponível)
- 🔄 Pode clicar em "Alterar" para trocar

---

### **3️⃣ PREENCHER DETALHES**

Após selecionar cidadão E serviço, preencha:

**Campos obrigatórios (*):**
- 📝 **Título:** Resumo da solicitação
- 📄 **Descrição:** Explicação detalhada do problema/necessidade
- 🏷️ **Categoria:** Escolha a área (Saúde, Educação, etc.)
- 🔴 **Prioridade:** Defina a urgência

**Prioridades:**
- 🟢 **Baixa:** Pode aguardar
- 🟡 **Média:** Atendimento normal
- 🟠 **Alta:** Requer atenção
- 🔴 **Urgente:** Prioridade máxima

---

### **4️⃣ CRIAR CHAMADO**

1. Revise todos os dados
2. Clique em **"Criar Chamado"**
3. Aguarde o processamento
4. Veja a mensagem de sucesso com o número do protocolo
5. Será redirecionado para a lista de protocolos

---

## ✅ O QUE ACONTECE APÓS CRIAR?

### **Protocolo Gerado:**
```
📋 Número: 2025-000042
📊 Status: VINCULADO
👤 Criado por: [Seu Nome]
🏢 Departamento: [Auto-atribuído]
```

### **Notificações Enviadas:**
1. 📧 **Cidadão recebe:** Notificação com número do protocolo
2. 🏢 **Departamento recebe:** Alerta de novo chamado
3. 📝 **Histórico criado:** `CHAMADO_CREATED` com seus dados

### **Rastreamento:**
- ✅ Campo `createdById` marca você como criador
- ✅ Tipo `TOP_DOWN` identifica origem
- ✅ Histórico completo de todas ações

---

## 🔍 COMO ACOMPANHAR O CHAMADO?

### **Ver Protocolos:**
```
Menu → Protocolos → Buscar por número: 2025-000042
```

### **Filtrar Chamados Criados:**
```sql
-- Backend pode filtrar por:
createdById = "seu-user-id"
```

---

## 💡 CENÁRIOS DE USO

### **Cenário 1: Atendimento Presencial**
```
Situação: Cidadão sem acesso digital vai até a prefeitura

1. Prefeito/Secretário acessa /admin/chamados
2. Busca o cidadão pelo nome
3. Seleciona o serviço solicitado
4. Preenche descrição baseado no relato do cidadão
5. Define prioridade conforme urgência
6. Cria o chamado
7. Informa o número do protocolo ao cidadão
```

### **Cenário 2: Demanda Política**
```
Situação: Vereador solicita atendimento para eleitor

1. Prefeito acessa sistema
2. Busca cidadão indicado pelo vereador
3. Seleciona serviço apropriado
4. Descreve: "Solicitação do vereador X para..."
5. Define prioridade alta
6. Cria chamado
7. Departamento é notificado automaticamente
```

### **Cenário 3: Emergência**
```
Situação: Situação urgente identificada pela gestão

1. Secretário acessa /admin/chamados
2. Busca cidadão afetado
3. Seleciona serviço de emergência
4. Define prioridade URGENTE
5. Descreve situação com detalhes
6. Cria chamado
7. Pode atribuir servidor específico (futuro)
```

---

## ⚠️ IMPORTANTE

### **Validações:**
- ❌ Cidadão deve estar cadastrado no sistema
- ❌ Serviço deve estar ativo
- ❌ Todos campos marcados com * são obrigatórios
- ✅ Sistema valida tudo antes de criar

### **Permissões:**
- 🔒 Apenas ADMIN e MANAGER podem acessar
- 🔒 Tentativa sem permissão = redirecionamento

### **Dados do Cidadão:**
- 📊 Pré-preenchimento automático (futuro)
- 🔐 Dados sensíveis protegidos
- 📧 Email/SMS enviados automaticamente

---

## 🆘 PROBLEMAS COMUNS

### **"Cidadão não encontrado"**
✅ **Solução:** Cadastre o cidadão primeiro em `/admin/cidadaos`

### **"Serviço não encontrado"**
✅ **Solução:** Verifique se serviço está ativo em `/admin/servicos`

### **"Erro ao criar chamado"**
✅ **Solução:** Verifique conexão e tente novamente

### **Campo obrigatório vazio**
✅ **Solução:** Preencha todos campos marcados com *

---

## 📊 DIFERENÇA: CHAMADO vs PROTOCOLO NORMAL

| Aspecto | CHAMADO (TOP-DOWN) | PROTOCOLO NORMAL |
|---------|-------------------|------------------|
| **Quem cria** | Admin/Manager | Cidadão |
| **Origem** | Governo → Cidadão | Cidadão → Governo |
| **Campo createdById** | Preenchido | NULL |
| **Histórico** | CHAMADO_CREATED | PROTOCOL_CREATED |
| **Notificação** | Imediata para todos | Departamento apenas |
| **Prioridade** | Definida pelo gestor | Padrão (3) |

---

## 🎓 BOAS PRÁTICAS

### **1. Descrição Clara**
```
✅ BOM:
"Cidadão João necessita consulta oftalmológica urgente devido a perda
progressiva de visão nos últimos 15 dias. Já tentou agendar pelo posto
mas não conseguiu vaga."

❌ RUIM:
"Precisa de consulta"
```

### **2. Prioridade Correta**
```
🔴 URGENTE: Risco à vida, emergência
🟠 ALTA: Problema sério mas sem risco imediato
🟡 MÉDIA: Atendimento regular
🟢 BAIXA: Pode aguardar sem prejuízo
```

### **3. Categoria Adequada**
```
✅ Escolha a categoria que melhor representa o serviço
✅ Facilita filtros e relatórios posteriores
✅ Ajuda na análise de demandas por área
```

---

## 📈 ESTATÍSTICAS (Dashboard Futuro)

Métricas que podem ser geradas:

- 📊 Total de chamados criados por gestor
- 📅 Chamados por período
- 🏢 Chamados por departamento
- ⏱️ Tempo médio de resolução
- 🎯 Taxa de conclusão
- 📈 Tendências de demandas

---

## 🔗 LINKS RELACIONADOS

- 📋 **Ver Protocolos:** `/admin/protocolos`
- 👥 **Gerenciar Cidadãos:** `/admin/cidadaos`
- 🛠️ **Gerenciar Serviços:** `/admin/servicos`
- 📊 **Dashboard:** `/admin/dashboard`

---

## 💬 SUPORTE

Dúvidas ou problemas?
- 📧 Contate o administrador do sistema
- 📚 Consulte a documentação técnica
- 🐛 Reporte bugs em `/admin/suporte` (futuro)

---

**Última atualização:** 09/12/2025
**Versão:** 1.0.0
**Status:** ✅ Produção
