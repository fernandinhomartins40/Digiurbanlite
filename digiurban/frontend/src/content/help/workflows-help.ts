import type { HelpContent } from '@/src/types/help-system'

export const workflowsHelpContent: HelpContent = {
  pageTitle: 'Central de Ajuda - Workflows de Módulos',
  pageDescription: 'Aprenda a criar e gerenciar fluxos de trabalho para os serviços da prefeitura',

  quickTips: [
    'Workflows são como "roteiros" que cada protocolo segue desde a criação até a conclusão',
    'Cada serviço público pode ter seu próprio workflow personalizado',
    'Use o botão "⚡ Criar Workflows Padrão" para começar rapidamente com 100+ workflows prontos',
    'Você pode editar workflows existentes a qualquer momento',
    'Workflows já aplicados a protocolos não podem ser deletados (apenas desativados)'
  ],

  sections: [
    {
      id: 'o-que-sao-workflows',
      emoji: '🔄',
      title: 'O que são Workflows?',
      description: 'Entenda o conceito e importância dos workflows',
      steps: [
        {
          id: 'conceito-basico',
          title: 'Conceito Básico',
          description: 'Workflows são fluxos de trabalho estruturados que definem todas as etapas que um protocolo deve passar desde sua criação até a conclusão final. Pense neles como um "mapa do caminho" que cada solicitação de serviço percorre dentro da prefeitura.',
          tips: [
            'Cada workflow é composto por várias etapas sequenciais',
            'As etapas seguem uma ordem lógica (ex: Novo → Análise → Aprovado → Concluído)',
            'Cada etapa pode ter prazos (SLA) específicos',
            'Você pode definir documentos e ações obrigatórias para cada etapa'
          ]
        },
        {
          id: 'exemplo-pratico',
          title: 'Exemplo Prático: Matrícula Escolar',
          description: 'Vamos ver como funciona na prática. Quando um cidadão solicita uma matrícula escolar, o protocolo passa pelas seguintes etapas:\n\n1️⃣ **Novo** (1 dia) - Protocolo recém criado, aguardando triagem\n2️⃣ **Em Análise** (3 dias) - Servidor verifica documentos e disponibilidade de vagas\n3️⃣ **Pendente** (2 dias) - Caso falte algum documento, aguarda complementação\n4️⃣ **Aprovado** (1 dia) - Matrícula aprovada, gerando número de matrícula\n5️⃣ **Concluído** (1 dia) - Família notificada, processo finalizado\n\n**Total do processo:** 5-8 dias úteis',
          tips: [
            'O sistema calcula automaticamente o prazo total somando os SLAs de cada etapa',
            'Se um documento estiver faltando, o protocolo vai para "Pendente" automaticamente',
            'Cada transição entre etapas fica registrada no histórico'
          ],
          warnings: [
            'Etapas puladas (ex: ir direto de "Novo" para "Aprovado") podem gerar inconsistências',
            'Sempre siga a ordem lógica definida no workflow'
          ]
        },
        {
          id: 'por-que-usar',
          title: 'Por que usar Workflows?',
          description: 'Os workflows trazem diversos benefícios para a gestão municipal:\n\n✅ **Padronização** - Todos os protocolos do mesmo tipo seguem o mesmo processo\n✅ **Transparência** - Cidadãos sabem em qual etapa está sua solicitação\n✅ **Controle de Prazos** - Sistema alerta quando SLA está próximo de vencer\n✅ **Auditoria** - Histórico completo de todas as movimentações\n✅ **Eficiência** - Reduz retrabalho e esquecimentos',
          tips: [
            'Workflows bem estruturados reduzem o tempo de atendimento em até 40%',
            'Cidadãos podem acompanhar o andamento em tempo real pelo portal',
            'Gestores têm visão geral de todos os protocolos por etapa'
          ]
        }
      ],
      faqs: [
        {
          question: 'Todo serviço precisa ter um workflow?',
          answer: 'Não obrigatoriamente, mas é altamente recomendado. Serviços simples podem funcionar sem workflow, mas perdem os benefícios de controle e rastreamento.'
        },
        {
          question: 'Posso criar workflows diferentes para o mesmo tipo de serviço?',
          answer: 'Não. Cada tipo de módulo (ex: MATRICULA_ESCOLAR) tem apenas um workflow. Isso garante padronização e consistência.'
        }
      ]
    },

    {
      id: 'criando-workflows',
      emoji: '➕',
      title: 'Criando Workflows',
      description: 'Aprenda a criar workflows do zero ou usar modelos prontos',
      steps: [
        {
          id: 'workflows-padrao',
          title: 'Opção 1: Usar Workflows Padrão (Recomendado)',
          description: 'A forma mais rápida de começar é usando os workflows pré-configurados que vêm com o sistema:\n\n**Como fazer:**\n1. Clique no botão **"⚡ Criar Workflows Padrão"** no topo da página\n2. O sistema criará automaticamente mais de 100 workflows prontos\n3. Workflows criados incluem:\n   - 11 módulos de Saúde (Atendimentos, Agendamentos, Controle de Medicamentos...)\n   - 13 módulos de Educação (Matrículas, Transferências, Transporte Escolar...)\n   - 72+ módulos de outras secretarias (Assistência Social, Habitação, Cultura...)\n\n**Vantagens:**\n- Implementação em 1 clique\n- Etapas já testadas e otimizadas\n- SLAs baseados em boas práticas municipais\n- Pronto para usar imediatamente',
          tips: [
            'Execute esta ação apenas uma vez. O sistema evita duplicações',
            'Após criar, você pode editar qualquer workflow para ajustar às necessidades da sua prefeitura',
            'Os workflows padrão seguem a Lei de Acesso à Informação (LAI) e boas práticas da administração pública'
          ],
          warnings: [
            'Esta operação pode levar alguns segundos, aguarde a confirmação',
            'Não feche a página durante a criação dos workflows'
          ]
        },
        {
          id: 'workflow-customizado',
          title: 'Opção 2: Criar Workflow Personalizado',
          description: 'Para serviços únicos da sua prefeitura, você pode criar workflows do zero:\n\n**Passo a passo:**\n\n1. Clique no botão **"+ Novo Workflow"**\n\n2. Preencha as informações básicas:\n   - **Tipo de Módulo**: Digite em MAIÚSCULAS (ex: LICENCA_AMBIENTAL)\n   - **Nome**: Nome descritivo (ex: "Licença Ambiental")\n   - **Descrição**: Explique para que serve (ex: "Licenciamento de atividades potencialmente poluidoras")\n   - **SLA Padrão**: Prazo total em dias úteis (ex: 30)\n\n3. Adicione as etapas clicando em **"+ Adicionar Etapa"**:\n   - **Nome da Etapa**: Ex: "Análise Técnica"\n   - **SLA**: Dias para concluir esta etapa (ex: 15)\n   - **Permitir Pular**: Marque se esta etapa pode ser opcional\n   \n4. Organize as etapas usando os botões ↑ ↓\n\n5. Clique em **"Salvar Workflow"**',
          tips: [
            'Defina etapas curtas e específicas. É melhor ter 7 etapas de 2-3 dias do que 2 etapas de 15 dias',
            'Use nomes claros para as etapas: "Em Análise Técnica" é melhor que "Processando"',
            'O sistema ordena automaticamente as etapas pela ordem que você definir',
            'Sempre inclua uma etapa inicial (ex: "Novo") e uma final (ex: "Concluído")'
          ],
          warnings: [
            'O Tipo de Módulo não pode ser alterado depois de criado',
            'Certifique-se que o Tipo de Módulo é ÚNICO (sem espaços, use _ para separar)',
            'Não use caracteres especiais ou acentos no Tipo de Módulo'
          ]
        },
        {
          id: 'definindo-etapas',
          title: 'Boas Práticas para Definir Etapas',
          description: 'Siga estas diretrizes ao criar etapas do workflow:\n\n**Estrutura Típica de Etapas:**\n\n1. **Etapa de Recepção** (1-2 dias)\n   - Ex: "Novo", "Protocolo Recebido"\n   - SLA curto, apenas para triagem inicial\n\n2. **Etapa de Análise** (3-15 dias)\n   - Ex: "Em Análise", "Análise Técnica"\n   - Prazo maior, aqui ocorre a avaliação principal\n\n3. **Etapa de Pendência** (2-5 dias)\n   - Ex: "Aguardando Documentos", "Pendente"\n   - Para quando algo precisa ser complementado\n\n4. **Etapa de Decisão** (1-3 dias)\n   - Ex: "Aprovado", "Reprovado", "Em Aprovação"\n   - Decisão final sobre o protocolo\n\n5. **Etapa de Conclusão** (1-2 dias)\n   - Ex: "Concluído", "Arquivado"\n   - Finalização e notificação ao cidadão\n\n**Etapas Opcionais:**\n- "Vistoria de Campo" (para obras, licenças)\n- "Parecer Jurídico" (para casos complexos)\n- "Aprovação Gerencial" (para valores altos)',
          tips: [
            'Coloque SLAs realistas. É melhor cumprir 5 dias do que atrasar 3 dias',
            'Considere feriados e períodos de férias ao definir prazos',
            'Etapas de decisão (Aprovado/Reprovado) devem ter SLA curto (1-2 dias)',
            'Sempre tenha uma rota para "Cancelado" caso o cidadão desista'
          ]
        }
      ],
      faqs: [
        {
          question: 'Quantas etapas devo criar?',
          answer: 'O ideal é entre 5 a 10 etapas. Menos de 5 pode ser muito genérico, mais de 10 pode ser burocrático demais.'
        },
        {
          question: 'Posso ter etapas sem SLA?',
          answer: 'Sim, mas não é recomendado. Etapas sem SLA não geram alertas de atraso.'
        },
        {
          question: 'O que significa "Permitir Pular Etapa"?',
          answer: 'Permite que casos especiais pulem aquela etapa. Por exemplo, casos urgentes podem pular "Análise Inicial" e ir direto para "Análise Prioritária".'
        }
      ]
    },

    {
      id: 'gerenciando-workflows',
      emoji: '⚙️',
      title: 'Gerenciando Workflows',
      description: 'Edite, visualize e organize seus workflows existentes',
      steps: [
        {
          id: 'visualizar-workflows',
          title: 'Visualizar Lista de Workflows',
          description: 'A tela principal mostra todos os workflows cadastrados em cards informativos:\n\n**Informações exibidas em cada card:**\n- 📋 **Nome do Workflow** e tipo de módulo\n- 🔢 **Número de etapas** configuradas\n- ⏱️ **SLA padrão** em dias úteis\n- 📅 **Última atualização** do workflow\n\n**Funcionalidades:**\n- 🔍 **Buscar**: Digite nome ou tipo de módulo no campo de busca\n- 📊 **Estatísticas**: 4 cards no topo mostram:\n  - Total de Workflows\n  - Protocolos com Workflow\n  - Etapas Ativas\n  - SLA Médio\n- ⚡ **Ações rápidas**: Editar (✏️) ou Deletar (🗑️)',
          tips: [
            'Use a busca para encontrar workflows rapidamente em listas grandes',
            'Cards são ordenados alfabeticamente por nome',
            'A data de atualização ajuda a identificar workflows antigos que precisam revisão'
          ]
        },
        {
          id: 'editar-workflow',
          title: 'Editar Workflow Existente',
          description: 'Para modificar um workflow já criado:\n\n1. Clique no ícone **✏️ (Editar)** no card do workflow\n2. O modal abre com todos os dados pré-preenchidos\n3. Você pode alterar:\n   - ✅ Nome do workflow\n   - ✅ Descrição\n   - ✅ SLA padrão\n   - ✅ Etapas (adicionar, remover, reordenar)\n   - ✅ SLA de cada etapa\n   - ❌ **NÃO pode alterar:** Tipo de Módulo (é único e permanente)\n4. Clique em **"Salvar Workflow"**\n\n**O que acontece após salvar:**\n- Workflows **não aplicados** ainda: alterações são imediatas\n- Workflows **já aplicados** a protocolos: protocolos existentes mantêm a versão antiga, novos protocolos usam a nova versão',
          tips: [
            'Sempre teste mudanças em ambiente de homologação primeiro',
            'Documente o motivo da alteração para auditoria futura',
            'Ao adicionar etapas, considere o impacto no SLA total',
            'Use o botão "Cancelar" se mudar de ideia - nada será salvo'
          ],
          warnings: [
            'Mudanças em workflows muito usados podem confundir servidores acostumados com o fluxo antigo',
            'Remover etapas pode causar inconsistências em relatórios históricos',
            'Não reduza drasticamente SLAs sem avisar a equipe'
          ]
        },
        {
          id: 'deletar-workflow',
          title: 'Deletar Workflow',
          description: 'Para remover um workflow que não é mais necessário:\n\n1. Clique no ícone **🗑️ (Deletar)** no card\n2. Confirme a exclusão no diálogo\n3. Workflow é removido permanentemente\n\n**Regras de segurança:**\n- ✅ **Pode deletar:** Workflows nunca aplicados a protocolos\n- ❌ **NÃO pode deletar:** Workflows com protocolos ativos\n- ⚠️ **Alternativa:** Se não pode deletar, edite e marque como "Descontinuado" no nome',
          warnings: [
            'ATENÇÃO: Exclusão é PERMANENTE e não pode ser desfeita!',
            'Workflows deletados desaparecem dos relatórios e estatísticas',
            'Se houver dúvida, prefira editar ao invés de deletar'
          ],
          tips: [
            'Antes de deletar, verifique se não há protocolos antigos usando este workflow',
            'Considere criar um novo workflow ao invés de deletar e recriar',
            'Workflows muito antigos podem ter valor histórico - considere arquivar ao invés de deletar'
          ]
        },
        {
          id: 'estatisticas',
          title: 'Entendendo as Estatísticas',
          description: 'Os 4 cards no topo da página mostram métricas importantes:\n\n📊 **Total de Workflows**\n- Quantidade total de workflows cadastrados\n- Indica cobertura de serviços automatizados\n- Meta: ter workflow para todos os serviços principais\n\n👥 **Protocolos com Workflow**\n- Quantidade de protocolos que seguem algum workflow\n- Mostra adoção do sistema\n- Quanto maior, melhor a rastreabilidade\n\n🔄 **Etapas Ativas**\n- Total de etapas em andamento em todos os protocolos\n- Indica carga de trabalho atual\n- Ajuda a dimensionar equipe\n\n⏱️ **SLA Médio**\n- Média de dias úteis para conclusão\n- Baseado nos SLAs configurados\n- Use para comparar com tempo real de conclusão',
          tips: [
            'Monitore estas estatísticas semanalmente para identificar gargalos',
            'SLA médio muito alto (>15 dias) pode indicar burocracia excessiva',
            'Se "Etapas Ativas" cresce muito, pode estar faltando servidores',
            'Compare "Protocolos com Workflow" vs "Total de Protocolos" para ver % de cobertura'
          ]
        }
      ]
    },

    {
      id: 'aplicacao-pratica',
      emoji: '🚀',
      title: 'Aplicação Prática',
      description: 'Como workflows são aplicados aos protocolos na prática',
      steps: [
        {
          id: 'aplicacao-automatica',
          title: 'Aplicação Automática ao Criar Protocolo',
          description: 'Quando um cidadão ou servidor cria um novo protocolo, o sistema automaticamente:\n\n1. 🔍 **Identifica o tipo de serviço** (ex: MATRICULA_ESCOLAR)\n2. 🔎 **Busca o workflow correspondente** no banco de dados\n3. ✅ **Aplica as etapas** ao protocolo recém criado\n4. 📅 **Calcula datas de vencimento** para cada etapa\n5. 🔔 **Inicia monitoramento de SLA**\n\n**Exemplo prático:**\n```\nCidadão solicita: Matrícula Escolar\n      ↓\nSistema cria: Protocolo #2024/000123\n      ↓\nSistema busca: Workflow "MATRICULA_ESCOLAR"\n      ↓\nSistema aplica:\n  - Etapa 1: Novo (vence em 1 dia)\n  - Etapa 2: Em Análise (vence em 3 dias após etapa 1)\n  - Etapa 3: Aprovado (vence em 1 dia após etapa 2)\n  - Etapa 4: Concluído (vence em 1 dia após etapa 3)\n      ↓\nProtocolo pronto para tramitação!\n```',
          tips: [
            'A aplicação é instantânea (menos de 1 segundo)',
            'Se não houver workflow, o protocolo funciona normalmente, mas sem controle de etapas',
            'Todos os prazos consideram apenas dias úteis (segunda a sexta)',
            'Feriados municipais configurados são automaticamente descontados'
          ]
        },
        {
          id: 'validacao-etapas',
          title: 'Validação Automática de Etapas',
          description: 'Antes de avançar para a próxima etapa, o sistema valida automaticamente:\n\n✅ **Documentos Obrigatórios:**\n- Sistema verifica se todos os documentos configurados foram anexados\n- Ex: Para "Análise Técnica" pode exigir ["RG", "CPF", "Comprovante de Residência"]\n- Se faltar algum → protocolo vai para "Pendente"\n\n✅ **Ações Necessárias:**\n- Verifica se ações configuradas foram executadas\n- Ex: "Vistoria realizada", "Parecer técnico emitido"\n- Se não executado → sistema bloqueia avanço\n\n✅ **Condições de Negócio:**\n- Regras específicas do serviço\n- Ex: "Cidadão deve ser maior de 18 anos"\n- Ex: "Valor não pode exceder R$ 10.000"\n\n**Resposta do sistema:**\n```json\n{\n  "valid": false,\n  "missingItems": [\n    "Documento: Comprovante de Residência",\n    "Ação: Vistoria de Campo não realizada"\n  ]\n}\n```',
          tips: [
            'Configurar validações reduz erros humanos em até 80%',
            'Servidores são notificados automaticamente sobre pendências',
            'Cidadãos podem acompanhar o que falta pelo portal transparente'
          ]
        },
        {
          id: 'monitoramento-sla',
          title: 'Monitoramento de SLA em Tempo Real',
          description: 'O sistema monitora continuamente os prazos de cada protocolo:\n\n🟢 **No Prazo** (> 30% do SLA restante)\n- Protocolo está tranquilo\n- Nenhum alerta\n\n🟡 **Atenção** (10-30% do SLA restante)\n- Prazo começando a apertar\n- Notificação para responsável\n- Ex: "Faltam 2 dias para vencer"\n\n🔴 **Crítico** (< 10% do SLA restante)\n- Prazo quase vencendo\n- Alerta para responsável e gestor\n- Ex: "Vence hoje às 17h"\n\n⚫ **Atrasado** (SLA vencido)\n- Protocolo em atraso\n- Notificação diária\n- Registrado em relatório de inadimplência\n\n**Pausar SLA:**\n- Protocolos em "Pendente" podem ter SLA pausado\n- Útil quando aguardando providências do cidadão\n- Prazo volta a contar quando protocolo sai de "Pendente"',
          tips: [
            'Configure alertas para receber avisos 3 dias antes do vencimento',
            'Use o relatório de SLA para identificar gargalos recorrentes',
            'Protocolos atrasados aparecem em destaque no dashboard do gestor',
            'SLA pausado não conta para estatísticas de desempenho'
          ],
          warnings: [
            'Pausar SLA excessivamente pode mascarar problemas de eficiência',
            'Cidadão não vê SLA pausado - para ele o protocolo continua "em andamento"',
            'Protocolos muito atrasados (>30 dias) podem gerar reclamações na Ouvidoria'
          ]
        }
      ]
    },

    {
      id: 'casos-de-uso',
      emoji: '💼',
      title: 'Casos de Uso Reais',
      description: 'Exemplos práticos de workflows em diferentes secretarias',
      steps: [
        {
          id: 'caso-saude',
          title: 'Caso 1: Agendamento de Consulta (Saúde)',
          description: '**Cenário:** Cidadão solicita consulta com cardiologista\n\n**Workflow aplicado: AGENDAMENTOS_MEDICOS**\n\n📋 **Etapas:**\n\n1️⃣ **Novo** (SLA: 4 horas)\n   - Protocolo entra na fila de triagem\n   - Sistema verifica disponibilidade de agenda\n   - Documentos: [Cartão SUS, Encaminhamento]\n\n2️⃣ **Triagem** (SLA: 1 dia)\n   - Enfermeiro classifica urgência (Rotina/Urgente/Emergencial)\n   - Valida documentação\n   - Ação: Classificar risco\n\n3️⃣ **Agendado** (SLA: 7 dias)\n   - Sistema busca primeira data disponível\n   - Cidadão recebe SMS com data/hora\n   - Ação: Confirmar presença\n\n4️⃣ **Confirmado** (SLA: até data da consulta)\n   - Aguarda dia da consulta\n   - Lembretes automáticos 2 dias antes e 1 dia antes\n\n5️⃣ **Realizado** (SLA: 1 dia)\n   - Consulta realizada\n   - Médico registra atendimento\n   - Sistema gera receita/exames\n\n6️⃣ **Concluído** (SLA: 1 dia)\n   - Cidadão recebe documentos\n   - Protocolo arquivado\n\n**SLA Total:** 10 dias úteis\n**Taxa de conclusão:** 95% no prazo',
          tips: [
            'Para casos urgentes, etapa 2 pode ter SLA de 4 horas',
            'Sistema prioriza automaticamente gestantes, idosos e pessoas com deficiência',
            'Integração com WhatsApp envia confirmações e lembretes'
          ]
        },
        {
          id: 'caso-educacao',
          title: 'Caso 2: Transferência Escolar (Educação)',
          description: '**Cenário:** Família solicita transferência de escola\n\n**Workflow aplicado: TRANSFERENCIA_ESCOLAR**\n\n📋 **Etapas:**\n\n1️⃣ **Protocolo Recebido** (SLA: 1 dia)\n   - Escola de origem recebe solicitação\n   - Verifica documentação básica\n   - Documentos: [Histórico escolar, Certidão de nascimento, Comprovante de residência]\n\n2️⃣ **Análise de Vaga** (SLA: 2 dias)\n   - Escola de destino verifica disponibilidade\n   - Analisa série/turno compatível\n   - Consulta zoneamento escolar\n\n3️⃣ **Aguardando Vaga** (SLA: variável)\n   - Se não há vaga imediata, entra em fila de espera\n   - Sistema notifica quando vaga surge\n   - Pode pular se vaga disponível\n\n4️⃣ **Vaga Confirmada** (SLA: 1 dia)\n   - Escola reserva vaga\n   - Família é notificada\n   - Prazo para confirmar interesse: 3 dias\n\n5️⃣ **Documentação Complementar** (SLA: 5 dias)\n   - Família entrega documentos adicionais\n   - Escola valida autenticidade\n   - Documentos: [Cartão de vacina, Fotos 3x4]\n\n6️⃣ **Matrícula Efetivada** (SLA: 1 dia)\n   - Gera número de matrícula\n   - Aluno registrado no sistema\n   - Familia recebe declaração de matrícula\n\n7️⃣ **Concluído** (SLA: 1 dia)\n   - Processo arquivado\n   - Aluno pode frequentar aulas\n\n**SLA Total:** 11 dias úteis (excluindo fila de espera)\n**Taxa de conclusão:** 88% no prazo',
          tips: [
            'Etapa 3 (Aguardando Vaga) tem SLA pausado automaticamente',
            'Sistema cruza CEP do comprovante de residência com zoneamento escolar',
            'Transferências intra-municipais têm prioridade sobre extra-municipais'
          ],
          warnings: [
            'Família que não confirma em 3 dias perde a vaga',
            'Documentação incompleta retorna para etapa 1'
          ]
        },
        {
          id: 'caso-obras',
          title: 'Caso 3: Alvará de Construção (Obras Públicas)',
          description: '**Cenário:** Cidadão solicita alvará para construir casa\n\n**Workflow aplicado: APROVACAO_PROJETO_ARQUITETONICO**\n\n📋 **Etapas:**\n\n1️⃣ **Protocolo Aberto** (SLA: 2 dias)\n   - Recepção analisa documentação inicial\n   - Verifica se projeto está assinado por profissional habilitado\n   - Documentos: [Projeto arquitetônico, ART/RRT, Matrícula do imóvel, IPTU]\n\n2️⃣ **Análise Urbanística** (SLA: 15 dias)\n   - Engenheiro verifica:\n     - Conformidade com Plano Diretor\n     - Respeito a recuos obrigatórios\n     - Taxa de ocupação e coeficiente de aproveitamento\n     - Gabarito de altura\n   - Pode solicitar correções no projeto\n\n3️⃣ **Análise Ambiental** (SLA: 10 dias)\n   - Se imóvel em área de preservação\n   - Verifica impacto ambiental\n   - Pode exigir EIA/RIMA\n   - **Pode pular** se área urbana consolidada\n\n4️⃣ **Vistoria de Campo** (SLA: 7 dias)\n   - Fiscal visita terreno\n   - Verifica confrontações\n   - Fotografa situação atual\n   - Atesta viabilidade\n\n5️⃣ **Cálculo de Taxas** (SLA: 2 dias)\n   - Sistema calcula:\n     - Taxa de aprovação de projeto\n     - Taxa de licença de construção\n     - IPTU proporcional (se houver ampliação)\n   - Emite guia de pagamento\n\n6️⃣ **Aguardando Pagamento** (SLA: 30 dias)\n   - Cidadão tem 30 dias para pagar\n   - SLA pausado\n   - Após pagamento, avança automaticamente\n\n7️⃣ **Emissão de Alvará** (SLA: 3 dias)\n   - Secretário assina digitalmente\n   - Alvará gerado com QR Code\n   - Validade: 2 anos\n\n8️⃣ **Concluído** (SLA: 1 dia)\n   - Cidadão baixa alvará pelo portal\n   - Pode iniciar obra\n\n**SLA Total:** 40 dias úteis (excluindo pagamento)\n**Taxa de conclusão:** 72% no prazo (muitas correções de projeto)',
          tips: [
            'Projetos pequenos (<70m²) têm análise simplificada (SLA de 20 dias)',
            'Uso do BIM (Building Information Modeling) acelera análise',
            'Cidadão pode acompanhar análise pelo portal e ver exatamente qual profissional está analisando'
          ],
          warnings: [
            'Projetos sem ART/RRT são indeferidos automaticamente',
            'Obras iniciadas sem alvará geram multa e embargo',
            'Alvará vencido requer renovação (processo mais rápido)'
          ]
        }
      ]
    }
  ],

  troubleshooting: [
    {
      problem: 'Não consigo criar workflow - erro "Tipo de módulo já existe"',
      solution: 'Este erro ocorre quando já existe um workflow com o mesmo "Tipo de Módulo". Cada tipo só pode ter um workflow. Verifique a lista de workflows existentes e edite o workflow existente ao invés de criar um novo, ou use um tipo de módulo diferente.'
    },
    {
      problem: 'Botão "Criar Workflows Padrão" não funciona',
      solution: 'Verifique: 1) Você tem permissão de ADMIN? 2) Já executou esta ação antes? (não pode duplicar) 3) Verifique o console do navegador para erros. Se persistir, limpe o cache do navegador e tente novamente.'
    },
    {
      problem: 'Workflow não aparece ao criar protocolo',
      solution: 'Certifique-se que: 1) O "Tipo de Módulo" do workflow corresponde EXATAMENTE ao tipo do serviço (incluindo maiúsculas/minúsculas) 2) O workflow foi salvo com sucesso 3) Atualize a página de criação de protocolo'
    },
    {
      problem: 'Não consigo deletar um workflow',
      solution: 'Workflows que já foram aplicados a protocolos não podem ser deletados por segurança. Alternativas: 1) Edite o workflow e adicione "[DESCONTINUADO]" no nome 2) Crie um novo workflow para substituir 3) Entre em contato com suporte para arquivamento'
    },
    {
      problem: 'SLA está calculado errado',
      solution: 'Verifique: 1) SLA usa apenas dias ÚTEIS (segunda a sexta) 2) Feriados municipais estão configurados no sistema 3) Se a etapa está em "Pendente", o SLA pode estar pausado 4) Recalcule manualmente: soma dos SLAs de todas as etapas'
    },
    {
      problem: 'Etapas aparecendo fora de ordem',
      solution: 'Use os botões ↑ ↓ no editor de workflow para reordenar as etapas. O sistema ordena automaticamente pelo campo "order". Após reordenar, salve o workflow. Protocolos novos usarão a nova ordem.'
    },
    {
      problem: 'Estatísticas não atualizam',
      solution: 'As estatísticas são calculadas em tempo real, mas podem ter cache de até 5 minutos. Aguarde alguns minutos e atualize a página. Se persistir, verifique a conexão com o banco de dados.'
    },
    {
      problem: 'Modal de criação não abre',
      solution: 'Possíveis causas: 1) Conflito com extensões do navegador (desative ad-blockers) 2) JavaScript desabilitado 3) Erro de permissão - verifique se você é ADMIN 4) Tente outro navegador (Chrome/Firefox)'
    }
  ]
}
