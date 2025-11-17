# 🔍 COMO DEBUGAR O ERRO

## 1. Reiniciar o Backend

```bash
cd digiurban/backend
npm run dev
```

Aguarde a mensagem: `✅ Backend rodando na porta 3001`

---

## 2. Testar no Frontend

1. Acesse: http://localhost:3000/cidadao/servicos
2. Escolha "Alerta de Segurança"
3. **Preencha TODOS os campos obrigatórios**:
   - Tipo de Alerta: Selecione uma opção
   - Local do Alerta: Digite um endereço
   - Descrição do Alerta: Digite pelo menos 20 caracteres
   - **Nível de Urgência**: Selecione uma opção (IMPORTANTE!)
4. Clique em "Solicitar Serviço"

---

## 3. Copiar os Logs

### No Console do Navegador (F12 → Console):

Procure por:
```
🔍 [FRONTEND DEBUG] customFormData antes de enviar:
```

Copie TUDO que aparecer.

### No Terminal do Backend:

Procure por:
```
📋 [Service Request] customFormData recebido:
[Validation] Campos obrigatórios após filtrar citizen:
❌ [Service Request] Validação falhou:
```

Copie TUDO que aparecer.

---

## 4. Cole Aqui no Chat

Cole os logs para eu analisar exatamente o que está sendo:
- Enviado pelo frontend
- Recebido pelo backend
- Validado pelo AJV

---

## 🎯 Problemas Comuns Identificados

1. **Campo enum vazio**: Se você não selecionar "Nível de Urgência", dará erro
2. **Valor do enum incorreto**: Deve ser exatamente "Baixa", "Média", "Alta" ou "Emergencial" (com acento!)
3. **Campos citizen sendo enviados**: O frontend pode estar enviando campos que não deveria

Com os logs, vamos descobrir qual é o problema exato! 🔍
