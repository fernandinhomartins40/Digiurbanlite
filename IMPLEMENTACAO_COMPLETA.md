# 🔍 ANÁLISE COMPLETA: WORKFLOWS vs SERVIÇOS

**Data da Análise:** 2025-01-XX

---

## 📊 SUMÁRIO EXECUTIVO

- **Total de Serviços Analisados:** 383
- **Workflows Customizados:** 0
- **Serviços COM_DADOS:** 289
- **Serviços SEM_DADOS:** 94
- **Serviços que solicitam documentos:** 199

### AVISO PROBLEMAS IDENTIFICADOS

- **🔴 CRÍTICO (Categoria A):** 199 serviços
- **🟡 ATENÇÃO (Categoria B):** 0 serviços
- **🟢 OK (Categoria C):** 0 serviços
- **🟣 DESNECESSÁRIO (Categoria D):** 0 serviços

---

## 🔴 CATEGORIA A - CRÍTICO

**Serviços COM_DADOS que solicitam documentos mas usam workflow PADRÃO**

Estes serviços NÃO têm workflow customizado e dependem do workflow padrão,
que possui apenas stages genéricas (Em Análise, Pendente, Aprovado, etc.)
sem uma etapa específica de **Análise Documental**.

**Total: 199 serviços**

### Administração (6 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Protocolo Online de Documentos | COM_DADOS | PROTOCOLO_GERAL | Documento a ser protocolado, RG ou CPF |
| Solicitação de Declaração/Atestado | COM_DADOS | DECLARACOES | RG e CPF, Comprovante de Residência (se aplicável) |
| Solicitação de Cópia de Processo Administrativo | COM_DADOS | COPIA_PROCESSOS | RG e CPF, Procuração (se representante legal) |
| Solicitação de Uso de Espaço Público | COM_DADOS | USO_ESPACO_PUBLICO | RG e CPF do Responsável, Projeto do Evento (se aplicável)... |
| Agendamento de Atendimento Presencial Especializado | COM_DADOS | AGENDAMENTO_ESPECIALIZADO | RG e CPF, Documentos relacionados ao assunto do agendamento |
| Inscrição em Concurso Público Municipal | COM_DADOS | INSCRICAO_CONCURSO | RG e CPF, Comprovante de Escolaridade... |

### Agricultura (16 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Cadastro de Produtor Rural | COM_DADOS | CADASTRO_PRODUTOR | CPF, Comprovante de Residência... |
| Solicitação de Máquinas e Equipamentos Agrícolas | COM_DADOS | SOLICITACAO_MAQUINAS | CPF, Comprovante de Propriedade ou Posse |
| Inscrição na Feira do Produtor | COM_DADOS | FEIRA_PRODUTOR | CPF, Comprovante de Residência |
| Assistência Técnica Rural | COM_DADOS | ASSISTENCIA_TECNICA | Cadastro de Produtor Rural (opcional), Documento da Propriedade (opcional) |
| Cadastro de Propriedade Rural | COM_DADOS | CADASTRO_PROPRIEDADE_RURAL | Escritura ou Contrato, CAR - Cadastro Ambiental Rural (opcional)... |
| Inscrição em Programas Rurais | COM_DADOS | INSCRICAO_PROGRAMA_RURAL | CPF, Comprovante de Residência... |
| Solicitação de Análise de Solo | COM_DADOS | ANALISE_SOLO | CPF, Cadastro de Produtor Rural (opcional) |
| Licença para Eventos Rurais | COM_DADOS | LICENCA_EVENTOS_RURAIS | CPF, CNPJ (se pessoa jurídica)... |
| Cadastro de Piscicultura | COM_DADOS | CADASTRO_PISCICULTURA | CPF, Comprovante de Propriedade... |
| Cadastro de Agroindústria Familiar | COM_DADOS | CADASTRO_AGROINDUSTRIA | CPF, CNPJ (se houver)... |
| Licença para Perfuração de Poço | COM_DADOS | LICENCA_PERFURACAO_POCO | CPF, Comprovante de Propriedade... |
| Programa de Hortas Comunitárias | COM_DADOS | PROGRAMA_HORTAS_COMUNITARIAS | CPF, Comprovante de Residência |
| Seguro Safra | COM_DADOS | SEGURO_SAFRA | CPF, DAP... |
| DAP Digital - Declaração de Aptidão ao Pronaf | COM_DADOS | DAP_DIGITAL | CPF, RG... |
| Programa de Distribuição de Sementes | COM_DADOS | DISTRIBUICAO_SEMENTES | CPF, Cadastro de Produtor Rural |
| Programa de Distribuição de Mudas | COM_DADOS | DISTRIBUICAO_MUDAS | CPF, Comprovante de Propriedade ou Posse |

### Assistência Social (15 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Cadastro Único (CadÚnico) | COM_DADOS | CADASTRO_UNICO | CPF, RG... |
| Solicitação de Benefício Social | COM_DADOS | SOLICITACAO_BENEFICIO | CadÚnico, Documentos Pessoais... |
| Agendamento de Atendimento Social | COM_DADOS | ATENDIMENTO_CRAS | RG, CPF... |
| Auxílio Emergencial (Cesta Básica) | COM_DADOS | AUXILIO_EMERGENCIAL | CPF, Comprovante de Endereço... |
| Visita Domiciliar | COM_DADOS | VISITA_DOMICILIAR | Comprovante de Endereço |
| Inscrição em Grupo ou Oficina Social | COM_DADOS | INSCRICAO_GRUPO_OFICINA | RG, CPF... |
| Inscrição em Programa Social | COM_DADOS | INSCRICAO_PROGRAMA_SOCIAL | CadÚnico, Documentos Pessoais |
| Inscrição Bolsa Família Municipal | COM_DADOS | BOLSA_FAMILIA_MUNICIPAL | CadÚnico, CPF... |
| Auxílio Aluguel | COM_DADOS | AUXILIO_ALUGUEL | Contrato de Aluguel, CPF... |
| Solicitação de Cesta Básica | COM_DADOS | CESTA_BASICA | CPF, Comprovante de Residência |
| Inscrição Casa Lar para Idoso | COM_DADOS | CASA_LAR_IDOSO | RG, CPF... |
| Programa Primeira Infância | COM_DADOS | PROGRAMA_PRIMEIRA_INFANCIA | Certidão de Nascimento da Criança, CPF dos Pais... |
| Benefício Eventual | COM_DADOS | BENEFICIO_EVENTUAL | CPF, RG... |
| Solicitação de Tarifa Social de Energia | COM_DADOS | TARIFA_SOCIAL_ENERGIA | CadÚnico, CPF... |
| Isenção de Tarifa de Transporte | COM_DADOS | ISENCAO_TRANSPORTE | CPF, RG... |

### Cultura (14 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Inscrição em Oficinas Culturais | COM_DADOS | INSCRICAO_OFICINA | RG, CPF... |
| Cadastro de Artistas Locais | COM_DADOS | CADASTRO_ARTISTA | RG, CPF... |
| Reserva de Espaço Cultural | COM_DADOS | RESERVA_ESPACO_CULTURAL | RG, CPF... |
| Cadastro de Grupo Artístico | COM_DADOS | CADASTRO_GRUPO_ARTISTICO | Documentos dos Integrantes, Portfólio do Grupo... |
| Cadastro de Evento Cultural | COM_DADOS | CADASTRO_EVENTO_CULTURAL | Projeto do Evento, Autorizações Necessárias |
| Registro de Manifestação Cultural | COM_DADOS | REGISTRO_MANIFESTACAO_CULTURAL | Documentação Histórica, Fotos... |
| Submissão de Projetos Culturais | COM_DADOS | PROJETO_CULTURAL | CPF, RG... |
| Solicitação de Apoio Cultural | COM_DADOS | APOIO_CULTURAL | CPF, RG... |
| Cadastro Ponto Cultura | COM_DADOS | CADASTRO_PONTO_CULTURA | CPF, RG... |
| Credenciamento Professor Arte | COM_DADOS | CREDENCIAMENTO_PROFESSOR_ARTE | CPF, RG... |
| Locação Equipamento Cultural | COM_DADOS | LOCACAO_EQUIPAMENTO_CULTURAL | CPF, RG... |
| Tombamento Patrimônio | COM_DADOS | TOMBAMENTO_PATRIMONIO | CPF, RG... |
| Inscrição Curso Formação Cultural | COM_DADOS | INSCRICAO_CURSO_FORMACAO | CPF, RG... |
| Certidão Bem Tombado | COM_DADOS | CERTIDAO_BEM_TOMBADO | CPF, RG... |

### Defesa Civil (5 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Solicitação de Vistoria em Área de Risco | COM_DADOS | VISTORIA_AREA_RISCO | Comprovante de Residência, RG ou CPF... |
| Cadastro de Família em Área de Risco | COM_DADOS | CADASTRO_FAMILIA_RISCO | Comprovante de Residência, RG ou CPF de todos os moradores... |
| Solicitação de Abrigo Temporário | COM_DADOS | SOLICITACAO_ABRIGO | RG ou CPF de todos os moradores, Laudo Técnico (se houver)... |
| Inscrição em Treinamento de Defesa Civil | COM_DADOS | TREINAMENTO_DEFESA_CIVIL | RG ou CPF, Comprovante de Residência |
| Cadastro de Voluntário da Defesa Civil | COM_DADOS | CADASTRO_VOLUNTARIO | RG, CPF... |

### Desenvolvimento Econômico (9 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Alvará de Funcionamento | COM_DADOS | ALVARA_FUNCIONAMENTO | CNPJ, Contrato Social... |
| Baixa de Empresa | COM_DADOS | BAIXA_EMPRESA | CNPJ, Último Alvará de Funcionamento... |
| Cadastro MEI (Microempreendedor Individual) | COM_DADOS | CADASTRO_MEI | CPF, RG... |
| Solicitação de Microcrédito | COM_DADOS | SOLICITACAO_MICROCREDITO | RG e CPF, Comprovante de Residência... |
| Inscrição em Incubadora de Empresas | COM_DADOS | INSCRICAO_INCUBADORA | CPF e RG dos Sócios, Currículo dos Sócios... |
| Participação em Feiras e Rodadas de Negócios | COM_DADOS | PARTICIPACAO_FEIRAS | CNPJ, Alvará de Funcionamento... |
| Cadastro de Fornecedor Municipal | COM_DADOS | CADASTRO_FORNECEDOR | CNPJ, Contrato Social ou Requerimento de Empresário... |
| Solicitação de Lote no Distrito Industrial | COM_DADOS | SOLICITACAO_LOTE_DISTRITO | CNPJ, Contrato Social... |
| Programa Compra Direta do Produtor | COM_DADOS | COMPRA_DIRETA_PRODUTOR | CPF, DAP (Declaração de Aptidão ao Pronaf)... |

### Educação (12 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Matrícula Escolar | COM_DADOS | MATRICULA_ESCOLAR | Certidão de Nascimento, RG do Responsável... |
| Transferência Escolar | COM_DADOS | TRANSFERENCIA_ESCOLAR | Histórico Escolar, Comprovante de Residência... |
| Transporte Escolar | COM_DADOS | TRANSPORTE_ESCOLAR | Comprovante de Matrícula, Comprovante de Residência |
| Inscrição em Cursos Livres | COM_DADOS | INSCRICAO_CURSO_LIVRE | RG, CPF... |
| Solicitação de Documento Escolar | COM_DADOS | SOLICITACAO_DOCUMENTO_ESCOLAR | RG, Comprovante de Matrícula (se aplicável) |
| Cadastro de Professores | COM_DADOS | CADASTRO_PROFESSOR | Diploma, Currículo... |
| Inscrição em Creche | COM_DADOS | INSCRICAO_CRECHE | Certidão de Nascimento da Criança, RG do Responsável... |
| Atendimento Educacional Especializado (AEE) | COM_DADOS | AEE | Laudo Médico, Relatório Pedagógico... |
| Solicitação de Uniforme Escolar | COM_DADOS | UNIFORME_ESCOLAR | Comprovante de Matrícula, Declaração de Baixa Renda (se aplicável) |
| Solicitação de Material Escolar | COM_DADOS | MATERIAL_ESCOLAR | Comprovante de Matrícula, Declaração de Baixa Renda (se aplicável) |
| Solicitação de Merenda Especial | COM_DADOS | MERENDA_ESPECIAL | Atestado Médico, Comprovante de Matrícula |
| Inscrição em EJA (Educação de Jovens e Adultos) | COM_DADOS | INSCRICAO_EJA | RG, CPF... |

### Esportes (15 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Inscrição em Competição | COM_DADOS | INSCRICAO_COMPETICAO | CPF, RG... |
| Cadastro de Atleta Municipal | COM_DADOS | CADASTRO_ATLETA | CPF, RG... |
| Inscrição Escolinha Futebol | COM_DADOS | INSCRICAO_ESCOLINHA_FUTEBOL | CPF, RG... |
| Inscrição Escolinha Basquete | COM_DADOS | INSCRICAO_ESCOLINHA_BASQUETE | CPF, RG... |
| Inscrição Escolinha Vôlei | COM_DADOS | INSCRICAO_ESCOLINHA_VOLEI | CPF, RG... |
| Inscrição Escolinha Natação | COM_DADOS | INSCRICAO_ESCOLINHA_NATACAO | CPF, RG... |
| Inscrição Escolinha Judô | COM_DADOS | INSCRICAO_ESCOLINHA_JUDO | CPF, RG... |
| Inscrição Escolinha Capoeira | COM_DADOS | INSCRICAO_ESCOLINHA_CAPOEIRA | CPF, RG... |
| Inscrição Escolinha Ginástica | COM_DADOS | INSCRICAO_ESCOLINHA_GINASTICA | CPF, RG... |
| Inscrição Corrida de Rua | COM_DADOS | INSCRICAO_CORRIDA_RUA | CPF, RG... |
| Empréstimo Material Esportivo | COM_DADOS | EMPRESTIMO_MATERIAL_ESPORTIVO | CPF, RG |
| Credenciamento Instrutor | COM_DADOS | CREDENCIAMENTO_INSTRUTOR | CPF, RG... |
| Uso Ginásio | COM_DADOS | USO_GINASIO | CPF, RG... |
| Campeonato Municipal | COM_DADOS | CAMPEONATO_MUNICIPAL | Lista de Atletas, Documentos dos Atletas |
| Bolsa Atleta | COM_DADOS | BOLSA_ATLETA | CPF, RG... |

### Finanças (7 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Pagamento de ITBI | COM_DADOS | PAGAMENTO_ITBI | Escritura ou Contrato de Compra e Venda, RG e CPF do Comprador... |
| Parcelamento de Débitos Tributários | COM_DADOS | PARCELAMENTO_DEBITOS | Comprovante de Renda, RG e CPF... |
| Solicitação de Isenção de IPTU | COM_DADOS | ISENCAO_IPTU | RG e CPF, Comprovante de Propriedade do Imóvel... |
| Solicitação de Revisão de Lançamento de IPTU | COM_DADOS | REVISAO_IPTU | Carnê de IPTU, Fotos do Imóvel... |
| Atualização Cadastral de Imóvel | COM_DADOS | ATUALIZACAO_CADASTRAL_IMOVEL | Escritura ou Contrato de Compra e Venda, RG e CPF do Proprietário... |
| Atualização Cadastral de Empresa | COM_DADOS | ATUALIZACAO_CADASTRAL_EMPRESA | Contrato Social Atualizado, CNPJ... |
| Cadastro de Contribuinte (Pessoa Física) | COM_DADOS | CADASTRO_CONTRIBUINTE | RG e CPF, Comprovante de Residência... |

### Habitação (15 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Regularização Fundiária | COM_DADOS | REGULARIZACAO_FUNDIARIA | Escritura (se possuir), IPTU... |
| Inscrição em Programa Habitacional | COM_DADOS | INSCRICAO_PROGRAMA_HABITACIONAL | CPF, RG... |
| Solicitação de Auxílio Aluguel | COM_DADOS | SOLICITACAO_AUXILIO_ALUGUEL | CPF, RG... |
| Autorização para Construção | COM_DADOS | AUTORIZACAO_CONSTRUCAO | Projeto Arquitetônico, ART (Anotação de Responsabilidade Técnica)... |
| Vistoria Habitacional | COM_DADOS | VISTORIA_HABITACIONAL | CPF, RG... |
| Inscrição Minha Casa Minha Vida Municipal | COM_DADOS | INSCRICAO_MCMV_MUNICIPAL | CPF, RG... |
| Regularização de Posse | COM_DADOS | REGULARIZACAO_POSSE | CPF, RG... |
| Usucapião Urbano | COM_DADOS | USUCAPIAO_URBANO | CPF, RG... |
| REURB - Regularização Fundiária Urbana | COM_DADOS | REURB | CPF, RG... |
| Concessão de Uso Especial para Fins de Moradia | COM_DADOS | CONCESSAO_USO_ESPECIAL | CPF, RG... |
| Auxílio Construção | COM_DADOS | AUXILIO_CONSTRUCAO | CPF, RG... |
| Solicitação de Material de Construção | COM_DADOS | MATERIAL_CONSTRUCAO | CPF, RG... |
| Projeto Arquitetônico Social | COM_DADOS | PROJETO_ARQUITETONICO_SOCIAL | CPF, RG... |
| Cadastro em Déficit Habitacional | COM_DADOS | CADASTRO_DEFICIT_HABITACIONAL | CPF, RG... |
| Melhoria Habitacional | COM_DADOS | MELHORIA_HABITACIONAL | CPF, RG... |

### Meio Ambiente (11 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Licenciamento Ambiental | COM_DADOS | LICENCIAMENTO_AMBIENTAL | Projeto, Estudo de Impacto Ambiental... |
| Autorização para Poda ou Supressão de Árvores | COM_DADOS | AUTORIZACAO_PODA_ARVORES | CPF, Comprovante de Propriedade... |
| Vistoria Ambiental | COM_DADOS | VISTORIA_AMBIENTAL | CPF, RG... |
| Licença Ambiental Simplificada | COM_DADOS | LICENCA_AMBIENTAL_SIMPLIFICADA | CPF, RG... |
| Autorização Supressão Vegetal | COM_DADOS | AUTORIZACAO_SUPRESSAO_VEGETAL | CPF, RG... |
| Cadastro Gerador Resíduos | COM_DADOS | CADASTRO_GERADOR_RESIDUOS | CPF, CNPJ... |
| Autorização Manejo Fauna | COM_DADOS | AUTORIZACAO_MANEJO_FAUNA | CPF, RG... |
| Certidão Uso Solo | COM_DADOS | CERTIDAO_USO_SOLO | CPF, RG... |
| Licença Atividade Potencialmente Poluidora | COM_DADOS | LICENCA_ATIVIDADE_POLUIDORA | CNPJ, Projeto Técnico... |
| Autorização Captação Água | COM_DADOS | AUTORIZACAO_CAPTACAO_AGUA | CPF, RG... |
| Cadastro Viveiro Mudas | COM_DADOS | CADASTRO_VIVEIRO_MUDAS | CPF, RG... |

### Mobilidade Urbana (8 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Solicitação de Cartão Transporte | COM_DADOS | CARTAO_TRANSPORTE | RG ou CPF, Foto 3x4 recente... |
| Passe Livre Interestadual (PCD) | COM_DADOS | PASSE_LIVRE_INTERESTADUAL | RG, CPF... |
| Isenção de Tarifa para Idosos | COM_DADOS | ISENCAO_IDOSO | RG, CPF... |
| Cartão Transporte para Pessoa com Deficiência | COM_DADOS | CARTAO_PCD | RG, CPF... |
| Cartão Estudante (Meia Passagem) | COM_DADOS | CARTAO_ESTUDANTE | RG ou CPF, Declaração de Matrícula... |
| Solicitação de Vaga Especial para PCD | COM_DADOS | VAGA_ESPECIAL_PCD | RG, CPF... |
| Autorização para Transporte Escolar | COM_DADOS | AUTORIZACAO_TRANSPORTE_ESCOLAR | CNH categoria D ou superior, Certidão de Antecedentes Criminais... |
| Solicitação de Transporte Escolar Gratuito | COM_DADOS | TRANSPORTE_ESCOLAR_GRATUITO | RG ou Certidão de Nascimento, CPF... |

### Obras Públicas (8 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Autorização para Demolição | COM_DADOS | AUTORIZACAO_DEMOLICAO | CPF, RG... |
| Autorização para Intervenção em Via Pública | COM_DADOS | AUTORIZACAO_INTERVENCAO_VIA | CPF, RG... |
| Aprovação de Projeto de Construção | COM_DADOS | APROVACAO_PROJETO | Projeto Arquitetônico, ART... |
| Licença para Obra | COM_DADOS | LICENCA_OBRA | Projeto Aprovado, ART... |
| Alvará de Reforma | COM_DADOS | ALVARA_REFORMA | Projeto de Reforma, ART... |
| Aprovação de Loteamento | COM_DADOS | APROVACAO_LOTEAMENTO | Projeto de Loteamento, Memorial Descritivo... |
| Regularização de Obra | COM_DADOS | REGULARIZACAO_OBRA | Projeto As-Built, ART... |
| Aprovação de Demolição Parcial | COM_DADOS | APROVACAO_DEMOLICAO_PARCIAL | Projeto de Demolição, ART... |

### Planejamento Urbano (8 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Autorização de Parcelamento do Solo | COM_DADOS | PARCELAMENTO_SOLO | CPF, RG... |
| Consulta de Viabilidade Urbanística | COM_DADOS | VIABILIDADE_URBANISTICA | CPF, RG... |
| Aprovação de Projeto Arquitetônico | COM_DADOS | APROVACAO_PROJETO_ARQUITETONICO | Projeto Arquitetônico, ART... |
| Alvará de Construção | COM_DADOS | ALVARA_CONSTRUCAO | Projeto Aprovado, Matrícula do Imóvel... |
| Alvará de Funcionamento | COM_DADOS | ALVARA_FUNCIONAMENTO | CNPJ, Contrato Social... |
| Anuência para Remembramento de Lote | COM_DADOS | REMEMBRAMENTO_LOTE | CPF, RG... |
| Análise de Viabilidade de Empreendimento | COM_DADOS | ANALISE_VIABILIDADE_EMPREENDIMENTO | CNPJ, Projeto Preliminar... |
| Aprovação de Projeto de Urbanização | COM_DADOS | APROVACAO_PROJETO_URBANIZACAO | Projeto de Urbanização, Memorial Descritivo... |

### Políticas para Mulheres (7 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Agendamento no Centro de Referência da Mulher | COM_DADOS | AGENDAMENTO_CENTRO_REFERENCIA | RG ou CPF, Comprovante de Residência |
| Solicitação de Acolhimento em Casa Abrigo | COM_DADOS | ACOLHIMENTO_CASA_ABRIGO | RG, CPF... |
| Inscrição em Cursos de Qualificação Profissional | COM_DADOS | CURSOS_QUALIFICACAO | RG, CPF... |
| Programa de Geração de Renda | COM_DADOS | GERACAO_RENDA | RG, CPF... |
| Solicitação de Acompanhamento Social | COM_DADOS | ACOMPANHAMENTO_SOCIAL | RG, CPF... |
| Solicitação de Medida Protetiva de Urgência | COM_DADOS | MEDIDA_PROTETIVA | RG, CPF... |
| Agendamento para Perícia Psicossocial | COM_DADOS | PERICIA_PSICOSSOCIAL | RG, CPF... |

### Saúde (13 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Agendamento de Consulta Médica | COM_DADOS | AGENDAMENTO_CONSULTA | Cartão SUS, RG ou CPF |
| Agendamento de Consulta Odontológica | COM_DADOS | AGENDAMENTO_ODONTOLOGIA | Cartão SUS, RG ou CPF |
| Solicitação de Exames | COM_DADOS | SOLICITACAO_EXAMES | Pedido Médico, Cartão SUS... |
| Solicitação de Medicamentos de Alto Custo | COM_DADOS | MEDICAMENTOS_ALTO_CUSTO | Receita Médica Especial, Laudo Médico... |
| Solicitação de Medicamentos | COM_DADOS | CONTROLE_MEDICAMENTOS | Receita Médica, Cartão SUS... |
| Agendamento de Vacinação | COM_DADOS | CAMPANHAS_VACINACAO | Cartão de Vacina (se possuir), RG ou CPF |
| Cadastro no Programa Saúde da Família | COM_DADOS | PROGRAMA_SAUDE_FAMILIA | Comprovante de Residência, RG ou CPF de todos os moradores... |
| Inscrição em Programas de Saúde | COM_DADOS | PROGRAMAS_SAUDE | Laudo Médico (se aplicável), Cartão SUS... |
| Agendamento CAPS (Saúde Mental) | COM_DADOS | AGENDAMENTO_CAPS | Encaminhamento Médico (se houver), Cartão SUS... |
| Transporte de Pacientes (TFD) | COM_DADOS | TRANSPORTE_PACIENTES | Atestado Médico, Comprovante de Endereço... |
| Solicitação de Atendimento Domiciliar | COM_DADOS | ATENDIMENTO_DOMICILIAR | Laudo Médico, Cartão SUS... |
| Solicitação de Fisioterapia | COM_DADOS | SOLICITACAO_FISIOTERAPIA | Pedido Médico, Cartão SUS... |
| Solicitação de Cartão SUS | COM_DADOS | CARTAO_SUS | RG ou CNH, CPF... |

### Segurança Pública (4 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Registro de Boletim de Ocorrência | COM_DADOS | REGISTRO_OCORRENCIA | RG, CPF |
| Solicitação de Câmera de Segurança | COM_DADOS | SOLICITACAO_CAMERA_SEGURANCA | Justificativa, Abaixo-assinado... |
| Autorização de Segurança para Eventos | COM_DADOS | AUTORIZACAO_EVENTO_SEGURANCA | Projeto do Evento, Plano de Segurança... |
| Laudo de Vistoria de Segurança | COM_DADOS | LAUDO_VISTORIA_SEGURANCA | Alvará de Funcionamento, CNPJ |

### Serviços Públicos (1 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Registro de Problema com Foto | COM_DADOS | REGISTRO_PROBLEMA_FOTO | Foto do Problema |

### Tecnologia e Inovação (5 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Cadastro no Login Único Gov.br | COM_DADOS | CADASTRO_LOGIN_UNICO | RG ou CNH, CPF... |
| Solicitação de Certificado Digital | COM_DADOS | CERTIFICADO_DIGITAL | RG, CPF... |
| Inscrição em Curso de Inclusão Digital | COM_DADOS | CURSO_INCLUSAO_DIGITAL | RG ou CPF, Comprovante de Residência |
| Cadastro de Startup/Empresa de Tecnologia | COM_DADOS | CADASTRO_STARTUP | CNPJ ou Protocolo de Abertura, Contrato Social... |
| Solicitação de Integração via API | COM_DADOS | API_INTEGRACAO | CNPJ da Empresa, Contrato Social... |

### Transportes e Trânsito (11 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Defesa de Autuação de Trânsito | COM_DADOS | DEFESA_AUTUACAO | CNH, CRLV... |
| Credenciamento de Táxi | COM_DADOS | CREDENCIAMENTO_TAXI | CNH Categoria B (mínimo), Certidão de Antecedentes Criminais... |
| Credenciamento de Mototáxi | COM_DADOS | CREDENCIAMENTO_MOTOTAXI | CNH Categoria A (mínimo), Certidão de Antecedentes Criminais... |
| Credenciamento de Transporte Escolar | COM_DADOS | CREDENCIAMENTO_TRANSPORTE_ESCOLAR | CNH Categoria D, Certidão de Antecedentes Criminais... |
| Vistoria de Veículo de Transporte | COM_DADOS | VISTORIA_VEICULO | CRLV, Comprovante de Pagamento de Taxas |
| Autorização para Evento em Via Pública | COM_DADOS | AUTORIZACAO_EVENTO_VIA | Projeto do Evento, Seguro de Responsabilidade Civil... |
| Solicitação de CNH Social | COM_DADOS | CNH_SOCIAL | RG, CPF... |
| Renovação de Credenciamento de Táxi/Mototáxi | COM_DADOS | RENOVACAO_CREDENCIAMENTO | CNH Atualizada, CRLV Atualizado... |
| Solicitação de Faixa Exclusiva para Carga/Descarga | COM_DADOS | FAIXA_CARGA_DESCARGA | Alvará de Funcionamento, Planta de Localização |
| Transferência de Ponto de Táxi | COM_DADOS | TRANSFERENCIA_PONTO_TAXI | Credencial de Taxista, Certidão Negativa de Multas... |
| Solicitação de Vaga Especial (Idoso/PcD) | COM_DADOS | VAGA_ESPECIAL | Laudo Médico (PcD) ou Documento de Identidade (Idoso +60), CRLV... |

### Turismo (9 serviços)

| Serviço | Tipo | ModuleType | Documentos |
|---------|------|------------|------------|
| Cadastro de Estabelecimento Turístico | COM_DADOS | CADASTRO_ESTABELECIMENTO_TURISTICO | CNPJ, Alvará de Funcionamento... |
| Cadastro de Guia Turístico | COM_DADOS | CADASTRO_GUIA_TURISTICO | CPF, RG... |
| Registro de Evento Turístico | COM_DADOS | REGISTRO_EVENTO_TURISTICO | CPF, Projeto do Evento... |
| Licença para Atividade Turística | COM_DADOS | LICENCA_ATIVIDADE_TURISTICA | CPF ou CNPJ, RG... |
| Credenciamento de Agência de Turismo | COM_DADOS | CREDENCIAMENTO_AGENCIA_TURISMO | CNPJ, Contrato Social... |
| Autorização para Transporte Turístico | COM_DADOS | AUTORIZACAO_TRANSPORTE_TURISTICO | CNPJ, CNH Categoria D ou E... |
| Cadastro de Atração Turística | COM_DADOS | CADASTRO_ATRACAO_TURISTICA | CPF ou CNPJ, Fotos do Local... |
| Solicitação de Apoio a Feira/Exposição | COM_DADOS | APOIO_FEIRA_EXPOSICAO | CPF ou CNPJ, Projeto do Evento... |
| Inscrição em Circuito Turístico Regional | COM_DADOS | INSCRICAO_CIRCUITO_TURISTICO | CNPJ ou CPF, Alvará de Funcionamento... |

---

## 🟡 CATEGORIA B - ATENÇÃO

**Serviços COM_DADOS que solicitam documentos e têm workflow customizado,
mas o workflow NÃO inclui stage explícita de Análise Documental**

OK Nenhum serviço nesta categoria!

---

## 🟢 CATEGORIA C - OK

**Serviços COM_DADOS que solicitam documentos e têm workflow adequado**

**Total: 0 serviços**

Estes serviços estão configurados corretamente! OK

---

## 🟣 CATEGORIA D - DESNECESSÁRIO

**Serviços SEM_DADOS que solicitam documentos**

Isto pode ser uma inconsistência: serviços SEM_DADOS normalmente não deveriam
solicitar documentos ou ter workflows complexos.

OK Nenhum serviço nesta categoria!

---

## 📈 ESTATÍSTICAS POR SECRETARIA

| Secretaria | Total Serviços | Com Documentos | Problemas | % Problemas |
|------------|----------------|----------------|-----------|-------------|
| Administração | 19 | 6 | 6 | 31.6% |
| Agricultura | 19 | 16 | 16 | 84.2% |
| Assistência Social | 22 | 15 | 15 | 68.2% |
| Cultura | 19 | 14 | 14 | 73.7% |
| Defesa Civil | 14 | 5 | 5 | 35.7% |
| Desenvolvimento Econômico | 19 | 9 | 9 | 47.4% |
| Educação | 21 | 12 | 12 | 57.1% |
| Esportes | 19 | 15 | 15 | 78.9% |
| Finanças | 19 | 7 | 7 | 36.8% |
| Habitação | 19 | 15 | 15 | 78.9% |
| Meio Ambiente | 19 | 11 | 11 | 57.9% |
| Mobilidade Urbana | 14 | 8 | 8 | 57.1% |
| Obras Públicas | 19 | 8 | 8 | 42.1% |
| Planejamento Urbano | 19 | 8 | 8 | 42.1% |
| Políticas para Mulheres | 14 | 7 | 7 | 50.0% |
| Saúde | 20 | 13 | 13 | 65.0% |
| Segurança Pública | 19 | 4 | 4 | 21.1% |
| Serviços Públicos | 22 | 1 | 1 | 4.5% |
| Tecnologia e Inovação | 14 | 5 | 5 | 35.7% |
| Transportes e Trânsito | 19 | 11 | 11 | 57.9% |
| Turismo | 14 | 9 | 9 | 64.3% |

---

## 💡 RECOMENDAÇÕES

### 1. Para Categoria A (CRÍTICO)

**199 serviços precisam de workflows customizados**

**Ação recomendada:**
- Criar workflows específicos para cada moduleType
- Incluir stage de 'Análise Documental' após 'Recepção'
- Definir documentos obrigatórios em cada stage

### 2. Para Categoria B (ATENÇÃO)

**0 workflows existentes precisam de ajustes**

**Ação recomendada:**
- Adicionar stage de 'Análise Documental' nos workflows existentes
- Posicionar após 'Recepção' e antes de 'Validação de Dados'
- Configurar metadados de UI (availableTabs, primaryTab, etc)

### 3. Modelo de Stage Recomendado

```typescript
{
  name: 'Análise Documental',
  order: 2,
  description: 'Verificação e validação dos documentos obrigatórios',
  slaDays: 3,
  availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
  primaryTab: 'documentos',
  requiredDocumentTypes: ['...'], // Lista de documentos obrigatórios
  requiredFormFields: [],
  allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
  canSkip: false
}
```

---

## 📝 CONCLUSÃO

**199 de 383 serviços (52.0%) apresentam inconsistências**
relacionadas a workflows e documentos.

A maioria dos problemas está em serviços que **solicitam documentos mas não têm**
**uma stage específica de Análise Documental** em seus workflows.

---

*Relatório gerado automaticamente por `analyze_workflows.py`*