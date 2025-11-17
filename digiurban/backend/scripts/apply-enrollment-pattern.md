# Script de Aplicação do Padrão de Inscrições Dinâmicas

## RESUMO DA IMPLEMENTAÇÃO

Total de serviços de inscrição: **11**
- ✅ Completos: **5** (Agricultura 2, Cultura 1)
- ⏳ Pendentes: **6**

## STATUS ATUAL

### ✅ AGRICULTURA - 100% Completo
1. **INSCRICAO_PROGRAMA_RURAL** → RuralProgramEnrollment ✅
   - RuralProgram: customFields adicionados
   - RuralProgramEnrollment: criado
   - Relacionamentos: completos

2. **INSCRICAO_CURSO_RURAL** → RuralTrainingEnrollment ✅
   - RuralTraining: customFields adicionados
   - RuralTrainingEnrollment: criado
   - Relacionamentos: completos

### ✅ CULTURA - 100% Completo
3. **INSCRICAO_OFICINA_CULTURAL** → CulturalWorkshopEnrollment ✅
   - CulturalWorkshop: customFields adicionados
   - CulturalWorkshopEnrollment: atualizado
   - Relacionamentos: completos

### ⏳ ESPORTES - 0% (2 serviços)
4. **INSCRICAO_ESCOLINHA** → SportsSchoolEnrollment ⏳
   - SportsSchool: FALTA adicionar customFields
   - SportsSchoolEnrollment: EXISTE mas falta atualizar
   - FALTA: relação SportsSchool → enrollments
   - FALTA: relação SportsSchoolEnrollment → school
   - FALTA: customData, documents

5. **INSCRICAO_COMPETICAO** → CompetitionEnrollment ⏳
   - Competition: FALTA adicionar customFields
   - CompetitionEnrollment: EXISTE mas falta atualizar
   - FALTA: relação Competition → enrollments
   - FALTA: relação CompetitionEnrollment → competition

6. **INSCRICAO_TORNEIO** → TournamentEnrollment
   - ⚠️ PROBLEMA: Não existe modelo Tournament
   - Enrollment existe mas não tem modelo principal
   - DECISÃO: Deixar como está por enquanto

### ⏳ ASSISTÊNCIA SOCIAL - 0% (2 serviços)
7. **INSCRICAO_PROGRAMA_SOCIAL** → SocialProgramEnrollment ⏳
   - SocialProgram: FALTA adicionar customFields
   - SocialProgramEnrollment: EXISTE mas falta verificar

8. **INSCRICAO_GRUPO_OFICINA** → SocialGroupEnrollment ⏳
   - ⚠️ PROBLEMA: Não existe modelo SocialGroup
   - Enrollment existe mas não tem modelo principal

### ⏳ HABITAÇÃO - 0% (2 serviços)
9. **INSCRICAO_PROGRAMA_HABITACIONAL** → HousingApplication
   - ⚠️ ESPECIAL: HousingApplication JÁ É a inscrição
   - HousingProgram: FALTA adicionar customFields
   - FALTA: relação HousingProgram → applications

10. **INSCRICAO_FILA_HABITACAO** → HousingRegistration
    - ⚠️ ESPECIAL: HousingRegistration JÁ É a inscrição
    - Não precisa de *Enrollment separado

### ⏳ TURISMO - 0% (1 serviço)
11. **INSCRICAO_PROGRAMA_TURISTICO** → TourismProgramEnrollment
    - TourismProgram: FALTA adicionar customFields
    - TourismProgramEnrollment: PRECISA CRIAR

## AÇÕES NECESSÁRIAS POR ORDEM DE PRIORIDADE

### 🔥 Prioridade ALTA (Mais Usados)
1. ✅ AGRICULTURA → 100% completo
2. ⏳ ESPORTES → Aplicar padrão
3. ⏳ CULTURA → 100% completo
4. ⏳ ASSISTÊNCIA SOCIAL → Aplicar padrão

### 📊 Prioridade MÉDIA
5. ⏳ TURISMO → Criar modelo
6. ⏳ HABITAÇÃO → Casos especiais

## CHECKLIST DE MUDANÇAS

Para cada serviço, seguir este checklist:

### [ ] Modelo Principal (Program/Workshop/Training)
```prisma
- [ ] Adicionar customFields Json?
- [ ] Adicionar requiredDocuments Json?
- [ ] Adicionar enrollmentSettings Json?
- [ ] Adicionar enrollments [Tipo]Enrollment[]
```

### [ ] Modelo Enrollment
```prisma
- [ ] Tornar [tipo]Id obrigatório (String sem ?)
- [ ] Adicionar citizenId String?
- [ ] Adicionar customData Json?
- [ ] Adicionar documents Json?
- [ ] Adicionar adminNotes String?
- [ ] Adicionar rejectionReason String?
- [ ] Adicionar moduleType String @default("INSCRICAO_...")
- [ ] Adicionar relação com modelo principal
- [ ] Adicionar relação com Citizen
- [ ] Adicionar índices otimizados
```

### [ ] Relacionamentos
```prisma
Tenant:
- [ ] Adicionar [tipo]Enrollments [Tipo]Enrollment[]

Citizen:
- [ ] Adicionar [tipo]Enrollments [Tipo]Enrollment[] @relation("[Tipo]EnrollmentCitizen")

ProtocolSimplified:
- [ ] Adicionar [tipo]Enrollments [Tipo]Enrollment[] @relation("[Tipo]EnrollmentProtocol")
```

### [ ] Module Mapping
```typescript
- [ ] Atualizar INSCRICAO_XXX para apontar para *Enrollment
```

## PRÓXIMA EXECUÇÃO

Execute na ordem:
1. Esportes (SportsSchool, Competition)
2. Assistência Social (SocialProgram)
3. Turismo (TourismProgram + criar Enrollment)
4. Habitação (HousingProgram customFields)
5. Atualizar todos relacionamentos
6. Atualizar module-mapping.ts
7. Criar migration
8. Testar compilação Prisma
