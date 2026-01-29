// ============================================================================
// SERVICE - GERAÇÃO DE PDFs PARA DOCUMENTOS DE SAÚDE
// ============================================================================

import { PrismaClient } from '@prisma/client';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import {
  generateUniqueValidationCode,
  generateDocumentHash
} from '../../utils/validation-code.utils';

const prisma = new PrismaClient();

// ============================================================================
// HELPERS HANDLEBARS
// ============================================================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Registrar helpers
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCPF', formatCPF);
Handlebars.registerHelper('formatPhone', formatPhone);
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// ============================================================================
// INTERFACE
// ============================================================================

interface GerarPDFInput {
  templatePath: string;
  variables: Record<string, any>;
  fileName: string;
  outputDir: string;
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Gerar PDF usando Playwright
 */
async function gerarPDF(input: GerarPDFInput): Promise<{ filePath: string; fileSize: number; validationCode: string; documentHash: string }> {
  const { templatePath, variables, fileName, outputDir } = input;

  // 1. Gerar código de validação
  const validationCode = await generateUniqueValidationCode(prisma);
  variables.validationCode = validationCode;

  // 2. Ler template
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);
  const html = compiledTemplate(variables);

  // 3. Gerar PDF com Playwright
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Criar diretório se não existir
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, fileName);

    // Gerar PDF
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });

    await browser.close();

    // 4. Obter tamanho do arquivo
    const stats = await fs.stat(filePath);

    // 5. Calcular hash SHA-256
    const documentHash = await generateDocumentHash(filePath);

    return {
      filePath,
      fileSize: stats.size,
      validationCode,
      documentHash
    };

  } catch (error) {
    await browser.close();
    throw error;
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class PDFSaudeService {

  /**
   * Gerar PDF de Prescrição Médica
   */
  async gerarPrescricaoPDF(prescricaoId: string): Promise<string> {
    // Buscar prescrição com dados relacionados
    const prescricao = await prisma.prescricao.findUnique({
      where: { id: prescricaoId },
      include: {
        consulta: {
          include: {
            atendimento: true
          }
        }
      }
    });

    if (!prescricao) {
      throw new Error('Prescrição não encontrada');
    }

    // Buscar cidadão separadamente
    const citizen = await prisma.citizen.findUnique({
      where: { id: prescricao.consulta.atendimento.citizenId }
    });

    // Buscar profissional (assumindo que existe um User ou Profissional)
    const profissional = await prisma.user.findFirst({
      where: { id: prescricao.consulta.medicoId }
    });

    // Buscar unidade de saúde
    const unidade = await prisma.unidadeSaude.findFirst({
      where: { id: prescricao.consulta.atendimento.unidadeId }
    });

    // Processar medicamentos do JSON
    const medicamentosJson = prescricao.medicamentos as any;
    const medicamentos = Array.isArray(medicamentosJson) ? medicamentosJson : [];

    // Preparar variáveis
    const variables = {
      pacienteNome: citizen?.name || '-',
      pacienteCpf: citizen?.cpf || '-',
      pacienteDataNascimento: citizen?.birthDate,
      pacienteEndereco: (citizen as any)?.address || '',
      profissionalNome: profissional?.name || '-',
      profissionalCrm: (profissional as any)?.crm || '-',
      profissionalEspecialidade: (profissional as any)?.especialidade || '',
      unidadeSaude: unidade?.nome || '-',
      dataEmissao: prescricao.dataHora,
      validadeAte: prescricao.validade,
      observacoes: prescricao.observacoes,
      medicamentos: medicamentos.map((med: any) => ({
        nome: med.nome || med.medicamento || '-',
        principioAtivo: med.principioAtivo || '',
        concentracao: med.concentracao || '',
        quantidade: med.quantidade || '-',
        posologia: med.posologia || '-',
        duracao: med.duracao || '',
        observacoes: med.observacoes || ''
      }))
    };

    // Gerar PDF
    const templatePath = path.join(process.cwd(), 'templates', 'saude', 'prescricao-medica.hbs');
    const fileName = `prescricao_${prescricaoId}_${Date.now()}.pdf`;
    const outputDir = path.join(process.cwd(), 'uploads', 'saude', 'prescricoes');

    const result = await gerarPDF({
      templatePath,
      variables,
      fileName,
      outputDir
    });

    console.log(`✅ Prescrição PDF gerada: ${fileName}`);
    return result.filePath;
  }

  /**
   * Gerar PDF de Atestado Médico
   */
  async gerarAtestadoPDF(atestadoId: string): Promise<string> {
    const atestado = await prisma.atestado.findUnique({
      where: { id: atestadoId },
      include: {
        consulta: {
          include: {
            atendimento: true
          }
        }
      }
    });

    if (!atestado) {
      throw new Error('Atestado não encontrado');
    }

    // Buscar cidadão separadamente
    const citizen = await prisma.citizen.findUnique({
      where: { id: atestado.consulta.atendimento.citizenId }
    });

    const profissional = await prisma.user.findFirst({
      where: { id: atestado.consulta.medicoId }
    });

    const unidade = await prisma.unidadeSaude.findFirst({
      where: { id: atestado.consulta.atendimento.unidadeId }
    });

    // Mapear tipo de atestado
    let tipoAtestadoTexto = 'Atestado Médico';
    if (atestado.tipo === 'COMPARECIMENTO') {
      tipoAtestadoTexto = 'Atestado de Comparecimento';
    } else if (atestado.tipo === 'ACOMPANHANTE') {
      tipoAtestadoTexto = 'Atestado para Acompanhante';
    }

    const variables = {
      tipoAtestado: atestado.tipo,
      tipoAtestadoTexto,
      pacienteNome: citizen?.name || '-',
      pacienteCpf: citizen?.cpf || '-',
      pacienteDataNascimento: citizen?.birthDate,
      pacienteEndereco: (citizen as any)?.address || '',
      profissionalNome: profissional?.name || '-',
      profissionalCrm: (profissional as any)?.crm || '-',
      profissionalEspecialidade: (profissional as any)?.especialidade || '',
      unidadeSaude: unidade?.nome || '-',
      diasAfastamento: atestado.diasAfastamento,
      dataInicio: atestado.dataInicio,
      dataFim: atestado.dataFim,
      dataEmissao: atestado.dataHora,
      cid10: atestado.cid10,
      observacoes: atestado.observacoes
    };

    const templatePath = path.join(process.cwd(), 'templates', 'saude', 'atestado-medico.hbs');
    const fileName = `atestado_${atestadoId}_${Date.now()}.pdf`;
    const outputDir = path.join(process.cwd(), 'uploads', 'saude', 'atestados');

    const result = await gerarPDF({
      templatePath,
      variables,
      fileName,
      outputDir
    });

    console.log(`✅ Atestado PDF gerado: ${fileName}`);
    return result.filePath;
  }

  /**
   * Gerar PDF de Solicitação de Exames
   */
  async gerarSolicitacaoExamesPDF(consultaId: string, exameIds: string[]): Promise<string> {
    const consulta = await prisma.consultaMedica.findUnique({
      where: { id: consultaId },
      include: {
        atendimento: true,
        examesSolicitados: {
          where: {
            id: { in: exameIds }
          }
        }
      }
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    // Buscar atendimento
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: consulta.atendimentoId }
    });

    // Buscar cidadão separadamente
    const citizen = await prisma.citizen.findUnique({
      where: { id: atendimento?.citizenId || '' }
    });

    const profissional = await prisma.user.findFirst({
      where: { id: consulta.medicoId }
    });

    const unidade = await prisma.unidadeSaude.findFirst({
      where: { id: atendimento?.unidadeId || '' }
    });

    // Mapear prioridade para classe CSS
    const getPrioridadeInfo = (prioridade: string) => {
      if (prioridade === 'EMERGENCIA') return { class: 'emergencia', texto: '🚨 EMERGÊNCIA' };
      if (prioridade === 'URGENTE') return { class: 'urgente', texto: '⚠️ URGENTE' };
      return { class: 'rotina', texto: '📋 ROTINA' };
    };

    const variables = {
      pacienteNome: citizen?.name || '-',
      pacienteCpf: citizen?.cpf || '-',
      pacienteDataNascimento: citizen?.birthDate,
      pacienteEndereco: (citizen as any)?.address || '',
      pacienteTelefone: (citizen as any)?.phone || '',
      profissionalNome: profissional?.name || '-',
      profissionalCrm: (profissional as any)?.crm || '-',
      profissionalEspecialidade: (profissional as any)?.especialidade || '',
      unidadeSaude: unidade?.nome || '-',
      dataSolicitacao: new Date(),
      hipoteseDiagnostica: consulta.hipoteseDiagnostica || '',
      cid10: (consulta.diagnosticosSecund as any)?.principal?.cid10 || '',
      exames: consulta.examesSolicitados.map((exame: any) => {
        const prioridadeInfo = getPrioridadeInfo(exame.prioridade);
        return {
          nome: exame.tipoExame,
          codigo: '',
          justificativa: exame.justificativa,
          observacoes: '',
          prioridadeClass: prioridadeInfo.class,
          prioridadeTexto: prioridadeInfo.texto
        };
      })
    };

    const templatePath = path.join(process.cwd(), 'templates', 'saude', 'solicitacao-exame.hbs');
    const fileName = `solicitacao_exames_${consultaId}_${Date.now()}.pdf`;
    const outputDir = path.join(process.cwd(), 'uploads', 'saude', 'exames');

    const result = await gerarPDF({
      templatePath,
      variables,
      fileName,
      outputDir
    });

    console.log(`✅ Solicitação de exames PDF gerada: ${fileName}`);
    return result.filePath;
  }

  /**
   * Gerar PDF de Encaminhamento
   */
  async gerarEncaminhamentoPDF(encaminhamentoId: string): Promise<string> {
    const encaminhamento = await prisma.encaminhamento.findUnique({
      where: { id: encaminhamentoId },
      include: {
        consulta: {
          include: {
            atendimento: true
          }
        }
      }
    });

    if (!encaminhamento) {
      throw new Error('Encaminhamento não encontrado');
    }

    // Buscar cidadão separadamente
    const citizen = await prisma.citizen.findUnique({
      where: { id: encaminhamento.consulta.atendimento.citizenId }
    });

    const profissional = await prisma.user.findFirst({
      where: { id: encaminhamento.consulta.medicoId }
    });

    const unidade = await prisma.unidadeSaude.findFirst({
      where: { id: encaminhamento.consulta.atendimento.unidadeId }
    });

    // Mapear prioridade
    let prioridadeClass = 'rotina';
    let prioridadeTexto = 'ROTINA';
    if (encaminhamento.prioridade === 'URGENCIA') {
      prioridadeClass = 'urgencia';
      prioridadeTexto = '🚨 URGÊNCIA';
    } else if (encaminhamento.prioridade === 'PRIORIDADE') {
      prioridadeClass = 'prioridade';
      prioridadeTexto = '⚠️ PRIORIDADE';
    }

    const variables = {
      pacienteNome: citizen?.name || '-',
      pacienteCpf: citizen?.cpf || '-',
      pacienteDataNascimento: citizen?.birthDate,
      profissionalNome: profissional?.name || '-',
      profissionalCrm: (profissional as any)?.crm || '-',
      profissionalEspecialidade: (profissional as any)?.especialidade || '',
      unidadeSaude: unidade?.nome || '-',
      especialidadeDestino: encaminhamento.especialidade,
      tipoEncaminhamentoTexto: 'Encaminhamento para Especialista',
      diagnostico: encaminhamento.motivo,
      cid10: '',
      justificativa: encaminhamento.motivo,
      observacoes: '',
      prioridadeClass,
      prioridadeTexto,
      dataEmissao: encaminhamento.dataHora
    };

    const templatePath = path.join(process.cwd(), 'templates', 'saude', 'encaminhamento.hbs');
    const fileName = `encaminhamento_${encaminhamentoId}_${Date.now()}.pdf`;
    const outputDir = path.join(process.cwd(), 'uploads', 'saude', 'encaminhamentos');

    const result = await gerarPDF({
      templatePath,
      variables,
      fileName,
      outputDir
    });

    console.log(`✅ Encaminhamento PDF gerado: ${fileName}`);
    return result.filePath;
  }
}

export default new PDFSaudeService();
