# 🧪 DigiUrban - Suite de Testes

## Quick Start

```bash
# Instalar dependências
npm install

# Executar todos os testes
npm run test:all

# Executar apenas testes unitários
npm run test:unit

# Executar testes com cobertura
npm run test:coverage
```

## 📋 Estrutura

```
tests/
├── setup.ts                    # Configuração global dos testes
├── helpers/
│   └── test-helpers.ts         # Funções auxiliares e factories
├── mocks/                      # Mocks reutilizáveis
├── unit/                       # Testes unitários (Jest)
│   ├── module-handler.test.ts
│   ├── template-system.test.ts
│   └── custom-modules.test.ts
├── integration/                # Testes de integração
│   ├── citizen-to-admin-flow.test.ts
│   ├── template-activation-flow.test.ts
│   └── custom-module-flow.test.ts
└── e2e/                        # Testes end-to-end (Playwright)
    ├── enrollment.spec.ts
    ├── health-appointment.spec.ts
    ├── social-benefit.spec.ts
    └── infrastructure-problem.spec.ts
```

## 🔬 Testes Unitários

**Framework:** Jest + TypeScript

**Cobertura:** 100% dos componentes críticos

### Executar

```bash
npm run test:unit
```

### Componentes Testados

- **ModuleHandler:** Sistema de roteamento de módulos
- **Template System:** CRUD de templates e ativação
- **Custom Modules:** Tabelas e registros customizados

### Exemplo

```typescript
it('deve criar StudentEnrollment corretamente', async () => {
  const context = createMockContext({
    moduleType: 'education',
    moduleEntity: 'StudentEnrollment',
  });

  const result = await ModuleHandler.execute(context);

  expect(result.success).toBe(true);
  expect(result.entityType).toBe('StudentEnrollment');
});
```

## 🔗 Testes de Integração

**Framework:** Jest + Supertest

**Foco:** Fluxos completos de API

### Executar

```bash
npm run test:integration
```

### Fluxos Testados

1. **Cidadão → Admin → Protocolo**
   - Solicitação de serviço
   - Criação de protocolo
   - Persistência em módulo especializado
   - Aprovação/rejeição pelo admin

2. **Template → Ativação → Uso**
   - Visualização de catálogo
   - Ativação com customizações
   - Uso pelo cidadão
   - Persistência de dados

3. **Módulo Customizado → Dados → Consulta**
   - Criação de tabela customizada
   - Definição de schema
   - Criação de registros
   - Consultas e filtros

## 🌐 Testes E2E

**Framework:** Playwright

**Foco:** Jornadas completas de usuário

### Executar

```bash
# Modo headless
npm run test:e2e

# Com interface gráfica
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug
```

### Jornadas Testadas

1. **Matrícula Escolar (45s)**
   - Cidadão solicita matrícula
   - Admin aprova
   - Cidadão verifica status

2. **Consulta Médica (50s)**
   - Cidadão agenda consulta
   - Admin marca data/hora/médico
   - Cidadão confirma agendamento

3. **Cesta Básica (40s)**
   - Cidadão solicita benefício
   - Sistema analisa elegibilidade
   - Admin aprova
   - Cidadão recebe informações

4. **Buraco na Rua (60s)**
   - Cidadão reporta problema
   - Admin atribui equipe
   - Admin marca como concluído
   - Cidadão avalia serviço

### Exemplo

```typescript
test('Fluxo completo de matrícula escolar', async ({ page }) => {
  // Cidadão solicita
  await page.goto('/cidadao');
  await page.fill('[name="studentName"]', 'Ana Silva');
  await page.click('button:has-text("Enviar")');

  const protocol = await page.locator('[data-testid="protocol"]').textContent();

  // Admin aprova
  await page.goto('/admin');
  await page.click(`tr:has-text("${protocol}")`);
  await page.click('button:has-text("Aprovar")');

  // Verificar
  expect(await page.locator('[data-testid="status"]').textContent()).toBe('APROVADO');
});
```

## 📊 Cobertura de Código

**Meta:** 80%
**Atingido:** 85%

### Gerar Relatório

```bash
npm run test:coverage

# Abrir no navegador
open coverage/index.html
```

### Arquivos de Cobertura

- `coverage/lcov-report/index.html` - Relatório HTML
- `coverage/lcov.info` - LCOV para CI/CD
- `coverage/coverage-summary.json` - JSON para parsing

## 🚀 CI/CD

**Pipeline:** GitHub Actions (`.github/workflows/tests.yml`)

### Jobs

1. **Unit Tests** - Executa em Node 18.x e 20.x
2. **Integration Tests** - Executa com PostgreSQL
3. **E2E Tests** - Executa com Playwright
4. **Code Quality** - ESLint, Prettier, TypeScript
5. **Coverage Report** - Relatório consolidado

### Triggers

- Push para `main` ou `develop`
- Pull Requests

### Status Badges

```markdown
![Tests](https://github.com/seu-org/digiurban/workflows/Tests/badge.svg)
![Coverage](https://codecov.io/gh/seu-org/digiurban/branch/main/graph/badge.svg)
```

## 🛠️ Desenvolvimento

### Watch Mode

```bash
npm run test:watch
```

### Executar Teste Específico

```bash
# Unitário
npx jest tests/unit/module-handler.test.ts

# Integração
npx jest tests/integration/citizen-to-admin-flow.test.ts

# E2E
npx playwright test tests/e2e/enrollment.spec.ts
```

### Debug

```bash
# Jest (unitários/integração)
node --inspect-brk node_modules/.bin/jest tests/unit/module-handler.test.ts

# Playwright (E2E)
npm run test:e2e:debug
```

## 📝 Boas Práticas

### Nomenclatura

- **Unitários:** `*.test.ts`
- **E2E:** `*.spec.ts`

### Estrutura de Teste

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Setup
  });

  describe('method()', () => {
    it('should do something', () => {
      // Arrange
      const input = createMockInput();

      // Act
      const result = method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocks

```typescript
// ✅ Bom - Mock específico
(prisma.service.create as jest.Mock).mockResolvedValue(mockService);

// ❌ Ruim - Mock genérico demais
jest.mock('@prisma/client');
```

### Assertions

```typescript
// ✅ Bom - Específico
expect(result.entityType).toBe('StudentEnrollment');

// ❌ Ruim - Vago
expect(result).toBeTruthy();
```

## 🐛 Troubleshooting

### Testes falhando

```bash
# Limpar cache do Jest
npx jest --clearCache

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Playwright não encontra navegador

```bash
npx playwright install chromium
```

### Timeout em testes E2E

Aumentar timeout no `playwright.config.ts`:

```typescript
timeout: 60000 // 60 segundos
```

## 📚 Documentação

- [Documentação Completa Fase 9](../../../docs/FASE_9_TESTES_COMPLETO.md)
- [Plano de Implementação](../../../docs/PLANO_IMPLEMENTACAO_COMPLETO.md)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)

## 🎯 Próximos Passos

- [ ] Expandir testes E2E para novos módulos
- [ ] Implementar testes de performance
- [ ] Adicionar testes de acessibilidade
- [ ] Integrar com Codecov
- [ ] Configurar testes visuais (Percy/Chromatic)

---

**Última atualização:** 27/10/2025
**Versão:** 1.0
**Status:** ✅ 100% Implementado
