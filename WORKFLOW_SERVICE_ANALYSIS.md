# DigiUrban - Workflow ↔ Service Document Analysis

## Executive Summary

**Critical Issue Detected:** 85% of workflows have document mismatches with their corresponding service definitions.

- **Total Workflows:** 193
- **Workflows with Issues:** 165 (85%)
  - Missing service definition: 39 workflows
  - Document mismatches: 126 workflows

## Impact

Citizens opening protocols via workflows may be **blocked from uploading required documents** because those documents aren't defined in the service's `requiredDocuments` array. This creates a critical UX failure where:

1. Workflow requires document X in a stage
2. Citizen can't upload document X (not in service definition)
3. Protocol gets stuck in that stage forever

## Critical Issues

### 1. Workflows Without Service Definition (39)

These workflows have no matching service in the service seed files, meaning they can't be used at all:

| Module Type | Required Documents |
|-------------|-------------------|
| `ENCAMINHAMENTOS_TFD` | Atestado Médico, Exames, Guia de Encaminhamento |
| `INSCRICAO_PROGRAMA_RURAL` | CPF, Cadastro de Produtor, DAP |
| `SOLICITACAO_MAQUINAS` | CPF, Comprovante de Propriedade ou Posse |
| `CADASTRO_EVENTO_CULTURAL` | CPF/CNPJ Responsável, Projeto do Evento |
| `RESERVA_ESPACO_CULTURAL` | CPF/CNPJ, Projeto do Evento |
| `INSCRICAO_COMPETICAO` | Atestado Médico, Ficha de Inscrição |
| `PROGRAMA_AMBIENTAL` | Documento de Identidade |
| `AUTORIZACAO_DEMOLICAO` | ART, Comprovante de Propriedade, Matrícula do Imóvel, Projeto de Demolição |
| `DESOBSTRUCAO_BUEIRO` | Fotos |
| `REGISTRO_PROBLEMA_FOTO` | Fotos |
| `CAPINA_ROCAGEM` | Fotos |
| `INSCRICAO_EJA` | CPF, Comprovante de Residência, RG |
| ... and 27 more | (see full report) |

### 2. Top 10 Workflows with Most Document Mismatches

| Rank | Module Type | Service File | Missing Docs |
|------|-------------|--------------|--------------|
| 1 | `CREDENCIAMENTO_TAXI` | transport-transit.seed.ts | 7 docs |
| 2 | `CREDENCIAMENTO_MOTOTAXI` | transport-transit.seed.ts | 6 docs |
| 3 | `CADASTRO_VOLUNTARIO` | civil-defense.seed.ts | 5 docs (service has NONE) |
| 4 | `CREDENCIAMENTO_TRANSPORTE_ESCOLAR` | transport-transit.seed.ts | 5 docs |
| 5 | `REGULARIZACAO_OBRA` | public-works.seed.ts | 5 docs |
| 6 | `CADASTRO_UNICO` | social.seed.ts | 4 docs |
| 7 | `INSCRICAO_PROGRAMA_SOCIAL` | social.seed.ts | 4 docs |
| 8 | `LAUDO_VISTORIA_SEGURANCA` | public-safety.seed.ts | 4 docs |
| 9 | `CADASTRO_ESTABELECIMENTO_TURISTICO` | tourism.seed.ts | 4 docs |
| 10 | `APROVACAO_LOTEAMENTO` | public-works.seed.ts | 4 docs |

## Common Patterns in Mismatches

### Pattern 1: Basic Identity Documents Missing
Many services don't list basic identity docs that workflows require:
- **CPF** (missing in 85+ workflows)
- **RG** (missing in 70+ workflows)
- **Comprovante de Residência** (missing in 60+ workflows)

**Example:** `CADASTRO_VOLUNTARIO`
- Workflow requires: Atestado de Antecedentes, CPF, Comprovante de Residência, Currículo, RG
- Service requires: **NOTHING** (empty array)

### Pattern 2: Name Variations
Same document, different names:
- "Comprovante de Residência" vs "Comprovante de Endereço"
- "RG ou CNH" vs "RG" vs "Documento de Identidade"
- "CPF/CNPJ" vs "CPF" + "CNPJ (se pessoa jurídica)"
- "ART/RRT" vs "ART"

**Example:** `AUXILIO_EMERGENCIAL`
- Workflow: "Comprovante de Residência"
- Service: "Comprovante de Endereço"
- Result: Mismatch (different strings)

### Pattern 3: Workflow More Specific Than Service
Workflows often require more documents than service definition allows:

**Example:** `LICENCA_OBRA`
- Service: Projeto Aprovado, ART, Matrícula do Imóvel, IPTU
- Workflow: **Projeto Arquitetônico**, ART/RRT, Matrícula do Imóvel, **Documento do Proprietário**
- Missing: "Projeto Arquitetônico", "Documento do Proprietário"

### Pattern 4: Service Has Optional, Workflow Requires
Services mark docs as optional, workflows require them:

**Example:** `CADASTRO_PROPRIEDADE_RURAL`
- Service: CAR - Cadastro Ambiental Rural **(opcional)**
- Workflow: CAR (Cadastro Ambiental Rural) — **required in stage 2**

## Recommended Fixes

### Option 1: Update Service Definitions (Recommended)
Add all workflow-required documents to service `requiredDocuments` arrays.

**Pros:**
- Citizens can upload all needed documents
- Workflows function correctly
- Simple bulk update

**Cons:**
- Some services may end up with large document lists
- Need to review each mismatch case-by-case

### Option 2: Update Workflows
Change workflows to only require documents in service definitions.

**Pros:**
- Services stay clean

**Cons:**
- Workflows may become less useful
- May remove legitimately needed documents
- More complex to validate

### Option 3: Hybrid Approach
1. For **obvious mismatches** (CPF, RG, etc.): Add to service
2. For **name variations**: Standardize names in both places
3. For **workflow-specific docs**: Add to service with `(workflow stage X)` note
4. For **missing services**: Create service definitions

## Detailed Reports

- **Full JSON Report:** `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\document-mismatches.json`
- **Text Report:** `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\WORKFLOW_SERVICE_MISMATCHES_REPORT.txt`
- **Extracted Data:**
  - Workflows: `workflows-extracted.json`
  - Services: `services-extracted.json`

## Files Analyzed

### Workflows
- `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\service-workflows.seed.ts` (26,657 lines)
- 193 workflow definitions extracted

### Services
- `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services\*.seed.ts` (21 files)
- 192 service definitions extracted (with some duplicates)

## Next Steps

1. **Immediate:** Review workflows without service definitions (39 cases)
2. **High Priority:** Fix top 30 workflows with most mismatches (3-7 docs each)
3. **Medium Priority:** Standardize document naming across all files
4. **Low Priority:** Fix single-document mismatches and name variations

---

**Analysis Date:** 2026-02-22
**Analysis Tool:** Python regex extraction + cross-reference
**Generated by:** Claude Code Agent
