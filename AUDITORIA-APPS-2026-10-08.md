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

### Fase 2 — FEITA: Atendimento de Saúde completo (menos e-SUS)

- **Odontologia** (`/admin/apps/saude/atendimento/odonto`): fila do dentista, desenho da boca (odontograma), índice
  CPO-D calculado, procedimentos, plano de tratamento e histórico.
- **Pré-natal** (`.../pre-natal`): idade gestacional e data provável do parto calculadas, consultas, exames com
  resultado, risco e desfecho; painel com alto risco, parto em 30 dias e gestantes sem consulta há 30+ dias.
- **Visitas domiciliares** (`.../visitas`): registro do agente de saúde (com localização opcional) e produção por agente.
- **Atividades coletivas** (`.../atividades-coletivas`): a rota existia sem tela; agora tem tela com lista de presença.
  Corrigido vazamento: a lista devolvia o cadastro inteiro (com senha cifrada) do profissional e do cidadão.
- Backend em `services/saude/cuidado.service.ts` + `routes/saude/cuidado.routes.ts`; regras em `saude-cuidado.test.ts`.

**Não feito — e-SUS/LEDI.** O código em `src/apps/saude/` é de outro tipo de projeto (NestJS), não é compilado aqui,
guarda a senha da API de um jeito que impede usá-la e "serializa" a ficha como JSON em vez do formato oficial (Thrift).
Integração de verdade exige as definições LEDI oficiais e um PEC e-SUS de teste para validar o envio — sem isso não dá
para provar que funciona. Recomendação: apagar esse código morto e abrir um projeto próprio quando houver um PEC de teste.

**Não feito — outros.** Anexos do prontuário (precisa de envio de arquivo com regra de acesso clínico);
`AlergiasCidadao`/`ComorbidadesCidadao` continuam no banco sem uso (apagar tabela é irreversível — decidir antes).

### Fase 3 — FEITA: apps que não existiam

| App | Secretaria | O que faz | Tela |
|---|---|---|---|
| Mecanização | Agricultura | pedido de máquina → agenda (uma máquina por dia) → execução → conclusão com horas e valor | `/admin/apps/agricultura/mecanizacao` (era "em desenvolvimento") |
| Balcão de Empregos | Desenvolvimento Econômico | currículos × vagas, sugestão de candidatos por nota explicável (sem IA), encaminhamento e resultado | `/admin/apps/desenvolvimento-economico` |
| Ocorrências de Segurança | Segurança Pública | fila por urgência, mapa, denúncia anônima sem guardar quem fez, resposta ao cidadão | `/admin/apps/seguranca-publica` |
| Cadastro do Turismo | Turismo | prestadores com número e validade, guia da cidade, calendário de eventos | `/admin/apps/turismo` |

Código: `services/{agricultura/mecanizacao,emprego,seguranca,turismo}`, rotas em `routes/fase3/`, migração
`20261011150000_apps_fase3`, regras em `apps-fase3.test.ts`. Entram pelo portal 17 serviços do catálogo a mais.

**Não feito — Segurança Escolar** (biometria na entrada da escola): segue desligada. É decisão de produto (dado
biométrico de criança) antes de ser trabalho de tela.

### Fase 4 — FEITA: qualidade

- **Dois roteiros de ponta a ponta no banco** (município de teste criado e apagado):
  `npm run smoke:apps` (64 conferências: Fases 1 a 3) e `npm run smoke:apps:antigos` (40 conferências: os 12 apps
  que já existiam). Precisam de Postgres e Redis; não rodam no CI.
- **Cancelar no app encerrava nada**: 16 formas de cancelar um caso (ordem de serviço, licenciamento, ambiental,
  habitação, defesa civil, esportes, cultura, trânsito, mobilidade, TFD) deixavam o pedido do cidadão aberto para
  sempre. Agora todas encerram o pedido com o motivo.
- **Início da análise aparece no pedido**: nos apps antigos o pedido ficava em "recebido" até a decisão final.
  Agora "em análise / equipe acionada / vistoria agendada" move o pedido para "em andamento".
- **Erros da Saúde explicam o motivo** (`utils/explain-error.ts`): 53 respostas "Erro ao ..." passam a dizer o que
  houve (regra do serviço, registro repetido, campo faltando) sem mostrar detalhe interno do banco.
- Testes automáticos: de 145 para 178.

## O que ainda falta (depois das 4 fases)

1. **Ver as telas no navegador.** Todas compilam e o backend foi provado no banco, mas nenhuma tela nova foi
   clicada de verdade. Conferir: matrículas, transporte escolar, benefícios, trânsito (aba nova), agendamentos,
   farmácia, odontologia, pré-natal, visitas, atividades coletivas, mecanização, empregos, segurança, turismo.
2. **e-SUS**, anexos do prontuário, tabelas duplicadas de alergia/comorbidade, Segurança Escolar (ver acima).
3. Os roteiros `smoke:apps*` não rodam no CI (precisam de banco) — rodar à mão antes de mudanças grandes nos apps.

## Depois do deploy
Rodar **"Atualizar catálogo de serviços"** em cada município (Super-admin › município) para os serviços existentes
passarem a mandar o pedido para o app certo (inclusive os apps novos) e receberem os formulários novos de TFD e matrícula.

## Serviços novos e os apps (2026-10-09)

**Problema:** serviço criado por sugestão nunca ia para app (as ~940 sugestões não dizem destino) e, mesmo apontado
para o app, chegava VAZIO: o app lia os campos pelo nome interno (`tipoMaquina`), mas o serviço manual tem `campo_1728…`
e a sugestão tem `tipo_maquina`.

**Feito:**
- Contrato de campos de cada uma das ~85 portas de app (`config/app-field-contracts.ts`): o app acha o dado pelo
  título do campo ("Nome da criança" → aluno), pelo perfil do cidadão (telefone, nascimento, endereço quando o caso é a
  casa) ou pelo nome do serviço ("Oficina de Violão"). O que não reconhece chega em "Outros dados" — nada se perde.
- Sugestão de app pelo nome do serviço, sem IA. Medido contra o catálogo: 107 serviços que vão para app → 104 no app e
  porta certos, 3 no app certo com outra porta, 0 em app errado; documentos/declarações/2ª via ficam na fila.
  Das 946 sugestões, ~120 passam a ir para o app certo.
- Assistente de serviço (criar e editar), passo "Depois do pedido": num serviço novo já escolhe o app sugerido e diz
  por quê; mostra o que o app vai receber, deixa trocar o campo e acrescenta com um clique os campos que faltam.
- Aba Configurar da secretaria: avisa serviço que já existe e "pode ir para o app X" ou "o app não recebe: …".
- Catálogo: as 4 licenças ambientais não perguntavam o endereço do local — agora perguntam. Os 104 serviços do catálogo
  que vão para app mandam todos os dados obrigatórios (trava em teste).

### Revisão das ~946 sugestões, secretaria por secretaria (2026-10-09)

Primeira medição só olhou o total. Revisando uma a uma as que ficavam SEM app nas secretarias com app:
- **Defeito:** sugestões de Transportes e Trânsito gravavam o código `TRANSPORTE_TRANSITO` (a secretaria é
  `TRANSPORTES_TRANSITO`) — corrigido nas 43.
- **Defeito:** palavras com hífen ("Habite-se", "Cata-treco") nunca batiam — o leitor agora limpa as duas pontas.
- Palavras faltando em quase todas as secretarias (Saúde: exames, vacinação, fisioterapia, mamografia…; Planejamento:
  loteamento, desmembramento, tapume…; Turismo: hospedagem, camping, trilha…; Habitação: sorteio, kit construção…).
- Portas novas: **Esportes — outras modalidades** (futsal, karatê, xadrez, yoga, hidroginástica… viram matrícula com
  modalidade "OUTRA") e **Saúde — cadastro de gestante** (abre o pré-natal com a DUM e conclui o pedido).
- Transferência de escola entra na Matrícula marcada como transferência.
- Precisão revisada nas 300: palestra/orientação/isenção de taxa ficam na fila; portas certas para passe livre
  estudantil/idoso, vistoria de táxi, grupos de caminhada/ciclismo.
- Resultado: sugestões indo para app **126 → 300**. Catálogo: **129** serviços indo para app (eram 104), todos com os
  dados que o app precisa (trava em teste). Catálogo ganhou "Data de nascimento do aluno" na Transferência Escolar e
  "Turma pretendida" na Inscrição em Creche.
- Relatório por secretaria: `npx tsx scripts/report-sugestoes-apps.ts resumo|com|sem`.

**Ficam na fila de propósito:** EJA (o aluno é o próprio adulto; o app de matrícula trabalha com criança +
responsável), Habite-se do catálogo (não tem formulário nem endereço), e as secretarias sem app (Administração,
Finanças, Tecnologia). **Decisão pendente:** Obras Públicas tem ~20 sugestões de manutenção (tapa-buraco, drenagem,
bueiro, iluminação) e não tem app de Ordens de Serviço — o app hoje é só de Serviços Públicos.
