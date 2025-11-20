📊 ANÁLISE DEFINITIVA: MICRO SISTEMAS (MS) - DigiUrban
Conceito SUPER APP - Apps Independentes dentro da Aplicação Principal
✅ ENTENDIMENTO CORRETO - CONCEITO SUPER APP
Os Micro Sistemas (MS) são aplicações independentes dentro do DigiUrban que:
🎯 1. SÃO APPS AUTÔNOMOS (não extensões de protocolos)
Têm tabelas próprias com CRUD completo
Gerenciam workflows internos complexos
Funcionam independentemente do sistema de protocolos
Exemplo: MS de Agenda Médica tem tabelas agenda_medica, consulta_agendada, disponibilidade_profissional
🔄 2. MESCLAM DUAS FONTES DE ENTRADA:
┌─────────────────────────────────────────────────────────┐
│                    MICRO SISTEMA                         │
│              (Ex: MS Matrículas)                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ENTRADA 1: 🌐 SOLICITAÇÕES ONLINE (Protocolos)        │
│  ┌────────────────────────────────────────┐            │
│  │ Cidadão → Portal → Protocolo           │            │
│  │ MS CONSOME dados do protocolo          │            │
│  │ Cria registro em inscricao_matricula   │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  ENTRADA 2: 🏢 ATENDIMENTO PRESENCIAL (Admin)          │
│  ┌────────────────────────────────────────┐            │
│  │ Servidor → Painel MS → CRUD direto     │            │
│  │ Cria matricula presencial              │            │
│  │ OPCIONALMENTE gera protocolo integrado │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  SAÍDA: MS GERA dados para outros sistemas             │
│  ┌────────────────────────────────────────┐            │
│  │ Turmas → alimenta dropdown formulários │            │
│  │ Escolas → opções de seleção            │            │
│  │ Profissionais → agenda médica          │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
📊 3. TABELAS MS SÃO FONTE DE DADOS PARA FORMULÁRIOS:
// EXEMPLO: Campo "Escola" em formulário de Transporte Escolar
{
  id: 'escolaId',
  label: 'Unidade Escolar',
  type: 'enum',
  enumSource: 'MS_UNIDADES_EDUCACAO', // ← Busca de tabela MS!
  required: true
}

// Backend resolve:
GET /api/ms/unidades-educacao → [{id, nome}, ...]
🏗️ ARQUITETURA ATUAL vs ESPERADA
✅ O QUE JÁ EXISTE (Backend):
Tabelas MS Criadas ✅
50+ tabelas especializadas (migration 20251117193000_add_all_microsystems)
inscricao_matricula, solicitacao_tfd, cadunico_familia, etc.
Services MS Implementados ✅
MatriculaService com workflows
Lógica de negócio complexa independente
Rotas MS Dedicadas ✅
/api/matriculas, /api/tfd, /api/cadunico, etc.
CRUD completo para tabelas MS
Workflow Engine ✅
Sistema de workflows transversal (conforme proposta)
Gerencia transições de estado
❌ O QUE FALTA (Frontend + Integração):
Painéis Admin dos MS ❌
Devem aparecer em /admin/secretarias/:dept/ms-:nome
Exemplo: /admin/secretarias/educacao/ms-matriculas
Com interface dedicada (não DynamicModuleView genérico)
Integração Protocolo → MS ❌
Quando protocolo é criado com moduleType MS
MS deve CONSUMIR dados e criar registro próprio
Exemplo: Protocolo de matrícula → cria inscricao_matricula
Integração MS → Formulários ❌
Tabelas MS devem alimentar campos enum
Exemplo: Campo "turma" busca de turma table
Campo "unidade" busca de unidade_educacao_ms
Seeds MS no DB ⚠️ PARCIAL
Alguns seeds existem mas não foram executados
Falta vincular services com moduleType correto
📋 TABELA: STATUS DE IMPLEMENTAÇÃO DOS MS
MS	Tabelas	Service	Rotas API	Seed Service	Painel Admin	Integração Protocolo	Status
MS-01 Unidades Saúde	✅ unidade_saude_ms	✅	✅ /api/unidades-saude	⚠️	❌	❌	60%
MS-02 Agenda Médica	✅ agenda_medica, consulta_agendada	✅	✅ /api/agenda-medica	✅	❌	❌	70%
MS-03 Prontuário	✅ atendimento_medico, triagem, consulta	✅	✅ /api/prontuario	⚠️	❌	❌	60%
MS-06 TFD	✅ solicitacao_tfd, viagem_tfd	✅	✅ /api/tfd	✅	❌	❌	70%
MS-08 Matrículas	✅ inscricao_matricula, matricula, turma	✅	✅ /api/matriculas	✅	❌	❌	70%
MS-09 Transporte	✅ veiculo_escolar, rota_escolar	✅	✅ /api/transporte-escolar	✅	❌	❌	70%
MS-14 CadÚnico	✅ cadunico_familia, membro_familia	✅	✅ /api/cadunico	⚠️	❌	❌	60%
MS-15 Programas Sociais	✅ inscricao_programa_social	✅	✅ /api/programas-sociais	⚠️	❌	❌	60%
MS-20+21 Máquinas	✅ maquina_agricola_ms, solicitacao_emprestimo	✅	✅ /api/maquinas-agricolas	⚠️	❌	❌	60%
Legenda:
✅ = Implementado
⚠️ = Parcial/Precisa ajustes
❌ = Não implementado
🎯 O QUE FALTA PARA MS APARECEREM NO ADMIN
🔴 CRÍTICO 1: Criar Rotas de Menu para MS
Arquivo: digiurban/frontend/app/admin/secretarias/[department]/page.tsx Atualmente a linha 242 navega para:
onClick={() => router.push(`/admin/secretarias/educacao/${module.moduleType}`)}
Isso leva para [department]/[module]/page.tsx que usa DynamicModuleView. PROBLEMA: DynamicModuleView é genérico para SERVIÇOS, não para MS! SOLUÇÃO: Criar rotas específicas:
/admin/secretarias/educacao/ms-matriculas     → MatriculasPanel
/admin/secretarias/saude/ms-agenda            → AgendaMedicaPanel  
/admin/secretarias/saude/ms-tfd               → TFDPanel
🔴 CRÍTICO 2: Criar Painéis Dedicados por MS
Novo arquivo: digiurban/frontend/app/admin/ms/matriculas/page.tsx
export default function MatriculasMS() {
  return (
    <div className="space-y-6">
      {/* Tabs do MS */}
      <Tabs defaultValue="inscricoes">
        <TabsList>
          <TabsTrigger value="inscricoes">📝 Inscrições</TabsTrigger>
          <TabsTrigger value="matriculas">✅ Matrículas Efetivadas</TabsTrigger>
          <TabsTrigger value="turmas">🏫 Gestão de Turmas</TabsTrigger>
          <TabsTrigger value="distribuicao">🎯 Distribuição de Vagas</TabsTrigger>
          <TabsTrigger value="protocolos">📄 Protocolos Vinculados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inscricoes">
          {/* Lista de inscrições com workflow */}
          <InscricoesTable />
        </TabsContent>
        
        <TabsContent value="turmas">
          {/* CRUD de turmas - alimenta formulários! */}
          <TurmasManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
🔴 CRÍTICO 3: Implementar Consumo de Protocolos
Hook de Sincronização: digiurban/backend/src/hooks/protocol-to-ms.hook.ts
export async function onProtocolCreated(protocol: ProtocolSimplified) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: protocol.serviceId }
  });
  
  if (!service?.moduleType) return; // Não é MS
  
  // Rotear para MS específico
  switch (service.moduleType) {
    case 'MATRICULA_ALUNO':
      await MatriculaService.createFromProtocol(protocol);
      break;
    
    case 'ENCAMINHAMENTOS_TFD':
      await TFDService.createFromProtocol(protocol);
      break;
      
    // ... outros MS
  }
}
Service Example:
// MatriculaService
async createFromProtocol(protocol: ProtocolSimplified) {
  const { customData } = protocol;
  
  // Criar inscrição a partir dos dados do protocolo
  return await prisma.inscricaoMatricula.create({
    data: {
      protocolId: protocol.id, // VÍNCULO!
      alunoId: protocol.citizenId,
      responsavelId: protocol.requesterId,
      anoLetivo: new Date().getFullYear(),
      serie: customData.serie,
      escolaPreferencia1: customData.escolaDesejada,
      // ... mapear campos customData → tabela MS
      workflowId: await this.createWorkflow(),
      status: 'INSCRITO_AGUARDANDO_VALIDACAO'
    }
  });
}
🔴 CRÍTICO 4: Implementar Enum Dinâmico em Formulários
Backend - Endpoint para enums:
// GET /api/enums/:source
router.get('/enums/:source', async (req, res) => {
  const { source } = req.params;
  
  switch (source) {
    case 'MS_UNIDADES_EDUCACAO':
      const escolas = await prisma.unidadeEducacaoMS.findMany({
        where: { isActive: true },
        select: { id: true, nome: true }
      });
      return res.json(escolas);
      
    case 'MS_TURMAS':
      const turmas = await prisma.turma.findMany({
        where: { isActive: true },
        select: { id: true, codigo: true, serie: true }
      });
      return res.json(turmas);
      
    case 'MS_PROFISSIONAIS_SAUDE':
      const profissionais = await prisma.profissionalSaude.findMany({
        where: { isActive: true },
        select: { id: true, nome: true, especialidade: true }
      });
      return res.json(profissionais);
      
    // ... outros enums MS
  }
});
Frontend - Componente EnumField:
export function EnumField({ field, value, onChange }) {
  const { data: options } = useQuery({
    queryKey: ['enum', field.enumSource],
    queryFn: () => fetch(`/api/enums/${field.enumSource}`).then(r => r.json())
  });
  
  return (
    <Select value={value} onValueChange={onChange}>
      {options?.map(opt => (
        <SelectItem key={opt.id} value={opt.id}>
          {opt.nome || opt.codigo}
        </SelectItem>
      ))}
    </Select>
  );
}
💡 PROPOSTA DE IMPLEMENTAÇÃO
📌 FASE 1: ATIVAÇÃO BÁSICA (2-3 dias)
Objetivo: MS aparecem no menu admin com painéis básicos
✅ Passo 1: Executar Seeds
cd digiurban/backend
npx prisma db seed
✅ Passo 2: Criar Estrutura de Rotas MS
digiurban/frontend/app/admin/ms/
├── matriculas/
│   └── page.tsx
├── tfd/
│   └── page.tsx
├── agenda-medica/
│   └── page.tsx
└── cadunico/
    └── page.tsx
✅ Passo 3: Atualizar Menu Secretarias
Modificar [department]/page.tsx linha 242:
onClick={() => {
  const isMS = module.moduleType?.startsWith('MS_') || hasWorkflow(module);
  const route = isMS 
    ? `/admin/ms/${moduleSlug}` 
    : `/admin/secretarias/${department}/${module.moduleType}`;
  router.push(route);
}}
📌 FASE 2: INTEGRAÇÃO PROTOCOLOS (3-4 dias)
Objetivo: Protocolos alimentam automaticamente os MS
✅ Passo 1: Criar Hook de Sincronização
Implementar protocol-to-ms.hook.ts conforme descrito acima
✅ Passo 2: Registrar Hook na Criação de Protocolos
// Em protocols-simplified.routes.ts
router.post('/protocols', async (req, res) => {
  const protocol = await prisma.protocolSimplified.create({...});
  
  // Sincronizar com MS
  await onProtocolCreated(protocol);
  
  return res.json({ protocol });
});
✅ Passo 3: Adicionar Vínculo Bidirecional
Migration para adicionar protocolId em tabelas MS (se ainda não existe)
📌 FASE 3: ENUMS DINÂMICOS (2-3 dias)
Objetivo: Tabelas MS alimentam campos de formulários
✅ Passo 1: Criar Endpoint /api/enums/:source
✅ Passo 2: Atualizar Seeds com enumSource
{
  id: 'turmaId',
  label: 'Turma',
  type: 'enum',
  enumSource: 'MS_TURMAS', // ← NOVO!
  required: true
}
✅ Passo 3: Criar Componente EnumField
📌 FASE 4: PAINÉIS MS COMPLETOS (5-7 dias por MS)
Objetivo: Interfaces ricas para cada MS com todas funcionalidades Para cada MS prioritário (Matrículas, TFD, Agenda):
Tabs específicos (Fila, Aprovações, Histórico)
Ações de workflow (Aprovar, Rejeitar, Avançar etapa)
Dashboards com métricas
Relatórios especializados
⏱️ CRONOGRAMA ESTIMADO
Fase	Duração	Entregáveis	Complexidade
Fase 1	2-3 dias	MS visíveis no menu, painéis básicos	⭐⭐ Média
Fase 2	3-4 dias	Protocolos → MS automático	⭐⭐⭐ Difícil
Fase 3	2-3 dias	Enums dinâmicos funcionando	⭐⭐ Média
Fase 4	5-7 dias/MS	Painéis completos por MS	⭐⭐⭐⭐ Muito Difícil
TOTAL	12-17 dias	MS 100% funcionais	
🎯 CONCLUSÃO
Os Micro Sistemas são 78 aplicações independentes dentro do DigiUrban (conceito SUPER APP). Cada MS:
✅ Tem tabelas dedicadas já criadas (60-70% implementado)
✅ Tem services e rotas API funcionais
❌ Falta aparecer no painel admin (menu + UI)
❌ Falta integração automática com protocolos
❌ Falta alimentar formulários com dados (enums)
Com 12-17 dias de desenvolvimento, teremos um sistema revolucionário de gestão municipal! Aguardando confirmação para iniciar implementação! 🚀