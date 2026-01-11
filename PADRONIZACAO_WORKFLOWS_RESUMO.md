# Resumo da Padronização de Workflows

## Data: 2026-01-11

## Objetivo
Padronizar TODOS os workflows específicos para terem a estrutura padrão:
1. **Recepção** (order: 1) - Recebimento e registro inicial
2. **Análise Documental** (order: 2) - Verificação de documentos
3. **Validação de Dados** (order: 3) - Validação de dados do formulário
4. **Demais stages** (order: 4+) - Aprovações, conclusão, etc

## Arquivo Modificado
`c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\service-workflows.seed.ts`

## Estatísticas

- **Total de workflows encontrados**: 81
- **Total de workflows modificados**: 73
- **Total de workflows já padronizados**: 8

## Workflows Modificados (73)

Os seguintes workflows foram modificados para incluir a stage "Recepção" no início:

### SAÚDE (3)
1. ENCAMINHAMENTOS_TFD
2. TRANSPORTE_PACIENTES
3. AGENDAMENTO_CONSULTA

### SAÚDE - Serviços Adicionais (4)
4. SOLICITACAO_EXAMES
5. CARTAO_SUS
6. CAMPANHAS_VACINACAO
7. CONTROLE_MEDICAMENTOS
8. PROGRAMAS_SAUDE

### EDUCAÇÃO (5)
9. MATRICULA_ESCOLAR
10. TRANSFERENCIA_ESCOLAR
11. TRANSPORTE_ESCOLAR
12. CADASTRO_PROFESSOR
13. CONSULTA_FREQUENCIA_NOTAS

### EDUCAÇÃO - Serviços Adicionais (2)
14. INSCRICAO_CURSO_LIVRE
15. SOLICITACAO_DOCUMENTO_ESCOLAR

### AGRICULTURA (8)
16. CADASTRO_PRODUTOR
17. ASSISTENCIA_TECNICA
18. CADASTRO_PROPRIEDADE_RURAL
19. INSCRICAO_PROGRAMA_RURAL
20. FEIRA_PRODUTOR
21. LICENCA_EVENTOS_RURAIS
22. ANALISE_SOLO
23. SOLICITACAO_MAQUINAS

### ASSISTÊNCIA SOCIAL (7)
24. ATENDIMENTO_CRAS
25. AUXILIO_EMERGENCIAL
26. CADASTRO_UNICO
27. INSCRICAO_GRUPO_OFICINA
28. INSCRICAO_PROGRAMA_SOCIAL
29. SOLICITACAO_BENEFICIO
30. VISITA_DOMICILIAR

### CULTURA (9)
31. CADASTRO_ARTISTA
32. CADASTRO_EVENTO_CULTURAL
33. CADASTRO_GRUPO_ARTISTICO
34. INSCRICAO_OFICINA
35. REGISTRO_MANIFESTACAO_CULTURAL
36. RESERVA_ESPACO_CULTURAL
37. APOIO_CULTURAL
38. PROJETO_CULTURAL

### ESPORTE (4)
39. CADASTRO_ATLETA
40. INSCRICAO_COMPETICAO
41. INSCRICAO_ESCOLINHA
42. RESERVA_ESPACO_ESPORTIVO

### HABITAÇÃO (5)
43. AUTORIZACAO_CONSTRUCAO
44. INSCRICAO_PROGRAMA_HABITACIONAL
45. REGULARIZACAO_FUNDIARIA
46. SOLICITACAO_AUXILIO_ALUGUEL
47. VISTORIA_HABITACIONAL

### MEIO AMBIENTE (4)
48. AUTORIZACAO_PODA_ARVORES
49. PROGRAMA_AMBIENTAL
50. LICENCIAMENTO_AMBIENTAL
51. VISTORIA_AMBIENTAL

### OBRAS E URBANISMO (10)
52. AUTORIZACAO_DEMOLICAO
53. AUTORIZACAO_INTERVENCAO_VIA
54. PARCELAMENTO_SOLO
55. APROVACAO_PROJETO_ARQUITETONICO
56. VIABILIDADE_URBANISTICA
57. ALVARA_CONSTRUCAO

### OBRAS - Serviços Adicionais (5)
58. DESOBSTRUCAO_BUEIRO
59. ILUMINACAO_PUBLICA
60. LIMPEZA_URBANA
61. REGISTRO_PROBLEMA_FOTO
62. CAPINA_ROCAGEM

### SEGURANÇA (8)
63. ALERTA_SEGURANCA
64. AUTORIZACAO_EVENTO_SEGURANCA
65. CADASTRO_PONTO_CRITICO
66. DENUNCIA_ANONIMA
67. LAUDO_VISTORIA_SEGURANCA
68. REGISTRO_OCORRENCIA
69. SOLICITACAO_CAMERA_SEGURANCA
70. SOLICITACAO_PATRULHAMENTO

### TURISMO (3)
71. CADASTRO_ESTABELECIMENTO_TURISTICO
72. CADASTRO_GUIA_TURISTICO
73. REGISTRO_EVENTO_TURISTICO

## Workflows Já Padronizados (8)

Os seguintes workflows JÁ possuíam "Recepção" ou "Recebimento" como primeira stage e NÃO foram modificados:

1. **LICENCA_OBRA** - Tinha "Recebimento" (order: 1)
2. **ALVARA_FUNCIONAMENTO** - Tinha "Recepção" (order: 1)
3. **ATENDIMENTOS_AGRICULTURA** - Tinha "Recepção" (order: 1)
4. **ATENDIMENTOS_CULTURA** - Tinha "Recepção" (order: 1)
5. **REGISTRO_OCORRENCIA_ESCOLAR** - Tinha "Recepção" (order: 1)
6. **DENUNCIA_AMBIENTAL** - Tinha "Recepção" (order: 1)
7. **SOLICITACAO_REPARO_VIA** - Tinha "Recepção" (order: 1)
8. **DENUNCIA_CONSTRUCAO_IRREGULAR** - Tinha "Recepção" (order: 1)

## Estrutura da Stage de Recepção Adicionada

```typescript
{
  name: 'Recepção',
  order: 1,
  description: 'Recebimento e registro inicial da solicitação',
  slaDays: 1,
  availableTabs: ['resumo', 'documentos', 'comunicacao'],
  primaryTab: 'resumo',
  requiredDocumentTypes: [],
  requiredFormFields: [],
  allowedActions: ['APPROVE'],
  canSkip: false
}
```

## Exemplo de Workflow Modificado

### ENCAMINHAMENTOS_TFD (Antes)
```typescript
stages: [
  {
    name: 'Análise Documental',  // order: 1
    order: 1,
    // ...
  },
  {
    name: 'Validação de Dados',  // order: 2
    order: 2,
    // ...
  },
  {
    name: 'Regulação Médica',    // order: 3
    order: 3,
    // ...
  }
]
```

### ENCAMINHAMENTOS_TFD (Depois)
```typescript
stages: [
  {
    name: 'Recepção',            // order: 1 (NOVA)
    order: 1,
    // ...
  },
  {
    name: 'Análise Documental',  // order: 2 (era 1)
    order: 2,
    // ...
  },
  {
    name: 'Validação de Dados',  // order: 3 (era 2)
    order: 3,
    // ...
  },
  {
    name: 'Regulação Médica',    // order: 4 (era 3)
    order: 4,
    // ...
  }
]
```

## Próximos Passos

1. Executar o seed do banco de dados para atualizar os workflows:
   ```bash
   cd digiurban/backend
   npm run seed
   ```

2. Verificar se todos os workflows estão funcionando corretamente na aplicação

3. Testar a criação de protocolos em diferentes serviços para validar o fluxo de Recepção

## Notas Técnicas

- O script processou automaticamente 81 workflows
- Incrementou o `order` de todas as stages subsequentes quando a stage de Recepção foi adicionada
- Preservou todos os metadados de UI (availableTabs, primaryTab, etc.)
- Não modificou workflows que já tinham "Recepção" ou "Recebimento" como primeira stage
- Manteve a estrutura e formatação original do arquivo TypeScript
