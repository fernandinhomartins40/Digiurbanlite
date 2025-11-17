import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// PROGRAMAS SOCIAIS
// ========================================

export const programasSociaisData = [
  {
    nome: 'Bolsa Família',
    descricao: 'Programa de transferência de renda para famílias em situação de pobreza',
    tipo: 'Transferência de Renda',
    criteriosElegibilidade: {
      rendaPerCapita: 'Até R$ 218,00',
      requisitos: ['Inscrição no CadÚnico', 'Frequência escolar das crianças', 'Vacinação em dia'],
    },
    valorBeneficio: 600.0,
    periodicidade: 'Mensal',
    documentosNecessarios: ['CPF', 'RG', 'Comprovante de Residência', 'Carteira de Vacinação'],
    orgaoResponsavel: 'Secretaria de Assistência Social',
    legislacao: 'Lei Federal nº 10.836/2004',
  },
  {
    nome: 'BPC - Benefício de Prestação Continuada',
    descricao: 'Benefício para idosos e pessoas com deficiência de baixa renda',
    tipo: 'Transferência de Renda',
    criteriosElegibilidade: {
      idade: '65 anos ou mais, ou pessoa com deficiência',
      rendaFamiliar: 'Até 1/4 do salário mínimo per capita',
    },
    valorBeneficio: 1412.0,
    periodicidade: 'Mensal',
    documentosNecessarios: ['CPF', 'RG', 'Laudo Médico (se deficiente)', 'Comprovante de Residência'],
    orgaoResponsavel: 'INSS',
    legislacao: 'Lei Orgânica da Assistência Social (LOAS)',
  },
  {
    nome: 'Auxílio Natalidade',
    descricao: 'Auxílio único para famílias de baixa renda com nascimento de filho',
    tipo: 'Apoio Social',
    criteriosElegibilidade: {
      rendaFamiliar: 'Até 2 salários mínimos',
      requisitos: ['Certidão de Nascimento', 'Inscrição no CadÚnico'],
    },
    valorBeneficio: 300.0,
    periodicidade: 'Único',
    documentosNecessarios: ['CPF', 'RG', 'Certidão de Nascimento do Bebê', 'Comprovante de Renda'],
    orgaoResponsavel: 'Secretaria de Assistência Social',
  },
  {
    nome: 'Programa de Qualificação Profissional',
    descricao: 'Cursos gratuitos de capacitação profissional',
    tipo: 'Capacitação',
    criteriosElegibilidade: {
      idade: 'A partir de 16 anos',
      escolaridade: 'Ensino Fundamental completo',
    },
    documentosNecessarios: ['CPF', 'RG', 'Comprovante de Escolaridade'],
    orgaoResponsavel: 'Secretaria de Trabalho e Desenvolvimento',
  },
];

export async function seedProgramasSociais() {
  console.log('   📋 Programas Sociais...');

  for (const data of programasSociaisData) {
    await prisma.programaSocial.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${programasSociaisData.length} programas sociais criados`);
}

// ========================================
// TIPOS DE OBRAS E SERVIÇOS
// ========================================

export const tiposObraServicoData = [
  {
    nome: 'Pavimentação Asfáltica',
    categoria: 'Pavimentação',
    descricao: 'Pavimentação de vias com asfalto',
    tempoMedioExecucao: 60,
    requisitosPrevios: ['Projeto de Engenharia', 'Licença Ambiental'],
    equipamentosNecessarios: ['Rolo Compactador', 'Acabadora de Asfalto', 'Caminhões'],
    materiaisComuns: ['Asfalto', 'Brita', 'Areia'],
  },
  {
    nome: 'Pavimentação com Paralelepípedos',
    categoria: 'Pavimentação',
    descricao: 'Pavimentação de vias com pedras',
    tempoMedioExecucao: 45,
    requisitosPrevios: ['Projeto de Engenharia'],
    equipamentosNecessarios: ['Rolo Compactador', 'Ferramentas Manuais'],
    materiaisComuns: ['Paralelepípedos', 'Areia', 'Cimento'],
  },
  {
    nome: 'Drenagem Pluvial',
    categoria: 'Drenagem',
    descricao: 'Instalação de sistema de drenagem de águas pluviais',
    tempoMedioExecucao: 90,
    requisitosPrevios: ['Projeto Hidráulico', 'Estudo de Escoamento', 'Licença Ambiental'],
    equipamentosNecessarios: ['Retroescavadeira', 'Caminhões'],
    materiaisComuns: ['Tubos de Concreto', 'Grelhas', 'Brita'],
  },
  {
    nome: 'Iluminação Pública LED',
    categoria: 'Iluminação',
    descricao: 'Instalação ou substituição de luminárias LED',
    tempoMedioExecucao: 30,
    requisitosPrevios: ['Projeto Elétrico'],
    equipamentosNecessarios: ['Caminhão com Cesto Aéreo', 'Ferramentas Elétricas'],
    materiaisComuns: ['Luminárias LED', 'Postes', 'Cabos Elétricos'],
  },
  {
    nome: 'Rede de Esgoto',
    categoria: 'Saneamento',
    descricao: 'Instalação de rede coletora de esgoto',
    tempoMedioExecucao: 120,
    requisitosPrevios: ['Projeto de Saneamento', 'Licença Ambiental', 'Estudo de Viabilidade'],
    equipamentosNecessarios: ['Retroescavadeira', 'Caminhões'],
    materiaisComuns: ['Tubos de PVC', 'Caixas de Inspeção', 'Conexões'],
  },
  {
    nome: 'Tapa-Buraco',
    categoria: 'Pavimentação',
    descricao: 'Correção de buracos em vias pavimentadas',
    tempoMedioExecucao: 1,
    requisitosPrevios: [],
    equipamentosNecessarios: ['Compactador Manual', 'Ferramentas Básicas'],
    materiaisComuns: ['Massa Asfáltica', 'Emulsão'],
  },
];

export async function seedTiposObraServico() {
  console.log('   🏗️  Tipos de Obras e Serviços...');

  for (const data of tiposObraServicoData) {
    await prisma.tipoObraServico.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${tiposObraServicoData.length} tipos de obras e serviços criados`);
}

// ========================================
// ESPECIALIDADES MÉDICAS
// ========================================

export const especialidadesMedicasData = [
  {
    nome: 'Clínico Geral',
    descricao: 'Atendimento médico geral e encaminhamentos',
    area: 'Clínica Médica',
    tempoMedioConsulta: 20,
    requisitosPaciente: 'Livre',
    examesComuns: ['Hemograma', 'Glicemia', 'Colesterol'],
  },
  {
    nome: 'Pediatria',
    descricao: 'Atendimento a crianças e adolescentes até 18 anos',
    area: 'Clínica Médica',
    tempoMedioConsulta: 30,
    requisitosPaciente: 'Livre',
    examesComuns: ['Teste do Pezinho', 'Hemograma', 'Parasitológico'],
  },
  {
    nome: 'Ginecologia e Obstetrícia',
    descricao: 'Saúde da mulher e acompanhamento de gestantes',
    area: 'Clínica Médica',
    tempoMedioConsulta: 30,
    requisitosPaciente: 'Livre',
    examesComuns: ['Papanicolau', 'Ultrassom', 'Mamografia'],
  },
  {
    nome: 'Cardiologia',
    descricao: 'Doenças do coração e sistema cardiovascular',
    area: 'Clínica Médica',
    tempoMedioConsulta: 30,
    requisitosPaciente: 'Encaminhamento',
    examesComuns: ['Eletrocardiograma', 'Ecocardiograma', 'Teste Ergométrico'],
  },
  {
    nome: 'Ortopedia',
    descricao: 'Doenças e lesões do sistema musculoesquelético',
    area: 'Cirúrgica',
    tempoMedioConsulta: 30,
    requisitosPaciente: 'Encaminhamento',
    examesComuns: ['Raio-X', 'Ressonância Magnética', 'Tomografia'],
  },
  {
    nome: 'Oftalmologia',
    descricao: 'Doenças e correções da visão',
    area: 'Diagnóstica',
    tempoMedioConsulta: 30,
    requisitosPaciente: 'Encaminhamento',
    examesComuns: ['Exame de Vista', 'Tonometria', 'Mapeamento de Retina'],
  },
  {
    nome: 'Dermatologia',
    descricao: 'Doenças da pele, cabelos e unhas',
    area: 'Clínica Médica',
    tempoMedioConsulta: 20,
    requisitosPaciente: 'Encaminhamento',
    examesComuns: ['Biópsia de Pele', 'Dermatoscopia'],
  },
  {
    nome: 'Psiquiatria',
    descricao: 'Transtornos mentais e emocionais',
    area: 'Clínica Médica',
    tempoMedioConsulta: 45,
    requisitosPaciente: 'Encaminhamento',
    examesComuns: [],
  },
];

export async function seedEspecialidadesMedicas() {
  console.log('   🏥 Especialidades Médicas...');

  for (const data of especialidadesMedicasData) {
    await prisma.especialidadeMedica.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${especialidadesMedicasData.length} especialidades médicas criadas`);
}

// ========================================
// TIPOS DE PRODUÇÃO AGRÍCOLA
// ========================================

export const tiposProducaoAgricolaData = [
  {
    nome: 'Milho',
    categoria: 'Vegetal',
    subcategoria: 'Grãos',
    sazonalidade: { plantio: ['Setembro', 'Outubro', 'Novembro'], colheita: ['Fevereiro', 'Março', 'Abril'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Crédito Rural', 'Seguro Agrícola'],
  },
  {
    nome: 'Feijão',
    categoria: 'Vegetal',
    subcategoria: 'Grãos',
    sazonalidade: { plantio: ['Outubro', 'Novembro'], colheita: ['Fevereiro', 'Março'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Crédito Rural', 'Programa de Sementes'],
  },
  {
    nome: 'Hortaliças',
    categoria: 'Vegetal',
    subcategoria: 'Hortaliças',
    sazonalidade: { plantio: ['Todo o ano'], colheita: ['Todo o ano'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Assistência Técnica', 'Feira do Produtor'],
  },
  {
    nome: 'Frutas Cítricas',
    categoria: 'Vegetal',
    subcategoria: 'Frutas',
    sazonalidade: { plantio: ['Todo o ano (mudas)'], colheita: ['Maio a Setembro'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Crédito Rural', 'Assistência Técnica'],
  },
  {
    nome: 'Pecuária Leiteira',
    categoria: 'Animal',
    subcategoria: 'Pecuária Leiteira',
    sazonalidade: { producao: ['Todo o ano'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Inseminação Artificial', 'Crédito Rural'],
  },
  {
    nome: 'Pecuária de Corte',
    categoria: 'Animal',
    subcategoria: 'Pecuária de Corte',
    sazonalidade: { producao: ['Todo o ano'] },
    assistenciaTecnicaDisponivel: true,
    programasApoio: ['Melhoramento Genético', 'Crédito Rural'],
  },
  {
    nome: 'Avicultura',
    categoria: 'Animal',
    subcategoria: 'Avicultura',
    sazonalidade: { producao: ['Todo o ano'] },
    assistenciaTecnicaDisponivel: false,
    programasApoio: [],
  },
];

export async function seedTiposProducaoAgricola() {
  console.log('   🌾 Tipos de Produção Agrícola...');

  for (const data of tiposProducaoAgricolaData) {
    await prisma.tipoProducaoAgricola.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${tiposProducaoAgricolaData.length} tipos de produção agrícola criados`);
}

// ========================================
// MÁQUINAS AGRÍCOLAS
// ========================================

export const maquinasAgricolasData = [
  {
    tipo: 'Trator',
    modelo: 'Massey Ferguson 4275',
    identificacao: 'MAQ-001',
    status: 'Disponível',
    capacidade: '75 HP',
    potencia: '75 CV',
    horasUso: 1500,
    valorHoraUso: 80.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência', 'Documento da Propriedade Rural'],
  },
  {
    tipo: 'Arado',
    modelo: 'Arado de Disco 3 discos',
    identificacao: 'MAQ-002',
    status: 'Disponível',
    horasUso: 800,
    valorHoraUso: 30.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência'],
  },
  {
    tipo: 'Grade',
    modelo: 'Grade Aradora 32 discos',
    identificacao: 'MAQ-003',
    status: 'Disponível',
    horasUso: 600,
    valorHoraUso: 35.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência'],
  },
  {
    tipo: 'Plantadeira',
    modelo: 'Plantadeira 5 linhas',
    identificacao: 'MAQ-004',
    status: 'Emprestada',
    horasUso: 400,
    valorHoraUso: 50.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência', 'Documento da Propriedade Rural'],
  },
  {
    tipo: 'Colheitadeira',
    modelo: 'New Holland TC57',
    identificacao: 'MAQ-005',
    status: 'Manutenção',
    capacidade: '57 HP',
    potencia: '57 CV',
    horasUso: 2000,
    valorHoraUso: 150.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência', 'Documento da Propriedade Rural', 'Seguro'],
  },
  {
    tipo: 'Pulverizador',
    modelo: 'Pulverizador 600L',
    identificacao: 'MAQ-006',
    status: 'Disponível',
    capacidade: '600 Litros',
    horasUso: 300,
    valorHoraUso: 40.0,
    documentosNecessarios: ['CPF', 'Comprovante de Residência', 'Curso de Aplicação de Agrotóxicos'],
  },
];

export async function seedMaquinasAgricolas() {
  console.log('   🚜 Máquinas Agrícolas...');

  for (const data of maquinasAgricolasData) {
    await prisma.maquinaAgricola.upsert({
      where: { identificacao: data.identificacao },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${maquinasAgricolasData.length} máquinas agrícolas criadas`);
}

// ========================================
// ESPÉCIES DE ÁRVORES
// ========================================

export const especiesArvoreData = [
  {
    nomeComum: 'Ipê Amarelo',
    nomeCientifico: 'Handroanthus chrysotrichus',
    familia: 'Bignoniaceae',
    origem: 'Nativa',
    porte: 'Grande',
    tipoRaiz: 'Pivotante profunda',
    crescimento: 'Médio',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Amarelas, vistosas (agosto-setembro)',
    frutificacao: 'Cápsulas lenhosas',
    cuidadosEspeciais: 'Necessita poda de formação',
    disponibilidadeMudas: 50,
  },
  {
    nomeComum: 'Ipê Roxo',
    nomeCientifico: 'Handroanthus impetiginosus',
    familia: 'Bignoniaceae',
    origem: 'Nativa',
    porte: 'Grande',
    tipoRaiz: 'Pivotante profunda',
    crescimento: 'Médio',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Roxas, vistosas (julho-agosto)',
    frutificacao: 'Cápsulas lenhosas',
    cuidadosEspeciais: 'Necessita poda de formação',
    disponibilidadeMudas: 45,
  },
  {
    nomeComum: 'Pau-brasil',
    nomeCientifico: 'Paubrasilia echinata',
    familia: 'Fabaceae',
    origem: 'Nativa',
    porte: 'Médio',
    tipoRaiz: 'Pivotante',
    crescimento: 'Lento',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Amarelas aromáticas',
    frutificacao: 'Vagens com espinhos',
    cuidadosEspeciais: 'Espécie ameaçada de extinção',
    disponibilidadeMudas: 20,
  },
  {
    nomeComum: 'Jacarandá-mimoso',
    nomeCientifico: 'Jacaranda mimosifolia',
    familia: 'Bignoniaceae',
    origem: 'Exótica',
    porte: 'Médio',
    tipoRaiz: 'Superficial',
    crescimento: 'Rápido',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Lilás/azuladas (primavera)',
    frutificacao: 'Cápsulas',
    cuidadosEspeciais: 'Raízes podem danificar calçadas',
    disponibilidadeMudas: 30,
  },
  {
    nomeComum: 'Sibipiruna',
    nomeCientifico: 'Cenostigma pluviosum',
    familia: 'Fabaceae',
    origem: 'Nativa',
    porte: 'Médio',
    tipoRaiz: 'Superficial',
    crescimento: 'Rápido',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Amarelas (primavera/verão)',
    frutificacao: 'Vagens',
    cuidadosEspeciais: 'Raízes agressivas',
    disponibilidadeMudas: 40,
  },
  {
    nomeComum: 'Quaresmeira',
    nomeCientifico: 'Tibouchina granulosa',
    familia: 'Melastomataceae',
    origem: 'Nativa',
    porte: 'Pequeno',
    tipoRaiz: 'Superficial',
    crescimento: 'Rápido',
    adequadaCalcada: true,
    adequadaParque: true,
    flores: 'Roxas (outono/inverno)',
    frutificacao: 'Cápsulas pequenas',
    cuidadosEspeciais: 'Ideal para calçadas largas',
    disponibilidadeMudas: 60,
  },
  {
    nomeComum: 'Resedá',
    nomeCientifico: 'Lagerstroemia indica',
    familia: 'Lythraceae',
    origem: 'Exótica',
    porte: 'Pequeno',
    tipoRaiz: 'Superficial',
    crescimento: 'Médio',
    adequadaCalcada: true,
    adequadaParque: true,
    flores: 'Rosa, branca ou lilás (verão)',
    frutificacao: 'Cápsulas',
    cuidadosEspeciais: 'Necessita poda anual',
    disponibilidadeMudas: 55,
  },
  {
    nomeComum: 'Aroeira-pimenteira',
    nomeCientifico: 'Schinus molle',
    familia: 'Anacardiaceae',
    origem: 'Exótica',
    porte: 'Médio',
    tipoRaiz: 'Agressiva',
    crescimento: 'Rápido',
    adequadaCalcada: false,
    adequadaParque: true,
    flores: 'Pequenas amareladas',
    frutificacao: 'Frutos róseos (falsa-pimenta-rosa)',
    cuidadosEspeciais: 'Pode causar alergia em pessoas sensíveis',
    disponibilidadeMudas: 25,
  },
];

export async function seedEspeciesArvore() {
  console.log('   🌲 Espécies de Árvores...');

  for (const data of especiesArvoreData) {
    await prisma.especieArvore.upsert({
      where: { nomeComum: data.nomeComum },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${especiesArvoreData.length} espécies de árvores criadas`);
}

// ========================================
// TIPOS DE ESTABELECIMENTOS TURÍSTICOS
// ========================================

export const tiposEstabelecimentoTuristicoData = [
  {
    nome: 'Hotel',
    categoria: 'Hospedagem',
    requisitosLegais: ['Alvará de Funcionamento', 'Licença Sanitária', 'AVCB (Corpo de Bombeiros)'],
    documentosNecessarios: ['CNPJ', 'Contrato Social', 'Planta do Imóvel'],
    classificacao: '1 a 5 estrelas',
    inspectionRequired: true,
  },
  {
    nome: 'Pousada',
    categoria: 'Hospedagem',
    requisitosLegais: ['Alvará de Funcionamento', 'Licença Sanitária'],
    documentosNecessarios: ['CNPJ ou CPF', 'Comprovante de Propriedade'],
    classificacao: 'Categoria Turística',
    inspectionRequired: true,
  },
  {
    nome: 'Restaurante',
    categoria: 'Alimentação',
    requisitosLegais: ['Alvará de Funcionamento', 'Licença Sanitária', 'AVCB'],
    documentosNecessarios: ['CNPJ', 'Responsável Técnico (Nutricionista)'],
    classificacao: 'Tipo de Culinária',
    inspectionRequired: true,
  },
  {
    nome: 'Bar',
    categoria: 'Alimentação',
    requisitosLegais: ['Alvará de Funcionamento', 'Licença Sanitária', 'Licença para Bebidas Alcoólicas'],
    documentosNecessarios: ['CNPJ', 'Comprovante de Propriedade ou Locação'],
    inspectionRequired: true,
  },
  {
    nome: 'Agência de Turismo',
    categoria: 'Serviço',
    requisitosLegais: ['Alvará de Funcionamento', 'Cadastur (Ministério do Turismo)'],
    documentosNecessarios: ['CNPJ', 'Responsável Técnico (Bacharel em Turismo)'],
    inspectionRequired: false,
  },
  {
    nome: 'Guia Turístico',
    categoria: 'Serviço',
    requisitosLegais: ['Cadastur (Ministério do Turismo)', 'Certificação de Guia'],
    documentosNecessarios: ['CPF', 'RG', 'Certificado de Curso de Guia'],
    inspectionRequired: false,
  },
  {
    nome: 'Atração Turística',
    categoria: 'Atração',
    requisitosLegais: ['Alvará de Funcionamento', 'Licença Ambiental (se aplicável)', 'AVCB'],
    documentosNecessarios: ['CNPJ', 'Plano de Segurança'],
    inspectionRequired: true,
  },
];

export async function seedTiposEstabelecimentoTuristico() {
  console.log('   🏨 Tipos de Estabelecimentos Turísticos...');

  for (const data of tiposEstabelecimentoTuristicoData) {
    await prisma.tipoEstabelecimentoTuristico.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${tiposEstabelecimentoTuristicoData.length} tipos de estabelecimentos turísticos criados`);
}

// ========================================
// MODALIDADES ESPORTIVAS
// ========================================

export const modalidadesEsportivasData = [
  {
    nome: 'Futebol',
    categoria: 'Coletivo',
    tipo: 'Campo',
    faixasEtarias: ['Infantil (6-12)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    equipamentosNecessarios: ['Bola', 'Traves', 'Coletes', 'Cones'],
    profissionaisNecessarios: ['Professor de Educação Física', 'Técnico', 'Árbitro'],
  },
  {
    nome: 'Vôlei',
    categoria: 'Coletivo',
    tipo: 'Quadra',
    faixasEtarias: ['Infantil (10-14)', 'Juvenil (15-17)', 'Adulto (18-59)'],
    equipamentosNecessarios: ['Bola', 'Rede', 'Antenas'],
    profissionaisNecessarios: ['Professor de Educação Física', 'Técnico'],
  },
  {
    nome: 'Basquete',
    categoria: 'Coletivo',
    tipo: 'Quadra',
    faixasEtarias: ['Infantil (8-12)', 'Juvenil (13-17)', 'Adulto (18-59)'],
    equipamentosNecessarios: ['Bola', 'Cestas', 'Tabelas'],
    profissionaisNecessarios: ['Professor de Educação Física', 'Técnico', 'Árbitro'],
  },
  {
    nome: 'Natação',
    categoria: 'Individual',
    tipo: 'Piscina',
    faixasEtarias: ['Infantil (6+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    equipamentosNecessarios: ['Piscina', 'Raias', 'Cronômetro'],
    profissionaisNecessarios: ['Professor de Natação', 'Salva-vidas'],
  },
  {
    nome: 'Judô',
    categoria: 'Individual',
    tipo: 'Tatame',
    faixasEtarias: ['Infantil (7-12)', 'Juvenil (13-17)', 'Adulto (18-59)'],
    equipamentosNecessarios: ['Tatame', 'Kimonos'],
    profissionaisNecessarios: ['Professor de Judô (faixa preta)'],
  },
  {
    nome: 'Atletismo',
    categoria: 'Individual',
    tipo: 'Pista',
    faixasEtarias: ['Infantil (10-14)', 'Juvenil (15-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    equipamentosNecessarios: ['Pista', 'Cronômetro', 'Implementos (dardo, peso, disco)'],
    profissionaisNecessarios: ['Professor de Educação Física', 'Técnico'],
  },
];

export async function seedModalidadesEsportivas() {
  console.log('   ⚽ Modalidades Esportivas...');

  for (const data of modalidadesEsportivasData) {
    await prisma.modalidadeEsportiva.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${modalidadesEsportivasData.length} modalidades esportivas criadas`);
}

// ========================================
// TIPOS DE ATIVIDADES CULTURAIS
// ========================================

export const tiposAtividadeCulturalData = [
  {
    nome: 'Dança',
    categoria: 'Artes Cênicas',
    materialNecessario: ['Som', 'Espelho', 'Barra de Ballet (se ballet)'],
    faixasEtarias: ['Infantil (5+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Professor de Dança',
  },
  {
    nome: 'Teatro',
    categoria: 'Artes Cênicas',
    materialNecessario: ['Palco', 'Figurinos', 'Cenários'],
    faixasEtarias: ['Infantil (8+)', 'Juvenil (13-17)', 'Adulto (18-59)'],
    duracaoMedia: 3,
    profissionaisNecessarios: 'Diretor Teatral ou Ator Profissional',
  },
  {
    nome: 'Música (Instrumento)',
    categoria: 'Música',
    materialNecessario: ['Instrumentos Musicais', 'Partituras', 'Estantes'],
    faixasEtarias: ['Infantil (7+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 1,
    profissionaisNecessarios: 'Professor de Música',
  },
  {
    nome: 'Canto Coral',
    categoria: 'Música',
    materialNecessario: ['Partituras', 'Estantes', 'Piano ou Teclado'],
    faixasEtarias: ['Infantil (8+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Regente ou Professor de Música',
  },
  {
    nome: 'Artesanato',
    categoria: 'Artes Visuais',
    materialNecessario: ['Materiais diversos (tecidos, tintas, madeira, etc.)'],
    faixasEtarias: ['Infantil (8+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Artesão Profissional',
  },
  {
    nome: 'Pintura',
    categoria: 'Artes Visuais',
    materialNecessario: ['Tintas', 'Pincéis', 'Telas ou Papel', 'Cavaletes'],
    faixasEtarias: ['Infantil (6+)', 'Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Professor de Artes ou Artista Plástico',
  },
  {
    nome: 'Fotografia',
    categoria: 'Artes Visuais',
    materialNecessario: ['Câmeras', 'Computadores (edição)'],
    faixasEtarias: ['Juvenil (13-17)', 'Adulto (18-59)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Fotógrafo Profissional',
  },
  {
    nome: 'Literatura (Oficina de Escrita)',
    categoria: 'Literatura',
    materialNecessario: ['Material de escrita', 'Livros de referência'],
    faixasEtarias: ['Juvenil (13-17)', 'Adulto (18-59)', 'Sênior (60+)'],
    duracaoMedia: 2,
    profissionaisNecessarios: 'Escritor ou Professor de Literatura',
  },
];

export async function seedTiposAtividadeCultural() {
  console.log('   🎨 Tipos de Atividades Culturais...');

  for (const data of tiposAtividadeCulturalData) {
    await prisma.tipoAtividadeCultural.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${tiposAtividadeCulturalData.length} tipos de atividades culturais criados`);
}

// ========================================
// TIPOS DE OCORRÊNCIAS
// ========================================

export const tiposOcorrenciaData = [
  {
    nome: 'Furto',
    categoria: 'Contra Patrimônio',
    gravidade: 3,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 30,
    equipesCompetentes: ['Patrulha de Prevenção', 'Investigação'],
    procedimentosPadrao: 'Registro do BO, preservação de vestígios, acionamento da perícia',
  },
  {
    nome: 'Roubo',
    categoria: 'Contra Patrimônio',
    gravidade: 5,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 10,
    equipesCompetentes: ['Patrulha de Resposta Rápida', 'Investigação'],
    procedimentosPadrao: 'Atendimento imediato, preservação da cena, acionamento da perícia',
  },
  {
    nome: 'Vandalismo',
    categoria: 'Contra Patrimônio',
    gravidade: 2,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 60,
    equipesCompetentes: ['Patrulha de Prevenção'],
    procedimentosPadrao: 'Registro fotográfico, estimativa de danos',
  },
  {
    nome: 'Perturbação do Sossego',
    categoria: 'Ordem Pública',
    gravidade: 1,
    requererBoletimOcorrencia: false,
    tempoRespostaPadrao: 30,
    equipesCompetentes: ['Patrulha de Prevenção', 'Guarda Municipal'],
    procedimentosPadrao: 'Orientação, advertência verbal, multa (se reincidência)',
  },
  {
    nome: 'Violência Doméstica',
    categoria: 'Contra Pessoa',
    gravidade: 5,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 5,
    equipesCompetentes: ['Patrulha de Resposta Imediata', 'Delegacia da Mulher'],
    procedimentosPadrao: 'Proteção da vítima, medida protetiva, encaminhamento',
  },
  {
    nome: 'Acidente de Trânsito',
    categoria: 'Trânsito',
    gravidade: 3,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 15,
    equipesCompetentes: ['Patrulha de Trânsito', 'SAMU (se vítimas)'],
    procedimentosPadrao: 'Sinalização, atendimento às vítimas, perícia',
  },
  {
    nome: 'Dano ao Patrimônio Público',
    categoria: 'Contra Patrimônio',
    gravidade: 3,
    requererBoletimOcorrencia: true,
    tempoRespostaPadrao: 45,
    equipesCompetentes: ['Patrulha de Prevenção', 'Fiscalização'],
    procedimentosPadrao: 'Registro fotográfico, identificação dos responsáveis, comunicação à Prefeitura',
  },
];

export async function seedTiposOcorrencia() {
  console.log('   🚨 Tipos de Ocorrências...');

  for (const data of tiposOcorrenciaData) {
    await prisma.tipoOcorrencia.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${tiposOcorrenciaData.length} tipos de ocorrências criados`);
}

// ========================================
// CURSOS PROFISSIONALIZANTES
// ========================================

export const cursosProfissionalizantesData = [
  {
    nome: 'Informática Básica',
    categoria: 'Informática',
    area: 'Tecnologia',
    cargaHoraria: 60,
    duracao: 2,
    requisitos: 'Saber ler e escrever',
    certificacao: 'Certificado de Conclusão',
    conteudoProgramatico: {
      modulos: [
        'Introdução à Informática',
        'Windows e Navegação na Internet',
        'Word - Editor de Textos',
        'Excel - Planilhas',
        'PowerPoint - Apresentações',
      ],
    },
    vagas: 25,
    vagasOcupadas: 18,
  },
  {
    nome: 'Corte e Costura',
    categoria: 'Artesanato',
    area: 'Moda e Vestuário',
    cargaHoraria: 120,
    duracao: 4,
    requisitos: 'Ensino Fundamental',
    certificacao: 'Certificado Profissionalizante',
    conteudoProgramatico: {
      modulos: ['Modelagem', 'Corte', 'Costura à Mão', 'Costura à Máquina', 'Acabamento'],
    },
    vagas: 20,
    vagasOcupadas: 20,
  },
  {
    nome: 'Cuidador de Idosos',
    categoria: 'Saúde',
    area: 'Cuidados Pessoais',
    cargaHoraria: 80,
    duracao: 3,
    requisitos: 'Ensino Fundamental, maior de 18 anos',
    certificacao: 'Certificado Profissionalizante',
    conteudoProgramatico: {
      modulos: [
        'Primeiros Socorros',
        'Higiene e Conforto',
        'Nutrição do Idoso',
        'Atividades Terapêuticas',
        'Legislação e Ética',
      ],
    },
    vagas: 30,
    vagasOcupadas: 25,
  },
  {
    nome: 'Auxiliar de Mecânica',
    categoria: 'Mecânica',
    area: 'Automotiva',
    cargaHoraria: 160,
    duracao: 6,
    requisitos: 'Ensino Fundamental, maior de 16 anos',
    certificacao: 'Certificado Profissionalizante',
    conteudoProgramatico: {
      modulos: [
        'Fundamentos de Mecânica',
        'Motor',
        'Suspensão e Direção',
        'Sistema de Freios',
        'Sistema Elétrico',
        'Manutenção Preventiva',
      ],
    },
    vagas: 15,
    vagasOcupadas: 12,
  },
  {
    nome: 'Manicure e Pedicure',
    categoria: 'Beleza',
    area: 'Estética e Beleza',
    cargaHoraria: 40,
    duracao: 1,
    requisitos: 'Maior de 16 anos',
    certificacao: 'Certificado de Conclusão',
    conteudoProgramatico: {
      modulos: ['Técnicas de Manicure', 'Técnicas de Pedicure', 'Higiene e Biossegurança', 'Atendimento ao Cliente'],
    },
    vagas: 20,
    vagasOcupadas: 15,
  },
];

export async function seedCursosProfissionalizantes() {
  console.log('   📚 Cursos Profissionalizantes...');

  for (const data of cursosProfissionalizantesData) {
    await prisma.cursoProfissionalizante.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${cursosProfissionalizantesData.length} cursos profissionalizantes criados`);
}

// ========================================
// PROGRAMAS HABITACIONAIS
// ========================================

export const programasHabitacionaisData = [
  {
    nome: 'Minha Casa Minha Vida',
    descricao: 'Programa federal de aquisição de moradia para famílias de baixa renda',
    tipo: 'Aquisição',
    criteriosElegibilidade: {
      rendaFamiliar: 'Até R$ 8.000,00 mensais',
      primeiroImovel: true,
      requisitos: ['Não possuir financiamento ativo', 'Residir no município há pelo menos 2 anos'],
    },
    rendaMaxima: 8000.0,
    rendaMinima: 0.0,
    documentosNecessarios: [
      'CPF e RG',
      'Comprovante de Renda',
      'Comprovante de Residência',
      'Certidão de Nascimento/Casamento',
      'Inscrição no CadÚnico',
    ],
    beneficiosOferecidos: 'Subsídio de até 95% do valor do imóvel para famílias de menor renda',
    prazoAtendimento: 180,
    orgaoGestor: 'Secretaria Municipal de Habitação',
    legislacao: 'Lei Federal nº 11.977/2009',
  },
  {
    nome: 'Programa de Melhorias Habitacionais',
    descricao: 'Auxílio para reforma e ampliação de moradias',
    tipo: 'Melhoria',
    criteriosElegibilidade: {
      rendaFamiliar: 'Até 3 salários mínimos',
      propriedade: 'Possuir imóvel regular no município',
    },
    rendaMaxima: 4236.0,
    rendaMinima: 0.0,
    documentosNecessarios: [
      'CPF e RG',
      'Comprovante de Propriedade',
      'Comprovante de Renda',
      'Orçamento da Obra',
      'Fotos do Imóvel',
    ],
    beneficiosOferecidos: 'Material de construção ou valor de até R$ 10.000,00',
    prazoAtendimento: 90,
    orgaoGestor: 'Secretaria Municipal de Habitação',
  },
  {
    nome: 'Regularização Fundiária',
    descricao: 'Regularização de imóveis em áreas irregulares',
    tipo: 'Regularização',
    criteriosElegibilidade: {
      situacao: 'Imóvel em área irregular passível de regularização',
      tempo: 'Residir no local há pelo menos 5 anos',
    },
    documentosNecessarios: [
      'CPF e RG',
      'Comprovante de Residência',
      'Declaração de Posse',
      'Contas de Consumo (água, luz)',
    ],
    beneficiosOferecidos: 'Escritura do imóvel sem custos',
    prazoAtendimento: 365,
    orgaoGestor: 'Secretaria Municipal de Habitação',
    legislacao: 'Lei Federal nº 13.465/2017',
  },
];

export async function seedProgramasHabitacionais() {
  console.log('   🏡 Programas Habitacionais...');

  for (const data of programasHabitacionaisData) {
    await prisma.programaHabitacional.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${programasHabitacionaisData.length} programas habitacionais criados`);
}

// ========================================
// PROGRAMAS AMBIENTAIS
// ========================================

export const programasAmbientaisData = [
  {
    nome: 'Programa de Coleta Seletiva',
    descricao: 'Separação e coleta de materiais recicláveis',
    tipo: 'Coleta Seletiva',
    objetivos: 'Reduzir resíduos enviados ao aterro, promover reciclagem, gerar renda para cooperativas',
    metasAnuais: {
      toneladas: 500,
      familias: 5000,
      bairros: 15,
    },
    publicoAlvo: 'Toda a população',
    parcerias: ['Cooperativa de Catadores', 'Empresas de Reciclagem'],
    recursosNecessarios: 'Caminhões coletores, contêineres, material educativo',
    indicadoresMonitoramento: {
      toneladas_coletadas: 0,
      familias_atendidas: 0,
      taxa_reciclagem: 0,
    },
  },
  {
    nome: 'Programa de Arborização Urbana',
    descricao: 'Plantio de árvores em vias públicas e áreas verdes',
    tipo: 'Arborização',
    objetivos: 'Aumentar cobertura arbórea, melhorar qualidade do ar, reduzir ilhas de calor',
    metasAnuais: {
      arvores_plantadas: 1000,
      mudas_distribuidas: 2000,
    },
    publicoAlvo: 'Comunidade em geral',
    parcerias: ['Viveiro Municipal', 'Associações de Bairro'],
    recursosNecessarios: 'Mudas, adubos, ferramentas, equipe técnica',
    indicadoresMonitoramento: {
      arvores_plantadas: 0,
      taxa_sobrevivencia: 0,
      areas_reflorestadas: 0,
    },
  },
  {
    nome: 'Programa de Educação Ambiental',
    descricao: 'Capacitação e sensibilização sobre questões ambientais',
    tipo: 'Educação Ambiental',
    objetivos: 'Conscientizar população, formar multiplicadores, promover práticas sustentáveis',
    metasAnuais: {
      palestras: 50,
      oficinas: 30,
      pessoas_atingidas: 3000,
    },
    publicoAlvo: 'Escolas, associações, comunidade',
    parcerias: ['Secretaria de Educação', 'ONGs Ambientais', 'Universidades'],
    recursosNecessarios: 'Material didático, palestrantes, equipamentos audiovisuais',
    indicadoresMonitoramento: {
      eventos_realizados: 0,
      participantes: 0,
      mudancas_comportamentais: 0,
    },
  },
  {
    nome: 'Programa Rios Limpos',
    descricao: 'Despoluição e revitalização de cursos d\'água',
    tipo: 'Recursos Hídricos',
    objetivos: 'Recuperar qualidade da água, preservar nascentes, combater poluição',
    metasAnuais: {
      km_rios_recuperados: 5,
      nascentes_protegidas: 10,
      esgoto_tratado_adicional: 20,
    },
    publicoAlvo: 'Comunidades ribeirinhas',
    parcerias: ['Companhia de Saneamento', 'Comitê de Bacias', 'Polícia Ambiental'],
    recursosNecessarios: 'Equipamentos de limpeza, análises laboratoriais, fiscalização',
    indicadoresMonitoramento: {
      qualidade_agua: 0,
      km_despoluidos: 0,
      familias_beneficiadas: 0,
    },
  },
];

export async function seedProgramasAmbientais() {
  console.log('   🌱 Programas Ambientais...');

  for (const data of programasAmbientaisData) {
    await prisma.programaAmbiental.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${programasAmbientaisData.length} programas ambientais criados`);
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function seedCategoriasTipos() {
  console.log('\n═══ CATEGORIAS E TIPOS ═══\n');

  await seedProgramasSociais();
  await seedTiposObraServico();
  await seedEspecialidadesMedicas();
  await seedTiposProducaoAgricola();
  await seedMaquinasAgricolas();
  await seedEspeciesArvore();
  await seedTiposEstabelecimentoTuristico();
  await seedModalidadesEsportivas();
  await seedTiposAtividadeCultural();
  await seedTiposOcorrencia();
  await seedCursosProfissionalizantes();
  await seedProgramasHabitacionais();
  await seedProgramasAmbientais();

  console.log('\n✅ Categorias e Tipos criados com sucesso!\n');
}
