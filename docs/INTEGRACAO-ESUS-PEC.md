# 🏥 Integração DigiUrban com PEC e-SUS APS

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Comparativo: PEC e-SUS vs DigiUrban](#comparativo-pec-e-sus-vs-digiurban)
3. [Métodos de Integração](#métodos-de-integração)
4. [Configuração](#configuração)
5. [Implementação Técnica](#implementação-técnica)
6. [Roadmap de Alinhamento](#roadmap-de-alinhamento)
7. [Referências](#referências)

---

## 🎯 Visão Geral

O **PEC (Prontuário Eletrônico do Cidadão)** do e-SUS APS é o sistema oficial do Ministério da Saúde para registro eletrônico de atendimentos na Atenção Primária à Saúde (APS). Este documento detalha:

- Como o DigiUrban se compara ao PEC e-SUS
- Métodos de integração disponíveis
- Implementação da configuração de credenciais
- Plano de alinhamento completo com os padrões do PEC

---

## 📊 Comparativo: PEC e-SUS vs DigiUrban

### ✅ Funcionalidades Compatíveis

| Funcionalidade | Status |
|----------------|--------|
| Cadastro de Cidadãos | ✅ Compatível |
| Cadastro de Profissionais de Saúde | ✅ Compatível |
| Cadastro de Unidades (CNES) | ✅ Compatível |
| Cadastro de Especialidades | ✅ Compatível |
| Agendamento de Consultas | ✅ Compatível |
| Lista de Atendimento | ✅ Compatível |
| Triagem de Enfermagem | ✅ Compatível + Classificação de Risco |
| Consulta Médica | ✅ Compatível |
| Prescrição de Medicamentos | ✅ Compatível |
| Solicitação de Exames | ✅ Compatível |
| Atestados | ✅ Compatível |
| Encaminhamentos | ✅ Compatível |

### ⚠️ Funcionalidades que Precisam de Ajustes

| Funcionalidade | Status | Ação Necessária |
|----------------|--------|-----------------|
| Prontuário SOAP | ⚠️ Parcial | Reestruturar ConsultaMedica em 4 blocos (S, O, A, P) |
| Lista de Problemas/Condições | ❌ Não implementado | Criar modelo ProblemaCondicao com CIAP2/CID10 |
| Registro de Alergias | ❌ Não implementado | Criar modelo AlergiaReacao |
| Atendimento Odontológico | ❌ Não implementado | Implementar odontograma + procedimentos SIGTAP |
| Vacinação | ⚠️ Sistema separado | Integrar app Imunização ao prontuário |
| Visita Domiciliar (ACS) | ❌ Não implementado | Criar ficha de visita domiciliar |
| Atividades Coletivas | ❌ Não implementado | Implementar grupos de saúde |
| Pré-natal | ❌ Não implementado | Criar acompanhamento gestacional |
| Puericultura | ❌ Não implementado | Criar acompanhamento infantil |
| Condições Crônicas | ❌ Não implementado | Implementar HiperDia |

---

## 🔗 Métodos de Integração

### 1. API REST (Recomendado) ⭐

**Disponível desde:** PEC v5.3.19

**Características:**
- Envio em tempo real
- Autenticação via credenciais
- Resposta imediata de sucesso/erro
- Requer HTTPS

**Fluxo:**
```
DigiUrban → POST /api/recebimento/login (autenticação)
         ← JSESSIONID cookie
         → POST /api/v1/recebimento/ficha (envio de dados em formato LEDI binário)
         ← Status 200 (sucesso) ou código de erro
```

**Vantagens:**
- ✅ Integração em tempo real
- ✅ Validação imediata
- ✅ Não requer intervenção manual
- ✅ Rastreamento completo

**Requisitos:**
- PEC e-SUS APS v5.3.19 ou superior
- HTTPS configurado no PEC
- Credenciais geradas pelo Administrador da Instalação

---

### 2. LEDI Thrift (Arquivo Binário)

**Características:**
- Geração de arquivos binários `.esus`
- Formato Apache Thrift
- Importação manual ou via script

**Fluxo:**
```
DigiUrban → Gera arquivo .esus
         → Salva em diretório configurado
         → Administrador importa no PEC (manual ou script)
```

**Vantagens:**
- ✅ Não requer conectividade constante
- ✅ Formato mais compacto
- ✅ Compatível com versões antigas do PEC

**Desvantagens:**
- ❌ Requer importação manual
- ❌ Feedback não é imediato
- ❌ Possibilidade de arquivos acumularem

---

### 3. LEDI XML

**Características:**
- Geração de arquivos XML
- Validação via XSD
- Importação manual

**Fluxo:**
```
DigiUrban → Gera arquivo .xml
         → Salva em diretório configurado
         → Administrador importa no PEC
```

**Vantagens:**
- ✅ Formato legível e depurável
- ✅ Validação via XSD
- ✅ Compatível com versões antigas

**Desvantagens:**
- ❌ Arquivos maiores que Thrift
- ❌ Requer importação manual
- ❌ Mais lento para processar

---

## ⚙️ Configuração

### Passo 1: Obter Credenciais no PEC e-SUS

1. Acesse o PEC e-SUS como **Administrador da Instalação**
2. Navegue até: **Transmissão de dados → Credenciais para API**
3. Clique em **"Registrar novo integrador"**
4. Preencha os dados:
   - Tipo: Pessoa Física ou Jurídica
   - Nome: "DigiUrban"
   - CPF/CNPJ: Documento da prefeitura
   - Email: Email do responsável
   - Nome da credencial: "DigiUrban Sistema de Atendimento"
5. Clique em **"Gerar credenciais"**
6. **⚠️ IMPORTANTE:** Copie o usuário e senha exibidos (serão mostrados apenas uma vez!)

### Passo 2: Configurar no DigiUrban

1. Acesse: **Saúde → Configurações → Integração e-SUS**
2. Na aba **"Geral"**:
   - Ative a integração
   - Selecione o método: **API REST** (recomendado)
   - Informe o **CNES** da unidade principal
3. Na aba **"API REST"**:
   - **URL do PEC:** `https://esus.cidade.gov.br` (substitua pelo endereço correto)
   - **Usuário da API:** Cole o usuário gerado
   - **Senha da API:** Cole a senha gerada
4. Clique em **"Testar Conexão"** para validar
5. Na aba **"Sincronização"**:
   - Ative **"Sincronização Automática"**
   - Defina o intervalo (recomendado: 60 minutos)
   - Ative **"Retentar Envios Falhos"**
6. Clique em **"Salvar Configuração"**

### Passo 3: Validar Integração

1. Crie um **atendimento de teste** no DigiUrban
2. Vá em **"Sincronizar Agora"**
3. Verifique em **"Logs de Transmissão"** se o status é **"SUCESSO"**
4. Acesse o PEC e-SUS e verifique se o atendimento foi recebido

---

## 💻 Implementação Técnica

### Modelos Prisma Criados

#### `ConfiguracaoESUS`
```prisma
model ConfiguracaoESUS {
  id                      String   @id @default(cuid())
  municipioId             String   @unique

  integracaoAtiva         Boolean  @default(false)
  tipoIntegracao          TipoIntegracaoESUS @default(NENHUMA)

  // API REST
  urlPEC                  String?
  usuarioAPI              String?
  senhaAPI                String?  // Criptografada

  // LEDI
  formatoLEDI             FormatoLEDI?
  versaoLEDI              String?
  diretorioExportacao     String?

  // Mapeamentos
  cnesUnidadePrincipal    String?

  // Sincronização
  sincronizacaoAutomatica Boolean  @default(false)
  intervaloSincMinutos    Int      @default(60)
  ultimaSincronizacao     DateTime?

  // Logs
  logTransmissoes         Boolean  @default(true)
  retentarEnviosFalhos    Boolean  @default(true)
  maxTentativas           Int      @default(3)

  transmissoes            TransmissaoESUS[]
}
```

#### `TransmissaoESUS`
```prisma
model TransmissaoESUS {
  id                  String   @id @default(cuid())
  configuracaoId      String

  tipo                TipoFichaESUS  // CADASTRO_INDIVIDUAL, ATENDIMENTO_INDIVIDUAL, etc
  formato             FormatoLEDI?

  fichaId             String   // ID do registro DigiUrban
  entidadeOrigem      String?
  nomeArquivo         String?

  payloadJSON         Json?    // Dados antes da conversão
  conteudoLEDI        String?  // XML ou Base64 do Thrift

  status              StatusTransmissao @default(PENDENTE)
  dataEnvio           DateTime @default(now())
  dataConfirmacao     DateTime?

  codigoResposta      Int?
  mensagemResposta    String?
  erros               Json?

  tentativas          Int      @default(0)
  proximaTentativa    DateTime?

  configuracao        ConfiguracaoESUS @relation(fields: [configuracaoId], references: [id])
}
```

### Endpoints Backend

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/apps/saude/configuracoes/esus` | Obter configuração |
| POST | `/api/apps/saude/configuracoes/esus` | Criar configuração |
| PUT | `/api/apps/saude/configuracoes/esus` | Atualizar configuração |
| POST | `/api/apps/saude/configuracoes/esus/testar` | Testar conexão |
| POST | `/api/apps/saude/configuracoes/esus/sincronizar` | Sincronizar dados |
| GET | `/api/apps/saude/configuracoes/esus/transmissoes` | Listar logs |
| POST | `/api/apps/saude/configuracoes/esus/transmissoes/:id/retentar` | Retentar envio |

### Componente Frontend

**Arquivo:** `components/apps/saude/configuracoes/ConfiguracaoESUSPage.tsx`

**Recursos:**
- 4 abas: Geral, API REST, LEDI, Sincronização
- Teste de conexão em tempo real
- Sincronização manual
- Máscaramento de senha
- Validações de formulário
- Feedback visual de status

---

## 🗓️ Roadmap de Alinhamento

### FASE 1: Adequação do Prontuário (2-3 semanas) 🔴 PRIORITÁRIO

#### 1.1 Reestruturar ConsultaMedica com Método SOAP
- [ ] Dividir campos em 4 blocos (S, O, A, P)
- [ ] Adicionar campos específicos do método SOAP
- [ ] Migrar dados existentes
- [ ] Atualizar formulário de consulta no frontend

#### 1.2 Implementar Lista de Problemas/Condições
- [ ] Criar modelo `ProblemaCondicao`
- [ ] Integrar tabelas CIAP2 e CID10
- [ ] Implementar interface de gestão de problemas
- [ ] Vincular problemas às consultas

#### 1.3 Implementar Registro de Alergias
- [ ] Criar modelo `AlergiaReacao`
- [ ] Adicionar seção de alergias no prontuário
- [ ] Exibir alertas visuais quando houver alergias
- [ ] Integrar com prescrição de medicamentos

**Entregável:** Prontuário totalmente compatível com padrão PEC e-SUS

---

### FASE 2: Módulos Especializados (3-4 semanas)

#### 2.1 Atendimento Odontológico
- [ ] Criar modelo `AtendimentoOdontologico`
- [ ] Implementar odontograma interativo
- [ ] Integrar tabela SIGTAP de procedimentos
- [ ] Criar interface específica para dentistas

#### 2.2 Acompanhamento Pré-Natal
- [ ] Criar modelo `AcompanhamentoPreNatal`
- [ ] Implementar cálculo automático de DPP e IG
- [ ] Criar fichas de consulta pré-natal
- [ ] Implementar gráficos de evolução

#### 2.3 Visita Domiciliar (ACS)
- [ ] Criar modelo `VisitaDomiciliar`
- [ ] Implementar ficha de visita para ACS
- [ ] Adicionar geolocalização
- [ ] Integrar com cadastro domiciliar

#### 2.4 Atividades Coletivas
- [ ] Criar modelo `AtividadeColetiva`
- [ ] Implementar grupos de saúde
- [ ] Adicionar lista de presença
- [ ] Gerar relatórios de participação

**Entregável:** Módulos especializados funcionando

---

### FASE 3: Integração LEDI (2-3 semanas)

#### 3.1 Implementar Serviço de Conversão LEDI
- [ ] Criar `LEDIConverterService`
- [ ] Mapear entidades DigiUrban → LEDI
- [ ] Implementar serialização Thrift
- [ ] Implementar geração XML

#### 3.2 Implementar Envio via API REST
- [ ] Criar `ESUSApiService`
- [ ] Implementar autenticação (JSESSIONID)
- [ ] Implementar envio de fichas
- [ ] Tratar erros e respostas

#### 3.3 Implementar Sistema de Filas
- [ ] Criar worker de sincronização
- [ ] Implementar retry automático
- [ ] Adicionar logs detalhados
- [ ] Criar dashboard de monitoramento

**Entregável:** Integração completa funcionando

---

### FASE 4: Validação e Homologação (1-2 semanas)

#### 4.1 Testes
- [ ] Testes unitários dos conversores LEDI
- [ ] Testes de integração com PEC
- [ ] Testes de carga (volume de dados)
- [ ] Validação de conformidade LEDI

#### 4.2 Documentação
- [ ] Manual do usuário
- [ ] Guia de solução de problemas
- [ ] Documentação técnica da API
- [ ] Vídeos tutoriais

#### 4.3 Homologação
- [ ] Validar com DATASUS
- [ ] Certificar conformidade
- [ ] Treinar equipe da prefeitura

**Entregável:** Sistema validado e em produção

---

## 📚 Referências

### Documentação Oficial

- **Portal e-SUS APS:** [sisaps.saude.gov.br/sistemas/esusaps](https://sisaps.saude.gov.br/sistemas/esusaps/)
- **API de Transmissão:** [sisaps.saude.gov.br/.../API_transmissao](https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/APOIO/API_transmissao/)
- **Portal de Integração LEDI:** [integracao.esusaps.bridge.ufsc.tech](https://integracao.esusaps.bridge.ufsc.tech/)
- **GitHub LEDI:** [github.com/laboratoriobridge/esusab-integracao](https://github.com/laboratoriobridge/esusab-integracao)
- **RNDS (FHIR):** [hl7.org.br/fhir/core](https://hl7.org.br/fhir/core/estrutura.html)

### Manuais

- **Manual do PEC (PDF):** Disponível no portal e-SUS APS
- **Guia CIAP2:** Classificação Internacional de Atenção Primária
- **Tabela SIGTAP:** Sistema de Gerenciamento da Tabela de Procedimentos

### Suporte

- **Portal de Suporte UFSC:** esusaps.bridge.ufsc.br/a/
- **Comunidade e-SUS:** Fórum oficial para dúvidas
- **DATASUS:** Suporte técnico do Ministério da Saúde

---

## 🎯 Próximos Passos

1. ✅ **Configurar credenciais** na página de configuração
2. ✅ **Testar conexão** com o PEC da prefeitura
3. ⏳ **Implementar FASE 1** - Adequação do prontuário (2-3 semanas)
4. ⏳ **Implementar FASE 2** - Módulos especializados (3-4 semanas)
5. ⏳ **Implementar FASE 3** - Integração LEDI completa (2-3 semanas)
6. ⏳ **Homologar** com DATASUS (1-2 semanas)

**Tempo total estimado:** 8-12 semanas para integração completa

---

## 📞 Contato

Para dúvidas ou suporte sobre a implementação desta integração, entre em contato com a equipe de desenvolvimento do DigiUrban.

---

**Última atualização:** 29/01/2026
