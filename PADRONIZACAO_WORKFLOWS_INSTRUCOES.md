# Instruções - Padronização de Workflows

## Como Aplicar as Mudanças no Banco de Dados

### Passo 1: Fazer Backup do Banco (IMPORTANTE!)

Antes de executar o seed, faça um backup do banco de dados:

```bash
# PostgreSQL
pg_dump -U postgres -d digiurban > backup_antes_padronizacao_$(date +%Y%m%d_%H%M%S).sql

# Ou se estiver usando Docker
docker exec -t postgres_container pg_dump -U postgres digiurban > backup_antes_padronizacao_$(date +%Y%m%d_%H%M%S).sql
```

### Passo 2: Executar o Seed

```bash
cd c:\Projetos Cursor\Digiurbanlite\digiurban\backend

# Instalar dependências se necessário
npm install

# Executar seed dos workflows
npm run seed
# ou
npx prisma db seed
```

### Passo 3: Verificar no Banco

```sql
-- Verificar se os workflows foram atualizados
SELECT
  w.name,
  w.module_type,
  jsonb_array_length(w.stages) as total_stages,
  (w.stages->0->>'name') as primeira_stage,
  (w.stages->0->>'order') as primeira_stage_order
FROM workflows w
WHERE w.module_type IS NOT NULL
ORDER BY w.module_type;

-- Deve retornar "Recepção" ou "Recebimento" para a primeira_stage
```

### Passo 4: Testar na Aplicação

1. Acesse o sistema
2. Vá para qualquer serviço (ex: Saúde > Encaminhamentos TFD)
3. Crie um novo protocolo
4. Verifique se a primeira stage é "Recepção"
5. Teste aprovar a stage de Recepção
6. Verifique se avança para "Análise Documental"

---

## Como Reverter (Se Necessário)

### Opção 1: Restaurar do Backup

```bash
# PostgreSQL
psql -U postgres -d digiurban < backup_antes_padronizacao_YYYYMMDD_HHMMSS.sql

# Ou com Docker
docker exec -i postgres_container psql -U postgres digiurban < backup_antes_padronizacao_YYYYMMDD_HHMMSS.sql
```

### Opção 2: Usar Git

Se as mudanças ainda não foram commitadas:

```bash
# Restaurar arquivo original
git checkout HEAD -- digiurban/backend/prisma/seeds/service-workflows.seed.ts

# Executar seed novamente com versão original
cd digiurban/backend
npm run seed
```

Se já foi commitado:

```bash
# Ver commits recentes
git log --oneline -10

# Reverter commit específico
git revert <commit-hash>

# Executar seed com versão revertida
cd digiurban/backend
npm run seed
```

---

## Verificações de Segurança

### Antes de Aplicar

- [ ] Backup do banco de dados criado
- [ ] Arquivo original salvo (Git ou cópia manual)
- [ ] Ambiente de teste disponível
- [ ] Equipe avisada sobre a manutenção

### Após Aplicar

- [ ] Seed executado sem erros
- [ ] Workflows verificados no banco de dados
- [ ] Primeira stage é "Recepção" nos workflows modificados
- [ ] Protocolos de teste criados com sucesso
- [ ] Interface exibindo stages corretamente
- [ ] Transição entre stages funcionando

### Checklist de Validação

```bash
# 1. Verificar total de workflows
SELECT COUNT(*) FROM workflows WHERE module_type IS NOT NULL;
# Esperado: 81 workflows

# 2. Verificar workflows com Recepção
SELECT COUNT(*)
FROM workflows
WHERE module_type IS NOT NULL
  AND (stages->0->>'name' LIKE '%Recepção%'
       OR stages->0->>'name' LIKE '%Recebimento%');
# Esperado: 81 workflows (todos)

# 3. Verificar ordem da primeira stage
SELECT COUNT(*)
FROM workflows
WHERE module_type IS NOT NULL
  AND (stages->0->>'order')::int = 1;
# Esperado: 81 workflows (todos)

# 4. Listar workflows que NÃO têm Recepção/Recebimento
SELECT
  w.module_type,
  w.name,
  (w.stages->0->>'name') as primeira_stage
FROM workflows w
WHERE w.module_type IS NOT NULL
  AND (w.stages->0->>'name' NOT LIKE '%Recepção%'
       AND w.stages->0->>'name' NOT LIKE '%Recebimento%');
# Esperado: 0 resultados
```

---

## Resolução de Problemas

### Problema: Seed falha com erro de sintaxe

**Solução**:
```bash
# Verificar sintaxe do TypeScript
cd digiurban/backend
npx tsc --noEmit prisma/seeds/service-workflows.seed.ts

# Se houver erros, revisar o arquivo
```

### Problema: Workflows duplicados no banco

**Solução**:
```bash
# Limpar workflows específicos
cd digiurban/backend
npx prisma studio

# Ou via SQL
DELETE FROM workflows WHERE module_type IS NOT NULL;

# Executar seed novamente
npm run seed
```

### Problema: Stage de Recepção não aparece na UI

**Possíveis causas**:
1. Cache do browser - Limpar cache (Ctrl + Shift + R)
2. Cache do servidor - Reiniciar servidor backend
3. Dados não sincronizados - Verificar se seed foi executado

**Solução**:
```bash
# 1. Reiniciar backend
cd digiurban/backend
npm run dev

# 2. Limpar cache do frontend
cd digiurban/frontend
npm run dev

# 3. Verificar no banco se workflow está atualizado
psql -U postgres -d digiurban
SELECT stages FROM workflows WHERE module_type = 'ENCAMINHAMENTOS_TFD';
```

### Problema: Ordem das stages não está correta

**Verificação**:
```sql
-- Ver todas as stages e suas ordens
SELECT
  w.module_type,
  jsonb_array_elements(w.stages)->>'name' as stage_name,
  jsonb_array_elements(w.stages)->>'order' as stage_order
FROM workflows w
WHERE w.module_type = 'ENCAMINHAMENTOS_TFD'
ORDER BY stage_order;
```

---

## Monitoramento Pós-Implantação

### Métricas para Acompanhar

1. **Performance do Sistema**
   - Tempo de resposta ao criar protocolos
   - Tempo de carregamento das stages

2. **Uso das Stages**
   - Quantos protocolos passam pela Recepção
   - Tempo médio na stage de Recepção
   - Taxa de aprovação/rejeição na Recepção

3. **Erros e Exceções**
   - Logs de erro relacionados a workflows
   - Problemas reportados pelos usuários

### Queries de Monitoramento

```sql
-- 1. Protocolos criados nas últimas 24h
SELECT COUNT(*)
FROM protocols
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 2. Protocolos na stage de Recepção
SELECT
  p.protocol_number,
  p.current_stage_order,
  p.service_name,
  p.created_at
FROM protocols p
WHERE p.current_stage_order = 1
  AND p.status = 'IN_PROGRESS'
ORDER BY p.created_at DESC;

-- 3. Tempo médio na stage de Recepção
SELECT
  AVG(EXTRACT(EPOCH FROM (sh.created_at - p.created_at))/3600) as horas_media
FROM protocols p
JOIN stage_history sh ON sh.protocol_id = p.id
WHERE p.current_stage_order = 2  -- Já passou da Recepção
  AND sh.stage_order = 2;  -- Primeira transição

-- 4. Taxa de aprovação na Recepção
SELECT
  COUNT(*) FILTER (WHERE action = 'APPROVE') as aprovados,
  COUNT(*) FILTER (WHERE action = 'REJECT') as rejeitados,
  COUNT(*) FILTER (WHERE action = 'REQUEST_INFO') as pendencias,
  COUNT(*) as total
FROM stage_history
WHERE stage_order = 1
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Contatos e Suporte

### Em caso de problemas:

1. **Verificar documentação**:
   - `PADRONIZACAO_WORKFLOWS_RESUMO.md`
   - `PADRONIZACAO_WORKFLOWS_EXEMPLOS.md`
   - Este arquivo

2. **Verificar logs**:
   ```bash
   # Backend logs
   cd digiurban/backend
   npm run dev
   # Ver console para erros

   # Database logs
   tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Restaurar backup** se necessário

4. **Documentar o problema** para análise posterior

---

## Checklist Final

Antes de considerar a padronização completa:

- [ ] Backup do banco de dados criado
- [ ] Arquivo `service-workflows.seed.ts` modificado
- [ ] Seed executado sem erros
- [ ] Verificações SQL passaram
- [ ] Testes manuais na UI realizados
- [ ] Protocolos de teste criados em 5+ serviços diferentes
- [ ] Equipe treinada sobre nova estrutura
- [ ] Documentação atualizada
- [ ] Monitoramento configurado
- [ ] Plano de rollback testado

---

## Próximas Melhorias (Futuro)

1. **Automação da Recepção**
   - Aprovar automaticamente se documentos completos
   - Enviar para análise manual se incompletos

2. **Notificações**
   - Alertar usuário quando protocolo é recebido
   - Email de confirmação de recepção

3. **Métricas**
   - Dashboard de tempo de recepção
   - Relatório de gargalos na recepção

4. **Integrações**
   - Webhook ao receber protocolo
   - API para sistemas externos consultarem recepção
