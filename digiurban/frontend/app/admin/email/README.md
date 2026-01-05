# Sistema de Email - DigiUrban

Sistema completo de email corporativo integrado ao DigiUrban.

## 📋 Estrutura

```
/admin/email/
├── page.tsx              # Dashboard principal
├── compose/              # Escrever e enviar emails
│   └── page.tsx
├── sent/                 # Histórico de emails enviados
│   └── page.tsx
├── /admin/email-accounts # Gerenciar contas de email
└── /admin/email-service  # Configurações e planos
```

## 🎯 Funcionalidades Implementadas

### ✅ Dashboard (`/admin/email`)
- **Visão geral do uso mensal**
  - Emails enviados vs limite
  - Taxa de entrega
  - Taxa de bounce
  - Contas ativas
- **Gráficos de atividade**
  - Últimos 30 dias
  - Enviados, entregues e falhas
- **Alertas de limite**
  - Aviso quando uso > 80%
- **Ações rápidas**
  - Escrever email
  - Ver enviados
  - Gerenciar contas

### ✅ Composer (`/admin/email/compose`)
- **Editor de Email**
  - Campos: Para, CC, BCC, Assunto
  - Editor de texto (suporta múltiplas linhas)
  - Seleção de conta de envio
  - Prioridade (Alta, Normal, Baixa)
- **Templates**
  - Carregar templates salvos
  - Aplicar template ao email
- **Validações**
  - Validação de formato de email
  - Múltiplos destinatários (separados por vírgula)
  - Campos obrigatórios
- **Envio**
  - Via API `/api/admin/email-accounts/send`
  - Feedback visual do status
  - Redirecionamento para enviados

### ✅ Sent (`/admin/email/sent`)
- **Lista de Emails Enviados**
  - Últimos 100 emails
  - Status colorido (Entregue, Falhou, Na fila, etc)
  - Métricas: Aberturas e Cliques
- **Filtros**
  - Busca por destinatário/assunto
  - Filtro por status
  - Botão atualizar
- **Estatísticas Rápidas**
  - Total, Entregues, Falharam, Pendentes
- **Detalhes do Email**
  - Modal com informações completas
  - Message ID, timestamps
  - Métricas de engajamento
  - Mensagens de erro

## 🔌 APIs Implementadas

### Backend Routes

#### `GET /api/admin/email-service`
Retorna configurações do serviço de email
```json
{
  "hasEmailService": true,
  "plan": {
    "id": "premium",
    "name": "Premium",
    "price": 199,
    "emailsPerMonth": 50000
  },
  "server": {
    "hostname": "mail.digiurban.com.br",
    "isActive": true,
    "maxEmailsPerMonth": 50000
  },
  "accounts": [...],
  "usage": {
    "currentMonth": 1250
  }
}
```

#### `GET /api/admin/email-service/stats`
Estatísticas de envio
```json
{
  "currentMonth": {
    "totalSent": 1250,
    "totalDelivered": 1195,
    "totalFailed": 30,
    "totalBounced": 25,
    "deliveryRate": "95.6%",
    "bounceRate": "2.0%"
  },
  "usage": {
    "current": 1250,
    "limit": 50000,
    "percentage": "2.5"
  },
  "dailyStats": [...]
}
```

#### `POST /api/admin/email-accounts/send`
Enviar email
```json
{
  "accountId": "account-id",
  "to": ["destinatario@exemplo.com"],
  "cc": ["cc@exemplo.com"],
  "bcc": ["bcc@exemplo.com"],
  "subject": "Assunto do email",
  "text": "Corpo do email em texto",
  "html": "<html>...</html>",
  "priority": 3
}
```

#### `GET /api/admin/email/sent` ⭐ NOVA
Lista emails enviados
```json
{
  "success": true,
  "emails": [
    {
      "id": "email-id",
      "messageId": "unique-message-id",
      "fromEmail": "remetente@digiurban.com.br",
      "toEmail": "destinatario@exemplo.com",
      "subject": "Assunto",
      "status": "DELIVERED",
      "sentAt": "2024-01-04T12:00:00Z",
      "deliveredAt": "2024-01-04T12:00:05Z",
      "opens": 5,
      "clicks": 2,
      "createdAt": "2024-01-04T11:59:55Z"
    }
  ]
}
```

## 🎨 Componentes Criados

### `EmailStatusBadge`
Badge colorido para status de email
```tsx
import { EmailStatusBadge } from '@/components/admin/email/EmailStatusBadge';

<EmailStatusBadge status="DELIVERED" size="md" />
```

### `EmailQuickStats`
Cards de estatísticas rápidas
```tsx
import { EmailQuickStats } from '@/components/admin/email/EmailQuickStats';

<EmailQuickStats stats={{
  total: 100,
  delivered: 95,
  failed: 3,
  pending: 2
}} />
```

## 📊 Status de Email

| Status | Descrição | Cor |
|--------|-----------|-----|
| `QUEUED` | Email na fila de envio | Cinza |
| `SENDING` | Email sendo enviado | Azul |
| `SENT` | Email enviado ao servidor | Azul |
| `DELIVERED` | Email entregue com sucesso | Verde |
| `FAILED` | Falha no envio | Vermelho |
| `BOUNCED` | Email rejeitado pelo destinatário | Laranja |

## 🔐 Permissões

| Página | Nível Mínimo |
|--------|--------------|
| Dashboard | `ADMIN` |
| Compose | `COORDINATOR` |
| Sent | `COORDINATOR` |
| Accounts | `ADMIN` |
| Settings | `ADMIN` |

## 🚀 Próximas Melhorias (Fase 2)

- [ ] Caixa de entrada (receber emails)
- [ ] Rascunhos (salvar emails não enviados)
- [ ] Anexos (upload de arquivos)
- [ ] Editor rich text (HTML WYSIWYG)
- [ ] Agendamento de envio
- [ ] Templates customizados
- [ ] Assinaturas de email
- [ ] Filtros avançados
- [ ] Exportação de relatórios
- [ ] Notificações em tempo real

## 📱 Navegação

O menu Email foi adicionado à sidebar do Admin com os seguintes links:

- 📊 **Dashboard** - Visão geral e estatísticas
- ✉️ **Escrever Email** - Composer
- 📤 **Enviados** - Histórico
- 👥 **Contas** - Gerenciar contas de email
- ⚙️ **Configurações** - Planos e configurações

## 🎯 Como Usar

### 1. Contratar Plano
Acesse `/admin/email-service` e escolha um plano

### 2. Criar Conta de Email
Acesse `/admin/email-accounts` e crie contas

### 3. Enviar Email
Acesse `/admin/email/compose` e envie seu primeiro email!

## 🐛 Troubleshooting

**Erro: "Serviço de email não ativado"**
- Solução: Contrate um plano em `/admin/email-service`

**Erro: "Nenhuma conta disponível"**
- Solução: Crie uma conta em `/admin/email-accounts`

**Email não aparece em "Enviados"**
- Verifique se o backend está rodando
- Verifique os logs do servidor SMTP
- Aguarde alguns segundos e clique em "Atualizar"
