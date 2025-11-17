# 🔗 Sistema de Vinculação de Cidadãos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [APIs](#apis)
5. [Componentes Frontend](#componentes-frontend)
6. [Casos de Uso](#casos-de-uso)
7. [Migração de Dados](#migração-de-dados)
8. [Guia de Implementação](#guia-de-implementação)

---

## 🎯 Visão Geral

O **Sistema de Vinculação de Cidadãos** permite relacionar cidadãos cadastrados em protocolos de serviços, substituindo campos de texto livre por referências estruturadas à tabela `Citizen`.

### Problemas Resolvidos

✅ **Duplicação de Dados**: Elimina campos como `nomeAluno`, `cpfAluno`, `dataNascimentoAluno`
✅ **Validação Automática**: Verifica vínculos contra a composição familiar
✅ **Integridade**: Garante que dados de cidadãos sejam consistentes
✅ **Histórico Unificado**: Permite rastrear todos os protocolos de um cidadão
✅ **Prevenção de Fraudes**: Impede vínculos com cidadãos não relacionados

### Conceito Principal

```typescript
// ❌ ANTES (texto livre)
{
  nomeAluno: "João Silva",
  cpfAluno: "123.456.789-00",
  dataNascimentoAluno: "2010-05-15"
}

// ✅ DEPOIS (vínculo estruturado)
{
  linkedCitizens: [
    {
      citizenId: "cuid_do_joao",
      linkType: "STUDENT",
      relationship: "SON",
      role: "BENEFICIARY",
      isVerified: true
    }
  ]
}
```

---

## 🏗 Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    PROTOCOLO                             │
│  (ProtocolSimplified)                                    │
│  - citizenId (solicitante)                               │
│  - customData (dados legados)                            │
└────────────┬────────────────────────────────────────────┘
             │
             │ 1:N
             ▼
┌─────────────────────────────────────────────────────────┐
│           VÍNCULO DE CIDADÃO                             │
│  (ProtocolCitizenLink)                                   │
│  - linkedCitizenId → Citizen                             │
│  - linkType (STUDENT, COMPANION, etc)                    │
│  - relationship (SON, SPOUSE, etc)                       │
│  - role (BENEFICIARY, RESPONSIBLE, etc)                  │
│  - contextData (dados específicos)                       │
│  - isVerified (validado contra FamilyComposition)        │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                 COMPOSIÇÃO FAMILIAR                      │
│  (FamilyComposition)                                     │
│  - headId → Citizen                                      │
│  - memberId → Citizen                                    │
│  - relationship                                          │
│  - isDependent                                           │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Validação

```
1. Usuário seleciona cidadão vinculado
2. Sistema busca na FamilyComposition
3. Se encontrado:
   ✓ isVerified = true
   ✓ relationship preenchido automaticamente
4. Se não encontrado:
   ✗ isVerified = false
   ⚠️ Requer verificação manual
```

---

## 📊 Estrutura de Dados

### Modelo Prisma

```prisma
model ProtocolCitizenLink {
  id         String   @id @default(cuid())
  protocolId String

  // Vínculo com cidadão cadastrado
  linkedCitizenId String
  linkedCitizen   Citizen @relation("LinkedCitizens", fields: [linkedCitizenId], references: [id], onDelete: Cascade)

  // Tipo de vínculo no contexto do protocolo
  linkType     CitizenLinkType

  // Relacionamento com o solicitante
  relationship String?  // SON, SPOUSE, PARENT, OTHER

  // Papel no serviço
  role         ServiceRole

  // Dados contextuais específicos do vínculo
  contextData  Json?

  // Campos de validação
  isVerified   Boolean  @default(false)
  verifiedAt   DateTime?
  verifiedBy   String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  protocol ProtocolSimplified @relation(fields: [protocolId], references: [id], onDelete: Cascade)

  @@index([protocolId])
  @@index([linkedCitizenId])
  @@index([linkType])
  @@map("protocol_citizen_links")
}
```

### Enums

#### CitizenLinkType

```typescript
enum CitizenLinkType {
  STUDENT              // Aluno
  GUARDIAN             // Responsável Legal
  PATIENT              // Paciente
  COMPANION            // Acompanhante
  DEPENDENT            // Dependente
  FAMILY_MEMBER        // Membro Familiar
  AUTHORIZED_PERSON    // Pessoa Autorizada
  BENEFICIARY          // Beneficiário
  WITNESS              // Testemunha
  OTHER                // Outro
}
```

#### ServiceRole

```typescript
enum ServiceRole {
  BENEFICIARY    // Quem recebe o benefício
  RESPONSIBLE    // Responsável legal
  AUTHORIZED     // Pessoa autorizada
  COMPANION      // Acompanhante
  WITNESS        // Testemunha
  OTHER          // Outro
}
```

---

## 🔌 APIs

### 1. Listar Vínculos

```http
GET /api/admin/protocols/:protocolId/citizen-links
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "links": [
      {
        "id": "cuid",
        "linkedCitizenId": "cuid",
        "linkedCitizen": {
          "id": "cuid",
          "name": "João Silva",
          "cpf": "123.456.789-00",
          "birthDate": "2010-05-15"
        },
        "linkType": "STUDENT",
        "relationship": "SON",
        "role": "BENEFICIARY",
        "contextData": {
          "serie": "5º ano",
          "turno": "Manhã"
        },
        "isVerified": true
      }
    ]
  }
}
```

### 2. Criar Vínculo

```http
POST /api/admin/protocols/:protocolId/citizen-links
Authorization: Bearer {token}
Content-Type: application/json

{
  "linkedCitizenId": "cuid_do_joao",
  "linkType": "STUDENT",
  "relationship": "SON",  // opcional
  "role": "BENEFICIARY",
  "contextData": {
    "serie": "5º ano",
    "turno": "Manhã"
  },
  "autoVerify": true  // verifica contra FamilyComposition
}

Response:
{
  "success": true,
  "data": {
    "link": { ... }
  },
  "message": "Vínculo criado e verificado automaticamente"
}
```

### 3. Atualizar Vínculo

```http
PUT /api/admin/protocols/:protocolId/citizen-links/:linkId
Authorization: Bearer {token}
Content-Type: application/json

{
  "linkType": "STUDENT",
  "contextData": {
    "serie": "6º ano"
  }
}
```

### 4. Verificar Vínculo Manualmente

```http
POST /api/admin/protocols/:protocolId/citizen-links/:linkId/verify
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "link": {
      "isVerified": true,
      "verifiedAt": "2025-11-17T...",
      "verifiedBy": "user_id"
    }
  }
}
```

### 5. Remover Vínculo

```http
DELETE /api/admin/protocols/:protocolId/citizen-links/:linkId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Vínculo removido com sucesso"
}
```

### 6. Buscar Cidadãos Disponíveis

```http
GET /api/admin/citizens/:citizenId/available-for-link?linkType=STUDENT
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "citizens": [
      {
        "id": "cuid",
        "name": "João Silva",
        "cpf": "123.456.789-00",
        "birthDate": "2010-05-15",
        "relationship": "SON",
        "isDependent": true
      }
    ]
  }
}
```

### 7. Validar Vínculo Familiar

```http
POST /api/admin/citizens/:citizenId/validate-family-link
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberCitizenId": "cuid_do_joao",
  "expectedRelationship": "SON"  // opcional
}

Response:
{
  "success": true,
  "data": {
    "isValid": true,
    "exists": true,
    "relationship": "SON",
    "isDependent": true,
    "message": "Vínculo familiar validado com sucesso"
  }
}
```

---

## 🎨 Componentes Frontend

### CitizenLinkSelector

Componente para seleção de cidadãos vinculados.

```tsx
import { CitizenLinkSelector } from '@/components/forms/CitizenLinkSelector'

function MatriculaForm() {
  const [selectedLinks, setSelectedLinks] = useState([])

  return (
    <CitizenLinkSelector
      citizenId={solicitante.id}
      linkType="STUDENT"
      role="BENEFICIARY"
      onLinkSelect={(link) => setSelectedLinks([...selectedLinks, link])}
      onLinkRemove={(link) => setSelectedLinks(links.filter(l => l.id !== link.id))}
      selectedLinks={selectedLinks}
      contextFields={[
        { name: 'serie', label: 'Série', type: 'select', options: ['1º ano', '2º ano', ...], required: true },
        { name: 'turno', label: 'Turno', type: 'select', options: ['Manhã', 'Tarde'], required: true }
      ]}
    />
  )
}
```

### Hook useCitizenLinks

```tsx
import { useCitizenLinks } from '@/hooks/useCitizenLinks'

function ProtocolDetails({ protocolId }) {
  const { links, loading, addLink, removeLink, verifyLink } = useCitizenLinks({ protocolId })

  useEffect(() => {
    loadLinks()
  }, [protocolId])

  const handleAddLink = async () => {
    await addLink({
      linkedCitizenId: 'cuid',
      linkType: 'STUDENT',
      role: 'BENEFICIARY'
    })
  }

  return (
    <div>
      {links.map(link => (
        <div key={link.id}>
          {link.linkedCitizen.name}
          {!link.isVerified && (
            <button onClick={() => verifyLink(link.id)}>Verificar</button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## 📚 Casos de Uso

### 1. Matrícula Escolar (Educação)

```typescript
// Tipo de vínculo
linkType: "STUDENT"
role: "BENEFICIARY"

// Context data
contextData: {
  serie: "5º ano",
  turno: "Manhã",
  escola: "Escola Municipal ABC",
  anoLetivo: "2025",
  necessidadeEspecial: false
}
```

### 2. Transporte de Paciente (Saúde)

```typescript
// Tipo de vínculo
linkType: "COMPANION"
role: "COMPANION"

// Context data
contextData: {
  motivoAcompanhamento: "Consulta especializada",
  dataViagem: "2025-12-01",
  destino: "Hospital Regional"
}
```

### 3. Controle de Medicamentos (Saúde)

```typescript
// Tipo de vínculo
linkType: "AUTHORIZED_PERSON"
role: "AUTHORIZED"

// Context data
contextData: {
  tipoAutorizacao: "Retirada de medicamentos",
  validadeAutorizacao: "2025-12-31"
}
```

### 4. Cadastro Único - CadÚnico (Assistência Social)

```typescript
// Múltiplos vínculos
const familyMembers = [
  {
    linkType: "FAMILY_MEMBER",
    role: "DEPENDENT",
    contextData: {
      renda: 1200.00,
      ocupacao: "Estudante"
    }
  },
  {
    linkType: "FAMILY_MEMBER",
    role: "DEPENDENT",
    contextData: {
      renda: 0,
      ocupacao: "Menor de idade"
    }
  }
]
```

---

## 🔄 Migração de Dados

### Script de Migração

```bash
# Dry-run (apenas visualizar)
npm run migrate:citizen-links -- --dry-run

# Migrar todos os protocolos
npm run migrate:citizen-links

# Migrar apenas módulo específico
npm run migrate:citizen-links -- --module-type MATRICULA_ESCOLAR
```

### Processo de Migração

1. **Identificação**: Script busca protocolos com `customData` contendo CPFs
2. **Busca de Cidadãos**: Procura cidadão cadastrado com o CPF
3. **Validação Familiar**: Verifica se está na `FamilyComposition`
4. **Criação de Vínculo**: Cria `ProtocolCitizenLink` com dados corretos
5. **Auto-verificação**: Marca como `isVerified=true` se encontrado na família

### Estatísticas de Exemplo

```
====================================
ESTATÍSTICAS DA MIGRAÇÃO
====================================

Total de protocolos analisados: 150
Protocolos com vínculos: 98
Vínculos criados: 112
Vínculos verificados: 87 (77.7%)
Protocolos ignorados: 52
Erros: 0

====================================
```

---

## 🚀 Guia de Implementação

### 1. Aplicar Migration

```bash
cd digiurban/backend
npx prisma migrate deploy
```

### 2. Adaptar Formulário de Serviço

#### Antes (campos de texto):

```tsx
<Input name="nomeAluno" label="Nome do Aluno" />
<Input name="cpfAluno" label="CPF do Aluno" />
<Input name="dataNascimentoAluno" label="Data de Nascimento" type="date" />
```

#### Depois (seletor de vínculos):

```tsx
<CitizenLinkSelector
  citizenId={formData.citizen_id}
  linkType="STUDENT"
  role="BENEFICIARY"
  onLinkSelect={(link) => setFormData({ ...formData, linkedStudents: [...formData.linkedStudents, link] })}
  selectedLinks={formData.linkedStudents}
  contextFields={[
    { name: 'serie', label: 'Série', type: 'select', options: SERIES, required: true },
    { name: 'turno', label: 'Turno', type: 'select', options: TURNOS, required: true }
  ]}
/>
```

### 3. Atualizar Handler de Criação de Protocolo

```typescript
// Ao criar protocolo
const protocol = await prisma.protocolSimplified.create({ ... })

// Criar vínculos
if (formData.linkedStudents) {
  await prisma.protocolCitizenLink.createMany({
    data: formData.linkedStudents.map(link => ({
      protocolId: protocol.id,
      linkedCitizenId: link.linkedCitizenId,
      linkType: link.linkType,
      relationship: link.relationship,
      role: link.role,
      contextData: link.contextData,
      isVerified: link.isVerified
    }))
  })
}
```

### 4. Exibir Vínculos no Detalhamento do Protocolo

```tsx
function ProtocolDetails({ protocol }) {
  const { links } = useCitizenLinks({ protocolId: protocol.id, autoLoad: true })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cidadãos Vinculados</CardTitle>
      </CardHeader>
      <CardContent>
        {links.map(link => (
          <div key={link.id} className="flex items-center gap-3">
            <UserCircle />
            <div>
              <div>{link.linkedCitizen.name}</div>
              <div className="text-sm text-gray-500">
                {LINK_TYPE_LABELS[link.linkType]}
                {link.relationship && ` · ${link.relationship}`}
              </div>
            </div>
            {link.isVerified && <Badge>Verificado</Badge>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

---

## ✅ Checklist de Implementação

### Backend

- [x] Atualizar schema.prisma
- [x] Criar migration
- [x] Criar rotas de API
- [x] Criar serviço de validação
- [x] Criar utilitários de transformação
- [x] Criar script de migração

### Frontend

- [x] Criar componente CitizenLinkSelector
- [x] Criar hook useCitizenLinks
- [ ] Atualizar formulário de Matrícula Escolar (piloto)
- [ ] Atualizar outros formulários relevantes

### Dados

- [ ] Executar migration
- [ ] Executar script de migração (dry-run)
- [ ] Validar dados migrados
- [ ] Executar script de migração (produção)

---

## 📝 Notas Importantes

### Compatibilidade com Sistema Atual

O sistema é **retrocompatível**:

1. Campos legacy (`nomeAluno`, `cpfAluno`) ainda funcionam
2. Novos protocolos usam `ProtocolCitizenLink`
3. Migração pode ser feita gradualmente
4. `CitizenLinkTransformer` permite conversão bidirecional

### Segurança

- ✅ Validação automática contra `FamilyComposition`
- ✅ Previne vínculos com cidadãos não relacionados
- ✅ Auditoria de verificações (`verifiedBy`, `verifiedAt`)
- ✅ Permissões por role (COORDINATOR pode verificar manualmente)

### Performance

- ✅ Índices em `protocolId`, `linkedCitizenId`, `linkType`
- ✅ Eager loading de `linkedCitizen` nas queries
- ✅ Cache de cidadãos disponíveis

---

## 🎯 Roadmap Futuro

1. **Dashboard de Vínculos**: Visualização de todos os vínculos de um cidadão
2. **Alertas Automáticos**: Notificar quando vínculo não verificado
3. **Sugestões Inteligentes**: ML para sugerir vínculos baseado em padrões
4. **Exportação de Relatórios**: Relatórios por aluno, beneficiário, etc.
5. **Integração com Educação**: Sincronizar com sistemas escolares

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Verifique logs do script de migração
3. Teste com `--dry-run` antes de aplicar mudanças

---

**Desenvolvido por:** Claude Agent SDK
**Data:** Novembro 2025
**Versão:** 1.0.0
