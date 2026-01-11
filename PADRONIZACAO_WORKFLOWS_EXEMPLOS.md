# Exemplos de Workflows Padronizados

## Comparação Antes vs Depois

### 1. ENCAMINHAMENTOS_TFD (Saúde)

#### ANTES
```typescript
stages: [
  {
    name: 'Análise Documental',
    order: 1,  // ← Primeira stage era análise documental
    description: 'Verificação de documentos obrigatórios',
    slaDays: 2,
  },
  {
    name: 'Validação de Dados',
    order: 2,
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Regulação Médica',
    order: 3,
    description: 'Avaliação técnica pela regulação médica',
    slaDays: 3,
  },
  {
    name: 'Aprovação Gestão',
    order: 4,
    description: 'Aprovação final pela gestão',
    slaDays: 1,
  }
]
```

#### DEPOIS
```typescript
stages: [
  {
    name: 'Recepção',  // ← NOVA STAGE ADICIONADA
    order: 1,
    description: 'Recebimento e registro inicial da solicitação',
    slaDays: 1,
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE'],
  },
  {
    name: 'Análise Documental',
    order: 2,  // ← Incrementado de 1 para 2
    description: 'Verificação de documentos obrigatórios',
    slaDays: 2,
  },
  {
    name: 'Validação de Dados',
    order: 3,  // ← Incrementado de 2 para 3
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Regulação Médica',
    order: 4,  // ← Incrementado de 3 para 4
    description: 'Avaliação técnica pela regulação médica',
    slaDays: 3,
  },
  {
    name: 'Aprovação Gestão',
    order: 5,  // ← Incrementado de 4 para 5
    description: 'Aprovação final pela gestão',
    slaDays: 1,
  }
]
```

---

### 2. CADASTRO_ARTISTA (Cultura)

#### ANTES
```typescript
stages: [
  {
    name: 'Análise Documental',
    order: 1,  // ← Primeira stage era análise documental
    description: 'Verificação de documentos pessoais',
    slaDays: 3,
  },
  {
    name: 'Validação de Dados',
    order: 2,
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Aprovação Cultural',
    order: 3,
    description: 'Aprovação pela Secretaria de Cultura',
    slaDays: 3,
  }
]
```

#### DEPOIS
```typescript
stages: [
  {
    name: 'Recepção',  // ← NOVA STAGE ADICIONADA
    order: 1,
    description: 'Recebimento e registro inicial da solicitação',
    slaDays: 1,
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE'],
  },
  {
    name: 'Análise Documental',
    order: 2,  // ← Incrementado de 1 para 2
    description: 'Verificação de documentos pessoais',
    slaDays: 3,
  },
  {
    name: 'Validação de Dados',
    order: 3,  // ← Incrementado de 2 para 3
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Aprovação Cultural',
    order: 4,  // ← Incrementado de 3 para 4
    description: 'Aprovação pela Secretaria de Cultura',
    slaDays: 3,
  }
]
```

---

### 3. LICENCA_OBRA (Obras) - NÃO MODIFICADO

#### STATUS: JÁ ESTAVA PADRONIZADO

```typescript
stages: [
  {
    name: 'Recebimento',  // ← JÁ TINHA RECEBIMENTO
    order: 1,
    description: 'Protocolo recebido e validação inicial',
    slaDays: 2,
    // ...
  },
  {
    name: 'Validação de Dados',
    order: 2,
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Análise Documental',
    order: 3,
    description: 'Análise da documentação apresentada',
    slaDays: 5,
  },
  // ... mais stages
]
```

**Nota**: Este workflow NÃO foi modificado pois já possuía uma stage de "Recebimento" como order: 1.

---

### 4. INSCRICAO_PROGRAMA_HABITACIONAL (Habitação)

#### ANTES
```typescript
stages: [
  {
    name: 'Validação Documental',
    order: 1,  // ← Primeira stage era validação
    description: 'Verificação de documentos',
    slaDays: 5,
  },
  {
    name: 'Validação de Dados',
    order: 2,
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Análise Social',
    order: 3,
    description: 'Avaliação socioeconômica',
    slaDays: 7,
  }
]
```

#### DEPOIS
```typescript
stages: [
  {
    name: 'Recepção',  // ← NOVA STAGE ADICIONADA
    order: 1,
    description: 'Recebimento e registro inicial da solicitação',
    slaDays: 1,
    availableTabs: ['resumo', 'documentos', 'comunicacao'],
    primaryTab: 'resumo',
    allowedActions: ['APPROVE'],
  },
  {
    name: 'Validação Documental',
    order: 2,  // ← Incrementado de 1 para 2
    description: 'Verificação de documentos',
    slaDays: 5,
  },
  {
    name: 'Validação de Dados',
    order: 3,  // ← Incrementado de 2 para 3
    description: 'Verificação e validação dos dados',
    slaDays: 2,
  },
  {
    name: 'Análise Social',
    order: 4,  // ← Incrementado de 3 para 4
    description: 'Avaliação socioeconômica',
    slaDays: 7,
  }
]
```

---

## Estrutura Padrão Implementada

### Todos os workflows agora seguem este padrão:

```
┌─────────────────────────────────────────────────────────┐
│                     ESTRUTURA PADRÃO                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. RECEPÇÃO (order: 1)                                 │
│     → Recebimento e registro inicial                    │
│     → SLA: 1 dia                                        │
│     → Tabs: resumo, documentos, comunicacao             │
│     → Ação: APPROVE                                     │
│                                                          │
│  2. ANÁLISE DOCUMENTAL (order: 2)                       │
│     → Verificação de documentos                         │
│     → Tab primária: documentos                          │
│     → Ações: APPROVE, REQUEST_INFO, REJECT              │
│                                                          │
│  3. VALIDAÇÃO DE DADOS (order: 3)                       │
│     → Validação de dados do formulário                  │
│     → Tab primária: dados                               │
│     → Ações: APPROVE, REQUEST_INFO, REJECT              │
│                                                          │
│  4+. DEMAIS STAGES (order: 4+)                          │
│     → Aprovações específicas                            │
│     → Análises técnicas                                 │
│     → Conclusão/Finalização                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Benefícios da Padronização

### 1. Consistência
- Todos os workflows começam da mesma forma
- Experiência uniforme para os usuários
- Facilita o treinamento de novos funcionários

### 2. Rastreabilidade
- Sempre há um registro de quando o protocolo foi recebido
- Histórico completo desde o início

### 3. Organização
- Estrutura clara e previsível
- Facilita manutenção e evolução do sistema

### 4. Auditoria
- Ponto de controle inicial padronizado
- Facilita auditorias e relatórios

### 5. Flexibilidade
- Recepção pode ser automática ou manual
- Permite triagem inicial antes de processar

---

## Impacto nos Serviços

### Total de Serviços Impactados: 73

#### Por Módulo:
- **Saúde**: 8 workflows
- **Educação**: 7 workflows
- **Agricultura**: 8 workflows
- **Assistência Social**: 7 workflows
- **Cultura**: 9 workflows
- **Esporte**: 4 workflows
- **Habitação**: 5 workflows
- **Meio Ambiente**: 4 workflows
- **Obras e Urbanismo**: 15 workflows
- **Segurança**: 8 workflows
- **Turismo**: 3 workflows

### Workflows Não Impactados: 8
Estes workflows já possuíam "Recepção" ou "Recebimento" como primeira stage.

---

## Próximos Passos

1. **Executar Seed do Banco**
   ```bash
   cd digiurban/backend
   npm run seed
   ```

2. **Testar Workflows**
   - Criar protocolos de teste em diferentes serviços
   - Verificar se a stage de Recepção aparece corretamente
   - Validar fluxo completo

3. **Documentar para Usuários**
   - Atualizar manual do sistema
   - Treinar equipe sobre a nova estrutura
   - Comunicar mudanças aos departamentos

4. **Monitorar**
   - Acompanhar uso nos primeiros dias
   - Coletar feedback dos usuários
   - Ajustar se necessário
