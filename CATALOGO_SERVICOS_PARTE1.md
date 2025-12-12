# Catálogo de Serviços Municipais - Parte 1

## Secretaria de Agricultura

### 1. Cadastro de Produtor Rural
**O que é:** Registro oficial de produtores rurais do município para acesso a programas e benefícios.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)
- DAP - Declaração de Aptidão ao Pronaf (se aplicável)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[number]** Área da Propriedade (hectares, mínimo 0)
- **[select]** Tipo de Produção: Agricultura Familiar, Agricultura Comercial, Pecuária, Horticultura, Silvicultura, Outros
- **[boolean]** Possui DAP?
- **[string]** Número da DAP (máx. 50 caracteres)

**Prazo estimado:** 10 dias úteis

---

### 2. Solicitação de Máquinas e Equipamentos Agrícolas
**O que é:** Solicitação de uso de máquinas e equipamentos agrícolas da prefeitura.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Propriedade ou Posse (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Máquina: Trator, Grade, Arado, Plantadeira, Colheitadeira, Roçadeira, Pulverizador, Outros
- **[date]** Data Desejada para Uso
- **[number]** Área a Ser Trabalhada (hectares, mínimo 0)
- **[string/textarea]** Descrição da Necessidade (máx. 500 caracteres)

**Prazo estimado:** 7 dias úteis

---

### 3. Inscrição na Feira do Produtor
**O que é:** Inscrição para participar da feira municipal de produtores rurais.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Produtos: Hortaliças, Frutas, Legumes, Produtos Artesanais, Ovos, Mel, Outros
- **[boolean]** Possui Barraca Própria?
- **[number]** Quantidade de Produtos Diferentes (mínimo 1)
- **[string/textarea]** Observações (máx. 300 caracteres)

**Prazo estimado:** 5 dias úteis

---

### 4. Assistência Técnica Rural
**O que é:** Solicitação de assistência técnica rural (ATER) para produtores.

**Documentos necessários:**
- Cadastro de Produtor Rural (se aplicável)
- Documento da Propriedade (se aplicável)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Assistência: Análise de Solo, Controle de Pragas, Manejo de Irrigação, Produção Animal, Produção Vegetal, Outros
- **[string]** Endereço da Propriedade (máx. 300 caracteres)
- **[number]** Área da Propriedade (hectares, mínimo 0)
- **[string/textarea]** Descrição do Problema (máx. 500 caracteres)

**Prazo estimado:** 15 dias úteis

---

### 5. Cadastro de Propriedade Rural
**O que é:** Cadastro e regularização de propriedades rurais no município.

**Documentos necessários:**
- Escritura ou Contrato (obrigatório)
- CAR - Cadastro Ambiental Rural (se aplicável)
- ITR - Imposto Territorial Rural (se aplicável)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome da Propriedade (máx. 200 caracteres)
- **[string]** Endereço/Localização (máx. 300 caracteres)
- **[number]** Área Total (hectares, mínimo 0)
- **[number]** Área Cultivável (hectares, mínimo 0)
- **[string]** CAR - Cadastro Ambiental Rural (máx. 50 caracteres)
- **[select]** Principal Atividade: Agricultura, Pecuária, Mista, Extrativismo, Outros
- **[string/textarea]** Observações (máx. 300 caracteres)

**Prazo estimado:** 30 dias úteis

---

### 6. Solicitação de Atendimento Geral - Agricultura
**O que é:** Registro de solicitações e atendimentos gerais da Secretaria de Agricultura.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Atendimento: Informações, Reclamação, Sugestão, Dúvida Técnica, Outros
- **[select]** Assunto: Cadastros, Programas, Máquinas, Assistência Técnica, Feira do Produtor, Outros
- **[string/textarea]** Descrição da Solicitação (máx. 500 caracteres)

**Prazo estimado:** 5 dias úteis

---

### 7. Inscrição em Programas Rurais
**O que é:** Inscrição em programas de apoio ao produtor rural (sementes, insumos, capacitações, etc.).

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)
- Cadastro de Produtor Rural (se aplicável)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Programa: Distribuição de Sementes, Distribuição de Mudas, Capacitação Técnica, Apoio à Comercialização, Outros
- **[string]** Nome do Programa (máx. 200 caracteres)
- **[number]** Área a Beneficiar (hectares, opcional, mínimo 0)
- **[string/textarea]** Justificativa/Necessidade (máx. 500 caracteres)

**Prazo estimado:** 15 dias úteis

---

### 8. Solicitação de Análise de Solo
**O que é:** Solicitação de coleta e análise de solo para recomendação de cultivo.

**Documentos necessários:**
- CPF (obrigatório)
- Cadastro de Produtor Rural (se aplicável)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Localização da Propriedade (máx. 300 caracteres)
- **[number]** Área para Análise (hectares, mínimo 0)
- **[select]** Finalidade: Plantio Anual, Plantio Perene, Horticultura, Pastagem, Outros
- **[string/textarea]** Observações (máx. 300 caracteres)

**Prazo estimado:** 20 dias úteis

---

### 9. Licença para Eventos Rurais
**O que é:** Solicitação de licença para realização de eventos rurais (feiras, exposições, leilões).

**Documentos necessários:**
- CPF (obrigatório)
- CNPJ (se pessoa jurídica)
- Projeto do Evento (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do Evento (máx. 200 caracteres)
- **[select]** Tipo de Evento: Feira, Exposição, Leilão, Rodeio, Festival, Outros
- **[date]** Data do Evento
- **[string]** Local do Evento (máx. 300 caracteres)
- **[number]** Público Esperado (mínimo 1)
- **[string/textarea]** Descrição do Evento (máx. 500 caracteres)

**Prazo estimado:** 30 dias úteis

---

### 10. Certidão de Produtor Rural
**O que é:** Emissão de certidão comprovando cadastro como produtor rural.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Residência (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 11. Declaração de Atividade Rural
**O que é:** Emissão de declaração comprovando exercício de atividade rural.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- DAP - Declaração de Aptidão ao Pronaf (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 12. Segunda Via de Cadastro de Produtor
**O que é:** Emissão de segunda via do cadastro de produtor rural.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Protocolo Original (se possuir)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

## Secretaria de Cultura

### 1. Inscrição em Oficinas Culturais
**O que é:** Inscrição em oficinas de arte, música, teatro, dança e outras modalidades culturais.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Oficina: Música, Teatro, Dança, Artes Visuais, Artesanato, Literatura, Fotografia, Audiovisual, Outra
- **[string]** Nome da Oficina (máx. 200 caracteres)
- **[select]** Nível de Experiência: Nenhum, Iniciante, Intermediário, Avançado
- **[select]** Turno Preferido: Manhã, Tarde, Noite, Qualquer
- **[textarea]** Motivo da Inscrição (máx. 500 caracteres)

**Prazo estimado:** 5 dias úteis

---

### 2. Cadastro de Artistas Locais
**O que é:** Cadastro de artistas para participação em eventos culturais municipais.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Portfólio Artístico (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Área de Atuação: Teatro, Música, Dança, Artes Visuais, Literatura, Cultura Popular, Audiovisual, Outra
- **[textarea]** Experiência Artística (máx. 500 caracteres)
- **[textarea]** Observações (máx. 300 caracteres)

**Prazo estimado:** 10 dias úteis

---

### 3. Reserva de Espaço Cultural
**O que é:** Agendamento de teatros, centros culturais e auditórios municipais.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Projeto do Evento (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Espaço Desejado (máx. 200 caracteres)
- **[select]** Tipo de Evento: Teatro, Show Musical, Dança, Exposição, Palestra, Workshop, Outro
- **[string]** Nome do Evento (máx. 200 caracteres)
- **[date]** Data Desejada
- **[time]** Horário de Início (formato HH:MM)
- **[integer]** Público Estimado (mínimo 1)
- **[textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 10 dias úteis

---

### 4. Cadastro de Grupo Artístico
**O que é:** Cadastro de grupos culturais e artísticos do município.

**Documentos necessários:**
- Documentos dos Integrantes (obrigatório)
- Portfólio do Grupo (obrigatório)
- Estatuto (opcional)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do Grupo (máx. 200 caracteres)
- **[select]** Tipo de Manifestação: Teatro, Música, Dança, Artes Visuais, Literatura, Cultura Popular, Outra
- **[integer]** Número de Integrantes (mínimo 2)
- **[integer]** Ano de Fundação (1900-2100)
- **[textarea]** Descrição do Grupo (máx. 500 caracteres)

**Prazo estimado:** 7 dias úteis

---

### 5. Solicitação de Atendimento Geral - Cultura
**O que é:** Registro de solicitações e atendimentos gerais da Secretaria de Cultura.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Tipo de Atendimento: Informações, Inscrição, Reserva de Espaço, Projeto Cultural, Reclamação, Outros
- **[select]** Área Cultural: Artes Visuais, Música, Teatro, Dança, Literatura, Artesanato, Cultura Popular, Audiovisual, Outra
- **[textarea]** Descrição da Solicitação (máx. 500 caracteres)

**Prazo estimado:** 5 dias úteis

---

### 6. Cadastro de Evento Cultural
**O que é:** Registro de eventos culturais no município.

**Documentos necessários:**
- Projeto do Evento (obrigatório)
- Autorizações Necessárias (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do Evento (máx. 200 caracteres)
- **[select]** Tipo de Evento: Show, Teatro, Exposição, Festival, Oficina, Palestra, Outro
- **[date]** Data do Evento
- **[string]** Local do Evento (máx. 200 caracteres)
- **[integer]** Público Estimado (mínimo 1)
- **[textarea]** Descrição do Evento (máx. 500 caracteres)

**Prazo estimado:** 15 dias úteis

---

### 7. Registro de Manifestação Cultural
**O que é:** Registro de patrimônio cultural imaterial do município.

**Documentos necessários:**
- Documentação Histórica (obrigatório)
- Fotos (obrigatório)
- Depoimentos (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome da Manifestação Cultural (máx. 200 caracteres)
- **[select]** Tipo de Manifestação: Festa Popular, Dança Tradicional, Música Folclórica, Artesanato, Culinária, Celebração Religiosa, Outra
- **[textarea]** Descrição Histórica (máx. 1000 caracteres)
- **[select]** Periodicidade: Anual, Semestral, Mensal, Esporádica, Contínua
- **[textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 60 dias úteis

---

### 8. Submissão de Projetos Culturais
**O que é:** Submissão de projetos culturais (editais de fomento, Lei de Incentivo à Cultura, projetos gerais).

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Projeto Detalhado (obrigatório)
- Orçamento (obrigatório)
- Plano de Divulgação (opcional)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do Projeto (máx. 200 caracteres)
- **[select]** Tipo de Submissão: Edital de Fomento, Lei de Incentivo à Cultura, Projeto Cultural Geral
- **[select]** Área Cultural: Artes Visuais, Música, Teatro, Dança, Literatura, Audiovisual, Cultura Popular, Patrimônio, Outra
- **[textarea]** Resumo do Projeto (máx. 1000 caracteres)
- **[number]** Valor Solicitado (R$, mínimo 0)
- **[textarea]** Justificativa (máx. 500 caracteres)

**Prazo estimado:** 30 dias úteis

---

### 9. Solicitação de Apoio Cultural
**O que é:** Solicitação de apoio da prefeitura para eventos e atividades culturais.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Projeto ou Proposta (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone Secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da Mãe
- Estado Civil
- Profissão
- Renda Familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do Evento/Atividade (máx. 200 caracteres)
- **[select]** Tipo de Apoio: Divulgação, Espaço Físico, Equipamentos, Transporte, Outro
- **[select]** Área Cultural: Artes Visuais, Música, Teatro, Dança, Literatura, Audiovisual, Cultura Popular, Outra
- **[date]** Data do Evento
- **[textarea]** Descrição da Solicitação (máx. 500 caracteres)

**Prazo estimado:** 15 dias úteis

---

### 10. Certidão de Artista Local
**O que é:** Emissão de certidão comprovando registro como artista local.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Portfólio Artístico (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 11. Atestado de Capacitação Cultural
**O que é:** Emissão de atestado de conclusão de oficina cultural.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Inscrição (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 12. Segunda Via de Cadastro Cultural
**O que é:** Emissão de segunda via de cadastros culturais (artista, grupo, etc.).

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Protocolo Original (se possuir)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

## Secretaria de Segurança Pública

### 1. Registro de Ocorrência
**O que é:** Registro de boletim de ocorrência para crimes, acidentes ou situações que necessitam de registro oficial.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Ocorrência (Furto, Roubo, Ameaça, Perturbação, Acidente, Outro)
- **[date]** Data da Ocorrência
- **[string]** Hora da Ocorrência (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string]** Local da Ocorrência (máx. 300 caracteres)
- **[textarea]** Descrição dos Fatos (mín. 50, máx. 2000 caracteres)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 2. Solicitação de Patrulhamento
**O que é:** Solicitação de ronda policial em determinada área ou período.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[textarea]** Motivo do Patrulhamento (mín. 20, máx. 1000 caracteres)
- **[string]** Período Solicitado (máx. 200 caracteres)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 2 dias úteis

---

### 3. Mapa de Criminalidade
**O que é:** Consulta de estatísticas de segurança e informações sobre criminalidade no município.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 4. Certidão de Antecedentes
**O que é:** Emissão de certidão de antecedentes criminais.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)

**Prazo estimado:** 3 dias úteis

---

### 5. Declaração de Perda de Documentos
**O que é:** Emissão de declaração de perda de documentos.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- BO (obrigatório)

**Prazo estimado:** 3 dias úteis

---

### 6. Autorização para Evento com Segurança
**O que é:** Autorização para eventos que necessitam de policiamento municipal.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto (obrigatório)
- Seguro (obrigatório)
- Autorizações (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Nome do Evento (máx. 200 caracteres)
- **[number]** Público Estimado (mínimo 1)
- **[date]** Data do Evento
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 7. Atendimentos - Segurança Pública
**O que é:** Registro geral de atendimentos em segurança pública.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Atendimento (Consulta, Denúncia, Solicitação, Orientação, Outro)
- **[string]** Assunto (máx. 200 caracteres)
- **[string]** Descrição do Atendimento (mín. 20, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 8. Registro de Ocorrência (BO)
**O que é:** Registro de boletim de ocorrência policial.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Ocorrência (Furto, Roubo, Lesão Corporal, Ameaça, Dano ao Patrimônio, Perturbação do Sossego, Acidente de Trânsito, Desaparecimento, Outro)
- **[datetime]** Data e Hora da Ocorrência
- **[string]** Local da Ocorrência (máx. 300 caracteres)
- **[string]** Relato Detalhado da Ocorrência (mín. 50, máx. 2000 caracteres)
- **[string]** Testemunhas (nomes e contatos) (máx. 500 caracteres, opcional)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 9. Solicitação de Ronda Policial
**O que é:** Solicitação de patrulhamento em área específica.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Endereço da Área para Ronda (máx. 300 caracteres)
- **[select]** Motivo da Solicitação (Aumento de Criminalidade, Ponto de Drogas, Perturbação do Sossego, Vandalismo, Outro)
- **[select]** Período Preferencial (Manhã, Tarde, Noite, Madrugada, Indiferente)
- **[string]** Justificativa Detalhada (mín. 30, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 2 dias úteis

---

### 10. Solicitação de Câmera de Segurança
**O que é:** Solicitação de instalação de câmera de monitoramento em via pública.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Justificativa (obrigatório)
- Abaixo-assinado (obrigatório)
- Fotos do Local (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Local Sugerido para Instalação (máx. 300 caracteres)
- **[select]** Motivo da Solicitação (Furtos Frequentes, Vandalismo, Tráfico de Drogas, Proteção de Equipamento Público, Outro)
- **[integer]** Número de Assinaturas Coletadas (mínimo 1)
- **[string]** Justificativa Detalhada (mín. 50, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 30 dias úteis

---

### 11. Denúncia Anônima (Disque Denúncia)
**O que é:** Registro de denúncias anônimas sobre atividades criminosas.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Denúncia (Tráfico de Drogas, Roubo/Furto, Violência Doméstica, Corrupção, Maus-tratos, Porte Ilegal de Arma, Outro)
- **[string]** Local da Denúncia (máx. 300 caracteres)
- **[string]** Relato Detalhado da Denúncia (mín. 30, máx. 2000 caracteres)
- **[boolean]** Deseja fazer a denúncia de forma anônima?
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 12. Cadastro de Ponto Crítico
**O que é:** Registro de áreas de risco e vulnerabilidade para mapeamento de segurança.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Local do Ponto Crítico (máx. 300 caracteres)
- **[select]** Tipo de Ponto Crítico (Alta Criminalidade, Tráfico de Drogas, Ponto de Prostituição, Vandalismo, Aglomeração de Pessoas, Outro)
- **[string]** Descrição da Situação (mín. 30, máx. 1000 caracteres)
- **[select]** Nível de Gravidade (Baixo, Médio, Alto, Crítico)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 13. Alerta de Segurança
**O que é:** Registro de avisos e alertas de segurança em tempo real.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Alerta (Suspeito Circulando, Veículo Suspeito, Situação de Risco, Evento de Segurança, Outro)
- **[string]** Local do Alerta (máx. 300 caracteres)
- **[string]** Descrição do Alerta (mín. 20, máx. 1000 caracteres)
- **[select]** Nível de Urgência (Baixa, Média, Alta, Emergencial)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 14. Registro de Patrulha
**O que é:** Registro de patrulhamento realizado pela guarda municipal.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[datetime]** Data e Hora da Patrulha
- **[select]** Tipo de Patrulha (Ronda Preventiva, Ronda Escolar, Operação Específica, Atendimento a Ocorrência, Patrulha Comunitária)
- **[string]** Local Patrulhado (máx. 300 caracteres)
- **[string]** Código da Viatura (máx. 50 caracteres)
- **[string]** Relato da Patrulha (mín. 20, máx. 1000 caracteres)
- **[string]** Ocorrências Registradas (máx. 500 caracteres, opcional)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 15. Gestão da Guarda Municipal
**O que é:** Administração de escala de serviço e viaturas da guarda municipal.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Gestão (Cadastro de Agente, Escala de Serviço, Gestão de Viatura, Controle de Equipamento, Outro)
- **[string]** Descrição (mín. 20, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 16. Gestão de Vigilância (Central de Operações)
**O que é:** Administração de câmeras e central de monitoramento.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- Telefone secundário
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Nome da mãe
- Estado civil
- Profissão
- Renda familiar

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Tipo de Operação (Cadastro de Câmera, Manutenção de Câmera, Análise de Imagens, Registro de Ocorrência Visual, Outro)
- **[string]** Descrição da Operação (mín. 20, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 17. Estatísticas de Segurança
**O que é:** Consulta a análises e estatísticas regionais de segurança pública.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 18. Certidão de Antecedentes Criminais
**O que é:** Emissão de certidão de antecedentes da guarda municipal.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)

**Prazo estimado:** 5 dias úteis

---

### 19. Certidão de Ocorrência Policial
**O que é:** Emissão de certidão de registro de ocorrência policial.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Número da Ocorrência (obrigatório)

**Prazo estimado:** 3 dias úteis

---

### 20. Declaração de Comparecimento a Delegacia
**O que é:** Emissão de declaração de comparecimento para registro em delegacia.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)

**Prazo estimado:** 1 dia útil

---

### 21. Atestado de Bons Antecedentes
**O que é:** Emissão de atestado de bons antecedentes municipais.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Residência (obrigatório)

**Prazo estimado:** 7 dias úteis

---

### 22. Laudo de Vistoria de Segurança
**O que é:** Emissão de laudo de vistoria de segurança de estabelecimento comercial.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Alvará de Funcionamento (obrigatório)
- CNPJ (obrigatório)

**Prazo estimado:** 15 dias úteis

---

### 23. Autorização para Evento com Aglomeração
**O que é:** Emissão de autorização de segurança para eventos com aglomeração de pessoas.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Projeto do Evento (obrigatório)
- Plano de Segurança (obrigatório)

**Prazo estimado:** 20 dias úteis

---
