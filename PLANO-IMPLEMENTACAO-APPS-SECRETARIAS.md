# Plano de Implementação — Apps das Secretarias

> Data: 2026-07-16 · Documento irmão: [AUDITORIA-APPS-SECRETARIAS.md](AUDITORIA-APPS-SECRETARIAS.md)
> Escopo: consolidar os apps de Saúde (pilotos) e implantar apps nas demais 20 secretarias, **reaproveitando os blueprints extraídos dos pilotos** e sem invadir o território do Registry.

---

## 1. Princípios inegociáveis (aprendidos nos pilotos)

1. **App só quando há estado operacional próprio** (fila, estoque, agenda, frota, turmas, pagamentos, sigilo). Coleta+aprovação+consulta = Registry, não app. Régua na seção 6 da auditoria.
2. **Todo app nasce de protocolo**: tabela raiz com `protocolId String @unique` referenciando `ProtocolSimplified` + service de conversão no gancho de aprovação (padrão `protocol-to-tfd.service.ts` / `materializeOnApproval`). O cidadão continua entrando pelo catálogo de serviços.
3. **Multi-tenant desde a 1ª migration**: todo model novo com `tenantId String?` + `@@index([tenantId])`; **importar `prisma` de `src/lib/prisma.ts`** (NUNCA `new PrismaClient()`); nested create propaga `tenantId` explícito (`tryGetTenantId()`).
4. **Feature flag por secretaria**: registrar rotas com `requireFeature('<slug>')` (slug = pasta de `app/admin/secretarias/`).
5. **Convenções**: rotas `/api/apps/<secretaria>/<app>/<recurso-plural>` (sem duplicar singular/plural como no TFD); frontend em `app/admin/apps/<secretaria>/<app>/`; services em `src/services/<dominio>/`; validação Zod; erros `{ error: string }`; CSV com BOM.
6. **Aproveitar o que existe**: models/services órfãos e models de catálogo listados na auditoria são o ponto de partida — não recriar.
7. **Definition of Done por app**: schema+migration → service → rotas (+registro em `index.ts` com flag) → frontend → seed de demonstração → `tsc -p tsconfig.docker.json` verde → E2E mínimo (fluxo feliz) → smoke de isolamento de tenant.

---

## 2. Blueprints reutilizáveis (extraídos dos pilotos de Saúde)

Cada app novo é montado combinando estes 7 blueprints — o código dos pilotos é o gabarito:

| Blueprint | Gabarito no piloto | O que copiar |
|-----------|--------------------|--------------|
| **B1 Cadastros de fundação** | `saude-cadastros.routes.ts` (unidades, salas, turnos) + adapter de vínculos | CRUD de unidades físicas + vínculo de servidores via `EmployeeAssignment`/`TeamMember` (Sistema Unificado V2.0) |
| **B2 Fila/atendimento** | `routes/saude/fila-atendimento` + `escuta-inicial` + `triagem` | Fila em tempo real, status, chamada, encaminhamento entre etapas |
| **B3 Estoque/dispensação** | `saude-farmacia.routes.ts` | Item de catálogo + lote/validade + estoque por unidade + transferência com aprovação + alertas + dispensação vinculada a pessoa |
| **B4 Workflow multi-etapas + frota** | `saude-tfd.routes.ts` + `services/tfd/` | Solicitação (de protocolo) → pareceres por papel → aprovação → execução logística (veículo/motorista/passageiros) → prestação de contas |
| **B5 Agenda/reserva** | `ConfiguracaoAgenda`, `AgendaMedica`, salas/turnos | Grade de horários com capacidade, indisponibilidades, conflitos |
| **B6 Turmas/inscrições** | `InscricaoMatricula` → `Matricula` → `Turma` (models prontos) | Inscrição → deferimento → alocação em turma com vagas → frequência |
| **B7 Casos sigilosos/prontuário** | `ConsultaMedica`/prontuário + timeline | Registro longitudinal por pessoa, acesso restrito por papel, trilha de auditoria (`AuditLog`), anexos |

---

## 3. FASE 0 — Consolidação dos apps de Saúde (pré-requisito para replicar)

### 0.1 Correções imediatas (dívidas, ~1 sprint)
- [ ] Trocar `new PrismaClient()` por `import { prisma } from '../lib/prisma'` em: `saude-cadastros.routes.ts`, `saude-unified-adapter.routes.ts`, `secretarias-saude.ts`, `secretarias-educacao.ts`, `secretarias-assistencia-social.ts`.
- [ ] Remover `src/_deprecated/atendimento/` (10 arquivos).
- [ ] Farmácia: remover/atender o link `Ações Rápidas → relatorios` (hoje 404).
- [ ] Consolidar `AlergiasCidadao`/`ComorbidadesCidadao` vs `AlergiaReacao`/`ProblemaCondicao` (decidir um par e migrar).

### 0.2 Farmácia — completar a UI (backend já pronto, ~1–2 sprints)
- [ ] Página **Lotes & Validade**: listagem por medicamento/unidade, próximos ao vencimento, vencidos, baixa de lote (`/lote/*`).
- [ ] Página **Transferências**: solicitar → aprovar → confirmar/recusar entre unidades (`/transferencia/*`).
- [ ] Página **Alertas**: ativos, visualizar/resolver, verificação automática (`/alerta*`).
- [ ] Página **Relatórios**: estatísticas de estoque + auditoria de dispensação (`/estoque/estatisticas`, `/dispensacao/relatorio/auditoria`, `/dispensacao/estatisticas`).
- [ ] Página **Catálogo de Medicamentos** (CRUD de `Medicamento`).
- [ ] Dispensação: aba "Prescrições pendentes" consumindo `/consulta-medica/prescricoes/pendentes` + `/dispensacao/prescricao/:id`.

### 0.3 Atendimento — fechar o ciclo e decidir órfãos (~2–3 sprints)
- [ ] **Agendamento de consultas ponta a ponta**: rotas completas sobre `AgendaMedica`/`ConsultaAgendada`/`IndisponibilidadeAgenda` (service `agenda-medica/` já existe), UI de marcação/remarcação, e serviço do catálogo "Agendamento de Consulta Médica" convertendo protocolo→`ConsultaAgendada` (padrão B4-lite).
- [ ] **Painel de chamadas** (`ChamadaPainel`): rota + página de TV (rota pública por token de unidade) — chamada do próximo da fila já existe no B2.
- [ ] **Imunização** (`ImunizacaoCidadao`): registro de doses na consulta/triagem + carteira digital do cidadão (o catálogo já vende "Declaração de Vacinação").
- [ ] **Decidir (implementar OU remover do schema)**: Odontologia (`AtendimentoOdontologico`, `ProcedimentoOdonto`), Pré-natal (3 models), `VisitaDomiciliar` (ACS), `AnexoProntuario`, `ConfiguracaoESUS`/`TransmissaoESUS`. Recomendação: implementar odonto e visita domiciliar (alta demanda municipal, encaixam em B2/B7); pré-natal em seguida; e-SUS só com demanda real de transmissão ao MS — se não houver, remover os 2 models.
- [ ] TFD: padronizar rotas duplicadas (manter plural, alias com deprecation) — sem quebra de frontend.

**Critério de saída da Fase 0:** farmácia sem gap de UI, agendamento funcionando, zero models órfãos "sem decisão" no domínio saúde.

---

## 4. FASE 1 — Destravar o trabalho já feito (P1)

### 1A. Educação — App Gestão Escolar + App Transporte Escolar (~3–4 sprints)
**Backend ~60% pronto (órfão).**
- [ ] Rotas `/api/apps/educacao/cadastros`: `UnidadeEducacao` (B1; service pronto), turmas (`Turma`), professores (`Professor`/`EducationProfessionalData`, vínculos via adapter — copiar `saude-unified-adapter`).
- [ ] Rotas `/api/apps/educacao/matriculas` (B6; `matricula.service.ts` pronto): inscrição (de protocolo "Matrícula Escolar"/"Inscrição em Creche") → análise → deferimento → alocação em turma com controle de vagas → transferências → documentos (declaração/histórico via templates de documento).
- [ ] Rotas `/api/apps/educacao/transporte` (B4-logística; `transporte-escolar.service.ts` pronto): `VeiculoEscolar`, `RotaEscolar`, `AlunoRota` — rotas, pontos, alocação de alunos, integração com credenciamento de motoristas.
- [ ] Frontend `app/admin/apps/educacao/{cadastros,matriculas,transporte}` — espelhar a navegação de `apps/saude` (HealthAppHeader → EducacaoAppHeader).
- [ ] Conversor protocolo→inscrição no gancho de aprovação; flag `requireFeature('educacao')`.
- [ ] Substituir dashboard read-only de `secretarias-educacao.ts` por stats reais dos novos endpoints.

### 1B. Assistência Social — App CRAS/CadÚnico + Benefícios (~3–4 sprints)
**Backend ~60% pronto (órfão).**
- [ ] `/api/apps/assistencia-social/cadastros`: `UnidadeCRAS` (B1), profissionais (`SocialAssistanceProfessionalData` + adapter de vínculos).
- [ ] `/api/apps/assistencia-social/familias` (B7): `CadUnicoFamilia` + `MembroFamilia` (services prontos) — ficha da família, composição, renda, atualização cadastral, timeline de atendimentos.
- [ ] `/api/apps/assistencia-social/programas` (B6+pagamentos): `ProgramaSocial`, `InscricaoProgramaSocial` → deferimento → `AcompanhamentoBeneficio` → `PagamentoBeneficio` (recorrência, folha de pagamento do benefício, comprovantes).
- [ ] Visitas domiciliares: reutilizar o model `VisitaDomiciliar` da saúde OU criar `VisitaSocial` (decidir na Fase 0.3 para não duplicar).
- [ ] Frontend `app/admin/apps/assistencia-social/{cadastros,familias,programas,beneficios}`.
- [ ] Sigilo: acesso à ficha da família restrito a papéis da secretaria (B7 + AuditLog).

### 1C. Agricultura — construir o backend que a UI espera (~2–3 sprints)
**Frontend pronto; contrato definido por `use-agricultura-api.ts`.**
- [ ] Models novos: `ProdutorRural` (dedup por CPF, ligação com `Citizen`), `PropriedadeRural` (geo), `AtendimentoTecnicoRural` (visitas/assistência — B7-lite), `SolicitacaoMecanizacao` + agenda de `MaquinaAgricola` (B5 sobre model existente), `EstoqueSemente`/`DistribuicaoSemente` (B3-lite).
- [ ] Rotas `/api/agricultura/*` exatamente no contrato do hook (produtores, propriedades, estoque-sementes, distribuicoes-sementes, tecnicos, solicitacoes-assistencia) + registro em `index.ts` com `requireFeature('agricultura')`.
- [ ] Conversores: protocolo "Cadastro de Produtor Rural"→`ProdutorRural`, "Solicitação de Máquinas"→`SolicitacaoMecanizacao`, "Distribuição de Sementes/Mudas"→dispensação.
- [ ] Atenção: manter a **etiqueta** "Produtor Rural" (CitizenCategory) e o Registry funcionando em paralelo — o app referencia o `EntityRecord`/protocolo, não o substitui.

### 1D. Serviços Públicos — App Ordens de Serviço (~3 sprints)
**Maior volume operacional; nada existe hoje.**
- [ ] Models: `OrdemServico` (protocolId, tipo, prioridade, geo, fotos, equipe, materiais, SLA), `EquipeCampo` (ou reuso de `Team`), `ApontamentoOS` (execução, horas, fotos antes/depois).
- [ ] Fluxo (B2+B4): protocolo aprovado → OS criada → triagem/priorização → despacho para equipe → execução com evidências → conclusão retroalimentando o protocolo (status CONCLUIDO).
- [ ] Frontend: painel de despacho (fila por bairro/tipo), **mapa de calor** (Leaflet, padrão RecordsMap), app da equipe (mobile-first, PWA já existe).
- [ ] KPI: tempo médio por tipo, backlog por região.

---

## 5. FASE 2 — Apps de médio porte (P2)

Ordem sugerida (cada um ~2–3 sprints, sempre com blueprint indicado):

| App | Secretaria(s) | Blueprints | Núcleo |
|-----|---------------|-----------|--------|
| **Licenciamento Urbano** (único app, 2 secretarias) | Obras Públicas + Planejamento Urbano | B4 | `ProcessoLicenciamento` (protocolId, tipo: alvará/obra/habite-se/viabilidade), etapas com pareceres por papel (análise projeto, vistoria técnica), emissão de licença com validade, certidões via DocumentTemplate. Aproveita `TipoObraServico` |
| **Licenciamento & Fiscalização Ambiental** | Meio Ambiente | B4 + mapa | `ProcessoAmbiental` (licenças com condicionantes/validade/renovação), `VistoriaAmbiental`, `AutoInfracao`; denúncias georreferenciadas viram fiscalização. Aproveita `ProgramaAmbiental`, `EspecieArvore` (podas) |
| **Programas Habitacionais** | Habitação | B6 + pagamentos | Inscrição→pontuação (critérios configuráveis)→fila pública→seleção/sorteio→contrato/termo; unidades de `ConjuntoHabitacional`; aluguel social com `PagamentoBeneficio`-like |
| **Ocorrências & Áreas de Risco** | Defesa Civil | B2 + mapa | Ocorrência georreferenciada→vistoria→laudo/interdição; `Abrigo` (capacidade/ocupação), `FamiliaAtingida` (ponte com CadÚnico da Fase 1B) |
| **Rede de Atendimento à Mulher** | Políticas p/ Mulheres | B7 (sigilo máximo) | `CasoAtendimento` (acesso só à equipe do caso, AuditLog em toda leitura), acolhimentos, encaminhamentos (medida protetiva, abrigo), plano de acompanhamento. PII reforçada; sem export CSV |
| **Escolinhas & Espaços Esportivos** | Esportes | B5 + B6 + B3-lite | Turmas de escolinhas com frequência; reserva de espaços (`EspacoPublico`/`ParquePraca` + B5); competições (inscrições/tabelas); empréstimo de material |

---

## 6. FASE 3 — Apps leves (P3)

| App | Secretaria | Blueprints | Núcleo |
|-----|-----------|-----------|--------|
| **Espaços & Oficinas Culturais** | Cultura | B5 + B6 + B4-lite | Reserva de espaços, oficinas com turmas, editais/projetos com pareceres, empréstimo de equipamento. Aproveita `TipoAtividadeCultural` |
| **Credenciamentos & Vistorias** | Transportes/Trânsito | B4-lite + carteirinha | Credencial (táxi/mototáxi/escolar) com validade/renovação/ponto, vistoria veicular anual, defesa de autuação (parecer JARI) |
| **Carteiras & Gratuidades** | Mobilidade Urbana | Carteirinha (gancho já previsto no módulo Dados) | Emissão/renovação/2ª via de cartões (estudante, idoso, PcD), foto, QR de validação (reuso de `public-validation.routes`) |
| **Balcão de Empregos & Qualificação** | Desenvolvimento Econômico | B6 + matching | `Vaga` × `CandidatoVaga` (ponte com Citizen), encaminhamentos, cursos (`CursoProfissionalizante` + B6) |
| **Ocorrências & Patrulhamento** | Segurança Pública | B2 + mapa | Ocorrências (`TipoOcorrencia`), viaturas (`ViaturaSeguranca`), rondas, pontos críticos/câmeras em mapa |
| **Cadastur Municipal** | Turismo | Carteirinha + cadastros | Credenciamento de guias (`GuiaTuristico`) e estabelecimentos (`EstabelecimentoTuristico`) com carteirinha/selo; o resto fica no Registry |

**Sem app (decisão explícita):**
- **Administração** — Ouvidoria/SIC/protocolos já cobertos por ProtocolSimplified+Registry; `/admin/atendimento-presencial` e `/admin/chamados` existem.
- **Finanças** — tributário exige sistema fiscal especializado (integração externa futura via `/api/integrations`); requerimentos ficam no Registry, certidões nos templates.
- **Tecnologia & Inovação** — service desk já coberto por Chamados (`AdminTicket`).

---

## 7. Cronograma-resumo e dependências

```
Fase 0 (Saúde)          ██████ 3–5 sprints — pré-requisito: nenhum
Fase 1A Educação        ████ 3–4 sprints ─┐ podem rodar em paralelo
Fase 1B Assist. Social  ████ 3–4 sprints ─┤ (times distintos), após 0.1
Fase 1C Agricultura     ███ 2–3 sprints  ─┤
Fase 1D Serv. Públicos  ███ 3 sprints    ─┘
Fase 2 (6 apps)         ████████ ~12–18 sprints acumulados
Fase 3 (6 apps)         ██████ ~8–12 sprints acumulados
```

Dependências duras:
- 0.1 (tenant fix) antes de qualquer app novo (o padrão errado não pode ser copiado).
- 1B `FamiliaAtingida` (Defesa Civil) depende do CadÚnico de 1B.
- Licenciamento Urbano é UM app para duas secretarias — alinhar donos antes de começar.
- Visita domiciliar: decisão única (0.3) para Saúde e Assistência Social.

---

## 8. Checklist padrão por app (copiar em cada issue)

```
[ ] Models no schema.prisma (tenantId String? + @@index([tenantId]) + tabela raiz com protocolId @unique quando nasce de protocolo)
[ ] Migration validada em Postgres efêmero (padrão Registry F0)
[ ] Service em src/services/<dominio>/ (lógica fora das rotas) usando prisma de lib/prisma
[ ] Rotas /api/apps/<secretaria>/<app>/* registradas em index.ts via loadRoute + requireFeature('<slug>')
[ ] Conversor protocolo→app no gancho de aprovação (NÃO-FATAL, padrão materializeOnApproval)
[ ] Frontend em app/admin/apps/<secretaria>/<app>/ (header do app, navegação espelhando apps/saude)
[ ] Link de entrada na página da secretaria (app ≠ módulo: entra na seção de apps, não nos módulos Protocolos+Dados)
[ ] Seed de demonstração + serviço(s) do catálogo apontando para o app
[ ] tsc -p tsconfig.docker.json verde; type-check do frontend verde
[ ] E2E fluxo feliz + smoke tenant isolation (2 tenants)
[ ] Sincronizar schema do Messages Server SE tocar Conversation/Message/FlowDefinition (normalmente não toca)
[ ] Flag ativada por tenant no .env/features após validação
```

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| Replicar o bypass de tenant dos arquivos antigos | Fase 0.1 primeiro; lint/grep de CI proibindo `new PrismaClient()` em `src/routes/` e `src/services/` |
| App duplicar o que o Registry faz (retrabalho da reforma de módulos) | Régua da auditoria §6 aplicada no kickoff de cada app; app referencia protocolo/EntityRecord, nunca reimplementa listagem genérica |
| Escopo explodir (21 secretarias × sonhos) | Apps P3 só entram após P0–P2 estáveis em produção; "sem app" é decisão válida e registrada |
| PII sensível (Mulheres, CadÚnico, prontuário) | Blueprint B7 obrigatório: acesso por papel, AuditLog de leitura, sem export, flags isPII |
| Models órfãos acumulando de novo | Regra: model novo só entra no schema junto com rota+UI na mesma fase; órfãos atuais têm prazo de decisão na Fase 0.3 |
