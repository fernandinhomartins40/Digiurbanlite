# Auditoria dos Apps do DigiUrban — 2026-10-08

Análise de ponta a ponta dos 17 apps (tela → backend → banco → pedido do cidadão).
Complementa `AUDITORIA-APPS-SECRETARIAS.md` (2026-07-16) e `PLANO-IMPLEMENTACAO-APPS-SECRETARIAS.md`.

## Como foi verificado

1. **Telas × backend**: script que lista as 1.287 rotas do backend e confere cada chamada das telas dos apps
   (`app/admin/apps/**`, `lib/api/*`). Resultado: todas as chamadas existem — nenhuma tela chama rota inexistente.
2. **Isolamento por município**: nenhum app usa `new PrismaClient()` (todos passam pela extension de tenant).
3. **Permissão**: todos os apps exigem equipe da secretaria + ADMIN (`requireDepartmentAccess`) e o módulo ligado no plano.
4. **Pedido → app**: cruzamento dos ~404 serviços do catálogo com as "portas de entrada" de cada app.
5. **App → pedido**: quais apps avisam/encerram o pedido do cidadão quando o caso anda.

## Situação por app

| App | Secretaria | Recebe pedido do catálogo? | Devolve ao pedido? | Situação |
|---|---|---|---|---|
| TFD | Saúde | **Não recebia** → corrigido | Sim | Completo |
| Atendimento de Saúde (PEC) | Saúde | Não (sem porta) | — | Núcleo ok; **triagem e "chamar próximo" quebrados** → corrigidos |
| Farmácia | Saúde | Não (sem porta) | — | Completo no balcão |
| Cadastros da Saúde | Saúde | — | — | Completo |
| Educação (unidades, turmas, matrículas, transporte) | Educação | **Não** (matrícula do portal fica na fila) | Não | Funciona só pelo balcão |
| Assistência Social (CRAS, famílias, programas) | Assist. Social | **Não** (benefício/cesta fica na fila) | Não | Funciona só pelo balcão |
| Agricultura | Agricultura | Sim | **Não devolvia** → corrigido | Mecanização ainda é tela "em desenvolvimento" |
| Ordens de Serviço | Serviços Públicos | **Só 2 de 18 serviços** → corrigido (18) | Sim | Completo |
| Licenciamento Urbano | Obras + Planejamento | Sim (alvará de funcionamento **ia para app que a Desenv. Econômico não abria**) → corrigido | Sim | Completo |
| Licenciamento & Fiscalização Ambiental | Meio Ambiente | **Só 2 de 10** → corrigido (10) | Sim | Completo |
| Programas Habitacionais | Habitação | Sim | Sim | Completo |
| Ocorrências & Áreas de Risco | Defesa Civil | Sim | Sim | Completo |
| Rede de Atendimento à Mulher | Políticas p/ Mulheres | Sim | Sim | Completo (sigilo + auditoria) |
| Escolinhas & Espaços Esportivos | Esportes | Sim | Sim | Completo |
| Espaços & Oficinas Culturais | Cultura | Sim (oficina **da Assistência Social caía na Cultura**) → corrigido | Sim | Completo |
| Credenciamentos & Vistorias | Transportes e Trânsito | Sim (renovação e troca de ponto ficam na fila) | Sim | Completo |
| Carteiras & Gratuidades | Mobilidade Urbana | Sim | Sim | Completo (QR público) |
| Segurança Escolar | Educação | — | — | Desligada; a tela fica em branco se ligar |

## Corrigido nesta rodada (Fase 0 — "os apps recebem e devolvem de verdade")

1. **Pedidos que não chegavam aos apps.** O catálogo só ligava serviço a app quando o código técnico era igual ao
   código da porta do app. Resultado: o pedido de **TFD do portal nunca chegava ao app de TFD**; capina, bueiro,
   boca de lobo, poda, varrição, calçamento etc. ficavam fora das Ordens de Serviço; licenças e autorizações
   ambientais e denúncias de queimada/barulho/descarte ficavam fora do app ambiental.
   Agora cada item do catálogo diz para qual app vai (`appAction` em `catalog/services/*.seed.ts`).
   - Serviços do catálogo que entram em app: 50 (um deles no app errado) → 74.
   - Municípios existentes: o botão **"Atualizar catálogo de serviços"** (Super-admin › município) liga o destino
     nos serviços que o município não editou, e devolve para a fila serviço que apontava para porta que não existe mais.
2. **Formulário do TFD** do catálogo alinhado ao app (especialidade, procedimento, justificativa, médico, cidade/UF
   e hospital de destino, data da consulta). O conversor aceita também os nomes antigos (pedidos já feitos).
3. **Triagem de enfermagem** (Atendimento de Saúde): as duas telas mandavam um profissional fixo
   (`'profissional-default'`) que não existe → **toda triagem falhava ao salvar**. Agora o servidor grava quem está logado.
4. **"Chamar próximo"** da fila: a tela mandava o nome do consultório no lugar do profissional → nunca achava
   paciente. Agora chama para o profissional logado, no consultório escolhido.
5. **Agricultura**: concluir a visita técnica não encerrava o pedido do cidadão (ficava aberto para sempre).
   Agora: agendar visita → pedido "em andamento"; concluir → pedido concluído com as recomendações; cancelar → encerrado.
6. **Alvará de Funcionamento** (Desenvolvimento Econômico) ia para o Licenciamento, que só Obras/Planejamento abriam.
   A Desenvolvimento Econômico agora também abre o Licenciamento.
7. **"Inscrição em Grupo ou Oficina Social"** (Assistência Social) virava matrícula no app de **Cultura**. Agora fica
   na fila da Assistência Social.
8. **Trava automática** (`__tests__/unit/app-catalog.test.ts`): todo serviço que vai para app precisa apontar para
   porta que existe, de app da mesma secretaria; todo app com porta recebe ao menos um serviço; o TFD pede o que o app usa.

## O que falta para "todos funcionarem de verdade" (próximas fases)

### Fase 1 — FEITA (2026-10-08): pedido do portal entrando nos apps que só funcionavam no balcão

| Pedido do catálogo | Vira no app | A equipe decide em | O que volta ao pedido |
|---|---|---|---|
| Matrícula Escolar | inscrição de matrícula (aluno achado na família do responsável; sem cadastro entra com o nome) | Educação › Matrículas | documentos conferidos/pendentes, vaga reservada, lista de espera, matrícula confirmada (conclui), recusada (conclui) |
| Transporte Escolar | pedido de vaga (fila nova) | Educação › Transporte › aba "Pedidos do portal" | rota, horário e ponto (conclui) ou motivo da recusa |
| Benefício Social, Cesta Básica, Auxílio Emergencial, Benefício Eventual | inscrição em programa (programa achado pelo nome; família do CadÚnico se houver) | Assistência Social › Benefícios | parecer favorável, benefício liberado (conclui), indeferido (conclui) |
| Renovação de Credenciamento, Transferência de Ponto de Táxi | renovação/troca de ponto (fila nova, credencial achada por número, placa ou titular) | Trânsito › aba "Renovações e pontos" | nova validade / novo ponto (conclui) ou motivo |
| Agendamento de Consulta Médica e Odontológica | pedido de consulta (fila nova) | Saúde › Agendamentos | dia, hora, profissional e unidade (conclui) ou motivo |
| Solicitação de Medicamentos e de Alto Custo | pedido de remédio (fila nova) | Farmácia (painel) → "Entregar" abre a dispensação pronta | em falta (avisa), entregue com baixa no estoque (conclui), não atendido |

Peças: `services/apps/portal-requests.service.ts` (pedido → fila), `portal-queues.service.ts` (decisões),
`noteProtocolFromApp()` (recado ao cidadão no pedido + aviso no portal, sem e-mail), telas em
`frontend/components/apps/portal-requests/`. Migração `20261011090000_apps_portal_requests`.
Prova: `npm run smoke:apps` (25 conferências num município de teste; requer banco e Redis).

Defeitos antigos achados e corrigidos no caminho:
- **Agenda da Saúde**: toda consulta era gravada às 23:59 (a conferência do dia alterava a data) e, com o servidor em UTC,
  o horário ocupado continuava "livre" e apareceria 3 h adiantado. Agora a agenda trabalha no horário de Brasília
  (`agenda-medica/brasilia-time.ts`, com testes).
- **Assistência Social**: depois do "Parecer favorável" a tela tratava o benefício como ativo e o passo "Conceder
  benefício" nunca aparecia. Agora: parecer favorável → aguardando concessão → conceder → ativo.
- **Matrícula**: a criação mandava ao banco campos que a tabela não tem (podia falhar com observações/anexos).

Ainda fora (caso raro, tratar no balcão): pedido de matrícula feito em nome do próprio dependente; assistência técnica
rural de quem ainda não é produtor cadastrado (a conversão é adiada e não é refeita sozinha).

### Fase 2 — Completar o Atendimento de Saúde
Modelos já no banco, sem tela nem rota: atendimento **odontológico**, **pré-natal**, **visita domiciliar** (ACS),
anexos do prontuário; atividades coletivas tem rota mas não tem tela; integração **e-SUS/LEDI** tem código pronto
sem rota (`src/apps/saude/integracao`). `AlergiasCidadao`/`ComorbidadesCidadao` duplicam alergias/problemas — remover.

### Fase 3 — Apps que ainda não existem
- **Agricultura › Mecanização** (patrulha agrícola: pedido de hora-máquina, agenda das máquinas, execução) — o modelo
  `MaquinaAgricola` existe sem uso; a tela é "em desenvolvimento".
- **Desenvolvimento Econômico**: balcão de empregos (vagas × currículos) e cadastro de MEI/feirantes.
- **Segurança Pública**: ocorrências com mapa (mesmo padrão da Defesa Civil).
- **Turismo**: cadastro municipal de prestadores (Cadastur municipal) e agenda de eventos.
- **Segurança Escolar** (biometria): desligada; decidir se entra no produto antes de fazer a tela.

### Fase 4 — Qualidade
- Testes das regras de cada app (hoje só o catálogo e o roteamento têm teste).
- Smoke de ponta a ponta por app: pedido no portal → caso no app → conclusão → aviso ao cidadão (2 municípios).
- Mensagens de erro: várias rotas da Saúde respondem só "Erro ao …" (500) — devolver o motivo em português.

## Depois do deploy
Rodar **"Atualizar catálogo de serviços"** em cada município (Super-admin › município) para os serviços existentes
passarem a mandar o pedido para o app certo e receberem o novo formulário do TFD.
