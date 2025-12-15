# Catálogo de Serviços Municipais - Parte 2

## Secretaria de Planejamento Urbano

### 1. Plano Diretor
**O que é:** Consulta e informações sobre o Plano Diretor Municipal, documento que estabelece as diretrizes para o desenvolvimento urbano.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 2. Zoneamento Urbano
**O que é:** Consulta de zoneamento e uso do solo do município.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 3. Certidão de Zoneamento
**O que é:** Emissão de certidão de zoneamento de imóvel.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel ou Endereço Completo (obrigatório)

**Prazo estimado:** 7 dias úteis

---

### 4. Certidão de Uso do Solo
**O que é:** Certidão de uso e ocupação do solo para fins diversos.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel (obrigatório)

**Prazo estimado:** 7 dias úteis

---

### 5. Declaração de Conformidade Urbanística
**O que é:** Declaração de que o imóvel está em conformidade com as normas urbanísticas.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (se empresa, opcional)
- Matrícula do Imóvel (obrigatório)
- Projeto Aprovado (obrigatório)

**Prazo estimado:** 10 dias úteis

---

### 6. Laudo de Vistoria Urbanística
**O que é:** Laudo técnico de vistoria urbanística de imóvel.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel (obrigatório)
- Comprovante de Propriedade (obrigatório)

**Prazo estimado:** 15 dias úteis

---

### 7. Autorização de Parcelamento do Solo
**O que é:** Autorização para parcelamento de terreno em lotes.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- CNPJ (se empresa, opcional)
- Matrícula do Imóvel (obrigatório)
- Projeto de Parcelamento (obrigatório)
- ART do Responsável Técnico (obrigatório)

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
- **[text]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Solicitante (Pessoa Física, Pessoa Jurídica)
- **[text]** CNPJ (se pessoa jurídica, 14 dígitos, padrão: ^\d{14}$, opcional)
- **[text]** Razão Social (se pessoa jurídica, mín. 3, máx. 200 caracteres, opcional)
- **[text]** Matrícula do Imóvel (mín. 3, máx. 50 caracteres)
- **[text]** Endereço Completo do Imóvel (mín. 10, máx. 300 caracteres)
- **[number]** Área Total do Terreno (m²) (mínimo 1)
- **[select]** Tipo de Parcelamento (Loteamento, Desmembramento, Remembramento)
- **[number]** Número de Lotes Previsto (mínimo 1)
- **[text]** Nome do Responsável Técnico (mín. 3, máx. 200 caracteres)
- **[text]** CREA do Responsável Técnico (máx. 20 caracteres)
- **[text]** Número da ART (máx. 50 caracteres)
- **[textarea]** Descrição do Projeto (mín. 50, máx. 2000 caracteres)
- **[textarea]** Observações (máx. 1000 caracteres, opcional)

**Prazo estimado:** 30 dias úteis

---

### 8. Consulta de Viabilidade Urbanística
**O que é:** Consulta de viabilidade para empreendimentos imobiliários.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel (obrigatório)
- Memorial Descritivo (obrigatório)

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
- **[text]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Tipo de Empreendimento (Residencial, Comercial, Industrial, Misto, Institucional)
- **[text]** Matrícula do Imóvel (mín. 3, máx. 50 caracteres)
- **[text]** Endereço do Imóvel (mín. 10, máx. 300 caracteres)
- **[number]** Área do Terreno (m²) (mínimo 1)
- **[number]** Área a Construir (m²) (mínimo 1)
- **[textarea]** Descrição do Empreendimento (mín. 20, máx. 1000 caracteres)
- **[textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 9. Mapa de Zoneamento
**O que é:** Consulta ao mapa de zoneamento urbano do município.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 10. Atendimentos - Planejamento Urbano
**O que é:** Registro geral de atendimentos em planejamento urbano.

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
- **[select]** Tipo de Atendimento (Consulta, Informação, Solicitação, Reclamação, Outro)
- **[string]** Assunto (máx. 200 caracteres)
- **[string]** Descrição do Atendimento (mín. 20, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 11. Aprovação de Projeto Arquitetônico
**O que é:** Aprovação de projetos de construção e reforma.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto Arquitetônico (obrigatório)
- ART (obrigatório)
- Documentação do Imóvel (obrigatório)

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
- **[string]** Endereço Completo da Obra (máx. 300 caracteres)
- **[select]** Tipo de Projeto (Construção Nova, Reforma, Ampliação, Regularização, Demolição)
- **[number]** Área do Terreno (m²) (mínimo 1)
- **[number]** Área a Construir (m²) (mínimo 1)
- **[string]** Número da Matrícula do Imóvel (máx. 50 caracteres)
- **[string]** Nome do Responsável Técnico (máx. 200 caracteres)
- **[string]** CREA do Responsável Técnico (máx. 50 caracteres)
- **[string]** Número da ART (máx. 50 caracteres)
- **[string]** Descrição do Projeto (mín. 50, máx. 1000 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 30 dias úteis

---

### 12. Alvará de Construção
**O que é:** Solicitação de licença para construção.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto Aprovado (obrigatório)
- Matrícula do Imóvel (obrigatório)
- ART (obrigatório)

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
- **[string]** Endereço Completo da Obra (máx. 300 caracteres)
- **[string]** Número da Matrícula do Imóvel (máx. 50 caracteres)
- **[string]** Número do Projeto Aprovado (máx. 50 caracteres)
- **[date]** Data de Aprovação do Projeto
- **[number]** Área Total da Construção (m²) (mínimo 1)
- **[integer]** Número de Pavimentos (mínimo 1, máximo 50)
- **[string]** Nome do Responsável pela Obra (máx. 200 caracteres)
- **[string]** CREA do Responsável (máx. 50 caracteres)
- **[string]** Número da ART de Execução (máx. 50 caracteres)
- **[integer]** Prazo Estimado da Obra (meses) (mínimo 1, máximo 120, opcional)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 20 dias úteis

---

### 13. Alvará de Funcionamento
**O que é:** Licença comercial para estabelecimentos.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- CNPJ (obrigatório)
- Contrato Social (obrigatório)
- Laudo Técnico (obrigatório)
- Comprovante de Endereço (obrigatório)

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
- **[string]** Razão Social da Empresa (máx. 200 caracteres)
- **[string]** Nome Fantasia (máx. 200 caracteres)
- **[string]** CNPJ (padrão: ^\d{14}$, 14 caracteres)
- **[string]** Inscrição Estadual (máx. 50 caracteres, opcional)
- **[string]** Endereço Completo do Estabelecimento (máx. 300 caracteres)
- **[number]** Área do Estabelecimento (m²) (mínimo 1)
- **[string]** Ramo de Atividade (máx. 200 caracteres)
- **[integer]** Número de Funcionários (mínimo 0)
- **[string]** Horário de Funcionamento (máx. 100 caracteres)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 14. Solicitação de Certidão Municipal
**O que é:** Emissão de certidões municipais diversas.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- RG (obrigatório)
- CPF (obrigatório)
- Documentação do Imóvel (obrigatório)

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
- **[select]** Tipo de Certidão (Certidão de Uso do Solo, Certidão de Valor Venal, Certidão de Zoneamento, Certidão Negativa de Débitos, Certidão de Regularidade de Obra, Outra)
- **[string]** Finalidade da Certidão (máx. 200 caracteres)
- **[string]** Endereço do Imóvel (se aplicável) (máx. 300 caracteres, opcional)
- **[string]** Inscrição Imobiliária (máx. 50 caracteres, opcional)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 15. Denúncia de Construção Irregular
**O que é:** Registro de denúncias de obras irregulares.

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
- **[string]** Endereço da Obra Irregular (máx. 300 caracteres)
- **[select]** Tipo de Irregularidade (Construção sem Licença, Ampliação Irregular, Obra em Área de Preservação, Desrespeito ao Projeto Aprovado, Invasão de Via Pública, Outra)
- **[string]** Descrição Detalhada da Denúncia (mín. 30, máx. 1000 caracteres)
- **[boolean]** Deseja fazer a denúncia de forma anônima?
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 16. Cadastro de Loteamento
**O que é:** Registro e aprovação de loteamentos.

**Tipo de Serviço:** COM_DADOS (Serviço com formulário)

**Documentos necessários:**
- Projeto de Loteamento (obrigatório)
- Matrícula (obrigatório)
- Estudos Técnicos (obrigatório)
- ART (obrigatório)

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
- **[string]** Nome do Loteamento (máx. 200 caracteres)
- **[string]** Endereço da Gleba (máx. 300 caracteres)
- **[number]** Área Total da Gleba (m²) (mínimo 1000)
- **[integer]** Número de Lotes (mínimo 1)
- **[number]** Área Padrão dos Lotes (m²) (mínimo 1)
- **[string]** Número da Matrícula da Gleba (máx. 50 caracteres)
- **[string]** Nome do Responsável Técnico (máx. 200 caracteres)
- **[string]** CREA do Responsável (máx. 50 caracteres)
- **[string]** Número da ART (máx. 50 caracteres)
- **[string]** Infraestrutura Prevista (máx. 500 caracteres, opcional)
- **[string]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 90 dias úteis

---

### 17. Consultas Públicas (Plano Diretor)
**O que é:** Participação em audiências e consultas públicas sobre o Plano Diretor.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 18. Mapa Urbano (Zoneamento)
**O que é:** Consulta ao mapa de zoneamento e uso do solo.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas de consulta)

**Documentos necessários:**
- Nenhum documento necessário

**Prazo estimado:** Imediato (consulta informativa)

---

### 19. Certidão de Viabilidade de Construção
**O que é:** Emissão de certidão atestando viabilidade de construção.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula do Imóvel (obrigatório)
- Planta de Situação (obrigatório)

**Prazo estimado:** 10 dias úteis

---

### 20. Atestado de Regularidade de Obra
**O que é:** Emissão de atestado confirmando regularidade da obra.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Alvará de Construção (obrigatório)
- ART (obrigatório)

**Prazo estimado:** 15 dias úteis

---

### 21. Laudo de Vistoria Técnica
**O que é:** Emissão de laudo técnico de vistoria de imóvel.

**Tipo de Serviço:** SEM_DADOS (Serviço apenas documental)

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Propriedade (obrigatório)
- ART do Responsável (obrigatório)

**Prazo estimado:** 15 dias úteis

---
# Catálogo de Serviços Municipais - Secretaria de Educação

## Secretaria de Educação

### 1. Matrícula Escolar
**O que é:** Solicitação de matrícula em escolas municipais.

**Documentos necessários:**
- Certidão de Nascimento (obrigatório)
- Comprovante de Residência (obrigatório)
- Cartão de Vacina (obrigatório)

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
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[date]** Data de Nascimento do Aluno
- **[select]** Sexo do Aluno (Masculino, Feminino, Outro)
- **[string]** Nome Completo do Responsável (mín. 3, máx. 200 caracteres)
- **[string]** CPF do Responsável (formato: 11 dígitos numéricos)
- **[select]** Grau de Parentesco (Pai, Mãe, Avô/Avó, Tio(a), Irmão(ã), Outro)
- **[select]** Escola Preferencial
- **[select]** Ano Escolar (Educação Infantil (0-3 anos), Pré-Escola (4-5 anos), 1º ao 9º Ano, EJA)
- **[select]** Turno Preferencial (Manhã, Tarde, Integral, Qualquer)
- **[boolean]** Possui Necessidades Especiais? (padrão: Não)
- **[string/textarea]** Descrição das Necessidades Especiais (máx. 500 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 2. Transferência Escolar
**O que é:** Solicitação de transferência entre escolas municipais.

**Documentos necessários:**
- Histórico Escolar (obrigatório)
- Comprovante de Residência (obrigatório)
- Declaração de Transferência (obrigatório)

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
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[select]** Escola de Origem
- **[select]** Escola de Destino
- **[select]** Ano Escolar Atual (1º ao 9º Ano)
- **[select]** Motivo da Transferência (Mudança de Endereço, Preferência de Turno, Melhor Infraestrutura, Proximidade com Trabalho, Outro)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 3. Solicitação de Transporte Escolar
**O que é:** Cadastro para uso do transporte escolar.

**Documentos necessários:**
- Comprovante de Matrícula (obrigatório)
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
- **[string]** Nome do Aluno (mín. 3, máx. 200 caracteres)
- **[select]** Escola
- **[string]** Endereço de Coleta (mín. 10, máx. 300 caracteres)
- **[string]** Horário de Coleta (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[boolean]** Necessita Veículo Adaptado? (padrão: Não)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 4. Inscrição em Cursos Livres
**O que é:** Inscrição em cursos de capacitação oferecidos pela secretaria.

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
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[select]** Curso de Interesse (Informática Básica, Inglês, Artesanato, Culinária, Dança, Música, Teatro, Outro)
- **[select]** Nível de Escolaridade (Fundamental Incompleto, Fundamental Completo, Médio Incompleto, Médio Completo, Superior Incompleto, Superior Completo)
- **[select]** Turno Preferencial (Manhã, Tarde, Noite, Qualquer)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 3 dias úteis

---

### 5. Cadastro de Professores
**O que é:** Cadastro de professores para banco de talentos.

**Documentos necessários:**
- Diploma (obrigatório)
- Currículo (obrigatório)
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
- **[string]** Formação Acadêmica (mín. 3, máx. 200 caracteres)
- **[string]** Disciplinas que Leciona (máx. 300 caracteres)
- **[string/textarea]** Experiência Profissional (máx. 1000 caracteres)
- **[string]** Disponibilidade de Horário (máx. 200 caracteres)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 15 dias úteis

---

### 6. Atendimentos - Educação
**O que é:** Registro geral de atendimentos na área educacional.

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
- **[select]** Tipo de Atendimento (Matrícula, Transferência, Documentação, Transporte Escolar, Reunião Pedagógica, Reclamação, Solicitação, Outro)
- **[string]** Assunto do Atendimento (mín. 5, máx. 200 caracteres)
- **[string/textarea]** Descrição Detalhada (mín. 10, máx. 2000 caracteres)
- **[string]** Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[date]** Data do Atendimento
- **[string]** Horário do Atendimento (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string]** Servidor Responsável (mín. 3, máx. 200 caracteres)
- **[select]** Setor (Secretaria Escolar, Direção, Coordenação Pedagógica, Transporte, Merenda, Outro)
- **[select]** Prioridade (BAIXA, NORMAL, ALTA, URGENTE, padrão: NORMAL)
- **[boolean]** Atendimento Resolvido? (padrão: Não)
- **[date]** Data da Resolução (se resolvido, opcional)
- **[string/textarea]** Observações e Encaminhamentos (máx. 1000 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 7. Matrícula de Aluno
**O que é:** Matrícula e rematrícula de alunos na rede municipal.

**Documentos necessários:**
- Certidão de Nascimento (obrigatório)
- RG do Responsável (obrigatório)
- Comprovante de Endereço (obrigatório)
- Cartão de Vacina (obrigatório)

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
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[date]** Data de Nascimento do Aluno
- **[string]** CPF do Aluno (se possuir, formato: 11 dígitos)
- **[string]** RG do Aluno (se possuir, máx. 20 caracteres)
- **[string]** Número da Certidão de Nascimento (máx. 50 caracteres)
- **[string]** Nome da Mãe do Aluno (mín. 3, máx. 200 caracteres)
- **[string]** Nome do Pai do Aluno (máx. 200 caracteres, opcional)
- **[select]** Sexo do Aluno (Masculino, Feminino)
- **[select]** Raça/Cor (Branca, Preta, Parda, Amarela, Indígena, Não declarada)
- **[select]** Grau de Parentesco com o Aluno (Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã) maior, Tutor Legal, Outro)
- **[boolean]** Possui Guarda Judicial? (padrão: Não)
- **[string]** Unidade Escolar Desejada (mín. 3, máx. 200 caracteres)
- **[select]** Nível de Ensino (Creche (0-3 anos), Pré-escola (4-5 anos), Fundamental I (1º ao 5º ano), Fundamental II (6º ao 9º ano), EJA)
- **[string]** Ano/Série Desejado (máx. 50 caracteres)
- **[select]** Turno Desejado (Matutino, Vespertino, Integral, Noturno)
- **[select]** Tipo de Matrícula (Matrícula Nova, Rematrícula, Transferência de outra escola)
- **[string]** Escola de Origem (se transferência, máx. 200 caracteres)
- **[boolean]** Possui Necessidades Especiais? (padrão: Não)
- **[select]** Tipo de Necessidade (Deficiência Física, Deficiência Visual, Deficiência Auditiva, Deficiência Intelectual, TEA (Autismo), TDAH, Altas Habilidades, Outra)
- **[string/textarea]** Descrição Detalhada das Necessidades (máx. 500 caracteres, opcional)
- **[boolean]** Necessita Acompanhante em Sala? (padrão: Não)
- **[boolean]** Possui Laudo Médico? (padrão: Não)
- **[string]** Alergias (alimentares, medicamentos, máx. 300 caracteres, opcional)
- **[string]** Medicamentos de Uso Contínuo (máx. 300 caracteres, opcional)
- **[boolean]** Família participa do Bolsa Família? (padrão: Não)
- **[string]** NIS do Bolsa Família (máx. 20 caracteres, opcional)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 8. Transporte Escolar
**O que é:** Solicitação de vaga em transporte escolar.

**Documentos necessários:**
- Comprovante de Matrícula (obrigatório)
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
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[date]** Data de Nascimento do Aluno
- **[string]** CPF do Aluno (se possuir, formato: 11 dígitos)
- **[string]** Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[string]** Série/Ano (máx. 50 caracteres)
- **[select]** Turno (Matutino, Vespertino, Integral, Noturno)
- **[string]** Número da Matrícula (máx. 50 caracteres)
- **[string]** Endereço Completo de Embarque (mín. 10, máx. 300 caracteres)
- **[string]** Ponto de Referência para Embarque (mín. 5, máx. 200 caracteres)
- **[number]** Distância até a Escola (km, mínimo 0, máximo 100)
- **[select]** Zona de Residência (Urbana, Rural)
- **[boolean]** Aluno Possui Necessidades Especiais? (padrão: Não)
- **[select]** Tipo de Necessidade (Cadeirante, Deficiência Visual, Deficiência Auditiva, Mobilidade Reduzida, TEA (Autismo), Outra)
- **[boolean]** Necessita Monitor no Transporte? (padrão: Não)
- **[string/textarea]** Motivo/Descrição da Necessidade de Monitor (máx. 500 caracteres, opcional)
- **[boolean]** Necessita Transporte Adaptado (Cadeira de Rodas)? (padrão: Não)
- **[string]** Horário de Entrada na Escola (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string]** Horário de Saída da Escola (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[boolean]** Necessita Transporte Ida? (padrão: Sim)
- **[boolean]** Necessita Transporte Volta? (padrão: Sim)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 9. Registro de Ocorrência Escolar
**O que é:** Registro de ocorrências disciplinares e comportamentais.

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
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[date]** Data de Nascimento do Aluno
- **[string]** CPF do Aluno (se possuir, formato: 11 dígitos)
- **[string]** Número da Matrícula (máx. 50 caracteres)
- **[string]** Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[string]** Série/Ano (máx. 50 caracteres)
- **[string]** Turma (máx. 50 caracteres)
- **[select]** Turno (Matutino, Vespertino, Integral, Noturno)
- **[select]** Tipo de Ocorrência (Disciplinar, Comportamental, Falta, Violência, Bullying, Danos ao Patrimônio, Outro)
- **[date]** Data da Ocorrência
- **[string]** Hora da Ocorrência (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$)
- **[string]** Local da Ocorrência (mín. 3, máx. 200 caracteres)
- **[string/textarea]** Descrição Detalhada da Ocorrência (mín. 20, máx. 2000 caracteres)
- **[select]** Gravidade da Ocorrência (LEVE, MODERADA, GRAVE, GRAVISSIMA)
- **[string]** Professor/Servidor Relator (mín. 3, máx. 200 caracteres)
- **[string]** Testemunhas (nomes, máx. 500 caracteres, opcional)
- **[string]** Medida Disciplinar Tomada (máx. 500 caracteres, opcional)
- **[boolean]** Responsável Foi Notificado? (padrão: Não)
- **[date]** Data da Notificação ao Responsável (opcional)
- **[select]** Meio de Notificação (Telefone, E-mail, Presencial, Carta, Outro)
- **[boolean]** Encaminhado para Psicólogo Escolar? (padrão: Não)
- **[boolean]** Encaminhado ao Conselho Tutelar? (padrão: Não)
- **[boolean]** Houve Acionamento Policial? (padrão: Não)
- **[string]** Número do Boletim de Ocorrência (se houver, máx. 50 caracteres)
- **[string/textarea]** Observações Gerais (máx. 1000 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 10. Solicitação de Documento Escolar
**O que é:** Solicitação de histórico, declaração ou certificado.

**Documentos necessários:**
- RG (obrigatório)
- Comprovante de Matrícula (obrigatório)

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
- **[select]** Vínculo com o Aluno (Próprio Aluno (maior de idade), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã) maior, Tutor Legal, Procurador, Outro)
- **[boolean]** Possui Procuração? (se não for responsável direto, padrão: Não)
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[string]** CPF do Aluno (se possuir, formato: 11 dígitos)
- **[date]** Data de Nascimento do Aluno
- **[string]** Número da Matrícula (máx. 50 caracteres)
- **[string]** Unidade Escolar onde estudou/estuda (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Documento (Histórico Escolar, Declaração de Matrícula, Declaração de Conclusão, Certificado de Conclusão, Boletim Escolar, Declaração de Frequência, Transferência, Outro)
- **[string]** Especifique o Tipo de Documento (se Outro, máx. 200 caracteres)
- **[string]** Ano Letivo (formato: AAAA)
- **[string]** Série/Ano de Referência (máx. 50 caracteres)
- **[string]** Período de Referência (se aplicável, máx. 100 caracteres)
- **[string]** Finalidade do Documento (mín. 10, máx. 300 caracteres)
- **[string]** Instituição de Destino (se aplicável, máx. 200 caracteres)
- **[boolean]** Solicitação Urgente? (padrão: Não)
- **[string]** Motivo da Urgência (se urgente, máx. 300 caracteres)
- **[select]** Forma de Entrega Desejada (Retirada Presencial, Correios (sedex), E-mail (se permitido), Outra)
- **[string]** Endereço para Entrega (se diferente do cadastro, máx. 300 caracteres)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 11. Consulta de Frequência
**O que é:** Consulta ao registro de frequência do aluno.

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
- **[select]** Vínculo com o Aluno (Próprio Aluno (maior), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã), Tutor Legal, Outro)
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[string]** Número da Matrícula (mín. 5, máx. 50 caracteres)
- **[string]** Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[string]** Série/Ano (máx. 50 caracteres)
- **[string]** Turma (máx. 50 caracteres)
- **[select]** Período da Consulta (BIMESTRE_1, BIMESTRE_2, BIMESTRE_3, BIMESTRE_4, ANO_COMPLETO)
- **[string]** Ano Letivo (formato: AAAA)

**Prazo estimado:** 1 dia útil

---

### 12. Consulta de Notas e Boletim
**O que é:** Consulta de notas e desempenho escolar.

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
- **[select]** Vínculo com o Aluno (Próprio Aluno (maior), Pai, Mãe, Avô/Avó, Tio/Tia, Irmão(ã), Tutor Legal, Outro)
- **[string]** Nome Completo do Aluno (mín. 3, máx. 200 caracteres)
- **[string]** Número da Matrícula (mín. 5, máx. 50 caracteres)
- **[string]** Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[string]** Série/Ano (máx. 50 caracteres)
- **[string]** Turma (máx. 50 caracteres)
- **[select]** Período da Consulta (BIMESTRE_1, BIMESTRE_2, BIMESTRE_3, BIMESTRE_4, ANO_COMPLETO)
- **[string]** Ano Letivo (formato: AAAA)
- **[string]** Disciplina Específica (máx. 100 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 13. Relatórios de Frequência
**O que é:** Consulta de frequência escolar.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 14. Calendário Escolar
**O que é:** Visualização do calendário letivo.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 15. Certidão de Conclusão
**O que é:** Emissão de certidão de conclusão de curso.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Histórico Escolar (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 16. Declaração de Matrícula
**O que é:** Emissão de declaração de matrícula.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Nome do Aluno (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 17. Atestado de Frequência
**O que é:** Emissão de atestado de frequência escolar.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Nome do Aluno (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 18. Histórico Escolar
**O que é:** Emissão de histórico escolar completo do aluno.

**Documentos necessários:**
- RG do Responsável (obrigatório)
- RG do Aluno (se possuir, obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 19. Declaração de Conclusão
**O que é:** Emissão de declaração de conclusão de série ou nível de ensino.

**Documentos necessários:**
- RG do Responsável (obrigatório)
- Comprovante de Conclusão (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 20. Segunda Via de Documentos Escolares
**O que é:** Emissão de segunda via de boletim, certificado ou outros documentos.

**Documentos necessários:**
- RG do Responsável (obrigatório)
- Boletim de Ocorrência (se perda/roubo, obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 21. Certidão de Escolaridade
**O que é:** Emissão de certidão comprovando nível de escolaridade do aluno.

**Documentos necessários:**
- RG do Responsável (obrigatório)
- RG do Aluno (se possuir, obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 22. Gestão Escolar
**O que é:** Administração de unidades escolares.

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
- **[string]** Nome da Unidade Escolar (mín. 3, máx. 200 caracteres)
- **[string]** Código INEP da Escola (máx. 50 caracteres)
- **[string]** Endereço da Escola (máx. 300 caracteres)
- **[select]** Tipo de Gestão (Administração Geral, Gestão Pedagógica, Gestão de Recursos Humanos, Gestão Financeira, Infraestrutura, Outro)
- **[number]** Número de Alunos (mínimo 0)
- **[number]** Número de Turmas (mínimo 0)
- **[number]** Número de Professores (mínimo 0)
- **[string/textarea]** Observações (máx. 1000 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 23. Gestão de Merenda Escolar
**O que é:** Controle de cardápios e estoque de merenda.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[select]** Escola
- **[date]** Data do Cardápio
- **[string/textarea]** Cardápio do Dia (mín. 10, máx. 1000 caracteres)
- **[number]** Quantidade de Alunos Atendidos (mínimo 1)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

# Catálogo de Serviços Municipais - Secretaria de Saúde

## Secretaria de Saúde

### 1. Atendimentos - Saúde
**O que é:** Registro geral de atendimentos na área da saúde.

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[select]** Tipo Sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-, Não sei, opcional)
- **[select]** Tipo de Atendimento (Consulta, Emergência, Retorno, Preventivo, Vacinação, Exame)
- **[select]** Unidade de Saúde (valor do enum: MS_UNIDADES_SAUDE)
- **[date]** Data do Atendimento
- **[string]** Hora do Atendimento (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$, opcional)
- **[select]** Profissional Responsável (valor do enum: MS_PROFISSIONAIS_SAUDE, opcional)
- **[string]** CNS do Profissional (máx. 20 caracteres, opcional)
- **[string]** Especialidade (máx. 100 caracteres, opcional)
- **[string/textarea]** Descrição/Queixa Principal (mín. 10, máx. 2000 caracteres)
- **[string/textarea]** Diagnóstico/CID (máx. 500 caracteres, opcional)
- **[string/textarea]** Procedimentos Realizados (máx. 1000 caracteres, opcional)
- **[string/textarea]** Prescrições/Orientações Médicas (máx. 1000 caracteres, opcional)
- **[select]** Prioridade (BAIXA, NORMAL, ALTA, URGENTE, padrão: NORMAL, opcional)
- **[boolean]** Houve Encaminhamento? (padrão: Não, opcional)
- **[string]** Especialidade do Encaminhamento (máx. 200 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 2. Agendamento de Consulta Médica
**O que é:** Agende consultas médicas nas unidades de saúde.

**Documentos necessários:**
- Cartão SUS (obrigatório)
- Documento de Identidade (obrigatório)

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

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Ponto de Referência (máx. 200 caracteres, opcional)
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string/textarea]** Alergias a Medicamentos (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[boolean]** Possui Convênio Particular? (padrão: Não, opcional)
- **[string]** Nome do Convênio (máx. 100 caracteres, opcional)
- **[select]** Especialidade (Clínico Geral, Pediatria, Ginecologia, Cardiologia, Ortopedia, Dermatologia, Oftalmologia, Odontologia, Psicologia, Nutrição)
- **[select]** Unidade de Saúde Preferencial (valor do enum: MS_UNIDADES_SAUDE)
- **[date]** Data Preferencial (opcional)
- **[select]** Turno Preferencial (Manhã, Tarde, Qualquer, opcional)
- **[string/textarea]** Motivo da Consulta (mín. 10, máx. 500 caracteres)
- **[boolean]** Primeira Consulta na Especialidade? (padrão: Não, opcional)
- **[boolean]** Caso Urgente? (padrão: Não, opcional)
- **[string/textarea]** Justificativa da Urgência (mín. 20, máx. 500 caracteres, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** 7 dias úteis

---

### 3. Controle de Medicamentos
**O que é:** Solicitação e controle de medicamentos da farmácia básica.

**Documentos necessários:**
- Receita Médica (obrigatório)
- Cartão SUS (obrigatório)

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string/textarea]** Alergias a Medicamentos (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[boolean]** Possui Dificuldade de Locomoção? (padrão: Não, opcional)
- **[string]** Número da Receita (mín. 5, máx. 50 caracteres)
- **[date]** Data da Receita
- **[string]** Nome do Médico (mín. 3, máx. 200 caracteres)
- **[string]** CRM do Médico (padrão: ^\d{4,8}$)
- **[string]** Especialidade do Médico (máx. 100 caracteres, opcional)
- **[array]** Medicamentos Solicitados (objeto com propriedades: dosagem [string], quantidade [number], posologia [string], duração [string], viaAdministracao [enum], mínimo 1 item)
- **[boolean]** Uso Contínuo (mais de 3 meses)? (padrão: Não, opcional)
- **[string]** Unidade de Retirada Preferencial (mín. 3, máx. 200 caracteres)
- **[select]** Horário Preferencial (Manhã (08:00-12:00), Tarde (13:00-17:00), Qualquer, opcional)
- **[boolean]** Solicita Entrega Domiciliar? (padrão: Não, opcional)
- **[string/textarea]** Justificativa para Entrega Domiciliar (máx. 500 caracteres, opcional)
- **[boolean]** Autoriza Familiar a Retirar? (padrão: Não, opcional)
- **[string]** Nome do Familiar Autorizado (mín. 3, máx. 200 caracteres, opcional)
- **[string]** CPF do Familiar Autorizado (mín. 11, máx. 11 caracteres, padrão: ^\d{11}$, opcional)
- **[select]** Grau de Parentesco (Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Neto(a), Outro, opcional)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 2 dias úteis

---

### 4. Campanhas de Vacinação
**O que é:** Registro de participação em campanhas de vacinação.

**Documentos necessários:**
- Cartão de Vacina (obrigatório)
- Documento de Identidade (obrigatório)

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[boolean]** Possui Cartão de Vacina? (padrão: Não, opcional)
- **[string]** Número do Cartão de Vacina (máx. 50 caracteres, opcional)
- **[string/textarea]** Alergias a Medicamentos/Vacinas (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[select]** Tipo de Campanha/Vacina (Gripe, COVID-19, Sarampo, Pólio, Multivacinação, HPV, Meningite, Febre Amarela, Hepatite, Tétano, Pneumonia, Outras)
- **[select]** Grupo de Risco (Criança (0-11 anos), Adolescente (12-18 anos), Adulto (19-59 anos), Idoso (60+ anos), Gestante, Puérpera, Profissional de Saúde, Professor, Portador de Comorbidade, Não se aplica)
- **[boolean]** É Gestante? (padrão: Não, opcional)
- **[number]** Semanas de Gestação (mínimo 1, máximo 42, opcional)
- **[boolean]** Possui Comorbidade? (padrão: Não, opcional)
- **[string/textarea]** Descrição da Comorbidade (máx. 500 caracteres, opcional)
- **[string]** Unidade de Saúde Preferencial (mín. 3, máx. 200 caracteres)
- **[date]** Data Preferencial (opcional)
- **[select]** Turno Preferencial (Manhã, Tarde, Qualquer, opcional)
- **[boolean]** Possui Dificuldade de Locomoção? (padrão: Não, opcional)
- **[boolean]** Solicita Vacinação Domiciliar? (padrão: Não, opcional)
- **[string/textarea]** Justificativa para Vacinação Domiciliar (máx. 500 caracteres, opcional)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 5. Programas de Saúde
**O que é:** Inscrição em programas de saúde (hipertensão, diabetes, etc).

**Documentos necessários:**
- Laudo Médico (obrigatório)
- Cartão SUS (obrigatório)

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string/textarea]** Alergias a Medicamentos (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[number]** Peso (kg) (mínimo 1, máximo 300, opcional)
- **[number]** Altura (cm) (mínimo 40, máximo 250, opcional)
- **[select]** Tipo de Programa (Hipertensão, Diabetes, Gestante, Saúde Mental, Idoso, Pré-Natal, Criança Saudável, Obesidade, Tabagismo, Alcoolismo, Hanseníase, Tuberculose, Outro)
- **[string/textarea]** Motivo da Inscrição no Programa (mín. 10, máx. 500 caracteres)
- **[string/textarea]** Diagnóstico Principal (CID-10) (mín. 3, máx. 500 caracteres)
- **[boolean]** Possui Diagnóstico Médico Formal? (padrão: Não, opcional)
- **[string/textarea]** Comorbidades (outras doenças) (máx. 500 caracteres, opcional)
- **[string]** Nome do Médico Responsável (mín. 3, máx. 200 caracteres)
- **[string]** CRM do Médico (padrão: ^\d{4,8}$)
- **[string]** Especialidade do Médico (máx. 100 caracteres, opcional)
- **[date]** Data da Última Consulta (opcional)
- **[date]** Data de Início no Programa
- **[string]** Unidade de Saúde para Acompanhamento (mín. 3, máx. 200 caracteres)
- **[select]** Frequência de Consultas (Semanal, Quinzenal, Mensal, Bimestral, Trimestral, Semestral)
- **[select]** Horário Preferencial (Manhã, Tarde, Qualquer, opcional)
- **[boolean]** Necessita Acompanhante? (padrão: Não, opcional)
- **[boolean]** Faz Uso de Medicamento Contínuo? (padrão: Não, opcional)
- **[string/textarea]** Medicamentos em Uso Contínuo (máx. 1000 caracteres, opcional)
- **[boolean]** Possui Dificuldade em Obter Medicamento? (padrão: Não, opcional)
- **[boolean]** Retirará Medicamentos na Farmácia Básica? (padrão: Não, opcional)
- **[string/textarea]** Observações Gerais (máx. 1000 caracteres, opcional)

**Prazo estimado:** 5 dias úteis

---

### 6. Solicitação de Exames
**O que é:** Agendamento de exames laboratoriais e de imagem.

**Documentos necessários:**
- Pedido Médico (obrigatório)
- Cartão SUS (obrigatório)

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string/textarea]** Alergias a Medicamentos/Contrastes (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[number]** Peso (kg) (mínimo 1, máximo 300, opcional)
- **[number]** Altura (cm) (mínimo 40, máximo 250, opcional)
- **[string]** Médico Solicitante (mín. 3, máx. 200 caracteres)
- **[string]** CRM do Médico (padrão: ^\d{4,8}$)
- **[string]** Especialidade do Médico (máx. 100 caracteres, opcional)
- **[date]** Data do Pedido Médico
- **[string]** Número do Pedido (máx. 50 caracteres, opcional)
- **[select]** Tipo de Exame (Laboratorial, Imagem (Raio-X, Ultrassom, Tomografia), Cardiológico, Oftalmológico, Auditivo, Endoscópico, Outro)
- **[array]** Exames Solicitados (objeto com propriedades: nomeExame [string], codigoExame [string], urgencia [boolean], mínimo 1 item)
- **[string/textarea]** Motivo da Solicitação/Hipótese Diagnóstica (mín. 10, máx. 500 caracteres)
- **[string]** Hipótese Diagnóstica (CID-10) (máx. 200 caracteres, opcional)
- **[date]** Data Preferencial (opcional)
- **[select]** Turno Preferencial (Manhã, Tarde, Qualquer, opcional)
- **[string]** Unidade de Saúde Preferencial (mín. 3, máx. 200 caracteres, opcional)
- **[boolean]** Jejum Necessário? (padrão: Não, opcional)
- **[number]** Horas de Jejum (mínimo 1, máximo 24, opcional)
- **[string/textarea]** Preparo Especial (orientações do médico) (máx. 500 caracteres, opcional)
- **[boolean]** Usa Medicamento Contínuo? (padrão: Não, opcional)
- **[string/textarea]** Medicamentos em Uso (máx. 500 caracteres, opcional)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 10 dias úteis

---

### 7. Transporte de Pacientes
**O que é:** Solicitação de ambulância para transporte de pacientes.

**Documentos necessários:**
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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string]** Nome do Médico Solicitante (mín. 3, máx. 200 caracteres)
- **[string]** CRM do Médico (padrão: ^\d{4,8}$)
- **[string]** Especialidade do Médico (máx. 100 caracteres, opcional)
- **[date]** Data da Solicitação
- **[string/textarea]** Motivo do Transporte (mín. 20, máx. 1000 caracteres)
- **[string/textarea]** Diagnóstico Principal (CID-10) (máx. 500 caracteres, opcional)
- **[select]** Condição do Paciente (Estável, Crítica, Mobilidade Reduzida, Acamado, Outra)
- **[select]** Tipo de Transporte Necessário (Ambulância Simples, Ambulância UTI, Veículo Adaptado, Outro)
- **[string]** Destino do Transporte (mín. 5, máx. 200 caracteres)
- **[date]** Data Preferencial
- **[string]** Hora Preferencial (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$, opcional)
- **[boolean]** Necessita Acompanhante? (padrão: Não, opcional)
- **[string]** Nome do Acompanhante (mín. 3, máx. 200 caracteres, opcional)
- **[string]** CPF do Acompanhante (mín. 11, máx. 11 caracteres, padrão: ^\d{11}$, opcional)
- **[select]** Grau de Parentesco (Cônjuge, Filho(a), Pai/Mãe, Irmão(ã), Outro, opcional)
- **[string/textarea]** Observações Gerais (máx. 1000 caracteres, opcional)

**Prazo estimado:** 3 dias úteis

---

### 8. Cartão Nacional de Saúde (Cartão SUS)
**O que é:** Cadastro e emissão do Cartão SUS.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- CPF
- RG
- Data de nascimento
- E-mail
- Telefone
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Cidade
- Estado
- Nome da Mãe

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome Completo (mín. 3, máx. 200 caracteres)
- **[string]** Nome Social (máx. 200 caracteres, opcional)
- **[string]** Nome do Pai (máx. 200 caracteres, opcional)
- **[select]** Sexo (MASCULINO, FEMININO)

**Prazo estimado:** 7 dias úteis

---

### 9. Registro de Vacinação
**O que é:** Registro e acompanhamento de vacinação.

**Documentos necessários:**
- Cartão de Vacina (obrigatório)
- Documento de Identidade (obrigatório)

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
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[boolean]** Possui Cartão de Vacina? (padrão: Não, opcional)
- **[string]** Número do Cartão de Vacina (máx. 50 caracteres, opcional)
- **[string/textarea]** Alergias a Medicamentos/Vacinas (se houver) (máx. 500 caracteres, opcional)
- **[select]** Necessidades Especiais (Nenhuma, Cadeirante, Deficiente Visual, Deficiente Auditivo (LIBRAS), Mobilidade Reduzida, Outra, opcional)
- **[string]** Nome da Vacina (mín. 3, máx. 200 caracteres)
- **[select]** Tipo de Vacina (COVID-19, Gripe, Hepatite A, Hepatite B, Tríplice Viral (Sarampo/Rubéola/Caxumba), Febre Amarela, BCG, Poliomielite, Tétano, HPV, Meningite, Pneumonia, Outra)
- **[string]** Lote da Vacina (mín. 3, máx. 50 caracteres)
- **[string]** Fabricante (mín. 3, máx. 200 caracteres)
- **[select]** Dose (Dose Única, 1ª Dose, 2ª Dose, 3ª Dose, 4ª Dose, Reforço, 1º Reforço, 2º Reforço)
- **[select]** Via de Administração (Intramuscular, Subcutânea, Oral, Intradérmica)
- **[date]** Data de Aplicação
- **[string]** Horário da Aplicação (formato HH:MM, padrão: ^([01]\d|2[0-3]):([0-5]\d)$, opcional)
- **[string]** Unidade de Saúde (Vacinação) (mín. 3, máx. 200 caracteres)
- **[string]** Nome do Profissional Aplicador (mín. 3, máx. 200 caracteres)
- **[string]** CNS do Profissional (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$, opcional)
- **[boolean]** Existe Próxima Dose? (padrão: Não, opcional)
- **[date]** Data Prevista da Próxima Dose (opcional)
- **[string]** Observações sobre Próxima Dose (máx. 300 caracteres, opcional)
- **[string/textarea]** Reações Adversas Observadas (máx. 500 caracteres, opcional)
- **[string/textarea]** Observações Gerais (máx. 500 caracteres, opcional)

**Prazo estimado:** 1 dia útil

---

### 10. Gestão de Agentes Comunitários de Saúde (ACS)
**O que é:** Administração e acompanhamento de ACS.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- CPF
- E-mail
- Telefone

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Nome do ACS (mín. 3, máx. 200 caracteres)
- **[string]** CNS (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[string]** Unidade de Saúde (mín. 3, máx. 200 caracteres)
- **[string]** Microárea (máx. 50 caracteres, opcional)
- **[date]** Data de Admissão
- **[select]** Situação (ATIVO, INATIVO, FERIAS, AFASTADO, padrão: ATIVO)
- **[integer]** Número de Famílias Atendidas (mínimo 0, opcional)
- **[string/textarea]** Observações (máx. 500 caracteres, opcional)

**Prazo estimado:** Não aplicável (gestão interna)

---

### 11. Encaminhamento TFD (Tratamento Fora do Domicílio)
**O que é:** Solicitação de tratamento médico especializado em outras cidades quando não disponível no município.

**Documentos necessários:**
- Encaminhamento Médico (obrigatório)
- Exames Médicos (se houver)
- Documentos Pessoais (RG, CPF, Cartão SUS) (obrigatório)

**Campos Dados Pessoais (Dados vindos do cadastro do cidadão auto preenchido):**
- Nome completo
- CPF
- RG
- Data de nascimento
- Telefone
- E-mail
- CEP
- Endereço
- Número
- Complemento
- Bairro

**Campos Dados do Serviço (Campos específicos do serviço):**
- **[string]** Cartão SUS (CNS) (mín. 15, máx. 15 caracteres, padrão: ^\d{15}$)
- **[select]** Especialidade Médica Necessária (Cardiologia, Oncologia, Neurologia, Ortopedia, Oftalmologia, Nefrologia, Urologia, Cirurgia Cardíaca, Cirurgia Vascular, Hematologia, Endocrinologia, Outras)
- **[string]** Especifique a Especialidade (máx. 100 caracteres, opcional, visível se "Outras")
- **[string/textarea]** Procedimento/Tratamento Necessário (mín. 20, máx. 500 caracteres)
- **[string/textarea]** Justificativa Médica (mín. 50, máx. 1000 caracteres)
- **[string]** Nome do Médico Solicitante (máx. 200 caracteres)
- **[string]** CRM do Médico (padrão: ^\d{4,8}$)
- **[select]** Estado do CRM (SP, RJ, MG, PR, SC, RS, BA, PE, CE, GO, DF, Outro)
- **[string]** CID-10 (máx. 10 caracteres, opcional)
- **[string/textarea]** Diagnóstico (mín. 20, máx. 500 caracteres)
- **[string]** Cidade de Destino (máx. 100 caracteres)
- **[select]** Estado de Destino (SP, RJ, MG, PR, SC, RS, BA, PE, CE, GO, DF, Outro)
- **[string]** Hospital/Clínica de Destino (se já definido) (máx. 200 caracteres, opcional)
- **[select]** Nível de Prioridade (EMERGENCIA, ALTA, MEDIA, ROTINA, padrão: MEDIA)
- **[string/textarea]** Justificativa da Prioridade (máx. 500 caracteres, opcional, visível se EMERGENCIA ou ALTA)
- **[boolean]** Necessita Acompanhante? (padrão: Não, opcional)
- **[string/textarea]** Justificativa para Acompanhante (máx. 500 caracteres, opcional, visível se sim)
- **[string]** Nome Completo do Acompanhante (máx. 200 caracteres, opcional, visível se necessita)
- **[string]** CPF do Acompanhante (padrão: ^\d{11}$, opcional, visível se necessita)
- **[select]** Parentesco do Acompanhante (Pai, Mãe, Filho(a), Cônjuge, Irmão(ã), Outro Familiar, Cuidador, opcional, visível se necessita)
- **[date]** Data Preferencial para Consulta/Procedimento (opcional)
- **[boolean]** Possui Necessidades Especiais? (padrão: Não, opcional)
- **[string/textarea]** Descreva as Necessidades Especiais (máx. 500 caracteres, opcional, visível se sim)
- **[string/textarea]** Observações Adicionais (máx. 1000 caracteres, opcional)

**Prazo estimado:** 30 dias úteis

---

### 12. Certidão de Atendimento
**O que é:** Certidão comprovando atendimento realizado na rede municipal de saúde.

**Documentos necessários:**
- CPF (obrigatório)
- Cartão SUS (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 13. Declaração de Vacinação
**O que é:** Declaração oficial de vacinas aplicadas.

**Documentos necessários:**
- CPF (obrigatório)
- Cartão SUS (obrigatório)
- Carteira de Vacinação (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 2 dias úteis

---

### 14. Atestado de Acompanhamento em Programa
**O que é:** Atestado de acompanhamento em programa de saúde.

**Documentos necessários:**
- CPF (obrigatório)
- Cartão SUS (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 15. Segunda Via de Cartão SUS
**O que é:** Reemissão do Cartão Nacional de Saúde.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)
- Protocolo Original (se possuir)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 16. Consulta de Histórico de Atendimentos
**O que é:** Consulta do histórico de atendimentos na rede municipal.

**Documentos necessários:**
- CPF (obrigatório)
- Cartão SUS (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 1 dia útil

---

### 17. Declaração de Participação em Programa de Saúde
**O que é:** Declaração comprovando participação em programas de saúde municipais.

**Documentos necessários:**
- CPF (obrigatório)
- Cartão SUS (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

# Catálogo de Serviços Municipais - Secretaria de Habitação

## Secretaria de Habitação

### 1. Regularização Fundiária
**O que é:** Solicitação de regularização de imóvel.

**Documentos necessários:**
- Escritura (obrigatório)
- IPTU (obrigatório)
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
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Matrícula do Imóvel (máx. 50 caracteres)
- **[number]** Área Construída (m², mínimo 1)
- **[number]** Tempo de Residência (anos, mínimo 0)
- **[string/textarea]** Observações (máx. 1000 caracteres)

**Prazo estimado:** 60 dias úteis

---

### 2. Programa Minha Casa Minha Vida
**O que é:** Inscrição no programa habitacional.

**Documentos necessários:**
- Comprovante de Renda (obrigatório)
- RG (obrigatório)
- CPF (obrigatório)
- Certidão de Casamento (obrigatório)

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
- **[number]** Renda Familiar Mensal (R$, mínimo 0)
- **[boolean]** Possui Imóvel Próprio? (padrão: Não)
- **[integer]** Quantidade de Filhos (mínimo 0)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 90 dias úteis

---

### 3. Mapa de Lotes
**O que é:** Visualização de lotes disponíveis.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 4. Certidão de Regularidade Fundiária
**O que é:** Emissão de certidão de regularidade.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Matrícula (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 10 dias úteis

---

### 5. Declaração de Residência
**O que é:** Emissão de declaração de residência.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 6. Laudo de Vistoria Habitacional
**O que é:** Emissão de laudo técnico de vistoria.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Endereço do Imóvel (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 20 dias úteis

---

### 7. Autorização para Construção
**O que é:** Autorização para construção em lote.

**Documentos necessários:**
- Projeto (obrigatório)
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
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[string]** Número do Lote (máx. 50 caracteres)
- **[number]** Área a Construir (m², mínimo 1)
- **[select]** Tipo de Construção (Residencial, Comercial, Misto)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 30 dias úteis

---

### 8. Atendimentos - Habitação
**O que é:** Registro geral de atendimentos na área habitacional.

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
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Motivo do Atendimento (Informações sobre Programas, Inscrição em Programa, Regularização Fundiária, Auxílio Aluguel, Situação de Moradia, Reclamação, Outro)
- **[string/textarea]** Descrição do Atendimento (mín. 10, máx. 1000 caracteres)
- **[select]** Situação Atual de Moradia (Própria, Alugada, Cedida, Ocupação Irregular, Situação de Rua, Outro)
- **[integer]** Número de Moradores (mínimo 1)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 1 dia útil

---

### 9. Inscrição em Programa Habitacional
**O que é:** Inscrição em programas habitacionais (Minha Casa Minha Vida).

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Renda (obrigatório)
- CadÚnico (obrigatório)
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
- **[string]** Ponto de Referência (máx. 200 caracteres)
- **[select]** Programa de Interesse (Minha Casa Minha Vida, Casa Verde e Amarela, Regularização Fundiária, Lotes Urbanizados, Outro)
- **[number]** Renda Familiar Total (R$, mínimo 0)
- **[integer]** Número de Moradores (mínimo 1)
- **[integer]** Número de Dependentes (mínimo 0)
- **[select]** Situação Atual de Moradia (Própria, Alugada, Cedida, Ocupação Irregular, Situação de Rua)
- **[select]** Tempo de Residência no Município (Menos de 1 ano, 1-3 anos, 3-5 anos, 5-10 anos, Mais de 10 anos)
- **[boolean]** Possui Imóvel? (padrão: Não)
- **[boolean]** Inscrito no CadÚnico? (padrão: Não)
- **[string]** NIS (CadÚnico) (máx. 20 caracteres)
- **[boolean]** Há pessoa com deficiência na família? (padrão: Não)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 30 dias úteis

---

### 10. Solicitação de Auxílio Aluguel
**O que é:** Solicitação de auxílio moradia temporário.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Renda (obrigatório)
- Declaração de Vulnerabilidade (obrigatório)

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
- **[number]** Renda Familiar Total (R$, mínimo 0)
- **[integer]** Número de Moradores (mínimo 1)
- **[integer]** Número de Dependentes (mínimo 0)
- **[select]** Motivo da Solicitação (Desabrigado por Calamidade, Despejo, Remoção por Obra Pública, Vulnerabilidade Social, Violência Doméstica, Outro)
- **[string/textarea]** Descrição da Situação (mín. 30, máx. 1000 caracteres)
- **[number]** Valor do Aluguel Atual/Pretendido (R$, mínimo 0)
- **[boolean]** Inscrito no CadÚnico? (padrão: Não)
- **[string]** NIS (CadÚnico) (máx. 20 caracteres)
- **[boolean]** Há pessoa com deficiência na família? (padrão: Não)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 15 dias úteis

---

### 11. Cadastro de Unidade Habitacional
**O que é:** Cadastro de imóveis no programa habitacional.

**Documentos necessários:**
- Matrícula do Imóvel (obrigatório)
- Planta (obrigatório)
- Documentação do Proprietário (obrigatório)

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
- **[string]** Endereço Completo do Imóvel (mín. 10, máx. 300 caracteres)
- **[string]** CEP do Imóvel (padrão: ^\\d{8}$)
- **[select]** Tipo de Imóvel (Casa, Apartamento, Sobrado, Kitnet, Lote, Outro)
- **[integer]** Número de Quartos (mínimo 0)
- **[integer]** Número de Banheiros (mínimo 0)
- **[number]** Área do Terreno (m², mínimo 0)
- **[number]** Área Construída (m², mínimo 0)
- **[string]** Matrícula do Imóvel (máx. 50 caracteres)
- **[string]** Inscrição IPTU (máx. 50 caracteres)
- **[select]** Situação do Imóvel (Ocupado, Desocupado, Em Construção, Reforma)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 20 dias úteis

---

### 12. Inscrição na Fila de Habitação
**O que é:** Inscrição em lista de espera para moradia popular.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Renda (obrigatório)
- CadÚnico (obrigatório)

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
- **[number]** Renda Familiar Total (R$, mínimo 0)
- **[integer]** Número de Moradores (mínimo 1)
- **[integer]** Número de Dependentes (mínimo 0)
- **[select]** Situação Atual de Moradia (Alugada, Cedida, Ocupação Irregular, Situação de Rua, Outro)
- **[select]** Tempo de Residência no Município (Menos de 1 ano, 1-3 anos, 3-5 anos, 5-10 anos, Mais de 10 anos)
- **[boolean]** Inscrito no CadÚnico? (padrão: Não)
- **[string]** NIS (CadÚnico) (máx. 20 caracteres)
- **[boolean]** Há pessoa com deficiência na família? (padrão: Não)
- **[boolean]** Há idoso na família? (padrão: Não)
- **[string/textarea]** Observações (máx. 500 caracteres)

**Prazo estimado:** 7 dias úteis

---

### 13. Consulta de Programas Habitacionais
**O que é:** Informações sobre programas habitacionais disponíveis.

**Documentos necessários:**
- Nenhum documento obrigatório

**Tipo de serviço:** SEM_DADOS (serviço informativo, sem formulário)

**Prazo estimado:** Imediato

---

### 14. Certidão de Inscrição Habitacional
**O que é:** Certidão comprovando inscrição em programas habitacionais.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Renda (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 15. Declaração de Moradia
**O que é:** Declaração de situação de moradia.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Comprovante de Endereço (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 3 dias úteis

---

### 16. Atestado de Regularização Fundiária
**O que é:** Atestado do processo de regularização fundiária.

**Documentos necessários:**
- CPF (obrigatório)
- Documentos do Imóvel (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 7 dias úteis

---

### 17. Consulta de Situação no Programa
**O que é:** Consulta de situação em programas habitacionais.

**Documentos necessários:**
- CPF (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 2 dias úteis

---

### 18. Segunda Via de Contrato Habitacional
**O que é:** Reemissão de contrato habitacional.

**Documentos necessários:**
- CPF (obrigatório)
- RG (obrigatório)
- Protocolo Original (se possuir)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 5 dias úteis

---

### 19. Comprovante de Cadastro Habitacional
**O que é:** Comprovante oficial de cadastro habitacional.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Cadastro (obrigatório)

**Tipo de serviço:** SEM_DADOS (não possui formulário, apenas upload de documentos)

**Prazo estimado:** 2 dias úteis

---

### 1. Cadastro no Programa Habitacional
**O que é:** Inscrição para receber moradia popular.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Comprovante de Residência (obrigatório)
- Declaração de Composição Familiar (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Data de nascimento
- Telefone
- E-mail
- Endereço atual
- Renda familiar
- Número de dependentes
- Situação habitacional atual

**Prazo estimado:** 30 dias úteis

---

### 2. Solicitação de Material de Construção
**O que é:** Pedido de materiais subsidiados para reforma ou construção.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Propriedade (obrigatório)
- Comprovante de Renda (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Tipo de reforma/construção
- Materiais necessários
- Renda familiar

**Prazo estimado:** 45 dias úteis

---

### 3. Solicitação de Regularização Fundiária
**O que é:** Pedido de legalização de imóveis em áreas irregulares.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)
- Documentos do Imóvel (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Tempo de ocupação
- Tipo de ocupação

**Prazo estimado:** 180 dias úteis

---

### 4. Cadastro para Aluguel Social
**O que é:** Inscrição para receber auxílio-moradia temporário.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Laudo de Insalubridade (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço atual
- Renda familiar
- Motivo da solicitação
- Número de dependentes

**Prazo estimado:** 20 dias úteis

---

### 5. Solicitação de Vistoria Habitacional
**O que é:** Pedido de inspeção técnica em imóvel com problemas estruturais.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Problema relatado
- Risco iminente

**Prazo estimado:** 10 dias úteis

---

### 6. Cadastro em Mutirão Habitacional
**O que é:** Inscrição para participar de construção coletiva de moradias.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Renda familiar
- Disponibilidade para trabalho
- Experiência em construção

**Prazo estimado:** 30 dias úteis

---

### 7. Solicitação de Reforma de Moradia
**O que é:** Pedido de reforma gratuita para famílias de baixa renda.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Propriedade (obrigatório)
- Comprovante de Renda (obrigatório)
- Laudo Técnico (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Tipo de reforma necessária
- Renda familiar

**Prazo estimado:** 60 dias úteis

---

### 8. Cadastro para Lote Urbanizado
**O que é:** Inscrição para aquisição de terreno com infraestrutura.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Certidão Negativa (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço atual
- Renda familiar
- Possui imóvel
- Composição familiar

**Prazo estimado:** 45 dias úteis

---

### 9. Solicitação de Reassentamento
**O que é:** Pedido de mudança para nova moradia em área de risco.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)
- Laudo de Risco (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço atual
- Tipo de risco
- Composição familiar

**Prazo estimado:** 90 dias úteis

---

### 10. Denúncia de Área de Risco
**O que é:** Registro de locais com perigo de desabamento ou inundação.

**Documentos necessários:**
- Nenhum documento obrigatório

**Campos do formulário:**
- Nome (opcional)
- Telefone (opcional)
- Localização
- Tipo de risco
- Número de famílias afetadas
- Descrição

**Prazo estimado:** 3 dias úteis

---

### 11. Solicitação de Título de Propriedade
**O que é:** Pedido de documento de posse de imóvel regularizado.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Residência (obrigatório)
- Processo de Regularização (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Número do processo

**Prazo estimado:** 120 dias úteis

---

### 12. Cadastro para Urbanização de Favela
**O que é:** Inscrição de comunidade para programa de melhorias.

**Documentos necessários:**
- CPF do Representante (obrigatório)
- Abaixo-assinado (obrigatório)

**Campos do formulário:**
- Nome do representante
- CPF
- Telefone
- E-mail
- Nome da comunidade
- Número de famílias
- Melhorias solicitadas

**Prazo estimado:** 60 dias úteis

---

### 13. Solicitação de Ligação de Água
**O que é:** Pedido de instalação de rede de água em nova moradia.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Propriedade (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel
- Número de moradores

**Prazo estimado:** 30 dias úteis

---

### 14. Solicitação de Ligação de Esgoto
**O que é:** Pedido de instalação de rede de esgoto.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Propriedade (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço do imóvel

**Prazo estimado:** 30 dias úteis

---

### 15. Cadastro em Programa de Melhoria Habitacional
**O que é:** Inscrição para receber pequenos reparos em moradia.

**Documentos necessários:**
- CPF (obrigatório)
- Comprovante de Renda (obrigatório)
- Comprovante de Residência (obrigatório)

**Campos do formulário:**
- Nome completo
- CPF
- Telefone
- E-mail
- Endereço
- Renda familiar
- Problemas na moradia

**Prazo estimado:** 45 dias úteis

---
