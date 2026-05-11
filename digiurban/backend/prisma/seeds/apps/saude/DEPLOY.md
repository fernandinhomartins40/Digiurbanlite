# Guia de Deploy - Seeds dos Apps de Saúde

Este documento garante que os seeds dos Apps de Saúde sejam executados corretamente durante o deploy.

---

## ✅ Integração Completa

Os seeds de saúde estão **100% integrados** ao sistema de deploy do DigiUrban:

### 1. **Package.json** ✅

Novos scripts adicionados em `digiurban/backend/package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed-consolidated.ts && tsx scripts/create-super-admin.ts",
    "db:seed:saude": "tsx prisma/seeds/apps/saude/master-seed-saude.ts",
    "db:seed:full": "npm run db:seed && npm run db:seed:saude"
  }
}
```

### 2. **Seed Consolidado** ✅

O arquivo `prisma/seed-consolidated.ts` foi atualizado para incluir:

```typescript
// ========================================================================
// 9. SISTEMA UNIFICADO DE VINCULAÇÕES V2.0
// ========================================================================
try {
  const { default: seedUnifiedSystem } = await import('./seeds/unified-system.seed');
  await seedUnifiedSystem();
  console.log('   ✅ Sistema Unificado criado com sucesso\n');
} catch (error) { ... }

// ========================================================================
// 10. SEEDS DOS APPS DE SAÚDE (INTEGRADO AO SISTEMA UNIFICADO)
// ========================================================================
try {
  const { default: masterSeedSaude } = await import('./seeds/apps/saude/master-seed-saude');
  await masterSeedSaude();
  console.log('   ✅ Seeds de Saúde criados com sucesso\n');
} catch (error) { ... }
```

### 3. **Script de Deploy VPS** ✅

O arquivo `deploy-vps.sh` já executa os seeds automaticamente:

```bash
# Linha 45 do deploy-vps.sh
docker exec digiurban-vps sh -c "cd /app/backend && npm run db:seed"
```

Este comando executa:
1. `seed-consolidated.ts` (usuários, departamentos, serviços, etc)
2. `unified-system.seed.ts` (Sistema Unificado V2.0)
3. `master-seed-saude.ts` (Seeds de Saúde) ← **INCLUÍDO AUTOMATICAMENTE**

---

## 🚀 Como Executar os Seeds

### **Opção 1: Deploy Completo (VPS)**

Execute o script de deploy que fará tudo automaticamente:

```bash
cd /root/digiurban
./deploy-vps.sh
```

Isso irá:
- ✅ Atualizar código (`git pull`)
- ✅ Reconstruir containers
- ✅ Executar seeds consolidados (incluindo Saúde)
- ✅ Validar llama.cpp
- ✅ Verificar status

### **Opção 2: Seeds Completos Localmente**

Para desenvolvimento local:

```bash
cd digiurban/backend

# Executar todos os seeds (incluindo Saúde)
npm run db:seed

# OU executar explicitamente com separação
npm run db:seed:full
```

### **Opção 3: Apenas Seeds de Saúde**

Se você só precisa executar os seeds de saúde:

```bash
cd digiurban/backend
npm run db:seed:saude
```

### **Opção 4: Seeds Individuais**

Executar seeds específicos na ordem:

```bash
cd digiurban/backend

# 1. Sistema Unificado (obrigatório primeiro)
npx tsx prisma/seeds/unified-system.seed.ts

# 2. Seeds de Saúde individuais
npx tsx prisma/seeds/apps/saude/01-unidades-saude-completas.seed.ts
npx tsx prisma/seeds/apps/saude/02-servidores-saude.seed.ts
npx tsx prisma/seeds/apps/saude/03-vinculos-profissionais.seed.ts
npx tsx prisma/seeds/apps/saude/04-equipes-saude.seed.ts
npx tsx prisma/seeds/apps/saude/05-especialidades-cbo.seed.ts
npx tsx prisma/seeds/apps/saude/06-agendas-turnos.seed.ts

# OU executar o master seed
npx tsx prisma/seeds/apps/saude/master-seed-saude.ts
```

---

## 📋 Ordem de Execução (Garantida)

O sistema garante a seguinte ordem de execução:

```
1. Configuração do Município
2. Usuários do Sistema (Admin, etc)
3. Departamentos (21 Secretarias)
4. Cidadão de Teste
5. Serviços Simplificados (~400 serviços)
6. Estabelecimentos (Unidades, CRAS, Espaços)
7. Dados Auxiliares (25 tabelas)
8. Service Workflows
9. Sistema Unificado V2.0 ← NOVO
   ├─ OrganizationalUnit
   ├─ Position
   ├─ Function
   ├─ EmployeeAssignment
   ├─ EmployeeHierarchy
   └─ Team / TeamMember
10. Seeds dos Apps de Saúde ← NOVO
    ├─ 01. Unidades de Saúde Completas
    ├─ 02. Servidores de Saúde
    ├─ 03. Vínculos Profissionais
    ├─ 04. Equipes de Saúde
    ├─ 05. Especialidades e CBOs
    └─ 06. Agendas e Turnos
```

---

## ⚠️ Dependências Críticas

**IMPORTANTE:** Os seeds de saúde dependem do Sistema Unificado:

### Pré-requisitos:
1. ✅ **Prisma Generate** executado
2. ✅ **Migrations** aplicadas (`npm run db:migrate`)
3. ✅ **Sistema Unificado** criado primeiro
4. ✅ **Departamento de Saúde** existente

### Verificação Automática:

Os seeds verificam automaticamente se as dependências existem:

```typescript
// Exemplo: seed 03-vinculos-profissionais.seed.ts
const departamentoSaude = await prisma.department.findFirst({
  where: { code: 'SAUDE' }
});

if (!departamentoSaude) {
  throw new Error('❌ Departamento de Saúde não encontrado. Execute o seed 01 primeiro.');
}
```

Se faltar alguma dependência, o seed **para com erro claro** indicando o que falta.

---

## 🐛 Troubleshooting

### Erro: "Departamento de Saúde não encontrado"

**Causa:** Seeds básicos não foram executados.

**Solução:**
```bash
# Execute o seed consolidado completo
npm run db:seed
```

### Erro: "OrganizationalUnit not found"

**Causa:** Sistema Unificado não foi executado.

**Solução:**
```bash
# Execute o Sistema Unificado primeiro
npx tsx prisma/seeds/unified-system.seed.ts

# Depois execute os seeds de saúde
npm run db:seed:saude
```

### Erro: "User not found"

**Causa:** Seeds executados fora de ordem.

**Solução:**
```bash
# Execute na ordem correta
npm run db:seed:full
```

### Erro: "Duplicate key violation"

**Causa:** Seeds foram executados múltiplas vezes (normal, seeds são idempotentes).

**Solução:** Não é um erro real, os seeds usam `upsert` e pulam duplicatas.

### Seeds não estão sendo executados no deploy

**Verificação:**

```bash
# No VPS, verifique os logs do container
docker logs digiurban-vps | grep -A 20 "SEED"

# Ou execute manualmente dentro do container
docker exec -it digiurban-vps sh
cd /app/backend
npm run db:seed
```

---

## 🔍 Verificação Pós-Deploy

Após o deploy, verifique se os seeds foram executados corretamente:

### 1. Verificar Unidades de Saúde:

```bash
docker exec -it digiurban-vps sh
cd /app/backend
npx prisma studio
```

No Prisma Studio:
- ✅ **OrganizationalUnit:** Deve ter ~16 registros (secretaria + diretorias + unidades)
- ✅ **UnidadeSaude:** Deve ter 12 unidades
- ✅ **User:** Deve ter 25+ servidores de saúde (email termina com @saude.sp.gov.br)
- ✅ **HealthProfessionalData:** Deve ter 25 registros
- ✅ **EmployeeAssignment:** Deve ter 35+ vínculos
- ✅ **Team:** Deve ter 8+ equipes
- ✅ **SalaConsultorio:** Deve ter 40+ salas

### 2. Verificar no Terminal:

```bash
# Contar registros
docker exec digiurban-vps node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const unidades = await prisma.unidadeSaude.count();
  const servidores = await prisma.user.count({ where: { email: { endsWith: '@saude.sp.gov.br' } } });
  const vinculos = await prisma.employeeAssignment.count();
  const equipes = await prisma.equipeSaude.count();

  console.log('✅ Unidades de Saúde:', unidades);
  console.log('✅ Servidores de Saúde:', servidores);
  console.log('✅ Vínculos:', vinculos);
  console.log('✅ Equipes:', equipes);

  await prisma.\$disconnect();
})();
"
```

**Resultado esperado:**
```
✅ Unidades de Saúde: 12
✅ Servidores de Saúde: 25
✅ Vínculos: 35+
✅ Equipes: 8
```

### 3. Testar Login de Servidor:

Tente fazer login com um dos servidores:

```
Email: joao.silva@saude.sp.gov.br
Senha: senha123
```

Se o login funcionar e mostrar dados do profissional, os seeds foram executados com sucesso!

---

## 📊 Estatísticas Esperadas

Após a execução completa dos seeds, você deve ter:

### Estrutura Organizacional:
- 1 Secretaria de Saúde
- 3 Diretorias (Atenção Básica, Urgência/Emergência, Saúde Mental)
- 12 Unidades de Saúde (UBS, ESF, UPA, Hospital, CAPS, Policlínica, CER)

### Recursos Humanos:
- 25 Servidores de Saúde
  - 8 Médicos
  - 6 Enfermeiros
  - 4 Técnicos de Enfermagem
  - 3 Dentistas
  - 2 Psicólogos
  - 2 ACS

### Vínculos:
- 35+ Vínculos Funcionais
- 13 Cargos (Positions)
- 35+ Registros de Auditoria

### Equipes:
- 4 Equipes ESF
- 2 Equipes NASF
- 1 Equipe CAPS
- 1 Equipe UPA
- 30+ Membros de Equipes

### Infraestrutura:
- 40+ Salas de Consultório
- 5 Turnos de Trabalho
- 5 Configurações de Atendimento
- 25+ Configurações de Agenda

### Referências:
- 30 Especialidades Médicas
- 90+ Códigos CBO

**Total: ~280+ registros criados**

---

## 🎯 Validação Rápida

Execute este comando para validação rápida:

```bash
cd digiurban/backend
npm run db:seed:full && echo "✅ SEEDS EXECUTADOS COM SUCESSO!" || echo "❌ ERRO NOS SEEDS"
```

Se retornar "✅ SEEDS EXECUTADOS COM SUCESSO!", tudo está funcionando!

---

## 📞 Suporte

Em caso de problemas:

1. **Verifique os logs:** `docker logs digiurban-vps`
2. **Verifique as dependências:** Prisma, TypeScript, tsx
3. **Execute manualmente:** Entre no container e rode os seeds step-by-step
4. **Consulte o README.md:** `prisma/seeds/apps/saude/README.md`

---

## ✅ Checklist de Deploy

Use este checklist para garantir que tudo está correto:

- [ ] Prisma generate executado
- [ ] Migrations aplicadas
- [ ] Package.json com scripts atualizados
- [ ] seed-consolidated.ts inclui seeds de saúde
- [ ] Sistema Unificado será executado antes dos seeds de saúde
- [ ] deploy-vps.sh chama `npm run db:seed`
- [ ] Verificação pós-deploy realizada
- [ ] Login de teste com servidor funciona
- [ ] Dados aparecem no Prisma Studio

---

**✅ PRONTO PARA DEPLOY!**

Os seeds dos Apps de Saúde estão **totalmente integrados** e serão executados automaticamente durante o deploy via `npm run db:seed`.

**Data:** Fevereiro/2026
**Versão:** 1.0.0
**Status:** ✅ 100% Integrado
