# 🚀 PLANO DE IMPLEMENTAÇÃO - FORMULÁRIOS COMPLETOS
## Opção A - Implementação Completa e Sistemática

**Início:** 08/11/2024
**Estimativa:** 8-10 horas de trabalho sistemático

---

## 📋 **FASE 1: LIMPEZA (1-2 horas)**

### Serviços a REMOVER do portal do cidadão (manter apenas administrativo):

#### **Categoria: Atendimentos Genéricos** (12 serviços)
1. ❌ Atendimentos - Saúde (linha 58)
2. ❌ Atendimentos - Agricultura (linha 522)
3. ❌ Atendimentos - Educação (linha 749)
4. ❌ Atendimentos - Assistência Social (linha 1100)
5. ❌ Atendimentos - Cultura (linha 1229)
6. ❌ Atendimentos - Esportes (linha 1359)
7. ❌ Atendimentos - Habitação (linha 1489)
8. ❌ Atendimentos - Meio Ambiente (linha 1591)
9. ❌ Atendimentos - Obras Públicas (linha 1692)
10. ❌ Atendimentos - Planejamento Urbano (linha 1791)
11. ❌ Atendimentos - Segurança Pública (linha 1919)
12. ❌ Atendimentos - Serviços Públicos (linha 2070)
13. ❌ Atendimentos - Turismo (linha 2193)

#### **Categoria: Gestão Administrativa** (5 serviços)
14. ❌ Gestão de Agentes Comunitários de Saúde (linha 480)
15. ❌ Gestão Escolar (linha 1055)
16. ❌ Gestão de Merenda Escolar (linha 1068)
17. ❌ Gestão CRAS/CREAS (linha 1210)
18. ❌ Gestão de Áreas Protegidas (linha 1673)
19. ❌ Gestão da Guarda Municipal (linha 2025)
20. ❌ Gestão de Vigilância (linha 2038)
21. ❌ Gestão de Equipes de Serviços (linha 2174)

#### **Categoria: Consultas/Visualização** (7 serviços)
22. ✅ Consulta de Frequência (MANTER - mas melhorar)
23. ✅ Consulta de Notas e Boletim (MANTER - mas melhorar)
24. ❌ Calendário Escolar (informativo - não precisa formulário)
25. ❌ Agenda de Eventos Culturais (informativo)
26. ❌ Agenda de Eventos Esportivos (informativo)
27. ❌ Consulta de Programas Habitacionais (informativo)
28. ❌ Mapa de Obras (informativo)
29. ❌ Estatísticas de Segurança (informativo)

**Total a remover:** ~21 serviços
**Total a manter mas converter em informativos:** ~8 serviços

---

## 📝 **FASE 2: PADRONIZAÇÃO (2-3 horas)**

### Template Padrão de Dados do Cidadão

Todos os serviços devem ter este bloco INICIAL:

```typescript
// BLOCO 1: IDENTIFICAÇÃO (sempre pré-preenchido)
{
  nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
  cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
  rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
  dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

  // BLOCO 2: CONTATO (sempre pré-preenchido)
  email: { type: 'string', format: 'email', title: 'E-mail' },
  telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
  telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

  // BLOCO 3: ENDEREÇO (sempre pré-preenchido)
  cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
  logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
  numero: { type: 'string', title: 'Número', maxLength: 10 },
  complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
  bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
  pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

  // BLOCO 4: DADOS COMPLEMENTARES (alguns pré-preenchidos)
  nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
  estadoCivil: {
    type: 'string',
    title: 'Estado Civil',
    enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']
  },
  profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
  rendaFamiliar: {
    type: 'string',
    title: 'Faixa de Renda Familiar',
    enum: [
      'Até 1 salário mínimo',
      'De 1 a 2 salários mínimos',
      'De 2 a 3 salários mínimos',
      'De 3 a 5 salários mínimos',
      'Acima de 5 salários mínimos'
    ]
  },
  possuiDeficiencia: { type: 'boolean', title: 'Possui alguma deficiência?', default: false },
  tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência (se aplicável)', maxLength: 200 }
}

// REQUIRED PADRÃO:
required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae']
```

---

## 🏥 **FASE 3A: ENRIQUECER SAÚDE (1 hora)**

### **1. Agendamento de Consulta Médica** ✅ (já está bom)
Adicionar apenas:
```typescript
{
  // ... campos padrão do cidadão ...

  // DADOS DE SAÚDE
  cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$' },
  alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
  necessidadesEspeciais: {
    type: 'string',
    title: 'Necessidades Especiais',
    enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (precisa LIBRAS)', 'Mobilidade Reduzida', 'Outra']
  },
  possuiConvenio: { type: 'boolean', title: 'Possui Convênio Particular?', default: false },
  nomeConvenio: { type: 'string', title: 'Nome do Convênio (se aplicável)', maxLength: 100 },

  // DADOS DO AGENDAMENTO
  especialidade: { ... },
  unidadePreferencial: { ... },
  dataPreferencial: { ... },
  turnoPreferencial: { ... },
  motivoConsulta: { ... },
  primeiraConsulta: { ... },
  urgencia: { ... }
}
```

### **2. Controle de Medicamentos** ✅ (já está bom)
Adicionar:
```typescript
{
  // ... campos padrão do cidadão ...

  // DADOS DE SAÚDE
  cartaoSUS: { ... },

  // DADOS DA RECEITA
  numeroReceita: { ... },
  dataReceita: { ... },
  nomeMedico: { ... },
  crmMedico: { ... },

  // MEDICAMENTOS
  medicamentos: [ ... ],

  // RETIRADA
  dificuldadeLocomocao: { type: 'boolean', title: 'Possui dificuldade de locomoção?', default: false },
  solicitaEntregaDomiciliar: { type: 'boolean', title: 'Solicita entrega em domicílio?', default: false },
  horarioPreferencialRetirada: {
    type: 'string',
    title: 'Horário Preferencial',
    enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Indiferente']
  },
  autorizaFamiliarRetirar: { type: 'boolean', title: 'Autoriza familiar retirar?', default: false },
  nomeFamiliarAutorizado: { type: 'string', title: 'Nome do Familiar Autorizado', maxLength: 200 },
  cpfFamiliarAutorizado: { type: 'string', title: 'CPF do Familiar', pattern: '^\\d{11}$' }
}
```

### **3. Campanhas de Vacinação** ⚠️ (precisa enriquecer)
```typescript
{
  // ... campos padrão do cidadão ...

  // DADOS DE SAÚDE
  cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$' },
  numeroCartaoVacina: { type: 'string', title: 'Número do Cartão de Vacina', maxLength: 50 },

  // CAMPANHA
  tipoCampanha: {
    type: 'string',
    title: 'Qual campanha?',
    enum: ['COVID-19', 'Gripe (Influenza)', 'Multivacinação', 'HPV', 'Febre Amarela', 'Outra']
  },
  outraCampanha: { type: 'string', title: 'Especifique a campanha', maxLength: 100 },

  // HISTÓRICO
  jaTomouDoseAnterior: { type: 'boolean', title: 'Já tomou dose anterior desta vacina?', default: false },
  dataDoseAnterior: { type: 'string', format: 'date', title: 'Data da Dose Anterior' },
  loteDoseAnterior: { type: 'string', title: 'Lote da Dose Anterior (se souber)', maxLength: 50 },

  // CONTRAINDICAÇÕES
  possuiContraindicacao: { type: 'boolean', title: 'Possui alguma contraindicação?', default: false },
  tipoContraindicacao: {
    type: 'string',
    title: 'Tipo de Contraindicação',
    enum: ['Gestante', 'Imunossuprimido', 'Alérgico ao componente', 'Doença aguda no momento', 'Outra']
  },
  observacoesContraindicacao: { type: 'string', title: 'Observações sobre contraindicação', maxLength: 500 },

  // PREFERÊNCIAS
  unidadePreferencial: { type: 'string', title: 'Unidade de Saúde Preferencial', maxLength: 200 },
  dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
  turnoPreferencial: {
    type: 'string',
    title: 'Turno Preferencial',
    enum: ['Manhã', 'Tarde', 'Indiferente']
  }
}
```

---

## 🎓 **FASE 3B: ENRIQUECER EDUCAÇÃO (1.5 horas)**

### **1. Matrícula de Aluno** ⚠️ (precisa MUITO melhorar)

```typescript
{
  // DADOS DO RESPONSÁVEL (pré-preenchidos)
  nomeResponsavel: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
  cpfResponsavel: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$' },
  rgResponsavel: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
  emailResponsavel: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
  telefoneResponsavel: { type: 'string', title: 'Telefone do Responsável', pattern: '^\\d{10,11}$' },
  telefoneEmergencia: { type: 'string', title: 'Telefone de Emergência', pattern: '^\\d{10,11}$' },
  enderecoResponsavel: { type: 'string', title: 'Endereço Completo', minLength: 10, maxLength: 500 },

  // DADOS DO ALUNO
  nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
  cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
  dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
  sexoAluno: {
    type: 'string',
    title: 'Sexo',
    enum: ['Masculino', 'Feminino']
  },

  // DOCUMENTAÇÃO
  numeroCertidaoNascimento: { type: 'string', title: 'Número da Certidão de Nascimento', maxLength: 50 },
  numeroRG: { type: 'string', title: 'RG do Aluno (se possuir)', maxLength: 20 },

  // DADOS COMPLEMENTARES (CENSO ESCOLAR)
  corRaca: {
    type: 'string',
    title: 'Cor/Raça (Censo Escolar)',
    enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada']
  },
  tipoSanguineo: {
    type: 'string',
    title: 'Tipo Sanguíneo',
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei']
  },

  // SAÚDE DO ALUNO
  possuiDeficiencia: { type: 'boolean', title: 'Possui alguma deficiência ou necessidade especial?', default: false },
  tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência/Necessidade', maxLength: 500 },
  alergiasAlimentares: { type: 'string', title: 'Alergias Alimentares (se houver)', maxLength: 500 },
  medicamentoControladoUsa: { type: 'boolean', title: 'Usa medicamento controlado?', default: false },
  qualMedicamento: { type: 'string', title: 'Qual medicamento?', maxLength: 200 },

  // FILIAÇÃO
  nomeMae: { type: 'string', title: 'Nome Completo da Mãe', minLength: 3, maxLength: 200 },
  cpfMae: { type: 'string', title: 'CPF da Mãe', pattern: '^\\d{11}$' },
  nomePai: { type: 'string', title: 'Nome Completo do Pai', maxLength: 200 },
  cpfPai: { type: 'string', title: 'CPF do Pai (se conhecido)', pattern: '^\\d{11}$' },

  // COMPOSIÇÃO FAMILIAR
  quantidadePessoasCasa: { type: 'integer', title: 'Quantas pessoas moram na casa?', minimum: 1 },
  rendaFamiliar: {
    type: 'string',
    title: 'Faixa de Renda Familiar',
    enum: [
      'Até R$ 1.412,00 (1 salário mínimo)',
      'De R$ 1.412,01 a R$ 2.824,00 (1 a 2 SM)',
      'De R$ 2.824,01 a R$ 4.236,00 (2 a 3 SM)',
      'De R$ 4.236,01 a R$ 7.060,00 (3 a 5 SM)',
      'Acima de R$ 7.060,00 (mais de 5 SM)'
    ]
  },
  possuiIrmaosEscola: { type: 'boolean', title: 'Possui irmãos matriculados na mesma escola?', default: false },
  nomeIrmaos: { type: 'string', title: 'Nome dos irmãos', maxLength: 300 },

  // HISTÓRICO ESCOLAR
  frequentouCreche: { type: 'boolean', title: 'Frequentou creche/pré-escola?', default: false },
  nomeEscolaAnterior: { type: 'string', title: 'Nome da escola anterior (se houver)', maxLength: 200 },
  anoEscolaAnterior: { type: 'string', title: 'Último ano cursado', maxLength: 50 },

  // DADOS DA MATRÍCULA
  serieAnoDesejado: {
    type: 'string',
    title: 'Série/Ano Desejado',
    enum: [
      'Creche (0-3 anos)',
      'Pré-escola (4-5 anos)',
      '1º Ano',
      '2º Ano',
      '3º Ano',
      '4º Ano',
      '5º Ano',
      '6º Ano',
      '7º Ano',
      '8º Ano',
      '9º Ano',
      'EJA - Fundamental',
      'EJA - Médio'
    ]
  },
  escolaPreferencial: { type: 'string', title: 'Escola Preferencial', maxLength: 200 },
  turno: {
    type: 'string',
    title: 'Turno Preferencial',
    enum: ['Manhã', 'Tarde', 'Integral', 'Noite (EJA)']
  },

  // OBSERVAÇÕES
  observacoes: { type: 'string', title: 'Observações Adicionais', maxLength: 1000 }
}

required: [
  'nomeResponsavel', 'cpfResponsavel', 'emailResponsavel', 'telefoneResponsavel',
  'nomeAluno', 'dataNascimentoAluno', 'sexoAluno', 'numeroCertidaoNascimento',
  'nomeMae', 'rendaFamiliar', 'serieAnoDesejado', 'turno'
]
```

---

## 🤝 **FASE 3C: ENRIQUECER ASSISTÊNCIA SOCIAL (1.5 horas)**

### **1. Cadastro Único (CadÚnico)** ⚠️ (CRÍTICO - muito simples)

```typescript
{
  // DADOS DO RESPONSÁVEL FAMILIAR (pré-preenchidos)
  nomeResponsavel: { ... },
  cpfResponsavel: { ... },
  dataNascimentoResponsavel: { ... },
  // ... todos os campos padrão ...

  // DADOS DO DOMICÍLIO
  tipoDomicilio: {
    type: 'string',
    title: 'Tipo de Domicílio',
    enum: ['Casa', 'Apartamento', 'Cômodo', 'Barraco', 'Oca/Maloca', 'Outro']
  },
  situacaoDomicilio: {
    type: 'string',
    title: 'Situação do Domicílio',
    enum: ['Próprio quitado', 'Próprio pagando', 'Alugado', 'Cedido', 'Ocupação', 'Outra']
  },
  materialParedesExternas: {
    type: 'string',
    title: 'Material das Paredes Externas',
    enum: ['Alvenaria com revestimento', 'Alvenaria sem revestimento', 'Madeira aparelhada', 'Taipa revestida', 'Taipa não revestida', 'Madeira aproveitada', 'Palha', 'Outro']
  },
  numeroComo dos: { type: 'integer', title: 'Número de Cômodos', minimum: 1 },
  numeroQuartos: { type: 'integer', title: 'Número de Quartos para Dormir', minimum: 0 },

  // INFRAESTRUTURA
  abastecimentoAgua: {
    type: 'string',
    title: 'Forma de Abastecimento de Água',
    enum: ['Rede pública', 'Poço ou nascente', 'Cisterna', 'Caminhão-pipa', 'Outra']
  },
  aguaCanalizada: { type: 'boolean', title: 'Água canalizada em pelo menos um cômodo?', default: false },

  escoamentoSanitario: {
    type: 'string',
    title: 'Escoamento Sanitário',
    enum: ['Rede coletora de esgoto', 'Fossa séptica', 'Fossa rudimentar', 'Vala', 'Direto para rio/mar', 'Outro']
  },

  energiaEletrica: {
    type: 'string',
    title: 'Energia Elétrica',
    enum: ['Rede pública', 'Gerador particular', 'Solar', 'Não tem']
  },

  coletaLixo: {
    type: 'string',
    title: 'Coleta de Lixo',
    enum: ['Coletado', 'Queimado/Enterrado', 'Jogado em terreno baldio', 'Outro']
  },

  // COMPOSIÇÃO FAMILIAR
  quantidadePessoas: { type: 'integer', title: 'Quantas pessoas moram no domicílio?', minimum: 1 },

  pessoasFamilia: {
    type: 'array',
    title: 'Pessoas da Família',
    items: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        parentesco: {
          type: 'string',
          title: 'Parentesco com Responsável',
          enum: ['Próprio', 'Cônjuge/Companheiro(a)', 'Filho(a)', 'Enteado(a)', 'Neto(a)', 'Pai/Mãe', 'Sogro(a)', 'Irmão/Irmã', 'Genro/Nora', 'Outro parente', 'Sem parentesco']
        },
        sexo: { type: 'string', enum: ['Masculino', 'Feminino'] },
        corRaca: { type: 'string', enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'] },
        escolaridade: {
          type: 'string',
          enum: ['Sem instrução', 'Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior incompleto', 'Superior completo']
        },
        estaTrabalhando: { type: 'boolean', default: false },
        rendaMensal: { type: 'number', title: 'Renda Mensal (R$)', minimum: 0 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'parentesco', 'sexo']
    },
    minItems: 1
  },

  // RENDA FAMILIAR
  rendaTotalFamilia: { type: 'number', title: 'Renda Total da Família (R$)', minimum: 0 },
  rendaPerCapita: { type: 'number', title: 'Renda Per Capita (R$)', minimum: 0 },

  // PROGRAMAS SOCIAIS
  recebeBolsaFamilia: { type: 'boolean', title: 'Recebe Bolsa Família atualmente?', default: false },
  nisBolsaFamilia: { type: 'string', title: 'NIS do Bolsa Família', maxLength: 20 },

  recebeBPC: { type: 'boolean', title: 'Recebe BPC (Benefício de Prestação Continuada)?', default: false },
  nisBPC: { type: 'string', title: 'NIS do BPC', maxLength: 20 },

  outrosBeneficios: { type: 'string', title: 'Outros Benefícios que recebe', maxLength: 500 },

  // SITUAÇÃO
  temCadastroOutroMunicipio: { type: 'boolean', title: 'Tem cadastro em outro município?', default: false },
  qualMunicipio: { type: 'string', title: 'Qual município?', maxLength: 100 },

  // OBSERVAÇÕES
  observacoes: { type: 'string', title: 'Observações', maxLength: 2000 }
}

required: [
  'nomeResponsavel', 'cpfResponsavel', 'dataNascimentoResponsavel',
  'tipoDomicilio', 'abastecimentoAgua', 'escoamentoSanitario',
  'quantidadePessoas', 'pessoasFamilia', 'rendaTotalFamilia'
]
```

---

## 🌾 **FASE 3D: ENRIQUECER AGRICULTURA (1 hora)**

### **1. Cadastro de Produtor Rural** ✅ (já fizemos, mas vou complementar)

```typescript
{
  // ... campos padrão do cidadão (já tem) ...

  // DADOS DO PRODUTOR (já tem)
  tipoProdutor: { ... },
  dap: { ... },
  areaTotalHectares: { ... },
  principaisProducoes: { ... },

  // ADICIONAR:

  // DADOS DA PROPRIEDADE
  tipoPropriedade: {
    type: 'string',
    title: 'Tipo de Propriedade',
    enum: ['Própria', 'Arrendada', 'Parceria/Meação', 'Comodato', 'Assentamento', 'Posse', 'Outra']
  },
  nomePropriedade: { type: 'string', title: 'Nome da Propriedade/Sítio/Fazenda', maxLength: 200 },
  enderecoPropriedade: { type: 'string', title: 'Endereço/Localização da Propriedade', maxLength: 500 },
  coordenadasGPS: { type: 'string', title: 'Coordenadas GPS (se souber)', maxLength: 100 },

  // PRODUÇÃO
  principaisCulturas: { type: 'string', title: 'Principais Culturas Plantadas', maxLength: 500 },
  principaisCriacoes: { type: 'string', title: 'Principais Criações Animais', maxLength: 500 },

  possuiIrrigacao: { type: 'boolean', title: 'Possui sistema de irrigação?', default: false },
  tipoIrrigacao: { type: 'string', title: 'Tipo de irrigação', maxLength: 200 },

  usaAgrotoxicos: { type: 'boolean', title: 'Usa agrotóxicos?', default: false },

  // CERTIFICAÇÕES
  possuiCertificacaoOrganica: { type: 'boolean', title: 'Possui certificação orgânica?', default: false },
  orgaoCertificador: { type: 'string', title: 'Órgão Certificador', maxLength: 200 },

  // ASSOCIAÇÕES
  participaCooperativa: { type: 'boolean', title: 'Participa de cooperativa?', default: false },
  nomeCooperativa: { type: 'string', title: 'Nome da Cooperativa', maxLength: 200 },

  participaSindicato: { type: 'boolean', title: 'É sindicalizado?', default: false },
  nomeSindicato: { type: 'string', title: 'Nome do Sindicato', maxLength: 200 },

  // COMERCIALIZAÇÃO
  comercializaPAA: { type: 'boolean', title: 'Comercializa para PAA (Programa de Aquisição de Alimentos)?', default: false },
  comercializaPNAE: { type: 'boolean', title: 'Fornece para PNAE (Merenda Escolar)?', default: false },

  // MAQUINÁRIO
  possuiMaquinario: { type: 'boolean', title: 'Possui maquinário agrícola?', default: false },
  tiposMaquinario: { type: 'string', title: 'Tipos de maquinário que possui', maxLength: 500 },

  // ASSISTÊNCIA TÉCNICA
  recebeATER: { type: 'boolean', title: 'Recebe Assistência Técnica (ATER)?', default: false },
  orgaoATER: { type: 'string', title: 'Órgão que presta ATER', maxLength: 200 },

  // OBSERVAÇÕES
  observacoes: { type: 'string', title: 'Observações Adicionais', maxLength: 1000 }
}
```

---

## ⏱️ **CRONOGRAMA DE EXECUÇÃO:**

| Fase | Descrição | Tempo Estimado | Status |
|------|-----------|----------------|--------|
| 1 | Remover serviços administrativos | 1-2h | ⏳ Pendente |
| 2 | Aplicar template padrão em TODOS | 2-3h | ⏳ Pendente |
| 3A | Enriquecer Saúde (3 serviços principais) | 1h | ⏳ Pendente |
| 3B | Enriquecer Educação (3 serviços principais) | 1.5h | ⏳ Pendente |
| 3C | Enriquecer Assistência Social (3 principais) | 1.5h | ⏳ Pendente |
| 3D | Enriquecer Agricultura (já iniciado) | 0.5h | 🟡 Parcial |
| 3E | Enriquecer outras secretarias | 2h | ⏳ Pendente |
| 4 | Atualizar banco de dados | 0.5h | ⏳ Pendente |
| 5 | Testes e validação | 1h | ⏳ Pendente |
| **TOTAL** | | **10-12h** | |

---

## 📌 **PRÓXIMA AÇÃO:**

Começar pela **FASE 1** - Remover serviços administrativos do arquivo de seed.

Deseja que eu comece agora?
