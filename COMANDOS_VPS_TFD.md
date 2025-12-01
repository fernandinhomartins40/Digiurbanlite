# 🔍 Comandos para Investigar TFD na VPS

## 1. Conectar na VPS

```bash
ssh root@SEU_IP_VPS
# ou
ssh usuario@digiurban.com.br
```

## 2. Navegar até o diretório do projeto

```bash
cd /var/www/digiurban
# ou onde estiver o projeto
cd /home/digiurban
```

## 3. Verificar Protocolos TFD (via Prisma CLI)

```bash
# Acessar o backend
cd backend

# Executar query direto no banco
npx prisma db execute --stdin <<EOF
SELECT
  id,
  number,
  title,
  "moduleType",
  status,
  "createdAt",
  "customData"
FROM "ProtocolSimplified"
WHERE
  "moduleType" LIKE '%TFD%'
  OR title LIKE '%TFD%'
ORDER BY "createdAt" DESC
LIMIT 10;
EOF
```

## 4. Verificar Solicitações TFD

```bash
npx prisma db execute --stdin <<EOF
SELECT
  id,
  "protocolId",
  "citizenId",
  especialidade,
  "cidadeDestino",
  status,
  prioridade,
  "createdAt"
FROM "SolicitacaoTFD"
ORDER BY "createdAt" DESC
LIMIT 10;
EOF
```

## 5. Executar Script de Diagnóstico na VPS

```bash
# Criar o script na VPS
cd /var/www/digiurban/backend

# Executar diagnóstico
npx ts-node -e "
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('🔍 DIAGNÓSTICO TFD - PRODUÇÃO\n');

  // Protocolos TFD
  const protocolos = await prisma.protocolSimplified.findMany({
    where: {
      OR: [
        { moduleType: { contains: 'TFD' } },
        { title: { contains: 'TFD', mode: 'insensitive' } }
      ]
    },
    include: {
      citizen: { select: { name: true, cpf: true } },
      service: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(\`📋 Protocolos TFD: \${protocolos.length}\n\`);
  protocolos.forEach(p => {
    console.log(\`- \${p.number} | \${p.citizen.name}\`);
    console.log(\`  Status: \${p.status} | Module: \${p.moduleType}\`);
    const customData = p.customData as any;
    if (customData?.tfdSolicitacaoId) {
      console.log(\`  ✅ Convertido: \${customData.tfdSolicitacaoId}\`);
    } else {
      console.log(\`  ❌ NÃO CONVERTIDO\`);
    }
    console.log('');
  });

  // Solicitações TFD
  const solicitacoes = await prisma.solicitacaoTFD.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(\`\n🏥 Solicitações TFD: \${solicitacoes.length}\n\`);
  solicitacoes.forEach(s => {
    console.log(\`- ID: \${s.id}\`);
    console.log(\`  Protocolo: \${s.protocolId}\`);
    console.log(\`  Status: \${s.status}\`);
    console.log(\`  Destino: \${s.cidadeDestino}\`);
    console.log('');
  });

  await prisma.\$disconnect();
}

check().catch(console.error);
"
```

## 6. Verificar Logs do Backend (erros de conversão)

```bash
# Ver logs do PM2 (se estiver usando PM2)
pm2 logs backend --lines 100 | grep -i "tfd\|erro"

# Ou logs do sistema
journalctl -u digiurban-backend -n 100 --no-pager | grep -i "tfd\|erro"

# Ou arquivos de log
tail -n 100 /var/log/digiurban/backend.log | grep -i "tfd"
```

## 7. Verificar Variáveis de Ambiente

```bash
cd /var/www/digiurban/backend
cat .env | grep DATABASE_URL
```

## 8. Consulta SQL Direta (PostgreSQL)

```bash
# Conectar no PostgreSQL
psql -U postgres -d digiurban

# Ou se tiver credenciais diferentes
psql $DATABASE_URL
```

Dentro do PostgreSQL:

```sql
-- Ver todos os protocolos TFD
SELECT
  number,
  title,
  "moduleType",
  status,
  "createdAt",
  "customData"->>'tfdSolicitacaoId' as tfd_id,
  "customData"->>'convertedToTFD' as convertido
FROM "ProtocolSimplified"
WHERE
  "moduleType" LIKE '%TFD%'
  OR title ILIKE '%TFD%'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Ver solicitações TFD
SELECT
  id,
  "protocolId",
  especialidade,
  "cidadeDestino",
  status,
  "createdAt"
FROM "SolicitacaoTFD"
ORDER BY "createdAt" DESC
LIMIT 20;

-- Verificar protocolo específico (substitua pelo número)
SELECT * FROM "ProtocolSimplified" WHERE number = '2025-XXXXX';

-- Sair
\q
```

## 9. Forçar Conversão Manual (se necessário)

Se encontrar protocolos TFD não convertidos:

```bash
cd /var/www/digiurban/backend

npx ts-node -e "
import { PrismaClient } from '@prisma/client';
import protocolToTFDService from './src/services/tfd/protocol-to-tfd.service';

const prisma = new PrismaClient();

async function converter(protocolId: string) {
  try {
    console.log(\`🔄 Convertendo protocolo \${protocolId}...\`);
    const solicitacao = await protocolToTFDService.convertProtocolToTFD(protocolId);
    console.log(\`✅ Solicitação TFD criada: \${solicitacao.id}\`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

// SUBSTITUA pelo ID do protocolo
converter('ID_DO_PROTOCOLO_AQUI');
"
```

## 10. Script de Diagnóstico Completo (Upload para VPS)

Faça upload do script criado localmente:

```bash
# Do seu computador local
scp digiurban/backend/scripts/diagnostico-tfd.ts usuario@VPS:/var/www/digiurban/backend/scripts/

# Na VPS
cd /var/www/digiurban/backend
npx ts-node scripts/diagnostico-tfd.ts
```

## 11. Verificar se a API está funcionando

```bash
# Testar endpoint de stats
curl http://localhost:3001/api/tfd/dashboard/stats

# Testar listagem de solicitações
curl http://localhost:3001/api/tfd/solicitacoes

# Com autenticação (se necessário)
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/api/tfd/solicitacoes
```

## 12. Verificar Processo do Backend

```bash
# Ver se o backend está rodando
pm2 status

# Reiniciar backend
pm2 restart backend

# Ver detalhes
pm2 show backend
```

---

## 🚨 Cenários e Soluções

### Cenário 1: Protocolo existe mas não foi convertido

**Sintoma**: Protocolo tem `moduleType: ENCAMINHAMENTOS_TFD` mas não tem `customData.tfdSolicitacaoId`

**Solução**: Executar conversão manual (comando #9)

### Cenário 2: Solicitação TFD existe mas não aparece no APP

**Possíveis causas**:
- API não está respondendo
- Frontend não está buscando da API correta
- Problema de autenticação

**Diagnóstico**:
```bash
# Verificar se API responde
curl http://localhost:3001/api/tfd/solicitacoes

# Ver logs em tempo real
pm2 logs backend --lines 0
```

### Cenário 3: Erro de conversão automática

**Verificar nos logs**:
```bash
pm2 logs backend | grep "convertProtocolToTFD\|ENCAMINHAMENTOS_TFD"
```

---

## 📝 Checklist de Investigação

- [ ] Conectou na VPS
- [ ] Verificou protocolos TFD no banco (comando #3)
- [ ] Verificou solicitações TFD no banco (comando #4)
- [ ] Executou script de diagnóstico (comando #5)
- [ ] Verificou logs de erro (comando #6)
- [ ] Testou API manualmente (comando #11)
- [ ] Identificou o problema
- [ ] Aplicou solução

---

## 🆘 Se precisar de ajuda

Me informe o resultado de:
1. Comando #3 (protocolos TFD)
2. Comando #4 (solicitações TFD)
3. Comando #5 (diagnóstico completo)

Com essas informações, posso identificar exatamente o problema!
