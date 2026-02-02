# Análise Completa dos Serviços das 21 Secretarias

**Data da Análise:** 2026-02-02
**Total de Arquivos Analisados:** 21 secretarias

---

## 1. RESUMO EXECUTIVO

### Observação Crítica
Os arquivos de seed analisados **NÃO contêm definições explícitas de workflows ou stages**. Eles definem apenas:
- Metadados dos serviços (nome, descrição, tipo, prioridade)
- Requisitos de documentos (`requiresDocuments`, `requiredDocuments`)
- Esquemas de formulários (`formSchema`)

**As definições de workflow e stages devem estar localizadas em outro local do sistema.**

### Totais Gerais
- **Total de Serviços Analisados:** 390 serviços
- **Serviços COM_DADOS:** 278 (71.3%)
- **Serviços SEM_DADOS:** 112 (28.7%)
- **Serviços que Requerem Documentos:** 149 (38.2% do total)

---

## 2. ANÁLISE POR SECRETARIA

### 2.1. AGRICULTURA (20 serviços)
- **COM_DADOS:** 17
  - CAPTURA_COMPLETA: 7
  - SOLICITACAO_SIMPLES: 10
- **SEM_DADOS:** 3 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro de Produtor Rural**
   - Documentos: CPF, Comprovante de Residência, DAP (opcional)
2. **Solicitação de Máquinas e Equipamentos Agrícolas**
   - Documentos: CPF, Comprovante de Propriedade Rural, DAP
3. **Inscrição na Feira do Produtor**
   - Documentos: CPF, Comprovante de Residência, Laudo de Saúde
4. **Certificação de Orgânicos**
   - Documentos: CPF, DAP, Comprovante de Propriedade/Arrendamento
5. **Cadastro de Propriedade Agrícola**
   - Documentos: CPF, Comprovante de Propriedade, CAR

---

### 2.2. ASSISTÊNCIA SOCIAL (20 serviços)
- **COM_DADOS:** 14
  - CAPTURA_COMPLETA: 14
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro Único (CadÚnico)**
   - Documentos: CPF, RG, Comprovante de Residência, Certidões de Nascimento (filhos)
2. **Solicitação de Benefício Social**
   - Documentos: CPF, RG, Comprovante de Residência, Comprovante de Renda
3. **Auxílio Emergencial (Cesta Básica)**
   - Documentos: CPF, Comprovante de Residência, Comprovante de Renda
4. **Inscrição em Programa Habitacional**
   - Documentos: CPF, RG, Comprovante de Residência, Comprovante de Renda
5. **Cadastro no Programa Bolsa Família**
   - Documentos: CPF, RG, Comprovante de Residência, Certidões de Nascimento
6. **Solicitação de BPC (Benefício de Prestação Continuada)**
   - Documentos: CPF, RG, Laudo Médico (se deficiente), Comprovante de Renda
7. **Inscrição em CRAS (Centro de Referência de Assistência Social)**
   - Documentos: CPF, RG, Comprovante de Residência
8. **Inscrição em CREAS (Centro de Referência Especializado)**
   - Documentos: CPF, RG, Comprovante de Residência, Relatórios (se houver)

---

### 2.3. MEIO AMBIENTE (20 serviços)
- **COM_DADOS:** 15
  - CAPTURA_COMPLETA: 15
- **SEM_DADOS:** 5 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Licenciamento Ambiental**
   - Documentos: CPF, RG, Matrícula do Imóvel, Projeto Ambiental
2. **Autorização para Poda ou Supressão de Árvores**
   - Documentos: CPF, Comprovante de Propriedade, Justificativa Técnica
3. **Cadastro Ambiental Rural (CAR)**
   - Documentos: CPF, Comprovante de Propriedade/Posse
4. **Solicitação de Mudas para Plantio**
   - Documentos: CPF, Comprovante de Residência
5. **Licença para Uso de Recursos Naturais**
   - Documentos: CPF, RG, Projeto de Utilização, ART
6. **Autorização para Intervenção em APP**
   - Documentos: CPF, Matrícula do Imóvel, Estudo Técnico, ART
7. **Licença de Operação de Atividade Potencialmente Poluidora**
   - Documentos: CPF/CNPJ, Licença Prévia, Relatórios Ambientais

---

### 2.4. DEFESA CIVIL (15 serviços)
- **COM_DADOS:** 11
  - CAPTURA_COMPLETA: 6
  - SOLICITACAO_SIMPLES: 5
- **SEM_DADOS:** 4 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro de Família em Área de Risco**
   - Documentos: CPF, RG, Comprovante de Residência
2. **Solicitação de Vistoria em Imóvel com Risco**
   - Documentos: CPF, Comprovante de Propriedade/Locação

---

### 2.5. DESENVOLVIMENTO ECONÔMICO (20 serviços)
- **COM_DADOS:** 16
  - CAPTURA_COMPLETA: 10
  - SOLICITACAO_SIMPLES: 6
- **SEM_DADOS:** 4 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Alvará de Funcionamento**
   - Documentos: CPF, RG, CNPJ, Contrato Social, Laudo Técnico
2. **Cadastro MEI**
   - Documentos: CPF, RG, Comprovante de Residência
3. **Solicitação de Microcrédito**
   - Documentos: CPF, RG, Comprovante de Renda, Plano de Negócios
4. **Inscrição em Programa de Capacitação Profissional**
   - Documentos: CPF, RG, Comprovante de Escolaridade
5. **Licença para Ambulante**
   - Documentos: CPF, RG, Atestado de Saúde
6. **Cadastro de Feira Livre**
   - Documentos: CPF, RG, Atestado de Saúde
7. **Inscrição em Incubadora de Empresas**
   - Documentos: CPF, RG, Plano de Negócios, Comprovante de Escolaridade

---

### 2.6. CULTURA (20 serviços)
- **COM_DADOS:** 15
  - CAPTURA_COMPLETA: 15
- **SEM_DADOS:** 5 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro de Artistas Locais**
   - Documentos: CPF, RG, Portfólio/Currículo
2. **Submissão de Projetos Culturais**
   - Documentos: CPF, RG, Projeto Cultural, Orçamento
3. **Solicitação de Incentivo Cultural (Lei de Cultura)**
   - Documentos: CPF, CNPJ, Projeto Cultural, Plano de Trabalho
4. **Cadastro de Espaço Cultural**
   - Documentos: CPF/CNPJ, Comprovante de Propriedade, Alvará

---

### 2.7. EDUCAÇÃO (20 serviços)
- **COM_DADOS:** 14
  - CAPTURA_COMPLETA: 14
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Matrícula Escolar**
   - Documentos: Certidão de Nascimento, CPF, Comprovante de Residência
2. **Transferência Escolar**
   - Documentos: Histórico Escolar, Certidão de Nascimento
3. **Transporte Escolar**
   - Documentos: Declaração de Matrícula, Comprovante de Residência
4. **Solicitação de Uniforme Escolar**
   - Documentos: Declaração de Matrícula
5. **Solicitação de Material Escolar**
   - Documentos: Declaração de Matrícula, Comprovante de Renda (opcional)

---

### 2.8. ESPORTES (20 serviços)
- **COM_DADOS:** 16
  - CAPTURA_COMPLETA: 10
  - SOLICITACAO_SIMPLES: 6
- **SEM_DADOS:** 4 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro de Atleta Municipal**
   - Documentos: CPF, RG, Atestado Médico, Foto 3x4
2. **Cadastro de Escolinha Esportiva Particular**
   - Documentos: CNPJ, Alvará, Documentos do Responsável
3. **Inscrição em Projeto Esportivo Social**
   - Documentos: CPF/Certidão de Nascimento, Comprovante de Residência, Atestado Médico

---

### 2.9. FINANÇAS (20 serviços)
- **COM_DADOS:** 10
  - PAGAMENTO: 5
  - CAPTURA_COMPLETA: 5
- **SEM_DADOS:** 10 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Solicitação de Isenção de IPTU**
   - Documentos: CPF, RG, Comprovante de Propriedade, Declaração de Renda
2. **Parcelamento de Débitos Tributários**
   - Documentos: CPF/CNPJ, Comprovante de Renda

---

### 2.10. HABITAÇÃO (20 serviços)
- **COM_DADOS:** 15
  - CAPTURA_COMPLETA: 15
- **SEM_DADOS:** 5 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Regularização Fundiária**
   - Documentos: CPF, RG, Comprovante de Posse, Planta do Imóvel
2. **Inscrição em Programa Habitacional**
   - Documentos: CPF, RG, Comprovante de Residência, Comprovante de Renda
3. **Solicitação de Auxílio Aluguel**
   - Documentos: CPF, RG, Comprovante de Renda, Contrato de Aluguel
4. **Solicitação de Título de Propriedade**
   - Documentos: CPF, RG, Comprovante de Posse, Planta do Imóvel

---

### 2.11. TURISMO (15 serviços)
- **COM_DADOS:** 9
  - CAPTURA_COMPLETA: 9
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro de Estabelecimento Turístico**
   - Documentos: CNPJ, Alvará, Documentos do Responsável
2. **Cadastro de Guia Turístico**
   - Documentos: CPF, RG, Certificado de Formação, Foto

---

### 2.12. SEGURANÇA PÚBLICA (20 serviços)
- **COM_DADOS:** 13
  - CAPTURA_COMPLETA: 8
  - SOLICITACAO_SIMPLES: 5
- **SEM_DADOS:** 7 (CONSULTIVO)

**Serviços que requerem documentos:**
Nenhum serviço nesta secretaria requer documentos explicitamente.

---

### 2.13. TECNOLOGIA E INOVAÇÃO (15 serviços)
- **COM_DADOS:** 9
  - CAPTURA_COMPLETA: 6
  - SOLICITACAO_SIMPLES: 3
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro no Login Único Gov.br**
   - Documentos: CPF, RG, Comprovante de Residência

---

### 2.14. SAÚDE (20 serviços)
- **COM_DADOS:** 14
  - CAPTURA_COMPLETA: 10
  - SOLICITACAO_SIMPLES: 4
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Cadastro no Sistema de Saúde (Cartão SUS)**
   - Documentos: CPF, RG, Comprovante de Residência
2. **Solicitação de Medicamentos de Alto Custo**
   - Documentos: CPF, RG, Receita Médica, Laudo Médico
3. **Transporte de Pacientes (TFD)**
   - Documentos: CPF, RG, Guia de Encaminhamento Médico
4. **Solicitação de Cadeira de Rodas ou Equipamento**
   - Documentos: CPF, RG, Laudo Médico
5. **Autorização de Cirurgia Eletiva**
   - Documentos: CPF, RG, Pedido Médico, Exames

---

### 2.15. ADMINISTRAÇÃO (20 serviços)
- **COM_DADOS:** 10
  - SOLICITACAO_SIMPLES: 8
  - CAPTURA_COMPLETA: 2
- **SEM_DADOS:** 10 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Protocolo Online de Documentos**
   - Documentos: Arquivos diversos a protocolar

---

### 2.16. SERVIÇOS PÚBLICOS (20 serviços)
- **COM_DADOS:** 17
  - SOLICITACAO_SIMPLES: 15
  - CAPTURA_COMPLETA: 2
- **SEM_DADOS:** 3 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Registro de Problema com Foto**
   - Documentos: Foto do Problema

---

### 2.17. POLÍTICAS PARA MULHERES (15 serviços)
- **COM_DADOS:** 12
  - CAPTURA_COMPLETA: 11
  - SOLICITACAO_SIMPLES: 1
- **SEM_DADOS:** 3 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Agendamento no Centro de Referência da Mulher**
   - Documentos: RG ou CPF, Comprovante de Residência
2. **Solicitação de Acolhimento em Casa Abrigo**
   - Documentos: RG, CPF, Boletim de Ocorrência, Documentos dos Filhos
3. **Inscrição em Cursos de Qualificação Profissional**
   - Documentos: RG, CPF, Comprovante de Residência, Comprovante de Escolaridade
4. **Programa de Geração de Renda**
   - Documentos: RG, CPF, Comprovante de Residência, Comprovante de Renda
5. **Solicitação de Acompanhamento Social**
   - Documentos: RG, CPF, Comprovante de Residência
6. **Solicitação de Medida Protetiva de Urgência**
   - Documentos: RG, CPF, Boletim de Ocorrência, Provas
7. **Agendamento para Perícia Psicossocial**
   - Documentos: RG, CPF, Processo Judicial, Encaminhamento do Juizado

---

### 2.18. OBRAS PÚBLICAS (20 serviços)
- **COM_DADOS:** 14
  - CAPTURA_COMPLETA: 9
  - SOLICITACAO_SIMPLES: 5
- **SEM_DADOS:** 6 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Autorização para Demolição**
   - Documentos: CPF, RG, Matrícula do Imóvel, Projeto de Demolição, ART
2. **Autorização para Intervenção em Via Pública**
   - Documentos: CPF, RG, CNPJ, Projeto de Intervenção, ART
3. **Aprovação de Projeto de Construção**
   - Documentos: Projeto Arquitetônico, ART, Matrícula do Imóvel, Planta de Situação
4. **Licença para Obra**
   - Documentos: Projeto Aprovado, ART, Matrícula do Imóvel, IPTU
5. **Alvará de Reforma**
   - Documentos: Projeto de Reforma, ART, Matrícula do Imóvel
6. **Aprovação de Loteamento**
   - Documentos: Projeto de Loteamento, Memorial, Matrícula, ART, Licença Ambiental
7. **Regularização de Obra**
   - Documentos: Projeto As-Built, ART, Matrícula do Imóvel, Fotos
8. **Aprovação de Demolição Parcial**
   - Documentos: Projeto de Demolição, ART, Matrícula do Imóvel

---

### 2.19. MOBILIDADE URBANA (15 serviços)
- **COM_DADOS:** 12
  - CAPTURA_COMPLETA: 8
  - SOLICITACAO_SIMPLES: 4
- **SEM_DADOS:** 3 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Solicitação de Cartão Transporte**
   - Documentos: RG ou CPF, Foto 3x4, Comprovante de Residência
2. **Passe Livre Interestadual (PCD)**
   - Documentos: RG, CPF, Laudo Médico, Foto 3x4, Comprovante de Residência, Declaração de Renda
3. **Isenção de Tarifa para Idosos**
   - Documentos: RG, CPF, Foto 3x4, Comprovante de Residência
4. **Cartão Transporte para Pessoa com Deficiência**
   - Documentos: RG, CPF, Laudo Médico, Foto 3x4, Comprovante de Residência
5. **Cartão Estudante (Meia Passagem)**
   - Documentos: RG ou CPF, Declaração de Matrícula, Foto 3x4, Comprovante de Residência
6. **Solicitação de Vaga Especial para PCD**
   - Documentos: RG, CPF, CNH, Laudo Médico, Documento do Veículo, Comprovante de Residência
7. **Autorização para Transporte Escolar**
   - Documentos: CNH categoria D+, Antecedentes Criminais, Doc. Veículo, Vistoria, Seguro
8. **Solicitação de Transporte Escolar Gratuito**
   - Documentos: RG/Certidão, CPF, Declaração de Matrícula, Comprovante de Residência

---

### 2.20. TRANSPORTES E TRÂNSITO (20 serviços)
- **COM_DADOS:** 16
  - CAPTURA_COMPLETA: 10
  - SOLICITACAO_SIMPLES: 6
- **SEM_DADOS:** 4 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Defesa de Autuação de Trânsito**
   - Documentos: CNH, CRLV, Notificação de Autuação, Comprovantes
2. **Credenciamento de Táxi**
   - Documentos: CNH B+, Antecedentes Criminais, Comprovante de Residência, Curso, Vistoria
3. **Credenciamento de Mototáxi**
   - Documentos: CNH A+, Antecedentes Criminais, Comprovante de Residência, Curso, Vistoria
4. **Credenciamento de Transporte Escolar**
   - Documentos: CNH D, Antecedentes Criminais, Curso, Vistoria, CRLV, Seguro
5. **Vistoria de Veículo de Transporte**
   - Documentos: CRLV, Comprovante de Pagamento de Taxas
6. **Autorização para Evento em Via Pública**
   - Documentos: Projeto do Evento, Seguro de Responsabilidade Civil, Alvará
7. **Solicitação de CNH Social**
   - Documentos: RG, CPF, Comprovante de Residência, Comprovante de Renda Familiar
8. **Renovação de Credenciamento de Táxi/Mototáxi**
   - Documentos: CNH Atualizada, CRLV Atualizado, Vistoria em Dia, Certidão Negativa
9. **Solicitação de Faixa Exclusiva para Carga/Descarga**
   - Documentos: Alvará de Funcionamento, Planta de Localização
10. **Transferência de Ponto de Táxi**
    - Documentos: Credencial de Taxista, Certidão Negativa de Multas, Justificativa
11. **Solicitação de Vaga Especial (Idoso/PcD)**
    - Documentos: Laudo Médico/RG Idoso, CRLV, Comprovante de Residência

---

### 2.21. PLANEJAMENTO URBANO (20 serviços)
- **COM_DADOS:** 9
  - CAPTURA_COMPLETA: 8
  - SOLICITACAO_SIMPLES: 1
- **SEM_DADOS:** 11 (CONSULTIVO)

**Serviços que requerem documentos:**
1. **Autorização de Parcelamento do Solo**
   - Documentos: CPF, RG, CNPJ, Matrícula do Imóvel, Projeto de Parcelamento, ART
2. **Consulta de Viabilidade Urbanística**
   - Documentos: CPF, RG, Matrícula do Imóvel, Memorial Descritivo
3. **Aprovação de Projeto Arquitetônico**
   - Documentos: Projeto Arquitetônico, ART, Documentação do Imóvel
4. **Alvará de Construção**
   - Documentos: Projeto Aprovado, Matrícula do Imóvel, ART
5. **Alvará de Funcionamento**
   - Documentos: CNPJ, Contrato Social, Laudo Técnico, Comprovante de Endereço
6. **Anuência para Remembramento de Lote**
   - Documentos: CPF, RG, Matrículas dos Lotes, Planta de Situação, ART
7. **Análise de Viabilidade de Empreendimento**
   - Documentos: CNPJ, Projeto Preliminar, Estudo de Impacto, Matrícula do Terreno
8. **Aprovação de Projeto de Urbanização**
   - Documentos: Projeto de Urbanização, Memorial Descritivo, ART, Estudo Ambiental

---

## 3. SERVIÇOS COM_DADOS QUE REQUEREM DOCUMENTOS

### Total Identificado: 149 serviços

Estes são serviços do tipo COM_DADOS que possuem:
- `requiresDocuments: true` E/OU
- Array `requiredDocuments` com pelo menos 1 documento E/OU
- formFields com type "file" (não encontrado nos arquivos analisados)

---

## 4. PROBLEMA IDENTIFICADO

### AUSÊNCIA DE DEFINIÇÕES DE WORKFLOW NOS SEEDS

**Todos os 21 arquivos de seed analisados NÃO contêm:**
- Propriedades `workflow` ou `stages`
- Configurações de stages de aprovação de documentos
- Definições de fluxo de trabalho

**O que os arquivos contêm:**
- Metadados dos serviços
- Requisitos de documentos (`requiresDocuments`, `requiredDocuments`)
- Esquemas de formulários (`formSchema`)
- Configurações de unicidade (`allowMultipleActiveProtocols`, `uniquenessRules`)

### CONCLUSÃO

As definições de workflow e stages provavelmente estão localizadas em:
1. Um arquivo de configuração separado
2. Tabelas do banco de dados
3. Outro módulo do sistema
4. São geradas dinamicamente pelo backend

**Recomendação:** Para completar esta análise, é necessário localizar onde as definições de workflow são armazenadas no sistema. Possíveis locais:
- `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\workflows\`
- `c:\Projetos Cursor\Digiurbanlite\digiurban\backend\src\modules\workflows\`
- Tabela `workflows` ou `service_workflows` no banco de dados

---

## 5. ESTATÍSTICAS DETALHADAS

### Por Tipo de Serviço
| Tipo | Quantidade | Percentual |
|------|-----------|-----------|
| COM_DADOS | 278 | 71.3% |
| SEM_DADOS | 112 | 28.7% |
| **TOTAL** | **390** | **100%** |

### Por Subtipo de COM_DADOS
| Subtipo | Quantidade | Percentual |
|---------|-----------|-----------|
| CAPTURA_COMPLETA | 183 | 65.8% |
| SOLICITACAO_SIMPLES | 90 | 32.4% |
| PAGAMENTO | 5 | 1.8% |
| **TOTAL COM_DADOS** | **278** | **100%** |

### Serviços com Documentos
| Categoria | Quantidade | Percentual do Total |
|-----------|-----------|---------------------|
| Requerem Documentos | 149 | 38.2% |
| Não Requerem | 241 | 61.8% |
| **TOTAL** | **390** | **100%** |

---

## 6. PRÓXIMOS PASSOS RECOMENDADOS

1. **Localizar Definições de Workflow**
   - Buscar por arquivos que contenham `stages`, `workflow`, `documentApproval`
   - Verificar estrutura do banco de dados para tabelas relacionadas a workflows

2. **Analisar Sistema de Workflow**
   - Entender como os workflows são associados aos serviços
   - Identificar quais serviços possuem stages de aprovação de documentos

3. **Validar Inconsistências**
   - Verificar se todos os serviços COM_DADOS com documentos têm workflows apropriados
   - Identificar serviços sem stages de aprovação quando deveriam ter

4. **Documentar Estrutura**
   - Mapear relacionamento entre serviços e workflows
   - Criar documentação de como os stages são definidos e executados

---

## 7. OBSERVAÇÕES TÉCNICAS

### Estrutura dos Arquivos Seed
Todos os arquivos seguem o padrão:
```typescript
export const [secretaryName]Services: ServiceDefinition[] = [
  {
    name: string,
    description: string,
    departmentCode: string,
    serviceType: 'COM_DADOS' | 'SEM_DADOS',
    serviceSubtype: ServiceSubtype,
    moduleType: string | null,
    requiresDocuments: boolean,
    requiredDocuments?: string[],
    estimatedDays: number | null,
    priority: number,
    category: string,
    icon: string,
    color: string,
    formSchema?: object,
    allowMultipleActiveProtocols?: boolean,
    uniquenessScope?: string,
    uniquenessRules?: object
  }
]
```

### Campos Relacionados a Documentos
- `requiresDocuments`: booleano indicando se o serviço requer documentos
- `requiredDocuments`: array de strings com nomes dos documentos
- `formSchema.properties`: pode conter campos de arquivo (não encontrados nos seeds)

---

**Documento gerado automaticamente pela análise dos 21 arquivos de seed das secretarias**
