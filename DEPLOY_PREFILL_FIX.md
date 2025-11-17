# 🔧 Fix: Pré-preenchimento de Formulários na VPS

## 📋 Problema Identificado

O pré-preenchimento de formulários funcionava **localmente** mas **não funcionava na VPS** após deploy.

## 🔍 Análise da Causa Raiz

### Ambiente Local (Funcionava)
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- O frontend fazia requisições HTTP completas para o backend
- Dados do cidadão eram carregados corretamente via `CitizenAuthContext`
- O hook `useFormPrefill` recebia os dados e pré-preenchia os formulários

### Ambiente VPS (Não Funcionava)
- `.env.production`: `NEXT_PUBLIC_API_URL=/api`
- Durante o **build** do Next.js, as variáveis são compiladas no código
- O caminho relativo `/api` não existe durante o build
- Possíveis problemas:
  1. Variável de ambiente não estava sendo passada corretamente durante o build
  2. Logs de debug ausentes dificultavam diagnóstico
  3. Código não tinha validação robusta para quando dados do cidadão ainda estão carregando

## ✅ Correções Implementadas

### 1. Dockerfile - Build do Frontend

**Arquivo:** `Dockerfile` (linhas 44-63)

**Mudanças:**
```dockerfile
# ✅ CRÍTICO: API URL para produção (caminho relativo /api será roteado pelo Nginx)
# Next.js compila isso no código durante o build
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copiar código do frontend INCLUINDO arquivo .env.production
COPY digiurban/frontend ./

# ✅ GARANTIR que .env.production existe e tem NEXT_PUBLIC_API_URL correto
RUN echo "NEXT_PUBLIC_API_URL=/api" > .env.production && \
    echo "NODE_ENV=production" >> .env.production

# Build Next.js com variáveis corretas
RUN npm run build
```

**Por quê:**
- Garante que a variável `NEXT_PUBLIC_API_URL=/api` está disponível durante o build
- Recria o `.env.production` para evitar problemas de cópia de arquivos
- Next.js standalone mode precisa dessas variáveis em build time

### 2. Hook useFormPrefill - Logs de Debug

**Arquivo:** `digiurban/frontend/hooks/useFormPrefill.ts`

**Mudanças:**
```typescript
useEffect(() => {
  if (!fields || fields.length === 0) {
    console.log('⚠️ [HOOK] Sem campos para preencher');
    return;
  }

  console.log('🔍 [HOOK] Inicializando formulário...', {
    fieldsCount: fields.length,
    hasCitizen: !!citizen,
    citizenId: citizen?.id
  });

  // Aguardar cidadão estar carregado antes de pré-preencher
  if (!citizen || !citizen.id) {
    console.log('⏳ [HOOK] Aguardando dados do cidadão...');
    // Inicializar vazio enquanto aguarda
    const emptyData: Record<string, any> = {};
    fields.forEach(field => {
      emptyData[field.id] = field.type === 'select' ? '' : (field.type === 'number' ? 0 : '');
    });
    setFormData(emptyData);
    return;
  }

  console.log('✅ [HOOK] Cidadão carregado, aplicando pré-preenchimento...', {
    name: citizen.name,
    email: citizen.email,
    hasAddress: !!citizen.address,
    hasPhone: !!citizen.phone
  });

  const initialData = prefillFormData(fields, citizen);

  console.log('📝 [HOOK] Dados pré-preenchidos:', initialData);

  setFormData(initialData);
  setIsInitialized(true);

  if (onPrefillComplete) {
    const prefilled = getPrefilledFields(fields, initialData);
    console.log(`✅ [HOOK] ${prefilled.length} campos pré-preenchidos com sucesso`);
    onPrefillComplete(prefilled.length);
  }
}, [fields, citizen?.id]);
```

**Por quê:**
- Permite diagnosticar problemas no console do browser em produção
- Mostra claramente quando o cidadão ainda não foi carregado
- Facilita identificar se o problema está no fetch de dados ou no mapeamento

### 3. CitizenAuthContext - Logs de Debug

**Arquivo:** `digiurban/frontend/contexts/CitizenAuthContext.tsx`

**Mudanças:**
```typescript
const fetchCitizenData = async () => {
  try {
    console.log('🔍 [CitizenAuth] Buscando dados do cidadão...');
    const data = await apiRequest('/auth/citizen/me');

    console.log('✅ [CitizenAuth] Dados do cidadão recebidos:', {
      name: data.citizen?.name,
      email: data.citizen?.email,
      hasAddress: !!data.citizen?.address,
      hasPhone: !!data.citizen?.phone,
      tenantId: data.tenantId
    });

    setCitizen(data.citizen);
    // ... resto do código
  } catch (error) {
    console.error('❌ [CitizenAuth] Erro ao buscar dados do cidadão:', error);
    // ...
  }
};
```

**Por quê:**
- Mostra se a requisição à API está funcionando
- Exibe quais dados foram recebidos do backend
- Ajuda a identificar problemas de autenticação ou rede

### 4. Arquivo .env.production - Documentação

**Arquivo:** `digiurban/frontend/.env.production`

**Mudanças:**
```env
# Production Environment Variables
# ✅ CRÍTICO: Em produção, a API é acessada via proxy reverso do Nginx
# O Nginx roteia /api para o backend interno (porta 3001)

# ✅ Usar caminho relativo para produção (Nginx faz o proxy)
# Durante o build, Next.js compila essa variável no código
# Em runtime no browser, as requisições vão para /api que o Nginx roteia para backend:3001
NEXT_PUBLIC_API_URL=/api

NODE_ENV=production
```

**Por quê:**
- Documentação clara do fluxo de requisições
- Explica por que usar caminho relativo `/api`
- Facilita futuras manutenções

## 🚀 Como Fazer Deploy com as Correções

### 1. Rebuild da Imagem Docker

```bash
cd /path/to/digiurban

# Criar nova build com timestamp para invalidar cache
export BUILD_TIMESTAMP=$(date +%s)

docker-compose -f docker-compose.vps.yml build --no-cache --build-arg BUILD_TIMESTAMP=$BUILD_TIMESTAMP
```

### 2. Reiniciar Containers

```bash
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d
```

### 3. Verificar Logs

```bash
# Ver logs do container
docker-compose -f docker-compose.vps.yml logs -f digiurban

# Verificar se frontend iniciou corretamente
docker exec -it digiurban-vps ps aux | grep node

# Verificar se Nginx está roteando /api
curl http://localhost:3060/api/health
```

### 4. Testar no Browser

1. Acesse a aplicação: `http://SEU_IP:3060`
2. Faça login como cidadão
3. Acesse um serviço e clique em "Solicitar"
4. **Abra o Console do Browser (F12)**
5. Procure pelos logs:
   - `🔍 [CitizenAuth] Buscando dados do cidadão...`
   - `✅ [CitizenAuth] Dados do cidadão recebidos:`
   - `🔍 [HOOK] Inicializando formulário...`
   - `✅ [HOOK] Cidadão carregado, aplicando pré-preenchimento...`
   - `✅ [HOOK] X campos pré-preenchidos com sucesso`

6. Verifique se os campos com prefixo `citizen_*` foram pré-preenchidos

## 🔍 Diagnóstico de Problemas

### Se o pré-preenchimento ainda não funcionar:

#### 1. Verificar se NEXT_PUBLIC_API_URL está correto

No console do browser:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

**Esperado:** `/api`

#### 2. Verificar se o backend está acessível

No console do browser:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Esperado:** `{ status: "ok" }`

#### 3. Verificar se o cidadão está autenticado

No console do browser:
```javascript
fetch('/api/auth/citizen/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Esperado:** Dados do cidadão com `name`, `email`, `address`, etc.

#### 4. Verificar logs do backend

```bash
docker-compose -f docker-compose.vps.yml logs backend | grep "GET /api/auth/citizen/me"
```

**Esperado:** Status 200

#### 5. Verificar se os campos têm prefixo citizen_*

No console do browser, na página de solicitação de serviço:
```javascript
// Verificar schema do formulário
console.log(service.formSchema.fields)
```

**Esperado:** Campos com IDs como `citizen_name`, `citizen_cpf`, `citizen_phone`, etc.

**Se não tiver o prefixo:**
- Os campos não serão pré-preenchidos (comportamento esperado)
- Apenas campos `citizen_*` são pré-preenchidos automaticamente
- Campos customizados do serviço devem ser preenchidos manualmente

## 📝 Resumo das Alterações

| Arquivo | O que foi mudado | Por quê |
|---------|------------------|---------|
| `Dockerfile` | Garantir `NEXT_PUBLIC_API_URL=/api` durante build | Next.js compila variáveis em build time |
| `useFormPrefill.ts` | Adicionar logs de debug detalhados | Facilitar diagnóstico em produção |
| `CitizenAuthContext.tsx` | Adicionar logs de debug detalhados | Mostrar se dados do cidadão foram carregados |
| `.env.production` | Adicionar documentação inline | Explicar fluxo de requisições |

## ✅ Resultado Esperado

Após o deploy com essas correções:

1. ✅ Frontend compila com `NEXT_PUBLIC_API_URL=/api`
2. ✅ Browser faz requisições para `/api/*` (roteadas pelo Nginx)
3. ✅ Nginx roteia para `http://localhost:3001/api/*` (backend)
4. ✅ Backend retorna dados do cidadão autenticado
5. ✅ `CitizenAuthContext` carrega e armazena dados do cidadão
6. ✅ `useFormPrefill` recebe dados do cidadão
7. ✅ Hook `prefillFormData` mapeia dados para campos `citizen_*`
8. ✅ Formulário é pré-preenchido automaticamente
9. ✅ Usuário vê campos já preenchidos com seus dados

## 🎯 Como Verificar que Funcionou

**Indicadores de Sucesso:**

1. **Console do Browser:** Logs `✅ [HOOK] X campos pré-preenchidos com sucesso`
2. **Formulário:** Campos `citizen_name`, `citizen_cpf`, `citizen_phone`, etc. já preenchidos
3. **Mensagem UI:** "✓ X de Y campos foram pré-preenchidos. Complete os campos restantes."
4. **Visual:** Campos pré-preenchidos podem ter ícone ou estilo diferente (se implementado)

**Exemplo de Console Esperado:**
```
🔍 [CitizenAuth] Buscando dados do cidadão...
✅ [CitizenAuth] Dados do cidadão recebidos: {
  name: "João Silva",
  email: "joao@email.com",
  hasAddress: true,
  hasPhone: true,
  tenantId: "..."
}
🔍 [HOOK] Inicializando formulário... {
  fieldsCount: 15,
  hasCitizen: true,
  citizenId: "..."
}
✅ [HOOK] Cidadão carregado, aplicando pré-preenchimento... {
  name: "João Silva",
  email: "joao@email.com",
  hasAddress: true,
  hasPhone: true
}
📝 [HOOK] Dados pré-preenchidos: {
  citizen_name: "João Silva",
  citizen_cpf: "123.456.789-00",
  citizen_email: "joao@email.com",
  citizen_phone: "(11) 98765-4321",
  ...
}
✅ [HOOK] 8 campos pré-preenchidos com sucesso
```

## 🔒 Considerações de Segurança

- ✅ Tokens JWT em cookies httpOnly (não acessíveis por JavaScript)
- ✅ Requisições com `credentials: 'include'` para enviar cookies
- ✅ Apenas campos `citizen_*` são pré-preenchidos (evita vazamento de dados)
- ✅ Dados do cidadão vêm do backend autenticado (não de localStorage)
- ✅ CORS configurado corretamente para aceitar cookies

## 📚 Referências

- **Documentação Next.js:** [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- **Documentação Next.js:** [Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- **Arquivo de Pré-preenchimento:** `digiurban/frontend/lib/form-prefill-mapper.ts`
- **Hook de Pré-preenchimento:** `digiurban/frontend/hooks/useFormPrefill.ts`
- **Contexto de Autenticação:** `digiurban/frontend/contexts/CitizenAuthContext.tsx`
