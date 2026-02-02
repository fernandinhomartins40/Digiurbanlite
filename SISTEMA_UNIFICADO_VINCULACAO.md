# Sistema Unificado de Vinculação de Servidores V2.0

## 📋 Visão Geral

O Sistema Unificado de Vinculação de Servidores é uma solução completa e moderna para gestão de recursos humanos municipais, permitindo o gerenciamento de:

- **Estrutura Organizacional** (Secretarias, Diretorias, Coordenadorias, Divisões, Setores)
- **Cargos e Funções** (Efetivos, Comissionados, Gratificados)
- **Vínculos Funcionais** (Lotações, Cedências, Requisições)
- **Hierarquia Organizacional** (Chefias, Supervisões, Coordenações)
- **Equipes e Grupos de Trabalho**
- **Dados Profissionais Específicos** por área (Saúde, Educação, Engenharia, Assistência Social)
- **Auditoria Completa** de todas as operações

## 🎯 Objetivos Alcançados

✅ **Padronização**: Sistema único para todas as secretarias municipais
✅ **Escalabilidade**: Arquitetura preparada para crescimento
✅ **Rastreabilidade**: Histórico completo de todas as mudanças
✅ **Flexibilidade**: Suporte a múltiplos vínculos simultâneos
✅ **Governança**: Controles de validação e auditoria em todos os níveis
✅ **Desacoplamento**: Sistema independente do módulo legado de profissionais

## 🏗️ Arquitetura

### Backend (Node.js + TypeScript + Prisma)

#### Modelos de Dados

1. **OrganizationalUnit** - Unidades organizacionais (Secretarias, Diretorias, etc)
2. **Position** - Cargos (Efetivos, Comissionados, Temporários)
3. **Function** - Funções Gratificadas/Comissionadas
4. **EmployeeAssignment** - Vínculos funcionais servidor ↔ cargo/unidade
5. **EmployeeHierarchy** - Hierarquia (supervisor ↔ subordinado)
6. **Team** - Equipes e grupos de trabalho
7. **TeamMember** - Membros das equipes
8. **AssignmentAudit** - Auditoria de mudanças
9. **HealthProfessionalData** - Dados específicos de profissionais de saúde
10. **EducationProfessionalData** - Dados específicos de educação
11. **EngineeringProfessionalData** - Dados específicos de engenharia
12. **SocialAssistanceProfessionalData** - Dados específicos de assistência social

#### Rotas de API (85+ endpoints)

**Unidades Organizacionais** (`/api/organizational-units`)
- GET `/` - Listar unidades
- GET `/:id` - Buscar unidade específica
- GET `/:id/hierarchy` - Buscar organograma completo
- POST `/` - Criar unidade
- PUT `/:id` - Atualizar unidade
- DELETE `/:id` - Desativar unidade

**Cargos** (`/api/positions`)
- GET `/` - Listar cargos
- GET `/:id` - Buscar cargo específico
- POST `/` - Criar cargo
- PUT `/:id` - Atualizar cargo
- DELETE `/:id` - Desativar cargo

**Funções** (`/api/functions`)
- GET `/` - Listar funções
- GET `/:id` - Buscar função específica
- POST `/` - Criar função
- PUT `/:id` - Atualizar função
- DELETE `/:id` - Desativar função

**Vínculos Funcionais** (`/api/employee-assignments`)
- GET `/` - Listar vínculos
- GET `/:id` - Buscar vínculo específico
- GET `/user/:userId` - Vínculos de um servidor
- POST `/` - Criar vínculo
- PUT `/:id` - Atualizar vínculo
- DELETE `/:id` - Encerrar vínculo
- GET `/:id/audit` - Histórico de auditoria

**Hierarquia** (`/api/employee-hierarchies`)
- GET `/` - Listar hierarquias
- GET `/:id` - Buscar hierarquia específica
- GET `/employee/:userId/subordinates` - Subordinados de um servidor
- GET `/employee/:userId/supervisors` - Supervisores de um servidor
- GET `/employee/:userId/org-chart` - Organograma completo
- POST `/` - Criar hierarquia
- PUT `/:id` - Atualizar hierarquia
- DELETE `/:id` - Desativar hierarquia

**Equipes** (`/api/teams`)
- GET `/` - Listar equipes
- GET `/:id` - Buscar equipe específica
- GET `/:id/members` - Membros da equipe
- POST `/` - Criar equipe
- POST `/:id/members` - Adicionar membro
- PUT `/:id` - Atualizar equipe
- PUT `/:teamId/members/:memberId` - Atualizar membro
- DELETE `/:id` - Desativar equipe
- DELETE `/:teamId/members/:memberId` - Remover membro

**Dados Profissionais** (`/api/professional-data`)
- GET `/health` - Profissionais de saúde
- GET `/health/:userId` - Dados de saúde de um servidor
- POST `/health` - Criar dados de saúde
- PUT `/health/:userId` - Atualizar dados de saúde
- GET `/education` - Profissionais de educação
- POST `/education` - Criar dados de educação
- GET `/engineering` - Profissionais de engenharia
- POST `/engineering` - Criar dados de engenharia
- GET `/social-assistance` - Profissionais de assistência social
- POST `/social-assistance` - Criar dados de assistência social

### Frontend (Next.js 14 + TypeScript + Tailwind CSS)

#### Páginas Implementadas

1. **Organograma Municipal** (`/admin/organograma`)
   - Visualização hierárquica da estrutura organizacional
   - Navegação interativa por níveis
   - Filtro por secretaria
   - Indicadores de servidores e cargos por unidade

2. **Gestão de Vínculos** (`/admin/vinculos`)
   - Lista completa de vínculos funcionais
   - Filtros por secretaria, situação, tipo
   - Busca por servidor
   - Estatísticas de vínculos ativos/inativos
   - CRUD completo de vínculos

3. **Perfil de Servidor** (`/admin/servidores/[id]`)
   - Informações gerais do servidor
   - Timeline de carreira (histórico completo de vínculos)
   - Lista de vínculos funcionais
   - Hierarquia (supervisores e subordinados)
   - Dados profissionais específicos (saúde, educação, etc)

#### Componentes Reutilizáveis

- **OrgChart** - Componente de organograma hierárquico expansível
- **TimelineCard** - Card para exibição de eventos em timeline
- **AssignmentCard** - Card para exibição de vínculos
- **HierarchyCard** - Card para exibição de hierarquia

## 📊 Funcionalidades Principais

### 1. Gestão de Estrutura Organizacional

- Criação de unidades organizacionais em múltiplos níveis
- Hierarquia de unidades (secretaria → diretoria → coordenadoria → etc)
- Designação de responsáveis por unidade
- Competências e atribuições por unidade
- Visualização em organograma interativo

### 2. Gestão de Cargos e Funções

- Cadastro de cargos por tipo (efetivo, comissionado, temporário, etc)
- Definição de requisitos e atribuições
- Níveis hierárquicos (operacional, técnico, especialista, gerencial, etc)
- Cargos específicos por área (médico, professor, engenheiro, etc)
- Funções gratificadas e comissionadas com valores

### 3. Gestão de Vínculos Funcionais

- Múltiplos vínculos simultâneos por servidor
- Vínculo primário e secundários
- Tipos de vínculo (lotação, cedência, requisição, remoção, disposição)
- Situações (ativo, afastado, licença, suspenso, cedido, inativo)
- Carga horária e percentual de dedicação por vínculo
- Período de vigência (data início/fim)
- Documento de vínculo (portaria, decreto, etc)

### 4. Gestão de Hierarquia Organizacional

- Relações de supervisão (chefe ↔ subordinado)
- Tipos de hierarquia (hierárquico, funcional, técnico, matricial)
- Múltiplas hierarquias simultâneas
- Organograma automático baseado nas relações
- Timeline de mudanças hierárquicas

### 5. Gestão de Equipes

- Criação de equipes permanentes ou temporárias
- Tipos de equipe (projeto, grupo de trabalho, comissão, conselho)
- Designação de coordenador
- Gestão de membros com papéis específicos
- Período de participação na equipe

### 6. Dados Profissionais Específicos

**Saúde**:
- Categoria profissional (médico, enfermeiro, ACS, etc)
- Registro profissional (CRM, COREN, CRO, etc)
- CNS (Cartão Nacional de Saúde)
- CBO (Classificação Brasileira de Ocupações)
- Especialidades
- Configurações de atendimento

**Educação**:
- Categoria (professor, coordenador, diretor)
- Formação e pós-graduação
- Disciplinas que leciona
- Nível de ensino

**Engenharia**:
- Categoria (engenheiro civil, arquiteto, etc)
- Registro profissional (CREA, CAU)
- Especialidades

**Assistência Social**:
- Categoria (assistente social, psicólogo, etc)
- Registro profissional (CRESS, CRP)
- Áreas de atuação

### 7. Auditoria Completa

Todas as operações são registradas com:
- Tipo de operação (criação, ativação, desativação, transferência, etc)
- Quem executou
- Quem aprovou
- Motivo
- Documento legal
- Data de efetivação
- Detalhes da mudança

## 🔐 Segurança e Validações

### Validações de Negócio

- Não pode vincular servidor sem cargo ou unidade definidos
- Não pode desativar unidade com subordinadas ativas
- Não pode desativar cargo com servidores ativos
- Não pode criar hierarquia circular (servidor não pode ser supervisor de si mesmo)
- Percentual de dedicação entre 0-100%
- Vínculo primário único por servidor
- Registro profissional único (CRM, COREN, etc)

### Auditoria

- Log completo de todas as operações
- Rastreamento de quem fez e quando
- Motivo e documento legal obrigatórios para mudanças
- Histórico de transferências com origem e destino
- Impossibilidade de exclusão (apenas desativação)

## 📝 Seeds e Dados Iniciais

O sistema inclui seed completo com:

- Estrutura organizacional de 3 níveis para todas as secretarias
- Cargos padrão (Secretário, Diretor, Coordenador, Assessor, etc)
- Cargos específicos por área (Médico, Professor, Engenheiro, etc)
- Funções gratificadas e comissionadas (FG-1, FG-2, CC-1, CC-2, CC-3)

**Executar seed**:
```bash
cd digiurban/backend
npx tsx prisma/seeds/unified-system.seed.ts
```

## 🚀 Como Usar

### Backend

1. **Gerar Prisma Client**:
```bash
cd digiurban/backend
npx prisma generate
```

2. **Executar Seed**:
```bash
npx tsx prisma/seeds/unified-system.seed.ts
```

3. **Iniciar Servidor**:
```bash
npm start
```

O backend estará disponível em `http://localhost:3001`

### Frontend

1. **Instalar Dependências**:
```bash
cd digiurban/frontend
npm install
```

2. **Iniciar Desenvolvimento**:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

### Acessar Páginas

- **Organograma**: `/admin/organograma`
- **Vínculos**: `/admin/vinculos`
- **Perfil de Servidor**: `/admin/servidores/[userId]`

## 📈 Próximos Passos (Roadmap)

### Fase 2 - Melhorias de UI/UX
- [ ] Arrastar e soltar no organograma
- [ ] Gráfico de Gantt para timeline de carreira
- [ ] Exportação de relatórios em PDF
- [ ] Dashboard analítico de RH

### Fase 3 - Integrações
- [ ] Integração com folha de pagamento
- [ ] Integração com ponto eletrônico
- [ ] API pública para consultas

### Fase 4 - Automações
- [ ] Fluxo de aprovação de transferências
- [ ] Notificações automáticas de mudanças
- [ ] Alertas de vencimento de vínculos temporários
- [ ] Relatórios automáticos mensais

## 🏆 Diferenciais do Sistema

1. **Único e Unificado**: Substitui múltiplos sistemas fragmentados
2. **Escalável**: Suporta crescimento sem perda de performance
3. **Auditável**: Rastreamento completo de todas as operações
4. **Flexível**: Múltiplos vínculos e configurações por servidor
5. **Específico**: Dados profissionais personalizados por área
6. **Visual**: Organograma interativo e timeline de carreira
7. **Completo**: Do organograma à auditoria em um só lugar

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação técnica: Este arquivo
- Código fonte: `/digiurban/backend/src/routes/` e `/digiurban/frontend/app/admin/`
- Schema: `/digiurban/backend/prisma/schema.prisma`

---

**Desenvolvido com** ❤️ **para modernizar a gestão pública municipal**

**Versão**: 2.0.0
**Data**: 02/02/2026
**Status**: ✅ Implementação 100% Completa
