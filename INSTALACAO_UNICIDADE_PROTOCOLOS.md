# 🚀 Guia Rápido: Instalação do Sistema de Unicidade de Protocolos

## ⏱️ Tempo estimado: 5 minutos

---

## 📋 Pré-requisitos

- ✅ Banco de dados PostgreSQL rodando
- ✅ Backend funcionando
- ✅ Acesso ao terminal

---

## 🔧 Passo a Passo

### 1️⃣ Aplicar Migration (Obrigatório)

```bash
cd digiurban/backend
npx prisma migrate deploy
```

**O que faz**: Adiciona 3 campos à tabela `services_simplified`:
- `allowMultipleActiveProtocols` (Boolean)
- `uniquenessScope` (String)
- `uniquenessRules` (JSONB)

**Tempo**: ~10 segundos

---

### 2️⃣ Configurar Serviços Existentes (Recomendado)

```bash
npx ts-node prisma/seeds/service-uniqueness-rules.seed.ts
```

**O que faz**: Configura regras para 20+ serviços comuns:
- Cadastros (Produtor Rural, Propriedade, etc.)
- Licenças (Funcionamento, Alvará)
- Matrículas (Escolar, Transferência)
- E mais...

**Tempo**: ~5 segundos

**Output esperado**:
```
🔧 Configurando regras de unicidade de serviços...

✓ Cadastro de Produtor Rural
  → 🚫 Único ativo | Escopo: CUSTOM
  → Regras: {...}

✓ Matrícula Escolar
  → 🚫 Único ativo | Escopo: CITIZEN_PER_FIELD
  → Regras: {...}

========================================
📊 RESUMO:
   ✓ Serviços atualizados: 20
   ❌ Serviços não encontrados: 0
   ⚠️  Configurações ignoradas: 0
========================================
```

---

### 3️⃣ Reiniciar Backend (Obrigatório)

```bash
# Parar backend (Ctrl+C)
npm run dev
```

**Tempo**: ~5 segundos

---

### 4️⃣ Verificar Instalação

#### Opção A: Via SQL

```sql
-- Ver campos adicionados
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'services_simplified'
  AND column_name IN ('allowMultipleActiveProtocols', 'uniquenessScope', 'uniquenessRules');

-- Ver serviços configurados
SELECT name, "allowMultipleActiveProtocols", "uniquenessScope"
FROM services_simplified
WHERE "allowMultipleActiveProtocols" = false
LIMIT 5;
```

#### Opção B: Teste Prático

1. Faça login no portal do cidadão
2. Solicite "Cadastro de Produtor Rural" (se disponível)
3. Tente solicitar novamente
4. **Resultado esperado**: ❌ Bloqueio com mensagem clara

---

## ✅ Pronto!

O sistema está instalado e funcionando. Agora:

- ✅ Serviços com `allowMultipleActiveProtocols = false` bloqueiam duplicatas
- ✅ Validação ocorre automaticamente em toda criação de protocolo
- ✅ Mensagens de erro claras para o cidadão

---

## 📖 Próximos Passos

### Para Desenvolvedores

1. **Ler documentação completa**: [SISTEMA_UNICIDADE_PROTOCOLOS.md](SISTEMA_UNICIDADE_PROTOCOLOS.md)
2. **Entender escopos**: CITIZEN, CUSTOM, CITIZEN_PER_FIELD
3. **Adicionar validações customizadas**: Editar [protocol-uniqueness.service.ts](digiurban/backend/src/services/protocol-uniqueness.service.ts)

### Para Administradores

1. **Revisar serviços configurados**:
```sql
SELECT name, "uniquenessScope"
FROM services_simplified
WHERE "allowMultipleActiveProtocols" = false;
```

2. **Configurar novos serviços**: Ao criar serviço via admin, incluir campos de unicidade

3. **Ajustar regras existentes**: Via SQL ou seed

---

## 🔧 Configuração Manual de Serviço

Se precisar configurar um serviço manualmente:

```sql
-- Exemplo: Permitir apenas 1 licença ativa por cidadão
UPDATE services_simplified
SET
  "allowMultipleActiveProtocols" = false,
  "uniquenessScope" = 'CITIZEN',
  "uniquenessRules" = NULL
WHERE name = 'Licença Ambiental';
```

---

## 🆘 Problemas?

### Validação não está funcionando

**1. Migration foi aplicada?**
```sql
SELECT * FROM _prisma_migrations
WHERE migration_name LIKE '%uniqueness%';
```

**2. Backend foi reiniciado?**
```bash
# Parar e reiniciar
npm run dev
```

**3. Serviço está configurado?**
```sql
SELECT "allowMultipleActiveProtocols"
FROM services_simplified
WHERE name = 'NOME_DO_SERVICO';
```

### Seed falhou

**Erro comum**: Serviços não encontrados (migration de serviços não foi executada)

**Solução**:
1. Verificar quais serviços existem: `SELECT name FROM services_simplified;`
2. Editar seed para usar nomes corretos
3. Executar seed novamente

---

## 📞 Suporte

- 📖 **Documentação completa**: [SISTEMA_UNICIDADE_PROTOCOLOS.md](SISTEMA_UNICIDADE_PROTOCOLOS.md)
- 🔍 **Troubleshooting**: Seção específica na documentação
- 💬 **Logs do backend**: Verificar console para mensagens de validação

---

**✨ Sistema instalado com sucesso! Bom trabalho!**
