# 📋 FLUXO COMPLETO DE ATENDIMENTO - PEC e-SUS APS

**Baseado no Manual Oficial do PEC e-SUS APS**
**Fonte:** https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/
**Data:** Janeiro 2025

---

## 📑 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Autenticação e Perfis](#2-autenticação-e-perfis)
3. [Programa Saúde da Família (PSF/ESF)](#3-programa-saúde-da-família-psfesf)
4. [Fluxo Completo de Atendimento](#4-fluxo-completo-de-atendimento)
5. [Detalhamento das Telas e Formulários](#5-detalhamento-das-telas-e-formulários)
6. [Método SOAP](#6-método-soap)
7. [Módulos Especializados](#7-módulos-especializados)
8. [Integrações](#8-integrações)

---

## 1. VISÃO GERAL DO SISTEMA

### 🧩 Componentes Visuais do PEC e-SUS

**Barra Lateral de Navegação:**
- 🏥 Atendimentos
- 📅 Agenda
- 👥 Cadastros
- 📊 Relatórios
- 🎯 Acompanhamentos
- 🔧 Configurações

**Cabeçalho:**
- Logo SUS/PEC
- Breadcrumb de navegação
- Informações do profissional logado
- Unidade de saúde ativa

**Organização Visual:**
- Formulários organizados em abas
- Campos agrupados por áreas específicas
- Sistema de cores para status e alertas

---

## 2. AUTENTICAÇÃO E PERFIS

### 🔐 Tela de Login

**Campos:**
- CPF do usuário
- Senha
- Link gov.br para autenticação federada

**Tipos de Autenticação:**
1. **Login tradicional:** CPF + Senha
2. **gov.br:** Autenticação federada (redireciona para portal gov.br e retorna ao PEC)

### 👤 Perfis de Usuário

| Perfil | Permissões Principais |
|--------|----------------------|
| **Administrador** | Configuração do sistema, gestão de usuários, auditoria |
| **Recepcionista** | Adicionar cidadãos à lista, gerenciar agenda |
| **Enfermeiro** | Escuta inicial, triagem, vacinação, procedimentos |
| **Médico** | Consultas, prescrições, atestados, SOAP completo |
| **Dentista** | Atendimento odontológico, procedimentos |
| **ACS** | Visitas domiciliares, busca ativa |
| **Farmacêutico** | Dispensação de medicamentos |

---

## 3. PROGRAMA SAÚDE DA FAMÍLIA (PSF/ESF)

### 🏘️ Estrutura de Equipes

**Equipe de Atenção Primária (eAP):**
- Médico
- Enfermeiro
- Técnico/Auxiliar de enfermagem
- Agente Comunitário de Saúde (ACS)
- Cirurgião-dentista (quando aplicável)

**Vinculação do Cidadão:**
- Cada cidadão é vinculado a UMA equipe específica
- Vinculação por território/microárea
- ACS responsável por acompanhamento domiciliar

**Campos de Vinculação:**
- Equipe (INE - Identificação Nacional de Equipes)
- Microárea
- ACS responsável
- CNES da unidade

---

## 4. FLUXO COMPLETO DE ATENDIMENTO

### 📊 Fluxograma Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CIDADÃO CHEGA NA UBS                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. RECEPÇÃO - Adicionar à Lista de Atendimentos                │
│     • Buscar/Cadastrar cidadão                                   │
│     • Selecionar tipo de atendimento                             │
│     • Escolher profissional/equipe                               │
│     • Motivo da busca                                            │
│     • Status: AGUARDANDO ATENDIMENTO                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ESCUTA INICIAL / ACOLHIMENTO (Enfermeiro/Técnico)           │
│     • Avaliação inicial da demanda                               │
│     • Classificação de risco/vulnerabilidade                     │
│     • Sinais vitais básicos (opcional)                           │
│     • Decisão: RESOLVER / ENCAMINHAR / AGENDAR                   │
│     • Status: EM_ESCUTA_INICIAL                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. TRIAGEM DE ENFERMAGEM (se necessário)                        │
│     • Sinais vitais completos                                    │
│     • Antropometria                                              │
│     • Classificação de risco (Manchester ou similar)             │
│     • Queixa principal                                           │
│     • Alergias conhecidas                                        │
│     • Status: EM_TRIAGEM → AGUARDANDO_MEDICO                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CONSULTA MÉDICA                                              │
│     • Prontuário Eletrônico (Folha de Rosto)                     │
│     • Registro SOAP                                              │
│     • Problemas/Condições (CIAP2/CID10)                          │
│     • Prescrição de medicamentos                                 │
│     • Solicitação de exames                                      │
│     • Atestados/Declarações                                      │
│     • Encaminhamentos                                            │
│     • Status: EM_CONSULTA → CONSULTA_CONCLUIDA                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. PÓS-CONSULTA                                                 │
│     • Farmácia (se prescrição)                                   │
│     • Sala de procedimentos (se necessário)                      │
│     • Agendamento de retorno                                     │
│     • Status: FINALIZADO                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. DETALHAMENTO DAS TELAS E FORMULÁRIOS

### 📋 5.1. LISTA DE ATENDIMENTOS

**Localização:** Menu lateral > Atendimentos

**Visualização:**
- Grid com cidadãos aguardando atendimento
- Filtros: Data, Equipe, Profissional, Tipo de atendimento
- Cores por status:
  - 🔴 Urgência/Prioridade
  - 🟡 Aguardando
  - 🟢 Em atendimento
  - ⚪ Finalizado

**Ações Disponíveis:**
1. **Adicionar Cidadão**
2. **Atender** - Inicia o atendimento
3. **Realizar Escuta Inicial**
4. **Visualizar Prontuário**
5. **Cidadão não aguardou**
6. **Cidadão retornou**
7. **Vacinar**

### 📝 5.2. ADICIONAR CIDADÃO À LISTA

**Campos:**
- 🔍 **Buscar cidadão** (CPF/CNS/Nome)
- 👤 **Cidadão selecionado** (auto-preenche)
- 👨‍⚕️ **Profissional** (dropdown)
- 👥 **Equipe** (dropdown - baseado no profissional)
- 📋 **Tipo de atendimento:**
  - Agendado
  - Demanda espontânea
  - Urgência
  - Retorno
- 💉 **Vacinação** (checkbox)
- 📝 **Motivo da busca** (texto livre)
- 📌 **Observações**

**Botões:**
- ✅ Adicionar à lista
- ❌ Cancelar

---

### 🎯 5.3. ESCUTA INICIAL / ACOLHIMENTO

**Objetivo:** Primeiro atendimento ao cidadão para avaliar demanda e definir conduta

**Seções do Formulário:**

#### 📍 Informações Subjetivas
- **Motivo da busca:** Texto livre
- **História breve:** O que o cidadão relata
- **Tempo de evolução**
- **Tentativas anteriores de resolver**

#### 📊 Informações Objetivas (opcional)
- **Sinais vitais básicos:**
  - PA (Pressão Arterial)
  - Temperatura
  - FC (Frequência Cardíaca)
- **Observações visuais**

#### ⚠️ Classificação de Risco/Vulnerabilidade

**Risco Biológico:**
- 🔴 Emergência
- 🟠 Muito Urgente
- 🟡 Urgente
- 🟢 Pouco Urgente
- ⚪ Não Urgente

**Vulnerabilidade Social:**
- Alta
- Média
- Baixa

#### 🎯 Conduta Definida

**Opções:**
1. **Resolvido na escuta** - Orientações suficientes
2. **Encaminhado para atendimento no dia:**
   - Médico
   - Enfermeiro
   - Dentista
   - Outro profissional
3. **Procedimento na UBS** (curativo, inalação, etc.)
4. **Agendamento de consulta** - Definir data
5. **Encaminhamento externo** - Especialidade, urgência

**Campos adicionais:**
- 📝 **Orientações fornecidas**
- 📅 **Data/hora do próximo atendimento** (se aplicável)
- 👨‍⚕️ **Profissional para quem encaminha**

---

### 🏥 5.4. TRIAGEM DE ENFERMAGEM

**Quando usar:** Atendimento que necessita de avaliação mais detalhada antes da consulta médica

#### 📊 Sinais Vitais Completos

| Campo | Unidade | Validação |
|-------|---------|-----------|
| Pressão Arterial | mmHg | Formato: 120/80 |
| Temperatura | °C | 35.0 - 42.0 |
| Frequência Cardíaca | bpm | 40 - 200 |
| Frequência Respiratória | irpm | 10 - 60 |
| Saturação O₂ | % | 0 - 100 |

#### 📏 Antropometria

| Campo | Unidade | Observação |
|-------|---------|------------|
| Peso | kg | 0.1 - 300.0 |
| Altura | cm | 30 - 250 |
| IMC | kg/m² | Calculado automaticamente |
| Perímetro Cefálico | cm | Para crianças |
| Circunferência Abdominal | cm | Opcional |

#### 🩸 Glicemia Capilar
- **Valor:** mg/dL
- **Momento:** Jejum / Pós-prandial / Aleatória

#### 📋 Avaliação de Enfermagem

**Campos:**
- **Queixa principal:** Texto livre
- **História da doença atual (HDA):** Evolução dos sintomas
- **Alergias conhecidas:** Lista + severidade
- **Medicamentos em uso:** Lista
- **Comorbidades:** Lista de condições crônicas

#### ⚠️ Classificação de Risco

**Protocolo de Manchester (cores):**
- 🔴 **Emergência** - Atendimento imediato
- 🟠 **Muito Urgente** - 10 minutos
- 🟡 **Urgente** - 60 minutos
- 🟢 **Pouco Urgente** - 120 minutos
- 🔵 **Não Urgente** - 240 minutos

**Critérios considerados:**
- Sintomas relatados
- Sinais vitais
- Idade
- Condições especiais (gestante, idoso, criança)

#### 🎯 Encaminhamento
- **Profissional:** Médico/Enfermeiro/Dentista
- **Prioridade:** Baseada na classificação de risco
- **Observações:** Informações relevantes para o próximo profissional

---

### 📄 5.5. PRONTUÁRIO ELETRÔNICO - FOLHA DE ROSTO

**Abas do Prontuário:**

#### 🏠 1. Folha de Rosto (Resumo)

**Informações do Cidadão:**
- Nome completo
- CPF / CNS
- Data de nascimento / Idade
- Sexo
- Raça/Cor
- Telefone / Email
- Endereço completo

**Contexto de Saúde:**
- 👥 **Equipe vinculada** (INE)
- 🏘️ **Microárea**
- 👨‍👩‍👧 **ACS responsável**
- 🏥 **CNES da unidade**

**Alertas Visuais:**
- 🚨 **Alergias graves** (destaque vermelho)
- ⚠️ **Condições crônicas ativas**
- 💊 **Medicamentos de uso contínuo**
- 🤰 **Gestante** (se aplicável)
- 👴 **Idoso** (≥ 60 anos)
- 🧒 **Criança** (< 12 anos)

**Resumo Clínico:**
- **Problemas ativos:** Lista de condições em acompanhamento
- **Última consulta:** Data e profissional
- **Próximo agendamento:** Se houver
- **Vacinas atrasadas:** Alertas do calendário vacinal

---

#### 🩺 2. SOAP (Registro de Consulta)

Detalhado na seção 6.

---

#### 💉 3. Vacinação

**Calendário Vacinal:**
- Visualização por faixa etária
- Doses aplicadas (verde)
- Doses a aplicar (branco)
- Doses atrasadas (vermelho)
- Doses a aprazar (cinza - futuro)

**Registro de Vacinação:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Estratégia | Dropdown | Sim |
| Grupo de atendimento | Dropdown | Sim |
| Imunobiológico | Autocomplete | Sim |
| Dose | Dropdown | Sim |
| Lote | Texto | Sim |
| Fabricante | Dropdown | Sim |
| Via de administração | Dropdown | Sim |
| Local de aplicação | Dropdown | Sim |
| Data de aplicação | Data | Sim |

**Estratégias:**
- Rotina
- Campanha
- Bloqueio
- Intensificação
- Estratégia não especificada

---

#### 🧪 4. Exames

**Tipos de Registro:**

**4.1. Solicitação de Exames**

| Campo | Descrição |
|-------|-----------|
| Tipo de exame | Dropdown com SIGTAP |
| Urgência | Rotina / Urgente / Muito urgente |
| Justificativa | Texto livre |
| Data solicitação | Auto (data atual) |
| CID10 | Código da suspeita diagnóstica |

**4.2. Resultado de Exames**

| Campo | Tipo |
|-------|------|
| Exame | Seleção da solicitação |
| Data do resultado | Data |
| Valor | Numérico ou texto |
| Unidade | Automático conforme exame |
| Referência | Valores normais |
| Interpretação | Normal / Alterado / Crítico |
| Observações | Texto livre |
| Anexo | Upload de PDF/imagem |

---

#### ⚕️ 5. Problemas e Condições

**Lista de Problemas/Condições:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tipo | CIAP2 / CID10 | Sistema de classificação |
| Código | Autocomplete | Busca inteligente |
| Descrição | Texto | Auto-preenchida pelo código |
| Status | Dropdown | ATIVO / LATENTE / RESOLVIDO |
| Gravidade | Dropdown | LEVE / MODERADO / GRAVE |
| Data de início | Data | Quando foi identificado |
| Data de resolução | Data | Se status = RESOLVIDO |
| Observações | Texto livre | Contexto adicional |

**Status dos Problemas:**
- 🔴 **ATIVO** - Em acompanhamento/tratamento
- 🟡 **LATENTE** - Controlado mas requer monitoramento
- 🟢 **RESOLVIDO** - Curado/controlado definitivamente

**Visualização:**
- Lista separada por status
- Ordenação por data (mais recentes primeiro)
- Filtros por tipo (crônico/agudo)

---

#### 🚨 6. Alergias e Reações Adversas

**Formulário de Alergia:**

| Campo | Opções |
|-------|--------|
| **Tipo** | Medicamento / Alimento / Ambiental / Contato / Látex / Outra |
| **Substância** | Texto livre ou autocomplete |
| **Gravidade** | LEVE / MODERADA / GRAVE / ANAFILAXIA |
| **Grau de certeza** | Confirmado / Suspeito / Não verificado |
| **Manifestações** | Checkboxes: Urticária, Angioedema, Broncoespasmo, Anafilaxia, Outros |
| **Data/idade início** | Data ou idade aproximada |
| **Status** | Ativa / Inativa |
| **Observações** | Texto livre |

**Alertas Visuais:**
- 🔴 **ANAFILAXIA** - Alerta máximo (banner vermelho)
- 🟠 **GRAVE** - Alerta importante
- 🟡 **MODERADA** - Atenção
- ⚪ **LEVE** - Registrada

---

#### 💊 7. Prescrição de Medicamentos

**Modos de Prescrição:**

**7.1. Prescrição por Lista Padrão**
- Seleção de medicamentos do RENAME
- Posologia pré-definida
- Ajuste de quantidade/dose

**7.2. Prescrição Manual**
- Medicamento: texto livre
- Concentração
- Forma farmacêutica
- Via de administração
- Posologia completa
- Duração do tratamento

**Campos da Prescrição:**

| Campo | Tipo | Exemplo |
|-------|------|---------|
| Medicamento | Autocomplete/Texto | Paracetamol 500mg |
| Quantidade | Número | 20 comprimidos |
| Posologia | Texto estruturado | 1 comp. a cada 6h |
| Duração | Dias/Semanas/Meses | 5 dias |
| Orientações | Texto livre | Tomar com alimentos |
| Uso contínuo | Checkbox | □ Sim  ☑ Não |

**Ações:**
- 🖨️ **Imprimir** - PDF simples
- 📱 **Digital** - Assinatura eletrônica (ICP-Brasil)
- 📤 **Enviar para farmácia** - Integração interna

---

#### 📋 8. Atestados e Declarações

**Tipos de Documento:**

**8.1. Atestado Médico**

| Campo | Tipo |
|-------|------|
| Tipo | Atestado / Declaração de comparecimento |
| CID10 | Opcional (pode omitir por sigilo) |
| Dias de afastamento | Número |
| Período | Data início - Data fim |
| Horário do atendimento | Hora início - Hora fim |
| Observações | Texto livre |
| Assinatura | Digital (ICP-Brasil) ou Manual |

**8.2. Declaração de Comparecimento**
- Data e hora do atendimento
- Tempo de permanência
- Sem informações clínicas

**Formatos de Saída:**
- PDF com QR Code (validação)
- Impressão direta

---

#### 🔄 9. Encaminhamentos

**Formulário de Encaminhamento:**

| Campo | Descrição |
|-------|-----------|
| **Especialidade** | Dropdown SIGTAP |
| **Prioridade** | Rotina / Urgente / Muito urgente |
| **Hipótese diagnóstica** | CID10 + descrição |
| **Motivo do encaminhamento** | Texto livre |
| **Exames já realizados** | Lista anexada |
| **Medicamentos em uso** | Auto-preenchido |
| **Observações** | Informações relevantes |

**Tipos de Encaminhamento:**
- Especialidade (cardiologia, neurologia, etc.)
- NASF (apoio matricial)
- Urgência/Emergência
- Internação

---

#### 📜 10. Histórico de Atendimentos

**Visualização:**
- Timeline cronológica (mais recente primeiro)
- Filtros:
  - Por profissional
  - Por tipo de atendimento
  - Por período
  - Por equipe

**Informações Exibidas:**
- Data/hora
- Profissional
- Tipo de atendimento
- Diagnóstico principal
- Ações: Ver detalhes / Imprimir

---

## 6. MÉTODO SOAP

### 📖 O que é SOAP?

**SOAP** = Subjetivo + Objetivo + Avaliação + Plano

Método estruturado de documentação clínica utilizado universalmente no PEC e-SUS.

---

### 🗣️ S - SUBJETIVO

**O que o paciente relata**

#### Campos:

| Campo | Descrição |
|-------|-----------|
| **Motivo da consulta** | Queixa principal |
| **História da doença atual (HDA)** | Evolução dos sintomas |
| **História pregressa** | Doenças anteriores, cirurgias |
| **História familiar** | Doenças na família |
| **História social** | Hábitos, ocupação, condições sociais |

**Exemplo:**
```
Motivo: Dor de cabeça há 3 dias
HDA: Paciente relata cefaleia frontal, pulsátil, intensidade 7/10,
     iniciada há 3 dias. Piora com luz e barulho. Sem náuseas.
História pregressa: Hipertensão há 5 anos, em uso de losartana.
História familiar: Mãe com enxaqueca.
História social: Professor, estresse no trabalho.
```

---

### 🔬 O - OBJETIVO

**Dados mensuráveis e observáveis**

#### 6.1. Sinais Vitais

| Sinal | Valor | Referência |
|-------|-------|------------|
| PA | 130/85 mmHg | < 120/80 |
| FC | 78 bpm | 60-100 |
| FR | 16 irpm | 12-20 |
| Temp | 36.5°C | 36-37 |
| SatO₂ | 98% | > 95% |

#### 6.2. Antropometria

| Medida | Valor |
|--------|-------|
| Peso | 75 kg |
| Altura | 170 cm |
| IMC | 25.95 kg/m² |
| Cintura | 88 cm |

#### 6.3. Exame Físico Geral
- Estado geral
- Nível de consciência
- Hidratação
- Coloração
- Outros achados

#### 6.4. Exame Físico por Sistemas

| Sistema | Campos |
|---------|--------|
| **Cardiovascular** | Ausculta cardíaca, pulsos, edema |
| **Respiratório** | Ausculta pulmonar, padrão respiratório |
| **Abdomen** | Inspeção, palpação, ausculta |
| **Neurológico** | Consciência, força, sensibilidade, reflexos |
| **Pele/Anexos** | Lesões, hidratação, turgor |

---

### 🎯 A - AVALIAÇÃO

**Raciocínio clínico e diagnósticos**

#### Campos:

| Campo | Tipo |
|-------|------|
| **Hipótese diagnóstica** | Texto livre - Raciocínio clínico |
| **Diagnóstico principal** | CID10 ou CIAP2 |
| **Diagnósticos secundários** | Lista de códigos |
| **Problemas identificados** | Vinculados à lista de problemas |

**Exemplo:**
```
Hipótese: Provável enxaqueca com aura, não relacionada a HAS.
Diagnóstico principal: G43.0 - Enxaqueca sem aura
Problemas:
- I10 - Hipertensão essencial (ATIVO - controlado)
- G43.0 - Enxaqueca sem aura (ATIVO - novo)
```

---

### 📝 P - PLANO

**Condutas e seguimento**

#### 6.1. Conduta Terapêutica

| Tipo | Descrição |
|------|-----------|
| **Medicamentosa** | Prescrições |
| **Não medicamentosa** | Orientações, mudanças de hábitos |
| **Procedimentos** | A realizar na UBS |

#### 6.2. Prescrições
- Vinculadas automaticamente
- Listadas no plano

#### 6.3. Exames Solicitados
- Listados com justificativa
- Prioridade definida

#### 6.4. Encaminhamentos
- Especialidade
- Motivo
- Prioridade

#### 6.5. Retorno
- Data sugerida
- Condições de retorno antes se necessário

#### 6.6. Orientações
- Texto livre
- Orientações específicas ao paciente
- Sinais de alerta

**Exemplo:**
```
Conduta:
- Prescrição: Sumatriptano 50mg + Metoclopramida 10mg
- Orientações:
  * Evitar alimentos gatilho (chocolate, queijos)
  * Manter horários regulares de sono
  * Diário de cefaleia
  * Retornar em caso de piora ou sintomas novos
- Retorno: 30 dias para reavaliação
```

---

## 7. MÓDULOS ESPECIALIZADOS

### 🦷 7.1. Atendimento Odontológico

**Odontograma Interativo:**
- 32 dentes (adulto) ou 20 dentes (criança)
- Notação FDI
- Registro por dente e face

**Condições Dentárias:**
- Hígido
- Cariado
- Restaurado
- Perdido
- Prótese
- Implante
- Outros

**Procedimentos Odontológicos:**
- Código SIGTAP
- Dente
- Face (Oclusal, Mesial, Distal, Vestibular, Lingual/Palatina)
- Quantidade

**Campos Específicos:**
- Queixa odontológica
- Exame clínico bucal
- Índice CPO-D (cariados, perdidos, obturados)
- Necessidade de prótese
- Plano de tratamento

---

### 🤰 7.2. Acompanhamento Pré-Natal

**Início do Pré-Natal:**

| Campo | Descrição |
|-------|-----------|
| DUM | Data da última menstruação |
| DPP | Data provável do parto (calc. automático) |
| IG | Idade gestacional (calc. automático) |
| G-P-A-C | Gesta-Para-Aborto-Cesárea |
| Grupo sanguíneo | A/B/AB/O |
| Fator Rh | Positivo/Negativo |
| Peso inicial | kg |
| Altura | cm |
| IMC inicial | Calculado |

**Consultas de Pré-Natal:**

Cada consulta registra:
- Idade gestacional no momento
- Peso
- PA
- Altura uterina
- BCF (batimentos cardio-fetais)
- Movimentos fetais
- Edema
- Queixas
- Próxima consulta

**Exames Pré-Natais:**
- Protocolo automatizado
- Alertas de exames pendentes
- Resultados vinculados

**Classificação de Risco:**
- Risco habitual
- Alto risco
- Critérios automáticos

---

### 🏠 7.3. Visita Domiciliar

**Registro de Visita:**

| Campo | Tipo |
|-------|------|
| Cidadão visitado | Busca |
| Data da visita | Data |
| Turno | Manhã/Tarde/Noite |
| Tipo de visita | Dropdown |
| Motivo | Texto livre |
| Ações realizadas | Checkboxes |
| Encaminhamentos | Se necessário |
| Próxima visita | Agendamento |

**Tipos de Visita:**
- Cadastramento
- Acompanhamento
- Busca ativa
- Controle ambiental
- Educação em saúde
- Convocação

**ACS Responsável:**
- Auto-preenchido
- Microárea
- Relatórios de produção

---

### 👥 7.4. Atividade Coletiva

**Registro de Atividade:**

| Campo | Descrição |
|-------|-----------|
| Tipo | Grupo educação, hipertensos, diabéticos, gestantes, etc. |
| Data/hora | Quando ocorreu |
| Local | Onde foi realizada |
| Profissionais | Lista de participantes |
| Tema | Assunto abordado |
| Práticas em saúde | Checkboxes |
| Público-alvo | Faixa etária, condições |

**Participantes:**
- Lista de cidadãos presentes
- CPF/CNS
- Avaliações realizadas (PA, glicemia, peso)
- Participantes com avaliação alterada

**Temas Comuns:**
- Educação em saúde
- Práticas corporais
- Saúde mental
- Alimentação saudável
- Planejamento familiar

---

### 🧒 7.5. Puericultura (Acompanhamento Infantil)

**Avaliação de Marcos do Desenvolvimento:**
- Por faixa etária
- Checklist de marcos
- Alertas de atraso
- Gráficos de crescimento (peso, altura, PC)

**Calendário Vacinal Infantil:**
- Integrado ao módulo de vacinação
- Alertas automáticos

---

### 👴 7.6. Índice de Vulnerabilidade da Pessoa Idosa (IVCF)

**Avaliação Multidimensional:**
- Funcionalidade
- Cognição
- Humor
- Mobilidade
- Comunicação
- Comorbidades múltiplas

**Classificação:**
- Robusto
- Pré-frágil
- Frágil

---

## 8. INTEGRAÇÕES

### 🌐 8.1. SUS Digital Profissional

**Integração com RNDS (Rede Nacional de Dados em Saúde):**
- Requer habilitação via gov.br
- Certificado digital ICP-Brasil
- Compartilhamento de dados com RNDS
- Padrão HL7 FHIR

**Dados Compartilhados:**
- Imunizações
- Resultados de exames
- Dispensação de medicamentos
- Registro de atendimento (sumário)

---

### 📊 8.2. SIGTAP (Sistema de Gerenciamento da Tabela de Procedimentos)

**Uso no PEC:**
- Procedimentos odontológicos
- Exames solicitados
- Atividades coletivas
- Encaminhamentos

**Integração:**
- Tabela atualizada automaticamente
- Busca inteligente
- Códigos validados

---

### 🏥 8.3. CNES (Cadastro Nacional de Estabelecimentos de Saúde)

**Vinculação:**
- Unidade de saúde
- Profissionais
- Equipes
- Lotação

---

### 📋 8.4. CIAP-2 e CID-10

**Classificações Clínicas:**

**CIAP-2 (Atenção Primária):**
- Foco em motivos de consulta
- Problemas comuns na APS
- Linguagem mais próxima do paciente

**CID-10 (Internacional):**
- Doenças e condições
- Mais específico
- Obrigatório para atestados e encaminhamentos

**Uso Combinado:**
- CIAP-2 para problemas crônicos da APS
- CID-10 para diagnósticos específicos e encaminhamentos

---

## 9. ADMINISTRAÇÃO E CONFIGURAÇÃO

### ⚙️ 9.1. Configurações da Instalação

**Dados da UBS:**
- CNES
- Nome
- Endereço
- Horário de funcionamento
- Tipo de unidade

**Equipes:**
- Cadastro de equipes (INE)
- Profissionais vinculados
- Microáreas
- Territórios

---

### 👥 9.2. Gestão de Usuários

**Cadastro de Usuário:**

| Campo | Tipo |
|-------|------|
| Nome completo | Texto |
| CPF | CPF válido |
| CNS | Cartão Nacional de Saúde |
| CBO | Classificação Brasileira de Ocupações |
| Perfil | Dropdown (médico, enfermeiro, etc.) |
| Equipes | Multipla seleção |
| Status | Ativo/Inativo |

**Perfis de Acesso:**
- Administrador
- Coordenador
- Médico
- Enfermeiro
- Técnico enfermagem
- Recepcionista
- ACS
- Dentista
- Farmacêutico

---

### 📊 9.3. Auditoria

**Logs do Sistema:**
- Ações realizadas
- Usuário responsável
- Data/hora
- IP de acesso
- Alterações em prontuário

**Relatórios de Auditoria:**
- Acessos ao prontuário
- Alterações retroativas
- Exclusões
- Exportações de dados

---

## 10. RELATÓRIOS

### 📈 10.1. Relatórios Gerenciais

**Produção:**
- Atendimentos por profissional
- Atendimentos por tipo
- Procedimentos realizados
- Taxa de absenteísmo

**Indicadores:**
- Cobertura vacinal
- Acompanhamento de hipertensos
- Acompanhamento de diabéticos
- Pré-natal (≥ 6 consultas)
- Citologia oncótica

---

### 📋 10.2. Relatórios Operacionais

**Lista de:**
- Faltosos em consultas
- Vacinas atrasadas
- Exames solicitados pendentes
- Gestantes cadastradas
- Hipertensos/diabéticos sem consulta

---

## 11. FLUXOS ESPECIAIS

### ⏰ 11.1. Registro Tardio de Atendimento

**Quando usar:**
- Atendimentos realizados offline
- Sistema indisponível no momento
- Registros retroativos (até 30 dias)

**Campos Adicionais:**
- Data/hora real do atendimento
- Motivo do registro tardio
- Local onde ocorreu

---

### 🤝 11.2. Compartilhamento do Cuidado

**Mapeamento Colaborativo:**
- Paciente compartilhado entre profissionais
- Ex: Médico + Fonoaudiólogo + Fisioterapeuta
- Visualização de condutas de todos
- Comunicação entre profissionais

---

### 🎯 11.3. Gestão de Filas

**Painel de Atendimento:**
- Fila de espera em tempo real
- Chamada de pacientes
- Tempo médio de espera
- Alertas de tempo excessivo

---

## 12. AGENDA ONLINE

### 📅 12.1. Configuração de Agenda

**Por Profissional:**
- Dias da semana disponíveis
- Turnos (manhã/tarde/noite)
- Duração por consulta
- Tipos de atendimento aceitos
- Quantidade de vagas

**Exemplo:**
```
Médico: Dr. João Silva
Segunda-feira:
  - Manhã: 8h-12h (consultas de 20min) = 12 vagas
  - Tarde: 14h-18h (consultas de 20min) = 12 vagas
Tipos aceitos: Agendado, Retorno
```

---

### 🌐 12.2. Agendamento Online (Cidadão)

**Acesso pelo Cidadão:**
- Via gov.br
- Busca por especialidade/profissional
- Visualiza horários disponíveis
- Agenda diretamente
- Recebe confirmação por SMS/email

---

## 13. VIDEOCHAMADAS

### 📹 13.1. Teleconsulta

**Requisitos:**
- Habilitação do profissional
- Consentimento do cidadão
- Registro em prontuário específico
- Limitações por tipo de atendimento

**Fluxo:**
1. Agendamento com indicação "teleconsulta"
2. Link enviado ao cidadão
3. Videochamada via plataforma integrada
4. Registro idêntico ao presencial
5. Prescrição digital

---

## 📌 RESUMO - PRINCIPAIS DIFERENCIAIS DO PEC e-SUS

### ✅ O que nosso Sistema de Atendimento DEVE ter:

1. **Fluxo de trabalho sequencial:**
   - Recepção → Escuta Inicial → Triagem → Consulta → Pós-consulta

2. **Vinculação com equipes PSF/ESF:**
   - Cada cidadão vinculado a UMA equipe
   - ACS responsável por território

3. **Método SOAP obrigatório:**
   - Estrutura de 4 seções
   - Facilita raciocínio clínico

4. **Lista de Problemas/Condições:**
   - CIAP2 e CID10
   - Status (ativo/latente/resolvido)

5. **Alertas visuais:**
   - Alergias graves
   - Condições críticas
   - Vacinas atrasadas

6. **Classificação de risco:**
   - Protocolo de Manchester
   - Orientação de prioridade

7. **Módulos especializados:**
   - Odontologia
   - Pré-natal
   - Puericultura
   - Visita domiciliar

8. **Integrações:**
   - SIGTAP (procedimentos)
   - CIAP2/CID10
   - RNDS (futuro)

---

## 🎯 PRÓXIMOS PASSOS

### Para Alinhar o DigiUrban:

1. ✅ **Já implementado:**
   - Schema Prisma com SOAP
   - Problemas/Condições
   - Alergias/Reações
   - Módulos especializados

2. 🔨 **A implementar:**
   - Tela de Lista de Atendimentos (principal)
   - Formulário de Escuta Inicial
   - Formulário de Triagem completo
   - Prontuário com abas (Folha de Rosto)
   - Interface SOAP melhorada
   - Classificação de risco
   - Agenda online
   - Gestão de filas
   - Relatórios gerenciais

3. 🎨 **UX/UI:**
   - Manter identidade DigiUrban
   - Adicionar elementos do PEC:
     - Cores de status/alertas
     - Ícones por módulo
     - Breadcrumb
     - Abas organizadas

---

**Documento baseado no Manual Oficial do PEC e-SUS APS**
**Fonte:** https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/
**Versão:** Janeiro 2025
