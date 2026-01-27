# 🎯 Sistema de Categorização Dinâmica - Guia Rápido

## 🚀 Início Rápido

### 1. Executar Migration

```bash
cd digiurban/backend
npx prisma migrate deploy
```

### 2. (Opcional) Executar Seeds

```bash
# Seed de categorias expandidas (23 categorias pré-configuradas)
npx prisma db seed
```

### 3. Iniciar Backend

```bash
npm run dev
```

### 4. Iniciar Frontend

```bash
cd ../frontend
npm run dev
```

### 5. Acessar Sistema

1. Faça login: `http://localhost:3000/admin/login`
2. Navegue para: **Menu > Gestão > Sugestões de Categorização**
3. Crie um novo serviço e observe a mágica acontecer! ✨

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [IMPLEMENTACAO_COMPLETA_CATEGORIZACAO.md](IMPLEMENTACAO_COMPLETA_CATEGORIZACAO.md) | 📋 Resumo executivo completo |
| [SISTEMA_APROVACAO_SUGESTOES_CATEGORIZACAO.md](SISTEMA_APROVACAO_SUGESTOES_CATEGORIZACAO.md) | 📖 Guia detalhado de uso + SSE |
| [SISTEMA_CATEGORIZACAO_V2_COMPLETO.md](SISTEMA_CATEGORIZACAO_V2_COMPLETO.md) | 🔧 Documentação técnica completa |
| [INSTALACAO_SISTEMA_CATEGORIZACAO_V2.md](INSTALACAO_SISTEMA_CATEGORIZACAO_V2.md) | 🛠️ Guia de instalação passo a passo |

---

## 🎯 Principais Features

### ✅ O que funciona automaticamente:

1. **Análise Inteligente**: Serviço criado → Trigger SQL → Análise automática
2. **Auto-Assignment**: Confiança ≥85% → Categoria atribuída automaticamente
3. **Sugestões**: Confiança 60-84% → Aguarda aprovação manual
4. **Notificações SSE**: Eventos em tempo real → Toast no frontend
5. **Badge Dinâmico**: Contador atualiza automaticamente a cada 30s
6. **Status Visual**: Cada serviço mostra seu status de categorização

### 🎨 Interfaces Disponíveis:

- **Dashboard de Aprovações**: `/admin/categorias/sugestoes`
- **Listagem de Serviços**: `/admin/servicos` (com status visual)
- **Modal de Aprovação**: Aparece após criar serviço
- **Badge no Menu**: Menu > Gestão > Sugestões de Categorização

---

## 🧪 Teste Rápido

### Via Interface (Recomendado)

1. Login no admin
2. Abra console do navegador (F12)
3. Crie novo serviço:
   - Nome: "Cadastro de Produtor Rural"
   - Departamento: Agricultura
   - Tipo: `CADASTRO_PRODUTOR`
4. Observe:
   - ✅ Toast de notificação aparece
   - ✅ Badge atualiza no menu
   - ✅ Modal de sugestões abre (se houver)

### Via API

```bash
# 1. Ver sugestões pendentes
curl http://localhost:3001/api/category-suggestions/pending \
  -H "Cookie: admin_token=SEU_TOKEN"

# 2. Ver estatísticas
curl http://localhost:3001/api/category-suggestions/stats \
  -H "Cookie: admin_token=SEU_TOKEN"

# 3. Testar SSE
curl -N http://localhost:3001/api/notifications/stream \
  -H "Cookie: admin_token=SEU_TOKEN"
```

---

## 🔧 Troubleshooting

### Sugestões não aparecem?

**Verificar**:
```sql
-- 1. Trigger existe?
SELECT * FROM pg_trigger WHERE tgname = 'trigger_analyze_service';

-- 2. Jobs foram criados?
SELECT * FROM background_jobs
WHERE type = 'ANALYZE_SERVICE_CATEGORIES'
ORDER BY "createdAt" DESC LIMIT 5;

-- 3. Categorias tem matching habilitado?
SELECT code, "matchingEnabled" FROM citizen_categories;
```

### SSE não conecta?

**Console do navegador**:
```
[SSE] ✅ Conexão estabelecida  ← Deve aparecer
```

**Se não aparecer**:
1. Verificar se rota está registrada em `backend/src/index.ts`
2. Verificar CORS (allowedOrigins)
3. Testar manualmente: `curl -N http://localhost:3001/api/notifications/stream`

### Badge não atualiza?

**Verificar**:
1. Hook `useCategorySuggestions()` está sendo chamado no `AdminSidebar`
2. Rota `/api/category-suggestions/stats` está funcionando
3. Console do navegador para erros

---

## 📊 Consultas Úteis

```sql
-- Ver todas sugestões pendentes
SELECT
  s.name as service_name,
  c.name as category_name,
  sug.confidence,
  sug."matchType",
  sug."createdAt"
FROM citizen_category_match_suggestions sug
JOIN services_simplified s ON s.id = sug."serviceId"
JOIN citizen_categories c ON c.id = sug."categoryId"
WHERE sug.status = 'PENDING'
ORDER BY sug."createdAt" DESC;

-- Ver auto-assignments
SELECT
  s.name as service_name,
  c.name as category_name,
  a.confidence,
  a."assignmentType",
  a."createdAt"
FROM service_category_assignments a
JOIN services_simplified s ON s.id = a."serviceId"
JOIN citizen_categories c ON c.id = a."categoryId"
WHERE a.active = true
AND a."assignmentType" = 'AUTO'
ORDER BY a."createdAt" DESC;

-- Estatísticas gerais
SELECT
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
  COUNT(*) FILTER (WHERE status = 'AUTO_ASSIGNED') as auto_assigned,
  AVG(confidence) as avg_confidence
FROM citizen_category_match_suggestions;
```

---

## 🎓 Recursos Adicionais

### Exemplos de Código

**Hook de Sugestões**:
```tsx
const { suggestions, approveSuggestion } = useCategorySuggestions();
```

**Hook de Notificações**:
```tsx
const { connected, stats } = useNotifications();
```

**Emitir Notificação (Backend)**:
```typescript
import { notifyNewCategorySuggestion } from './routes/notifications.routes';

notifyNewCategorySuggestion({
  serviceId: 'uuid',
  serviceName: 'Meu Serviço',
  categoryName: 'Categoria X',
  confidence: 85
});
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. ✅ Verificar documentação completa (links acima)
2. ✅ Consultar seção de Troubleshooting
3. ✅ Verificar logs do servidor e console do navegador
4. ✅ Testar endpoints manualmente com curl

---

**🎉 Tudo pronto! Divirta-se com a categorização inteligente!**
