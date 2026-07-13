"""
DigiUrban - Gerador de Dataset de Treinamento COMPLETO
Cobre: cidadão, servidor público, arquitetura técnica, fluxos do bot,
       420+ serviços de 21 secretarias, automação, geração de fluxos JSON.
"""

import json
import os

# ──────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "Você é o DigiBot, assistente inteligente do sistema DigiUrban — plataforma de governo digital municipal. "
    "Você atende cidadãos, servidores públicos e desenvolvedores. "
    "Conhece profundamente toda a aplicação: arquitetura técnica, fluxos do chatbot, 420+ serviços das 21 secretarias, "
    "modelos de dados, APIs, regras de negócio e automações. "
    "Responde em português, de forma clara e objetiva. "
    "Para cidadãos: linguagem simples e acolhedora. "
    "Para servidores e desenvolvedores: linguagem técnica precisa."
)

def make(instruction, output):
    return {
        "conversations": [
            {"role": "system",  "content": SYSTEM_PROMPT},
            {"role": "user",    "content": instruction},
            {"role": "assistant","content": output},
        ]
    }

# ──────────────────────────────────────────────────────────────────────────────
# 1. IDENTIDADE E VISÃO GERAL
# ──────────────────────────────────────────────────────────────────────────────
IDENTITY = [
    make("O que é o DigiUrban?",
         "O DigiUrban é uma plataforma completa de governo digital municipal. Ela digitaliza os serviços públicos permitindo que cidadãos solicitem serviços, acompanhem protocolos, acessem documentos e se comuniquem com a prefeitura sem sair de casa. Para a administração, oferece gestão de protocolos, analytics, módulo de saúde completo (PEC e-SUS), email institucional, assinatura digital de documentos e muito mais."),

    make("Quais são os módulos do DigiUrban?",
         "O DigiUrban é composto por 4 serviços principais:\n"
         "1. **Backend** (Express + Prisma, porta 3001) — API REST com ~94 rotas, autenticação JWT, BullMQ para filas\n"
         "2. **Frontend** (Next.js 14 App Router, porta 3000) — 220+ páginas para cidadãos e administradores\n"
         "3. **Messages Server** (Socket.IO + Bot Engine, porta 9001) — chat em tempo real e DigiBot\n"
         "4. **SMTP Server** (portas 25 e 587) — servidor de email próprio com DKIM\n\n"
         "Infraestrutura: PostgreSQL, Redis, Nginx, Supervisord, llama.cpp (IA local), tudo orquestrado via Docker Compose."),

    make("Quem sou eu, DigiBot?",
         "Sou o DigiBot, assistente virtual inteligente do DigiUrban. Posso ajudar com:\n"
         "• Solicitar qualquer um dos 420+ serviços municipais das 21 secretarias\n"
         "• Consultar e acompanhar protocolos\n"
         "• Gerenciar seu perfil e composição familiar\n"
         "• Ver documentos e notificações\n"
         "• Avaliar atendimentos\n"
         "• Responder dúvidas sobre serviços da prefeitura\n\n"
         "Sou alimentado por um modelo de IA local (Qwen3 1.7B via llama.cpp) e integrado ao sistema de fluxos do DigiUrban."),

    make("Quais são as roles de usuário no sistema?",
         "O DigiUrban possui 6 roles distintas:\n"
         "• **USER** — Servidor público / atendente\n"
         "• **COORDINATOR** — Coordenador de departamento\n"
         "• **MANAGER** — Gerente\n"
         "• **ADMIN** — Administrador do sistema\n"
         "• **SUPER_ADMIN** — Super admin (gerencia o município inteiro)\n"
         "• **CITIZEN** — Cidadão (autenticação separada, cookie `digiurban_citizen_token`)\n\n"
         "Cada role tem permissões diferentes para transições de status de protocolos, acesso a módulos e ações disponíveis."),

    make("Como funciona a autenticação no DigiUrban?",
         "O DigiUrban usa JWT em cookies HTTP-only:\n"
         "• **Admin/Servidor**: cookie `digiurban_admin_token` — payload `{ userId, type: 'admin', iat, exp }`\n"
         "• **Cidadão**: cookie `digiurban_citizen_token` — payload `{ citizenId, userId?, type: 'citizen', iat, exp }`\n"
         "• **Fallback**: `Authorization: Bearer <token>` (header)\n"
         "• **Comunicação interna** (Messages → Backend): header `MESSAGES_SERVICE_TOKEN`\n\n"
         "Os middlewares correspondentes são: `adminAuthMiddleware`, `citizenAuthMiddleware`, `internalAuthMiddleware`."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 2. ARQUITETURA TÉCNICA DO BACKEND
# ──────────────────────────────────────────────────────────────────────────────
BACKEND_ARCH = [
    make("Como as rotas são registradas no backend?",
         "Em `src/index.ts`, todas as ~94 rotas são registradas via helper `loadRoute()` encapsulado em `try/catch` individual. Isso garante que um erro de importação em uma rota não derruba todo o servidor. Cada rota recebe um prefixo (ex: `/api/protocols`) e é carregada dinamicamente."),

    make("Como funciona o sistema de protocolos no backend?",
         "Protocolos são gerenciados pelo model `ProtocolSimplified` no Prisma. Campos críticos:\n"
         "• `status` — VINCULADO → PROGRESSO → CONCLUIDO/CANCELADO/PENDENCIA/ATUALIZACAO\n"
         "• `concludedAt` — data de conclusão (NÃO usar `updatedAt`)\n"
         "• `currentAssignedUserId` — servidor atual responsável\n"
         "• `createdById` — quem criou (NÃO `createdBy`)\n"
         "• `departmentId`, `serviceId`, `customData` (JSON)\n\n"
         "Transições de status são controladas por role em `config/protocol-status.config.ts`. Status terminais: `CONCLUIDO` e `CANCELADO`."),

    make("Quais são todos os status de protocolo e suas transições?",
         "Os status seguem esta matriz de transições:\n"
         "```\n"
         "VINCULADO → PROGRESSO\n"
         "PROGRESSO → CONCLUIDO  (terminal)\n"
         "PROGRESSO → CANCELADO  (terminal)\n"
         "PROGRESSO → PENDENCIA\n"
         "PROGRESSO → ATUALIZACAO\n"
         "PENDENCIA → PROGRESSO\n"
         "ATUALIZACAO → PROGRESSO\n"
         "```\n"
         "`CONCLUIDO` e `CANCELADO` são estados terminais — não permitem mais transições. "
         "O campo `concludedAt` é preenchido quando status muda para `CONCLUIDO`."),

    make("Como funciona o upload de arquivos no backend?",
         "O backend usa Multer para uploads com os seguintes limites:\n"
         "• Máximo por arquivo: 10MB\n"
         "• Máximo total: 50MB\n"
         "• Tipos aceitos: PDF, imagens, DOCX\n\n"
         "Para CSV exports, é necessário usar UTF-8 BOM (`\\uFEFF`) no início do arquivo para compatibilidade com Excel."),

    make("Como funciona a assinatura digital automática de documentos?",
         "Fluxo completo:\n"
         "1. Admin insere placeholder via botão PenTool no editor TipTap\n"
         "2. HTML gerado: `<div class='signature-placeholder' data-signature-width='200' data-signature-height='80'>`\n"
         "3. Backend detecta a class `signature-placeholder` no HTML compilado\n"
         "4. Busca certificado do sistema: `userId=null AND citizenId=null AND status=ACTIVE`\n"
         "5. Descriptografa chave privada com AES-256-GCM (`CERTIFICATE_ENCRYPTION_KEY`)\n"
         "6. Assina o PDF e atualiza `isSigned=true`\n"
         "7. Se falhar, documento é gerado sem assinatura (falha silenciosa)\n\n"
         "Para criar o certificado do sistema: `npx ts-node prisma/seeds/seed-system-certificate.ts`"),

    make("Quais são as principais rotas da API e o que fazem?",
         "Prefixos das principais rotas (todas sob `/api`):\n"
         "• `/admin/auth` — Login/logout admin\n"
         "• `/citizen/auth` — Login/logout cidadão\n"
         "• `/protocols` — CRUD completo de protocolos\n"
         "• `/protocol-analytics` — Dashboard, tendências, KPIs\n"
         "• `/citizen/services` — Catálogo de serviços para cidadão\n"
         "• `/citizen/protocols` — Protocolos do cidadão\n"
         "• `/documents` — Assinatura digital\n"
         "• `/certificates` — Certificados digitais\n"
         "• `/saude/atendimento` — ~52 endpoints módulo saúde\n"
         "• `/saude/farmacia` — ~28 endpoints farmácia\n"
         "• `/saude/tfd` — ~52 endpoints TFD\n"
         "• `/notifications` — SSE notifications\n"
         "• `/internal` — API para Messages Server\n"
         "• `/super-admin` — Gestão do município\n"
         "• `/admin/preferences` — 34 campos de preferências"),

    make("Quais são os principais models do Prisma?",
         "Models principais do `schema.prisma` (213 models):\n"
         "• `User` — Servidor público (name, email, role, departmentId)\n"
         "• `Citizen` — Cidadão (name, cpf, email, phone, isActive)\n"
         "• `Department` — Secretaria/Departamento\n"
         "• `ProtocolSimplified` — Protocolo (status, concludedAt, currentAssignedUserId)\n"
         "• `ProtocolSLA` — SLA (isOverdue, daysOverdue, expectedEndDate)\n"
         "• `ProtocolEvaluationSimplified` — Avaliação (protocolId, rating 0-5, comment, wouldRecommend) ⚠️ SEM campo `evaluatedBy`\n"
         "• `ServiceSimplified` — Serviço (name, formSchema JSON)\n"
         "• `DocumentTemplate` — Template de documento (htmlContent, cssContent)\n"
         "• `GeneratedDocument` — Documento gerado (isSigned)\n"
         "• `DigitalCertificate` — Certificado digital\n"
         "• `FlowDefinition` — Fluxo do bot (nodes JSON)\n"
         "• `Conversation` — Conversa chat (participantType, isBotConversation)"),

    make("Como funciona o BullMQ no backend?",
         "O BullMQ é usado para processamento assíncrono de tarefas pesadas via Redis. Tarefas típicas incluem envio de notificações em massa, processamento de documentos, geração de relatórios PDF e envio de emails. As filas ficam no Redis (`digiurban-redis:6379`) e os workers processam em background sem bloquear as rotas HTTP."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 3. ARQUITETURA DO MESSAGES SERVER E DIGIBOT
# ──────────────────────────────────────────────────────────────────────────────
MESSAGES_ARCH = [
    make("Qual é a arquitetura do Messages Server?",
         "```\n"
         "Frontend → HTTP(:9001) → FlowEngineService\n"
         "                              ↓\n"
         "                         FlowEngine\n"
         "                              ↓\n"
         "                       ActionHandlers\n"
         "                              ↓\n"
         "                    DigiUrbanIntegration\n"
         "                              ↓\n"
         "                    Backend(:3001, /api/internal)\n"
         "```\n\n"
         "O FlowEngine processa os nodos JSON dos fluxos, executa ações via ActionHandlers, e estes chamam o backend via DigiUrbanIntegration (timeout 15s, retry automático para ECONNREFUSED/ECONNABORTED)."),

    make("Quais são os tipos de nodo disponíveis nos fluxos do bot?",
         "Existem exatamente 9 tipos de nodo:\n"
         "1. `message` — Exibe texto estático ou dinâmico com templates `{{variavel}}`\n"
         "2. `question` — Pergunta ao usuário com validação (text, email, date, number, protocol)\n"
         "3. `menu` — Menu de opções com id/label/description, transitions por `when`\n"
         "4. `action` — Executa um ActionHandler (getDepartments, createProtocol, etc.)\n"
         "5. `condition` — Decisão condicional com operadores: eq, gt, lt, gte, lte, exists\n"
         "6. `form` — Formulário dinâmico com campos do formSchema\n"
         "7. `upload` — Upload de arquivos (múltiplos, até 5, até 10MB cada)\n"
         "8. `location` — Captura localização geográfica\n"
         "9. `end` — Encerra o fluxo (com `returnToMain: true/false`)\n\n"
         "⚠️ NÃO existem tipos `api_call` ou `wait` — foram removidos."),

    make("Quais são todos os ActionHandlers disponíveis?",
         "ActionHandlers registrados (22 handlers):\n\n"
         "**Serviços:**\n"
         "• `searchServices(query, category, limit)` → {count, services, raw}\n"
         "• `listServices(limit)` → {count, services}\n"
         "• `listServiceCategories()` → {count, categories}\n"
         "• `getService(serviceId)` → {service}\n\n"
         "**Protocolos:**\n"
         "• `createProtocol(serviceId, description, customData, documents)` → {protocol}\n"
         "• `getProtocols(limit)` → {count, protocols}\n"
         "• `getProtocolByNumber(protocolNumber)` → {protocol}\n"
         "• `getProtocolDetails(protocolNumber)` → {protocol, protocolDetailCard}\n"
         "• `addProtocolComment(protocolId, comment)` → {comment}\n"
         "• `getProtocolInteractions(protocolId)` → {count, interactions}\n"
         "• `getProtocolDocuments(protocolId)` → {count, documents}\n\n"
         "**Perfil e Família:**\n"
         "• `getCitizenProfile()` → {profile}\n"
         "• `updateCitizenProfile(name, email, phone, address, birthDate)` → {profile}\n"
         "• `getFamilyMembers()` → {count, members}\n\n"
         "**Notificações:**\n"
         "• `getNotifications(unreadOnly, limit)` → {count, notifications}\n"
         "• `markNotificationsAsRead(notificationIds, markAll)` → {marked}\n\n"
         "**Documentos:**\n"
         "• `getDocuments(limit)` → {count, documents}\n\n"
         "**Avaliação:**\n"
         "• `getPendingEvaluations()` → {count, protocols}\n"
         "• `submitEvaluation(protocolId, rating, comment)` → {evaluation}\n\n"
         "**Utilitários:**\n"
         "• `formatProtocolReview()` → {reviewText, reviewCard}\n"
         "• `getDepartments()` → {count, departments}\n"
         "• `getServicesByDepartment(departmentId)` → {count, services, categories, catalogText}\n"
         "• `processFormSchema(serviceId)` → {hasForm, questions, requiresDocuments, requiredDocuments}"),

    make("Como funciona o processFormSchema?",
         "O `processFormSchema` é um ActionHandler crítico que:\n"
         "1. Busca o serviço pelo `serviceId` via backend\n"
         "2. Lê o `formSchema` JSON do serviço\n"
         "3. Filtra campos `citizen_*` (preenchidos automaticamente pelo backend via JWT)\n"
         "4. Converte cada campo em uma pergunta estruturada:\n"
         "   - `enum` → tipo `select` com options\n"
         "   - `format: date` → tipo `date`\n"
         "   - `format: email` → tipo `email` com validação\n"
         "   - `type: boolean` → options Sim/Não\n"
         "   - `type: integer/number` → tipo `number`\n"
         "5. Prepara documentos obrigatórios (`requiredDocuments`)\n"
         "6. Retorna `{hasForm, questions, totalQuestions, service, requiresDocuments, requiredDocuments}`\n\n"
         "Serviços `SEM_DADOS` retornam `hasForm: false` e vão direto para upload/review."),

    make("Qual é a estrutura de um fluxo JSON?",
         "```json\n"
         "{\n"
         "  \"name\": \"nome_do_fluxo\",\n"
         "  \"description\": \"Descrição\",\n"
         "  \"version\": \"1.0.0\",\n"
         "  \"metadata\": { \"icon\": \"📝\", \"color\": \"#hex\", \"category\": \"service\" },\n"
         "  \"nodes\": [\n"
         "    {\n"
         "      \"id\": \"start\",\n"
         "      \"type\": \"message\",\n"
         "      \"config\": { \"text\": \"Mensagem com {{variavel}}\" },\n"
         "      \"transitions\": [{ \"to\": \"proximo_nodo\" }]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"menu_opcoes\",\n"
         "      \"type\": \"menu\",\n"
         "      \"config\": {\n"
         "        \"text\": \"Escolha:\",\n"
         "        \"options\": [{\"id\": \"op1\", \"label\": \"Opção 1\", \"description\": \"...\"}],\n"
         "        \"saveAs\": \"escolha\"\n"
         "      },\n"
         "      \"transitions\": [\n"
         "        { \"when\": \"op1\", \"to\": \"nodo_op1\" }\n"
         "      ]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"verificar\",\n"
         "      \"type\": \"condition\",\n"
         "      \"config\": {\n"
         "        \"conditions\": [{\n"
         "          \"field\": \"dados.count\",\n"
         "          \"operator\": \"gt\",\n"
         "          \"value\": 0,\n"
         "          \"goto\": \"nodo_sucesso\"\n"
         "        }],\n"
         "        \"defaultGoto\": \"nodo_vazio\"\n"
         "      }\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"end\",\n"
         "      \"type\": \"end\",\n"
         "      \"config\": { \"returnToMain\": true }\n"
         "    }\n"
         "  ]\n"
         "}\n"
         "```"),

    make("Explique o fluxo completo de solicitar serviço no DigiBot.",
         "O fluxo `solicitar_servico` (v2.1.0) segue estes passos:\n\n"
         "1. **start** (message) — Boas-vindas\n"
         "2. **load_departments** (action: getDepartments) → salva em `departmentsData`\n"
         "3. **check_departments** (condition: departmentsData.count > 0) → select_department ou no_departments\n"
         "4. **select_department** (menu: `{{departmentsData.departments}}`, displayMode: department_carousel) → salva em `selectedDept`\n"
         "5. **load_dept_services** (action: getServicesByDepartment, params: {departmentId: `{{selectedDept}}`}) → salva em `deptServicesData`\n"
         "6. **check_dept_services** (condition: deptServicesData.count > 0)\n"
         "7. **show_dept_catalog** (message: `{{deptServicesData.catalogText}}`)\n"
         "8. **select_service_from_dept** (menu: `{{deptServicesData.services}}`) → salva em `selectedServiceId`\n"
         "9. **load_form_schema** (action: processFormSchema) → salva em `formSchemaData`\n"
         "10. **show_service_details** (message com nome, descrição, prazo, secretaria)\n"
         "11. **confirm_service** (menu: sim/outro_servico/outra_secretaria/cancelar)\n"
         "12. **check_has_form** (condition: formSchemaData.hasForm === true) → fill_form ou ask_description\n"
         "13. **fill_form** (form: `{{formSchemaData.questions}}`) OU **ask_description** (question texto livre)\n"
         "14. **check_needs_documents** (condition: formSchemaData.requiresDocuments === true)\n"
         "15. **upload_documents** (upload: múltiplos, maxFiles: 5, 10MB cada)\n"
         "16. **format_review** (action: formatProtocolReview) → salva em `reviewData`\n"
         "17. **review_data** (message: `{{reviewData.reviewText}}`)\n"
         "18. **confirm_submit** (menu: confirmar/corrigir/cancelar)\n"
         "19. **create_protocol** (action: createProtocol) → salva em `createdProtocol`\n"
         "20. **check_protocol_created** (condition: createdProtocol.protocol exists)\n"
         "21. **success** (message com número do protocolo)\n"
         "22. **ask_new_request** (menu: nova solicitação ou menu principal)\n"
         "23. **end** (returnToMain: true)"),

    make("Como funciona o fluxo de consultar protocolo?",
         "O fluxo `consultar_protocolo` (v1.2.0):\n\n"
         "1. **start** → **search_method** (menu: por número / listar / voltar)\n\n"
         "**Via número:**\n"
         "2. **ask_protocol_number** (question, validação tipo 'protocol', formato AAAA-NNNNNN) → salva em `protocolNumber`\n"
         "3. **get_protocol_by_number** (action: getProtocolDetails) → **show_protocol_details**\n\n"
         "**Via lista:**\n"
         "4. **list_protocols** (action: getProtocols, limit: 20) → **check_protocols_found**\n"
         "5. **show_protocols_list** (menu dinâmico) → **load_protocol_details**\n\n"
         "**Detalhes do protocolo** exibem: número, título, status, prioridade, serviço, departamento, datas, prazo\n\n"
         "**Actions no protocolo:**\n"
         "• Ver histórico → getProtocolInteractions → show_interactions\n"
         "• Adicionar comentário → ask_comment → addProtocolComment\n"
         "• Ver documentos → getProtocolDocuments → show_protocol_docs\n"
         "• Consultar outro → volta ao search_method"),

    make("Quais são os 9 fluxos JSON do DigiBot e o que cada um faz?",
         "Os 9 fluxos pré-configurados (auto-seeded no boot pelo FlowDefinitionSeeder):\n"
         "1. **menu_principal** (v1.1.0) — Menu com 8 opções, usa `startFlow` para redirecionar\n"
         "2. **solicitar_servico** (v2.1.0) — Fluxo completo de 23 nodos para abertura de protocolo\n"
         "3. **consultar_protocolo** (v1.2.0) — Consulta + histórico + documentos + comentários\n"
         "4. **meu_perfil** (v1.1.0) — Visualização e edição de dados pessoais\n"
         "5. **documentos** — Listagem e consulta de documentos do cidadão\n"
         "6. **minha_familia** — Gerenciamento de composição familiar\n"
         "7. **notificacoes** — Central de notificações com marcação de lida\n"
         "8. **avaliacao** — Avaliação de protocolos concluídos (rating 1-5)\n"
         "9. **ajuda** — Dúvidas, suporte e informações gerais"),

    make("Como o action startFlow funciona?",
         "O `startFlow` é um action especial tratado diretamente pelo **FlowEngine**, não pelos ActionHandlers.\n\n"
         "Quando um nodo `action` chama `startFlow` com `params: { flowName: 'nome_do_fluxo' }`, o FlowEngine:\n"
         "1. Busca o FlowDefinition no banco pelo nome\n"
         "2. Reseta o estado atual\n"
         "3. Carrega e inicia o novo fluxo\n\n"
         "Isso permite navegação entre fluxos. O menu_principal usa isso para todas as 8 opções.\n"
         "⚠️ NUNCA registre `startFlow` no mapa de ActionHandlers — ele é handled internamente."),

    make("Como funciona o TemplateEngine nos fluxos?",
         "O TemplateEngine resolve variáveis `{{variavel}}` no texto dos nodos usando o estado atual da conversa.\n\n"
         "Sintaxe:\n"
         "• `{{nomeSimples}}` — acessa variável do estado raiz\n"
         "• `{{objeto.campo}}` — acessa campo aninhado\n"
         "• `{{objeto.campo.subcampo}}` — acesso profundo\n\n"
         "Exemplos reais dos fluxos:\n"
         "• `{{departmentsData.departments}}` — array de opções de menu\n"
         "• `{{formSchemaData.service.name}}` — nome do serviço selecionado\n"
         "• `{{createdProtocol.protocol.number}}` — número do protocolo criado\n"
         "• `{{protocolDetails.protocol.status}}` — status do protocolo\n"
         "• `{{selectedInteractionId_data.metadata.authorName}}` — metadados de item selecionado em menu"),

    make("Como funciona o FlowStateManager?",
         "O FlowStateManager gerencia o estado de cada conversa no Redis:\n"
         "• Armazena o nodo atual, dados coletados e variáveis do estado\n"
         "• Cada conversa tem estado isolado por `conversationId`\n"
         "• Quando um action node executa, o resultado é salvo em `state[saveResultAs]`\n"
         "• Quando um menu/question/form captura input, salvo em `state[saveAs]`\n"
         "• O estado persiste entre mensagens da mesma conversa\n"
         "• TTL configurável para expirar conversas abandonadas"),

    make("Quais são os eventos Socket.IO do Messages Server?",
         "**Eventos de mensagem:**\n"
         "• `message:send` — Enviar mensagem\n"
         "• `message:read` — Marcar como lida\n"
         "• `message:new` — Nova mensagem recebida\n\n"
         "**Eventos de digitação:**\n"
         "• `typing:start` — Iniciou digitação\n"
         "• `typing:stop` — Parou de digitar\n\n"
         "**Eventos de conversa:**\n"
         "• `conversation:join` — Entrou na sala\n"
         "• `conversation:leave` — Saiu da sala\n"
         "• `conversation:new` — Nova conversa criada\n\n"
         "**Outros:** `ping`/`pong`\n\n"
         "**Rooms Socket.IO:**\n"
         "• `user:{userId}:{userType}` — Sala pessoal (CITIZEN ou SERVER)\n"
         "• `conversation:{conversationId}` — Sala de conversa\n"
         "• `channel:{channelId}` — Canal de broadcast\n\n"
         "**Paths:** Admin usa `:3001/api/socket` | Messages usa `:9001` (path default)"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 4. GERAÇÃO DE FLUXOS JSON (AUTOMAÇÃO TÉCNICA)
# ──────────────────────────────────────────────────────────────────────────────
FLOW_GENERATION = [
    make("Como crio um fluxo JSON simples de coleta de informação para o DigiBot?",
         "```json\n"
         "{\n"
         "  \"name\": \"coleta_reclamacao\",\n"
         "  \"description\": \"Coleta reclamação do cidadão\",\n"
         "  \"version\": \"1.0.0\",\n"
         "  \"nodes\": [\n"
         "    {\n"
         "      \"id\": \"start\",\n"
         "      \"type\": \"message\",\n"
         "      \"config\": { \"text\": \"📢 **Registrar Reclamação**\\n\\nVou registrar sua reclamação.\" },\n"
         "      \"transitions\": [{ \"to\": \"ask_tipo\" }]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"ask_tipo\",\n"
         "      \"type\": \"menu\",\n"
         "      \"config\": {\n"
         "        \"text\": \"Sobre o que é a reclamação?\",\n"
         "        \"options\": [\n"
         "          {\"id\": \"iluminacao\", \"label\": \"💡 Iluminação Pública\"},\n"
         "          {\"id\": \"pavimentacao\", \"label\": \"🚧 Pavimentação\"},\n"
         "          {\"id\": \"outro\", \"label\": \"📋 Outro\"}\n"
         "        ],\n"
         "        \"saveAs\": \"tipoReclamacao\"\n"
         "      },\n"
         "      \"transitions\": [{ \"to\": \"ask_descricao\" }]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"ask_descricao\",\n"
         "      \"type\": \"question\",\n"
         "      \"config\": {\n"
         "        \"text\": \"Descreva o problema:\",\n"
         "        \"validation\": { \"type\": \"text\", \"minLength\": 10, \"maxLength\": 500 },\n"
         "        \"saveAs\": \"descricao\"\n"
         "      },\n"
         "      \"transitions\": [{ \"to\": \"criar_protocolo\" }]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"criar_protocolo\",\n"
         "      \"type\": \"action\",\n"
         "      \"config\": {\n"
         "        \"action\": \"createProtocol\",\n"
         "        \"params\": {\n"
         "          \"serviceId\": \"ID_DO_SERVICO_AQUI\",\n"
         "          \"description\": \"{{descricao}}\",\n"
         "          \"customData\": { \"tipoReclamacao\": \"{{tipoReclamacao}}\" }\n"
         "        },\n"
         "        \"saveResultAs\": \"resultado\"\n"
         "      },\n"
         "      \"transitions\": [{ \"to\": \"end\" }]\n"
         "    },\n"
         "    {\n"
         "      \"id\": \"end\",\n"
         "      \"type\": \"end\",\n"
         "      \"config\": { \"returnToMain\": true }\n"
         "    }\n"
         "  ]\n"
         "}\n"
         "```"),

    make("Como criar um fluxo com condição que verifica se o usuário tem dados antes de continuar?",
         "Use o nodo `condition` com operador `exists` ou `gt`:\n\n"
         "```json\n"
         "{\n"
         "  \"id\": \"load_data\",\n"
         "  \"type\": \"action\",\n"
         "  \"config\": {\n"
         "    \"action\": \"getProtocols\",\n"
         "    \"saveResultAs\": \"protocolsList\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"check_data\" }]\n"
         "},\n"
         "{\n"
         "  \"id\": \"check_data\",\n"
         "  \"type\": \"condition\",\n"
         "  \"config\": {\n"
         "    \"conditions\": [{\n"
         "      \"field\": \"protocolsList.count\",\n"
         "      \"operator\": \"gt\",\n"
         "      \"value\": 0,\n"
         "      \"goto\": \"show_list\"\n"
         "    }],\n"
         "    \"defaultGoto\": \"no_data\"\n"
         "  }\n"
         "},\n"
         "{\n"
         "  \"id\": \"no_data\",\n"
         "  \"type\": \"message\",\n"
         "  \"config\": { \"text\": \"📭 Nenhum registro encontrado.\" },\n"
         "  \"transitions\": [{ \"to\": \"end\" }]\n"
         "}\n"
         "```\n\n"
         "Operadores disponíveis: `eq`, `gt`, `lt`, `gte`, `lte`, `exists`"),

    make("Qual é o padrão correto para um nodo de upload no fluxo?",
         "```json\n"
         "{\n"
         "  \"id\": \"upload_documentos\",\n"
         "  \"type\": \"upload\",\n"
         "  \"config\": {\n"
         "    \"text\": \"📤 **Envie os documentos necessários:**\",\n"
         "    \"multiple\": true,\n"
         "    \"maxFiles\": 5,\n"
         "    \"maxFileSize\": 10,\n"
         "    \"allowedTypes\": [\n"
         "      \"application/pdf\",\n"
         "      \"image/*\",\n"
         "      \"application/msword\",\n"
         "      \"application/vnd.openxmlformats-officedocument.wordprocessingml.document\"\n"
         "    ],\n"
         "    \"allowSkip\": false,\n"
         "    \"requiredDocuments\": \"{{formSchemaData.requiredDocuments}}\",\n"
         "    \"saveAs\": \"uploadedDocuments\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"proximo_nodo\" }]\n"
         "}\n"
         "```\n\n"
         "Limites: máximo 5 arquivos, 10MB cada, tipos: PDF, imagens, DOC, DOCX."),

    make("Como criar um fluxo de agendamento automático pelo DigiBot?",
         "Exemplo de fluxo de agendamento:\n\n"
         "```json\n"
         "{\n"
         "  \"name\": \"agendamento_consulta\",\n"
         "  \"version\": \"1.0.0\",\n"
         "  \"nodes\": [\n"
         "    {\"id\":\"start\",\"type\":\"message\",\"config\":{\"text\":\"📅 **Agendamento de Consulta**\"},\"transitions\":[{\"to\":\"ask_especialidade\"}]},\n"
         "    {\"id\":\"ask_especialidade\",\"type\":\"menu\",\"config\":{\"text\":\"Especialidade:\",\"options\":[{\"id\":\"clinico\",\"label\":\"Clínico Geral\"},{\"id\":\"pediatria\",\"label\":\"Pediatria\"},{\"id\":\"ginecologia\",\"label\":\"Ginecologia\"}],\"saveAs\":\"especialidade\"},\"transitions\":[{\"to\":\"ask_data\"}]},\n"
         "    {\"id\":\"ask_data\",\"type\":\"question\",\"config\":{\"text\":\"Data preferencial (DD/MM/AAAA):\",\"validation\":{\"type\":\"text\",\"minLength\":8,\"maxLength\":10},\"saveAs\":\"dataPreferencial\"},\"transitions\":[{\"to\":\"ask_periodo\"}]},\n"
         "    {\"id\":\"ask_periodo\",\"type\":\"menu\",\"config\":{\"text\":\"Período:\",\"options\":[{\"id\":\"manha\",\"label\":\"Manhã\"},{\"id\":\"tarde\",\"label\":\"Tarde\"}],\"saveAs\":\"periodo\"},\"transitions\":[{\"to\":\"criar_protocolo\"}]},\n"
         "    {\"id\":\"criar_protocolo\",\"type\":\"action\",\"config\":{\"action\":\"createProtocol\",\"params\":{\"serviceId\":\"ID_SERVICO_AGENDAMENTO\",\"description\":\"Agendamento de {{especialidade}} em {{dataPreferencial}} no período da {{periodo}}\",\"customData\":{\"especialidade\":\"{{especialidade}}\",\"dataPreferencial\":\"{{dataPreferencial}}\",\"periodo\":\"{{periodo}}\"}},\"saveResultAs\":\"protocolo\"},\"transitions\":[{\"to\":\"sucesso\"}]},\n"
         "    {\"id\":\"sucesso\",\"type\":\"message\",\"config\":{\"text\":\"✅ Agendamento registrado! Protocolo: {{protocolo.protocol.number}}\"},\"transitions\":[{\"to\":\"end\"}]},\n"
         "    {\"id\":\"end\",\"type\":\"end\",\"config\":{\"returnToMain\":true}}\n"
         "  ]\n"
         "}\n"
         "```"),

    make("Como um fluxo pode atualizar o perfil do cidadão automaticamente?",
         "Use o ActionHandler `updateCitizenProfile` em um nodo `action`:\n\n"
         "```json\n"
         "{\n"
         "  \"id\": \"ask_novo_telefone\",\n"
         "  \"type\": \"question\",\n"
         "  \"config\": {\n"
         "    \"text\": \"Digite seu novo telefone:\",\n"
         "    \"validation\": { \"type\": \"text\", \"minLength\": 10, \"maxLength\": 15 },\n"
         "    \"saveAs\": \"novoTelefone\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"atualizar_perfil\" }]\n"
         "},\n"
         "{\n"
         "  \"id\": \"atualizar_perfil\",\n"
         "  \"type\": \"action\",\n"
         "  \"config\": {\n"
         "    \"action\": \"updateCitizenProfile\",\n"
         "    \"params\": { \"phone\": \"{{novoTelefone}}\" },\n"
         "    \"saveResultAs\": \"perfilAtualizado\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"confirmacao\" }]\n"
         "}\n"
         "```\n\n"
         "Campos permitidos no updateCitizenProfile: `name`, `email`, `phone`, `phoneSecondary`, `address`, `birthDate`.\n"
         "Se address.complemento = 'pular', o campo é removido automaticamente."),

    make("Como criar um fluxo que exibe menu de avaliação de protocolo?",
         "Para coletar avaliação com rating de 1 a 5 via menu:\n\n"
         "```json\n"
         "{\n"
         "  \"id\": \"ask_rating\",\n"
         "  \"type\": \"menu\",\n"
         "  \"config\": {\n"
         "    \"text\": \"⭐ Como você avalia o atendimento?\",\n"
         "    \"options\": [\n"
         "      {\"id\": \"5\", \"label\": \"⭐⭐⭐⭐⭐ Excelente\"},\n"
         "      {\"id\": \"4\", \"label\": \"⭐⭐⭐⭐ Bom\"},\n"
         "      {\"id\": \"3\", \"label\": \"⭐⭐⭐ Regular\"},\n"
         "      {\"id\": \"2\", \"label\": \"⭐⭐ Ruim\"},\n"
         "      {\"id\": \"1\", \"label\": \"⭐ Muito Ruim\"}\n"
         "    ],\n"
         "    \"saveAs\": \"rating\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"ask_comment\" }]\n"
         "},\n"
         "{\n"
         "  \"id\": \"submit_avaliacao\",\n"
         "  \"type\": \"action\",\n"
         "  \"config\": {\n"
         "    \"action\": \"submitEvaluation\",\n"
         "    \"params\": {\n"
         "      \"protocolId\": \"{{selectedProtocol.id}}\",\n"
         "      \"rating\": \"{{rating}}\",\n"
         "      \"comment\": \"{{comentario}}\"\n"
         "    },\n"
         "    \"saveResultAs\": \"avaliacaoResult\"\n"
         "  },\n"
         "  \"transitions\": [{ \"to\": \"end\" }]\n"
         "}\n"
         "```\n\n"
         "⚠️ O `submitEvaluation` converte automaticamente o rating de string para int (menu nodes salvam o id como string)."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 5. SERVIÇOS — SAÚDE (20 serviços)
# ──────────────────────────────────────────────────────────────────────────────
HEALTH_SERVICES = [
    make("Quais serviços de saúde estão disponíveis pelo DigiBot?",
         "A Secretaria de Saúde oferece 20 serviços:\n\n"
         "**Consultas e Agendamentos:**\n"
         "• Agendamento de Consulta Médica (Cartão SUS + RG/CPF, prazo: 7 dias)\n"
         "• Agendamento de Consulta Odontológica (Cartão SUS + RG/CPF, prazo: 10 dias)\n"
         "• Agendamento CAPS — Saúde Mental (Cartão SUS, prazo: 7 dias)\n\n"
         "**Exames e Medicamentos:**\n"
         "• Solicitação de Exames (Pedido Médico + Cartão SUS, prazo: 15 dias)\n"
         "• Solicitação de Medicamentos — farmácia básica (Receita + Cartão SUS, prazo: 3 dias)\n"
         "• Medicamentos de Alto Custo (Receita Especial + Laudo, prazo: 30 dias)\n\n"
         "**Programas:**\n"
         "• Agendamento de Vacinação (prazo: 1 dia)\n"
         "• Programa Saúde da Família — PSF (prazo: 15 dias) — apenas 1 por cidadão\n"
         "• Inscrição em Programas de Saúde — Hiperdia, Saúde da Mulher (prazo: 15 dias)\n\n"
         "**Especializado:**\n"
         "• Transporte TFD — Tratamento Fora do Domicílio (prazo: 10 dias)\n"
         "• Atendimento Domiciliar (prazo: 10 dias)\n"
         "• Fisioterapia (prazo: 20 dias)\n"
         "• Cartão SUS — 1ª ou 2ª via (prazo: 15 dias)\n"
         "• Ambulância — Urgência (sem prazo fixo)\n"
         "• Denúncia Sanitária (prazo: 5 dias)\n\n"
         "**SEM_DADOS:** Certidão de Atendimento, Declaração de Vacinação, Histórico, "
         "Consulta de Medicamentos Disponíveis, Consulta de Resultados de Exames"),

    make("Como agendar uma consulta médica pelo DigiBot?",
         "Para agendar uma consulta médica:\n\n"
         "1. Menu principal → **📝 Solicitar Serviço** → **Saúde** → **Agendamento de Consulta Médica**\n"
         "2. Preencha o formulário:\n"
         "   - Número do Cartão SUS (15 dígitos obrigatórios)\n"
         "   - Especialidade: Clínico Geral, Pediatria, Ginecologia, Cardiologia, etc.\n"
         "   - Unidade de Saúde preferencial (opcional)\n"
         "   - Observações (opcional)\n"
         "3. Documentos: foto/scan do Cartão SUS + RG ou CPF\n"
         "4. Confirme e receba o protocolo\n\n"
         "⏱️ Prazo: **7 dias úteis**"),

    make("Quais documentos preciso para solicitar medicamentos de alto custo?",
         "Para **Medicamentos de Alto Custo** você precisa:\n"
         "• Receita Médica Especial (com CRM e assinatura)\n"
         "• Laudo Médico detalhado\n"
         "• Exames Complementares que justificam o medicamento\n"
         "• Cartão SUS (15 dígitos)\n"
         "• RG ou CPF\n\n"
         "No formulário você informará:\n"
         "- Nome do medicamento e princípio ativo\n"
         "- Dosagem e CID-10 do diagnóstico\n"
         "- Nome e CRM do médico\n"
         "- Tempo de tratamento previsto\n\n"
         "⏱️ Prazo: **30 dias úteis**"),

    make("Como solicitar TFD — Tratamento Fora do Domicílio?",
         "O **TFD** é para tratamentos em outras cidades:\n\n"
         "**Documentos:** Atestado Médico com solicitação de TFD, Comprovante de Endereço, Cartão SUS, RG\n\n"
         "**Formulário:**\n"
         "- Tipo de transporte: Ambulância / Veículo Adaptado / Transporte Coletivo\n"
         "- Cidade de destino\n"
         "- Finalidade do transporte\n"
         "- Data de ida e retorno\n"
         "- Se necessita acompanhante\n\n"
         "⏱️ Prazo: **10 dias úteis**. Prioridade máxima (5)."),

    make("Como funciona o módulo de saúde completo no backend do DigiUrban?",
         "O módulo de saúde implementa funcionalidades do **PEC e-SUS** com ~130 endpoints:\n\n"
         "• `/saude/atendimento` — Consultas, triagem, escuta inicial, atividades coletivas\n"
         "• `/saude/farmacia` — Controle de medicamentos, dispensação, estoque\n"
         "• `/saude/tfd` — Tratamento Fora do Domicílio, agendamentos, transporte\n\n"
         "**Models principais:**\n"
         "• `EquipeSaude` — Equipes de saúde da família (ESF)\n"
         "• `ProfissionalEquipe` — Profissionais (médicos, enfermeiros, ACS)\n"
         "• `FilaAtendimento` — Fila em tempo real por unidade\n"
         "• `EscutaInicial` — Acolhimento com queixas e triagem\n"
         "• `TriagemEnfermagem` — Classificação de risco (Manchester)\n"
         "• `VisitaDomiciliar` — Visitas do ACS com prontuário\n"
         "• `ImunizacaoCidadao` — Histórico de vacinação\n"
         "• `AtendimentoOdontologico` — Odontologia com procedimentos"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 6. SERVIÇOS — EDUCAÇÃO (20 serviços)
# ──────────────────────────────────────────────────────────────────────────────
EDUCATION_SERVICES = [
    make("Quais serviços de educação estão disponíveis no DigiUrban?",
         "A Secretaria de Educação oferece 20 serviços:\n\n"
         "**Matrículas:**\n"
         "• Matrícula Escolar — Creche, Pré-escola, Fund. I/II, EJA (prazo: 7 dias)\n"
         "• Inscrição em Creche — 0 a 3 anos/idadeMeses (prazo: 30 dias)\n"
         "• Transferência Escolar (prazo: 7 dias)\n"
         "• Inscrição em EJA — idade mínima 15 anos (prazo: 10 dias)\n\n"
         "**Assistência:**\n"
         "• Transporte Escolar (distanciaEscola em km, prazo: 10 dias)\n"
         "• Uniforme Escolar gratuito (prazo: 20 dias)\n"
         "• Kit Material Escolar (prazo: 15 dias)\n"
         "• Merenda Especial — restrições alimentares (prazo: 10 dias)\n"
         "• AEE — Atendimento Educacional Especializado (prazo: 15 dias)\n\n"
         "**Documentos e Informações:**\n"
         "• Documento Escolar — histórico, declaração, certificado (prazo: 5 dias)\n"
         "• Consulta de Frequência e Notas (prazo: 1 dia)\n"
         "• Calendário Escolar (prazo: 1 dia)\n"
         "• Reclamação sobre Transporte Escolar (prazo: 3 dias)\n"
         "• Ocorrência Escolar (prazo: 1 dia)\n"
         "• Cursos Livres (prazo: 3 dias)\n"
         "• Cadastro de Professores — banco de talentos (prazo: 15 dias, unique)\n\n"
         "**SEM_DADOS:** Histórico Escolar, Declaração de Matrícula, Certidão, Boletim, Atestado de Frequência"),

    make("Como fazer matrícula escolar pelo DigiBot?",
         "Para **Matrícula Escolar**:\n\n"
         "**Documentos:** Certidão de Nascimento, RG do Responsável, Comprovante de Residência, Cartão de Vacina\n\n"
         "**Formulário:**\n"
         "- Nome completo e data de nascimento do aluno\n"
         "- Sexo do aluno\n"
         "- Grau de parentesco: Pai, Mãe, Avô/Avó, Tutor Legal, etc.\n"
         "- Escola preferencial\n"
         "- Nível: Creche, Pré-Escola, Fund. I, Fund. II, EJA\n"
         "- Turno: Matutino, Vespertino, Integral, Noturno\n"
         "- Possui necessidades especiais?\n\n"
         "⏱️ Prazo: **7 dias úteis**"),

    make("Como solicitar AEE — Atendimento Educacional Especializado?",
         "O **AEE** é para alunos com necessidades especiais:\n\n"
         "**Documentos:** Laudo Médico, Relatório Pedagógico, Comprovante de Matrícula\n\n"
         "**Formulário:**\n"
         "- Nome, data de nascimento e escola do aluno\n"
         "- Tipo de deficiência/necessidade:\n"
         "  Deficiência Intelectual, Física, Visual, Auditiva, TEA, Altas Habilidades, TDAH, Outra\n"
         "- Atendimento desejado: Sala de Recursos, Professor de Apoio, Intérprete de Libras, Material Adaptado\n"
         "- Turno para AEE: mesmo turno ou contraturno\n\n"
         "⏱️ Prazo: **15 dias úteis**. Prioridade máxima (5)."),

    make("Como solicitar inscrição em creche?",
         "Para **Inscrição em Creche** (crianças de 0 a 3 anos):\n\n"
         "**Documentos:** Certidão de Nascimento, RG e CPF do Responsável, Comprovante de Residência, Comprovante de Trabalho, Cartão de Vacina\n\n"
         "**Formulário:**\n"
         "- Nome e data de nascimento da criança\n"
         "- Idade em meses (0 a 36 — `idadeMeses`)\n"
         "- Creche preferencial\n"
         "- Turno: Integral, Matutino ou Vespertino\n"
         "- Situação de trabalho dos pais: Ambos trabalham / Apenas um / Família monoparental\n"
         "- Possui necessidades especiais?\n\n"
         "⏱️ Prazo: **30 dias** (lista de espera conforme disponibilidade)."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 7. SERVIÇOS — ASSISTÊNCIA SOCIAL (20 serviços)
# ──────────────────────────────────────────────────────────────────────────────
SOCIAL_SERVICES = [
    make("Quais serviços de assistência social o DigiUrban oferece?",
         "A Secretaria de Assistência Social oferece 20 serviços:\n\n"
         "**Cadastros e Benefícios:**\n"
         "• CadÚnico — Cadastro Único (CPF+RG+Renda, prazo: 10 dias) — apenas 1 por cidadão\n"
         "• Benefício Social — BPC, Bolsa Família, Auxílio Emergencial (prazo: 15 dias)\n"
         "• Bolsa Família Municipal (precisa CadÚnico, prazo: 20 dias)\n"
         "• Auxílio Aluguel (prazo: 15 dias)\n"
         "• Cesta Básica / Auxílio Emergencial (prazo: 3-5 dias)\n"
         "• Benefício Eventual — natalidade, funeral, calamidade (prazo: 5 dias)\n"
         "• Tarifa Social de Energia (prazo: 10 dias)\n"
         "• Isenção de Tarifa de Transporte (prazo: 15 dias)\n\n"
         "**Atendimento CRAS/CREAS:**\n"
         "• Agendamento de Atendimento Social (prazo: 3 dias)\n"
         "• Atendimento CRAS geral (prazo: 3 dias)\n"
         "• Visita Domiciliar (prazo: 7 dias)\n\n"
         "**Programas e Grupos:**\n"
         "• Grupo ou Oficina Social (prazo: 5 dias)\n"
         "• Programa Social (prazo: 10 dias)\n"
         "• Primeira Infância — 0 a 6 anos (prazo: 10 dias)\n"
         "• Casa Lar para Idoso (prazo: 30 dias)\n"
         "• Documentação Civil Gratuita — RG, CPF, Certidão (prazo: 15 dias)\n\n"
         "**SEM_DADOS:** Certidão CadÚnico, Declaração de Benefício, Laudo Social, "
         "Consulta de Benefícios Ativos, Declaração de Atendimento, Relatório de Acompanhamento"),

    make("Como se inscrever no CadÚnico pelo DigiBot?",
         "Para **Cadastro Único (CadÚnico)**:\n\n"
         "**Documentos:** CPF, RG, Comprovante de Residência, Comprovante de Renda\n\n"
         "**Formulário:**\n"
         "- NIS se já possuir\n"
         "- Quantidade de pessoas na família\n"
         "- Renda familiar mensal total\n"
         "- Benefícios já recebidos\n\n"
         "⚠️ Só é permitido **um CadÚnico ativo** por cidadão (`allowMultipleActiveProtocols: false`).\n\n"
         "⏱️ Prazo: **10 dias úteis**"),

    make("Como solicitar Auxílio Aluguel?",
         "Para **Auxílio Aluguel**:\n\n"
         "**Documentos:** Contrato de Aluguel, CPF, RG, Comprovante de Renda, Declaração de Vulnerabilidade\n\n"
         "**Formulário:**\n"
         "- Valor do aluguel atual\n"
         "- Nome do proprietário\n"
         "- Tempo de residência no imóvel\n"
         "- Quantidade de pessoas na família\n"
         "- Renda familiar mensal\n"
         "- Motivo da solicitação (min. 20 caracteres)\n"
         "- Situação emergencial (risco de despejo)?\n\n"
         "⏱️ Prazo: **15 dias úteis**"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 8. SERVIÇOS — AGRICULTURA (20 serviços)
# ──────────────────────────────────────────────────────────────────────────────
AGRICULTURE_SERVICES = [
    make("Quais serviços agrícolas estão disponíveis no DigiUrban?",
         "A Secretaria de Agricultura oferece 20 serviços:\n\n"
         "**Cadastros (uniqueness controls):**\n"
         "• Cadastro de Produtor Rural (prazo: 10 dias) — apenas 1 ativo por cidadão\n"
         "• Cadastro de Propriedade Rural (prazo: 30 dias) — permite múltiplas\n"
         "• Cadastro de Piscicultura (prazo: 15 dias) — apenas 1 por cidadão\n"
         "• Cadastro de Agroindústria Familiar (prazo: 20 dias) — apenas 1 por cidadão\n\n"
         "**Assistência Técnica:**\n"
         "• ATER — Assistência Técnica Rural (prazo: 15 dias)\n"
         "• Análise de Solo (prazo: 20 dias)\n"
         "• Solicitação de Máquinas Agrícolas (prazo: 7 dias)\n\n"
         "**Programas e Feiras:**\n"
         "• Inscrição na Feira do Produtor (prazo: 5 dias)\n"
         "• Inscrição em Programas Rurais (prazo: 15 dias)\n"
         "• Hortas Comunitárias (prazo: 10 dias)\n"
         "• Distribuição de Sementes (prazo: 10 dias)\n"
         "• Distribuição de Mudas (prazo: 15 dias)\n"
         "• Seguro Safra (prazo: 15 dias)\n"
         "• DAP Digital — Declaração de Aptidão ao Pronaf (prazo: 10 dias)\n\n"
         "**Licenças:**\n"
         "• Licença para Perfuração de Poço (prazo: 30 dias)\n"
         "• Licença para Eventos Rurais (prazo: 30 dias)\n\n"
         "**SEM_DADOS:** Certidão de Produtor Rural, Declaração de Atividade Rural"),

    make("Como me cadastrar como produtor rural?",
         "Para **Cadastro de Produtor Rural**:\n\n"
         "**Documentos:** CPF, Comprovante de Residência, DAP (opcional)\n\n"
         "**Formulário:**\n"
         "- Ponto de referência da propriedade\n"
         "- Área em hectares\n"
         "- Tipo de produção: Agricultura Familiar, Comercial, Pecuária, Horticultura, Silvicultura\n"
         "- Possui DAP? Se sim, número da DAP\n\n"
         "⚠️ Apenas **1 cadastro ativo** por cidadão.\n\n"
         "⏱️ Prazo: **10 dias úteis**"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 9. SERVIÇOS — ADMINISTRAÇÃO (20 serviços)
# ──────────────────────────────────────────────────────────────────────────────
ADMINISTRATION_SERVICES = [
    make("Quais serviços administrativos estão disponíveis no DigiUrban?",
         "A Secretaria de Administração oferece 20 serviços:\n\n"
         "**Protocolos e Documentos:**\n"
         "• Protocolo Online de Documentos (prazo: 1 dia) — petições, requerimentos\n"
         "• Solicitação ao SIC — Lei de Acesso à Informação (prazo: 20 dias)\n"
         "• Declaração/Atestado (prazo: 10 dias)\n"
         "• Cópia de Processo Administrativo (prazo: 15 dias)\n\n"
         "**Participação:**\n"
         "• Ouvidoria — elogio, sugestão, reclamação, denúncia (prazo: 15 dias)\n"
         "• Denúncia de Irregularidade Administrativa (prazo: 30 dias)\n\n"
         "**Agendamentos:**\n"
         "• Agendamento Geral (prazo: 5 dias)\n"
         "• Agendamento Especializado (prazo: 10 dias)\n\n"
         "**Outros:**\n"
         "• Uso de Espaço Público (prazo: 20 dias)\n"
         "• Inscrição em Concurso Público (prazo: 15 dias)\n\n"
         "**SEM_DADOS (CONSULTIVO):** Nada Consta, Tempo de Serviço, Licitações, "
         "Diário Oficial, Legislação Municipal, Concursos, Ouvidoria, Processo Administrativo"),

    make("Como fazer uma denúncia pelo DigiBot?",
         "Há dois tipos de denúncia:\n\n"
         "**1. Ouvidoria** (elogio, reclamação, sugestão, denúncia geral):\n"
         "- Tipo: Elogio / Sugestão / Reclamação / Solicitação / Denúncia\n"
         "- Órgão relacionado, assunto e descrição\n"
         "- Opção de fazer **anonimamente**\n"
         "- Prazo: 15 dias\n\n"
         "**2. Denúncia de Irregularidade Administrativa** (desvios graves):\n"
         "- Tipo: Desvio de Recursos, Nepotismo, Má Conduta, Licitação Irregular, Abuso de Poder\n"
         "- Órgão, data da ocorrência, descrição detalhada (max 3000 chars)\n"
         "- Testemunhas (opcional)\n"
         "- Opção de fazer **anonimamente**\n"
         "- Prazo: 30 dias"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 10. DEMAIS SECRETARIAS
# ──────────────────────────────────────────────────────────────────────────────
OTHER_SECRETARIAS = [
    make("Quais são todas as 21 secretarias do DigiUrban e seus serviços?",
         "O DigiUrban cobre 21 secretarias com ~420 serviços no total:\n\n"
         "1. **ADMINISTRACAO** — 20 serviços (protocolos, ouvidoria, SIC, concursos)\n"
         "2. **AGRICULTURA** — 20 serviços (cadastros rurais, ATER, sementes, máquinas)\n"
         "3. **DEFESA_CIVIL** — 15 serviços (alertas, evacuações, reconstrução)\n"
         "4. **CULTURA** — 20 serviços (eventos, espaços culturais, patrimônio)\n"
         "5. **DESENVOLVIMENTO_ECONOMICO** — 20 serviços (alvarás, MEI, incentivos)\n"
         "6. **EDUCACAO** — 20 serviços (matrículas, AEE, transporte escolar)\n"
         "7. **MEIO_AMBIENTE** — 20 serviços (licenças ambientais, poda, coleta)\n"
         "8. **FINANCAS** — 20 serviços (IPTU, ISS, certidões negativas, parcelamentos)\n"
         "9. **SAUDE** — 20 serviços (consultas, medicamentos, vacinação, TFD)\n"
         "10. **HABITACAO** — 20 serviços (programas habitacionais, regularização)\n"
         "11. **SEGURANCA_PUBLICA** — 20 serviços (guarda municipal, câmeras, iluminação)\n"
         "12. **SERVICOS_PUBLICOS** — 20 serviços (limpeza, coleta, vias)\n"
         "13. **OBRAS_PUBLICAS** — 20 serviços (calçamento, pontes, tapa-buraco)\n"
         "14. **ASSISTENCIA_SOCIAL** — 20 serviços (CadÚnico, CRAS, benefícios)\n"
         "15. **ESPORTES** — 20 serviços (quadras, programas, eventos)\n"
         "16. **TECNOLOGIA_INOVACAO** — 20 serviços (wi-fi, gov digital, inovação)\n"
         "17. **TURISMO** — 20 serviços (eventos, guias, patrimônio)\n"
         "18. **TRANSPORTE_TRANSITO** — 20 serviços (licenças, fiscalização)\n"
         "19. **MOBILIDADE_URBANA** — 20 serviços (ciclovias, mobilidade)\n"
         "20. **PLANEJAMENTO_URBANO** — 20 serviços (plano diretor, zoneamento)\n"
         "21. **POLITICAS_MULHERES** — 20 serviços (proteção, capacitação, CRAM)"),

    make("Quais serviços de finanças municipais estão disponíveis?",
         "A Secretaria de Finanças oferece serviços como:\n"
         "• Parcelamento de IPTU em até 12x\n"
         "• Emissão de guia de IPTU\n"
         "• Negociação de dívida ativa\n"
         "• Emissão de Nota Fiscal de Serviços (ISS)\n"
         "• Certidão Negativa de Débitos\n"
         "• Isenção de IPTU (idosos, deficientes, baixa renda)\n"
         "• Restituição de tributos pagos indevidamente\n"
         "• Alvará de funcionamento para empresas\n\n"
         "Acesse pelo menu: Solicitar Serviço → Finanças."),

    make("Quais serviços de obras públicas o DigiUrban oferece?",
         "A Secretaria de Obras Públicas oferece:\n"
         "• Solicitação de Tapa-Buraco\n"
         "• Solicitação de Recapeamento Asfáltico\n"
         "• Solicitação de Calçamento\n"
         "• Construção de Ponte ou Bueiro\n"
         "• Solicitação de Iluminação Pública\n"
         "• Alvará de Construção\n"
         "• Habite-se\n"
         "• Consulta de Obras em Andamento\n"
         "• Denúncia de Obra Irregular\n\n"
         "Acesse: Solicitar Serviço → Obras Públicas."),

    make("Quais serviços de meio ambiente estão disponíveis?",
         "A Secretaria de Meio Ambiente oferece:\n"
         "• Licença Ambiental Simplificada\n"
         "• Autorização para Poda/Supressão de Árvores\n"
         "• Denúncia de Crime Ambiental\n"
         "• Solicitação de Coleta Seletiva\n"
         "• Cadastro de Compostagem Doméstica\n"
         "• Licença para Captação de Água\n"
         "• Programa de Arborização Urbana\n"
         "• Monitoramento de Qualidade do Ar\n\n"
         "Acesse: Solicitar Serviço → Meio Ambiente."),

    make("Quais serviços de políticas para mulheres estão disponíveis?",
         "A Secretaria de Políticas para Mulheres oferece:\n"
         "• Atendimento no CRAM (Centro de Referência e Apoio à Mulher)\n"
         "• Denúncia de Violência Doméstica\n"
         "• Acolhimento em Situação de Violência\n"
         "• Encaminhamento para Casa Abrigo\n"
         "• Orientação Jurídica Gratuita\n"
         "• Assistência Psicossocial\n"
         "• Cursos de Capacitação Profissional\n"
         "• Programa de Empreendedorismo Feminino\n"
         "• Grupos de Apoio\n\n"
         "Em caso de emergência ligue 180 (Central de Atendimento à Mulher)."),

    make("Quais serviços de defesa civil estão disponíveis?",
         "A Defesa Civil municipal oferece:\n"
         "• Sistema de Alertas de Riscos Naturais\n"
         "• Solicitação de Vistoria de Imóvel em Risco\n"
         "• Apoio em Situação de Calamidade\n"
         "• Solicitação de Evacuação Preventiva\n"
         "• Reconstrução Pós-Desastre\n"
         "• Auxílio Moradia — temporário\n"
         "• Cadastro de Áreas de Risco\n"
         "• Denúncia de Construção em Área de Risco\n\n"
         "⚠️ Em emergência ligue 199 (Defesa Civil) ou 193 (Bombeiros)."),

    make("Quais serviços de habitação estão disponíveis?",
         "A Secretaria de Habitação oferece:\n"
         "• Inscrição em Programas Habitacionais (Minha Casa Minha Vida municipal)\n"
         "• Regularização Fundiária\n"
         "• Reforma de Habitação — assistência técnica gratuita\n"
         "• Escritura de Imóvel\n"
         "• Cadastro de Habitação de Interesse Social\n"
         "• Solicitação de Lote Urbanizado\n"
         "• Consulta de Lista de Espera Habitacional\n"
         "• Alvará de Demolição\n\n"
         "Acesse: Solicitar Serviço → Habitação."),

    make("Quais serviços de esportes o DigiUrban oferece?",
         "A Secretaria de Esportes oferece:\n"
         "• Reserva de Quadra Poliesportiva\n"
         "• Inscrição em Campeonato Municipal\n"
         "• Inscrição em Aulas e Atividades Físicas Gratuitas\n"
         "• Uso de Ginásio Municipal\n"
         "• Inscrição em Programas Esportivos Sociais\n"
         "• Licença para Eventos Esportivos\n"
         "• Apoio Financeiro a Atletas (bolsa esportiva)\n"
         "• Mapa de Instalações Esportivas Municipais\n\n"
         "Acesse: Solicitar Serviço → Esportes."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 11. TIPOS DE SERVIÇO E REGRAS DE NEGÓCIO
# ──────────────────────────────────────────────────────────────────────────────
SERVICE_RULES = [
    make("Quais são os tipos de serviço no DigiUrban e como funcionam?",
         "**serviceType:**\n"
         "• `COM_DADOS` — Serviço que coleta dados via formulário customizado\n"
         "• `SEM_DADOS` — Serviço consultivo, usa dados do perfil do cidadão automaticamente\n\n"
         "**serviceSubtype:**\n"
         "• `SOLICITACAO_SIMPLES` — Formulário básico, poucos campos\n"
         "• `CAPTURA_COMPLETA` — Formulário extenso com citizen_fields\n"
         "• `CONSULTIVO` — Apenas consulta/leitura, sem formulário adicional\n\n"
         "**moduleType** — identifica o módulo de negócio (ex: CADASTRO_PRODUTOR, MATRICULA_ESCOLAR)\n\n"
         "**allowMultipleActiveProtocols:**\n"
         "• `false` — Apenas 1 protocolo ativo por cidadão (CadÚnico, Cadastro Produtor, PSF)\n"
         "• `true` — Múltiplos protocolos permitidos (Inscrição Concurso, Cadastro Propriedade)"),

    make("O que são citizen_fields nos formulários?",
         "Os `citizenFields` são campos preenchidos **automaticamente pelo backend** via JWT. O bot não pergunta esses dados.\n\n"
         "Campos disponíveis:\n"
         "• `citizen_name` — Nome completo\n"
         "• `citizen_cpf` — CPF\n"
         "• `citizen_rg` — RG\n"
         "• `citizen_birthdate` — Data de nascimento\n"
         "• `citizen_email` — E-mail\n"
         "• `citizen_phone` — Telefone principal\n"
         "• `citizen_phonesecondary` — Telefone secundário\n"
         "• `citizen_zipcode`, `citizen_address`, `citizen_addressnumber`, `citizen_addresscomplement`, `citizen_neighborhood`\n"
         "• `citizen_mothername` — Nome da mãe\n"
         "• `citizen_maritalstatus` — Estado civil\n"
         "• `citizen_occupation` — Profissão\n"
         "• `citizen_familyincome` — Renda familiar\n\n"
         "O `processFormSchema` filtra todos esses campos e passa ao bot apenas os campos customizados."),

    make("Como funciona a regra de unicidade de protocolos?",
         "Serviços com `allowMultipleActiveProtocols: false` e `uniquenessScope: 'CUSTOM'` impedem que o cidadão abra um segundo protocolo ativo do mesmo serviço.\n\n"
         "Serviços com unicidade:\n"
         "• **Saúde**: PSF (`validateProgramaSaudeFamilia`)\n"
         "• **Educação**: Cadastro de Professores (`validateCadastroProfessor`)\n"
         "• **Social**: CadÚnico (`validateCadastroUnico`)\n"
         "• **Agricultura**: Produtor Rural (`validateCadastroProdutor`), Piscicultura, Agroindústria\n\n"
         "Serviços que permitem múltiplos (`allowMultipleActiveProtocols: true`):\n"
         "• Cadastro de Propriedade Rural\n"
         "• Inscrição em Concurso Público\n"
         "• Matrícula Escolar (vários filhos)"),

    make("O que é formSchema e como é estruturado?",
         "O `formSchema` é um JSON Schema que define os campos do formulário de cada serviço:\n\n"
         "```json\n"
         "{\n"
         "  \"type\": \"object\",\n"
         "  \"citizenFields\": [\"citizen_name\", \"citizen_cpf\"],\n"
         "  \"properties\": {\n"
         "    \"especialidade\": {\n"
         "      \"type\": \"string\",\n"
         "      \"title\": \"Especialidade\",\n"
         "      \"enum\": [\"Clínico Geral\", \"Pediatria\"]\n"
         "    },\n"
         "    \"dataConsulta\": {\n"
         "      \"type\": \"string\",\n"
         "      \"title\": \"Data\",\n"
         "      \"format\": \"date\"\n"
         "    },\n"
         "    \"descricao\": {\n"
         "      \"type\": \"string\",\n"
         "      \"title\": \"Descrição\",\n"
         "      \"maxLength\": 500,\n"
         "      \"widget\": \"textarea\"\n"
         "    },\n"
         "    \"urgente\": { \"type\": \"boolean\" }\n"
         "  },\n"
         "  \"required\": [\"especialidade\"]\n"
         "}\n"
         "```\n\n"
         "O `processFormSchema` converte isso em perguntas para o bot, ignorando `citizenFields`."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 12. PERSPECTIVA DO SERVIDOR PÚBLICO
# ──────────────────────────────────────────────────────────────────────────────
SERVER_VIEW = [
    make("Como um servidor público trabalha com protocolos no DigiUrban?",
         "Como servidor (role USER ou COORDINATOR), você pode:\n\n"
         "**Gerenciar protocolos:**\n"
         "• Dashboard com todos os protocolos do departamento\n"
         "• Filtrar por status, prioridade, SLA, data\n"
         "• Ver alertas de SLA em atraso (`isOverdue`, `daysOverdue`)\n\n"
         "**Ações:**\n"
         "• Atribuir protocolo a si mesmo (`currentAssignedUserId`)\n"
         "• Mudar status conforme sua role\n"
         "• Adicionar interações internas e públicas\n"
         "• Anexar documentos\n"
         "• Gerar documentos com assinatura digital\n\n"
         "**Analytics:**\n"
         "• Total de protocolos, concluídos, pendentes\n"
         "• Tempo médio de conclusão (via `concludedAt`)\n"
         "• Taxa de satisfação (avaliações 0-5)"),

    make("Como funciona o módulo de analytics para gestores?",
         "O módulo de analytics (`/api/protocol-analytics`) oferece:\n\n"
         "**Dashboard:**\n"
         "• Métricas por período (hoje, semana, mês, trimestre)\n"
         "• Totais: abertos, concluídos, cancelados, em atraso\n"
         "• Tempo médio de conclusão (`concludedAt - createdAt`)\n"
         "• KPIs de satisfação (via `ProtocolEvaluationSimplified`)\n\n"
         "**SLA:**\n"
         "• `ProtocolSLA.isOverdue` — se está em atraso\n"
         "• `ProtocolSLA.daysOverdue` — dias de atraso\n"
         "• `ProtocolSLA.expectedEndDate` — prazo esperado\n\n"
         "**Tendências:** Gráficos de volume, distribuição por departamento, serviços mais solicitados\n\n"
         "⚠️ `ProtocolEvaluationSimplified` NÃO tem campo `evaluatedBy` — apenas `protocolId`, `rating`, `comment`, `wouldRecommend`"),

    make("Como funciona o email institucional no DigiUrban?",
         "O DigiUrban tem um **servidor SMTP próprio** (ultrazend-smtp-server):\n\n"
         "• **Porta 25 (MX)** — Recebe emails externos\n"
         "• **Porta 587 (Submission)** — Envio autenticado\n"
         "• **DKIM** — Assinatura automática RSA 2048\n"
         "• **Entrega direta** via DNS MX (sem relay externo)\n\n"
         "No frontend (`/admin/email/`): Inbox, Sent, Drafts, Trash, composição com editor rich text."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 13. FRONTEND — ESTRUTURA E CONVENÇÕES
# ──────────────────────────────────────────────────────────────────────────────
FRONTEND_ARCH = [
    make("Como está estruturado o frontend do DigiUrban?",
         "**Tecnologias:** Next.js 14.2 App Router + React 18 + TypeScript 5.9 + Tailwind CSS 3.4 + shadcn/ui\n\n"
         "**Rotas principais (App Router):**\n"
         "```\n"
         "/                        → Landing page\n"
         "/cidadao/               → Portal do cidadão\n"
         "/cidadao/servicos       → Catálogo de serviços\n"
         "/cidadao/protocolos     → Meus protocolos\n"
         "/cidadao/chat           → DigiBot\n"
         "/admin/                 → Área administrativa\n"
         "/admin/protocolos/      → Gestão de protocolos\n"
         "/admin/servidores/      → Gestão de servidores\n"
         "/admin/secretarias/[dept] → 21 módulos de secretaria\n"
         "/admin/bot-flows/       → Editor de fluxos do bot\n"
         "/admin/analytics/       → Dashboard analítico\n"
         "/admin/email/           → Email institucional\n"
         "/super-admin/           → Gestão do município\n"
         "```"),

    make("Quais são as principais convenções do frontend DigiUrban?",
         "**Obrigatórias:**\n"
         "• App Router (NUNCA Pages Router) — rotas em `src/app/`\n"
         "• Formulários: react-hook-form + Zod\n"
         "• State: TanStack Query (server state), sem Redux/Zustand\n"
         "• Dark mode via classe CSS (`class` strategy)\n"
         "• Cores: CSS variables HSL (padrão Radix)\n\n"
         "**Evitar:**\n"
         "• `window.location.reload()` → usar CustomEvent\n"
         "• `dangerouslySetInnerHTML` → usar `<iframe srcDoc>`\n"
         "• Modais para views complexas → páginas dedicadas (URLs compartilháveis)\n\n"
         "**TipTap (editor WYSIWYG):**\n"
         "• `enableInputRules: false` e `enablePasteRules: false` obrigatórios\n"
         "• `addGlobalAttributes()` para style/class em todos os node types"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 14. DOCKER E DEPLOY
# ──────────────────────────────────────────────────────────────────────────────
DOCKER_DEPLOY = [
    make("Como funciona o deploy do DigiUrban?",
         "**Build multi-stage Docker:**\n"
         "```\n"
         "backend-builder → frontend-builder → runner (nginx + supervisord)\n"
         "```\n\n"
         "**Containers:**\n"
         "• `digiurban-vps` — porta 3060 → nginx(80) → backend(3001) + frontend(3000)\n"
         "• `ultrazend-messages` — porta 9001\n"
         "• `ultrazend-smtp` — portas 25 e 587\n"
         "• `digiurban-postgres` — porta 5432\n"
         "• `digiurban-redis` — porta 6379\n"
         "• `digiurban-llamacpp` — porta 18080 (IA local Qwen3-1.7B)\n\n"
         "**Comando:**\n"
         "```bash\n"
         "BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build\n"
         "```\n\n"
         "⚠️ Frontend env vars `NEXT_PUBLIC_` são definidas em BUILD TIME no Dockerfile."),

    make("Qual modelo de IA é usado no DigiUrban e como funciona?",
         "O DigiUrban usa **Qwen3-1.7B** em formato GGUF Q4_K_M via **llama.cpp**:\n\n"
         "• Container: `ghcr.io/ggml-org/llama.cpp:server`\n"
         "• Modelo: `ggml-org/Qwen3-1.7B-GGUF:Q4_K_M`\n"
         "• Parâmetros: `--jinja -c 3072 -n 180`\n"
         "• Endpoint interno: `http://digiurban-llamacpp:8080`\n"
         "• Porta externa: `127.0.0.1:18080`\n\n"
         "O modelo responde às perguntas do DigiBot que não são cobertas pelos fluxos estruturados."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 15. AUTOMAÇÃO E USO TÉCNICO
# ──────────────────────────────────────────────────────────────────────────────
AUTOMATION = [
    make("Como posso usar a API interna do DigiUrban para automatizar criação de protocolos?",
         "A rota `/api/internal` é protegida pelo header `MESSAGES_SERVICE_TOKEN`:\n\n"
         "**Criar protocolo:**\n"
         "```typescript\n"
         "POST /api/internal/protocols\n"
         "Headers: { 'x-messages-service-token': MESSAGES_SERVICE_TOKEN }\n"
         "Body: {\n"
         "  citizenId: string,\n"
         "  serviceId: string,\n"
         "  description: string,\n"
         "  customData: Record<string, any>,\n"
         "  documents: Array<{ fileUrl, documentType, size, mimeType }>\n"
         "}\n"
         "```\n\n"
         "A `DigiUrbanIntegration` encapsula essas chamadas com timeout de 15s e retry automático para ECONNREFUSED."),

    make("Como adicionar um novo ActionHandler ao DigiBot?",
         "Para criar um novo ActionHandler:\n\n"
         "1. Em `ActionHandlers.ts`, adicione a função:\n"
         "```typescript\n"
         "export const meuHandler: ActionHandler = async (params, context) => {\n"
         "  const { meuParam } = params;\n"
         "  try {\n"
         "    const result = await integration.minhaChamada(meuParam);\n"
         "    return { dado: result };\n"
         "  } catch (error: any) {\n"
         "    return { success: false, error: formatFriendlyError(error, 'Fallback.') };\n"
         "  }\n"
         "};\n"
         "```\n\n"
         "2. Registre no mapa:\n"
         "```typescript\n"
         "export const actionHandlers: Record<string, ActionHandler> = {\n"
         "  ...handlers_existentes,\n"
         "  meuHandler,\n"
         "};\n"
         "```\n\n"
         "3. Adicione o método em `DigiUrbanIntegration.ts`\n"
         "4. Use nos fluxos JSON com `\"action\": \"meuHandler\"`"),

    make("Como criar um novo fluxo e registrá-lo no sistema?",
         "**Passo 1:** Crie o arquivo JSON em `ultrazend-messages-server/src/bot/flows/meu-fluxo.json`\n\n"
         "**Passo 2:** O `FlowDefinitionSeeder` automaticamente carrega todos os JSONs da pasta e faz upsert no banco ao iniciar o servidor.\n\n"
         "**Passo 3:** Para adicionar ao menu principal, crie uma opção no `menu-principal.json`:\n"
         "```json\n"
         "{ \"id\": \"meu_fluxo\", \"label\": \"🆕 Meu Fluxo\" }\n"
         "```\n"
         "Com nodo redirect:\n"
         "```json\n"
         "{ \"id\": \"redirect_meu_fluxo\", \"type\": \"action\",\n"
         "  \"config\": { \"action\": \"startFlow\", \"params\": { \"flowName\": \"meu_fluxo\" } } }\n"
         "```\n\n"
         "**Passo 4:** Reinicie o Messages Server — o seeder atualiza automaticamente."),

    make("Como automatizar abertura de protocolo de ponta a ponta pelo bot?",
         "Fluxo completo de automação:\n\n"
         "**1. Identificar o serviço:**\n"
         "```json\n"
         "{ \"action\": \"getServicesByDepartment\", \"params\": { \"departmentId\": \"ID\" }, \"saveResultAs\": \"deptData\" }\n"
         "```\n\n"
         "**2. Processar formulário:**\n"
         "```json\n"
         "{ \"action\": \"processFormSchema\", \"params\": { \"serviceId\": \"{{selectedServiceId}}\" }, \"saveResultAs\": \"formSchemaData\" }\n"
         "```\n\n"
         "**3. Coletar com nodo `form`:**\n"
         "```json\n"
         "{ \"type\": \"form\", \"config\": { \"fields\": \"{{formSchemaData.questions}}\", \"saveAs\": \"formData\" } }\n"
         "```\n\n"
         "**4. Upload (se necessário):**\n"
         "```json\n"
         "{ \"type\": \"upload\", \"config\": { \"multiple\": true, \"maxFiles\": 5, \"saveAs\": \"docs\" } }\n"
         "```\n\n"
         "**5. Criar protocolo:**\n"
         "```json\n"
         "{ \"action\": \"createProtocol\",\n"
         "  \"params\": { \"serviceId\": \"{{selectedServiceId}}\", \"customData\": \"{{formData}}\", \"documents\": \"{{docs}}\" },\n"
         "  \"saveResultAs\": \"createdProtocol\" }\n"
         "```\n\n"
         "**6. Confirmar:** `{{createdProtocol.protocol.number}}`"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 16. TRATAMENTO DE ERROS
# ──────────────────────────────────────────────────────────────────────────────
ERROR_HANDLING = [
    make("Como o DigiBot trata erros de API?",
         "O `formatFriendlyError` no ActionHandlers.ts converte erros técnicos:\n\n"
         "| Erro | Mensagem |\n"
         "|------|----------|\n"
         "| HTTP 404 | 🔍 Não encontrado. Verifique os dados e tente novamente. |\n"
         "| HTTP 401/403 | 🔒 Acesso não autorizado. Tente fazer login novamente. |\n"
         "| ECONNREFUSED / ENOTFOUND | ⚠️ Serviço temporariamente indisponível. |\n"
         "| ECONNABORTED / timeout | ⏱️ A operação demorou muito. Tente novamente. |\n"
         "| Outros | ❌ + mensagem da API ou fallback |\n\n"
         "A `DigiUrbanIntegration` tem **retry automático** para ECONNREFUSED e ECONNABORTED."),

    make("Por que o DigiBot retorna 'count: 0' ao invés de erro quando não há dados?",
         "Este é um padrão crítico: ActionHandlers **NUNCA** retornam `success: false` quando há zero dados — apenas quando há erro real.\n\n"
         "Correto:\n"
         "```typescript\n"
         "if (result.length === 0) {\n"
         "  return { count: 0, services: [], raw: [] };  // ✅ vazio, não erro\n"
         "}\n"
         "```\n\n"
         "Isso permite que o nodo `condition` verifique `count > 0` e redirecione para nodo de 'lista vazia' com mensagem adequada, sem quebrar o fluxo."),

    make("Quais são as gotchas mais comuns no desenvolvimento do DigiUrban?",
         "**Backend:**\n"
         "• Use `concludedAt` para tempo de conclusão (NUNCA `updatedAt`)\n"
         "• Campo é `createdById` (não `createdBy`)\n"
         "• Prisma `groupBy` não suporta nested relations — use `_count` ou aggregation\n"
         "• CSV export precisa UTF-8 BOM (`\\uFEFF`) para Excel\n"
         "• `ProtocolEvaluationSimplified` não tem `evaluatedBy` — só `protocolId`, `rating`, `comment`, `wouldRecommend`\n\n"
         "**Frontend:**\n"
         "• TipTap requer custom Node extensions para preservar tags HTML\n"
         "• `enableInputRules: false` e `enablePasteRules: false` obrigatórios\n"
         "• `<iframe srcDoc>` em vez de `dangerouslySetInnerHTML`\n"
         "• Evitar `window.location.reload()` — usar CustomEvent\n\n"
         "**Messages Server:**\n"
         "• Só 9 tipos de nodo (NÃO existem `api_call` ou `wait`)\n"
         "• `startFlow` é handled pelo FlowEngine, NÃO pelos ActionHandlers\n"
         "• Socket.IO paths DIFERENTES: admin `:3001/api/socket` vs messages `:9001`"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 17. MULTI-TURN E CONVERSAÇÕES COMPLEXAS
# ──────────────────────────────────────────────────────────────────────────────
MULTI_TURN = [
    make("Quero solicitar um serviço de saúde, como começo?",
         "Para solicitar um serviço de saúde:\n\n"
         "1. Selecione **📝 Solicitar Serviço** no menu\n"
         "2. Escolha a secretaria **🏥 Saúde**\n\n"
         "Temos 20 serviços disponíveis:\n"
         "• Consulta médica ou odontológica\n"
         "• Exames laboratoriais ou de imagem\n"
         "• Medicamentos (básicos ou de alto custo)\n"
         "• Vacinação\n"
         "• Transporte para tratamento (TFD)\n"
         "• Saúde mental (CAPS)\n"
         "• Atendimento domiciliar\n\n"
         "Qual serviço você precisa?"),

    make("Não encontro meu protocolo. O que devo fazer?",
         "Vou te ajudar! Tente assim:\n\n"
         "**1. Por número:**\n"
         "Vá em 🔍 Consultar Protocolo → Por número (formato: 2024-000123)\n\n"
         "**2. Listar todos:**\n"
         "Vá em 🔍 Consultar Protocolo → Listar meus protocolos\n\n"
         "**3. Se ainda não encontrar:**\n"
         "• Confirme se está logado com o CPF correto\n"
         "• Protocolos presenciais podem não estar no sistema digital\n"
         "• Contate a secretaria responsável pelo serviço\n\n"
         "Quer que eu te ajude a buscar agora?"),

    make("Qual é o prazo para minha solicitação de matrícula escolar?",
         "O prazo padrão para **Matrícula Escolar** é de **7 dias úteis**.\n\n"
         "Para verificar o status atual:\n"
         "1. Vá em 🔍 Consultar Protocolo\n"
         "2. Selecione sua solicitação\n"
         "3. Veja o status:\n"
         "   • **VINCULADO** — aguardando análise\n"
         "   • **PROGRESSO** — em análise\n"
         "   • **CONCLUIDO** — aprovada ✅\n"
         "   • **PENDENCIA** — documentação incompleta\n\n"
         "Em PENDENCIA, você pode adicionar um comentário com os documentos faltantes."),

    make("Preciso atualizar meu endereço. Como faço?",
         "Você pode atualizar seu endereço de duas formas:\n\n"
         "**1. Pelo DigiBot:**\n"
         "Vá em 👤 Meu Perfil → Editar dados → Endereço\n\n"
         "**2. Via portal:**\n"
         "Acesse `/cidadao/perfil` e edite seus dados\n\n"
         "**Campos:** CEP, logradouro, número, complemento (ou 'pular'), bairro\n\n"
         "⚠️ Manter o endereço atualizado é importante para serviços como Transporte Escolar e Saúde da Família."),

    make("Posso solicitar serviços para um familiar?",
         "Sim! O DigiUrban suporta solicitações para familiares de duas formas:\n\n"
         "**1. Composição familiar:**\n"
         "Registre seus familiares no sistema (🏠 Minha Família). Assim os dados ficam disponíveis.\n\n"
         "**2. Campos no formulário:**\n"
         "Vários serviços têm campos para terceiros:\n"
         "• `nomeAluno` (Educação)\n"
         "• `nomePaciente` (Saúde)\n"
         "• `nomeCrianca` (Social — Primeira Infância)\n"
         "• `nomeIdoso` (Social — Casa Lar)\n\n"
         "Você permanece como solicitante e pode acompanhar pelo seu protocolo."),

    make("Como funciona a avaliação de atendimento?",
         "Após um protocolo ser concluído, você pode avaliar o atendimento:\n\n"
         "1. Vá em **⭐ Avaliação** no menu principal\n"
         "2. Selecione o protocolo concluído\n"
         "3. Dê uma nota de 1 a 5 estrelas\n"
         "4. Adicione um comentário (opcional)\n"
         "5. Indique se recomendaria o serviço\n\n"
         "Suas avaliações ajudam a melhorar os serviços da prefeitura.\n\n"
         "⚠️ Os dados são salvos em `ProtocolEvaluationSimplified` com campos: `protocolId`, `rating`, `comment`, `wouldRecommend`."),
]

# ──────────────────────────────────────────────────────────────────────────────
# 18. VARIAÇÕES NATURAIS DE LINGUAGEM
# ──────────────────────────────────────────────────────────────────────────────
NATURAL_LANGUAGE = [
    make("oi", "Olá! 👋 Sou o DigiBot, assistente virtual da prefeitura. Como posso te ajudar hoje?\n\nVocê pode:\n• Solicitar serviços municipais\n• Consultar protocolos\n• Ver seus documentos\n• Gerenciar seu perfil\n\nDiga o que precisa!"),
    make("como solicito um serviço?", "Para solicitar um serviço municipal:\n1. Selecione **📝 Solicitar Serviço** no menu\n2. Escolha a secretaria responsável\n3. Selecione o serviço\n4. Preencha o formulário\n5. Envie os documentos (se necessário)\n6. Confirme — você receberá um número de protocolo!\n\nQual serviço você precisa? Posso te guiar diretamente."),
    make("tô com problema", "Que tipo de problema você está enfrentando?\n\n• **Problema com um serviço** → Posso ajudar a consultar o protocolo\n• **Dificuldade no sistema** → Me descreva e eu oriento\n• **Problema em serviço público** (buraco, iluminação) → Posso registrar uma solicitação\n• **Denúncia ou reclamação** → Posso encaminhar para a Ouvidoria\n\nDiga mais!"),
    make("quero saber do meu protocolo", "Para consultar:\n1. Vá em **🔍 Consultar Protocolo**\n2. Busque:\n   • **Por número** (formato: 2024-000123)\n   • **Listar todos** os seus protocolos\n\nVocê tem o número do protocolo?"),
    make("quero me inscrever no bolsa família", "Para se inscrever no **Bolsa Família Municipal** (complemento local):\n\n**Pré-requisito:** Ter CadÚnico (Cadastro Único). Se não tiver, precisamos fazer primeiro.\n\n**Documentos:** CadÚnico (NIS), CPF, RG, Comprovante de Residência, Comprovante de Renda\n\nVou te ajudar. Você já tem o **NIS do CadÚnico**?"),
    make("preciso de médico", "Para agendar consulta médica:\n\n1. Menu → **📝 Solicitar Serviço → Saúde → Agendamento de Consulta Médica**\n2. Tenha: Cartão SUS (15 dígitos) + RG ou CPF\n3. Escolha a especialidade: Clínico Geral, Pediatria, Ginecologia, etc.\n\n⏱️ Prazo: 7 dias úteis.\n\n**Urgência?** Se for emergência, use **Solicitação de Ambulância** ou ligue 192 (SAMU)."),
    make("meu filho não consegue vaga na creche", "Para solicitar vaga em creche (0 a 3 anos):\n\n**Documentos:** Certidão de Nascimento, RG e CPF do responsável, Comprovante de Residência, Comprovante de Trabalho, Cartão de Vacina\n\n**Formulário:** Nome e data de nascimento da criança, creche preferencial, turno (Integral/Matutino/Vespertino), situação de trabalho dos pais\n\n⏱️ Prazo: 30 dias (lista de espera conforme disponibilidade).\n\nDeseja que eu inicie o processo agora?"),
    make("como emitir certidão negativa?", "Para **Certidão Negativa de Débitos**:\n\n1. Vá em **📝 Solicitar Serviço → Finanças → Certidão Negativa de Débitos**\n\nComo é um serviço **SEM_DADOS** (consultivo), o sistema usa seus dados cadastrados automaticamente. Você não precisa preencher formulário adicional.\n\n⏱️ Prazo: rápido, geralmente no mesmo dia.\n\nPrecisa de certidão de que tipo? Municipal (IPTU, ISS) ou geral?"),
    make("perdi meu cartão SUS", "Para solicitar **2ª via do Cartão SUS**:\n\n1. Menu → **📝 Solicitar Serviço → Saúde → Cartão SUS — 2ª via**\n\n**Documentos necessários:** RG + CPF ou Certidão de Nascimento\n\nNenhum formulário extra necessário — o sistema usa seus dados cadastrais.\n\n⏱️ Prazo: **15 dias úteis**.\n\nO cartão será enviado para o endereço cadastrado no seu perfil."),
    make("quero denunciar um buraco na rua", "Para registrar solicitação de **Tapa-Buraco**:\n\n1. Menu → **📝 Solicitar Serviço → Obras Públicas → Tapa-Buraco**\n\nVocê precisará informar:\n• Endereço exato (rua, número, bairro, ponto de referência)\n• Descrição do problema\n• Fotos do buraco (opcional, mas ajuda muito!)\n\nDepois do envio, você recebe um número de protocolo para acompanhar.\n\nVou te ajudar a abrir a solicitação. O buraco é em qual rua?"),
]

# ──────────────────────────────────────────────────────────────────────────────
# 19. CITIZEN AI — analyzeTurn (classificação de intenção)
# System prompt idêntico ao CitizenAiClient para que o modelo aprenda o formato
# ──────────────────────────────────────────────────────────────────────────────
ANALYZE_TURN_SYSTEM = (
    "Voce e um classificador de intencao para atendimento municipal. "
    "Responda apenas com JSON valido. "
    "Intencoes permitidas: greeting, solicitar_servico, consultar_protocolo, corrigir_dados, "
    "meu_perfil, documentos, minha_familia, notificacoes, avaliacao, ajuda, atendimento_humano, unknown. "
    "Campos obrigatorios do JSON: intent, confidence. "
    "Campos opcionais: serviceQuery, protocolNumber, notes. "
    "Regras: "
    "- Use solicitar_servico quando o cidadao quer pedir, abrir, registrar ou solicitar um servico da prefeitura. "
    "- Use consultar_protocolo quando o cidadao quiser consultar andamento e informar ou insinuar numero de protocolo. "
    "- Use corrigir_dados quando o cidadao quer alterar uma informacao ja coletada no atendimento atual. "
    "- Use atendimento_humano quando pedir atendente, humano, servidor ou suporte humano. "
    "- serviceQuery deve ser uma consulta curta para buscar o servico correto. "
    "- confidence deve variar de 0 a 1."
)

def make_intent(user_msg, intent, confidence, extra=None):
    result = {"intent": intent, "confidence": confidence}
    if extra:
        result.update(extra)
    return {
        "conversations": [
            {"role": "system",  "content": ANALYZE_TURN_SYSTEM},
            {"role": "user",    "content": user_msg},
            {"role": "assistant","content": json.dumps(result, ensure_ascii=False)},
        ]
    }

def ctx(session="nenhum", history="sem historico relevante", msg=""):
    return (
        f"Contexto do fluxo atual: {session}\n"
        f"Historico recente: {history}\n"
        f"Mensagem atual: {msg}"
    )

ANALYZE_TURN = [
    # solicitar_servico
    make_intent(ctx(msg="quero marcar uma consulta médica"),
                "solicitar_servico", 0.97, {"serviceQuery": "consulta medica"}),
    make_intent(ctx(msg="preciso agendar dentista"),
                "solicitar_servico", 0.96, {"serviceQuery": "consulta odontologica"}),
    make_intent(ctx(msg="quero solicitar transporte escolar para meu filho"),
                "solicitar_servico", 0.97, {"serviceQuery": "transporte escolar"}),
    make_intent(ctx(msg="como faço pra pegar remédio de alto custo"),
                "solicitar_servico", 0.95, {"serviceQuery": "medicamentos alto custo"}),
    make_intent(ctx(msg="quero abrir um protocolo"),
                "solicitar_servico", 0.92, {"serviceQuery": "protocolo"}),
    make_intent(ctx(msg="preciso de cesta básica"),
                "solicitar_servico", 0.96, {"serviceQuery": "cesta basica"}),
    make_intent(ctx(msg="quero fazer matrícula da minha filha na escola"),
                "solicitar_servico", 0.97, {"serviceQuery": "matricula escolar"}),
    make_intent(ctx(msg="solicitar vaga em creche"),
                "solicitar_servico", 0.97, {"serviceQuery": "creche vaga"}),
    make_intent(ctx(msg="quero denunciar um buraco na rua"),
                "solicitar_servico", 0.94, {"serviceQuery": "tapa buraco obra"}),
    make_intent(ctx(msg="preciso de atestado de residência"),
                "solicitar_servico", 0.93, {"serviceQuery": "declaracao atestado residencia"}),
    make_intent(ctx(msg="quero pedir o cadastro único"),
                "solicitar_servico", 0.97, {"serviceQuery": "cadastro unico cadunico"}),
    make_intent(ctx(msg="me inscreve no bolsa família"),
                "solicitar_servico", 0.97, {"serviceQuery": "bolsa familia inscricao"}),
    make_intent(ctx(msg="quero licença pra construir"),
                "solicitar_servico", 0.95, {"serviceQuery": "alvara construcao licenca"}),
    make_intent(ctx(msg="preciso de ajuda com IPTU"),
                "solicitar_servico", 0.91, {"serviceQuery": "iptu parcelamento isencao"}),
    make_intent(ctx(msg="quero registrar reclamação na ouvidoria"),
                "solicitar_servico", 0.95, {"serviceQuery": "ouvidoria reclamacao"}),
    make_intent(ctx(msg="vacina pro meu filho"),
                "solicitar_servico", 0.96, {"serviceQuery": "vacinacao agendamento"}),
    make_intent(ctx(msg="quero ATER, assistência técnica rural"),
                "solicitar_servico", 0.97, {"serviceQuery": "assistencia tecnica rural ater"}),
    make_intent(ctx(msg="precisando de máquina agrícola da prefeitura"),
                "solicitar_servico", 0.95, {"serviceQuery": "maquinas agricolas"}),

    # consultar_protocolo
    make_intent(ctx(msg="quero ver meu protocolo 2024-001234"),
                "consultar_protocolo", 0.98, {"protocolNumber": "2024-001234"}),
    make_intent(ctx(msg="qual o status do protocolo 2025-000456"),
                "consultar_protocolo", 0.98, {"protocolNumber": "2025-000456"}),
    make_intent(ctx(msg="minha solicitação foi aprovada?"),
                "consultar_protocolo", 0.88),
    make_intent(ctx(msg="quero acompanhar minha solicitação de matrícula"),
                "consultar_protocolo", 0.90),
    make_intent(ctx(msg="cadê meu protocolo de consulta médica"),
                "consultar_protocolo", 0.89),
    make_intent(ctx(msg="me mostra os meus protocolos"),
                "consultar_protocolo", 0.93),
    make_intent(ctx(msg="protocolo 2024-009999 como está"),
                "consultar_protocolo", 0.97, {"protocolNumber": "2024-009999"}),

    # greeting
    make_intent(ctx(msg="oi"),             "greeting", 0.99),
    make_intent(ctx(msg="olá"),            "greeting", 0.99),
    make_intent(ctx(msg="bom dia"),        "greeting", 0.99),
    make_intent(ctx(msg="boa tarde"),      "greeting", 0.99),
    make_intent(ctx(msg="boa noite"),      "greeting", 0.99),
    make_intent(ctx(msg="tudo bem?"),      "greeting", 0.97),
    make_intent(ctx(msg="oi tudo certo?"), "greeting", 0.97),

    # meu_perfil
    make_intent(ctx(msg="quero atualizar meu telefone"),
                "meu_perfil", 0.95),
    make_intent(ctx(msg="mudar meu endereço"),
                "meu_perfil", 0.95),
    make_intent(ctx(msg="ver meus dados"),
                "meu_perfil", 0.92),
    make_intent(ctx(msg="editar meu email"),
                "meu_perfil", 0.94),

    # consultar_protocolo com contexto
    make_intent(ctx(session="menu_principal", history="cidadao perguntou sobre servicos",
                    msg="quero ver como está minha solicitação de transporte"),
                "consultar_protocolo", 0.91),

    # corrigir_dados
    make_intent(ctx(session="fill_form — especialidade coletada: Pediatria",
                    history="bot perguntou especialidade | cidadao respondeu Pediatria",
                    msg="na verdade é clínico geral"),
                "corrigir_dados", 0.97,
                {"notes": "cidadao quer mudar especialidade de Pediatria para Clinico Geral"}),
    make_intent(ctx(session="fill_form — data coletada: 10/06/2025",
                    history="bot coletou data",
                    msg="errei a data, é dia 15"),
                "corrigir_dados", 0.96,
                {"notes": "cidadao quer corrigir a data informada"}),
    make_intent(ctx(session="fill_form em andamento",
                    history="cidadao informou turno Manhã",
                    msg="pode mudar para tarde"),
                "corrigir_dados", 0.97,
                {"notes": "cidadao quer alterar turno de Manha para Tarde"}),

    # documentos
    make_intent(ctx(msg="quero ver meus documentos"),
                "documentos", 0.95),
    make_intent(ctx(msg="onde ficam meus arquivos"),
                "documentos", 0.90),
    make_intent(ctx(msg="preciso do meu histórico escolar"),
                "documentos", 0.88),

    # minha_familia
    make_intent(ctx(msg="quero cadastrar minha família"),
                "minha_familia", 0.95),
    make_intent(ctx(msg="adicionar meu filho na composição familiar"),
                "minha_familia", 0.96),

    # notificacoes
    make_intent(ctx(msg="ver minhas notificações"),
                "notificacoes", 0.96),
    make_intent(ctx(msg="tem algum aviso pra mim"),
                "notificacoes", 0.88),

    # avaliacao
    make_intent(ctx(msg="quero avaliar o atendimento"),
                "avaliacao", 0.96),
    make_intent(ctx(msg="dar nota pro serviço"),
                "avaliacao", 0.93),

    # ajuda
    make_intent(ctx(msg="como funciona esse sistema"),
                "ajuda", 0.92),
    make_intent(ctx(msg="o que posso fazer aqui"),
                "ajuda", 0.91),
    make_intent(ctx(msg="não entendi"),
                "ajuda", 0.85),

    # atendimento_humano
    make_intent(ctx(msg="quero falar com um atendente"),
                "atendimento_humano", 0.98),
    make_intent(ctx(msg="preciso de um humano"),
                "atendimento_humano", 0.97),
    make_intent(ctx(msg="me conecta com um servidor"),
                "atendimento_humano", 0.97),

    # unknown / ambiguos
    make_intent(ctx(msg="..."),              "unknown", 0.5),
    make_intent(ctx(msg="tanto faz"),        "unknown", 0.55),
    make_intent(ctx(msg="não sei"),          "unknown", 0.55),
    make_intent(ctx(msg="dsafjklçfdsa"),     "unknown", 0.3),
]

# ──────────────────────────────────────────────────────────────────────────────
# 20. CITIZEN AI — selectService (escolha de serviço entre candidatos)
# ──────────────────────────────────────────────────────────────────────────────
SELECT_SERVICE_SYSTEM = (
    "Voce deve escolher um servico municipal dentre as opcoes informadas. "
    "Responda apenas com JSON valido. "
    "Campos obrigatorios: selectedId, confidence. "
    "Se nenhuma opcao servir, retorne selectedId vazio e confidence baixa."
)

def make_select(user_msg, candidates_text, selected_id, confidence):
    user_content = f"Mensagem do cidadao: {user_msg}\nCandidatos:\n{candidates_text}"
    return {
        "conversations": [
            {"role": "system",   "content": SELECT_SERVICE_SYSTEM},
            {"role": "user",     "content": user_content},
            {"role": "assistant","content": json.dumps(
                {"selectedId": selected_id, "confidence": confidence},
                ensure_ascii=False)},
        ]
    }

_cands_saude = (
    "1. uuid-consulta-medica | Agendamento de Consulta Médica | Consulta médica nas UBS\n"
    "2. uuid-consulta-odonto | Agendamento de Consulta Odontológica | Atendimento dentário\n"
    "3. uuid-exames | Solicitação de Exames | Exames laboratoriais e de imagem\n"
    "4. uuid-vacina | Agendamento de Vacinação | Vacinas do calendário nacional"
)
_cands_edu = (
    "1. uuid-matricula | Matrícula Escolar | Matrícula na rede municipal\n"
    "2. uuid-creche | Inscrição em Creche | Vagas para 0 a 3 anos\n"
    "3. uuid-transporte | Transporte Escolar | Ônibus para alunos da rede\n"
    "4. uuid-eja | Inscrição em EJA | Educação de Jovens e Adultos"
)
_cands_social = (
    "1. uuid-cadunico | Cadastro Único — CadÚnico | Cadastro para programas sociais\n"
    "2. uuid-bolsa | Bolsa Família Municipal | Complemento local ao Bolsa Família\n"
    "3. uuid-cesta | Cesta Básica | Auxílio alimentar emergencial\n"
    "4. uuid-cras | Agendamento CRAS | Atendimento no centro de assistência social"
)
_cands_obras = (
    "1. uuid-tapa | Solicitação de Tapa-Buraco | Reparo de buracos em vias\n"
    "2. uuid-calcamento | Solicitação de Calçamento | Pavimentação de ruas\n"
    "3. uuid-ilum | Solicitação de Iluminação Pública | Postes e luminárias\n"
    "4. uuid-alvara | Alvará de Construção | Licença para obras"
)
_cands_admin = (
    "1. uuid-protocolo | Protocolo Online de Documentos | Protocolar requerimentos\n"
    "2. uuid-sic | Solicitação ao SIC | Acesso à informação pública\n"
    "3. uuid-ouvidoria | Manifestação na Ouvidoria | Elogios, reclamações e sugestões\n"
    "4. uuid-espaco | Uso de Espaço Público | Autorização para uso de praças"
)

SELECT_SERVICE = [
    make_select("quero marcar consulta médica",       _cands_saude, "uuid-consulta-medica", 0.97),
    make_select("preciso de dentista",                _cands_saude, "uuid-consulta-odonto", 0.96),
    make_select("quero fazer exame de sangue",        _cands_saude, "uuid-exames",          0.95),
    make_select("vacina pro bebê",                    _cands_saude, "uuid-vacina",           0.97),
    make_select("agendar vacinação",                  _cands_saude, "uuid-vacina",           0.97),
    make_select("quero resultado do exame",           _cands_saude, "uuid-exames",           0.88),

    make_select("matricular minha filha na escola",   _cands_edu, "uuid-matricula",   0.97),
    make_select("vaga em creche para bebê de 1 ano",  _cands_edu, "uuid-creche",      0.98),
    make_select("ônibus escolar para meu filho",      _cands_edu, "uuid-transporte",  0.97),
    make_select("quero estudar à noite, sou adulto",  _cands_edu, "uuid-eja",         0.94),
    make_select("inscrição EJA",                      _cands_edu, "uuid-eja",         0.98),

    make_select("preciso do CadÚnico",                _cands_social, "uuid-cadunico", 0.98),
    make_select("quero me inscrever no bolsa família",_cands_social, "uuid-bolsa",    0.96),
    make_select("preciso de cesta de alimentos",      _cands_social, "uuid-cesta",    0.95),
    make_select("agendar atendimento no CRAS",        _cands_social, "uuid-cras",     0.97),
    make_select("assistência social urgente",         _cands_social, "uuid-cras",     0.88),

    make_select("tem um buraco enorme na minha rua",  _cands_obras, "uuid-tapa",      0.97),
    make_select("rua sem asfalto no meu bairro",      _cands_obras, "uuid-calcamento",0.93),
    make_select("poste apagado na esquina",           _cands_obras, "uuid-ilum",      0.96),
    make_select("quero construir um muro, preciso de licença", _cands_obras, "uuid-alvara", 0.95),

    make_select("quero protocolar um requerimento",   _cands_admin, "uuid-protocolo", 0.96),
    make_select("pedir informação pública, LAI",      _cands_admin, "uuid-sic",       0.97),
    make_select("registrar reclamação na ouvidoria",  _cands_admin, "uuid-ouvidoria", 0.97),
    make_select("alugar praça para evento",           _cands_admin, "uuid-espaco",    0.93),

    # nenhum candidato serve
    make_select("quero falar com o prefeito diretamente",
                _cands_admin, "", 0.25),
    make_select("quero saber do meu horóscopo",
                _cands_saude, "", 0.05),
]

# ──────────────────────────────────────────────────────────────────────────────
# 21. CITIZEN AI — extractFields (extração de campos do formulário)
# ──────────────────────────────────────────────────────────────────────────────
EXTRACT_FIELDS_SYSTEM = (
    "Voce extrai dados estruturados de uma mensagem do cidadao para preenchimento de servico municipal. "
    "Responda apenas com JSON valido. "
    "Campos obrigatorios: values, confidence. "
    "Campo opcional: description. "
    "values deve ser um objeto onde cada chave corresponde exatamente a um field id informado. "
    "Nao invente valores. Se um campo nao estiver presente, nao inclua."
)

def make_extract(service, session, fields_text, citizen_msg, values, confidence, description=None):
    lines = [
        f"Servico: {service}",
        f"Contexto atual: {session}" if session else None,
        f"Campos disponiveis:\n{fields_text}",
        f"Mensagem do cidadao: {citizen_msg}",
    ]
    user_content = "\n".join(l for l in lines if l)
    result = {"values": values, "confidence": confidence}
    if description:
        result["description"] = description
    return {
        "conversations": [
            {"role": "system",   "content": EXTRACT_FIELDS_SYSTEM},
            {"role": "user",     "content": user_content},
            {"role": "assistant","content": json.dumps(result, ensure_ascii=False)},
        ]
    }

_f_consulta = (
    "especialidade | Especialidade | tipo=select | obrigatorio=sim | opcoes=Clinico Geral, Pediatria, Ginecologia, Cardiologia, Ortopedia\n"
    "unidadeSaude | Unidade de Saúde | tipo=text | obrigatorio=nao\n"
    "observacoes | Observações | tipo=text | obrigatorio=nao"
)
_f_matricula = (
    "nomeAluno | Nome do Aluno | tipo=text | obrigatorio=sim\n"
    "dataNascimento | Data de Nascimento | tipo=date | obrigatorio=sim\n"
    "nivel | Nível de Ensino | tipo=select | obrigatorio=sim | opcoes=Pre-Escola, Fund. I, Fund. II, EJA\n"
    "turno | Turno | tipo=select | obrigatorio=sim | opcoes=Matutino, Vespertino, Integral, Noturno\n"
    "escolaPreferencial | Escola Preferencial | tipo=text | obrigatorio=nao"
)
_f_tapa = (
    "logradouro | Rua/Avenida | tipo=text | obrigatorio=sim\n"
    "numero | Número/Referência | tipo=text | obrigatorio=nao\n"
    "bairro | Bairro | tipo=text | obrigatorio=sim\n"
    "descricao | Descrição do Problema | tipo=text | obrigatorio=sim"
)
_f_cadunico = (
    "nis | NIS (se já possuir) | tipo=text | obrigatorio=nao\n"
    "qtdPessoas | Quantidade de Pessoas na Família | tipo=number | obrigatorio=sim\n"
    "rendaFamiliar | Renda Familiar Mensal (R$) | tipo=number | obrigatorio=sim\n"
    "beneficiosRecebidos | Benefícios Já Recebidos | tipo=text | obrigatorio=nao"
)
_f_creche = (
    "nomeCrianca | Nome da Criança | tipo=text | obrigatorio=sim\n"
    "idadeMeses | Idade em Meses | tipo=number | obrigatorio=sim\n"
    "turno | Turno | tipo=select | obrigatorio=sim | opcoes=Integral, Matutino, Vespertino\n"
    "situacaoTrabalho | Situação de Trabalho | tipo=select | obrigatorio=sim | opcoes=Ambos trabalham, Apenas um trabalha, Familia monoparental"
)

EXTRACT_FIELDS = [
    # consulta médica
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "quero clínico geral na UBS Centro",
                 {"especialidade": "Clinico Geral", "unidadeSaude": "UBS Centro"}, 0.96),
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "pediatria para minha filha",
                 {"especialidade": "Pediatria"}, 0.95),
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "cardiologista, tenho problema no coração",
                 {"especialidade": "Cardiologia"}, 0.93,
                 "cidadao relata problema cardiaco"),
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "ginecologia",
                 {"especialidade": "Ginecologia"}, 0.97),
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "ortopedia, dói muito meu joelho",
                 {"especialidade": "Ortopedia"}, 0.95,
                 "cidadao relata dor no joelho"),

    # matrícula escolar
    make_extract("Matrícula Escolar", None, _f_matricula,
                 "João Silva, nasceu em 10/03/2016, quero fundamental 1 de manhã",
                 {"nomeAluno": "Joao Silva", "dataNascimento": "2016-03-10",
                  "nivel": "Fund. I", "turno": "Matutino"}, 0.94),
    make_extract("Matrícula Escolar", None, _f_matricula,
                 "minha filha Ana, 5 anos, pré-escola vespertino na Escola Girassol",
                 {"nomeAluno": "Ana", "nivel": "Pre-Escola",
                  "turno": "Vespertino", "escolaPreferencial": "Escola Girassol"}, 0.90),
    make_extract("Matrícula Escolar", None, _f_matricula,
                 "EJA noturno para o Pedro",
                 {"nomeAluno": "Pedro", "nivel": "EJA", "turno": "Noturno"}, 0.93),

    # tapa-buraco
    make_extract("Solicitação de Tapa-Buraco", None, _f_tapa,
                 "rua das flores número 120 bairro centro, buraco enorme quase engoliu meu carro",
                 {"logradouro": "Rua das Flores", "numero": "120",
                  "bairro": "Centro", "descricao": "buraco enorme quase engoliu meu carro"}, 0.95),
    make_extract("Solicitação de Tapa-Buraco", None, _f_tapa,
                 "avenida principal, perto da padaria, bairro jardim novo",
                 {"logradouro": "Avenida Principal", "numero": "perto da padaria",
                  "bairro": "Jardim Novo"}, 0.85),

    # CadÚnico
    make_extract("Cadastro Único — CadÚnico", None, _f_cadunico,
                 "somos 4 pessoas, renda de 800 reais por mês, não recebo nenhum benefício",
                 {"qtdPessoas": 4, "rendaFamiliar": 800.0,
                  "beneficiosRecebidos": "nenhum"}, 0.96),
    make_extract("Cadastro Único — CadÚnico", None, _f_cadunico,
                 "família de 3, ganhamos 600, já tenho NIS 12345678901",
                 {"nis": "12345678901", "qtdPessoas": 3, "rendaFamiliar": 600.0}, 0.94),

    # creche
    make_extract("Inscrição em Creche", None, _f_creche,
                 "meu filho Mateus, 18 meses, integral, eu e meu marido trabalhamos",
                 {"nomeCrianca": "Mateus", "idadeMeses": 18,
                  "turno": "Integral", "situacaoTrabalho": "Ambos trabalham"}, 0.96),
    make_extract("Inscrição em Creche", None, _f_creche,
                 "Beatriz, 8 meses, matutino, sou mãe solo",
                 {"nomeCrianca": "Beatriz", "idadeMeses": 8,
                  "turno": "Matutino", "situacaoTrabalho": "Familia monoparental"}, 0.95),

    # mensagem vaga — extrai o que consegue
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "quero agendar qualquer médico disponível",
                 {"especialidade": "Clinico Geral"}, 0.72),
    make_extract("Agendamento de Consulta Médica", None, _f_consulta,
                 "tenho febre e dor de cabeça",
                 {"especialidade": "Clinico Geral"}, 0.78,
                 "cidadao descreve sintomas de gripe, encaminhado para clinico geral"),

    # sem dados suficientes
    make_extract("Matrícula Escolar", None, _f_matricula,
                 "quero fazer matrícula",
                 {}, 0.3),
]

# ──────────────────────────────────────────────────────────────────────────────
# 22. CITIZEN AI — extractCorrection (identificação de correção)
# ──────────────────────────────────────────────────────────────────────────────
EXTRACT_CORRECTION_SYSTEM = (
    "Voce identifica correcoes em um atendimento municipal em andamento. "
    "Responda apenas com JSON valido. "
    "Campos obrigatorios: confidence. "
    "Campos opcionais: fieldId, value, description. "
    "Use fieldId apenas se a mensagem indicar claramente qual campo deve mudar. "
    "Use description quando a correcao for sobre a descricao geral da solicitacao. "
    "Nao invente dados e nao altere campos que nao foram citados."
)

def make_correction(service, session, fields_text, citizen_msg, result):
    user_content = (
        f"Servico: {service}\n"
        f"Contexto atual: {session}\n"
        f"Campos corrigiveis:\n{fields_text}\n"
        f"Mensagem do cidadao: {citizen_msg}"
    )
    return {
        "conversations": [
            {"role": "system",   "content": EXTRACT_CORRECTION_SYSTEM},
            {"role": "user",     "content": user_content},
            {"role": "assistant","content": json.dumps(result, ensure_ascii=False)},
        ]
    }

_fields_consulta_corr = (
    "especialidade | Especialidade | tipo=select | opcoes=Clinico Geral, Pediatria, Ginecologia, Cardiologia\n"
    "unidadeSaude | Unidade de Saúde | tipo=text\n"
    "observacoes | Observações | tipo=text"
)
_fields_matricula_corr = (
    "nomeAluno | Nome do Aluno | tipo=text\n"
    "nivel | Nível de Ensino | tipo=select | opcoes=Pre-Escola, Fund. I, Fund. II, EJA\n"
    "turno | Turno | tipo=select | opcoes=Matutino, Vespertino, Integral, Noturno\n"
    "escolaPreferencial | Escola Preferencial | tipo=text"
)
_fields_cadunico_corr = (
    "qtdPessoas | Quantidade de Pessoas | tipo=number\n"
    "rendaFamiliar | Renda Familiar (R$) | tipo=number\n"
    "beneficiosRecebidos | Benefícios Recebidos | tipo=text"
)

EXTRACT_CORRECTION = [
    # especialidade
    make_correction("Agendamento de Consulta Médica",
                    "especialidade coletada: Pediatria",
                    _fields_consulta_corr,
                    "na verdade é clínico geral",
                    {"fieldId": "especialidade", "value": "Clinico Geral", "confidence": 0.97}),
    make_correction("Agendamento de Consulta Médica",
                    "especialidade coletada: Ginecologia",
                    _fields_consulta_corr,
                    "errei, quero cardiologia",
                    {"fieldId": "especialidade", "value": "Cardiologia", "confidence": 0.96}),
    make_correction("Agendamento de Consulta Médica",
                    "unidade coletada: UBS Norte",
                    _fields_consulta_corr,
                    "pode mudar para UBS Sul por favor",
                    {"fieldId": "unidadeSaude", "value": "UBS Sul", "confidence": 0.97}),

    # turno
    make_correction("Matrícula Escolar",
                    "turno coletado: Matutino",
                    _fields_matricula_corr,
                    "muda para vespertino",
                    {"fieldId": "turno", "value": "Vespertino", "confidence": 0.97}),
    make_correction("Matrícula Escolar",
                    "turno coletado: Vespertino",
                    _fields_matricula_corr,
                    "integral por favor",
                    {"fieldId": "turno", "value": "Integral", "confidence": 0.96}),

    # nivel
    make_correction("Matrícula Escolar",
                    "nivel coletado: Fund. I",
                    _fields_matricula_corr,
                    "não, minha filha é pré-escola",
                    {"fieldId": "nivel", "value": "Pre-Escola", "confidence": 0.96}),

    # nome
    make_correction("Matrícula Escolar",
                    "nomeAluno coletado: Joao",
                    _fields_matricula_corr,
                    "o nome correto é João Pedro",
                    {"fieldId": "nomeAluno", "value": "Joao Pedro", "confidence": 0.97}),

    # escola
    make_correction("Matrícula Escolar",
                    "escola preferencial: Escola Girassol",
                    _fields_matricula_corr,
                    "prefiro a Escola Municipal Dom Bosco",
                    {"fieldId": "escolaPreferencial", "value": "Escola Municipal Dom Bosco", "confidence": 0.95}),

    # descrição geral
    make_correction("Solicitação de Tapa-Buraco",
                    "descricao coletada: buraco pequeno",
                    "descricao | Descrição do Problema | tipo=text",
                    "não é pequeno não, é um buraco enorme que toma metade da rua",
                    {"fieldId": "descricao",
                     "value": "buraco enorme que toma metade da rua",
                     "confidence": 0.96}),

    # renda
    make_correction("Cadastro Único — CadÚnico",
                    "rendaFamiliar coletada: 500",
                    _fields_cadunico_corr,
                    "corrijo, é 650 reais",
                    {"fieldId": "rendaFamiliar", "value": 650, "confidence": 0.97}),

    # quantidade de pessoas
    make_correction("Cadastro Único — CadÚnico",
                    "qtdPessoas coletada: 3",
                    _fields_cadunico_corr,
                    "somos 4 na verdade, esqueci de contar minha mãe",
                    {"fieldId": "qtdPessoas", "value": 4, "confidence": 0.96}),

    # correção ambígua — não identifica campo específico
    make_correction("Agendamento de Consulta Médica",
                    "dados coletados: especialidade=Cardiologia",
                    _fields_consulta_corr,
                    "não é bem isso que eu queria",
                    {"confidence": 0.45}),

    # não é correção
    make_correction("Agendamento de Consulta Médica",
                    "especialidade coletada: Clinico Geral",
                    _fields_consulta_corr,
                    "tá bom assim",
                    {"confidence": 0.15}),
]

# ──────────────────────────────────────────────────────────────────────────────
# 23. CITIZEN AI — generateGuidance (mensagem + ações sugeridas)
# ──────────────────────────────────────────────────────────────────────────────
GENERATE_GUIDANCE_SYSTEM = (
    "Voce e o DigiBot, assistente municipal do Digiurban. "
    "Responda apenas com JSON valido. "
    "Campos obrigatorios: message, suggestedActionIds, confidence. "
    "message deve ser curta, natural e contextual, com no maximo 2 frases. "
    "suggestedActionIds deve conter no maximo 3 ids existentes na lista de acoes permitidas. "
    "Nao invente servicos, protocolos, dados pessoais, prazos ou informacoes que nao estejam no contexto. "
    "Se a mensagem estiver confusa, diga o que entendeu e conduza para a melhor proxima acao. "
    "Se houver erro de digitacao, interprete a intencao provavel sem comentar o erro. "
    "Mensagens curtas como 'saude', 'documentos', 'perfil', 'protocolo' ou 'familia' devem ser conduzidas para a acao mais provavel. "
    "Sempre sugira acoes interativas; nao deixe a conversa terminar sem uma proxima opcao clara."
)

_actions_menu = (
    "solicitar_servico | Solicitar Serviço | Abrir nova solicitação\n"
    "consultar_protocolo | Consultar Protocolo | Ver andamento de solicitações\n"
    "meu_perfil | Meu Perfil | Ver e editar dados pessoais\n"
    "documentos | Meus Documentos | Acessar documentos\n"
    "minha_familia | Minha Família | Gerenciar composição familiar\n"
    "notificacoes | Notificações | Central de avisos\n"
    "avaliacao | Avaliação | Avaliar atendimentos\n"
    "ajuda | Ajuda | Tirar dúvidas"
)
_actions_servico = (
    "confirmar_servico | Confirmar este serviço | Prosseguir com o serviço selecionado\n"
    "outro_servico | Escolher outro serviço | Ver outros serviços desta secretaria\n"
    "outra_secretaria | Outra secretaria | Voltar para escolha de secretaria\n"
    "cancelar | Cancelar | Voltar ao menu principal"
)
_actions_protocolo = (
    "ver_historico | Ver Histórico | Acompanhar interações\n"
    "adicionar_comentario | Adicionar Comentário | Enviar mensagem para a secretaria\n"
    "ver_documentos | Ver Documentos | Acessar arquivos do protocolo\n"
    "consultar_outro | Consultar Outro | Buscar outro protocolo\n"
    "menu_principal | Menu Principal | Voltar ao início"
)

def make_guidance(session, history, msg, actions_text, guidance_msg, action_ids, confidence,
                  search_summary=None):
    lines = [
        f"Contexto do fluxo: {session}",
        f"Historico recente: {history}",
        f"Resultado da busca interna: {search_summary}" if search_summary else None,
        f"Acoes permitidas:\n{actions_text}",
        f"Mensagem do cidadao: {msg}",
    ]
    user_content = "\n".join(l for l in lines if l)
    return {
        "conversations": [
            {"role": "system",   "content": GENERATE_GUIDANCE_SYSTEM},
            {"role": "user",     "content": user_content},
            {"role": "assistant","content": json.dumps(
                {"message": guidance_msg, "suggestedActionIds": action_ids, "confidence": confidence},
                ensure_ascii=False)},
        ]
    }

GENERATE_GUIDANCE = [
    # triagem inicial — saudação
    make_guidance("triagem inicial", "sem historico", "oi", _actions_menu,
                  "Olá! Como posso te ajudar hoje?",
                  ["solicitar_servico", "consultar_protocolo", "ajuda"], 0.99),
    make_guidance("triagem inicial", "sem historico", "bom dia", _actions_menu,
                  "Bom dia! O que você precisa?",
                  ["solicitar_servico", "consultar_protocolo", "meu_perfil"], 0.99),

    # mensagens curtas
    make_guidance("triagem inicial", "sem historico", "saude", _actions_menu,
                  "Vou te ajudar com serviços de saúde! Quer solicitar um serviço ou consultar uma solicitação?",
                  ["solicitar_servico", "consultar_protocolo"], 0.95),
    make_guidance("triagem inicial", "sem historico", "protocolo", _actions_menu,
                  "Claro! Quer consultar o andamento de uma solicitação?",
                  ["consultar_protocolo", "solicitar_servico"], 0.95),
    make_guidance("triagem inicial", "sem historico", "familia", _actions_menu,
                  "Vou abrir a seção de família para você!",
                  ["minha_familia"], 0.96),
    make_guidance("triagem inicial", "sem historico", "documentos", _actions_menu,
                  "Aqui você pode acessar seus documentos.",
                  ["documentos"], 0.96),
    make_guidance("triagem inicial", "sem historico", "perfil", _actions_menu,
                  "Vou abrir seu perfil para você visualizar e editar seus dados.",
                  ["meu_perfil"], 0.96),

    # intenção clara de solicitar serviço
    make_guidance("triagem inicial", "sem historico",
                  "quero marcar consulta médica", _actions_menu,
                  "Perfeito! Vou te encaminhar para solicitar o agendamento de consulta médica.",
                  ["solicitar_servico"], 0.97,
                  "Agendamento de Consulta Médica encontrado na secretaria de Saúde"),
    make_guidance("triagem inicial", "sem historico",
                  "preciso de cesta básica urgente", _actions_menu,
                  "Entendido! Vou abrir a solicitação de cesta básica para você.",
                  ["solicitar_servico"], 0.96,
                  "Cesta Básica encontrada na secretaria de Assistência Social"),
    make_guidance("triagem inicial", "sem historico",
                  "quero denunciar falta de iluminação na rua", _actions_menu,
                  "Certo, vou te ajudar a registrar a solicitação de iluminação pública.",
                  ["solicitar_servico"], 0.94,
                  "Solicitação de Iluminação Pública encontrada em Obras Públicas"),

    # serviço selecionado — confirmação
    make_guidance("show_service_details — Agendamento de Consulta Médica",
                  "cidadao selecionou Consulta Medica",
                  "sim, é isso mesmo", _actions_servico,
                  "Ótimo! Vamos prosseguir com o Agendamento de Consulta Médica.",
                  ["confirmar_servico"], 0.98),
    make_guidance("show_service_details — Matrícula Escolar",
                  "cidadao selecionou Matricula",
                  "quero outro serviço", _actions_servico,
                  "Sem problema! Qual outro serviço você precisa?",
                  ["outro_servico", "outra_secretaria"], 0.96),
    make_guidance("show_service_details — Cesta Básica",
                  "cidadao visualizou detalhes",
                  "cancela", _actions_servico,
                  "Tudo bem! Retornando ao menu principal.",
                  ["cancelar"], 0.99),

    # protocolo encontrado — ações
    make_guidance("show_protocol_details — protocolo 2024-001234 — status PROGRESSO",
                  "cidadao consultou protocolo",
                  "quero ver o histórico", _actions_protocolo,
                  "Vou mostrar o histórico de interações do seu protocolo.",
                  ["ver_historico"], 0.98),
    make_guidance("show_protocol_details — protocolo 2024-005678 — status PENDENCIA",
                  "cidadao viu status Pendência",
                  "tem documentos faltando?", _actions_protocolo,
                  "Sim, há uma pendência. Veja os documentos do protocolo para mais detalhes.",
                  ["ver_documentos", "adicionar_comentario"], 0.93),
    make_guidance("show_protocol_details",
                  "cidadao consultou protocolo",
                  "quero mandar uma mensagem pra secretaria", _actions_protocolo,
                  "Claro! Você pode adicionar um comentário e a secretaria receberá sua mensagem.",
                  ["adicionar_comentario"], 0.97),

    # confuso / ambíguo
    make_guidance("triagem inicial", "sem historico",
                  "quero uma coisa lá", _actions_menu,
                  "Pode me dizer com mais detalhes o que você precisa? Posso ajudar com serviços, protocolos, perfil e mais.",
                  ["solicitar_servico", "consultar_protocolo", "ajuda"], 0.55),
    make_guidance("triagem inicial", "sem historico",
                  "dsadsa", _actions_menu,
                  "Não entendi bem. Posso te ajudar a solicitar um serviço ou consultar um protocolo!",
                  ["solicitar_servico", "consultar_protocolo", "ajuda"], 0.3),

    # erro de digitação
    make_guidance("triagem inicial", "sem historico",
                  "queru marcá consulta medica", _actions_menu,
                  "Vou te ajudar a agendar uma consulta médica!",
                  ["solicitar_servico"], 0.93,
                  "Agendamento de Consulta Médica encontrado"),
    make_guidance("triagem inicial", "sem historico",
                  "precizo de cesta bazica", _actions_menu,
                  "Entendido! Vou abrir a solicitação de cesta básica para você.",
                  ["solicitar_servico"], 0.91,
                  "Cesta Básica encontrada em Assistência Social"),

    # atendimento humano
    make_guidance("triagem inicial", "sem historico",
                  "quero falar com um atendente humano", _actions_menu,
                  "Estou transferindo você para um atendente. Por favor, aguarde.",
                  ["solicitar_servico", "ajuda"], 0.98),

    # retorno ao menu
    make_guidance("show_protocol_details",
                  "cidadao terminou de ver protocolo",
                  "voltar ao início", _actions_protocolo,
                  "Retornando ao menu principal. Como posso te ajudar?",
                  ["menu_principal"], 0.99),
]

# ──────────────────────────────────────────────────────────────────────────────
# CONSOLIDAR TUDO
# ──────────────────────────────────────────────────────────────────────────────
ALL_PAIRS = (
    IDENTITY +
    BACKEND_ARCH +
    MESSAGES_ARCH +
    FLOW_GENERATION +
    HEALTH_SERVICES +
    EDUCATION_SERVICES +
    SOCIAL_SERVICES +
    AGRICULTURE_SERVICES +
    ADMINISTRATION_SERVICES +
    OTHER_SECRETARIAS +
    SERVICE_RULES +
    SERVER_VIEW +
    FRONTEND_ARCH +
    DOCKER_DEPLOY +
    AUTOMATION +
    ERROR_HANDLING +
    MULTI_TURN +
    NATURAL_LANGUAGE +
    ANALYZE_TURN +
    SELECT_SERVICE +
    EXTRACT_FIELDS +
    EXTRACT_CORRECTION +
    GENERATE_GUIDANCE
)

# ──────────────────────────────────────────────────────────────────────────────
# SALVAR JSONL
# ──────────────────────────────────────────────────────────────────────────────
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "digibot_dataset.jsonl")

with open(OUT, "w", encoding="utf-8") as f:
    for record in ALL_PAIRS:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

# Validação
with open(OUT, encoding="utf-8") as f:
    lines = [l for l in f if l.strip()]

print(f"✅ Dataset gerado: {OUT}")
print(f"   Total de exemplos: {len(lines)}")
print(f"\n   Distribuição por categoria:")
print(f"     Identidade e visão geral:      {len(IDENTITY)}")
print(f"     Arquitetura backend:            {len(BACKEND_ARCH)}")
print(f"     Messages Server / DigiBot:      {len(MESSAGES_ARCH)}")
print(f"     Geração de fluxos JSON:         {len(FLOW_GENERATION)}")
print(f"     Serviços Saúde:                 {len(HEALTH_SERVICES)}")
print(f"     Serviços Educação:              {len(EDUCATION_SERVICES)}")
print(f"     Serviços Assistência Social:    {len(SOCIAL_SERVICES)}")
print(f"     Serviços Agricultura:           {len(AGRICULTURE_SERVICES)}")
print(f"     Serviços Administração:         {len(ADMINISTRATION_SERVICES)}")
print(f"     Demais secretarias:             {len(OTHER_SECRETARIAS)}")
print(f"     Tipos de serviço / regras:      {len(SERVICE_RULES)}")
print(f"     Perspectiva servidor público:   {len(SERVER_VIEW)}")
print(f"     Frontend:                       {len(FRONTEND_ARCH)}")
print(f"     Docker / Deploy / IA:           {len(DOCKER_DEPLOY)}")
print(f"     Automação técnica:              {len(AUTOMATION)}")
print(f"     Tratamento de erros / gotchas:  {len(ERROR_HANDLING)}")
print(f"     Multi-turn conversação:         {len(MULTI_TURN)}")
print(f"     Linguagem natural:              {len(NATURAL_LANGUAGE)}")
print(f"     CitizenAI — analyzeTurn:        {len(ANALYZE_TURN)}")
print(f"     CitizenAI — selectService:      {len(SELECT_SERVICE)}")
print(f"     CitizenAI — extractFields:      {len(EXTRACT_FIELDS)}")
print(f"     CitizenAI — extractCorrection:  {len(EXTRACT_CORRECTION)}")
print(f"     CitizenAI — generateGuidance:   {len(GENERATE_GUIDANCE)}")

# Verificar que cada linha é JSON válido
errors = 0
for i, line in enumerate(lines):
    try:
        obj = json.loads(line)
        assert "conversations" in obj
        assert len(obj["conversations"]) == 3
    except Exception as e:
        print(f"❌ Erro na linha {i+1}: {e}")
        errors += 1

if errors == 0:
    print(f"\n✅ Todas as {len(lines)} linhas são válidas!")
else:
    print(f"\n⚠️ {errors} erros encontrados!")
