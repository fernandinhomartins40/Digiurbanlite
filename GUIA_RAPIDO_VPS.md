# 🚀 Guia Rápido - Investigar TFD na VPS

## Opção 1: Script Automatizado (Mais Fácil) ⭐

### 1. Fazer upload do script para VPS

```bash
# Do seu computador local
scp diagnostico-vps.sh root@SEU_IP_VPS:/tmp/
scp digiurban/backend/scripts/diagnostico-tfd.ts root@SEU_IP_VPS:/var/www/digiurban/backend/scripts/
```

### 2. Executar na VPS

```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Dar permissão de execução
chmod +x /tmp/diagnostico-vps.sh

# Executar
/tmp/diagnostico-vps.sh
```

Esse script vai:
- ✅ Listar protocolos TFD
- ✅ Listar solicitações TFD
- ✅ Identificar protocolos não convertidos
- ✅ Testar API
- ✅ Verificar logs de erro
- ✅ Dar resumo completo

---

## Opção 2: Comandos Manuais (Mais Controle)

### 1. Conectar na VPS

```bash
ssh root@SEU_IP_VPS
cd /var/www/digiurban/backend
```

### 2. Query Rápida - Ver Protocolos TFD

```bash
npx prisma db execute --stdin <<'EOF'
SELECT
  number,
  title,
  status,
  "createdAt"::date,
  CASE
    WHEN "customData"::text LIKE '%tfdSolicitacaoId%' THEN '✅ Convertido'
    ELSE '❌ NÃO Convertido'
  END as situacao
FROM "ProtocolSimplified"
WHERE "moduleType" LIKE '%TFD%'
ORDER BY "createdAt" DESC
LIMIT 20;
EOF
```

### 3. Ver Solicitações TFD

```bash
npx prisma db execute --stdin <<'EOF'
SELECT
  id,
  "protocolId",
  especialidade,
  "cidadeDestino",
  status,
  "createdAt"::date
FROM "SolicitacaoTFD"
ORDER BY "createdAt" DESC
LIMIT 20;
EOF
```

### 4. Encontrar Protocolo Específico

```bash
# Substitua XXXXX pelo número do protocolo
npx prisma db execute --stdin <<'EOF'
SELECT
  id,
  number,
  title,
  status,
  "moduleType",
  "customData"
FROM "ProtocolSimplified"
WHERE number = '2025-XXXXX';
EOF
```

---

## Opção 3: Via Prisma Studio (Interface Gráfica)

### 1. Abrir túnel SSH

```bash
# Do seu computador local
ssh -L 5555:localhost:5555 root@SEU_IP_VPS
```

### 2. Na VPS (em outra aba do terminal)

```bash
ssh root@SEU_IP_VPS
cd /var/www/digiurban/backend
npx prisma studio --port 5555
```

### 3. No seu navegador local

```
http://localhost:5555
```

Agora você pode ver e editar os dados visualmente!

---

## 🔍 O Que Procurar

### Protocolo TFD deve ter:
- ✅ `moduleType`: `ENCAMINHAMENTOS_TFD`
- ✅ `customData.tfdSolicitacaoId`: deve existir
- ✅ `customData.convertedToTFD`: `true`

### Se protocolo NÃO foi convertido:

**Forçar conversão manual:**

```bash
cd /var/www/digiurban/backend

# Substitua ID_DO_PROTOCOLO pelo ID real
npx ts-node -e "
import protocolToTFDService from './src/services/tfd/protocol-to-tfd.service';

(async () => {
  try {
    const sol = await protocolToTFDService.default.convertProtocolToTFD('ID_DO_PROTOCOLO');
    console.log('✅ Convertido:', sol.id);
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
})();
"
```

---

## 🆘 Problemas Comuns e Soluções

### 1. "Nenhum protocolo TFD encontrado"

**Possíveis causas:**
- Protocolo foi criado com serviço errado
- `moduleType` não é `ENCAMINHAMENTOS_TFD`
- Está em outro banco de dados

**Solução:**
```bash
# Ver TODOS os protocolos recentes
npx prisma db execute --stdin <<'EOF'
SELECT number, title, "moduleType", status
FROM "ProtocolSimplified"
ORDER BY "createdAt" DESC
LIMIT 50;
EOF
```

### 2. "Protocolo existe mas não foi convertido"

**Sintoma:** Protocolo tem `moduleType: ENCAMINHAMENTOS_TFD` mas não tem `tfdSolicitacaoId`

**Solução:** Usar conversão manual (comando acima)

### 3. "Solicitação TFD existe mas não aparece no APP"

**Verificar:**
```bash
# Testar API
curl http://localhost:3001/api/tfd/solicitacoes

# Ver logs
pm2 logs backend --lines 50
```

**Possíveis causas:**
- API não está respondendo
- Frontend chamando URL errada
- Problema de CORS

---

## 📋 Checklist Rápido

Execute na ordem:

```bash
# 1. Conectar
ssh root@SEU_IP_VPS

# 2. Ir para o diretório
cd /var/www/digiurban/backend

# 3. Ver protocolos TFD
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) FROM "ProtocolSimplified" WHERE "moduleType" LIKE '%TFD%';
EOF

# 4. Ver solicitações TFD
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) FROM "SolicitacaoTFD";
EOF

# 5. Testar API
curl http://localhost:3001/api/tfd/solicitacoes

# 6. Ver logs
pm2 logs backend --lines 20
```

---

## 📊 Resultado Esperado

Se tudo estiver OK, você deve ver:

```
✅ Protocolos TFD: X (onde X > 0)
✅ Solicitações TFD: X (mesmo número de protocolos)
✅ API respondendo: HTTP 200
✅ Todos protocolos convertidos
```

Se algo estiver errado:

```
❌ Protocolos TFD: X
❌ Solicitações TFD: 0 ou < X
❌ API: HTTP 500 ou não responde
❌ Protocolos não convertidos: Y
```

---

## 🎯 Próximos Passos

Após executar o diagnóstico, me envie:

1. **Quantos protocolos TFD existem?**
2. **Quantas solicitações TFD existem?**
3. **A API está respondendo?** (HTTP 200 ou erro?)
4. **Há protocolos não convertidos?** (se sim, quantos?)

Com essas informações, vou te ajudar a resolver o problema específico!
