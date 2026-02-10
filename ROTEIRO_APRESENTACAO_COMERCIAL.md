# DigiUrban - Roteiro de Apresentacao Comercial

## Como usar este documento

Este roteiro esta organizado em blocos. Cada bloco e uma "parada" da apresentacao.
O tempo total sugerido e de 30-45 minutos, mas adapte conforme o publico.

---

## BLOCO 1 - ABERTURA (3 minutos)

### O Problema

"Toda prefeitura enfrenta os mesmos desafios:

- O cidadao precisa ir presencialmente a prefeitura para solicitar qualquer servico
- O servidor perde horas com papelada, planilhas e controle manual de protocolos
- O prefeito nao tem visao em tempo real do que esta acontecendo na gestao
- Departamentos trabalham em silos, sem comunicacao integrada
- Nao ha metricas de desempenho, SLA ou satisfacao do cidadao

O DigiUrban resolve tudo isso em uma unica plataforma."

### A Proposta de Valor (frase-chave)

**"DigiUrban e a plataforma completa de gestao publica digital que conecta cidadaos, servidores e gestores em tempo real - do protocolo ao relatorio, da solicitacao a avaliacao."**

---

## BLOCO 2 - VISAO GERAL DA PLATAFORMA (5 minutos)

### Os 3 Portais

Explique que o DigiUrban tem 3 portais integrados, cada um para um publico:

**1. Portal do Cidadao (Mobile-first / PWA)**
- Acesso 24/7 pelo celular, sem precisar instalar app (funciona como app via PWA)
- O cidadao solicita servicos, acompanha protocolos, envia documentos e avalia o atendimento
- Chatbot inteligente (DigiBot) que guia o cidadao passo a passo

**2. Painel Administrativo (Desktop)**
- Onde os servidores da prefeitura trabalham no dia a dia
- Gerenciam protocolos, atendem cidadaos, geram documentos e relatorios
- Cada secretaria tem seu painel dedicado com metricas proprias

**3. Painel Super Admin (Gestao da Plataforma)**
- Para nos, como fornecedores, gerenciarmos todos os municipios clientes
- Controle de billing, planos, monitoramento e configuracoes globais
- Modelo SaaS multi-tenant (cada municipio e um tenant isolado)

---

## BLOCO 3 - JORNADA DO CIDADAO (8 minutos)

**Dica: Mostre a tela do celular ou screenshots enquanto narra cada passo.**

### Cenario: "Dona Maria precisa tapar um buraco na rua dela"

**Passo 1 - Cadastro e Login**
- Dona Maria acessa pelo celular (link da prefeitura ou QR code)
- Faz cadastro com CPF, nome, email e telefone
- Recebe confirmacao e ja esta dentro do sistema

**Passo 2 - Solicitar Servico**
- Abre o DigiBot (chatbot inteligente) ou o catalogo de servicos
- Busca "buraco na rua" - o sistema encontra o servico "Tapa-buraco"
- Ve a descricao do servico e o prazo estimado (ex: 15 dias uteis)
- Preenche a descricao do problema
- Tira foto do buraco e envia pelo celular (upload de ate 5 documentos)
- Marca a localizacao no mapa (geolocalizacao integrada)
- Confirma e recebe o numero do protocolo: **PROT-2026-000123**

**Passo 3 - Acompanhamento**
- A qualquer momento, consulta o status do protocolo
- Ve o historico: "Protocolo vinculado ao Departamento de Obras"
- Recebe notificacao push quando o status muda
- Pode enviar comentarios adicionais ao servidor responsavel

**Passo 4 - Conclusao e Avaliacao**
- Quando o buraco e tapado, o servidor conclui o protocolo
- Dona Maria recebe notificacao: "Seu protocolo foi concluido!"
- Avalia o atendimento com 1 a 5 estrelas e deixa comentario
- Essa avaliacao alimenta os indicadores de satisfacao da gestao

### Outros fluxos disponiveis no chatbot:

- Consultar protocolos por numero ou listagem
- Atualizar dados pessoais (nome, telefone, endereco completo)
- Ver documentos enviados
- Gerenciar composicao familiar (programas sociais)
- Visualizar notificacoes
- FAQ e tutorial de uso

---

## BLOCO 4 - JORNADA DO SERVIDOR (8 minutos)

**Dica: Mostre o painel admin enquanto narra.**

### Cenario: "Joao e servidor do Departamento de Obras"

**Passo 1 - Dashboard**
- Joao abre o painel e ve o dashboard com metricas em tempo real:
  - Total de protocolos ativos
  - Protocolos vencidos (SLA estourado)
  - Taxa de resolucao
  - Satisfacao media dos cidadaos
  - Grafico de tendencias por periodo

**Passo 2 - Gerenciar Protocolos**
- Lista todos os protocolos do seu departamento
- Filtra por status: Vinculado, Em Progresso, Pendencia, Concluido
- Filtra por prioridade, servico, periodo
- Abre o protocolo da Dona Maria
- Ve a descricao, fotos, localizacao no mapa

**Passo 3 - Trabalhar no Protocolo**
- Atribui para si ou delega para outro servidor
- Adiciona interacoes: comentarios internos, solicita documentos
- Cria pendencias: "Aguardando aprovacao do engenheiro"
- Move entre etapas do workflow configurado para aquele servico
- Quando finaliza, conclui o protocolo

**Passo 4 - Funcionalidades Avancadas**
- **Atribuicao Inteligente**: Sistema sugere servidor com menor carga de trabalho
- **Delegacao Temporaria**: Transfere protocolo durante ferias
- **Encaminhamento**: Move protocolo para outro departamento
- **Atribuicao em Equipe**: Varios servidores trabalhando no mesmo protocolo

---

## BLOCO 5 - MODULOS ESPECIALIZADOS (10 minutos)

### 5.1 - Secretarias Configuradas (14 departamentos)

"Cada secretaria tem seu ambiente dedicado com servicos pre-configurados:"

| Secretaria | Exemplos de Servicos |
|---|---|
| Obras Publicas | Tapa-buraco, iluminacao, calcamento |
| Saude | Agendamento, farmacia, TFD, prontuario |
| Educacao | Matricula, transporte escolar |
| Assistencia Social | Cadastro CadUnico, programas sociais |
| Meio Ambiente | Denuncia ambiental, poda de arvore |
| Agricultura | Sementes, mecanizacao, assistencia tecnica |
| Defesa Civil | Ocorrencias, vistorias |
| Mobilidade Urbana | Sinalizacao, transito |
| Cultura | Eventos, espacos culturais |
| Esportes | Reserva de quadras, eventos esportivos |
| Habitacao | Programas habitacionais |
| Financas | Certidoes, tributacao |
| Turismo | Eventos turisticos, cadastro de atrativos |
| Seguranca Publica | Ocorrencias, iluminacao |

### 5.2 - Modulo de Saude (diferencial competitivo)

"Este e um dos nossos maiores diferenciais. Temos um sistema completo de saude integrado:"

**Atendimento (fluxo e-SUS completo):**
- Fila de Atendimento com painel de chamada
- Acolhimento / Escuta Inicial (UBS)
- Classificacao de Risco - Protocolo de Manchester (UPA)
- Triagem de Enfermagem (sinais vitais, antropometria, glicemia)
- Consulta Medica com prontuario eletronico
- Encaminhamento interno e externo

**Cadastros:**
- Unidades de Saude (UBS, UPA, Hospital)
- Equipes de Saude (eSF, eAB, eSB, eCR)
- Especialidades medicas
- Microareas (territorializacao)
- Salas e consultorios
- Turnos e agendas
- Profissionais de saude com CBO

**Farmacia Municipal:**
- Controle de estoque por unidade
- Dispensacao de medicamentos
- Transferencia entre unidades
- Alertas de estoque baixo e vencimento
- Rastreabilidade por lote

**TFD - Tratamento Fora do Domicilio:**
- Solicitacao pelo medico com documentacao
- Regulacao medica
- Aprovacao da gestao
- Montagem de viagens (lista de passageiros)
- Controle de frota (veiculos e motoristas)
- Prestacao de contas com comprovantes

**Prontuario Eletronico:**
- Historico completo do paciente
- Alergias e comorbidades
- Receitas e prescricoes
- Atestados e encaminhamentos
- Imunizacoes

### 5.3 - Agricultura

- Cadastro de produtores rurais
- Cadastro de propriedades
- Programa de sementes
- Assistencia tecnica
- Mecanizacao agricola

### 5.4 - Gabinete do Prefeito

- Agenda do prefeito
- Mapa de demandas georeferenciado
- Painel executivo com metricas consolidadas
- Chamados administrativos (demandas do gabinete direto para secretarias)

---

## BLOCO 6 - FUNCIONALIDADES TRANSVERSAIS (5 minutos)

### 6.1 - Sistema de Documentos e Assinatura Digital

- Templates de documentos editaveis (editor visual Word-like)
- Geracao automatica de PDF com dados do protocolo
- Assinatura digital automatica com certificado RSA 2048 bits
- Validacao publica de documentos (cidadao verifica autenticidade por codigo)
- Controle de certificados digitais

**Exemplo pratico:** "Quando a secretaria de obras gera um laudo de vistoria, o documento e automaticamente assinado digitalmente e o cidadao pode validar a autenticidade pelo celular."

### 6.2 - Relatorios e Analytics

- Dashboard executivo com KPIs em tempo real
- 6 templates de relatorios prontos:
  - Protocolos Gerais
  - Protocolos em Andamento
  - Protocolos Concluidos
  - Protocolos Vencidos (SLA)
  - Desempenho por Departamento
  - Dashboard Executivo
- Exportacao em PDF e Excel
- Graficos de tendencias por periodo (diario, semanal, mensal, anual)
- Benchmark entre departamentos

### 6.3 - Sistema de Notificacoes

- Push notifications no celular do cidadao (PWA)
- Notificacoes em tempo real para servidores
- Email automatico em eventos importantes
- SMS (configuravel)
- SSE (Server-Sent Events) para atualizacoes ao vivo

### 6.4 - Email Integrado

- Caixa de entrada, enviados, rascunhos, lixeira
- Templates de email
- Composicao com editor rico

### 6.5 - Composicao Familiar

- Cadastro de membros da familia
- Vinculacao por convite (email)
- Tipos de relacionamento (pai, mae, filho, conjuge, etc)
- Dependentes para programas sociais
- Renda familiar e escolaridade

### 6.6 - Workflows Configuráveis

- Cada servico pode ter seu proprio workflow (etapas)
- SLA automatico por servico (dias uteis)
- Transicoes de status automaticas
- Pendencias que bloqueiam progresso
- Historico completo de auditoria

---

## BLOCO 7 - DIFERENCIAIS TECNICOS (3 minutos)

Para publico tecnico ou quando perguntarem sobre tecnologia:

**Arquitetura:**
- Frontend: Next.js 14 (React) com App Router
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL com Prisma ORM
- Mensageria: Socket.IO (real-time)
- Armazenamento: Uploads locais ou cloud

**Seguranca:**
- Autenticacao JWT com cookies httpOnly
- Controle de acesso por roles (5 niveis: Usuario, Coordenador, Secretario, Admin, Super Admin)
- Criptografia AES-256-GCM para chaves privadas
- Auditoria de acoes (audit log)
- Protecao contra OWASP Top 10

**Escalabilidade:**
- Multi-tenant (cada municipio isolado)
- PWA (Progressive Web App) - funciona offline
- API RESTful documentada
- Chatbot extensivel com fluxos JSON

**Implantacao:**
- Docker-ready
- Deploy em qualquer cloud (AWS, Azure, DigitalOcean)
- Ou on-premises no data center da prefeitura

---

## BLOCO 8 - MODELO DE NEGOCIO (2 minutos)

### Planos

| Plano | Descricao |
|---|---|
| **Basic** | Protocolos + Cidadaos + Dashboard basico |
| **Professional** | + Saude + Agricultura + Relatorios + Bot |
| **Enterprise** | + TFD + Assinatura Digital + Analytics completo + API |

### O que esta incluso:

- Implantacao e configuracao inicial
- Treinamento para servidores
- Suporte tecnico
- Atualizacoes continuas
- Hospedagem (se plano cloud)

---

## BLOCO 9 - FECHAMENTO (3 minutos)

### Resumo de Valor

"Com o DigiUrban, a prefeitura ganha:

1. **Eficiencia operacional** - Protocolos digitais eliminam papel e retrabalho
2. **Transparencia** - Cidadao acompanha tudo em tempo real
3. **Controle de gestao** - Dashboards e relatorios com dados reais
4. **Satisfacao do cidadao** - Atendimento 24/7 pelo celular com chatbot
5. **Conformidade legal** - Assinatura digital, auditoria, rastreabilidade
6. **Saude integrada** - Prontuario eletronico, farmacia, TFD (poucos concorrentes tem)
7. **Escalabilidade** - Cresce junto com o municipio"

### Proximos Passos

- "Posso agendar uma demonstracao tecnica detalhada?"
- "Podemos fazer um piloto com 2-3 secretarias para validar?"
- "Qual o tamanho da equipe de TI do municipio? Ajuda a dimensionar o suporte."

---

## APENDICE A - PERGUNTAS FREQUENTES

### "Quanto tempo leva para implantar?"
"A implantacao basica (protocolos + cidadaos + 3 secretarias) leva de 2 a 4 semanas. O modulo de saude completo leva mais 2-3 semanas adicionais por conta dos cadastros (unidades, equipes, profissionais)."

### "E se a prefeitura ja tem outros sistemas?"
"O DigiUrban tem API REST completa e pode integrar com sistemas existentes. O backend tem rotas internas para integracao entre servicos."

### "O cidadao precisa instalar algum app?"
"Nao. O DigiUrban e um PWA (Progressive Web App). O cidadao acessa pelo navegador e pode 'instalar' como app sem ir na loja. Funciona em Android e iPhone."

### "E seguro? Os dados ficam protegidos?"
"Sim. Usamos criptografia em transito (HTTPS) e em repouso (AES-256 para dados sensiveis). Cada municipio tem banco isolado (multi-tenant). Temos auditoria de todas as acoes e controle de acesso por 5 niveis de permissao."

### "Funciona offline?"
"O portal do cidadao tem suporte a PWA com cache offline para funcionalidades basicas. Quando a conexao volta, os dados sincronizam automaticamente."

### "Quantos usuarios suporta?"
"O plano basico suporta ate 10 servidores e 10.000 cidadaos. Os planos superiores escalam conforme necessidade. A arquitetura suporta milhares de usuarios simultaneos."

### "Como funciona o chatbot?"
"O DigiBot e um assistente conversacional que guia o cidadao por fluxos pre-definidos. Ele sabe solicitar servicos, consultar protocolos, atualizar dados, ver notificacoes e avaliar atendimentos. Os fluxos sao configuraveis sem necessidade de programacao (arquivos JSON)."

### "O prefeito tem acesso diferenciado?"
"Sim. O prefeito tem o Gabinete com agenda propria, mapa de demandas georeferenciado e dashboard executivo. Ele tambem pode criar chamados administrativos direto para qualquer secretaria."

---

## APENDICE B - NUMEROS PARA IMPRESSIONAR

- **207 paginas** no frontend (cobertura completa de funcionalidades)
- **14 secretarias** pre-configuradas
- **50+ servicos** de backend (rotas e APIs)
- **9 fluxos** de chatbot conversacional
- **19 acoes** automatizadas no bot
- **6 templates** de relatorios prontos
- **5 canais** de notificacao (Web, Push, Email, SMS, SSE)
- **4 modulos** especializados (Saude, Agricultura, Gabinete, TFD)
- Assinatura digital **RSA 2048 bits** com validacao publica
- Classificacao de risco **Protocolo de Manchester** integrada

---

## APENDICE C - ROTEIRO RESUMIDO (5 minutos - elevator pitch)

Para quando tiver pouco tempo:

"O DigiUrban e uma plataforma de gestao publica digital que funciona em 3 frentes:

**Para o cidadao:** Um app no celular onde ele solicita servicos da prefeitura, acompanha o andamento em tempo real e avalia o atendimento. Tem um chatbot que guia todo o processo.

**Para o servidor:** Um painel completo com protocolos digitais, workflows por servico, SLA automatico, geracao de documentos com assinatura digital e comunicacao integrada com o cidadao.

**Para o gestor:** Dashboards com KPIs reais, relatorios exportaveis, mapa de demandas e visao consolidada de toda a gestao.

O diferencial? Temos modulo de saude completo (prontuario, farmacia, TFD, classificacao de risco Manchester), agricultura, e-mail integrado e chatbot inteligente. Tudo em uma unica plataforma, com implantacao em 2-4 semanas."
