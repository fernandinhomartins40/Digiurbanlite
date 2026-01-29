# Correção do Deploy - Problema com atestado.service.ts

## 🔴 Problema Identificado

O deploy estava falhando com o seguinte erro durante a compilação do backend no Docker:

```
error TS2307: Cannot find module './atestado.service' or its corresponding type declarations.
```

## 🔍 Causa Raiz

O arquivo `atestado.service.ts` **não estava sendo copiado** para o container Docker durante o build, apesar de existir no repositório Git.

### Análise Detalhada

O problema estava no arquivo `.dockerignore`:

**Padrão Problemático:**
```dockerignore
**/*test*.ts  # ❌ ERRADO: Bloqueia qualquer arquivo com "test" no nome
```

Este padrão bloqueava o arquivo `atestado.service.ts` porque a palavra "**atestado**" contém "**test**":
- a-**TEST**-ado

### Evidência do Problema

Debug no Dockerfile mostrou:

```bash
=== DEBUG: Verificando arquivos copiados ===
total 124
-rw-r--r--  1 root root  8117 Jan 29 00:42 agenda.service.ts
-rw-r--r--  1 root root  5797 Jan 29 00:42 agendamento.service.ts
-rw-r--r--  1 root root 18687 Jan 29 00:42 atendimento.service.ts
# ... apenas 10 arquivos (faltava atestado.service.ts)

=== DEBUG: Verificando se atestado.service.ts existe ===
NÃO EXISTE  # ❌ Arquivo não foi copiado
```

## ✅ Solução Aplicada

### 1. Correção no `.dockerignore`

**Antes:**
```dockerignore
# Scripts de teste
**/*test*.js
**/*test*.ts  # ❌ Bloqueava "atestado.service.ts"
```

**Depois:**
```dockerignore
# Scripts de teste (com word boundaries para não bloquear atestado.service.ts)
**/*.test.js   # ✅ Apenas arquivos terminando com .test.js
**/*.test.ts   # ✅ Apenas arquivos terminando com .test.ts
**/*.spec.js   # ✅ Apenas arquivos terminando com .spec.js
**/*.spec.ts   # ✅ Apenas arquivos terminando com .spec.ts
**/test-*.js   # ✅ Apenas arquivos começando com test-
**/test-*.ts   # ✅ Apenas arquivos começando com test-
```

### 2. Adição de Extensões .js nos Imports

Para garantir compatibilidade com o TypeScript em modo ES Modules, foram adicionadas extensões `.js` nos imports:

**Arquivo:** `digiurban/backend/src/services/atendimento/index.ts`

```typescript
export { default as AgendaService } from './agenda.service.js';
export { default as AgendamentoService } from './agendamento.service.js';
export { default as FilaService } from './fila.service.js';
export { default as ProntuarioService } from './prontuario.service.js';
export { default as PrescricaoService } from './prescricao.service.js';
export { default as ExamesService } from './exames.service.js';
export { default as AtestadoService } from './atestado.service.js';  // ✅ Com .js
export { default as EncaminhamentoService } from './encaminhamento.service.js';
export { default as AtendimentoService } from './atendimento.service.js';
```

O mesmo foi aplicado para:
- `digiurban/backend/src/services/farmacia/index.ts`
- `digiurban/backend/src/services/tfd/index.ts`

### 3. Comandos de Debug no Dockerfile

Adicionados comandos de debug para facilitar diagnóstico futuro:

**Arquivo:** `Dockerfile` (linhas 46-52)

```dockerfile
# Debug: Listar arquivos copiados ANTES da compilação
RUN echo "=== DEBUG: Verificando arquivos copiados ===" && \
    ls -la src/services/atendimento/ && \
    echo "=== DEBUG: Conteúdo do index.ts ===" && \
    cat src/services/atendimento/index.ts && \
    echo "=== DEBUG: Verificando se atestado.service.ts existe ===" && \
    test -f src/services/atendimento/atestado.service.ts && echo "EXISTE" || echo "NÃO EXISTE"
```

### 4. Cópia de Templates no Dockerfile

Garantido que a pasta `templates` seja copiada:

**Arquivo:** `Dockerfile` (linha 163)

```dockerfile
COPY --from=backend-builder /app/backend/templates ./templates
```

## 📊 Verificação da Solução

### Testes Locais

```bash
# Backend compila sem erros
cd digiurban/backend && npx tsc --noEmit
✅ Sem erros

# Frontend compila sem erros
cd digiurban/frontend && npx tsc --noEmit
✅ Sem erros

# Arquivo existe localmente
test -f digiurban/backend/src/services/atendimento/atestado.service.ts
✅ Existe
```

### Deploy na VPS

```bash
# Container rodando
docker ps | grep digiurban-vps
✅ Up (healthy)

# Arquivo compilado no container
docker exec digiurban-vps test -f /app/backend/dist/services/atendimento/atestado.service.js
✅ Existe

# 11 arquivos presentes (antes eram apenas 10)
docker exec digiurban-vps ls -la /app/backend/dist/services/atendimento/
total 152
-rw-r--r--  1 root root  9031 atendimento.service.js
-rw-r--r--  1 root root  6270 agendamento.service.js
-rw-r--r--  1 root root 20422 atendimento.service.js
-rw-r--r--  1 root root 12448 atestado.service.js  # ✅ PRESENTE!
-rw-r--r--  1 root root 12674 encaminhamento.service.js
# ... total 11 arquivos
```

### Logs do Backend

```
🏥 Carregando rotas dos Apps de Saúde...
   → APP-SAUDE-01: Sistema Integrado de Atendimento...
   ✅ APP-SAUDE-01 carregado (~52 endpoints)
   → APP-SAUDE-02: Farmácia Municipal...
   ✅ APP-SAUDE-02 carregado (~28 endpoints)
   → APP-SAUDE-03: TFD (Tratamento Fora do Domicílio)...
   ✅ APP-SAUDE-03 carregado (~52 endpoints)
✅ Apps de Saúde carregados com sucesso! Total: ~132 endpoints
```

### Health Check

```bash
curl http://digiurban.com.br:3060/health
{
  "status": "OK",
  "message": "DigiUrban Backend API is running",
  "timestamp": "2026-01-29T00:57:43.721Z"
}
✅ Aplicação funcionando
```

## 🎯 Arquivos Modificados

1. **`.dockerignore`** - Corrigido padrão de exclusão de testes
2. **`digiurban/backend/src/services/atendimento/index.ts`** - Adicionado .js nos imports
3. **`digiurban/backend/src/services/farmacia/index.ts`** - Adicionado .js nos imports
4. **`digiurban/backend/src/services/tfd/index.ts`** - Adicionado .js nos imports
5. **`Dockerfile`** - Debug commands já estavam presentes
6. **`Dockerfile`** - COPY templates já estava presente

## 🚀 Status Final

| Item | Status |
|------|--------|
| Build local | ✅ Sem erros |
| Deploy VPS | ✅ Sucesso |
| Backend rodando | ✅ Healthy |
| Apps de Saúde | ✅ 132 endpoints |
| Health check | ✅ OK |
| atestado.service.ts | ✅ Presente no container |

## 📝 Commits Relacionados

1. `c7ec97d` - feat: Implementar sistema completo de saúde com 3 apps integrados
2. `4833e9a` - fix: Adicionar comentário no atestado.service para forçar rebuild do Docker
3. `d6959da` - fix: Adicionar cópia de templates e debug para rastrear erro de build
4. `bc65e57` - fix: Mover debug após prisma generate para evitar cache do Docker
5. `3877b5b` - fix: Adicionar extensão .js nos imports dos services para resolver build no Docker
6. `2b5d65a` - fix: Corrigir padrão do .dockerignore que bloqueava atestado.service.ts ⭐ **SOLUÇÃO FINAL**

## ⚠️ Lições Aprendidas

1. **Padrões glob devem ser específicos**: Use `**/*.test.ts` ao invés de `**/*test*.ts`
2. **Testar padrões do .dockerignore**: Verificar se não bloqueiam arquivos legítimos
3. **Debug commands são essenciais**: Facilitam diagnóstico de problemas de build
4. **ES Modules requerem extensões**: Adicionar `.js` nos imports para compatibilidade

## 🔗 Links Úteis

- Aplicação: https://digiurban.com.br
- Health Check: http://72.60.10.108:3060/health
- Documentação .dockerignore: https://docs.docker.com/engine/reference/builder/#dockerignore-file
