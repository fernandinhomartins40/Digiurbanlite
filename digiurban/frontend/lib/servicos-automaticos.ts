// Sistema de Geração Automática de Serviços - Integração Bidirecional
// Este sistema coleta automaticamente todos os serviços das 26 páginas especializadas

export interface ServicoAutomatico {
  id: string
  nome: string
  descricao: string
  categoria: string
  secretaria: 'saude' | 'educacao' | 'servicos-publicos'
  prazo: string
  documentos: string[]
  digital: boolean
  gratuito: boolean
  taxa?: number
  origem_pagina: string
  data_criacao: string
  status: 'ativo' | 'inativo' | 'em_revisao'
  acessos_mes: number
  demanda_estimada: number
}

export class GeradorServicosAutomaticos {
  private static instance: GeradorServicosAutomaticos
  private servicos: ServicoAutomatico[] = []

  private constructor() {
    this.inicializarServicos()
  }

  static getInstance(): GeradorServicosAutomaticos {
    if (!this.instance) {
      this.instance = new GeradorServicosAutomaticos()
    }
    return this.instance
  }

  private inicializarServicos() {
    // SECRETARIA DE SAÚDE - 10 páginas
    this.adicionarServicos(this.getServicosSaude())

    // SECRETARIA DE EDUCAÇÃO - 8 páginas
    this.adicionarServicos(this.getServicosEducacao())

    // SECRETARIA DE SERVIÇOS PÚBLICOS - 7 páginas
    this.adicionarServicos(this.getServicosPublicos())
  }

  private getServicosSaude(): Omit<ServicoAutomatico, 'id' | 'data_criacao'>[] {
    return [
      // ATENDIMENTOS
      {
        nome: "Agendamento de Consulta Geral",
        descricao: "Agende consultas médicas em unidades básicas de saúde",
        categoria: "Consultas Médicas",
        secretaria: 'saude',
        prazo: "3 dias úteis",
        documentos: ["RG", "CPF", "Cartão SUS"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/atendimentos",
        status: 'ativo',
        acessos_mes: 450,
        demanda_estimada: 600
      },
      {
        nome: "Atendimento de Emergência",
        descricao: "Acesso prioritário para casos de emergência médica",
        categoria: "Emergência",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["Documento de identidade"],
        digital: false,
        gratuito: true,
        origem_pagina: "saude/atendimentos",
        status: 'ativo',
        acessos_mes: 120,
        demanda_estimada: 200
      },
      {
        nome: "Consulta Especializada",
        descricao: "Agendamento para consultas com médicos especialistas",
        categoria: "Especialidades",
        secretaria: 'saude',
        prazo: "7 dias úteis",
        documentos: ["RG", "CPF", "Cartão SUS", "Encaminhamento médico"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/atendimentos",
        status: 'ativo',
        acessos_mes: 280,
        demanda_estimada: 400
      },

      // AGENDAMENTOS
      {
        nome: "Agendamento Online de Consultas",
        descricao: "Sistema online para agendamento de consultas médicas",
        categoria: "Agendamentos",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["Cartão SUS"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/agendamentos",
        status: 'ativo',
        acessos_mes: 890,
        demanda_estimada: 1200
      },
      {
        nome: "Reagendamento de Consulta",
        descricao: "Altere data e horário de consultas já agendadas",
        categoria: "Reagendamentos",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["Número do agendamento"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/agendamentos",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 300
      },

      // MEDICAMENTOS
      {
        nome: "Dispensação de Medicamentos",
        descricao: "Retirada de medicamentos na farmácia básica municipal",
        categoria: "Farmácia",
        secretaria: 'saude',
        prazo: "1 dia útil",
        documentos: ["RG", "Receita médica", "Cartão SUS"],
        digital: false,
        gratuito: true,
        origem_pagina: "saude/medicamentos",
        status: 'ativo',
        acessos_mes: 678,
        demanda_estimada: 800
      },
      {
        nome: "Consulta de Estoque de Medicamentos",
        descricao: "Verifique a disponibilidade de medicamentos nas farmácias",
        categoria: "Consultas",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["Nome do medicamento"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/medicamentos",
        status: 'ativo',
        acessos_mes: 1240,
        demanda_estimada: 1500
      },

      // CAMPANHAS
      {
        nome: "Inscrição em Campanhas de Vacinação",
        descricao: "Cadastre-se nas campanhas de imunização do município",
        categoria: "Prevenção",
        secretaria: 'saude',
        prazo: "2 dias úteis",
        documentos: ["RG", "CPF", "Cartão de vacinação"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/campanhas",
        status: 'ativo',
        acessos_mes: 567,
        demanda_estimada: 750
      },
      {
        nome: "Certificado de Vacinação",
        descricao: "Emita certificados e comprovantes de vacinação",
        categoria: "Certificados",
        secretaria: 'saude',
        prazo: "1 dia útil",
        documentos: ["RG", "CPF", "Cartão de vacinação"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/campanhas",
        status: 'ativo',
        acessos_mes: 890,
        demanda_estimada: 1000
      },

      // PROGRAMAS
      {
        nome: "Inscrição no Programa Hiperdia",
        descricao: "Cadastro no programa de acompanhamento de diabetes e hipertensão",
        categoria: "Programas de Saúde",
        secretaria: 'saude',
        prazo: "3 dias úteis",
        documentos: ["RG", "CPF", "Cartão SUS", "Exames recentes"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/programas",
        status: 'ativo',
        acessos_mes: 156,
        demanda_estimada: 250
      },
      {
        nome: "Acompanhamento Pré-Natal",
        descricao: "Cadastro e acompanhamento no programa de gestantes",
        categoria: "Saúde da Mulher",
        secretaria: 'saude',
        prazo: "2 dias úteis",
        documentos: ["RG", "CPF", "Cartão SUS", "Comprovante gravidez"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/programas",
        status: 'ativo',
        acessos_mes: 89,
        demanda_estimada: 120
      },

      // TFD
      {
        nome: "Solicitação de TFD",
        descricao: "Tratamento Fora de Domicílio para especialidades não disponíveis",
        categoria: "TFD",
        secretaria: 'saude',
        prazo: "15 dias úteis",
        documentos: ["RG", "CPF", "Cartão SUS", "Relatório médico", "Laudo especializado"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/tfd",
        status: 'ativo',
        acessos_mes: 45,
        demanda_estimada: 80
      },
      {
        nome: "Acompanhamento de Solicitação TFD",
        descricao: "Consulte o andamento de sua solicitação de TFD",
        categoria: "Consultas",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["Número do protocolo"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/tfd",
        status: 'ativo',
        acessos_mes: 67,
        demanda_estimada: 100
      },

      // EXAMES
      {
        nome: "Agendamento de Exames Laboratoriais",
        descricao: "Agende exames de sangue, urina e outros laboratoriais",
        categoria: "Exames",
        secretaria: 'saude',
        prazo: "5 dias úteis",
        documentos: ["RG", "Cartão SUS", "Solicitação médica"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/exames",
        status: 'ativo',
        acessos_mes: 456,
        demanda_estimada: 600
      },
      {
        nome: "Agendamento de Exames de Imagem",
        descricao: "Agende ultrassom, raio-X e outros exames de imagem",
        categoria: "Diagnóstico",
        secretaria: 'saude',
        prazo: "7 dias úteis",
        documentos: ["RG", "Cartão SUS", "Solicitação médica"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/exames",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 350
      },
      {
        nome: "Consulta de Resultados de Exames",
        descricao: "Acesse os resultados de seus exames online",
        categoria: "Resultados",
        secretaria: 'saude',
        prazo: "Imediato",
        documentos: ["RG", "Número do exame"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/exames",
        status: 'ativo',
        acessos_mes: 678,
        demanda_estimada: 800
      },

      // ACS
      {
        nome: "Solicitação de Visita Domiciliar",
        descricao: "Agende visita do Agente Comunitário de Saúde",
        categoria: "Visitas",
        secretaria: 'saude',
        prazo: "7 dias úteis",
        documentos: ["RG", "Comprovante de residência"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/acs",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },
      {
        nome: "Cadastro Familiar no PSF",
        descricao: "Registre sua família no Programa Saúde da Família",
        categoria: "Cadastros",
        secretaria: 'saude',
        prazo: "5 dias úteis",
        documentos: ["RG de todos os membros", "Comprovante de residência"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/acs",
        status: 'ativo',
        acessos_mes: 89,
        demanda_estimada: 150
      },

      // TRANSPORTE PACIENTES
      {
        nome: "Solicitação de Transporte para Consultas",
        descricao: "Solicite transporte municipal para consultas médicas",
        categoria: "Transporte",
        secretaria: 'saude',
        prazo: "3 dias úteis",
        documentos: ["RG", "Comprovante de agendamento", "Declaração de carência"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/transporte-pacientes",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 300
      },
      {
        nome: "Transporte para Exames Especializados",
        descricao: "Transporte para exames em outras cidades",
        categoria: "Transporte Especializado",
        secretaria: 'saude',
        prazo: "7 dias úteis",
        documentos: ["RG", "Solicitação médica", "Comprovante do exame"],
        digital: true,
        gratuito: true,
        origem_pagina: "saude/transporte-pacientes",
        status: 'ativo',
        acessos_mes: 78,
        demanda_estimada: 120
      }
    ]
  }

  private getServicosEducacao(): Omit<ServicoAutomatico, 'id' | 'data_criacao'>[] {
    return [
      // CHAMADAS ESCOLARES
      {
        nome: "Justificativa de Falta Escolar",
        descricao: "Justifique faltas dos estudantes com documentação médica",
        categoria: "Frequência Escolar",
        secretaria: 'educacao',
        prazo: "2 dias úteis",
        documentos: ["Atestado médico", "RG do responsável"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/chamadas-escolares",
        status: 'ativo',
        acessos_mes: 345,
        demanda_estimada: 450
      },
      {
        nome: "Consulta de Frequência do Aluno",
        descricao: "Acompanhe a frequência escolar do seu filho",
        categoria: "Consultas Acadêmicas",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Matrícula do aluno"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/chamadas-escolares",
        status: 'ativo',
        acessos_mes: 567,
        demanda_estimada: 700
      },

      // MATRÍCULA ALUNOS
      {
        nome: "Matrícula Escolar Online",
        descricao: "Realize a matrícula de novos alunos no sistema municipal",
        categoria: "Matrículas",
        secretaria: 'educacao',
        prazo: "5 dias úteis",
        documentos: ["Certidão de nascimento", "RG responsável", "CPF", "Comprovante residência", "Cartão vacinação"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/matricula-alunos",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 400
      },
      {
        nome: "Transferência Escolar",
        descricao: "Solicite transferência entre escolas municipais",
        categoria: "Transferências",
        secretaria: 'educacao',
        prazo: "3 dias úteis",
        documentos: ["Histórico escolar", "Declaração de transferência", "Justificativa"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/matricula-alunos",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },
      {
        nome: "Segunda Via de Histórico Escolar",
        descricao: "Solicite segunda via do histórico escolar",
        categoria: "Documentos",
        secretaria: 'educacao',
        prazo: "7 dias úteis",
        documentos: ["RG do aluno", "Comprovante de matrícula"],
        digital: true,
        gratuito: false,
        taxa: 15.50,
        origem_pagina: "educacao/matricula-alunos",
        status: 'ativo',
        acessos_mes: 89,
        demanda_estimada: 150
      },

      // GESTÃO ESCOLAR
      {
        nome: "Consulta de Vagas Escolares",
        descricao: "Verifique a disponibilidade de vagas nas escolas municipais",
        categoria: "Informações",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Faixa etária do aluno", "Região preferida"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/gestao-escolar",
        status: 'ativo',
        acessos_mes: 456,
        demanda_estimada: 600
      },
      {
        nome: "Solicitação de Reunião com Coordenação",
        descricao: "Agende reunião com a coordenação pedagógica",
        categoria: "Atendimento",
        secretaria: 'educacao',
        prazo: "3 dias úteis",
        documentos: ["RG responsável", "Motivo da reunião"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/gestao-escolar",
        status: 'ativo',
        acessos_mes: 167,
        demanda_estimada: 250
      },

      // TRANSPORTE ESCOLAR
      {
        nome: "Solicitação de Transporte Escolar",
        descricao: "Solicite vaga no transporte escolar municipal",
        categoria: "Transporte",
        secretaria: 'educacao',
        prazo: "10 dias úteis",
        documentos: ["Comprovante matrícula", "Comprovante residência", "RG responsável"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/transporte-escolar",
        status: 'ativo',
        acessos_mes: 289,
        demanda_estimada: 400
      },
      {
        nome: "Consulta de Rotas de Transporte",
        descricao: "Consulte as rotas e horários do transporte escolar",
        categoria: "Informações",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Endereço ou escola"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/transporte-escolar",
        status: 'ativo',
        acessos_mes: 445,
        demanda_estimada: 600
      },

      // MERENDA ESCOLAR
      {
        nome: "Cardápio da Merenda Escolar",
        descricao: "Consulte o cardápio semanal/mensal da merenda escolar",
        categoria: "Alimentação",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Escola do aluno"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/merenda-escolar",
        status: 'ativo',
        acessos_mes: 678,
        demanda_estimada: 800
      },
      {
        nome: "Solicitação de Dieta Especial",
        descricao: "Solicite dieta especial para alunos com restrições alimentares",
        categoria: "Alimentação Especial",
        secretaria: 'educacao',
        prazo: "5 dias úteis",
        documentos: ["Laudo médico", "RG responsável", "Comprovante matrícula"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/merenda-escolar",
        status: 'ativo',
        acessos_mes: 34,
        demanda_estimada: 60
      },

      // REGISTRO OCORRÊNCIAS
      {
        nome: "Registro de Ocorrência Escolar",
        descricao: "Registre ocorrências disciplinares ou pedagógicas",
        categoria: "Disciplina",
        secretaria: 'educacao',
        prazo: "1 dia útil",
        documentos: ["RG responsável", "Descrição da ocorrência"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/registro-ocorrencias",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },
      {
        nome: "Acompanhamento Pedagógico",
        descricao: "Solicite acompanhamento pedagógico especializado",
        categoria: "Apoio Pedagógico",
        secretaria: 'educacao',
        prazo: "7 dias úteis",
        documentos: ["Relatório escolar", "RG responsável"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/registro-ocorrencias",
        status: 'ativo',
        acessos_mes: 89,
        demanda_estimada: 150
      },

      // CALENDÁRIO ESCOLAR
      {
        nome: "Consulta do Calendário Escolar",
        descricao: "Consulte o calendário oficial das escolas municipais",
        categoria: "Calendário",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Ano letivo"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/calendario-escolar",
        status: 'ativo',
        acessos_mes: 789,
        demanda_estimada: 1000
      },
      {
        nome: "Notificação de Eventos Escolares",
        descricao: "Receba notificações sobre eventos e atividades escolares",
        categoria: "Notificações",
        secretaria: 'educacao',
        prazo: "Imediato",
        documentos: ["Telefone ou email"],
        digital: true,
        gratuito: true,
        origem_pagina: "educacao/calendario-escolar",
        status: 'ativo',
        acessos_mes: 456,
        demanda_estimada: 600
      }
    ]
  }

  private getServicosPublicos(): Omit<ServicoAutomatico, 'id' | 'data_criacao'>[] {
    return [
      // ATENDIMENTOS
      {
        nome: "Solicitação de Serviços Urbanos",
        descricao: "Solicite serviços de infraestrutura, limpeza e manutenção urbana",
        categoria: "Serviços Urbanos",
        secretaria: 'servicos-publicos',
        prazo: "5 dias úteis",
        documentos: ["Descrição do problema", "Localização", "Fotos (opcional)"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/atendimentos",
        status: 'ativo',
        acessos_mes: 567,
        demanda_estimada: 750
      },
      {
        nome: "Acompanhamento de Protocolo Urbano",
        descricao: "Consulte o andamento de solicitações de serviços urbanos",
        categoria: "Consultas",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Número do protocolo"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/atendimentos",
        status: 'ativo',
        acessos_mes: 789,
        demanda_estimada: 1000
      },

      // LIMPEZA PÚBLICA
      {
        nome: "Consulta de Cronograma de Coleta",
        descricao: "Verifique os dias e horários de coleta de lixo em sua rua",
        categoria: "Informações",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Endereço completo"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/limpeza-publica",
        status: 'ativo',
        acessos_mes: 1234,
        demanda_estimada: 1500
      },
      {
        nome: "Solicitação de Limpeza Especial",
        descricao: "Solicite limpeza especial para eventos ou emergências",
        categoria: "Limpeza Especial",
        secretaria: 'servicos-publicos',
        prazo: "3 dias úteis",
        documentos: ["Justificativa", "Local", "Data do evento"],
        digital: true,
        gratuito: false,
        taxa: 150.00,
        origem_pagina: "servicos-publicos/limpeza-publica",
        status: 'ativo',
        acessos_mes: 45,
        demanda_estimada: 80
      },
      {
        nome: "Denúncia de Descarte Irregular",
        descricao: "Denuncie descarte irregular de lixo e entulho",
        categoria: "Denúncias",
        secretaria: 'servicos-publicos',
        prazo: "24 horas",
        documentos: ["Local da irregularidade", "Fotos", "Descrição"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/limpeza-publica",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },

      // ILUMINAÇÃO PÚBLICA
      {
        nome: "Solicitação de Reparo de Iluminação",
        descricao: "Reporte problemas na iluminação pública",
        categoria: "Manutenção",
        secretaria: 'servicos-publicos',
        prazo: "5 dias úteis",
        documentos: ["Localização exata", "Descrição do problema"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/iluminacao-publica",
        status: 'ativo',
        acessos_mes: 456,
        demanda_estimada: 600
      },
      {
        nome: "Solicitação de Nova Iluminação",
        descricao: "Solicite instalação de novos pontos de iluminação",
        categoria: "Instalação",
        secretaria: 'servicos-publicos',
        prazo: "15 dias úteis",
        documentos: ["Justificativa", "Local", "Abaixo-assinado (se aplicável)"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/iluminacao-publica",
        status: 'ativo',
        acessos_mes: 89,
        demanda_estimada: 150
      },

      // COLETA ESPECIAL
      {
        nome: "Agendamento de Coleta de Resíduos Especiais",
        descricao: "Agende coleta de eletrônicos, óleo, baterias e medicamentos",
        categoria: "Coleta Especial",
        secretaria: 'servicos-publicos',
        prazo: "7 dias úteis",
        documentos: ["Tipo de resíduo", "Quantidade estimada", "Endereço"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/coleta-especial",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 350
      },
      {
        nome: "Certificado de Destinação de Resíduos",
        descricao: "Obtenha certificado de destinação ambientalmente correta",
        categoria: "Certificados",
        secretaria: 'servicos-publicos',
        prazo: "3 dias úteis",
        documentos: ["Comprovante de entrega", "Tipo de resíduo"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/coleta-especial",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },
      {
        nome: "Consulta de Pontos de Coleta",
        descricao: "Encontre pontos de coleta de resíduos especiais próximos",
        categoria: "Informações",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Tipo de resíduo", "Região"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/coleta-especial",
        status: 'ativo',
        acessos_mes: 345,
        demanda_estimada: 500
      },

      // PROBLEMAS COM FOTO
      {
        nome: "Relatório de Problema Urbano com Foto",
        descricao: "Reporte problemas de infraestrutura urbana anexando fotos",
        categoria: "Denúncias",
        secretaria: 'servicos-publicos',
        prazo: "5 dias úteis",
        documentos: ["Foto do problema", "Localização exata"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/problemas-com-foto",
        status: 'ativo',
        acessos_mes: 678,
        demanda_estimada: 900
      },
      {
        nome: "Acompanhamento de Protocolo Urbano",
        descricao: "Consulte o andamento do seu protocolo de problema urbano",
        categoria: "Consultas",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Número do protocolo"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/problemas-com-foto",
        status: 'ativo',
        acessos_mes: 456,
        demanda_estimada: 600
      },
      {
        nome: "Solicitação de Vistoria Técnica",
        descricao: "Solicite vistoria técnica especializada para problemas urbanos",
        categoria: "Vistorias",
        secretaria: 'servicos-publicos',
        prazo: "3 dias úteis",
        documentos: ["Fotos", "Descrição detalhada", "Endereço"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/problemas-com-foto",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 350
      },

      // PROGRAMAÇÃO DE EQUIPES
      {
        nome: "Agendamento de Serviços Urbanos",
        descricao: "Agende serviços de limpeza, manutenção e infraestrutura",
        categoria: "Agendamentos",
        secretaria: 'servicos-publicos',
        prazo: "3 dias úteis",
        documentos: ["Descrição do serviço", "Localização"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/programacao-equipes",
        status: 'ativo',
        acessos_mes: 345,
        demanda_estimada: 500
      },
      {
        nome: "Acompanhamento de Equipes",
        descricao: "Consulte o cronograma e localização das equipes de trabalho",
        categoria: "Informações",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Região de interesse"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/programacao-equipes",
        status: 'ativo',
        acessos_mes: 567,
        demanda_estimada: 700
      },
      {
        nome: "Solicitação de Serviço Emergencial",
        descricao: "Solicite atendimento emergencial para problemas urbanos urgentes",
        categoria: "Emergência",
        secretaria: 'servicos-publicos',
        prazo: "24 horas",
        documentos: ["Descrição da emergência", "Fotos", "Localização"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/programacao-equipes",
        status: 'ativo',
        acessos_mes: 123,
        demanda_estimada: 200
      },

      // DASHBOARD CONSOLIDADO
      {
        nome: "Consulta de Serviços Urbanos",
        descricao: "Consulte status e histórico de todos os serviços urbanos",
        categoria: "Relatórios",
        secretaria: 'servicos-publicos',
        prazo: "Imediato",
        documentos: ["Número do protocolo ou endereço"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/dashboard-servicos-publicos",
        status: 'ativo',
        acessos_mes: 890,
        demanda_estimada: 1200
      },
      {
        nome: "Relatório de Serviços Públicos",
        descricao: "Solicite relatórios detalhados sobre serviços em sua região",
        categoria: "Relatórios",
        secretaria: 'servicos-publicos',
        prazo: "5 dias úteis",
        documentos: ["Especificação da área", "Período desejado"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/dashboard-servicos-publicos",
        status: 'ativo',
        acessos_mes: 234,
        demanda_estimada: 350
      },
      {
        nome: "Agendamento Integrado de Serviços",
        descricao: "Agende múltiplos serviços urbanos de forma integrada",
        categoria: "Agendamentos",
        secretaria: 'servicos-publicos',
        prazo: "3 dias úteis",
        documentos: ["Lista de serviços", "Preferência de horários"],
        digital: true,
        gratuito: true,
        origem_pagina: "servicos-publicos/dashboard-servicos-publicos",
        status: 'ativo',
        acessos_mes: 167,
        demanda_estimada: 250
      }
    ]
  }

  private adicionarServicos(novosServicos: Omit<ServicoAutomatico, 'id' | 'data_criacao'>[]) {
    novosServicos.forEach(servico => {
      const servicoCompleto: ServicoAutomatico = {
        ...servico,
        id: this.gerarId(),
        data_criacao: new Date().toISOString()
      }
      this.servicos.push(servicoCompleto)
    })
  }

  private gerarId(): string {
    return `srv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Métodos públicos para acesso aos serviços
  public getTodosServicos(): ServicoAutomatico[] {
    return [...this.servicos]
  }

  public getServicosPorSecretaria(secretaria: 'saude' | 'educacao' | 'servicos-publicos'): ServicoAutomatico[] {
    return this.servicos.filter(s => s.secretaria === secretaria)
  }

  public getServicosPorCategoria(categoria: string): ServicoAutomatico[] {
    return this.servicos.filter(s => s.categoria === categoria)
  }

  public getServicosDigitais(): ServicoAutomatico[] {
    return this.servicos.filter(s => s.digital)
  }

  public getServicosGratuitos(): ServicoAutomatico[] {
    return this.servicos.filter(s => s.gratuito)
  }

  public getServicosComTaxa(): ServicoAutomatico[] {
    return this.servicos.filter(s => !s.gratuito && s.taxa)
  }

  public getEstatisticas() {
    const total = this.servicos.length
    const por_secretaria = {
      saude: this.getServicosPorSecretaria('saude').length,
      educacao: this.getServicosPorSecretaria('educacao').length,
      servicos_publicos: this.getServicosPorSecretaria('servicos-publicos').length
    }
    const digitais = this.getServicosDigitais().length
    const gratuitos = this.getServicosGratuitos().length
    const com_taxa = this.getServicosComTaxa().length
    const acessos_total = this.servicos.reduce((acc, s) => acc + s.acessos_mes, 0)
    const demanda_total = this.servicos.reduce((acc, s) => acc + s.demanda_estimada, 0)

    return {
      total,
      por_secretaria,
      digitais,
      gratuitos,
      com_taxa,
      acessos_total,
      demanda_total,
      taxa_digitalizacao: (digitais / total) * 100,
      taxa_gratuidade: (gratuitos / total) * 100
    }
  }

  public buscarServicos(termo: string): ServicoAutomatico[] {
    const termolower = termo.toLowerCase()
    return this.servicos.filter(s =>
      s.nome.toLowerCase().includes(termolower) ||
      s.descricao.toLowerCase().includes(termolower) ||
      s.categoria.toLowerCase().includes(termolower)
    )
  }

  public exportarParaCatalogoPublico(): any[] {
    return this.servicos.map(s => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      categoria: s.categoria,
      secretaria: s.secretaria,
      prazo: s.prazo,
      documentos: s.documentos,
      digital: s.digital,
      gratuito: s.gratuito,
      taxa: s.taxa,
      status: s.status,
      origem: 'sistema_interno'
    }))
  }
}

// Singleton instance
export const geradorServicos = GeradorServicosAutomaticos.getInstance()

// Export das estatísticas para uso nos dashboards
export const estatisticasServicos = geradorServicos.getEstatisticas()