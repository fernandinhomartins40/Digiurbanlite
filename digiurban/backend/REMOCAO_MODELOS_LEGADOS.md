# Remoção de Modelos Legados - Saúde

## Data: 2026-02-04
## Responsável: Claude Code (Automação)

## Objetivo
Remover modelos duplicados e legados que conflitam com o Sistema Unificado de Vinculação V2.0

---

## Modelos Removidos

### 1. DadosSaude (Linha 177-222)
**Motivo:** Duplicado 100% em HealthProfessionalData
**Tabela:** `dados_saude`
**Dados no banco:** 0 registros
**Substituído por:** `HealthProfessionalData` (Sistema Unificado V2.0)

### 2. ProfissionalUnidade (Linha 2983-3008)
**Motivo:** Conflita com EmployeeAssignment do Sistema Unificado V2.0
**Tabela:** `profissional_unidade`
**Dados no banco:** 0 registros
**Substituído por:** `EmployeeAssignment` (Sistema Unificado V2.0)

### 3. AuditoriaVinculo (Linha 3011-3036)
**Motivo:** Duplica conceito de AssignmentAudit
**Tabela:** `auditoria_vinculo`
**Dados no banco:** 1 registro de teste
**Substituído por:** `AssignmentAudit` (Sistema Unificado V2.0)

### 4. TipoAuditoriaVinculo (Enum - Linha 3038-3046)
**Motivo:** Enum usado apenas por AuditoriaVinculo
**Substituído por:** Tipos do AssignmentAudit

---

## Relacionamentos Afetados no Model User

### Removidos:
- `dadosSaude DadosSaude?` (relação "UserDadosSaude")
- `profissionalUnidades ProfissionalUnidade[]` (relação "UserProfissionalUnidades")

### Mantidos (Sistema Unificado):
- `healthData HealthProfessionalData?` (relação "UserHealthData")
- `assignments EmployeeAssignment[]` (Sistema Unificado)

---

## Relacionamentos Afetados no Model UnidadeSaude

### Removidos:
- `profissionais ProfissionalUnidade[]`

### Mantidos:
- `organizationalUnit OrganizationalUnit?` (Integração com Sistema Unificado)
- Todos os relacionamentos específicos de saúde (equipes, agendas, salas, etc)

---

## Impacto

### Backend
- ✅ Rotas afetadas: `routes/saude-cadastros.routes.ts` (seções legadas comentadas)
- ✅ Seeds: Já usam HealthProfessionalData (nenhuma mudança necessária)

### Banco de Dados
- ✅ Tabelas removidas: `dados_saude`, `profissional_unidade`, `auditoria_vinculo`
- ✅ Dados perdidos: NENHUM (tabelas vazias ou com dados de teste)

### Frontend
- ⚠️ Verificar se há páginas usando rotas de DadosSaude
- ⚠️ Atualizar para usar `/api/professional-data/health`

---

## Migration Criada

```prisma
-- DropForeignKey
ALTER TABLE "auditoria_vinculo" DROP CONSTRAINT "auditoria_vinculo_vinculoId_fkey";
ALTER TABLE "profissional_unidade" DROP CONSTRAINT "profissional_unidade_profissionalId_fkey";
ALTER TABLE "profissional_unidade" DROP CONSTRAINT "profissional_unidade_unidadeId_fkey";

-- DropTable
DROP TABLE "dados_saude";
DROP TABLE "profissional_unidade";
DROP TABLE "auditoria_vinculo";

-- DropEnum
DROP TYPE "TipoAuditoriaVinculo";
```

---

## Resultado Esperado

### Antes:
- 3 modelos legados duplicados
- Confusão entre sistema legado e unificado
- Dados em tabelas diferentes (health_professional_data vs dados_saude)

### Depois:
- ✅ Sistema Unificado V2.0 como padrão único
- ✅ HealthProfessionalData como fonte única de dados de saúde
- ✅ EmployeeAssignment como sistema único de vínculos
- ✅ AssignmentAudit como auditoria única
- ✅ Schema limpo e sem duplicação

---

## Referências

- Documentação: `PROPOSTA_ADAPTACAO_SAUDE_AO_SISTEMA_UNIFICADO.md`
- Sistema Unificado: `SISTEMA_UNIFICADO_VINCULACAO.md`
- Schema: `backend/prisma/schema.prisma`
