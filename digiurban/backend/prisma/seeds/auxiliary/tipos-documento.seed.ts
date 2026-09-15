import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// TIPOS DE DOCUMENTOS
// ========================================

export const tiposDocumentoData = [
  {
    nome: 'RG',
    descricao: 'Registro Geral de Identidade',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5, // MB
    requisitosPadrao: 'Documento legível, frente e verso, dentro do prazo de validade',
    validadeDocumento: null, // Não expira
  },
  {
    nome: 'CPF',
    descricao: 'Cadastro de Pessoa Física',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Documento legível, não pode ser protocolo de solicitação',
    validadeDocumento: null,
  },
  {
    nome: 'Comprovante de Residência',
    descricao: 'Conta de água, luz, telefone, contrato de aluguel ou declaração de moradia',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Documento com no máximo 90 dias (para contas) ou vigente (para contratos)',
    validadeDocumento: 90, // Dias
  },
  {
    nome: 'Comprovante de Renda',
    descricao: 'Holerite, declaração de imposto de renda, extrato bancário ou declaração de autônomo',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Últimos 3 meses para holerites, último ano para IR',
    validadeDocumento: 90,
  },
  {
    nome: 'Certidão de Nascimento',
    descricao: 'Certidão de nascimento',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Documento legível, de preferência a certidão atualizada',
    validadeDocumento: null,
  },
  {
    nome: 'Certidão de Casamento',
    descricao: 'Certidão de casamento',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Documento legível, de preferência a certidão atualizada',
    validadeDocumento: null,
  },
  {
    nome: 'Carteira de Trabalho',
    descricao: 'Carteira de Trabalho e Previdência Social (CTPS)',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Página de foto e qualificação, páginas de contratos de trabalho',
    validadeDocumento: null,
  },
  {
    nome: 'Laudo Médico',
    descricao: 'Laudo médico, atestado ou relatório de profissional de saúde',
    categoria: 'Declaração',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Com carimbo e assinatura do profissional, CRM/CRO visível',
    validadeDocumento: 90,
  },
  {
    nome: 'Comprovante de Matrícula Escolar',
    descricao: 'Declaração de matrícula ou frequência escolar',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Do ano letivo atual, com carimbo da escola',
    validadeDocumento: 365,
  },
  {
    nome: 'Carteira de Vacinação',
    descricao: 'Carteira de vacinação atualizada',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Com todas as páginas, especialmente as vacinas obrigatórias',
    validadeDocumento: null,
  },
  {
    nome: 'Título de Eleitor',
    descricao: 'Título de eleitor',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Documento legível, frente e verso',
    validadeDocumento: null,
  },
  {
    nome: 'Certidão Negativa de Débitos',
    descricao: 'Certidão negativa de débitos municipais, estaduais ou federais',
    categoria: 'Declaração',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Certidão original, com código de verificação',
    validadeDocumento: 90,
  },
  {
    nome: 'Alvará de Funcionamento',
    descricao: 'Alvará de funcionamento de estabelecimento',
    categoria: 'Licença',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Dentro do prazo de validade',
    validadeDocumento: 365,
  },
  {
    nome: 'Licença Ambiental',
    descricao: 'Licença ambiental (LP, LI, LO)',
    categoria: 'Licença',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Emitida pelo órgão competente, dentro da validade',
    validadeDocumento: null, // Varia por tipo
  },
  {
    nome: 'IPTU',
    descricao: 'Carnê ou guia de IPTU',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Do exercício atual ou anterior',
    validadeDocumento: 365,
  },
  {
    nome: 'Escritura do Imóvel',
    descricao: 'Escritura pública de propriedade',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 20,
    requisitosPadrao: 'Documento completo, registrado em cartório',
    validadeDocumento: null,
  },
  {
    nome: 'Contrato de Locação',
    descricao: 'Contrato de aluguel de imóvel',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Contrato vigente, com assinaturas',
    validadeDocumento: null, // Validado pela vigência do contrato
  },
  {
    nome: 'Declaração de Imposto de Renda',
    descricao: 'Declaração de imposto de renda pessoa física',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 20,
    requisitosPadrao: 'Última declaração entregue, com recibo de entrega',
    validadeDocumento: 365,
  },
  {
    nome: 'Termo de Guarda',
    descricao: 'Termo de guarda de menor',
    categoria: 'Declaração',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 10,
    requisitosPadrao: 'Homologado judicialmente',
    validadeDocumento: null,
  },
  {
    nome: 'Declaração de Residência',
    descricao: 'Declaração de residência assinada pelo proprietário do imóvel',
    categoria: 'Declaração',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Com cópia de documentos do declarante e comprovante de propriedade',
    validadeDocumento: 90,
  },
  {
    nome: 'Foto 3x4',
    descricao: 'Fotografia 3x4 recente',
    categoria: 'Identificação',
    formatosAceitos: ['JPG', 'PNG'],
    tamanhoMaximo: 2,
    requisitosPadrao: 'Fundo branco ou azul, sem óculos escuros ou boné',
    validadeDocumento: 180,
  },
  {
    nome: 'CNH',
    descricao: 'Carteira Nacional de Habilitação',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Dentro da validade, frente e verso',
    validadeDocumento: null, // Verificada pela data de validade da CNH
  },
  {
    nome: 'CNPJ',
    descricao: 'Cadastro Nacional de Pessoa Jurídica',
    categoria: 'Identificação',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Cartão CNPJ atualizado',
    validadeDocumento: null,
  },
  {
    nome: 'Contrato Social',
    descricao: 'Contrato social da empresa',
    categoria: 'Comprovante',
    formatosAceitos: ['PDF'],
    tamanhoMaximo: 20,
    requisitosPadrao: 'Com todas as alterações, registrado na Junta Comercial',
    validadeDocumento: null,
  },
  {
    nome: 'Cadastur',
    descricao: 'Cadastro de prestadores de serviços turísticos',
    categoria: 'Licença',
    formatosAceitos: ['PDF', 'JPG', 'PNG'],
    tamanhoMaximo: 5,
    requisitosPadrao: 'Cadastro ativo no Ministério do Turismo',
    validadeDocumento: 365,
  },
];

export async function seedTiposDocumento() {
  console.log('\n═══ TIPOS DE DOCUMENTOS ═══\n');
  console.log('   📄 Tipos de Documentos...');

  // ⚠️ MULTI-TENANT (2026-09-15): TipoDocumento tem unique composta com
  // tenantId, então `where: { nome }` não valida. findFirst escopado.
  for (const data of tiposDocumentoData) {
    const existente = await prisma.tipoDocumento.findFirst({
      where: { nome: data.nome },
      select: { id: true },
    });

    if (existente) {
      await prisma.tipoDocumento.update({ where: { id: existente.id }, data });
    } else {
      await prisma.tipoDocumento.create({ data });
    }
  }

  console.log(`   ✅ ${tiposDocumentoData.length} tipos de documentos criados`);
  console.log('\n✅ Tipos de Documentos criados com sucesso!\n');
}
