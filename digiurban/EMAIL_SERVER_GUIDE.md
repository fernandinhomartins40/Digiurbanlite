# Guia do Servidor de Email Próprio DigiUrban

## Visão Geral

O DigiUrban possui um **servidor de email SMTP próprio** completo, permitindo que municípios enviem emails transacionais sem depender de serviços externos como Gmail, SendGrid, etc.

## Características

- ✅ Servidor SMTP completo com suporte a MX (porta 25) e Submission (porta 587)
- ✅ Autenticação de usuários
- ✅ Suporte a múltiplos domínios
- ✅ DKIM, SPF e DMARC para autenticação de emails
- ✅ TLS/SSL para segurança
- ✅ Dashboard de monitoramento em tempo real
- ✅ Sistema de logs completo
- ✅ Estatísticas de entrega
- ✅ Serviço premium com billing

## Acesso ao Painel

1. Faça login como **Super Admin** em: `/super-admin/login`
2. Acesse o menu "Servidor de Email"
3. Você verá 3 páginas principais:
   - **Dashboard** - Visão geral e estatísticas
   - **Configuração** - Configurar e controlar o servidor
   - **Domínios** - Gerenciar domínios de email

## Configuração Inicial

### 1. Configurar o Servidor

Acesse `/super-admin/email-server/config` e configure:

#### Configurações Gerais:
- **Hostname**: O domínio do seu servidor SMTP (ex: `mail.prefeitura.sp.gov.br`)
- **Porta MX**: Porta para receber emails (padrão: 25)
- **Porta Submission**: Porta para enviar emails (padrão: 587)
- **Máximo de Conexões**: Limite de conexões simultâneas (padrão: 100)
- **Tamanho Máximo de Mensagem**: Limite de tamanho por email (padrão: 50MB)

#### Configurações de Segurança:
- **TLS/SSL Habilitado**: Ativa criptografia (recomendado)
- **Caminho do Certificado**: Caminho para o arquivo `.pem` do certificado SSL
- **Caminho da Chave Privada**: Caminho para o arquivo `.key` da chave privada SSL
- **Autenticação Obrigatória**: Exige login para enviar emails (recomendado)

#### Configurações Premium:
- **Serviço Premium Habilitado**: Ativa billing mensal para municípios
- **Preço Mensal**: Valor a ser cobrado (padrão: R$ 99,00)
- **Limite de Emails/Mês**: Cota mensal de emails (padrão: 10.000)

### 2. Iniciar o Servidor

Após salvar as configurações, clique em **"Iniciar Servidor"**.

O servidor será iniciado automaticamente. Se não houver configuração prévia, será criado um servidor com valores padrão:
- Hostname: `mail.digiurban.com`
- Porta MX: 25
- Porta Submission: 587
- TLS: Habilitado
- Premium: Habilitado (R$ 99,00/mês, 10.000 emails/mês)

### 3. Adicionar um Domínio

Acesse `/super-admin/email-server/domains` e:

1. Clique em **"+ Adicionar Domínio"**
2. Digite o nome do domínio (ex: `prefeitura.sp.gov.br`)
3. O sistema irá:
   - Criar o domínio
   - Gerar chaves DKIM automaticamente
   - Gerar registros DNS necessários

### 4. Configurar DNS

Para cada domínio adicionado, você precisa criar os seguintes registros DNS:

#### Registro MX (Mail Exchange)
```
Tipo: MX
Nome: @
Valor: mail.digiurban.com
Prioridade: 10
TTL: 3600
```

#### Registro SPF (Sender Policy Framework)
```
Tipo: TXT
Nome: @
Valor: v=spf1 mx ~all
TTL: 3600
```

#### Registro DKIM (DomainKeys Identified Mail)
```
Tipo: TXT
Nome: default._domainkey
Valor: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
TTL: 3600
```
*(Copie o valor exato da aba "DKIM" no painel)*

#### Registro DMARC (Domain-based Message Authentication)
```
Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:postmaster@seudominio.com
TTL: 3600
```

### 5. Verificar DNS

Após configurar os registros DNS (aguarde propagação de 5-30 minutos), volte ao painel e clique em **"Verificar DNS"** em cada domínio.

O sistema irá validar:
- ✅ Registro MX
- ✅ Registro SPF
- ✅ Registro DKIM
- ✅ Registro DMARC

Quando todos estiverem verificados, o domínio estará **ativo** e pronto para enviar emails!

## Enviar Emails Transacionais

### Via API REST

```javascript
const response = await fetch('http://localhost:4000/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_JWT'
  },
  body: JSON.stringify({
    emailServerId: 'ID_DO_EMAIL_SERVER',
    templateName: 'protocolo_criado',
    to: 'cidadao@email.com',
    variables: {
      citizenName: 'João Silva',
      protocolNumber: '2024/001234',
      serviceName: 'Licença de Obra',
      createdAt: '30/12/2024 14:30'
    },
    from: {
      name: 'Prefeitura Municipal',
      email: 'noreply@prefeitura.sp.gov.br'
    },
    priority: 1 // 1 = alta, 3 = normal (padrão), 5 = baixa
  })
});
```

### Via TransactionalEmailService (Backend)

```typescript
import { TransactionalEmailService } from '@/lib/email/TransactionalEmailService';

const emailService = new TransactionalEmailService();

await emailService.sendEmail({
  emailServerId: emailServer.id,
  templateName: 'protocolo_criado',
  to: 'cidadao@email.com',
  variables: {
    citizenName: citizen.name,
    protocolNumber: protocol.number,
    serviceName: service.name,
    createdAt: new Date().toLocaleString('pt-BR')
  },
  from: {
    name: 'Prefeitura Municipal',
    email: 'noreply@prefeitura.sp.gov.br'
  },
  priority: 1
});
```

## Templates de Email Disponíveis

O sistema possui templates pré-configurados para eventos do protocolo:

1. **protocolo_criado** - Notifica cidadão quando protocolo é criado
2. **protocolo_atualizado** - Notifica quando há atualização no protocolo
3. **protocolo_concluido** - Notifica quando protocolo é concluído
4. **protocolo_cancelado** - Notifica quando protocolo é cancelado
5. **documento_pendente** - Notifica sobre documentos pendentes
6. **agendamento_confirmado** - Confirma agendamento de atendimento

Cada template suporta variáveis dinâmicas que são preenchidas no momento do envio.

## Monitoramento

### Dashboard em Tempo Real

Acesse `/super-admin/email-server` para visualizar:

- **Status do Servidor**: Online/Offline
- **Uptime**: Tempo que o servidor está rodando
- **Total de Domínios**: Total, Verificados, Pendentes
- **Estatísticas de Emails**:
  - Total de emails enviados
  - Emails entregues
  - Emails falhados
  - Emails na fila
  - Taxa de entrega (%)
- **Atividade Recente**: Últimos logs do servidor

### Estatísticas por Domínio

Na aba **"Stats"** de cada domínio, você vê:

- Total de emails enviados
- Taxa de entrega
- Taxa de abertura (opens)
- Taxa de cliques (clicks)
- Gráficos de performance

### Logs

Acesse os logs do servidor clicando em **"Ver Logs"** na página de configuração.

Tipos de logs:
- **INFO**: Informações gerais
- **WARN**: Avisos
- **ERROR**: Erros

## Operações do Servidor

### Iniciar Servidor

```bash
# Via API
POST /api/super-admin/email-server/start
```

Inicia o servidor SMTP. Se não existir configuração, cria uma automaticamente.

### Parar Servidor

```bash
# Via API
POST /api/super-admin/email-server/stop
```

Para o servidor SMTP gracefully (aguarda emails em processamento).

### Reiniciar Servidor

```bash
# Via API
POST /api/super-admin/email-server/restart
```

Para e inicia o servidor novamente. Útil após mudanças de configuração.

## Arquitetura Técnica

### Backend (Express)

- **Rotas**: `backend/src/routes/email-server.ts`
- **Servidor SMTP**: `backend/src/lib/email/DigiUrbanSMTPServer.ts`
- **Gerenciador**: `backend/src/lib/email/email-server-manager.ts`
- **Serviço Transacional**: `backend/src/lib/email/TransactionalEmailService.ts`

### Frontend (Next.js)

- **API Routes**: `frontend/app/api/super-admin/email-server/*/route.ts`
- **Páginas**:
  - Dashboard: `frontend/app/super-admin/email-server/page.tsx`
  - Config: `frontend/app/super-admin/email-server/config/page.tsx`
  - Domains: `frontend/app/super-admin/email-server/domains/page.tsx`
- **Types**: `frontend/types/email-server.ts`

### Banco de Dados (Prisma)

Modelos principais:
- `EmailServer` - Configuração do servidor
- `EmailDomain` - Domínios configurados
- `EmailUser` - Usuários do servidor SMTP
- `Email` - Emails enviados (log completo)
- `EmailLog` - Logs de eventos
- `EmailStats` - Estatísticas agregadas
- `EmailEvent` - Eventos de tracking (opens, clicks)

## Segurança

### DKIM (DomainKeys Identified Mail)

Assina emails com chave privada para provar autenticidade.

- Chave privada: Armazenada no banco (criptografada)
- Chave pública: Publicada no DNS
- Seletor: `default._domainkey.seudominio.com`

### SPF (Sender Policy Framework)

Define quais servidores podem enviar email pelo domínio.

```
v=spf1 mx ~all
```

Significa: "Apenas servidores listados no MX podem enviar. Outros serão marcados como suspeitos."

### DMARC (Domain-based Message Authentication)

Política de como lidar com emails que falharem DKIM/SPF.

```
v=DMARC1; p=quarantine; rua=mailto:postmaster@seudominio.com
```

- `p=quarantine`: Coloca emails suspeitos em spam
- `rua=...`: Envia relatórios de autenticação

### TLS/SSL

Criptografa conexões SMTP para proteger emails em trânsito.

## Billing e Premium

O serviço pode ser configurado como **Premium**:

- **Preço Mensal**: Definido pelo Super Admin (padrão R$ 99,00)
- **Limite de Emails**: Cota mensal (padrão 10.000)
- **Tracking**: Sistema monitora uso por município
- **Faturamento**: Pode ser integrado com gateway de pagamento

## Troubleshooting

### Servidor não inicia

1. Verifique se a porta 587 está livre:
   ```bash
   netstat -ano | findstr :587
   ```

2. Verifique permissões do certificado SSL

3. Veja logs detalhados clicando em "Ver Logs"

### Emails não são entregues

1. Verifique se o domínio está verificado (DNS)
2. Veja taxa de falhas no dashboard
3. Verifique logs de erro
4. Teste com email de teste na aba "Test" do domínio

### DNS não verifica

1. Aguarde propagação (5-30 minutos)
2. Verifique se copiou os registros corretamente
3. Use ferramentas como `dig` ou `nslookup`:
   ```bash
   dig MX seudominio.com
   dig TXT default._domainkey.seudominio.com
   ```

## Limitações Conhecidas

- Servidor roda em Node.js (single-threaded), ideal para até 10.000 emails/dia
- Para volumes maiores (100k+ emails/dia), considere usar serviço externo como SendGrid
- Porta 25 (MX) pode ser bloqueada por provedores de cloud (AWS, Azure)
- Requer IP estático e reverso DNS configurado para melhor deliverability

## Próximos Passos

- [ ] Implementar queue system com Bull/Redis para emails em massa
- [ ] Adicionar template editor visual
- [ ] Implementar webhooks para eventos de email
- [ ] Sistema de replay/retry automático
- [ ] Dashboard de analytics avançado
- [ ] Integração com gateway de pagamento
- [ ] Multi-tenancy por município
- [ ] API de gerenciamento de usuários SMTP

## Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Contate o time de desenvolvimento
- Consulte logs do sistema em `/super-admin/email-server/config` → "Ver Logs"
