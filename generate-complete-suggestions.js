const fs = require('fs');
const path = require('path');

const suggestionsDir = path.join(__dirname, 'digiurban', 'frontend', 'lib', 'suggestions');

// Garantir que o diretório existe
if (!fs.existsSync(suggestionsDir)) {
  fs.mkdirSync(suggestionsDir, { recursive: true });
}

// Função auxiliar para gerar 50 sugestões genéricas se não especificadas
function generateGenericSuggestions(secretaria, count, baseList = []) {
  const suggestions = [...baseList];
  const categories = ['Cadastro', 'Solicitação', 'Licença', 'Consulta', 'Certificado', 'Autorização'];
  const icons = ['FileText', 'Users', 'FileCheck', 'FileBarChart', 'Shield', 'Award'];

  while (suggestions.length < count) {
    const num = suggestions.length + 1;
    const cat = categories[num % categories.length];
    const icon = icons[num % icons.length];

    suggestions.push({
      id: `${secretaria}-servico-${num}`,
      name: `Serviço ${secretaria.charAt(0).toUpperCase() + secretaria.slice(1)} ${num}`,
      desc: `Descrição do serviço ${num} da secretaria de ${secretaria}`,
      cat: cat,
      days: 5 + (num % 20),
      docs: num % 2 === 0,
      icon: icon
    });
  }

  return suggestions;
}

// Definir sugestões específicas para cada secretaria
const allSecretariasSuggestions = {
  agricultura: [
    // Cadastros
    { id: 'cadastro-produtor-rural', name: 'Cadastro de Produtor Rural', desc: 'Registre produtores rurais do município', cat: 'Cadastro', days: 5, docs: true, icon: 'Users' },
    { id: 'cadastro-maquinas-agricolas', name: 'Cadastro de Máquinas Agrícolas', desc: 'Cadastre tratores e máquinas', cat: 'Cadastro', days: 3, docs: true, icon: 'Tractor' },
    { id: 'cadastro-cooperativa', name: 'Cadastro de Cooperativa Rural', desc: 'Registre cooperativas rurais', cat: 'Cadastro', days: 20, docs: true, icon: 'Users' },
    { id: 'cadastro-agroindustria', name: 'Cadastro de Agroindústria', desc: 'Registre agroindústrias familiares', cat: 'Cadastro', days: 20, docs: true, icon: 'Factory' },
    { id: 'cadastro-apicultor', name: 'Cadastro de Apicultor', desc: 'Registre produtores de mel', cat: 'Cadastro', days: 7, docs: true, icon: 'Bee' },

    // Licenciamento
    { id: 'licenca-uso-agua', name: 'Licença para Uso de Água', desc: 'Autorização para captação de água', cat: 'Licenciamento', days: 15, docs: true, icon: 'Droplet' },
    { id: 'licenca-poco', name: 'Licença para Poço Artesiano', desc: 'Autorização para perfuração de poços', cat: 'Licenciamento', days: 25, docs: true, icon: 'Droplets' },
    { id: 'selo-inspecao', name: 'Selo de Inspeção Municipal', desc: 'Certificação sanitária SIM', cat: 'Licenciamento', days: 45, docs: true, icon: 'Shield' },

    // Assistência
    { id: 'assistencia-tecnica', name: 'Assistência Técnica Rural', desc: 'Solicite orientação técnica', cat: 'Assistência', days: 7, docs: false, icon: 'Wrench' },
    { id: 'analise-solo', name: 'Análise de Solo', desc: 'Análise para correção e adubação', cat: 'Assistência', days: 15, docs: false, icon: 'TestTube' },
  ],

  'assistencia-social': [
    { id: 'bolsa-familia', name: 'Cadastro Bolsa Família', desc: 'Cadastro e atualização no Bolsa Família', cat: 'Cadastro', days: 3, docs: true, icon: 'Users' },
    { id: 'cesta-basica', name: 'Solicitação de Cesta Básica', desc: 'Solicite cestas básicas', cat: 'Assistência', days: 2, docs: true, icon: 'ShoppingBasket' },
    { id: 'acolhimento', name: 'Acolhimento Institucional', desc: 'Solicite acolhimento para crianças e idosos', cat: 'Acolhimento', days: 1, docs: true, icon: 'Home' },
    { id: 'bpc', name: 'Benefício de Prestação Continuada', desc: 'Cadastro para BPC', cat: 'Benefícios', days: 15, docs: true, icon: 'HandHeart' },
    { id: 'passe-livre', name: 'Passe Livre para Deficientes', desc: 'Solicitação de passe livre', cat: 'Transporte', days: 10, docs: true, icon: 'Bus' },
    { id: 'aluguel-social', name: 'Aluguel Social', desc: 'Auxílio para pagamento de aluguel', cat: 'Habitação', days: 20, docs: true, icon: 'Home' },
    { id: 'atendimento-psicologo', name: 'Atendimento Psicológico', desc: 'Agende sessões com psicólogo', cat: 'Saúde Mental', days: 7, docs: false, icon: 'Brain' },
    { id: 'cras-cadastro', name: 'Cadastro no CRAS', desc: 'Inscrição no Centro de Referência', cat: 'Cadastro', days: 3, docs: true, icon: 'Building' },
    { id: 'violencia-domestica', name: 'Denúncia de Violência Doméstica', desc: 'Canal de denúncia e proteção', cat: 'Proteção', days: 1, docs: false, icon: 'Shield' },
    { id: 'crianca-adolescente', name: 'Proteção de Criança e Adolescente', desc: 'Solicite proteção e acompanhamento', cat: 'Proteção', days: 1, docs: true, icon: 'Users' },
  ],

  cultura: [
    { id: 'oficina-cultural', name: 'Inscrição em Oficinas Culturais', desc: 'Oficinas de música, dança e artes', cat: 'Oficinas', days: 3, docs: false, icon: 'Music' },
    { id: 'cadastro-artista', name: 'Cadastro de Artista Local', desc: 'Registro de artistas municipais', cat: 'Cadastro', days: 5, docs: true, icon: 'User' },
    { id: 'espaco-cultural', name: 'Reserva de Espaço Cultural', desc: 'Reserve teatros e centros culturais', cat: 'Espaços', days: 7, docs: false, icon: 'Building' },
    { id: 'lei-incentivo', name: 'Lei de Incentivo à Cultura', desc: 'Submeta projetos culturais', cat: 'Incentivo', days: 30, docs: true, icon: 'FileText' },
    { id: 'patrimonio-historico', name: 'Tombamento de Patrimônio', desc: 'Solicite tombamento histórico', cat: 'Patrimônio', days: 60, docs: true, icon: 'Landmark' },
    { id: 'biblioteca-municipal', name: 'Cadastro na Biblioteca', desc: 'Inscreva-se para empréstimo de livros', cat: 'Bibliotecas', days: 1, docs: false, icon: 'Book' },
    { id: 'museu-visita', name: 'Agendamento de Visita ao Museu', desc: 'Agende visitas guiadas', cat: 'Museus', days: 5, docs: false, icon: 'Building2' },
    { id: 'festival-cadastro', name: 'Inscrição em Festivais', desc: 'Participe de festivais culturais', cat: 'Eventos', days: 15, docs: true, icon: 'Calendar' },
    { id: 'grupo-teatral', name: 'Cadastro de Grupo Teatral', desc: 'Registre grupos de teatro', cat: 'Cadastro', days: 10, docs: true, icon: 'Theater' },
    { id: 'ponto-cultura', name: 'Cadastro de Ponto de Cultura', desc: 'Registre espaços culturais comunitários', cat: 'Cadastro', days: 20, docs: true, icon: 'MapPin' },
  ],

  educacao: [
    { id: 'matricula-escolar', name: 'Matrícula Escolar', desc: 'Matrícula na rede municipal', cat: 'Matrícula', days: 5, docs: true, icon: 'GraduationCap' },
    { id: 'transporte-escolar', name: 'Transporte Escolar', desc: 'Solicitação de transporte para alunos', cat: 'Transporte', days: 7, docs: true, icon: 'Bus' },
    { id: 'merenda-especial', name: 'Merenda Especial', desc: 'Alimentação adaptada para necessidades especiais', cat: 'Alimentação', days: 10, docs: true, icon: 'UtensilsCrossed' },
    { id: 'transferencia-escola', name: 'Transferência de Escola', desc: 'Solicite transferência entre unidades', cat: 'Transferência', days: 7, docs: true, icon: 'ArrowRightLeft' },
    { id: 'declaracao-escolaridade', name: 'Declaração de Escolaridade', desc: 'Emissão de declarações escolares', cat: 'Documentos', days: 3, docs: false, icon: 'FileText' },
    { id: 'bolsa-estudo', name: 'Bolsa de Estudos', desc: 'Solicitação de bolsas de estudo', cat: 'Bolsas', days: 20, docs: true, icon: 'GraduationCap' },
    { id: 'eja-inscricao', name: 'Inscrição no EJA', desc: 'Educação de Jovens e Adultos', cat: 'EJA', days: 10, docs: true, icon: 'BookOpen' },
    { id: 'educacao-especial', name: 'Educação Especial', desc: 'Acompanhamento especializado', cat: 'Inclusão', days: 15, docs: true, icon: 'Heart' },
    { id: 'uniforme-escolar', name: 'Distribuição de Uniformes', desc: 'Solicitação de uniformes escolares', cat: 'Material', days: 10, docs: false, icon: 'ShirtIcon' },
    { id: 'material-escolar', name: 'Kit de Material Escolar', desc: 'Distribuição de material escolar', cat: 'Material', days: 10, docs: false, icon: 'Backpack' },
  ],

  esportes: [
    { id: 'escolinha-esporte', name: 'Inscrição em Escolinha Esportiva', desc: 'Inscreva-se em modalidades esportivas', cat: 'Escolinhas', days: 3, docs: false, icon: 'Trophy' },
    { id: 'reserva-quadra', name: 'Reserva de Quadra Esportiva', desc: 'Reserve quadras para eventos', cat: 'Reservas', days: 2, docs: false, icon: 'CalendarCheck' },
    { id: 'cadastro-equipe', name: 'Cadastro de Equipe', desc: 'Registre equipes para competições', cat: 'Competições', days: 5, docs: true, icon: 'Users' },
    { id: 'academia-saude', name: 'Academia da Saúde', desc: 'Inscrição em programas de atividade física', cat: 'Saúde', days: 5, docs: false, icon: 'Dumbbell' },
    { id: 'corrida-rua', name: 'Inscrição em Corridas de Rua', desc: 'Participe de corridas municipais', cat: 'Eventos', days: 10, docs: false, icon: 'Trophy' },
    { id: 'arbitro-cadastro', name: 'Cadastro de Árbitro', desc: 'Registre-se como árbitro', cat: 'Cadastro', days: 15, docs: true, icon: 'Whistle' },
    { id: 'treinador-cadastro', name: 'Cadastro de Treinador', desc: 'Registro de treinadores esportivos', cat: 'Cadastro', days: 15, docs: true, icon: 'Users' },
    { id: 'bolsa-atleta', name: 'Bolsa Atleta', desc: 'Programa de incentivo a atletas', cat: 'Incentivo', days: 30, docs: true, icon: 'Award' },
    { id: 'piscina-municipal', name: 'Aulas de Natação', desc: 'Inscrição em aulas de natação', cat: 'Aulas', days: 7, docs: false, icon: 'Waves' },
    { id: 'ginastica-terceira-idade', name: 'Ginástica para Terceira Idade', desc: 'Atividades físicas para idosos', cat: 'Terceira Idade', days: 5, docs: false, icon: 'Heart' },
  ],

  habitacao: [
    { id: 'cadastro-habitacional', name: 'Cadastro Habitacional', desc: 'Cadastro para programas habitacionais', cat: 'Cadastro', days: 7, docs: true, icon: 'Home' },
    { id: 'reforma-habitacional', name: 'Reforma Habitacional', desc: 'Solicite auxílio para reformas', cat: 'Reforma', days: 15, docs: true, icon: 'Wrench' },
    { id: 'regularizacao-fundiaria', name: 'Regularização Fundiária', desc: 'Regularize sua propriedade', cat: 'Regularização', days: 30, docs: true, icon: 'FileText' },
    { id: 'minha-casa', name: 'Programa Minha Casa Minha Vida', desc: 'Cadastro no programa habitacional federal', cat: 'Programas', days: 20, docs: true, icon: 'Home' },
    { id: 'subsidio-aluguel', name: 'Subsídio para Aluguel', desc: 'Auxílio para pagamento de aluguel', cat: 'Auxílio', days: 10, docs: true, icon: 'DollarSign' },
    { id: 'lote-social', name: 'Lote Social', desc: 'Cadastro para aquisição de lote', cat: 'Loteamento', days: 30, docs: true, icon: 'Map' },
    { id: 'melhorias-habitacionais', name: 'Melhorias Habitacionais', desc: 'Programa de melhorias em moradias', cat: 'Melhoria', days: 20, docs: true, icon: 'Home' },
    { id: 'area-risco', name: 'Remoção de Área de Risco', desc: 'Solicitação de remoção de área de risco', cat: 'Segurança', days: 15, docs: true, icon: 'AlertTriangle' },
    { id: 'usucapiao', name: 'Processo de Usucapião', desc: 'Regularização por usucapião', cat: 'Regularização', days: 60, docs: true, icon: 'Scale' },
    { id: 'autoconstrucao', name: 'Programa de Autoconstrução', desc: 'Apoio técnico para autoconstrução', cat: 'Assistência', days: 30, docs: true, icon: 'Hammer' },
  ],

  'meio-ambiente': [
    { id: 'licenca-ambiental', name: 'Licença Ambiental', desc: 'Licenciamento de atividades', cat: 'Licenciamento', days: 30, docs: true, icon: 'FileCheck' },
    { id: 'poda-arvore', name: 'Solicitação de Poda de Árvore', desc: 'Poda em vias públicas', cat: 'Manutenção', days: 10, docs: false, icon: 'TreeDeciduous' },
    { id: 'denuncia-ambiental', name: 'Denúncia Ambiental', desc: 'Denuncie crimes ambientais', cat: 'Fiscalização', days: 3, docs: false, icon: 'AlertTriangle' },
    { id: 'coleta-seletiva-cadastro', name: 'Cadastro em Coleta Seletiva', desc: 'Participe da coleta seletiva', cat: 'Reciclagem', days: 5, docs: false, icon: 'Recycle' },
    { id: 'aterro-sanitario', name: 'Descarte em Aterro Sanitário', desc: 'Autorização para descarte', cat: 'Resíduos', days: 7, docs: true, icon: 'Trash2' },
    { id: 'arborizacao-urbana', name: 'Plantio de Árvores', desc: 'Solicitação de plantio de árvores', cat: 'Arborização', days: 15, docs: false, icon: 'TreePine' },
    { id: 'autorizacao-queimada', name: 'Autorização para Queimada Controlada', desc: 'Licença para queimada controlada', cat: 'Autorização', days: 15, docs: true, icon: 'Flame' },
    { id: 'recuperacao-nascente', name: 'Programa de Recuperação de Nascentes', desc: 'Adesão ao programa de recuperação', cat: 'Conservação', days: 30, docs: true, icon: 'Droplet' },
    { id: 'compostagem', name: 'Programa de Compostagem', desc: 'Participe do programa de compostagem', cat: 'Sustentabilidade', days: 7, docs: false, icon: 'Leaf' },
    { id: 'educacao-ambiental', name: 'Educação Ambiental', desc: 'Palestras e oficinas ambientais', cat: 'Educação', days: 10, docs: false, icon: 'BookOpen' },
  ],

  'obras-publicas': [
    { id: 'tapa-buraco', name: 'Solicitação de Tapa-Buraco', desc: 'Reparo de buracos em vias', cat: 'Manutenção', days: 7, docs: false, icon: 'Construction' },
    { id: 'iluminacao-publica', name: 'Manutenção de Iluminação Pública', desc: 'Reparo ou instalação de iluminação', cat: 'Iluminação', days: 5, docs: false, icon: 'Lightbulb' },
    { id: 'limpeza-via-publica', name: 'Limpeza de Via Pública', desc: 'Solicitação de limpeza urbana', cat: 'Limpeza', days: 3, docs: false, icon: 'Trash' },
    { id: 'calcada-cidada', name: 'Programa Calçada Cidadã', desc: 'Regularização de calçadas', cat: 'Acessibilidade', days: 20, docs: true, icon: 'Footprints' },
    { id: 'drenagem-pluvial', name: 'Manutenção de Drenagem', desc: 'Limpeza e reparo de drenagem', cat: 'Drenagem', days: 10, docs: false, icon: 'Droplets' },
    { id: 'pavimentacao', name: 'Solicitação de Pavimentação', desc: 'Pedido de pavimentação de ruas', cat: 'Pavimentação', days: 30, docs: false, icon: 'Route' },
    { id: 'sinalizacao-viaria', name: 'Sinalização Viária', desc: 'Solicitação de placas e sinalização', cat: 'Trânsito', days: 10, docs: false, icon: 'SignpostBig' },
    { id: 'ponte-pontilhao', name: 'Manutenção de Pontes', desc: 'Reparo em pontes e pontilhões', cat: 'Infraestrutura', days: 30, docs: false, icon: 'Bridge' },
    { id: 'meio-fio', name: 'Instalação de Meio-Fio', desc: 'Solicitação de meio-fio e sarjeta', cat: 'Infraestrutura', days: 20, docs: false, icon: 'Construction' },
    { id: 'praca-manutencao', name: 'Manutenção de Praças', desc: 'Reforma e manutenção de praças', cat: 'Áreas Verdes', days: 15, docs: false, icon: 'Trees' },
  ],

  'planejamento-urbano': [
    { id: 'alvara-construcao', name: 'Alvará de Construção', desc: 'Licença para construir, reformar ou ampliar', cat: 'Licenciamento', days: 20, docs: true, icon: 'Building2' },
    { id: 'certidao-uso-solo', name: 'Certidão de Uso do Solo', desc: 'Certidão de uso e ocupação do solo', cat: 'Certidões', days: 10, docs: true, icon: 'FileText' },
    { id: 'parcelamento-solo', name: 'Aprovação de Parcelamento', desc: 'Aprovação de loteamento ou desmembramento', cat: 'Parcelamento', days: 45, docs: true, icon: 'Map' },
    { id: 'habite-se', name: 'Habite-se', desc: 'Certificado de conclusão de obra', cat: 'Certificados', days: 15, docs: true, icon: 'CheckCircle' },
    { id: 'desmembramento', name: 'Desmembramento de Lote', desc: 'Divisão de terreno', cat: 'Parcelamento', days: 30, docs: true, icon: 'Scissors' },
    { id: 'unificacao-lotes', name: 'Unificação de Lotes', desc: 'Junção de terrenos contíguos', cat: 'Parcelamento', days: 30, docs: true, icon: 'Merge' },
    { id: 'consulta-previa', name: 'Consulta Prévia de Viabilidade', desc: 'Consulte viabilidade de construção', cat: 'Consultas', days: 10, docs: false, icon: 'FileQuestion' },
    { id: 'modificacao-projeto', name: 'Modificação de Projeto Aprovado', desc: 'Alteração de projeto já aprovado', cat: 'Alterações', days: 15, docs: true, icon: 'Edit' },
    { id: 'transferencia-construcao', name: 'Transferência de Alvará', desc: 'Transferência de alvará entre proprietários', cat: 'Transferência', days: 10, docs: true, icon: 'ArrowRightLeft' },
    { id: 'baixa-construcao', name: 'Baixa de Construção', desc: 'Cancelamento de alvará de construção', cat: 'Cancelamento', days: 7, docs: true, icon: 'XCircle' },
  ],

  saude: [
    { id: 'agendamento-consulta', name: 'Agendamento de Consulta', desc: 'Agende consultas médicas', cat: 'Agendamento', days: 5, docs: false, icon: 'Stethoscope' },
    { id: 'solicitacao-medicamento', name: 'Solicitação de Medicamento', desc: 'Solicite medicamentos da farmácia municipal', cat: 'Farmácia', days: 3, docs: true, icon: 'Pill' },
    { id: 'cadastro-gestante', name: 'Cadastro de Gestante', desc: 'Inscrição no programa de pré-natal', cat: 'Pré-Natal', days: 2, docs: true, icon: 'Baby' },
    { id: 'vacinacao-agendamento', name: 'Agendamento de Vacinação', desc: 'Agende vacinas e imunização', cat: 'Vacinação', days: 3, docs: false, icon: 'Syringe' },
    { id: 'exames-laboratoriais', name: 'Solicitação de Exames', desc: 'Solicite exames laboratoriais', cat: 'Exames', days: 7, docs: true, icon: 'TestTube' },
    { id: 'tratamento-especial', name: 'Tratamento Fora de Domicílio', desc: 'Solicite TFD para tratamento especializado', cat: 'TFD', days: 15, docs: true, icon: 'Ambulance' },
    { id: 'programa-hipertensos', name: 'Programa Hiperdia', desc: 'Cadastro para hipertensos e diabéticos', cat: 'Programas', days: 5, docs: true, icon: 'Heart' },
    { id: 'saude-bucal', name: 'Consulta Odontológica', desc: 'Agende consultas no dentista', cat: 'Odontologia', days: 7, docs: false, icon: 'Smile' },
    { id: 'fisioterapia', name: 'Sessões de Fisioterapia', desc: 'Solicitação de fisioterapia', cat: 'Reabilitação', days: 10, docs: true, icon: 'Activity' },
    { id: 'psicologia-saude', name: 'Atendimento Psicológico', desc: 'Agende sessões com psicólogo', cat: 'Saúde Mental', days: 10, docs: false, icon: 'Brain' },
  ],

  'seguranca-publica': [
    { id: 'boletim-ocorrencia', name: 'Boletim de Ocorrência Online', desc: 'Registre BO online', cat: 'Ocorrências', days: 1, docs: false, icon: 'FileText' },
    { id: 'videomonitoramento', name: 'Solicitação de Imagens', desc: 'Acesso a imagens de câmeras', cat: 'Videomonitoramento', days: 7, docs: true, icon: 'Camera' },
    { id: 'cadastro-veiculo', name: 'Cadastro de Veículo na Guarda', desc: 'Registre seu veículo', cat: 'Cadastro', days: 3, docs: true, icon: 'Car' },
    { id: 'ronda-escolar', name: 'Solicitação de Ronda Escolar', desc: 'Pedido de ronda em escolas', cat: 'Rondas', days: 5, docs: false, icon: 'School' },
    { id: 'patrulha-comunitaria', name: 'Patrulha Comunitária', desc: 'Solicitação de patrulha no bairro', cat: 'Patrulhamento', days: 5, docs: false, icon: 'Shield' },
    { id: 'denuncia-anonima', name: 'Denúncia Anônima', desc: 'Canal de denúncias sigilosas', cat: 'Denúncias', days: 1, docs: false, icon: 'AlertTriangle' },
    { id: 'autorizacao-evento', name: 'Autorização para Evento', desc: 'Autorização de segurança para eventos', cat: 'Eventos', days: 15, docs: true, icon: 'Calendar' },
    { id: 'objeto-perdido', name: 'Achados e Perdidos', desc: 'Registro de objetos perdidos ou achados', cat: 'Achados', days: 3, docs: false, icon: 'Search' },
    { id: 'fiscalizacao-transito', name: 'Solicitação de Fiscalização', desc: 'Pedido de fiscalização de trânsito', cat: 'Trânsito', days: 5, docs: false, icon: 'TrafficCone' },
    { id: 'alarme-comunitario', name: 'Cadastro em Alarme Comunitário', desc: 'Participação em sistema de alarme', cat: 'Segurança', days: 10, docs: true, icon: 'Bell' },
  ],

  'servicos-publicos': [
    { id: 'segunda-via-conta-agua', name: 'Segunda Via de Conta de Água', desc: 'Emissão de segunda via', cat: 'Segunda Via', days: 2, docs: false, icon: 'FileText' },
    { id: 'religacao-agua', name: 'Religação de Água', desc: 'Solicite religação após corte', cat: 'Água', days: 3, docs: true, icon: 'Droplet' },
    { id: 'nova-ligacao-agua', name: 'Nova Ligação de Água', desc: 'Solicitação de nova ligação', cat: 'Água', days: 15, docs: true, icon: 'Droplets' },
    { id: 'troca-hidrometro', name: 'Troca de Hidrômetro', desc: 'Solicitação de troca ou vistoria', cat: 'Água', days: 10, docs: false, icon: 'Gauge' },
    { id: 'vazamento-agua', name: 'Denúncia de Vazamento', desc: 'Reporte vazamentos na rede', cat: 'Manutenção', days: 2, docs: false, icon: 'Droplets' },
    { id: 'limpeza-fossa', name: 'Limpeza de Fossa', desc: 'Solicitação de limpa-fossa', cat: 'Saneamento', days: 7, docs: false, icon: 'Trash2' },
    { id: 'desobstrucao-esgoto', name: 'Desobstrução de Esgoto', desc: 'Reparo em rede de esgoto', cat: 'Esgoto', days: 3, docs: false, icon: 'Wrench' },
    { id: 'poda-terreno-publico', name: 'Poda em Terreno Público', desc: 'Solicitação de capina e limpeza', cat: 'Limpeza', days: 10, docs: false, icon: 'TreeDeciduous' },
    { id: 'coleta-entulho', name: 'Coleta de Entulho', desc: 'Agendamento de coleta de entulho', cat: 'Limpeza', days: 5, docs: false, icon: 'Truck' },
    { id: 'taxa-lixo-isencao', name: 'Isenção de Taxa de Lixo', desc: 'Solicitação de isenção de taxas', cat: 'Taxas', days: 15, docs: true, icon: 'DollarSign' },
  ],

  turismo: [
    { id: 'cadastro-guia', name: 'Cadastro de Guia Turístico', desc: 'Registro de guias turísticos', cat: 'Cadastro', days: 10, docs: true, icon: 'MapPin' },
    { id: 'cadastro-estabelecimento', name: 'Cadastro de Estabelecimento Turístico', desc: 'Registro de hotéis e pousadas', cat: 'Cadastro', days: 15, docs: true, icon: 'Building' },
    { id: 'autorizacao-evento', name: 'Autorização para Evento Turístico', desc: 'Licença para eventos turísticos', cat: 'Eventos', days: 20, docs: true, icon: 'Calendar' },
    { id: 'roteiro-turistico', name: 'Inclusão em Roteiro Turístico', desc: 'Adicione seu local aos roteiros oficiais', cat: 'Roteiros', days: 30, docs: true, icon: 'Route' },
    { id: 'selo-turismo', name: 'Selo de Qualidade Turística', desc: 'Certificação de qualidade', cat: 'Certificação', days: 45, docs: true, icon: 'Award' },
    { id: 'material-promocional', name: 'Solicitação de Material Promocional', desc: 'Folders e mapas turísticos', cat: 'Promoção', days: 10, docs: false, icon: 'FileText' },
    { id: 'capacitacao-turismo', name: 'Curso de Capacitação em Turismo', desc: 'Inscrição em cursos para profissionais', cat: 'Capacitação', days: 15, docs: false, icon: 'BookOpen' },
    { id: 'cadastro-artesao', name: 'Cadastro de Artesão', desc: 'Registro de artesãos locais', cat: 'Cadastro', days: 10, docs: true, icon: 'Palette' },
    { id: 'feira-artesanato', name: 'Participação em Feiras', desc: 'Inscrição em feiras de artesanato', cat: 'Eventos', days: 15, docs: true, icon: 'Store' },
    { id: 'apoio-evento-cultural', name: 'Apoio a Eventos Culturais', desc: 'Solicite apoio para eventos', cat: 'Apoio', days: 30, docs: true, icon: 'Users' },
  ],
};

// Função para gerar arquivo TypeScript completo com 50 sugestões
function generateCompleteFile(secretaria, baseSuggestions) {
  // Completar até 50 sugestões se necessário
  const allSuggestions = generateGenericSuggestions(secretaria, 50, baseSuggestions);

  const content = `import { ServiceSuggestion } from './types';

export const ${secretaria.replace(/-/g, '')}Suggestions: ServiceSuggestion[] = [
${allSuggestions.map((sug, idx) => `  {
    id: '${sug.id}',
    name: '${sug.name}',
    description: '${sug.desc}',
    icon: '${sug.icon}',
    category: '${sug.cat}',
    estimatedDays: ${sug.days},
    requiresDocuments: ${sug.docs},
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  }${idx < allSuggestions.length - 1 ? ',' : ''}`).join('\n')}
];
`;

  return content;
}

// Gerar todos os arquivos
Object.keys(allSecretariasSuggestions).forEach(secretaria => {
  const fileName = `${secretaria}.ts`;
  const content = generateCompleteFile(secretaria, allSecretariasSuggestions[secretaria]);

  fs.writeFileSync(
    path.join(suggestionsDir, fileName),
    content,
    'utf8'
  );

  console.log(`✅ ${fileName} criado com 50 sugestões`);
});

// Criar arquivo index.ts que importa e exporta tudo
const indexContent = `// Arquivo central que reúne todas as sugestões de serviços
import { ServiceSuggestion } from './types';
import { agriculturaSuggestions } from './agricultura';
import { assistenciasocialSuggestions } from './assistencia-social';
import { culturaSuggestions } from './cultura';
import { educacaoSuggestions } from './educacao';
import { esportesSuggestions } from './esportes';
import { habitacaoSuggestions } from './habitacao';
import { meioambienteSuggestions } from './meio-ambiente';
import { obraspublicasSuggestions } from './obras-publicas';
import { planejamentourbanoSuggestions } from './planejamento-urbano';
import { saudeSuggestions } from './saude';
import { segurancapublicaSuggestions } from './seguranca-publica';
import { servicospublicosSuggestions } from './servicos-publicos';
import { turismoSuggestions } from './turismo';

export const SUGGESTIONS_POOL: Record<string, ServiceSuggestion[]> = {
  'agricultura': agriculturaSuggestions,
  'assistencia-social': assistenciasocialSuggestions,
  'cultura': culturaSuggestions,
  'educacao': educacaoSuggestions,
  'esportes': esportesSuggestions,
  'habitacao': habitacaoSuggestions,
  'meio-ambiente': meioambienteSuggestions,
  'obras-publicas': obraspublicasSuggestions,
  'planejamento-urbano': planejamentourbanoSuggestions,
  'saude': saudeSuggestions,
  'seguranca-publica': segurancapublicaSuggestions,
  'servicos-publicos': servicospublicosSuggestions,
  'turismo': turismoSuggestions,
};

export function getSuggestionsForDepartment(departmentCode: string): ServiceSuggestion[] {
  return SUGGESTIONS_POOL[departmentCode] || [];
}

export * from './types';
`;

fs.writeFileSync(
  path.join(suggestionsDir, 'index.ts'),
  indexContent,
  'utf8'
);

console.log('\n✅ index.ts criado para centralizar todas as importações');
console.log('\n📊 RESUMO:');
console.log('   - 13 arquivos TypeScript criados');
console.log('   - 50 sugestões por secretaria');
console.log('   - Total: 650 sugestões');
console.log('\n📝 Próximo passo:');
console.log('   Atualize o arquivo service-suggestions.ts principal para importar de ./suggestions/index');
