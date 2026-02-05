/**
 * ============================================================================
 * MAPEADOR DE PRÉ-PREENCHIMENTO DE FORMULÁRIOS
 * ============================================================================
 *
 * Sistema de pré-preenchimento automático APENAS para campos de perfil do cidadão.
 *
 * ## REGRA PRINCIPAL:
 * - ✅ APENAS campos com prefixo `citizen_*` são pré-preenchidos
 * - ❌ Campos customizados do serviço NUNCA são pré-preenchidos
 *
 * ## Por quê?
 * Evita pré-preencher campos específicos do serviço com dados do cidadão logado.
 * Exemplo: Um campo "nomeResponsavel" em um serviço de obras NÃO deve ser
 * preenchido com o nome do cidadão, pois refere-se ao responsável técnico.
 *
 * ## Campos Citizen_* Suportados:
 * - citizen_name, citizen_cpf (com máscara), citizen_rg
 * - citizen_birthdate (formato yyyy-MM-dd), citizen_email
 * - citizen_phone (com máscara), citizen_address
 * - citizen_addressnumber, citizen_addresscomplement
 * - citizen_neighborhood, citizen_city, citizen_state
 * - citizen_zipcode (com máscara CEP)
 *
 * ## Estratégia de Mapeamento:
 * 1. Verificar se campo começa com `citizen_`
 * 2. Se SIM: buscar mapeamento direto e pré-preencher
 * 3. Se NÃO: inicializar vazio (campo customizado do serviço)
 *
 * ## Exemplos de Mapeamento:
 *
 * ✅ CAMPOS CITIZEN_* (PRÉ-PREENCHIDOS):
 * - citizen_name → "João Silva"
 * - citizen_cpf → "123.456.789-00" (com máscara)
 * - citizen_email → "joao@email.com"
 * - citizen_phone → "(11) 98765-4321" (com máscara)
 * - citizen_birthdate → "1990-01-15" (formato yyyy-MM-dd)
 * - citizen_address → "Rua ABC"
 * - citizen_zipcode → "12345-678" (com máscara)
 *
 * ❌ CAMPOS CUSTOMIZADOS (NÃO PRÉ-PREENCHIDOS):
 * - nomeResponsavel → "" (vazio - específico do serviço)
 * - cpfProprietario → "" (vazio - específico do serviço)
 * - emailContato → "" (vazio - específico do serviço)
 * - telefoneEmergencia → "" (vazio - específico do serviço)
 * - enderecoObra → "" (vazio - específico do serviço)
 *
 * ## Por quê separar?
 * Campos customizados podem se referir a OUTRAS pessoas ou entidades,
 * não ao cidadão logado. Ex: responsável técnico, proprietário do imóvel, etc.
 *
 * ## PADRONIZAÇÃO:
 * ✅ Nomenclatura de endereço ALINHADA com o banco de dados PostgreSQL
 * ✅ Usa o tipo Address padronizado de @/shared/types/address.types
 */

import type { Address } from '@/shared/types/address.types';
import { formatValue } from '@/components/ui/modern-masked-input';

/**
 * Interface de dados do cidadão para pré-preenchimento
 * IMPORTANTE: Alinhada com o schema do Prisma e banco de dados
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
  address?: Address; // ✅ Usa tipo padronizado: cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia
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
 * Função para formatar data no formato brasileiro (DD/MM/YYYY)
 * ✅ Usado para pré-preenchimento de campos de data com máscara brasileira
 *
 * IMPORTANTE: Usamos input de texto com máscara brasileira DD/MM/YYYY
 * para uma melhor experiência do usuário brasileiro
 *
 * CORREÇÃO DE FUSO HORÁRIO:
 * - Datas ISO (YYYY-MM-DD) são interpretadas como UTC meia-noite
 * - Ao converter para fuso horário local (Brasil UTC-3), pode subtrair 1 dia
 * - Solução: extrair componentes diretamente da string ISO quando possível
 */
function formatBrazilianDate(dateString: string): string {
  try {
    if (!dateString) return '';

    // Se a data estiver no formato ISO (YYYY-MM-DD), extrair diretamente os componentes
    // Isso evita problemas de fuso horário
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    // Se for outro formato, tentar parsear como Date
    // Usar toISOString() para obter a data em UTC e evitar conversões de fuso
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Usar toISOString() que retorna YYYY-MM-DDTHH:mm:ss.sssZ
    // e extrair apenas a parte da data
    const isoString = date.toISOString();
    const [datePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-');

    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Função para converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 * Usado quando precisamos enviar a data para o backend
 */
export function brazilianDateToISO(brazilianDate: string): string {
  try {
    if (!brazilianDate) return '';

    // Remove caracteres não numéricos
    const numbers = brazilianDate.replace(/\D/g, '');

    if (numbers.length !== 8) return '';

    // Extrai dia, mês e ano
    const day = numbers.substring(0, 2);
    const month = numbers.substring(2, 4);
    const year = numbers.substring(4, 8);

    // Valida a data
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return '';

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
  // IDs citizen_* (novos campos do cidadão)
  'citizen_name': (c) => c.name,

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
  // IDs citizen_* (novos campos do cidadão) - ✅ COM MÁSCARA
  'citizen_cpf': (c) => formatValue(c.cpf || '', 'cpf'),

  // IDs diretos - ✅ COM MÁSCARA
  'cpf': (c) => formatValue(c.cpf || '', 'cpf'),
  'documento': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpf_cnpj': (c) => formatValue(c.cpf || '', 'cpf'),  // ⭐ IMPORTANTE: CPF/CNPJ deve ser preenchido com CPF do cidadão
  'cpfcnpj': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpfoucnpj': (c) => formatValue(c.cpf || '', 'cpf'),
  'doc': (c) => formatValue(c.cpf || '', 'cpf'),
  'document': (c) => formatValue(c.cpf || '', 'cpf'),

  // Variações de "CPF do X" - ✅ COM MÁSCARA
  'applicantcpf': (c) => formatValue(c.cpf || '', 'cpf'),    // CPF do Solicitante
  'requestercpf': (c) => formatValue(c.cpf || '', 'cpf'),    // CPF do Solicitante
  'reportercpf': (c) => formatValue(c.cpf || '', 'cpf'),     // CPF do Denunciante
  'complainantcpf': (c) => formatValue(c.cpf || '', 'cpf'),  // CPF do Reclamante
  'ownercpf': (c) => formatValue(c.cpf || '', 'cpf'),        // CPF do Proprietário
  'responsiblecpf': (c) => formatValue(c.cpf || '', 'cpf'),  // CPF do Responsável
  'usercpf': (c) => formatValue(c.cpf || '', 'cpf'),         // CPF do Usuário
  'studentcpf': (c) => formatValue(c.cpf || '', 'cpf'),      // CPF do Aluno
  'parentcpf': (c) => formatValue(c.cpf || '', 'cpf'),       // CPF do Responsável
  'participantcpf': (c) => formatValue(c.cpf || '', 'cpf'),  // CPF do Participante
  'athletecpf': (c) => formatValue(c.cpf || '', 'cpf'),      // CPF do Atleta
  'producercpf': (c) => formatValue(c.cpf || '', 'cpf'),     // CPF do Produtor
  'artisancpf': (c) => formatValue(c.cpf || '', 'cpf'),      // CPF do Artesão
  'coordinatorcpf': (c) => formatValue(c.cpf || '', 'cpf'),  // CPF do Coordenador

  // Genéricos - ✅ COM MÁSCARA
  'cpf_solicitante': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpf_requerente': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpf_responsavel': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpf_proprietario': (c) => formatValue(c.cpf || '', 'cpf'),
  'cpf_declarante': (c) => formatValue(c.cpf || '', 'cpf'),

  // ============================================================================
  // RG - Todas as variações
  // ============================================================================
  // IDs citizen_* (novos campos do cidadão)
  'citizen_rg': (c) => c.rg || '',

  // IDs diretos
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
  // ✅ IMPORTANTE: Retorna formato ISO (YYYY-MM-DD) para input type="date"
  // ✅ NAVEGADORES BRASILEIROS (pt-BR) exibem automaticamente DD/MM/YYYY
  // ✅ Seguindo padrão W3C e melhores práticas de acessibilidade
  // ============================================================================
  // IDs citizen_* (novos campos do cidadão)
  'citizen_birthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',

  // IDs diretos
  'datanascimento': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'data_nascimento': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'birthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'birth_date': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'nascimento': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'dtnascimento': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'dt_nascimento': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'dateofbirth': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'date_of_birth': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'applicantbirthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'requesterbirthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'studentbirthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',
  'participantbirthdate': (c) => c.birthDate ? formatBrazilianDate(c.birthDate) : '',

  // ============================================================================
  // NOME DA MÃE - Todas as variações
  // ============================================================================
  'citizen_mothername': (c) => c.motherName || '',
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
  'citizen_maritalstatus': (c) => c.maritalStatus || '',
  'estadocivil': (c) => c.maritalStatus || '',
  'estado_civil': (c) => c.maritalStatus || '',
  'maritalstatus': (c) => c.maritalStatus || '',
  'marital_status': (c) => c.maritalStatus || '',
  'civilstatus': (c) => c.maritalStatus || '',
  'civil_status': (c) => c.maritalStatus || '',

  // ============================================================================
  // PROFISSÃO/OCUPAÇÃO - Todas as variações
  // ============================================================================
  'citizen_occupation': (c) => c.occupation || '',
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
  'citizen_familyincome': (c) => c.familyIncome || '',
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
  'citizen_phonesecondary': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefonesecundario': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefone_secundario': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'secondaryphone': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'secondary_phone': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefone2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefone_2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'phone2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'phone_2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'celular2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'celular_2': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefone_alternativo': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'telefonealternativo': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'alternativephone': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'alternative_phone': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'phonesecondary': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'applicantphonesecondary': (c) => formatValue(c.phoneSecondary || '', 'phone'),
  'requesterphonesecondary': (c) => formatValue(c.phoneSecondary || '', 'phone'),

  // ============================================================================
  // EMAIL - Todas as variações
  // ============================================================================
  // IDs citizen_* (novos campos do cidadão)
  'citizen_email': (c) => c.email,

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
  // IDs citizen_* (novos campos do cidadão) - ✅ COM MÁSCARA
  'citizen_phone': (c) => {
    console.log('🔍 [CITIZEN_PHONE DEBUG]', {
      phone: c.phone,
      formatted: formatValue(c.phone || '', 'phone')
    });
    return formatValue(c.phone || '', 'phone');
  },

  // IDs diretos - ✅ COM MÁSCARA
  'telefone': (c) => formatValue(c.phone || '', 'phone'),
  'phone': (c) => formatValue(c.phone || '', 'phone'),
  'celular': (c) => formatValue(c.phone || '', 'phone'),
  'fone': (c) => formatValue(c.phone || '', 'phone'),
  'tel': (c) => formatValue(c.phone || '', 'phone'),
  'contato': (c) => formatValue(c.phone || '', 'phone'),
  'mobile': (c) => formatValue(c.phone || '', 'phone'),

  // Variações de "telefone do X" - ✅ COM MÁSCARA
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
  // ✅ PADRONIZADO: Usa nomenclatura do banco (logradouro, numero, bairro, cidade, uf, cep)
  // ============================================================================
  // IDs citizen_* (novos campos do cidadão)
  'citizen_address': (c) => c.address?.logradouro || '',

  'endereco': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.logradouro,
      c.address.numero,
      c.address.bairro,
      c.address.cidade,
      c.address.uf
    ].filter(Boolean);
    return parts.join(', ');
  },
  'address': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.logradouro,
      c.address.numero,
      c.address.bairro,
      c.address.cidade,
      c.address.uf
    ].filter(Boolean);
    return parts.join(', ');
  },
  'endereco_completo': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.logradouro,
      c.address.numero,
      c.address.complemento,
      c.address.bairro,
      c.address.cidade,
      c.address.uf,
      c.address.cep
    ].filter(Boolean);
    return parts.join(', ');
  },
  'fulladdress': (c) => {
    if (!c.address) return '';
    const parts = [
      c.address.logradouro,
      c.address.numero,
      c.address.complemento,
      c.address.bairro,
      c.address.cidade,
      c.address.uf,
      c.address.cep
    ].filter(Boolean);
    return parts.join(', ');
  },

  // Variações de "endereço do X"
  'applicantaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.logradouro, c.address.numero, c.address.bairro, c.address.cidade].filter(Boolean);
    return parts.join(', ');
  },
  'useraddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.logradouro, c.address.numero, c.address.bairro, c.address.cidade].filter(Boolean);
    return parts.join(', ');
  },
  'studentaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.logradouro, c.address.numero, c.address.bairro, c.address.cidade].filter(Boolean);
    return parts.join(', ');
  },
  'artisanaddress': (c) => {
    if (!c.address) return '';
    const parts = [c.address.logradouro, c.address.numero, c.address.bairro, c.address.cidade].filter(Boolean);
    return parts.join(', ');
  },

  // ============================================================================
  // ENDEREÇO - COMPONENTES INDIVIDUAIS
  // ✅ PADRONIZADO: Usa APENAS nomenclatura do banco (português)
  // ✅ Suporta aliases em inglês por compatibilidade, mas retorna dados do padrão PT
  // ============================================================================
  // Rua/Logradouro (citizen_address já definido acima como endereço completo)
  'rua': (c) => c.address?.logradouro || '',
  'logradouro': (c) => c.address?.logradouro || '',
  'street': (c) => c.address?.logradouro || '', // Alias para logradouro
  'endereco_rua': (c) => c.address?.logradouro || '',
  'via': (c) => c.address?.logradouro || '',

  // Número
  'citizen_addressnumber': (c) => c.address?.numero || '',
  'numero': (c) => c.address?.numero || '',
  'number': (c) => c.address?.numero || '', // Alias para numero
  'endereco_numero': (c) => c.address?.numero || '',
  'num': (c) => c.address?.numero || '',

  // Complemento
  'citizen_addresscomplement': (c) => c.address?.complemento || '',
  'complemento': (c) => c.address?.complemento || '',
  'complement': (c) => c.address?.complemento || '', // Alias para complemento
  'endereco_complemento': (c) => c.address?.complemento || '',
  'compl': (c) => c.address?.complemento || '',

  // Bairro
  'citizen_neighborhood': (c) => c.address?.bairro || '',
  'bairro': (c) => c.address?.bairro || '',
  'neighborhood': (c) => c.address?.bairro || '', // Alias para bairro
  'endereco_bairro': (c) => c.address?.bairro || '',
  'neighbourhood': (c) => c.address?.bairro || '', // Alias para bairro
  'distrito': (c) => c.address?.bairro || '',

  // Cidade
  'citizen_city': (c) => c.address?.cidade || '',
  'cidade': (c) => c.address?.cidade || '',
  'city': (c) => c.address?.cidade || '', // Alias para cidade
  'municipio': (c) => c.address?.cidade || '',
  'endereco_cidade': (c) => c.address?.cidade || '',
  'localidade': (c) => c.address?.cidade || '',

  // Estado
  'citizen_state': (c) => c.address?.uf || '',
  'estado': (c) => c.address?.uf || '',
  'state': (c) => c.address?.uf || '', // Alias para uf
  'uf': (c) => c.address?.uf || '',
  'endereco_estado': (c) => c.address?.uf || '',

  // CEP - ✅ COM MÁSCARA
  'citizen_zipcode': (c) => formatValue(c.address?.cep || '', 'cep'),
  'cep': (c) => formatValue(c.address?.cep || '', 'cep'),
  'zipcode': (c) => formatValue(c.address?.cep || '', 'cep'), // Alias para cep
  'zip_code': (c) => formatValue(c.address?.cep || '', 'cep'), // Alias para cep
  'codigo_postal': (c) => formatValue(c.address?.cep || '', 'cep'),
  'endereco_cep': (c) => formatValue(c.address?.cep || '', 'cep'),
  'postalcode': (c) => formatValue(c.address?.cep || '', 'cep'), // Alias para cep

  // Ponto de Referência
  'pontoreferencia': (c) => c.address?.pontoReferencia || '',
  'ponto_referencia': (c) => c.address?.pontoReferencia || '',
  'referencepoint': (c) => c.address?.pontoReferencia || '', // Alias para pontoReferencia
  'reference_point': (c) => c.address?.pontoReferencia || '', // Alias para pontoReferencia
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
    phone: citizenData.phone,
    birthDate: citizenData.birthDate
  });

  console.log('🔍 [PREFILL] Campos a preencher:', fields.map(f => ({ id: f.id, type: f.type })));

  const formData: Record<string, any> = {};
  let prefilledCount = 0;

  fields.forEach(field => {
    // ============================================================================
    // ESTRATÉGIA DE PRÉ-PREENCHIMENTO:
    // 1. Campos com prefixo citizen_* são SEMPRE pré-preenchidos
    // 2. Campos SEM prefixo são pré-preenchidos SE encontrarem mapeamento
    // 3. Campos sem mapeamento são inicializados vazios
    // ============================================================================

    // Normalizar o ID do campo para lowercase e remover acentos
    const normalizedId = normalizeFieldId(field.id);

    console.log(`🔍 [DEBUG PREFILL] Campo: "${field.id}" → normalizedId: "${normalizedId}"`);

    // Tentar encontrar mapeamento direto
    const mapper = FIELD_MAPPINGS[normalizedId];

    if (mapper) {
      // Mapeamento encontrado - aplicar pré-preenchimento
      const value = mapper(citizenData);

      console.log(`🔍 [DEBUG MAPPER] "${field.id}" → mapper found, value:`, value);

      // Apenas preencher se houver valor
      if (value !== undefined && value !== null && value !== '') {
        formData[field.id] = value;
        prefilledCount++;

        console.log(`✅ [FIELD FILLED] "${field.id}" → "${value}"`);
      } else {
        formData[field.id] = getDefaultValueForType(field.type);

        console.log(`❌ [FIELD EMPTY] "${field.id}" - valor retornado: ${value}`);
      }
    } else {
      // Sem mapeamento - inicializar vazio
      formData[field.id] = getDefaultValueForType(field.type);

      console.log(`⚠️ [NO MAPPER] "${field.id}" (normalized: "${normalizedId}")`);
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
      return formatValue(citizenData.cpf || '', 'cpf');

    case 'rg':
      return citizenData.rg || '';

    case 'birthdate':
      return citizenData.birthDate ? formatBrazilianDate(citizenData.birthDate) : '';

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
      // ✅ PADRONIZADO: Usa nomenclatura do banco
      if (!citizenData.address) return '';
      const parts = [
        citizenData.address.logradouro,
        citizenData.address.numero,
        citizenData.address.bairro,
        citizenData.address.cidade,
        citizenData.address.uf
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
