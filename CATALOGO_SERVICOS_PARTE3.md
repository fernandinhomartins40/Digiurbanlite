# Catálogo de Serviços Municipais - Parte 3

# Catálogo de Serviços Municipais - Secretaria de Esportes

## Secretaria de Esportes

### 1. Inscrição em Modalidades Esportivas
**O que é:** Inscrição em aulas de esporte.

**Documentos necessários:**
- Atestado Médico (obrigatório)
- RG (obrigatório)
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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Modalidade Esportiva (máx. 100 caracteres, obrigatório) - Opções: Futebol, Vôlei, Basquete, Natação, Judô, Karatê, Atletismo, Outro
- **[select]** Nível (obrigatório) - Opções: Iniciante, Intermediário, Avançado
- **[select]** Turno Preferencial (obrigatório) - Opções: Manhã, Tarde, Noite, Qualquer
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 2. Aluguel de Quadras
**O que é:** Reserva de quadras esportivas.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Local da Quadra (mín. 3, máx. 200 caracteres, obrigatório)
- **[date]** Data da Reserva (obrigatório)
- **[string]** Horário de Início (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$, obrigatório)
- **[number]** Duração (horas, mínimo 1, máximo 4, obrigatório)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 3. Inscrição em Torneios
**O que é:** Inscrição de equipes em torneios municipais.

**Documentos necessários:**
- Lista de Atletas (obrigatório)
- Regulamento Assinado (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Equipe (mín. 3, máx. 200 caracteres, obrigatório)
- **[select]** Modalidade (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Outro
- **[select]** Categoria (obrigatório) - Opções: Infantil, Juvenil, Adulto, Master, Feminino, Misto
- **[array]** Lista de Atletas (mínimo 5 atletas, obrigatório) - Cada atleta deve conter: nome **[string]** e CPF **[string]** (padrão: ^\d{11}$)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 4. Atendimentos - Esportes
**O que é:** Registro geral de atendimentos na área esportiva.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Motivo do Atendimento (obrigatório) - Opções: Informações Gerais, Inscrição em Escolinha, Reserva de Espaço, Inscrição em Competição, Cadastro de Atleta, Cadastro de Equipe, Reclamação, Sugestão, Outro
- **[string/textarea]** Descrição do Atendimento (mín. 10, máx. 1000 caracteres, obrigatório)
- **[select]** Modalidade de Interesse (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Natação, Atletismo, Judô, Karatê, Capoeira, Tênis, Tênis de Mesa, Ginástica, Outro
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 5. Inscrição em Escolinha Esportiva
**O que é:** Inscrição em escolinhas de futebol, vôlei, basquete, etc.

**Documentos necessários:**
- Certidão de Nascimento (obrigatório)
- Atestado Médico (obrigatório)
- Comprovante de Endereço (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres, obrigatório)
- **[string]** CPF do Aluno (padrão: ^\d{11}$, mín. 11, máx. 11 caracteres, obrigatório)
- **[date]** Data de Nascimento do Aluno (obrigatório)
- **[integer]** Idade do Aluno (mínimo 4, máximo 17, obrigatório)
- **[select]** Sexo do Aluno (obrigatório) - Opções: Masculino, Feminino
- **[select]** Modalidade da Escolinha (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Natação, Atletismo, Judô, Karatê, Capoeira, Tênis, Ginástica
- **[string]** Unidade/Local da Escolinha (máx. 200 caracteres, obrigatório)
- **[select]** Turno de Preferência (obrigatório) - Opções: Manhã, Tarde, Noite
- **[string/textarea]** Necessidades Especiais (máx. 500 caracteres, opcional)
- **[select]** Experiência Anterior (obrigatório) - Opções: Sim, Não
- **[select]** Objetivo da Inscrição (obrigatório) - Opções: Recreação, Competição, Saúde/Condicionamento, Socialização
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 6. Cadastro de Atleta
**O que é:** Cadastro de atletas federados no município.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Atestado Médico (obrigatório)
- Comprovante de Federação (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Modalidade Principal (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Natação, Atletismo, Judô, Karatê, Capoeira, Tênis, Tênis de Mesa, Ginástica, Outro
- **[string]** Posição/Categoria (máx. 100 caracteres, obrigatório)
- **[number]** Altura (cm, mínimo 100, máximo 250, obrigatório)
- **[number]** Peso (kg, mínimo 30, máximo 200, obrigatório)
- **[select]** Categoria de Idade (obrigatório) - Opções: Sub-11, Sub-13, Sub-15, Sub-17, Sub-20, Adulto, Master
- **[string]** Número da Federação (máx. 50 caracteres, obrigatório)
- **[string]** Federação Vinculada (máx. 200 caracteres, obrigatório)
- **[string]** Equipe Atual (máx. 200 caracteres, opcional)
- **[select]** Tempo de Experiência (obrigatório) - Opções: Menos de 1 ano, 1-3 anos, 3-5 anos, 5-10 anos, Mais de 10 anos
- **[select]** Objetivo como Atleta (obrigatório) - Opções: Competição Municipal, Competição Estadual, Competição Nacional, Profissionalização, Recreação
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 7. Reserva de Espaço Esportivo
**O que é:** Agendamento de quadras, ginásios e campos.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Termo de Responsabilidade (obrigatório)
- Comprovante de Reserva (opcional)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Espaço (obrigatório) - Opções: Quadra Poliesportiva, Campo de Futebol, Ginásio, Piscina, Quadra de Tênis, Pista de Atletismo, Outro
- **[string]** Nome do Espaço (máx. 200 caracteres, obrigatório)
- **[date]** Data da Reserva (obrigatório)
- **[string]** Horário de Início (formato HH:MM, padrão: ^([01]?[0-9]|2[0-3]):[0-5][0-9]$, obrigatório)
- **[string]** Horário de Término (formato HH:MM, padrão: ^([01]?[0-9]|2[0-3]):[0-5][0-9]$, obrigatório)
- **[select]** Finalidade do Uso (obrigatório) - Opções: Treino Esportivo, Competição, Evento, Recreação, Aula, Outro
- **[string]** Modalidade a ser Praticada (máx. 100 caracteres, obrigatório)
- **[integer]** Número de Participantes (mínimo 1, obrigatório)
- **[string]** Nome do Grupo/Equipe (máx. 200 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 3 dias úteis

---

### 8. Inscrição em Competição
**O que é:** Inscrição em campeonatos e competições municipais.

**Documentos necessários:**
- Fichas dos Atletas (obrigatório)
- Atestados Médicos (obrigatório)
- Comprovante de Pagamento (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Competição (máx. 200 caracteres, obrigatório)
- **[select]** Modalidade (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Natação, Atletismo, Judô, Karatê, Tênis, Tênis de Mesa, Outro
- **[select]** Categoria (obrigatório) - Opções: Sub-11, Sub-13, Sub-15, Sub-17, Sub-20, Adulto, Master, Livre
- **[select]** Tipo de Inscrição (obrigatório) - Opções: Individual, Equipe
- **[string]** Nome da Equipe (se aplicável, máx. 200 caracteres, opcional)
- **[integer]** Número de Atletas (mínimo 1, obrigatório)
- **[string]** Nome do Técnico (máx. 200 caracteres, obrigatório)
- **[string]** CPF do Técnico (padrão: ^\d{11}$, obrigatório)
- **[string]** Telefone do Técnico (padrão: ^\d{10,11}$, obrigatório)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 9. Cadastro de Equipe Esportiva
**O que é:** Cadastro de equipes municipais.

**Documentos necessários:**
- Fichas dos Atletas (obrigatório)
- Documentação do Técnico (obrigatório)
- Regimento (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Equipe (mín. 3, máx. 200 caracteres, obrigatório)
- **[select]** Modalidade (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Natação, Atletismo, Outro
- **[select]** Categoria (obrigatório) - Opções: Sub-11, Sub-13, Sub-15, Sub-17, Sub-20, Adulto, Master, Livre
- **[integer]** Ano de Fundação (mínimo 1900, máximo 2100, obrigatório)
- **[integer]** Número de Atletas (mínimo 5, obrigatório)
- **[string]** Nome do Técnico Principal (mín. 3, máx. 200 caracteres, obrigatório)
- **[string]** CPF do Técnico (padrão: ^\d{11}$, obrigatório)
- **[string]** Telefone do Técnico (padrão: ^\d{10,11}$, obrigatório)
- **[string]** CREF do Técnico (máx. 20 caracteres, opcional)
- **[string]** Local de Treino (máx. 200 caracteres, opcional)
- **[string]** Dias de Treino (máx. 200 caracteres, opcional)
- **[string]** Horário de Treino (máx. 100 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 10. Inscrição em Torneio
**O que é:** Inscrição de equipes em torneios esportivos.

**Documentos necessários:**
- Súmula da Equipe (obrigatório)
- Comprovante de Pagamento (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Torneio (máx. 200 caracteres, obrigatório)
- **[select]** Modalidade (obrigatório) - Opções: Futebol, Futsal, Vôlei, Basquete, Handebol, Outro
- **[select]** Categoria (obrigatório) - Opções: Sub-11, Sub-13, Sub-15, Sub-17, Sub-20, Adulto, Master, Livre
- **[string]** Nome da Equipe (mín. 3, máx. 200 caracteres, obrigatório)
- **[integer]** Número de Atletas Inscritos (mínimo 5, obrigatório)
- **[string]** Nome do Técnico (mín. 3, máx. 200 caracteres, obrigatório)
- **[string]** Telefone do Técnico (padrão: ^\d{10,11}$, obrigatório)
- **[string]** Cor do Uniforme Principal (máx. 100 caracteres, opcional)
- **[string]** Cor do Uniforme Reserva (máx. 100 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 11. Cadastro de Modalidade Esportiva
**O que é:** Cadastro de novas modalidades esportivas no município.

**Documentos necessários:**
- Regras da Modalidade (obrigatório)
- Documentação do Instrutor (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Modalidade (mín. 3, máx. 200 caracteres, obrigatório)
- **[select]** Tipo de Modalidade (obrigatório) - Opções: Coletiva, Individual, Combate, Aquática, Radical, Adaptada, Outro
- **[string/textarea]** Descrição da Modalidade (mín. 50, máx. 1000 caracteres, obrigatório)
- **[string/textarea]** Objetivos da Modalidade (mín. 30, máx. 500 caracteres, obrigatório)
- **[select]** Público-Alvo (obrigatório) - Opções: Infantil, Juvenil, Adulto, Idoso, Todos
- **[integer]** Número Mínimo de Participantes (mínimo 1, obrigatório)
- **[string]** Nome do Instrutor/Professor (mín. 3, máx. 200 caracteres, obrigatório)
- **[string]** CPF do Instrutor (padrão: ^\d{11}$, obrigatório)
- **[string]** CREF do Instrutor (máx. 20 caracteres, opcional)
- **[string]** Telefone do Instrutor (padrão: ^\d{10,11}$, obrigatório)
- **[string/textarea]** Material Necessário (máx. 500 caracteres, opcional)
- **[string]** Espaço Necessário (máx. 300 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 12. Agenda de Eventos Esportivos
**O que é:** Consulta de competições e torneios.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 13. Certidão de Participação Esportiva
**O que é:** Emissão de certidão de participação.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Nome do Evento (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 14. Declaração de Atleta
**O que é:** Emissão de declaração de atleta.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Inscrição (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 15. Atestado de Aptidão Física
**O que é:** Emissão de atestado para prática esportiva.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Atestado Médico (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 16. Laudo Técnico de Instalação
**O que é:** Emissão de laudo de instalações esportivas.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Localização (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 15 dias úteis

---

### 17. Autorização para Torneio
**O que é:** Autorização para realização de torneios.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Regulamento (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 18. Certidão de Atleta Municipal
**O que é:** Certidão comprovando condição de atleta municipal.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Atestado Médico (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 19. Declaração de Participação em Competição
**O que é:** Declaração de participação em competições esportivas municipais.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Inscrição (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 20. Atestado de Inscrição em Escolinha
**O que é:** Atestado de inscrição em escolinhas esportivas.

**Documentos necessários:**
- CPF do Responsável (obrigatório)
- RG do Atleta (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 2 dias úteis

---

### 21. Comprovante de Reserva de Quadra
**O que é:** Comprovante de reserva de espaço esportivo.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Reserva (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 1 dia útil

---

### 22. Segunda Via de Carteira de Atleta
**O que é:** Reemissão de carteira de atleta municipal.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Foto 3x4 (obrigatório)
- Protocolo Original (opcional)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 23. Consulta de Calendário Esportivo
**O que é:** Consulta oficial do calendário de eventos esportivos.

**Documentos necessários:**
- CPF (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 1 dia útil

---

## Secretaria de Turismo

### 1. Cadastro de Guia Turístico
**O que é:** Registro oficial de guias de turismo no município.

**Documentos necessários:**
- CPF (obrigatório)
- Cadastur (obrigatório)
- Certificado de Formação (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Número do Cadastur
- Idiomas
- Especializações
- Experiência

**Prazo estimado:** 15 dias úteis

---

### 2. Cadastro de Meio de Hospedagem
**O que é:** Registro de hotéis, pousadas e albergues.

**Documentos necessários:**
- CNPJ (obrigatório)
- Alvará de Funcionamento (obrigatório)
- Alvará Sanitário (obrigatório)

**Campos do formulário:**
- Nome do estabelecimento
- CNPJ
- Telefone
- E-mail
- Endereço
- Tipo de hospedagem
- Número de quartos
- Capacidade
- Classificação

**Prazo estimado:** 20 dias úteis

---

### 3. Solicitação de Material Promocional
**O que é:** Pedido de folders, mapas e guias turísticos.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)

**Campos do formulário:**
- Nome do solicitante
- CPF/CNPJ
- Telefone
- E-mail
- Tipo de material
- Quantidade
- Finalidade

**Prazo estimado:** 10 dias úteis

---

### 4. Cadastro de Restaurante Turístico
**O que é:** Registro de estabelecimentos gastronômicos para circuito turístico.

**Documentos necessários:**
- CNPJ (obrigatório)
- Alvará Sanitário (obrigatório)
- Alvará de Funcionamento (obrigatório)

**Campos do formulário:**
- Nome do restaurante
- CNPJ
- Telefone
- E-mail
- Endereço
- Tipo de culinária
- Capacidade
- Dias de funcionamento

**Prazo estimado:** 15 dias úteis

---

### 5. Solicitação de Apoio a Evento Turístico
**O que é:** Pedido de patrocínio ou divulgação de eventos.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)
- Projeto do Evento (obrigatório)

**Campos do formulário:**
- Nome do organizador
- CPF/CNPJ
- Telefone
- E-mail
- Nome do evento
- Data
- Local
- Público esperado
- Apoio solicitado

**Prazo estimado:** 30 dias úteis

---

### 6. Cadastro de Agência de Turismo
**O que é:** Registro de agências e operadoras de turismo.

**Documentos necessários:**
- CNPJ (obrigatório)
- Cadastur (obrigatório)
- Contrato Social (obrigatório)

**Campos do formulário:**
- Nome da agência
- CNPJ
- Telefone
- E-mail
- Endereço
- Número do Cadastur
- Serviços oferecidos

**Prazo estimado:** 20 dias úteis

---

### 7. Solicitação de Inclusão em Roteiro Turístico
**O que é:** Pedido para ponto turístico fazer parte de circuitos oficiais.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)
- Fotos do Local (obrigatório)
- Histórico (obrigatório)

**Campos do formulário:**
- Nome do responsável
- CPF/CNPJ
- Telefone
- E-mail
- Nome do atrativo
- Endereço
- Descrição
- Infraestrutura

**Prazo estimado:** 30 dias úteis

---

### 8. Cadastro de Artesão Local
**O que é:** Registro de artesãos para feiras e eventos turísticos.

**Documentos necessários:**
- CPF (obrigatório)
- Fotos dos Produtos (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Tipo de artesanato
- Técnicas utilizadas
- Produção mensal

**Prazo estimado:** 10 dias úteis

---

### 9. Solicitação de Selo de Turismo Sustentável
**O que é:** Certificação de práticas sustentáveis no turismo.

**Documentos necessários:**
- CNPJ (obrigatório)
- Plano de Sustentabilidade (obrigatório)

**Campos do formulário:**
- Nome do estabelecimento
- CNPJ
- Telefone
- E-mail
- Endereço
- Práticas sustentáveis
- Certificações existentes

**Prazo estimado:** 45 dias úteis

---

### 10. Cadastro de Transporte Turístico
**O que é:** Registro de veículos para transporte de turistas.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)
- CNH Categoria D (obrigatório)
- Documentos do Veículo (obrigatório)

**Campos do formulário:**
- Nome do responsável
- CPF/CNPJ
- Telefone
- E-mail
- Tipo de veículo
- Capacidade
- Placa
- Ano

**Prazo estimado:** 20 dias úteis

---

### 11. Solicitação de Sinalização Turística
**O que é:** Pedido de placas indicativas para atrativos turísticos.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)
- Projeto de Sinalização (obrigatório)

**Campos do formulário:**
- Nome do solicitante
- CPF/CNPJ
- Telefone
- E-mail
- Local
- Tipo de sinalização
- Justificativa

**Prazo estimado:** 60 dias úteis

---

### 12. Cadastro em Calendário de Eventos
**O que é:** Inscrição de eventos no calendário turístico oficial.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)

**Campos do formulário:**
- Nome do organizador
- CPF/CNPJ
- Telefone
- E-mail
- Nome do evento
- Data
- Local
- Descrição
- Público esperado

**Prazo estimado:** 15 dias úteis

---

### 13. Solicitação de Credencial de Imprensa
**O que é:** Pedido de credenciamento para cobertura de eventos turísticos.

**Documentos necessários:**
- CPF (obrigatório)
- Carteira de Imprensa (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Veículo de comunicação
- Evento
- Tipo de cobertura

**Prazo estimado:** 10 dias úteis

---

### 14. Cadastro de Ponto de Informação Turística
**O que é:** Registro de locais que fornecem informações a turistas.

**Documentos necessários:**
- CNPJ (obrigatório)
- Alvará de Funcionamento (obrigatório)

**Campos do formulário:**
- Nome do estabelecimento
- CNPJ
- Telefone
- E-mail
- Endereço
- Horário de atendimento
- Idiomas disponíveis

**Prazo estimado:** 15 dias úteis

---

### 15. Solicitação de Parcerias
**O que é:** Pedido de cooperação com prefeitura para projetos turísticos.

**Documentos necessários:**
- CNPJ (obrigatório)
- Projeto (obrigatório)

**Campos do formulário:**
- Nome da empresa
- CNPJ
- Telefone
- E-mail
- Tipo de parceria
- Descrição do projeto
- Benefícios esperados

**Prazo estimado:** 45 dias úteis

---

# Catálogo de Serviços Municipais - Secretaria de Turismo

## Secretaria de Turismo

### 1. Atendimentos - Turismo
**O que é:** Registro geral de atendimentos na área turística.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Motivo do Atendimento (Informações Turísticas, Cadastro de Estabelecimento, Cadastro de Guia, Programa Turístico, Evento, Reclamação, Outro)
- **[string/textarea]** Descrição do Atendimento (mín. 10, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 2. Cadastro de Estabelecimento Turístico
**O que é:** Cadastro de hotéis, pousadas, restaurantes e outros estabelecimentos turísticos.

**Documentos necessários:**
- CNPJ (obrigatório)
- Alvará de Funcionamento (obrigatório)
- Documentação do Responsável (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Estabelecimento (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Estabelecimento (Hotel, Pousada, Hostel, Restaurante, Bar, Lanchonete, Agência de Turismo, Outro)
- **[string]** CNPJ (padrão: ^\\d{14}$, mín. 14, máx. 14 caracteres)
- **[string]** Endereço do Estabelecimento (mín. 10, máx. 300 caracteres)
- **[string]** CEP do Estabelecimento (padrão: ^\\d{8}$)
- **[string]** Telefone do Estabelecimento (padrão: ^\\d{10,11}$)
- **[string]** E-mail do Estabelecimento (opcional)
- **[number]** Capacidade de Atendimento (mínimo 1, opcional)
- **[string/textarea]** Descrição dos Serviços (mín. 30, máx. 1000 caracteres, opcional)
- **[string]** Horário de Funcionamento (máx. 200 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 3. Cadastro de Guia Turístico
**O que é:** Cadastro de guias de turismo credenciados no município.

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Cadastur (obrigatório)
- Certificado de Capacitação (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Número do Cadastur (máx. 50 caracteres)
- **[string]** Especialidades (máx. 300 caracteres)
- **[string]** Idiomas que Fala (máx. 200 caracteres)
- **[select]** Tempo de Experiência (Menos de 1 ano, 1-3 anos, 3-5 anos, 5-10 anos, Mais de 10 anos, opcional)
- **[string/textarea]** Certificações e Cursos (máx. 500 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 4. Inscrição em Programa Turístico
**O que é:** Inscrição em programas de desenvolvimento turístico municipal.

**Documentos necessários:**
- CNPJ ou CPF (obrigatório)
- Projeto (obrigatório)
- Documentação do Estabelecimento (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Programa (máx. 200 caracteres)
- **[select]** Tipo de Programa (Qualificação Profissional, Desenvolvimento de Produto, Marketing Turístico, Infraestrutura, Outro)
- **[select]** Tipo de Inscrito (Pessoa Física, Pessoa Jurídica)
- **[string]** CNPJ (se pessoa jurídica, padrão: ^\\d{14}$, opcional)
- **[string/textarea]** Descrição do Projeto (mín. 50, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 5. Registro de Atrativo Turístico
**O que é:** Cadastro de pontos turísticos e atrativos da cidade.

**Documentos necessários:**
- Fotos (obrigatório)
- Descrição (obrigatório)
- Localização GPS (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Atrativo (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Atrativo (Natural, Cultural, Histórico, Religioso, Gastronômico, Esportivo, Outro)
- **[string/textarea]** Descrição do Atrativo (mín. 50, máx. 1000 caracteres)
- **[string]** Endereço do Atrativo (mín. 10, máx. 300 caracteres)
- **[select]** Acessibilidade (Total, Parcial, Não Possui, opcional)
- **[string]** Horário de Funcionamento (máx. 200 caracteres, opcional)
- **[select]** Valor da Entrada (Gratuito, Pago, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 6. Cadastro de Roteiro Turístico
**O que é:** Cadastro de roteiros e passeios turísticos da região.

**Documentos necessários:**
- Roteiro Detalhado (obrigatório)
- Fotos (obrigatório)
- Valores (obrigatório)
- Contatos (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Roteiro (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Roteiro (Histórico-Cultural, Ecoturismo, Gastronômico, Religioso, Aventura, Rural, Outro)
- **[string/textarea]** Descrição do Roteiro (mín. 50, máx. 1000 caracteres)
- **[select]** Duração (Meio Período, 1 Dia, 2 Dias, 3 ou mais Dias)
- **[string/textarea]** Pontos de Parada (mín. 20, máx. 500 caracteres, opcional)
- **[select]** Nível de Dificuldade (Fácil, Moderado, Difícil, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 7. Cadastro de Evento Turístico
**O que é:** Registro de eventos e festivais turísticos do município.

**Documentos necessários:**
- Projeto do Evento (obrigatório)
- Autorizações (obrigatório)
- Cronograma (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Evento (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Evento (Festival, Feira, Show, Congresso, Exposição, Competição Esportiva, Outro)
- **[string/textarea]** Descrição do Evento (mín. 50, máx. 1000 caracteres)
- **[date]** Data de Início
- **[date]** Data de Término
- **[string]** Local do Evento (mín. 10, máx. 300 caracteres)
- **[number]** Público Estimado (mínimo 1, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 20 dias úteis

---

### 8. Mapa Turístico
**O que é:** Visualização de atrativos turísticos no mapa interativo.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 9. Guia Turístico da Cidade
**O que é:** Informações gerais sobre os atrativos e serviços turísticos da cidade.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 10. Certidão de Cadastro Turístico
**O que é:** Emissão de certidão de cadastro no sistema turístico municipal.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (obrigatório)
- Alvará de Funcionamento (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 11. Certidão de Regularidade Turística
**O que é:** Emissão de certidão de regularidade de estabelecimento turístico.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (obrigatório)
- Cadastro Turístico (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 12. Declaração de Apoio a Evento Turístico
**O que é:** Emissão de declaração de apoio institucional a eventos turísticos.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Projeto do Evento (obrigatório)
- Cronograma (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 13. Atestado de Participação em Capacitação
**O que é:** Emissão de atestado de participação em curso de turismo.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Inscrição (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 14. Laudo de Vistoria de Equipamento Turístico
**O que é:** Emissão de laudo de vistoria de estabelecimentos turísticos e equipamentos.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (obrigatório)
- Cadastro Turístico (obrigatório)
- Alvará (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 15 dias úteis

---

### 15. Autorização de Uso de Marca Turística
**O que é:** Emissão de autorização para uso da marca turística da cidade.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (obrigatório)
- Projeto de Uso da Marca (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 20 dias úteis

---

## Secretaria de Meio Ambiente

### 1. Licenciamento Ambiental
**O que é:** Solicitação de licença ambiental.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto (obrigatório)
- Estudo de Impacto (obrigatório)
- ART (obrigatório)

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
- **[text]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[text]** Tipo de Atividade (máx. 200 caracteres)
- **[number]** Área de Impacto (hectares, mínimo 0)
- **[textarea]** Medidas de Mitigação (mín. 50, máx. 2000 caracteres)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 60 dias úteis

---

### 2. Coleta Seletiva
**O que é:** Cadastro para coleta seletiva.

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
- **[text]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Dia da Coleta (Segunda, Terça, Quarta, Quinta, Sexta)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 3 dias úteis

---

### 3. Gestão de Resíduos
**O que é:** Controle interno de resíduos.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nenhum campo (serviço de gestão interna)

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[text]** Tipo de Resíduo (máx. 200 caracteres)
- **[number]** Quantidade (toneladas, mínimo 0)
- **[text]** Destino Final (máx. 200 caracteres)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 4. Certidão Ambiental
**O que é:** Emissão de certidão ambiental.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel (obrigatório)

**Prazo estimado:** 10 dias úteis

---

### 5. Declaração de Conformidade Ambiental
**O que é:** Emissão de declaração de conformidade.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Licença Ambiental (obrigatório)

**Prazo estimado:** 7 dias úteis

---

### 6. Laudo Técnico Ambiental
**O que é:** Emissão de laudo técnico ambiental.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Endereço do Imóvel (obrigatório)

**Prazo estimado:** 30 dias úteis

---

### 7. Autorização para Poda/Supressão de Árvores
**O que é:** Autorização para poda ou corte de árvores.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Foto da Árvore (obrigatório)
- Laudo Técnico (obrigatório)
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
- **[text]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Espécie da Árvore (Ipê Amarelo, Ipê Roxo, Ipê Branco, Pau-brasil, Jacarandá, Cedro, Jatobá, Aroeira, Quaresmeira, Sibipiruna, Mangueira, Jaqueira, Abacateiro, Goiabeira, Pitangueira, Eucalipto, Pinus, Palmeira Imperial, Palmeira Real, Outra (especificar nos comentários))
- **[number]** Quantidade de Árvores (mínimo 1)
- **[select]** Motivo da Poda/Supressão (Risco de Queda, Doença, Obstrução, Construção, Outro)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 8. Atendimentos - Meio Ambiente
**O que é:** Registro geral de atendimentos na área ambiental.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Motivo do Atendimento (Licença Ambiental, Denúncia Ambiental, Autorização de Poda/Corte, Programa Ambiental, Vistoria, Informações, Outro)
- **[string]** Descrição do Atendimento (mín. 10, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 9. Licença Ambiental
**O que é:** Solicitação de licenciamento ambiental.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto (obrigatório)
- Estudos Ambientais (obrigatório)
- ART do Responsável Técnico (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Licença (Licença Prévia (LP), Licença de Instalação (LI), Licença de Operação (LO), Licença Única)
- **[select]** Tipo de Atividade (Industrial, Comercial, Agrícola, Mineração, Construção Civil, Serviços, Outro)
- **[string]** Descrição da Atividade (mín. 30, máx. 1000 caracteres)
- **[string]** Endereço do Empreendimento (mín. 10, máx. 300 caracteres)
- **[number]** Área do Empreendimento (m², mínimo 0)
- **[string]** Nome do Responsável Técnico (mín. 3, máx. 200 caracteres)
- **[string]** Registro Profissional (CREA/CAU, máx. 50 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 60 dias úteis

---

### 10. Denúncia Ambiental
**O que é:** Registro de denúncias e reclamações ambientais.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Denúncia (Desmatamento, Poluição da Água, Poluição do Ar, Poluição Sonora, Maus-tratos a Animais, Queimada Irregular, Descarte Irregular de Lixo, Outro)
- **[string]** Descrição da Denúncia (mín. 30, máx. 1000 caracteres)
- **[string]** Endereço da Ocorrência (mín. 10, máx. 300 caracteres)
- **[date]** Data da Ocorrência
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 11. Programa Ambiental
**O que é:** Inscrição em programas de educação ambiental.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Comprovante de Endereço (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome do Programa (máx. 200 caracteres)
- **[select]** Tipo de Programa (Educação Ambiental, Coleta Seletiva, Reciclagem, Horta Comunitária, Reflorestamento, Outro)
- **[string]** Motivo da Inscrição (mín. 20, máx. 500 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 12. Autorização de Poda ou Corte de Árvore
**O que é:** Solicitação de autorização para poda ou corte.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Laudo Técnico (obrigatório)
- Fotos (obrigatório)
- Comprovante de Propriedade (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Solicitação (Poda, Corte, Remoção)
- **[string]** Endereço da Árvore (mín. 10, máx. 300 caracteres)
- **[string]** Espécie da Árvore (se souber, máx. 100 caracteres, opcional)
- **[number]** Altura Estimada (metros, mínimo 0)
- **[select]** Motivo da Solicitação (Risco de Queda, Raízes Danificando Estruturas, Galhos sobre Fiação, Doença, Praga, Outro)
- **[string]** Descrição Detalhada do Motivo (mín. 30, máx. 1000 caracteres)
- **[boolean]** Possui Laudo Técnico? (padrão: Não)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 13. Vistoria Ambiental
**O que é:** Solicitação de inspeção ambiental.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Solicitação Formal (obrigatório)
- Documentação do Imóvel (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Vistoria (Área de Preservação, Licenciamento, Denúncia, Regularização, Outro)
- **[string]** Endereço para Vistoria (mín. 10, máx. 300 caracteres)
- **[string]** Motivo da Vistoria (mín. 30, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 20 dias úteis

---

### 14. Gestão de Áreas Protegidas
**O que é:** Administração de APPs e reservas ambientais.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Área Protegida (APP - Área de Preservação Permanente, Reserva Legal, Unidade de Conservação, Parque Ecológico, Área de Proteção Ambiental, Outra)
- **[string]** Nome da Área Protegida (mín. 3, máx. 200 caracteres)
- **[string]** Localização da Área (máx. 300 caracteres)
- **[number]** Área Total (Hectares, mínimo 0)
- **[select]** Situação de Conservação (Ótima, Boa, Regular, Ruim, Crítica)
- **[string]** Atividades de Gestão Previstas (mín. 20, máx. 1000 caracteres)
- **[string]** Observações (máx. 1000 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 15. Certidão de Conformidade Ambiental
**O que é:** Certidão de conformidade com normas ambientais.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CNPJ/CPF (obrigatório)
- Documentos do Imóvel (obrigatório)

**Prazo estimado:** 10 dias úteis

---

### 16. Declaração de Área Verde
**O que é:** Declaração de área verde preservada.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- Planta do Imóvel (obrigatório)

**Prazo estimado:** 7 dias úteis

---

### 17. Guia de Poda de Árvore
**O que é:** Autorização para poda de árvores.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Endereço (obrigatório)
- Fotos (obrigatório)

**Prazo estimado:** 5 dias úteis

---

### 18. Atestado de Coleta Seletiva
**O que é:** Atestado de participação em programa de coleta seletiva.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)

**Prazo estimado:** 3 dias úteis

---

### 19. Consulta de Licença Ambiental
**O que é:** Consulta de situação de licenças ambientais.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CNPJ/CPF (obrigatório)

**Prazo estimado:** 2 dias úteis

---

### 20. Segunda Via de Autorização Ambiental
**O que é:** Reemissão de autorizações ambientais.

**Tipo de Serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Documentos necessários:**
- CPF (obrigatório)
- Protocolo Original (obrigatório)

**Prazo estimado:** 5 dias úteis

---
# Catálogo de Serviços Municipais - Secretaria de Obras Públicas

## Secretaria de Obras Públicas

### 1. Aprovação de Projeto de Construção
**O que é:** Aprovação de projetos de construção para início de obras.

**Documentos necessários:**
- Projeto Arquitetônico (obrigatório)
- ART (obrigatório)
- Matrícula (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[number]** Área a Construir (m², mínimo 1)
- **[select]** Tipo de Obra (Residencial, Comercial, Industrial, Misto)
- **[number]** Número de Pavimentos (mínimo 1)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 45 dias úteis

---

### 2. Autorização para Demolição
**O que é:** Autorização para demolição de imóvel no município.

**Documentos necessários:**
- Projeto (obrigatório)
- Laudo Estrutural (obrigatório)
- Anuência Vizinhos (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string/textarea]** Motivo da Demolição (mín. 20, máx. 1000 caracteres)
- **[number]** Área a Demolir (m², mínimo 1)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 30 dias úteis

---

### 3. Gestão de Obras Públicas
**O que é:** Controle interno de obras em andamento no município.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome da Obra (mín. 3, máx. 200 caracteres)
- **[string]** Localização (máx. 300 caracteres)
- **[number]** Orçamento (R$, mínimo 0)
- **[number]** Prazo (dias, mínimo 1)
- **[select]** Status (Planejamento, Em Execução, Paralisada, Concluída)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 4. Atendimentos - Obras Públicas
**O que é:** Registro geral de atendimentos na área de obras públicas.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Motivo do Atendimento (Solicitação de Reparo, Vistoria Técnica, Informações sobre Obras, Reclamação, Outro)
- **[string/textarea]** Descrição do Atendimento (mín. 10, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 5. Solicitação de Reparo de Via
**O que é:** Solicitação de tapa-buraco, pavimentação e conserto de vias públicas.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Endereço do Problema (mín. 10, máx. 300 caracteres)
- **[select]** Tipo de Problema (Buraco, Afundamento, Rachadura, Pavimentação Danificada, Valeta, Outro)
- **[string/textarea]** Descrição do Problema (mín. 20, máx. 1000 caracteres)
- **[select]** Tamanho Estimado (Pequeno até 1m, Médio 1-3m, Grande mais de 3m)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 6. Vistoria Técnica de Obras
**O que é:** Solicitação de inspeção técnica em obras privadas e públicas.

**Documentos necessários:**
- Projeto (obrigatório)
- Documentação do Imóvel (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Endereço da Obra (mín. 10, máx. 300 caracteres)
- **[select]** Tipo de Vistoria (Estrutural, Elétrica, Hidráulica, Pavimentação, Geral, Outro)
- **[string/textarea]** Motivo da Vistoria (mín. 30, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 7. Cadastro de Obra Pública
**O que é:** Registro de obras públicas no município com documentação completa.

**Documentos necessários:**
- Projeto (obrigatório)
- Orçamento (obrigatório)
- Cronograma (obrigatório)

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Obra (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Obra (Pavimentação, Edificação, Saneamento, Drenagem, Ponte/Viaduto, Praça/Parque, Outro)
- **[string]** Endereço da Obra (mín. 10, máx. 300 caracteres)
- **[string/textarea]** Descrição da Obra (mín. 50, máx. 1000 caracteres)
- **[date]** Data de Início Prevista
- **[date]** Data de Término Prevista
- **[number]** Valor Orçado (R$, mínimo 0)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 8. Inspeção de Obra
**O que é:** Inspeção de andamento e verificação de conformidade de obras públicas.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Nome da Obra Inspecionada (máx. 200 caracteres)
- **[date]** Data da Inspeção
- **[integer]** Percentual Concluído (%, mínimo 0, máximo 100)
- **[select]** Situação da Obra (No Prazo, Atrasada, Paralisada, Concluída)
- **[string/textarea]** Relato da Inspeção (mín. 30, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 9. Alvará de Construção
**O que é:** Emissão de alvará de construção para início de obra aprovada.

**Documentos necessários:**
- Projeto Aprovado (obrigatório)
- ART (obrigatório)
- Taxas Pagas (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 10. Habite-se
**O que é:** Emissão de habite-se (autorização para uso e ocupação da obra).

**Documentos necessários:**
- Vistoria (obrigatório)
- Projeto (obrigatório)
- Certidões (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 15 dias úteis

---

### 11. Certidão de Numeração Predial
**O que é:** Emissão de certidão de numeração de imóvel.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Endereço (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 12. Laudo de Vistoria Técnica
**O que é:** Emissão de laudo técnico de vistoria de imóvel.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Endereço do Imóvel (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 20 dias úteis

---

### 13. Plano Diretor
**O que é:** Consulta ao plano diretor municipal e zoneamento.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 14. Acompanhamento de Obras
**O que é:** Consulta ao progresso e andamento de obras públicas no município.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 15. Mapa de Obras
**O que é:** Visualização geoespacial de todas as obras em execução no município.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 16. Certidão de Obra Pública
**O que é:** Certidão oficial comprovando realização de obra pública.

**Documentos necessários:**
- CNPJ/CPF (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 17. Declaração de Manutenção Realizada
**O que é:** Declaração comprovando manutenção realizada em via pública.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Endereço (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 18. Atestado de Vistoria de Obras
**O que é:** Atestado comprovando vistoria técnica realizada em obra.

**Documentos necessários:**
- CPF (obrigatório)
- Documentos do Imóvel (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 19. Guia de Ocupação de Via
**O que é:** Autorização para ocupação temporária de via pública.

**Documentos necessários:**
- CNPJ/CPF (obrigatório)
- Projeto (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 20. Consulta de Status de Obra
**O que é:** Consulta do andamento e status atual de obras públicas.

**Documentos necessários:**
- CPF (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 1 dia útil

---

### 21. Segunda Via de Documentos de Obras
**O que é:** Reemissão de documentos relacionados a obras públicas e privadas.

**Documentos necessários:**
- CPF (obrigatório)
- Protocolo Original (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

## Secretaria de Serviços Públicos

### 1. Solicitação de Coleta de Entulho
**O que é:** Pedido de retirada de resíduos de construção.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Tipo de entulho
- Volume estimado

**Prazo estimado:** 10 dias úteis

---

### 2. Solicitação de Coleta de Móveis Velhos
**O que é:** Pedido de retirada de móveis e objetos grandes.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Tipo de móveis
- Quantidade

**Prazo estimado:** 7 dias úteis

---

### 3. Denúncia de Lixo Acumulado
**O que é:** Registro de acúmulo irregular de resíduos.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Endereço
- Tipo de lixo
- Foto (opcional)

**Prazo estimado:** 3 dias úteis

---

### 4. Solicitação de Poda de Árvore em Via Pública
**O que é:** Pedido de corte de galhos em ruas e calçadas.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço da árvore
- Motivo
- Foto (opcional)

**Prazo estimado:** 15 dias úteis

---

### 5. Solicitação de Limpeza de Terreno Público
**O que é:** Pedido de limpeza de áreas municipais.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Endereço do terreno
- Estado atual

**Prazo estimado:** 15 dias úteis

---

### 6. Denúncia de Descarte Irregular
**O que é:** Registro de lixo jogado em local inadequado.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Local
- Tipo de resíduo
- Foto (opcional)

**Prazo estimado:** 3 dias úteis

---

### 7. Solicitação de Contentor de Lixo
**O que é:** Pedido de instalação de lixeira pública.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço proposto
- Justificativa

**Prazo estimado:** 20 dias úteis

---

### 8. Solicitação de Limpeza de Córrego
**O que é:** Pedido de desassoreamento de cursos d'água.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Localização
- Nível de obstrução
- Risco de enchente

**Prazo estimado:** 30 dias úteis

---

### 9. Denúncia de Falta de Coleta de Lixo
**O que é:** Registro de atraso ou falta na coleta de resíduos.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Endereço
- Dia habitual de coleta
- Dias sem coleta

**Prazo estimado:** 3 dias úteis

---

### 10. Solicitação de Dedetização
**O que é:** Pedido de controle de pragas em imóveis.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Tipo de praga
- Área afetada

**Prazo estimado:** 15 dias úteis

---

### 11. Solicitação de Limpeza de Feira
**O que é:** Pedido de limpeza especial após feiras e eventos.

**Documentos necessários:**
- CPF ou CNPJ (obrigatório)

**Campos do formulário:**
- Nome do organizador
- CPF/CNPJ
- Telefone
- E-mail
- Local do evento
- Data
- Tipo de resíduo

**Prazo estimado:** 5 dias úteis

---

### 12. Denúncia de Terreno Abandonado
**O que é:** Registro de terrenos sem manutenção.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Endereço do terreno
- Estado de conservação
- Foto (opcional)

**Prazo estimado:** 10 dias úteis

---

### 13. Solicitação de Limpeza de Cemitério
**O que é:** Pedido de manutenção em cemitérios municipais.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Cemitério
- Área específica
- Tipo de limpeza

**Prazo estimado:** 10 dias úteis

---

# Catálogo de Serviços Municipais - Secretaria de Serviços Públicos

## Secretaria de Serviços Públicos

### 1. Desobstrução de Bueiro
**O que é:** Solicitação de desobstrução de bueiro ou boca de lobo

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Obstrução (Boca de Lobo Entupida, Bueiro Obstruído, Grelha Danificada, Acúmulo de Lixo, Outro)
- **[string]** Local da Obstrução (máx. 300 caracteres)
- **[boolean]** Está causando alagamento? (padrão: Não)
- **[string/textarea]** Descrição do Problema (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 2. Solicitação de Poda de Árvore
**O que é:** Solicitação de poda de árvore em via pública

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Local da Árvore (máx. 300 caracteres)
- **[select]** Motivo da Poda (Galhos na Rede Elétrica, Risco de Queda, Obstrução de Visibilidade, Danificação de Calçada, Interferência em Iluminação, Outro)
- **[string/textarea]** Descrição da Situação (mín. 20, máx. 1000 caracteres)
- **[boolean]** Situação Urgente (risco iminente)? (padrão: Não)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 3. Gestão de Equipes de Serviços
**O que é:** Programação de equipes e rotas de trabalho

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Equipe (Limpeza Urbana, Coleta de Lixo, Poda de Árvores, Iluminação Pública, Capina, Desobstrução, Equipe Mista)
- **[string]** Número da Equipe (máx. 50 caracteres)
- **[date]** Data do Serviço
- **[string]** Horário de Início (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string]** Horário de Término (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string/textarea]** Rota de Trabalho (ruas/bairros) (mín. 10, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 4. Certidão de Execução de Serviço
**O que é:** Emissão de certidão comprovando execução de serviço público

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Número do Protocolo (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 5. Certidão de Limpeza Urbana
**O que é:** Emissão de certidão de regularidade de limpeza

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 6. Declaração de Manutenção de Via
**O que é:** Emissão de declaração de manutenção realizada em via pública

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Localização da Via (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 7. Atestado de Condições de Infraestrutura
**O que é:** Emissão de atestado das condições de infraestrutura urbana

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)
- Descrição da Área (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 8. Laudo de Vistoria de Iluminação Pública
**O que é:** Emissão de laudo técnico de vistoria de iluminação

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Localização dos Pontos (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 9. Autorização para Intervenção em Via Pública
**O que é:** Emissão de autorização para obras em vias públicas

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (obrigatório)
- Projeto de Intervenção (obrigatório)
- ART (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 15 dias úteis

---

### 10. Atendimentos - Serviços Públicos
**O que é:** Registro geral de atendimentos em serviços públicos

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Atendimento (Consulta, Solicitação, Reclamação, Informação, Outro)
- **[string]** Assunto (máx. 200 caracteres)
- **[string/textarea]** Descrição do Atendimento (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 11. Iluminação Pública (Poste Queimado)
**O que é:** Solicitação de reparo em iluminação pública

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Local do Poste (máx. 300 caracteres)
- **[select]** Tipo de Problema (Lâmpada Queimada, Poste Danificado, Fiação Exposta, Luminária Quebrada, Lâmpada Acesa Durante o Dia, Outro)
- **[string/textarea]** Descrição do Problema (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 12. Limpeza Urbana (Coleta de Lixo)
**O que é:** Agendamento de coleta e limpeza urbana

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Solicitação (Falta de Coleta, Limpeza de Logradouro, Remoção de Lixo Irregular, Melhoria no Serviço, Outro)
- **[string]** Local para Limpeza (máx. 300 caracteres)
- **[string/textarea]** Descrição da Solicitação (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 3 dias úteis

---

### 13. Coleta Especial (Entulho e Móveis)
**O que é:** Agendamento de coleta de entulho e móveis velhos

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Material (Entulho de Construção, Móveis Velhos, Eletrodomésticos, Galhos e Árvores, Outro)
- **[select]** Volume Estimado (Até 1m³, 1-3m³, 3-5m³, Mais de 5m³)
- **[string]** Endereço para Coleta (máx. 300 caracteres)
- **[string/textarea]** Descrição do Material (mín. 20, máx. 1000 caracteres)
- **[date]** Data Preferencial para Coleta
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 14. Solicitação de Capina
**O que é:** Solicitação de capina de terreno ou via pública

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Local (Terreno Baldio, Calçada, Via Pública, Praça, Outro)
- **[string]** Local para Capina (máx. 300 caracteres)
- **[select]** Área Estimada (Até 50m², 50-100m², 100-500m², Mais de 500m²)
- **[string/textarea]** Descrição da Situação (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 15. Solicitação de Desobstrução (Bueiro Entupido)
**O que é:** Solicitação de limpeza de boca de lobo e bueiro

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Obstrução (Boca de Lobo Entupida, Bueiro Obstruído, Grelha Danificada, Acúmulo de Lixo, Outro)
- **[string]** Local da Obstrução (máx. 300 caracteres)
- **[boolean]** Está causando alagamento? (padrão: Não)
- **[string/textarea]** Descrição do Problema (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 16. Registro de Problema com Foto (Funcionalidade Transversal)
**O que é:** Registro geolocalizado de problemas com foto

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

## Secretaria de Assistência Social

### 1. Cadastro no Bolsa Família
**O que é:** Inscrição em programa de transferência de renda.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Data de nascimento
- Telefone
- E-mail
- Endereço
- Renda familiar
- Composição familiar
- Crianças em idade escolar

**Prazo estimado:** 30 dias úteis

---

### 2. Solicitação de Cesta Básica
**O que é:** Pedido de auxílio alimentar emergencial.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Renda familiar
- Número de pessoas
- Situação emergencial

**Prazo estimado:** 7 dias úteis

---

### 3. Cadastro no CRAS
**O que é:** Registro no Centro de Referência de Assistência Social.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Data de nascimento
- Telefone
- E-mail
- Endereço
- Composição familiar
- Renda familiar
- Situação de vulnerabilidade

**Prazo estimado:** 10 dias úteis

---

### 4. Solicitação de Benefício Eventual
**O que é:** Pedido de auxílio para situações emergenciais.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante da Situação (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Tipo de benefício
- Descrição da situação
- Valor estimado

**Prazo estimado:** 15 dias úteis

---

### 5. Cadastro no BPC (Benefício de Prestação Continuada)
**O que é:** Inscrição para benefício a idosos e pessoas com deficiência.

**Documentos necessários:**
- CPF (obrigatório)
- Laudo Médico (obrigatório)
- Comprovante de Renda (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Data de nascimento
- Telefone
- E-mail
- Endereço
- Tipo de deficiência/idade
- Renda per capita

**Prazo estimado:** 45 dias úteis

---

### 6. Solicitação de Abrigo Temporário
**O que é:** Pedido de acolhimento institucional emergencial.

**Documentos necessários:**
- CPF (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Situação de rua
- Motivo
- Tempo estimado
- Pessoas acompanhantes

**Prazo estimado:** 3 dias úteis

---

### 7. Cadastro em Curso Profissionalizante
**O que é:** Inscrição em programas de capacitação profissional.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Escolaridade (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Data de nascimento
- Telefone
- E-mail
- Endereço
- Escolaridade
- Curso de interesse
- Disponibilidade

**Prazo estimado:** 15 dias úteis

---

### 8. Denúncia de Trabalho Infantil
**O que é:** Registro de exploração de menores.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Local
- Idade estimada da criança
- Tipo de trabalho
- Horário

**Prazo estimado:** 1 dia útil

---

### 9. Solicitação de Atendimento Psicológico
**O que é:** Pedido de acompanhamento psicológico gratuito.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Queixa principal
- Histórico
- Urgência

**Prazo estimado:** 20 dias úteis

---

### 10. Cadastro no Programa Primeira Infância
**O que é:** Inscrição em programas para crianças de 0 a 6 anos.

**Documentos necessários:**
- CPF dos Pais (obrigatório)
- Certidão de Nascimento (obrigatório)

**Campos do formulário:**
- Nome da criança
- CPF da criança
- Nome dos pais
- CPF dos pais
- Telefone
- E-mail
- Endereço
- Idade da criança

**Prazo estimado:** 15 dias úteis

---

---

**Total de Serviços Catalogados:** 195 serviços municipais

**Distribuição por Secretaria:**
- Agricultura: 18 serviços
- Cultura: 16 serviços
- Segurança Pública: 17 serviços
- Planejamento Urbano: 17 serviços
- Educação: 17 serviços
- Saúde: 17 serviços
- Habitação: 15 serviços
- Esportes: 17 serviços
- Turismo: 15 serviços
- Meio Ambiente: 17 serviços
- Obras Públicas: 15 serviços
- Serviços Públicos: 13 serviços
- Assistência Social: 10 serviços
