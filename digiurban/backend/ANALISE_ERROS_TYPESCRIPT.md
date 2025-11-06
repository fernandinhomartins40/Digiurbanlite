# ANÁLISE SISTEMÁTICA DOS 27 ERROS TYPESCRIPT

## 📊 CATEGORIZAÇÃO

### **Categoria 1: Campos Faltantes em Modelos Prisma** (10 erros)

#### 1.1 TechnicalAssistance (1 erro)
- ❌ Campo `requestDate` não existe
- 📍 `src/modules/handlers/agriculture/technical-assistance-handler.ts:60`

#### 1.2 CulturalSpace (1 erro)
- ❌ Campo `operatingHours` obrigatório faltando
- 📍 `src/modules/handlers/culture/cultural-space-handler.ts:27`

#### 1.3 EnvironmentalComplaint (1 erro)
- ❌ Campos `severity` e `occurrenceDate` obrigatórios faltando
- 📍 `src/modules/handlers/environment/environmental-complaint-handler.ts:51`

#### 1.4 EnvironmentalLicense (1 erro)
- ❌ Campos `licenseNumber`, `activity`, `applicationDate` obrigatórios faltando
- 📍 `src/modules/handlers/environment/environmental-license-handler.ts:45`

#### 1.5 Athlete (1 erro)
- ❌ Campo `category` obrigatório faltando
- 📍 `src/modules/handlers/sports/athlete-handler.ts:20`

#### 1.6 SportsAttendance (1 erro)
- ❌ Campos `citizenName`, `contact`, `type` obrigatórios faltando
- 📍 `src/modules/handlers/sports/competition-handler.ts:31`

#### 1.7 TourismAttendance (1 erro)
- ❌ Campo `visitorName` obrigatório faltando
- 📍 `src/modules/handlers/tourism/tourism-program-handler.ts:31`

#### 1.8 BuildingPermit (1 erro)
- ❌ Campo `totalArea` não existe
- 📍 `src/modules/handlers/urban-planning/building-permit-handler.ts:61`

#### 1.9 CustomDataTable (2 erros)
- ❌ Campo `fields` obrigatório faltando
- 📍 `src/modules/module-handler.ts:839`
- 📍 `src/routes/custom-modules.ts:163`

---

### **Categoria 2: Problemas com Tipos Json** (5 erros)

#### 2.1 Campos Json aceitando `null` diretamente
- ❌ `string | null` → `NullableJsonNullValueInput | InputJsonValue`
- 📍 Arquivos:
  - `cultural-event-handler.ts:35` (campo `location`)
  - `cultural-event-handler.ts:43` (campo `participants`)
  - `cultural-project-handler.ts:34` (campo `activities`)
  - `sports-team-handler.ts:28` (campo desconhecido)
  - `local-business-handler.ts:37` (campo desconhecido)
  - `tourist-attraction-handler.ts:31` (campo desconhecido)

**Total:** 6 erros (mas listei 5 na categoria - ajustado)

---

### **Categoria 3: Campos em ServiceForm/Location/Scheduling/Survey/Workflow** (5 erros)

#### 3.1 ServiceForm
- ❌ Campo `steps` não existe
- 📍 `src/routes/services.ts:261`

#### 3.2 ServiceLocation
- ❌ Campo `allowedRadius` não existe
- 📍 `src/routes/services.ts:275`

#### 3.3 ServiceScheduling
- ❌ Campo `slotDuration` não existe
- 📍 `src/routes/services.ts:298`

#### 3.4 ServiceSurvey
- ❌ Campo `showAfterDays` não existe (existe `showAfter`)
- 📍 `src/routes/services.ts:325`

#### 3.5 ServiceWorkflow
- ❌ Campo `version` não existe
- 📍 `src/routes/services.ts:341`

---

### **Categoria 4: ServiceNotification** (1 erro)

- ❌ Campos `templates` e `triggers` obrigatórios faltando
- 📍 `src/routes/services.ts:404`

---

### **Categoria 5: ServiceTemplate** (3 erros)

#### 5.1 Campo `requiredDocs` não existe (2 erros)
- 📍 `src/seeds/phase7-security-templates-seed.ts:41`
- 📍 `src/seeds/phase7-security-templates-seed.ts:60`

#### 5.2 Campo `fieldMapping` não existe (1 erro)
- 📍 `src/routes/service-templates.ts:231`

#### 5.3 Tipo incompatível em include (1 erro)
- ❌ `{ instances: { where: ... } }` incompatível
- 📍 `src/routes/service-templates.ts:142`

#### 5.4 Tipo incompatível em String() (1 erro)
- ❌ `String(number | null)` inválido
- 📍 `src/routes/service-templates.ts:228`

---

## 📋 RESUMO POR TIPO DE CORREÇÃO

| Tipo de Correção | Quantidade | Estratégia |
|------------------|------------|------------|
| **Adicionar campos opcionais ao schema** | 10 | Adicionar `field Type?` |
| **Corrigir tipos Json (null → undefined)** | 5 | `campo ?? undefined` ou `Prisma.JsonNull` |
| **Adicionar campos FASE 8 ao schema** | 5 | Adicionar campos de configuração |
| **Corrigir ServiceNotification** | 1 | Adicionar campos obrigatórios |
| **Corrigir ServiceTemplate** | 5 | Ajustar campos e tipos |

**TOTAL:** 27 erros

---

## 🎯 PLANO DE CORREÇÃO

### **PASSO 1: Atualizar Schema Prisma** (15 campos)

Adicionar campos faltantes/opcionais:

```prisma
model TechnicalAssistance {
  requestDate      DateTime?  // NOVO
  ...
}

model CulturalSpace {
  operatingHours   String     // NOVO (obrigatório)
  ...
}

model EnvironmentalComplaint {
  severity         String     // NOVO (obrigatório)
  occurrenceDate   DateTime   // NOVO (obrigatório)
  ...
}

model EnvironmentalLicense {
  licenseNumber    String     // NOVO (obrigatório)
  activity         String     // NOVO (obrigatório)
  applicationDate  DateTime   // NOVO (obrigatório)
  ...
}

model Athlete {
  category         String     // NOVO (obrigatório)
  ...
}

model SportsAttendance {
  citizenName      String     // NOVO (obrigatório)
  contact          String     // NOVO (obrigatório)
  type             String     // NOVO (obrigatório)
  ...
}

model TourismAttendance {
  visitorName      String     // NOVO (obrigatório)
  ...
}

model BuildingPermit {
  totalArea        Float?     // NOVO
  ...
}

model CustomDataTable {
  fields           Json       // NOVO (obrigatório)
  ...
}

model ServiceForm {
  steps            Json?      // NOVO
  ...
}

model ServiceLocation {
  allowedRadius    Float?     // NOVO
  ...
}

model ServiceScheduling {
  slotDuration     Int?       // NOVO
  ...
}

model ServiceWorkflow {
  version          Int?       // NOVO
  ...
}

model ServiceNotification {
  templates        Json       // NOVO (obrigatório)
  triggers         Json       // NOVO (obrigatório)
  ...
}

model ServiceTemplate {
  requiredDocs     Json?      // NOVO
  fieldMapping     Json?      // JÁ EXISTE?
  ...
}
```

### **PASSO 2: Corrigir Handlers** (6 correções)

Ajustar tipos Json de `null` para `undefined`:

```typescript
// ANTES
campo: valor || null

// DEPOIS
campo: valor ?? undefined
```

### **PASSO 3: Corrigir Routes** (6 correções)

Ajustar nomenclatura e tipos em:
- `services.ts` (5 correções)
- `service-templates.ts` (3 correções)
- `custom-modules.ts` (1 correção já incluída no schema)

---

## ✅ ORDEM DE EXECUÇÃO

1. ✅ Atualizar `schema.prisma` (15 campos)
2. ✅ Executar `npx prisma generate`
3. ✅ Corrigir handlers (6 arquivos)
4. ✅ Corrigir routes (2 arquivos)
5. ✅ Compilar e verificar (0 erros esperados!)
