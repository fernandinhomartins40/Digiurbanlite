# DigiUrban - Sistema de Gestão Municipal

Sistema SaaS completo para gestão municipal com foco em protocolos. O DigiUrban combina funcionalidades específicas de cada secretaria com um fluxo unificado de atendimento ao cidadão.

## 🎯 Visão Geral

O DigiUrban é um sistema híbrido que centraliza todos os serviços públicos através de um motor inteligente de protocolos, oferecendo:

- **174 páginas especializadas** organizadas em 12 secretarias
- **Três pontos de entrada** para abertura de protocolos
- **Sistema multi-tenant** para múltiplos municípios
- **Arquitetura moderna** com Next.js, Node.js e Prisma

## 🏗️ Arquitetura

### Motor de Protocolos (Core)
Estados: `VINCULADO → PROGRESSO → ATUALIZAÇÃO → CONCLUÍDO`

### Três Fluxos de Entrada:
1. **Top-Down**: Prefeito → Setor → Protocolo
2. **Inside-Out**: Servidor → Protocolo interno
3. **Bottom-Up**: Cidadão → Catálogo → Protocolo

### Níveis de Usuário:
- **NÍVEL 0**: Cidadão (guest)
- **NÍVEL 1**: Funcionário (user)
- **NÍVEL 2**: Coordenador (coordinator)
- **NÍVEL 3**: Secretário (manager)
- **NÍVEL 4**: Prefeito (admin)
- **NÍVEL 5**: Super Admin (super_admin)

## 🚀 Tecnologias

### Frontend
- **Next.js 14** com App Router
- **TypeScript** para tipagem
- **Tailwind CSS** + **Shadcn/ui** para UI
- **React Context** para autenticação

### Backend
- **Node.js** com **Express**
- **TypeScript** para tipagem
- **Prisma** como ORM
- **SQLite** como banco de dados
- **JWT** para autenticação
- **bcryptjs** para criptografia

### Infraestrutura
- **Docker** para containerização
- **nginx** como proxy reverso
- **Multi-tenant** por subdomínio/header

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Docker (opcional)

### 1. Clonar o Repositório
```bash
git clone <repository-url>
cd digiurban
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` com suas configurações:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

### 4. Configurar Banco de Dados
```bash
cd ../backend
npm run db:push
npm run db:seed
```

### 5. Executar em Desenvolvimento

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Executar com Docker
```bash
docker-compose up -d
```

## 📱 Acessos de Demonstração

Após executar o seed, você terá acesso a:

### Usuários de Teste:
- **Super Admin**: `superadmin@digiurban.com` / `123456`
- **Prefeito**: `prefeito@demo.gov.br` / `123456`
- **Secretário Saúde**: `secretario.saude@demo.gov.br` / `123456`
- **Funcionário**: `funcionario.saude@demo.gov.br` / `123456`

### URLs de Acesso:
- **Portal Principal**: http://localhost:3000
- **Landing Page**: http://localhost:3000/landing
- **Portal do Cidadão**: http://localhost:3000/cidadao
- **Portal Admin**: http://localhost:3000/admin
- **Super Admin**: http://localhost:3000/super-admin
- **Login**: http://localhost:3000/login
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🏛️ Secretarias Implementadas

1. **Saúde** (10 páginas)
2. **Educação** (8 páginas)
3. **Assistência Social** (8 páginas)
4. **Cultura** (8 páginas)
5. **Segurança Pública** (8 páginas)
6. **Planejamento Urbano** (8 páginas)
7. **Agricultura** (6 páginas)
8. **Esportes** (8 páginas)
9. **Turismo** (7 páginas)
10. **Habitação** (6 páginas)
11. **Meio Ambiente** (6 páginas)
12. **Obras Públicas** (5 páginas)
13. **Serviços Públicos** (7 páginas)

## 🔧 Comandos Úteis

### Backend
```bash
npm run dev          # Executar em desenvolvimento
npm run build        # Build para produção
npm run start        # Executar build de produção
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Aplicar schema no banco
npm run db:seed      # Popular banco com dados
npm run db:studio    # Abrir Prisma Studio
```

### Frontend
```bash
npm run dev          # Executar em desenvolvimento
npm run build        # Build para produção
npm run start        # Executar build de produção
npm run lint         # Executar ESLint
```

### Docker
```bash
docker-compose up -d           # Subir todos os serviços
docker-compose down            # Parar todos os serviços
docker-compose logs -f         # Ver logs em tempo real
docker-compose build --no-cache # Rebuild containers
```

## 🔐 Autenticação Multi-Tenant

O sistema identifica o tenant através de:
1. **Subdomínio**: `saude.localhost`
2. **Header**: `X-Tenant-ID`
3. **Fallback**: `default`

## 📊 APIs Principais

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/refresh` - Renovar token

### Protocolos
- `GET /api/protocols` - Listar protocolos
- `POST /api/protocols` - Criar protocolo
- `GET /api/protocols/:id` - Obter protocolo
- `PUT /api/protocols/:id/status` - Atualizar status

### Serviços
- `GET /api/services` - Catálogo público
- `POST /api/services` - Criar serviço
- `PUT /api/services/:id` - Atualizar serviço

### Tenants (Super Admin)
- `GET /api/tenants` - Listar tenants
- `POST /api/tenants` - Criar tenant
- `GET /api/tenants/:id/stats` - Estatísticas

## 🚦 Status do Projeto

### ✅ Implementado (Fase 1)
- [x] Estrutura base do projeto
- [x] Next.js 14 com TypeScript
- [x] Tailwind CSS + Shadcn/ui
- [x] Backend Node.js + TypeScript
- [x] Prisma + SQLite
- [x] Models completos (Tenant, User, Protocol, etc.)
- [x] Middleware multi-tenant
- [x] APIs essenciais
- [x] Docker containers
- [x] nginx proxy reverso
- [x] Rotas base para perfis de usuário
- [x] Sistema de autenticação
- [x] Seed do banco de dados

### 🔄 Próximas Fases
- [ ] Implementação das 174 páginas especializadas
- [ ] Sistema de notificações
- [ ] Upload de arquivos
- [ ] Relatórios e dashboards
- [ ] Testes automatizados
- [ ] Deploy em produção

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o projeto, entre em contato através dos issues do GitHub.

---

**DigiUrban** - Transformando a gestão pública brasileira através da tecnologia. 🏛️✨