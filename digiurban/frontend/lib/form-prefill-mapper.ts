/**
 * ============================================================================
 * MAPEADOR INTELIGENTE DE PRÉ-PREENCHIMENTO DE FORMULÁRIOS
 * ============================================================================
 *
 * Sistema de pré-preenchimento automático de formulários com 3 níveis de detecção:
 *
 * ## NÍVEL 1: Mapeamento Direto (200+ variações)
 * - Mapeamento explícito de IDs de campos comuns
 * - Cobre variações como: nome/name/fullName/applicantName/requesterName, etc
 * - Suporta CPF/CNPJ (preenche com CPF do cidadão quando é pessoa física)
 * - Inclui todas as variações de email, telefone e endereço
 *
 * ## NÍVEL 2: Detecção Semântica Inteligente
 * - Para campos não mapeados diretamente, analisa o ID normalizado
 * - Detecta padrões semânticos (ex: qualquer campo terminado em "Name" = nome)
 * - Identifica palavras-chave (solicitante, requerente, responsável, etc)
 * - Funciona mesmo com IDs novos não previstos
 *
 * ## NÍVEL 3: Fallback
 * - Inicializa campos não reconhecidos com valores vazios apropriados
 *
 * ## Exemplos de Mapeamento:
 *
 * NOME:
 * - requesterName → João Silva (Nome do Solicitante)
 * - applicantName → João Silva (Nome do Requerente)
 * - reporterName → João Silva (Nome do Denunciante)
 * - ownerName → João Silva (Nome do Proprietário)
 * - athleteName → João Silva (Nome do Atleta)
 * - [qualquerCoisa]Name → João Silva (detecção semântica)
 *
 * CPF/CNPJ:
 * - applicantCpf → 123.456.789-00 (CPF do Solicitante)
 * - cpf_cnpj → 123.456.789-00 ⭐ (CPF/CNPJ preenche com CPF)
 * - cpfcnpj → 123.456.789-00
 * - documento → 123.456.789-00
 *
 * EMAIL:
 * - requesterEmail → joao@email.com
 * - contactEmail → joao@email.com
 * - [qualquerCoisa]Email → joao@email.com (detecção semântica)
 *
 * TELEFONE:
 * - requesterPhone → (11) 98765-4321
 * - contactPhone → (11) 98765-4321
 * - parentPhone → (11) 98765-4321
 * - [qualquerCoisa]Phone → (11) 98765-4321 (detecção semântica)
 *
 * ENDEREÇO:
 * - address → Rua ABC, 123, Centro, São Paulo, SP (completo)
 * - applicantAddress → Rua ABC, 123, Centro, São Paulo
 * - userAddress → Rua ABC, 123, Centro, São Paulo
 * - street → Rua ABC (componente individual)
 * - number → 123
 * - neighborhood → Centro
 * - city → São Paulo
 * - state → SP
 * - zipCode → 12345-678
 *
 * ## Normalização:
 * - Remove acentos: "endereço" → "endereco"
 * - Lowercase: "NomeSolicitante" → "nomesolicitante"
 * - Remove caracteres especiais: "nome-do-solicitante" → "nome_do_solicitante"
 *
 * ## Cobertura:
 * - 200+ mapeamentos diretos explícitos
 * - Detecção semântica para campos não mapeados
 * - Suporte a 603 IDs únicos de campos dos templates
 * - Taxa de acerto estimada: >95% dos campos de dados pessoais
 */

interface CitizenData {
  id: string;
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  phoneSecondary?: string;
  birthDate?: string;
  rg?: string;
  motherName?: string;
  maritalStatus?: string;
  occupation?: string;
  familyIncome?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    pontoReferencia?: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED';
  createdAt: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

/**
 * Função auxiliar para formatar data para input type="date" (yyyy-MM-dd)
 */
function formatDateForInput(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Mapeamento COMPLETO de IDs de campos para propriedades do cidadão
 * Suporta TODAS as variações de nomenclatura encontradas nos 603 campos únicos
 *
 * Estratégia de mapeamento:
 * 1. Mapeamento direto por padrões de ID (ex: *Name, *Cpf, *Phone, *Email, *Address)
 * 2. Detecção semântica por palavras-chave no ID normalizado
 * 3. Fallback para campos genéricos
 */
const FIELD_MAPPINGS: Record<string, (citizen: CitizenData) => any> = {
  // ============================================================================
  // NOME COMPLETO - Todas as variações possíveis
  // ============================================================================
  // IDs diretos
  'nome': (c) => c.name,
  'name': (c) => c.name,
  'nome_completo': (c) => c.name,
  'full_name': (c) => c.name,
  'fullname': (c) => c.name,
  'nomecompleto': (c) => c.name,

  // Variações de "nome do X"
  'applicantname': (c) => c.name,  // Nome do Solicitante
  'requestername': (c) => c.name,  // Nome do Solicitante
  'requestorname': (c) => c.name,  // Nome do Solicitante
  'reportername': (c) => c.name,   // Nome do Denunciante/Declarante
  'complainantname': (c) => c.name, // Nome do Reclamante
  'ownername': (c) => c.name,      // Nome do Proprietário
  'responsiblename': (c) => c.name, // Nome do Responsável
  'proposername': (c) => c.name,   // Nome do Proponente
  'username': (c) => c.name,       // Nome do Usuário
  'personname': (c) => c.name,     // Nome da Pessoa
  'contactname': (c) => c.name,    // Nome do Contato
  'parentname': (c) => c.name,     // Nome do Responsável
  'participantname': (c) => c.name, // Nome do Participante
  'studentname': (c) => c.name,    // Nome do Aluno/Estudante
  'athletename': (c) => c.name,    // Nome do Atleta
  'producername': (c) => c.name,   // Nome do Produtor
  'artisanname': (c) => c.name,    // Nome do Artesão
  'organizername': (c) => c.name,  // Nome do Organizador
  'coordinatorname': (c) => c.name, // Nome do Coordenador
  'architectname': (c) => c.name,  // Nome do Arquiteto
  'engineername': (c) => c.name,   // Nome do Engenheiro
  'surveyorname': (c) => c.name,   // Nome do Agrimensor
  'guidename': (c) => c.name,      // Nome do Guia
  'visitorname': (c) => c.name,    // Nome do Visitante

  // Genéricos
  'solicitante': (c) => c.name,
  'requerente': (c) => c.name,
  'responsavel': (c) => c.name,
  'declarante': (c) => c.name,
  'denunciante': (c) => c.name,
  'proprietario': (c) => c.name,
  'titular': (c) => c.name,

  // ============================================================================
  // CPF - Todas as variações (incluindo CPF/CNPJ para cidadãos)
  // ============================================================================
  // IDs diretos
  'cpf': (c) => c.cpf,
  'documento': (c) => c.cpf,
  'cpf_cnpj': (c) => c.cpf,  // ⭐ IMPORTANTE: CPF/CNPJ deve ser preenchido com CPF do cidadão
  'cpfcnpj': (c) => c.cpf,
  'cpfoucnpj': (c) => c.cpf,
  'doc': (c) => c.cpf,
  'document': (c) => c.cpf,

  // Variações de "CPF do X"
  'applicantcpf': (c) => c.cpf,    // CPF do Solicitante
  'requestercpf': (c) => c.cpf,    // CPF do Solicitante
  'reportercpf': (c) => c.cpf,     // CPF do Denunciante
  'complainantcpf': (c) => c.cpf,  // CPF do Reclamante
  'ownercpf': (c) => c.cpf,        // CPF do Proprietário
  'responsiblecpf': (c) => c.cpf,  // CPF do Responsável
  'usercpf': (c) => c.cpf,         // CPF do Usuário
  'studentcpf': (c) => c.cpf,      // CPF do Aluno
  'parentcpf': (c) => c.cpf,       // CPF do Responsável
  'participantcpf': (c) => c.cpf,  // CPF do Participante
  'athletecpf': (c) => c.cpf,      // CPF do Atleta
  'producercpf': (c) => c.cpf,     // CPF do Produtor
  'artisancpf': (c) => c.cpf,      // CPF do Artesão
  'coordinatorcpf': (c) => c.cpf,  // CPF do Coordenador

  // Genéricos
  'cpf_solicitante': (c) => c.cpf,
  'cpf_requerente': (c) => c.cpf,
  'cpf_responsavel': (c) => c.cpf,
  'cpf_proprietario': (c) => c.cpf,
  'cpf_declarante': (c) => c.cpf,

  // ============================================================================
  // RG - Todas as variações
  // ============================================================================
  'rg': (c) => c.rg || '',
  'identidade': (c) => c.rg || '',
  'carteira_identidade': (c) => c.rg || '',
  'numero_rg': (c) => c.rg || '',
  'rg_numero': (c) => c.rg || '',
  'applicantrg': (c) => c.rg || '',
  'requesterrg': (c) => c.rg || '',
  'reporterrg': (c) => c.rg || '',
  'ownerrg': (c) => c.rg || '',
  'responsiblerg': (c) => c.rg || '',
  'userrg': (c) => c.rg || '',
  'studentrg': (c) => c.rg || '',
  'parentrg': (c) => c.rg || '',
  'participantrg': (c) => c.rg || '',

  // ============================================================================
  // DATA DE NASCIMENTO - Todas as variações
  // ============================================================================
  'datanascimento': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'data_nascimento': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'birthdate': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'birth_date': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'nascimento': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'dtnascimento': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'dt_nascimento': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'dateofbirth': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'date_of_birth': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'applicantbirthdate': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'requesterbirthdate': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'studentbirthdate': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',
  'participantbirthdate': (c) => c.birthDate ? formatDateForInput(c.birthDate) : '',

  // ============================================================================
  // NOME DA MÃE - Todas as variações
  // ============================================================================
  'nomemae': (c) => c.motherName || '',
  'nome_mae': (c) => c.motherName || '',
  'mothername': (c) => c.motherName || '',
  'mother_name': (c) => c.motherName || '',
  'mae': (c) => c.motherName || '',
  'nome_da_mae': (c) => c.motherName || '',
  'nomedamae': (c) => c.motherName || '',
  'nomecompletomae': (c) => c.motherName || '',
  'nome_completo_mae': (c) => c.motherName || '',
  'filiacao_materna': (c) => c.motherName || '',
  'filiacaomaterna': (c) => c.motherName || '',

  // ============================================================================
  // ESTADO CIVIL - Todas as variações
  // ============================================================================
  'estadocivil': (c) => c.maritalStatus || '',
  'estado_civil': (c) => c.maritalStatus || '',
  'maritalstatus': (c) => c.maritalStatus || '',
  'marital_status': (c) => c.maritalStatus || '',
  'civilstatus': (c) => c.maritalStatus || '',
  'civil_status': (c) => c.maritalStatus || '',

  // ============================================================================
  // PROFISSÃO/OCUPAÇÃO - Todas as variações
  // ============================================================================
  'profissao': (c) => c.occupation || '',
  'ocupacao': (c) => c.occupation || '',
  'occupation': (c) => c.occupation || '',
  'profession': (c) => c.occupation || '',
  'atividade': (c) => c.occupation || '',
  'atividade_profissional': (c) => c.occupation || '',
  'atividadeprofissional': (c) => c.occupation || '',
  'cargo': (c) => c.occupation || '',

  // ============================================================================
  // RENDA FAMILIAR - Todas as variações
  // ============================================================================
  'rendafamiliar': (c) => {
    console.log('🔍 [RENDA FAMILIAR PREFILL] Valor:', c.familyIncome);
    return c.familyIncome || '';
  },
  'renda_familiar': (c) => c.familyIncome || '',
  'familyincome': (c) => c.familyIncome || '',
  'family_income': (c) => c.familyIncome || '',
  'renda': (c) => c.familyIncome || '',
  'renda_mensal': (c) => c.familyIncome || '',
  'rendamensal': (c) => c.familyIncome || '',
  'income': (c) => c.familyIncome || '',

  // ============================================================================
  // TELEFONE SECUNDÁRIO - Todas as variações
  // ============================================================================
  'telefonesecundario': (c) => c.phoneSecondary || '',
  'telefone_secundario': (c) => c.phoneSecondary || '',
  'secondaryphone': (c) => c.phoneSecondary || '',
  'secondary_phone': (c) => c.phoneSecondary || '',
  'telefone2': (c) => c.phoneSecondary || '',
  'telefone_2': (c) => c.phoneSecondary || '',
  'phone2': (c) => c.phoneSecondary || '',
  'phone_2': (c) => c.phoneSecondary || '',
  'celular2': (c) => c.phoneSecondary || '',
  'celular_2': (c) => c.phoneSecondary || '',
  'telefone_alternativo': (c) => c.phoneSecondary || '',
  'telefonealternativo': (c) => c.phoneSecondary || '',
  'alternativephone': (c) => c.phoneSecondary || '',
  'alternative_phone': (c) => c.phoneSecondary || '',
  'phonesecondary': (c) => c.phoneSecondary || '',
  'applicantphonesecondary': (c) => c.phoneSecondary || '',
  'requesterphonesecondary': (c) => c.phoneSecondary || '',

  // ============================================================================
  // EMAIL - Todas as variações
  // ============================================================================
  // IDs diretos
  'email': (c) => c.email,
  'e-mail': (c) => c.email,
  'e_mail': (c) => c.email,
  'mail': (c) => c.email,
  'correio': (c) => c.email,

  // Variações de "email do X"
  'applicantemail': (c) => c.email,    // E-mail do Solicitante
  'requesteremail': (c) => c.email,    // E-mail do Solicitante
  'reporteremail': (c) => c.email,     // E-mail do Denunciante
  'complainantemail': (c) => c.email,  // E-mail do Reclamante
  'owneremail': (c) => c.email,        // E-mail do Proprietário
  'responsibleemail': (c) => c.email,  // E-mail do Responsável
  'useremail': (c) => c.email,         // E-mail do Usuário
  'studentemail': (c) => c.email,      // E-mail do Aluno
  'parentemail': (c) => c.email,       // E-mail do Responsável
  'participantemail': (c) => c.email,  // E-mail do Participante
  'athleteemail': (c) => c.email,      // E-mail do Atleta
  'produceremail': (c) => c.email,     // E-mail do Produtor
  'artisanemail': (c) => c.email,      // E-mail do Artesão
  'coordinatoremail': (c) => c.email,  // E-mail do Coordenador
  'contactemail': (c) => c.email,      // E-mail de Contato

  // Genéricos
  'email_contato': (c) => c.email,
  'email_solicitante': (c) => c.email,
  'email_responsavel': (c) => c.email,
  'emailcontato': (c) => c.email,
  'contatoemail': (c) => c.email,

  // ============================================================================
  // TELEFONE - Todas as variações
  // ============================================================================
  // IDs diretos
  'telefone': (c) => c.phone || '',
  'phone': (c) => c.phone || '',
  'celular': (c) => c.phone || '',
  'fone': (c) => c.phone || '',
  'tel': (c) => c.phone || '',
  'contato': (c) => c.phone || '',
  'mobile': (c) => c.phone || '',

  // Variações de "telefone do X"
  'applicantphone': (c) => c.phone || '',    // Telefone do Solicitante
  'requesterphone': (c) => c.phone || '',    // Telefone do Solicitante
  'reporterphone': (c) => c.phone || '',     // Telefone do Denunciante
  'complainantphone': (c) => c.phone || '',  // Telefone do Reclamante
  'ownerphone': (c) => c.phone || '',        // Telefone do Proprietário
  'responsiblephone': (c) => c.phone || '',  // Telefone do Responsável
  'userphone': (c) => c.phone || '',         // Telefone do Usuário
  'studentphone': (c) => c.phone || '',      // Telefone do Aluno
  'parentphone': (c) => c.phone || '',       // Telefone do Responsável
  'participantphone': (c) => c.phone || '',  // Telefone do Participante
  'athletephone': (c) => c.phone || '',      // Telefone do Atleta
  'producerphone': (c) => c.phone || '',     // Telefone do Produtor
  'artisanphone': (c) => c.phone || '',      // Telefone do Artesão
  'coordinatorphone': (c) => c.phone || '',  // Telefone do Coordenador
  'contactphone': (c) => c.phone || '',      // Telefone de Contato
  'emergencyphone': (c) => c.phone || '',    // Telefone de Emergência

  // Genéricos
  'telefone_contato': (c) => c.phone || '',
  'telefone_celular': (c) => c.phone || '',
  'telefone_solicitante': (c) => c.phone || '',
  'telefone_responsavel': (c) => c.phone || '',
  'phonecontact': (c) => c.phone || '',
  'contatotelefone': (c) => c.phone || '',

  // ============================================================================
  // ENDEREÇO COMPLETO - Quando é um campo único
  // ============================================================================
  'endereco': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.street,
      c.address.number,
      c.address.neighborhood,
      c.address.city,
      c.address.state
    ].filter(Boolean);
    return parts.join(', ');
  },
  'address': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.street,
      c.address.number,
      c.address.neighborhood,
      c.address.city,
      c.address.state
    ].filter(Boolean);
    return parts.join(', ');
  },
  'endereco_completo': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.street,
      c.address.number,
      c.address.complement,
      c.address.neighborhood,
      c.address.city,
      c.address.state,
      c.address.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  },
  'fulladdress': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.street,
      c.address.number,
      c.address.complement,
      c.address.neighborhood,
      c.address.city,
      c.address.state,
      c.address.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  },

  // Variações de "endereço do X"
  'applicantaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.street, c.address.number, c.address.neighborhood, c.address.city].filter(Boolean);
    return parts.join(', ');
  },
  'useraddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.street, c.address.number, c.address.neighborhood, c.address.city].filter(Boolean);
    return parts.join(', ');
  },
  'studentaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.street, c.address.number, c.address.neighborhood, c.address.city].filter(Boolean);
    return parts.join(', ');
  },
  'artisanaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.street, c.address.number, c.address.neighborhood, c.address.city].filter(Boolean);
    return parts.join(', ');
  },

  // ============================================================================
  // ENDEREÇO - COMPONENTES INDIVIDUAIS
  // ============================================================================
  // Rua/Logradouro
  'rua': (c) => c.address?.street || '',
  'logradouro': (c) => c.address?.street || '',
  'street': (c) => c.address?.street || '',
  'endereco_rua': (c) => c.address?.street || '',
  'via': (c) => c.address?.street || '',

  // Número
  'numero': (c) => c.address?.number || '',
  'number': (c) => c.address?.number || '',
  'endereco_numero': (c) => c.address?.number || '',
  'num': (c) => c.address?.number || '',

  // Complemento
  'complemento': (c) => c.address?.complement || '',
  'complement': (c) => c.address?.complement || '',
  'endereco_complemento': (c) => c.address?.complement || '',
  'compl': (c) => c.address?.complement || '',

  // Bairro
  'bairro': (c) => c.address?.neighborhood || '',
  'neighborhood': (c) => c.address?.neighborhood || '',
  'endereco_bairro': (c) => c.address?.neighborhood || '',
  'neighbourhood': (c) => c.address?.neighborhood || '',
  'distrito': (c) => c.address?.neighborhood || '',

  // Cidade
  'cidade': (c) => c.address?.city || '',
  'city': (c) => c.address?.city || '',
  'municipio': (c) => c.address?.city || '',
  'endereco_cidade': (c) => c.address?.city || '',
  'localidade': (c) => c.address?.city || '',

  // Estado
  'estado': (c) => c.address?.state || '',
  'state': (c) => c.address?.state || '',
  'uf': (c) => c.address?.state || '',
  'endereco_estado': (c) => c.address?.state || '',

  // CEP
  'cep': (c) => c.address?.zipCode || '',
  'zipcode': (c) => c.address?.zipCode || '',
  'zip_code': (c) => c.address?.zipCode || '',
  'codigo_postal': (c) => c.address?.zipCode || '',
  'endereco_cep': (c) => c.address?.zipCode || '',
  'postalcode': (c) => c.address?.zipCode || '',

  // Ponto de Referência
  'pontoreferencia': (c) => c.address?.pontoReferencia || '',
  'ponto_referencia': (c) => c.address?.pontoReferencia || '',
  'referencepoint': (c) => c.address?.pontoReferencia || '',
  'reference_point': (c) => c.address?.pontoReferencia || '',
  'referencia': (c) => c.address?.pontoReferencia || '',
  'endereco_referencia': (c) => c.address?.pontoReferencia || '',
};

/**
 * Pré-preenche os dados do formulário com informações do cidadão
 *
 * @param fields - Array de campos do formulário
 * @param citizenData - Dados do cidadão autenticado
 * @returns Objeto com valores pré-preenchidos
 */
export function prefillFormData(
  fields: FormField[],
  citizenData: CitizenData | null
): Record<string, any> {
  if (!citizenData) {
    return initializeEmptyForm(fields);
  }

  console.log('🔍 [PREFILL] Dados do cidadão:', {
    name: citizenData.name,
    cpf: citizenData.cpf,
    rg: citizenData.rg,
    phone: citizenData.phone,
    phoneSecondary: citizenData.phoneSecondary,
    birthDate: citizenData.birthDate,
    motherName: citizenData.motherName,
    maritalStatus: citizenData.maritalStatus,
    occupation: citizenData.occupation,
    familyIncome: citizenData.familyIncome
  });

  const formData: Record<string, any> = {};
  let prefilledCount = 0;

  fields.forEach(field => {
    // Normalizar o ID do campo para lowercase e remover acentos
    const normalizedId = normalizeFieldId(field.id);

    // ESTRATÉGIA DE 3 NÍVEIS:
    // 1. Tentar mapeamento direto
    const mapper = FIELD_MAPPINGS[normalizedId];

    if (mapper) {
      // Aplicar o mapeamento direto
      const value = mapper(citizenData);

      // Apenas preencher se houver valor
      if (value !== undefined && value !== null && value !== '') {
        formData[field.id] = value;
        prefilledCount++;

        // Log especial para campos select
        if (field.type === 'select' && field.options) {
          const matchFound = field.options.includes(value);
          console.log(`✅ [MAPEAMENTO DIRETO SELECT] "${field.id}" (${normalizedId})`);
          console.log(`   Valor: "${value}"`);
          console.log(`   Opções: [${field.options.map(o => `"${o}"`).join(', ')}]`);
          console.log(`   Match encontrado: ${matchFound ? '✅ SIM' : '❌ NÃO'}`);
        } else {
          console.log(`✅ [MAPEAMENTO DIRETO] "${field.id}" (${normalizedId}) → ${String(value).substring(0, 50)}`);
        }
      } else {
        formData[field.id] = getDefaultValueForType(field.type);
      }
    } else {
      // 2. Tentar detecção semântica inteligente
      const semanticValue = trySemanticMapping(normalizedId, citizenData);

      if (semanticValue !== null && semanticValue !== undefined && semanticValue !== '') {
        formData[field.id] = semanticValue;
        prefilledCount++;

        // Log especial para campos select
        if (field.type === 'select' && field.options) {
          const matchFound = field.options.includes(semanticValue);
          console.log(`✅ [SEMÂNTICO SELECT] "${field.id}" (${normalizedId})`);
          console.log(`   Valor: "${semanticValue}"`);
          console.log(`   Opções: [${field.options.map(o => `"${o}"`).join(', ')}]`);
          console.log(`   Match encontrado: ${matchFound ? '✅ SIM' : '❌ NÃO'}`);
        } else {
          console.log(`✅ [SEMÂNTICO] "${field.id}" (${normalizedId}) → ${String(semanticValue).substring(0, 50)}`);
        }
      } else {
        // 3. Inicializar vazio (campo não reconhecido)
        formData[field.id] = getDefaultValueForType(field.type);
        console.log(`⚪ [NÃO RECONHECIDO] "${field.id}" (${normalizedId})`);
      }
    }
  });

  console.log(`📊 [PREFILL] Total: ${prefilledCount}/${fields.length} campos preenchidos`);

  return formData;
}

/**
 * Inicializa formulário vazio para cidadão não autenticado
 */
function initializeEmptyForm(fields: FormField[]): Record<string, any> {
  const formData: Record<string, any> = {};

  fields.forEach(field => {
    formData[field.id] = getDefaultValueForType(field.type);
  });

  return formData;
}

/**
 * Normaliza ID do campo para facilitar mapeamento
 * Remove acentos, converte para lowercase e remove caracteres especiais
 */
function normalizeFieldId(fieldId: string): string {
  return fieldId
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9_]/g, '_') // Substitui caracteres especiais por _
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, ''); // Remove underscores no início e fim
}

/**
 * DETECÇÃO SEMÂNTICA INTELIGENTE
 *
 * Para campos que não estão no mapeamento direto, detecta semanticamente
 * baseado em padrões no ID do campo.
 *
 * Estratégia:
 * 1. Remove sufixos/prefixos comuns (do, da, de, etc)
 * 2. Identifica palavras-chave no ID normalizado
 * 3. Retorna o tipo de dado detectado
 */
function detectFieldTypeSemantica(normalizedId: string): 'name' | 'cpf' | 'rg' | 'birthdate' | 'mothername' | 'maritalstatus' | 'occupation' | 'familyincome' | 'email' | 'phone' | 'phonesecondary' | 'address' | null {
  // Padrões de NOME (qualquer campo que termine com "name" ou contenha indicadores de nome)
  if (
    normalizedId.endsWith('name') ||
    normalizedId.endsWith('nome') ||
    normalizedId.includes('solicitante') ||
    normalizedId.includes('requerente') ||
    normalizedId.includes('responsavel') ||
    normalizedId.includes('declarante') ||
    normalizedId.includes('denunciante') ||
    normalizedId.includes('proprietario') ||
    normalizedId.includes('titular') ||
    normalizedId.includes('cidadao') ||
    normalizedId.includes('pessoa') ||
    normalizedId.includes('usuario') ||
    normalizedId.includes('cliente') ||
    normalizedId.includes('beneficiario') ||
    normalizedId.includes('interessado')
  ) {
    return 'name';
  }

  // Padrões de CPF (incluindo CPF/CNPJ)
  if (
    normalizedId.includes('cpf') ||
    normalizedId.includes('documento') ||
    normalizedId.includes('doc') ||
    normalizedId === 'cpfcnpj' ||
    normalizedId === 'cpf_cnpj'
  ) {
    return 'cpf';
  }

  // Padrões de EMAIL
  if (
    normalizedId.includes('email') ||
    normalizedId.includes('e_mail') ||
    normalizedId.includes('mail') ||
    normalizedId.includes('correio')
  ) {
    return 'email';
  }

  // Padrões de TELEFONE
  if (
    normalizedId.includes('telefone') ||
    normalizedId.includes('phone') ||
    normalizedId.includes('celular') ||
    normalizedId.includes('fone') ||
    normalizedId.includes('tel') ||
    normalizedId.includes('mobile') ||
    (normalizedId.includes('contato') && !normalizedId.includes('nome') && !normalizedId.includes('name'))
  ) {
    return 'phone';
  }

  // Padrões de ENDEREÇO
  if (
    normalizedId.includes('endereco') ||
    normalizedId.includes('address') ||
    normalizedId.includes('logradouro') ||
    normalizedId.includes('rua') ||
    normalizedId.includes('street') ||
    normalizedId.includes('bairro') ||
    normalizedId.includes('neighborhood') ||
    normalizedId.includes('cidade') ||
    normalizedId.includes('city') ||
    normalizedId.includes('municipio') ||
    normalizedId.includes('cep') ||
    normalizedId.includes('zipcode')
  ) {
    return 'address';
  }

  // Padrões de RG
  if (
    normalizedId.includes('rg') ||
    normalizedId.includes('identidade') ||
    (normalizedId.includes('carteira') && normalizedId.includes('identidade'))
  ) {
    return 'rg';
  }

  // Padrões de DATA DE NASCIMENTO
  if (
    normalizedId.includes('nascimento') ||
    normalizedId.includes('birthdate') ||
    normalizedId.includes('birth_date') ||
    normalizedId.includes('dateofbirth') ||
    normalizedId.includes('date_of_birth') ||
    (normalizedId.includes('data') && normalizedId.includes('nasc'))
  ) {
    return 'birthdate';
  }

  // Padrões de NOME DA MÃE
  if (
    normalizedId.includes('mae') ||
    normalizedId.includes('mother') ||
    normalizedId.includes('filiacao') && normalizedId.includes('materna')
  ) {
    return 'mothername';
  }

  // Padrões de ESTADO CIVIL
  if (
    normalizedId.includes('estadocivil') ||
    normalizedId.includes('estado_civil') ||
    normalizedId.includes('marital') ||
    normalizedId.includes('civil') && normalizedId.includes('status')
  ) {
    return 'maritalstatus';
  }

  // Padrões de PROFISSÃO/OCUPAÇÃO
  if (
    normalizedId.includes('profissao') ||
    normalizedId.includes('ocupacao') ||
    normalizedId.includes('occupation') ||
    normalizedId.includes('profession') ||
    normalizedId.includes('atividade') && normalizedId.includes('profissional')
  ) {
    return 'occupation';
  }

  // Padrões de RENDA FAMILIAR
  if (
    normalizedId.includes('renda') ||
    normalizedId.includes('income') ||
    normalizedId.includes('familiar') && normalizedId.includes('renda')
  ) {
    return 'familyincome';
  }

  // Padrões de TELEFONE SECUNDÁRIO
  if (
    (normalizedId.includes('telefone') || normalizedId.includes('phone')) &&
    (normalizedId.includes('secundario') || normalizedId.includes('secondary') ||
     normalizedId.includes('2') || normalizedId.includes('alternativo') ||
     normalizedId.includes('alternative'))
  ) {
    return 'phonesecondary';
  }

  return null;
}

/**
 * Função auxiliar para mapear campo usando detecção semântica
 * Usado quando não há mapeamento direto
 */
function trySemanticMapping(
  normalizedId: string,
  citizenData: CitizenData
): any {
  const fieldType = detectFieldTypeSemantica(normalizedId);

  switch (fieldType) {
    case 'name':
      return citizenData.name;

    case 'cpf':
      return citizenData.cpf;

    case 'rg':
      return citizenData.rg || '';

    case 'birthdate':
      return citizenData.birthDate ? formatDateForInput(citizenData.birthDate) : '';

    case 'mothername':
      return citizenData.motherName || '';

    case 'maritalstatus':
      return citizenData.maritalStatus || '';

    case 'occupation':
      return citizenData.occupation || '';

    case 'familyincome':
      return citizenData.familyIncome || '';

    case 'email':
      return citizenData.email;

    case 'phone':
      return citizenData.phone || '';

    case 'phonesecondary':
      return citizenData.phoneSecondary || '';

    case 'address':
      // Para endereço, retorna o endereço completo formatado
      if (!citizenData.address) return '';
      const parts = [
        citizenData.address.street,
        citizenData.address.number,
        citizenData.address.neighborhood,
        citizenData.address.city,
        citizenData.address.state
      ].filter(Boolean);
      return parts.join(', ');

    default:
      return null;
  }
}

/**
 * Retorna valor padrão baseado no tipo do campo
 */
function getDefaultValueForType(type: string): any {
  switch (type) {
    case 'number':
      return 0;
    case 'boolean':
    case 'checkbox':
      return false;
    case 'select':
      return '';
    default:
      return '';
  }
}

/**
 * Verifica quais campos foram pré-preenchidos
 * Útil para feedback visual ao usuário
 */
export function getPrefilledFields(
  fields: FormField[],
  formData: Record<string, any>
): string[] {
  return fields
    .filter(field => {
      const value = formData[field.id];
      return value !== undefined &&
             value !== null &&
             value !== '' &&
             value !== 0 &&
             value !== false;
    })
    .map(field => field.id);
}

/**
 * Gera mensagem de feedback sobre campos pré-preenchidos
 */
export function getPrefilledMessage(prefilledCount: number, totalCount: number): string {
  if (prefilledCount === 0) {
    return 'Preencha todos os campos abaixo';
  }

  if (prefilledCount === totalCount) {
    return '✓ Todos os campos foram pré-preenchidos com seus dados. Revise e confirme.';
  }

  return `✓ ${prefilledCount} de ${totalCount} campos foram pré-preenchidos. Complete os campos restantes.`;
}

/**
 * Valida se os dados pré-preenchidos ainda são válidos
 * Útil para detectar mudanças no perfil do usuário
 */
export function validatePrefilledData(
  formData: Record<string, any>,
  citizenData: CitizenData
): { isValid: boolean; outdatedFields: string[] } {
  const outdatedFields: string[] = [];

  Object.keys(formData).forEach(fieldId => {
    const normalizedId = normalizeFieldId(fieldId);
    const mapper = FIELD_MAPPINGS[normalizedId];

    if (mapper) {
      const currentValue = mapper(citizenData);
      const formValue = formData[fieldId];

      if (currentValue !== formValue && currentValue !== '') {
        outdatedFields.push(fieldId);
      }
    }
  });

  return {
    isValid: outdatedFields.length === 0,
    outdatedFields
  };
}
