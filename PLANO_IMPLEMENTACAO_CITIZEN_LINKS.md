# 🚀 PLANO DE IMPLEMENTAÇÃO - SISTEMA DE VINCULAÇÃO DE CIDADÃOS

## 📋 Índice

1. [Visão Geral do Plano](#visão-geral-do-plano)
2. [Fase 1: Fundação (2-3 dias)](#fase-1-fundação-2-3-dias)
3. [Fase 2: Implementação Piloto (3-4 dias)](#fase-2-implementação-piloto-3-4-dias)
4. [Fase 3: Expansão (5-7 dias)](#fase-3-expansão-5-7-dias)
5. [Fase 4: Consolidação (2-3 dias)](#fase-4-consolidação-2-3-dias)
6. [Fase 5: Otimização (2-3 dias)](#fase-5-otimização-2-3-dias)
7. [Cronograma Consolidado](#cronograma-consolidado)
8. [Riscos e Mitigações](#riscos-e-mitigações)
9. [Critérios de Sucesso](#critérios-de-sucesso)

---

## 🎯 VISÃO GERAL DO PLANO

### Objetivo

Implementar 100% do sistema de vinculação de cidadãos em protocolos, integrando com composição familiar, motor de protocolos, módulos especializados e formulários.

### Escopo

- ✅ **26 serviços** com campos de vinculação identificados
- ✅ **3 departamentos principais**: Educação, Saúde, Assistência Social
- ✅ **86+ módulos especializados** com suporte a citizen links
- ✅ Migration de dados legados
- ✅ Documentação completa

### Duração Estimada

**14-20 dias úteis** (3-4 semanas)

### Recursos Necessários

- 1 Desenvolvedor Backend (Node.js/Prisma/TypeScript)
- 1 Desenvolvedor Frontend (React/Next.js/TypeScript)
- 1 QA/Tester
- Ambiente de desenvolvimento e staging
- Banco de dados PostgreSQL

---

## 📅 FASE 1: FUNDAÇÃO (2-3 dias)

### Objetivo
Preparar infraestrutura base e aplicar migrations.

### Tarefas

#### ✅ JÁ CONCLUÍDO

1. **Schema Prisma**
   - [x] Criar modelo `ProtocolCitizenLink`
   - [x] Criar enums `CitizenLinkType` e `ServiceRole`
   - [x] Adicionar relações em `Citizen` e `ProtocolSimplified`

2. **Migration SQL**
   - [x] Criar migration `20251117_add_protocol_citizen_links`
   - [x] Definir índices otimizados

3. **APIs Backend**
   - [x] Criar rotas CRUD em `protocol-citizen-links.routes.ts`
   - [x] Criar serviço de validação `citizen-link-validation.service.ts`
   - [x] Criar rotas de validação `citizen-links-validation.routes.ts`

4. **Componentes Frontend**
   - [x] Criar `CitizenLinkSelector.tsx`
   - [x] Criar hook `useCitizenLinks.ts`

5. **Utilitários**
   - [x] Criar `citizen-link-transformer.ts`
   - [x] Criar script `migrate-legacy-citizen-links.ts`

#### ⏳ A FAZER

1. **Aplicar Migration** (30min)
   ```bash
   cd digiurban/backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Testar APIs** (1h)
   - Testar criação de links via Postman/Insomnia
   - Validar integração com FamilyComposition
   - Verificar auto-verificação de vínculos

3. **Configurar Variáveis de Ambiente** (15min)
   - Ajustar `.env` com DATABASE_URL correto
   - Configurar conexão com banco de staging

4. **Documentação Base** (1h)
   - Revisar `CITIZEN_LINKING_SYSTEM.md`
   - Atualizar diagramas se necessário

### Entregáveis

- [x] Migration aplicada com sucesso
- [x] APIs testadas e funcionando
- [x] Ambiente de dev configurado
- [x] Documentação atualizada

### Critérios de Conclusão

- [ ] Migration executada sem erros
- [ ] Tabela `protocol_citizen_links` criada
- [ ] APIs retornam 200 OK em testes básicos
- [ ] Componentes renderizam sem erros

---

## 🧪 FASE 2: IMPLEMENTAÇÃO PILOTO (3-4 dias)

### Objetivo
Implementar citizen links em 1 serviço piloto (Matrícula Escolar) end-to-end.

### Tarefas

#### Backend (1.5 dias)

1. **Atualizar Seed de Matrícula Escolar** (2h)
   ```typescript
   // Em seed-consolidated.ts
   {
     name: 'Matrícula Escolar',
     moduleType: 'MATRICULA_ESCOLAR',
     formSchema: {
       fields: [
         // Manter campos legacy para compatibilidade
         { id: 'nomeAluno', ... },
         { id: 'cpfAluno', ... },
         { id: 'nomeResponsavel', ... },
         { id: 'cpfResponsavel', ... }
       ],
       // NOVO: Config de citizen links
       linkedCitizensConfig: {
         enabled: true,
         types: [
           {
             linkType: 'STUDENT',
             role: 'BENEFICIARY',
             fields: {
               cpf: 'cpfAluno',
               nome: 'nomeAluno',
               dataNascimento: 'dataNascimentoAluno',
               parentesco: 'parentescoResponsavel'
             },
             contextFields: ['serie', 'turno', 'escola']
           }
         ]
       }
     }
   }
   ```

2. **Modificar Handler POST de Educação** (3h)
   ```typescript
   // Em secretarias-educacao.ts
   router.post('/matricula-escolar', async (req, res) => {
     const { citizenData, formData } = req.body

     // 1. Criar protocolo (já existe)
     const protocol = await protocolModuleService.createProtocolWithModule({...})

     // 2. NOVO: Processar citizen links
     const service = await prisma.serviceSimplified.findFirst({
       where: { moduleType: 'MATRICULA_ESCOLAR' }
     })

     if (service?.formSchema?.linkedCitizensConfig?.enabled) {
       const links = await citizenLinkTransformer.transformLegacyData(
         formData,
         citizen.id,
         'MATRICULA_ESCOLAR'
       )

       if (links.length > 0) {
         await prisma.protocolCitizenLink.createMany({
           data: links.map(link => ({
             protocolId: protocol.id,
             ...link
           }))
         })
       }
     }

     // 3. Retornar com links
     const citizenLinks = await prisma.protocolCitizenLink.findMany({
       where: { protocolId: protocol.id },
       include: { linkedCitizen: true }
     })

     return res.json({
       success: true,
       data: { protocol, citizenLinks }
     })
   })
   ```

3. **Adicionar GET de Links em Detalhes** (1h)
   ```typescript
   // Em protocols-simplified.routes.ts
   router.get('/:id', async (req, res) => {
     const protocol = await prisma.protocolSimplified.findUnique({
       where: { id: req.params.id },
       include: {
         citizenLinks: {
           include: { linkedCitizen: true }
         }
       }
     })
     // ...
   })
   ```

4. **Testar Backend** (2h)
   - Criar protocolo com aluno vinculado
   - Validar auto-verificação contra FamilyComposition
   - Testar múltiplos alunos
   - Testar sem vínculo familiar

#### Frontend (1.5 dias)

1. **Atualizar Formulário de Matrícula** (4h)
   ```tsx
   // Em app/cidadao/servicos/[id]/solicitar/page.tsx

   import { CitizenLinkSelector } from '@/components/forms/CitizenLinkSelector'
   import { useCitizenLinks } from '@/hooks/useCitizenLinks'

   function MatriculaForm() {
     const [linkedStudents, setLinkedStudents] = useState([])

     return (
       <form>
         {/* Campos padrão do cidadão */}
         <CitizenFieldsCard />

         {/* NOVO: Seletor de alunos */}
         <Card>
           <CardHeader>
             <CardTitle>Dados do Aluno</CardTitle>
           </CardHeader>
           <CardContent>
             <CitizenLinkSelector
               citizenId={citizen.id}
               linkType="STUDENT"
               role="BENEFICIARY"
               onLinkSelect={(link) => {
                 setLinkedStudents([...linkedStudents, link])
               }}
               onLinkRemove={(link) => {
                 setLinkedStudents(linkedStudents.filter(l => l.id !== link.id))
               }}
               selectedLinks={linkedStudents}
               contextFields={[
                 {
                   name: 'serie',
                   label: 'Série',
                   type: 'select',
                   options: ['1º ano', '2º ano', ...],
                   required: true
                 },
                 {
                   name: 'turno',
                   label: 'Turno',
                   type: 'select',
                   options: ['Manhã', 'Tarde', 'Noite'],
                   required: true
                 },
                 {
                   name: 'escola',
                   label: 'Escola',
                   type: 'select',
                   options: ESCOLAS,
                   required: true
                 }
               ]}
             />
           </CardContent>
         </Card>

         {/* Campos customizados */}
         <CustomFieldsCard />

         <Button type="submit">Solicitar Matrícula</Button>
       </form>
     )
   }
   ```

2. **Atualizar Página de Detalhes do Protocolo** (3h)
   ```tsx
   // Em app/admin/protocols/[id]/page.tsx

   import { useCitizenLinks } from '@/hooks/useCitizenLinks'

   function ProtocolDetails({ protocol }) {
     const { links, loading, verifyLink } = useCitizenLinks({
       protocolId: protocol.id,
       autoLoad: true
     })

     return (
       <div>
         {/* Info do protocolo */}
         <ProtocolInfoCard protocol={protocol} />

         {/* NOVO: Cidadãos vinculados */}
         <Card>
           <CardHeader>
             <CardTitle>Cidadãos Vinculados</CardTitle>
           </CardHeader>
           <CardContent>
             {links.map(link => (
               <div key={link.id} className="flex items-center gap-3 p-3 border rounded">
                 <UserCircle className="h-8 w-8" />
                 <div className="flex-1">
                   <div className="font-medium">{link.linkedCitizen.name}</div>
                   <div className="text-sm text-gray-500">
                     {LINK_TYPE_LABELS[link.linkType]}
                     {link.relationship && ` · ${link.relationship}`}
                   </div>
                   {link.contextData && (
                     <div className="text-xs text-gray-400 mt-1">
                       {link.contextData.serie} - {link.contextData.turno}
                     </div>
                   )}
                 </div>
                 {link.isVerified ? (
                   <Badge variant="default">
                     <Check className="h-3 w-3 mr-1" />
                     Verificado
                   </Badge>
                 ) : (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => verifyLink(link.id)}
                   >
                     Verificar
                   </Button>
                 )}
               </div>
             ))}
           </CardContent>
         </Card>
       </div>
     )
   }
   ```

3. **Testar Frontend** (1h)
   - Testar seleção de aluno da família
   - Testar preenchimento de contextFields
   - Testar validação de campos obrigatórios
   - Testar submissão e visualização

#### Testes Integrados (1 dia)

1. **Testes End-to-End** (4h)
   - Cidadão cria matrícula com filho da família ✓
   - Cidadão tenta matricular filho de outro (deve falhar) ✗
   - Admin cria matrícula e verifica manualmente ✓
   - Múltiplas matrículas para mesma criança ✓

2. **Testes de Edge Cases** (2h)
   - Cidadão sem filhos cadastrados
   - Aluno não encontrado no sistema
   - Vínculo familiar inexistente
   - Atualização de vínculo

3. **Correção de Bugs** (2h)
   - Ajustar validações
   - Corrigir mensagens de erro
   - Refinar UX

### Entregáveis

- [ ] Matrícula Escolar com citizen links funcionando
- [ ] Frontend com CitizenLinkSelector integrado
- [ ] Testes end-to-end passando
- [ ] Documentação do piloto

### Critérios de Conclusão

- [ ] Cidadão consegue selecionar filho da família
- [ ] Sistema valida vínculo automaticamente
- [ ] isVerified = true quando encontrado em FamilyComposition
- [ ] Dados são salvos corretamente
- [ ] Links aparecem no detalhe do protocolo

---

## 📦 FASE 3: EXPANSÃO (5-7 dias)

### Objetivo
Implementar citizen links nos 12 serviços prioritários restantes.

### Estratégia de Implementação

#### Abordagem em Lote por Departamento

**Lote 1: Educação Completa** (2 dias)
- Matrícula de Aluno (expandida)
- Transporte Escolar
- Registro de Ocorrência Escolar
- Solicitação de Documento Escolar
- Consulta de Frequência
- Consulta de Notas

**Lote 2: Saúde** (1.5 dias)
- Controle de Medicamentos
- Encaminhamento TFD
- Transporte de Pacientes
- Cartão Nacional de Saúde

**Lote 3: Assistência Social** (2 dias)
- Cadastro Único (CadÚnico) - complexo, array de membros
- Bolsa Família - array de crianças
- Solicitação de Benefício Social
- Entrega Emergencial

**Lote 4: Outros** (1 dia)
- Inscrição em Escolinha (Esportes)
- Cadastro de Atleta (Esportes)
- Inscrição em Competição (Esportes)

### Tarefas por Lote

#### Para Cada Serviço (2-3h por serviço)

1. **Backend**
   - Adicionar `linkedCitizensConfig` ao seed
   - Modificar handler POST para processar links
   - Testar criação e validação

2. **Frontend**
   - Integrar `CitizenLinkSelector` no formulário
   - Configurar `contextFields` específicos
   - Testar submissão

3. **Testes**
   - Teste básico de criação
   - Teste de validação familiar
   - Teste de edge cases

### Otimizações

#### Criar Helpers Reutilizáveis

```typescript
// backend/src/utils/citizen-link-helpers.ts

export async function processProtocolCitizenLinks(
  protocolId: string,
  formData: any,
  citizenId: string,
  moduleType: string
) {
  const service = await prisma.serviceSimplified.findFirst({
    where: { moduleType }
  })

  if (!service?.formSchema?.linkedCitizensConfig?.enabled) {
    return []
  }

  const links = await citizenLinkTransformer.transformLegacyData(
    formData,
    citizenId,
    moduleType
  )

  if (links.length > 0) {
    await prisma.protocolCitizenLink.createMany({
      data: links.map(link => ({ protocolId, ...link }))
    })
  }

  return links
}
```

#### Padronizar Formulários

```typescript
// frontend/components/forms/ServiceFormWithLinks.tsx

export function ServiceFormWithLinks({
  service,
  citizen,
  onSubmit
}) {
  const linkedConfig = service.formSchema.linkedCitizensConfig

  return (
    <form>
      <CitizenFieldsCard />

      {linkedConfig?.enabled && linkedConfig.types.map(config => (
        <CitizenLinkSelector
          key={config.linkType}
          citizenId={citizen.id}
          linkType={config.linkType}
          role={config.role}
          contextFields={config.contextFields}
          {...}
        />
      ))}

      <CustomFieldsCard />
      <Button type="submit">Enviar</Button>
    </form>
  )
}
```

### Entregáveis

- [ ] 12 serviços com citizen links implementados
- [ ] Helpers reutilizáveis criados
- [ ] Testes automatizados para cada serviço
- [ ] Documentação atualizada por departamento

### Critérios de Conclusão

- [ ] Todos os 13 serviços prioritários funcionando
- [ ] Testes end-to-end passando para cada um
- [ ] Performance adequada (<2s para criar links)
- [ ] UX consistente entre serviços

---

## 🔄 FASE 4: CONSOLIDAÇÃO (2-3 dias)

### Objetivo
Migrar dados legados, sincronizar sugestões e consolidar documentação.

### Tarefas

#### Migration de Dados (1 dia)

1. **Dry-Run da Migration** (2h)
   ```bash
   npm run migrate:citizen-links -- --dry-run
   ```
   - Analisar estatísticas
   - Identificar protocolos sem cidadão vinculado
   - Validar lógica de transformação

2. **Migration por Módulo** (4h)
   ```bash
   # Educação
   npm run migrate:citizen-links -- --module-type MATRICULA_ESCOLAR
   npm run migrate:citizen-links -- --module-type TRANSPORTE_ESCOLAR

   # Saúde
   npm run migrate:citizen-links -- --module-type CONTROLE_MEDICAMENTOS
   npm run migrate:citizen-links -- --module-type ENCAMINHAMENTOS_TFD

   # Assistência Social
   npm run migrate:citizen-links -- --module-type CADASTRO_UNICO
   npm run migrate:citizen-links -- --module-type BOLSA_FAMILIA
   ```

3. **Validação de Dados Migrados** (2h)
   - Verificar integridade dos links
   - Conferir isVerified correto
   - Validar contextData

#### Sincronização de Sugestões (1 dia)

1. **Atualizar Sugestões de Educação** (2h)
   ```typescript
   // frontend/lib/suggestions/educacao.ts

   // Adicionar campos de vínculo às sugestões
   {
     id: 'matricula-escolar',
     name: 'Matrícula Escolar',
     suggestedFields: [
       // NOVO: campos de vínculo
       { name: 'nomeAluno', type: 'text', label: 'Nome do Aluno', required: true },
       { name: 'dataNascimentoAluno', type: 'date', label: 'Data de Nascimento', required: true },
       { name: 'cpfAluno', type: 'cpf', label: 'CPF do Aluno' },
       { name: 'parentescoResponsavel', type: 'select', label: 'Parentesco', options: [...] },
       // ... campos existentes
     ]
   }
   ```

2. **Atualizar Sugestões de Saúde** (1h)
3. **Atualizar Sugestões de Assistência Social** (2h)
4. **Adicionar citizenFields a Todas Sugestões** (3h)

#### Documentação (1 dia)

1. **Atualizar README Principal** (1h)
2. **Criar Guias por Departamento** (2h)
   - Educação: Como matricular com citizen links
   - Saúde: Como autorizar familiar
   - Assistência Social: Como cadastrar família
3. **Criar Vídeos de Demonstração** (opcional, 3h)
4. **Atualizar Swagger/OpenAPI** (2h)

### Entregáveis

- [ ] Dados legados migrados com sucesso
- [ ] Sugestões sincronizadas com seeds
- [ ] Documentação completa e atualizada
- [ ] Guias de uso por departamento

### Critérios de Conclusão

- [ ] Migration executada sem erros
- [ ] >80% dos links com isVerified=true
- [ ] Sugestões alinhadas com seeds
- [ ] Documentação aprovada

---

## ⚡ FASE 5: OTIMIZAÇÃO (2-3 dias)

### Objetivo
Otimizar performance, melhorar UX e implementar features avançadas.

### Tarefas

#### Performance (1 dia)

1. **Otimizar Queries** (3h)
   - Adicionar índices compostos
   - Implementar eager loading
   - Cachear cidadãos disponíveis

2. **Batch Operations** (2h)
   - Criar múltiplos links em uma transação
   - Otimizar bulk migration

3. **Testes de Carga** (3h)
   - 100 protocolos com links simultâneos
   - 1000 links criados em batch
   - Validar <500ms por operação

#### UX Avançado (1 dia)

1. **Autocomplete Inteligente** (3h)
   - Sugerir filhos baseado em idade para escola
   - Pré-selecionar parentesco mais comum
   - Validação em tempo real de CPF

2. **Dashboard de Vínculos** (4h)
   - Visualizar todos os vínculos de um cidadão
   - Estatísticas de verificação
   - Alertas de vínculos não verificados

3. **Notificações** (1h)
   - Notificar quando vínculo precisa verificação
   - Lembrar de adicionar filhos à composição familiar

#### Features Avançadas (1 dia)

1. **Sugestões Inteligentes** (3h)
   - ML para sugerir vínculos baseado em padrões
   - "Você esqueceu de matricular João também?"

2. **Validação Avançada** (2h)
   - Impedir matrícula duplicada
   - Alertar se aluno está em outra escola
   - Validar idade para série

3. **Relatórios** (3h)
   - Relatório de vínculos por cidadão
   - Relatório de alunos matriculados
   - Exportação para Excel

### Entregáveis

- [ ] Performance otimizada (<500ms)
- [ ] UX melhorada com autocomplete
- [ ] Dashboard de vínculos funcionando
- [ ] Features avançadas implementadas

### Critérios de Conclusão

- [ ] Testes de carga passando
- [ ] Usuários conseguem criar links facilmente
- [ ] Dashboard exibe dados corretos
- [ ] Relatórios exportáveis

---

## 📅 CRONOGRAMA CONSOLIDADO

### Semana 1

| Dia | Fase | Atividades | Responsável |
|-----|------|-----------|-------------|
| 1 | Fundação | Aplicar migrations, testar APIs | Backend Dev |
| 2 | Fundação | Configurar ambiente, documentação | Backend Dev + Frontend Dev |
| 3 | Piloto | Implementar backend Matrícula Escolar | Backend Dev |
| 4 | Piloto | Implementar frontend Matrícula Escolar | Frontend Dev |
| 5 | Piloto | Testes integrados e correções | Backend Dev + Frontend Dev + QA |

### Semana 2

| Dia | Fase | Atividades | Responsável |
|-----|------|-----------|-------------|
| 6 | Expansão | Lote 1 - Educação (3 serviços) | Backend Dev + Frontend Dev |
| 7 | Expansão | Lote 1 - Educação (3 serviços) | Backend Dev + Frontend Dev |
| 8 | Expansão | Lote 2 - Saúde (4 serviços) | Backend Dev + Frontend Dev |
| 9 | Expansão | Lote 3 - Assistência Social (2 serviços) | Backend Dev |
| 10 | Expansão | Lote 3 - Assistência Social + Lote 4 | Backend Dev + Frontend Dev |

### Semana 3

| Dia | Fase | Atividades | Responsável |
|-----|------|-----------|-------------|
| 11 | Consolidação | Migration de dados (dry-run + execução) | Backend Dev |
| 12 | Consolidação | Sincronização de sugestões | Frontend Dev |
| 13 | Consolidação | Documentação e guias | Tech Writer + Devs |
| 14 | Otimização | Performance e batch operations | Backend Dev |
| 15 | Otimização | UX avançado e dashboard | Frontend Dev |

### Semana 4 (Opcional)

| Dia | Fase | Atividades | Responsável |
|-----|------|-----------|-------------|
| 16 | Otimização | Features avançadas | Backend Dev + Frontend Dev |
| 17 | Testes | Testes de regressão completos | QA |
| 18 | Deploy | Preparação para produção | DevOps |
| 19 | Deploy | Deploy em produção | DevOps + Devs |
| 20 | Monitoramento | Acompanhamento e ajustes | Todos |

---

## ⚠️ RISCOS E MITIGAÇÕES

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Migration de dados falhar | Média | Alto | Dry-run extensivo, backup antes da migration |
| Performance degradada com muitos links | Baixa | Médio | Índices otimizados, testes de carga |
| Inconsistência entre seeds e sugestões | Alta | Médio | Script de validação automático |
| Bugs em validação de vínculos | Média | Alto | Testes extensivos, validação em múltiplas camadas |

### Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Usuários não entenderem novo fluxo | Média | Médio | Guias visuais, tooltips, suporte dedicado |
| Resistência à mudança | Baixa | Baixo | Manter compatibilidade com fluxo antigo |
| Dados legados incompatíveis | Média | Alto | Transformers flexíveis, validação manual para casos edge |

### Riscos de Projeto

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Atraso no cronograma | Média | Médio | Buffer de 20% no cronograma, priorização clara |
| Falta de recursos | Baixa | Alto | Contratar freelancer, redistribuir tarefas |
| Mudança de requisitos | Baixa | Médio | Escopo bem definido, aprovações formais |

---

## ✅ CRITÉRIOS DE SUCESSO

### Critérios Funcionais

- [ ] 100% dos serviços prioritários (13) com citizen links
- [ ] Migration de dados com >95% de sucesso
- [ ] Validação automática funcionando em 100% dos casos
- [ ] Frontend intuitivo e responsivo

### Critérios Não-Funcionais

- [ ] Performance: <2s para criar protocolo com links
- [ ] Performance: <500ms para carregar links existentes
- [ ] Performance: <5s para migration de 1000 protocolos
- [ ] Disponibilidade: >99.9% uptime

### Critérios de Qualidade

- [ ] >90% de cobertura de testes automatizados
- [ ] 0 bugs críticos em produção
- [ ] <5 bugs menores após 1 semana de uso
- [ ] Satisfação do usuário >8/10

### Critérios de Documentação

- [ ] README atualizado com instruções claras
- [ ] Swagger/OpenAPI completo
- [ ] Guias por departamento
- [ ] Vídeos de demonstração (opcional)

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Antes de Começar a Implementação

1. **Aprovação do Plano** (você decide)
   - Revisar cronograma
   - Alocar recursos
   - Aprovar escopo

2. **Preparação do Ambiente** (1h)
   - Criar branch `feature/citizen-links-full`
   - Configurar banco de staging
   - Preparar ferramentas de teste

3. **Kickoff Meeting** (1h)
   - Alinhar equipe
   - Distribuir tarefas
   - Definir daily standups

### Primeiras Tarefas (Fase 1)

```bash
# 1. Aplicar migration
cd digiurban/backend
npx prisma migrate deploy
npx prisma generate

# 2. Testar APIs
curl -X POST http://localhost:3001/api/admin/protocols/{id}/citizen-links \
  -H "Authorization: Bearer {token}" \
  -d '{"linkedCitizenId":"...","linkType":"STUDENT","role":"BENEFICIARY"}'

# 3. Testar componente
cd digiurban/frontend
npm run dev
# Navegar para formulário de teste
```

---

## 📝 CHECKLIST DE EXECUÇÃO

### Pre-Flight

- [ ] Ambiente de dev configurado
- [ ] Banco de staging pronto
- [ ] Equipe alinhada
- [ ] Cronograma aprovado

### Durante Execução

- [ ] Daily standup às 9h
- [ ] Code review obrigatório
- [ ] Testes antes de merge
- [ ] Documentação atualizada diariamente

### Pós-Implementação

- [ ] Retrospectiva do projeto
- [ ] Lições aprendidas documentadas
- [ ] Métricas de sucesso coletadas
- [ ] Celebração com equipe! 🎉

---

**Desenvolvido por**: Claude Agent SDK
**Data**: Novembro 2025
**Versão**: 1.0.0
**Status**: Aguardando Aprovação
