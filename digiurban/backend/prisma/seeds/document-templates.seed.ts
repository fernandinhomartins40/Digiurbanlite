/**
 * ============================================================================
 * SEEDS: Templates de Documentos Padrão
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { seedWorkflowDocumentTemplates } from './workflow-document-templates.seed';

const prisma = new PrismaClient();

async function seedDocumentTemplates() {
  console.log('🌱 Seeding document templates...');

  // Obter um usuario administrativo para ser o criador
  const createdBy = 'SYSTEM_SEED';

  // ============================================================================
  // TEMPLATE 1: CERTIDÃO DE PROTOCOLO
  // ============================================================================

  const certidaoTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'CERTIDAO_PROTOCOLO' },
    update: {},
    create: {
      name: 'Certidão de Protocolo',
      code: 'CERTIDAO_PROTOCOLO',
      description: 'Certidão/comprovante de abertura de protocolo',
      documentType: 'PROTOCOL_CERTIFICATE',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 60px 40px;">
  <!-- Cabeçalho -->
  <div style="text-align: center; margin-bottom: 50px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
    <h1 style="font-size: 28pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;">
      CERTIDÃO DE PROTOCOLO
    </h1>
    <p style="font-size: 16pt; color: #64748b; margin: 0;">
      Nº {{protocolNumber}}
    </p>
  </div>

  <!-- Corpo -->
  <div style="text-align: justify; line-height: 2; font-size: 12pt; margin-top: 40px;">
    <p style="margin-bottom: 20px;">
      Certificamos que o(a) cidadão(ã) <strong>{{citizenName}}</strong>,
      portador(a) do CPF <strong>{{citizenCpf}}</strong>, residente em
      <strong>{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</strong>,
      solicitou o serviço <strong>{{serviceName}}</strong> através do protocolo de número
      <strong>{{protocolNumber}}</strong>, em <strong>{{protocolCreatedAtFull}}</strong>.
    </p>

    <p style="margin-bottom: 20px;">
      O protocolo encontra-se atualmente com status: <strong>{{protocolStatus}}</strong>.
    </p>

    {{#if protocolDescription}}
    <p style="margin-bottom: 20px;">
      <strong>Descrição da solicitação:</strong><br>
      {{protocolDescription}}
    </p>
    {{/if}}

    <p style="margin-top: 40px; margin-bottom: 20px;">
      Esta certidão é válida para fins de comprovação de abertura de protocolo e
      acompanhamento do andamento da solicitação.
    </p>
  </div>

  <!-- Dados do Serviço -->
  <div style="margin-top: 50px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
    <h3 style="font-size: 14pt; color: #1e3a8a; margin-bottom: 15px;">Dados do Serviço</h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px 0; width: 180px;"><strong>Serviço:</strong></td>
        <td style="padding: 5px 0;">{{serviceName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Departamento:</strong></td>
        <td style="padding: 5px 0;">{{departmentName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Data de Abertura:</strong></td>
        <td style="padding: 5px 0;">{{protocolCreatedAtFull}}</td>
      </tr>
      {{#if protocolDueDate}}
      <tr>
        <td style="padding: 5px 0;"><strong>Prazo Estimado:</strong></td>
        <td style="padding: 5px 0;">{{protocolDueDate}}</td>
      </tr>
      {{/if}}
    </table>
  </div>

  <!-- Rodapé -->
  <div style="margin-top: 80px; text-align: right;">
    <p style="font-size: 10pt; color: #64748b; margin-bottom: 5px;">
      {{generatedAtDate}}
    </p>
    <div style="margin-top: 50px; border-top: 2px solid #334155; padding-top: 10px; width: 300px; float: right;">
      <p style="font-size: 11pt; text-align: center; margin: 0;">
        <strong>{{departmentName}}</strong>
      </p>
    </div>
  </div>

  <!-- Autenticidade -->
  <div style="clear: both; margin-top: 100px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;">
    <p style="margin: 0;">
      Documento gerado eletronicamente em {{generatedAt}}
    </p>
    <p style="margin: 5px 0 0 0;">
      Este documento possui validade jurídica e pode ser autenticado através do código: {{protocolNumber}}
    </p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome completo do cidadão', example: 'João da Silva' },
        { name: 'citizenCpf', description: 'CPF formatado', example: '123.456.789-00' },
        { name: 'serviceName', description: 'Nome do serviço', example: 'Alvará de Funcionamento' },
        { name: 'departmentName', description: 'Nome do departamento', example: 'Secretaria de Obras' },
        { name: 'protocolStatus', description: 'Status do protocolo', example: 'EM_PROGRESSO' },
        { name: 'protocolCreatedAt', description: 'Data de criação', example: '12/01/2026' },
        { name: 'generatedAt', description: 'Data/hora de geração', example: '12/01/2026 14:30' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${certidaoTemplate.name}`);

  // ============================================================================
  // TEMPLATE 2: RELATÓRIO DE CONCLUSÃO
  // ============================================================================

  const relatorioTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'RELATORIO_CONCLUSAO' },
    update: {},
    create: {
      name: 'Relatório de Conclusão',
      code: 'RELATORIO_CONCLUSAO',
      description: 'Relatório completo de conclusão do protocolo com histórico e dados',
      documentType: 'COMPLETION_REPORT',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 40px;">
  <!-- Cabeçalho -->
  <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
    <h1 style="font-size: 24pt; color: #1e3a8a; margin-bottom: 5px;">RELATÓRIO DE CONCLUSÃO</h1>
    <h2 style="font-size: 16pt; color: #64748b; margin: 0;">Protocolo {{protocolNumber}}</h2>
  </div>

  <!-- 1. DADOS DO SOLICITANTE -->
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      1. DADOS DO SOLICITANTE
    </h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 8px; width: 150px; background-color: #f8fafc;"><strong>Nome:</strong></td>
        <td style="padding: 8px;">{{citizenName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>CPF:</strong></td>
        <td style="padding: 8px;">{{citizenCpf}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Email:</strong></td>
        <td style="padding: 8px;">{{citizenEmail}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Telefone:</strong></td>
        <td style="padding: 8px;">{{citizenPhone}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Endereço:</strong></td>
        <td style="padding: 8px;">{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}} - {{citizenZipCode}}</td>
      </tr>
    </table>
  </div>

  <!-- 2. DADOS DO SERVIÇO -->
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      2. DADOS DO SERVIÇO
    </h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 8px; width: 150px; background-color: #f8fafc;"><strong>Serviço:</strong></td>
        <td style="padding: 8px;">{{serviceName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Departamento:</strong></td>
        <td style="padding: 8px;">{{departmentName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Data de Abertura:</strong></td>
        <td style="padding: 8px;">{{protocolCreatedAtFull}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Data de Conclusão:</strong></td>
        <td style="padding: 8px;">{{protocolConcludedAtFull}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>Status Final:</strong></td>
        <td style="padding: 8px;"><strong>{{protocolStatus}}</strong></td>
      </tr>
    </table>
  </div>

  <!-- 3. DADOS FORNECIDOS -->
  {{#if hasDataFields}}
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      3. DADOS FORNECIDOS
    </h3>
    <table style="width: 100%; font-size: 11pt; border-collapse: collapse;">
      {{#each dataFields}}
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; width: 40%; background-color: #f8fafc;"><strong>{{label}}:</strong></td>
        <td style="padding: 8px;">{{value}}</td>
      </tr>
      {{/each}}
    </table>
  </div>
  {{/if}}

  <!-- 4. DOCUMENTOS APROVADOS -->
  {{#if hasDocuments}}
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      4. DOCUMENTOS APROVADOS
    </h3>
    <table style="width: 100%; font-size: 11pt;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Documento</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Data de Aprovação</th>
        </tr>
      </thead>
      <tbody>
        {{#each documents}}
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px;">{{type}}</td>
          <td style="padding: 8px;">{{approvedAt}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <!-- 5. HISTÓRICO DE ETAPAS -->
  {{#if hasStages}}
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      5. HISTÓRICO DE ETAPAS
    </h3>
    <ol style="margin-top: 10px; font-size: 11pt; line-height: 1.8;">
      {{#each stages}}
      <li style="margin-bottom: 10px;">
        <strong>{{name}}</strong>
        {{#if isCompleted}}
        <span style="color: #16a34a;"> - Concluída em {{completedAt}}</span>
        {{else if isInProgress}}
        <span style="color: #eab308;"> - Em andamento</span>
        {{else}}
        <span style="color: #64748b;"> - Pendente</span>
        {{/if}}
        {{#if notes}}
        <br><span style="font-size: 10pt; color: #64748b;">Observações: {{notes}}</span>
        {{/if}}
      </li>
      {{/each}}
    </ol>
  </div>
  {{/if}}

  <!-- 6. OBSERVAÇÕES FINAIS -->
  {{#if finalNotes}}
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      6. OBSERVAÇÕES FINAIS
    </h3>
    <p style="text-align: justify; font-size: 11pt; line-height: 1.8; padding: 15px; background-color: #fef3c7; border-left: 4px solid #eab308;">
      {{finalNotes}}
    </p>
  </div>
  {{/if}}

  <!-- Rodapé -->
  <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #cbd5e1;">
    <p style="text-align: center; font-size: 10pt; color: #64748b;">
      Documento gerado em {{generatedAt}}
    </p>
    <p style="text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 10px;">
      Este documento foi gerado eletronicamente e possui validade jurídica.<br>
      Código de autenticação: {{protocolNumber}}
    </p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome completo', example: 'João da Silva' },
        { name: 'dataFields', description: 'Array de campos aprovados', example: '[{label, value}]' },
        { name: 'documents', description: 'Array de documentos aprovados', example: '[{type, approvedAt}]' },
        { name: 'stages', description: 'Array de etapas', example: '[{name, status, completedAt}]' },
        { name: 'finalNotes', description: 'Observações finais', example: 'Protocolo concluído com sucesso' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${relatorioTemplate.name}`);

  // ============================================================================
  // TEMPLATE 3: RECIBO DE ATENDIMENTO
  // ============================================================================

  const reciboTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'RECIBO_ATENDIMENTO' },
    update: {},
    create: {
      name: 'Recibo de Atendimento',
      code: 'RECIBO_ATENDIMENTO',
      description: 'Recibo comprovando o atendimento e recebimento de documentos',
      documentType: 'RECEIPT',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 60px 40px;">
  <!-- Cabeçalho com Brasão/Logo -->
  <div style="text-align: center; margin-bottom: 40px;">
    {{#if municipalityLogo}}
    <img src="{{municipalityLogo}}" alt="Brasão" style="max-width: 100px; margin-bottom: 20px;">
    {{/if}}
    <h2 style="font-size: 14pt; color: #1e3a8a; margin: 5px 0;">{{municipalityName}}</h2>
    <p style="font-size: 11pt; color: #64748b; margin: 0;">{{departmentName}}</p>
    <p style="font-size: 10pt; color: #64748b; margin: 5px 0;">{{municipalityAddress}}</p>
  </div>

  <!-- Título -->
  <div style="text-align: center; margin-bottom: 40px; padding: 20px; background-color: #f8fafc; border: 2px solid #2563eb;">
    <h1 style="font-size: 24pt; color: #1e3a8a; margin: 0; font-weight: bold;">
      RECIBO DE ATENDIMENTO
    </h1>
    <p style="font-size: 14pt; color: #64748b; margin: 10px 0 0 0;">
      Nº {{protocolNumber}}
    </p>
  </div>

  <!-- Corpo -->
  <div style="line-height: 2; font-size: 12pt; margin-top: 40px;">
    <p style="margin-bottom: 30px; text-align: justify;">
      Declaramos para os devidos fins que recebemos em <strong>{{generatedAtDate}}</strong>,
      do(a) Sr(a). <strong>{{citizenName}}</strong>, portador(a) do CPF <strong>{{citizenCpf}}</strong>,
      residente em <strong>{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</strong>,
      a solicitação de serviço referente a <strong>{{serviceName}}</strong>.
    </p>

    <p style="margin-bottom: 30px; text-align: justify;">
      Foi gerado o protocolo de número <strong>{{protocolNumber}}</strong> para acompanhamento
      da solicitação.
    </p>

    {{#if receivedDocuments}}
    <p style="margin-bottom: 15px;"><strong>Documentos Recebidos:</strong></p>
    <ul style="margin-left: 30px; margin-bottom: 30px; line-height: 1.8;">
      {{#each receivedDocuments}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    {{/if}}

    <p style="margin-bottom: 30px; text-align: justify;">
      O atendimento foi realizado por <strong>{{attendantName}}</strong> em
      <strong>{{protocolCreatedAtFull}}</strong>.
    </p>
  </div>

  <!-- Dados de Contato -->
  <div style="margin-top: 40px; padding: 20px; background-color: #f1f5f9; border-left: 4px solid #0ea5e9;">
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;">Acompanhamento</h3>
    <p style="font-size: 11pt; margin: 5px 0;">
      <strong>Protocolo:</strong> {{protocolNumber}}
    </p>
    <p style="font-size: 11pt; margin: 5px 0;">
      <strong>Portal do Cidadão:</strong> {{citizenPortalUrl}}
    </p>
    <p style="font-size: 11pt; margin: 5px 0;">
      <strong>Telefone:</strong> {{municipalityPhone}}
    </p>
  </div>

  <!-- Assinatura -->
  <div style="margin-top: 80px;">
    <div style="text-align: center;">
      <div style="border-top: 2px solid #334155; padding-top: 10px; width: 350px; margin: 0 auto;">
        <p style="font-size: 11pt; margin: 5px 0;"><strong>{{attendantName}}</strong></p>
        <p style="font-size: 10pt; color: #64748b; margin: 0;">{{attendantRole}}</p>
        <p style="font-size: 10pt; color: #64748b; margin: 0;">{{departmentName}}</p>
      </div>
    </div>
  </div>

  <!-- Rodapé -->
  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;">
    <p style="margin: 0;">Documento gerado eletronicamente em {{generatedAt}}</p>
    <p style="margin: 5px 0 0 0;">Autenticidade verificável através do código: {{protocolNumber}}</p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome do cidadão', example: 'João da Silva' },
        { name: 'citizenCpf', description: 'CPF formatado', example: '123.456.789-00' },
        { name: 'serviceName', description: 'Nome do serviço', example: 'Alvará de Funcionamento' },
        { name: 'attendantName', description: 'Nome do atendente', example: 'Maria Santos' },
        { name: 'attendantRole', description: 'Cargo do atendente', example: 'Atendente' },
        { name: 'receivedDocuments', description: 'Array de documentos recebidos', example: '["RG", "CPF", "Comprovante de Residência"]' },
        { name: 'municipalityName', description: 'Nome do município', example: 'Prefeitura Municipal de São Paulo' },
        { name: 'municipalityLogo', description: 'URL do logo/brasão', example: '/uploads/brasao.png' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${reciboTemplate.name}`);

  // ============================================================================
  // TEMPLATE 4: AUTORIZAÇÃO/ALVARÁ
  // ============================================================================

  const autorizacaoTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'AUTORIZACAO_ALVARA' },
    update: {},
    create: {
      name: 'Autorização/Alvará',
      code: 'AUTORIZACAO_ALVARA',
      description: 'Documento oficial de autorização ou concessão de alvará',
      documentType: 'AUTHORIZATION',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 50px 40px;">
  <!-- Cabeçalho Oficial -->
  <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #16a34a;">
    {{#if municipalityLogo}}
    <img src="{{municipalityLogo}}" alt="Brasão" style="max-width: 120px; margin-bottom: 15px;">
    {{/if}}
    <h2 style="font-size: 16pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;">{{municipalityName}}</h2>
    <p style="font-size: 12pt; color: #64748b; margin: 5px 0;">{{departmentName}}</p>
    <p style="font-size: 10pt; color: #64748b; margin: 0;">CNPJ: {{municipalityCnpj}}</p>
  </div>

  <!-- Título -->
  <div style="text-align: center; margin-bottom: 50px;">
    <h1 style="font-size: 28pt; color: #16a34a; margin-bottom: 10px; font-weight: bold;">
      {{authorizationType}}
    </h1>
    <p style="font-size: 18pt; color: #64748b; margin: 0;">
      Nº {{authorizationNumber}}
    </p>
  </div>

  <!-- Dados do Autorizado -->
  <div style="margin-bottom: 40px; padding: 25px; background-color: #f0fdf4; border-left: 5px solid #16a34a;">
    <h3 style="font-size: 14pt; color: #15803d; margin-bottom: 15px;">Dados do Titular</h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px 0; width: 150px;"><strong>Nome/Razão Social:</strong></td>
        <td style="padding: 5px 0;">{{citizenName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>CPF/CNPJ:</strong></td>
        <td style="padding: 5px 0;">{{citizenCpf}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Endereço:</strong></td>
        <td style="padding: 5px 0;">{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</td>
      </tr>
      {{#if businessActivity}}
      <tr>
        <td style="padding: 5px 0;"><strong>Atividade:</strong></td>
        <td style="padding: 5px 0;">{{businessActivity}}</td>
      </tr>
      {{/if}}
    </table>
  </div>

  <!-- Corpo da Autorização -->
  <div style="text-align: justify; line-height: 2; font-size: 12pt; margin-bottom: 40px;">
    <p style="margin-bottom: 25px;">
      A <strong>{{municipalityName}}</strong>, no uso de suas atribuições legais e tendo em vista
      o que consta no processo/protocolo <strong>{{protocolNumber}}</strong>, e considerando o
      cumprimento de todas as exigências legais e técnicas aplicáveis,
    </p>

    <p style="text-align: center; font-size: 16pt; margin: 40px 0; font-weight: bold; color: #16a34a;">
      AUTORIZA
    </p>

    <p style="margin-bottom: 25px;">
      O(A) titular acima identificado(a) a exercer a atividade de <strong>{{serviceName}}</strong>,
      conforme as condições e especificações constantes no processo.
    </p>

    {{#if conditions}}
    <p style="margin-bottom: 15px;"><strong>Condições e Observações:</strong></p>
    <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #eab308; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 11pt; line-height: 1.6;">{{conditions}}</p>
    </div>
    {{/if}}

    {{#if validityPeriod}}
    <p style="margin-bottom: 25px;">
      <strong>Validade:</strong> {{validityPeriod}}
    </p>
    {{/if}}
  </div>

  <!-- Dados da Emissão -->
  <div style="margin-bottom: 60px; padding: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px; width: 50%;"><strong>Protocolo:</strong> {{protocolNumber}}</td>
        <td style="padding: 5px;"><strong>Data de Emissão:</strong> {{generatedAtDate}}</td>
      </tr>
      <tr>
        <td style="padding: 5px;"><strong>Responsável:</strong> {{approverName}}</td>
        <td style="padding: 5px;"><strong>Matrícula:</strong> {{approverRegistration}}</td>
      </tr>
    </table>
  </div>

  <!-- Assinatura Digital -->
  <div style="margin-top: 80px; text-align: center;">
    <div style="border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;">
      <p style="font-size: 12pt; margin: 5px 0;"><strong>{{approverName}}</strong></p>
      <p style="font-size: 11pt; color: #64748b; margin: 0;">{{approverRole}}</p>
      <p style="font-size: 10pt; color: #64748b; margin: 0;">{{departmentName}}</p>
      {{#if digitalSignature}}
      <p style="font-size: 9pt; color: #16a34a; margin-top: 10px;">
        ✓ Documento assinado digitalmente
      </p>
      {{/if}}
    </div>
  </div>

  <!-- Rodapé com Autenticidade -->
  <div style="margin-top: 80px; padding: 20px; background-color: #f1f5f9; border-top: 2px solid #2563eb;">
    <p style="text-align: center; font-size: 9pt; color: #64748b; margin: 0;">
      Este documento foi gerado eletronicamente em {{generatedAt}} e possui validade jurídica.
    </p>
    <p style="text-align: center; font-size: 9pt; color: #64748b; margin: 5px 0 0 0;">
      Código de autenticação: <strong>{{authorizationNumber}}</strong> | Protocolo: <strong>{{protocolNumber}}</strong>
    </p>
    <p style="text-align: center; font-size: 8pt; color: #94a3b8; margin: 5px 0 0 0;">
      Verifique a autenticidade em: {{municipalityWebsite}}/validacao
    </p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'authorizationType', description: 'Tipo de autorização', example: 'ALVARÁ DE FUNCIONAMENTO' },
        { name: 'authorizationNumber', description: 'Número da autorização', example: '2026/00123' },
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome/Razão Social', example: 'Empresa XYZ Ltda' },
        { name: 'citizenCpf', description: 'CPF/CNPJ', example: '12.345.678/0001-90' },
        { name: 'serviceName', description: 'Nome do serviço/atividade', example: 'Comércio Varejista' },
        { name: 'businessActivity', description: 'Atividade empresarial', example: 'Venda de produtos alimentícios' },
        { name: 'conditions', description: 'Condições e observações', example: 'Válido por 12 meses' },
        { name: 'validityPeriod', description: 'Período de validade', example: '12 meses a partir da data de emissão' },
        { name: 'approverName', description: 'Nome do aprovador', example: 'João Silva' },
        { name: 'approverRole', description: 'Cargo do aprovador', example: 'Secretário de Obras' },
        { name: 'municipalityName', description: 'Nome do município', example: 'Prefeitura Municipal' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${autorizacaoTemplate.name}`);

  // ============================================================================
  // TEMPLATE 5: NOTIFICAÇÃO
  // ============================================================================

  const notificacaoTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'NOTIFICACAO_OFICIAL' },
    update: {},
    create: {
      name: 'Notificação Oficial',
      code: 'NOTIFICACAO_OFICIAL',
      description: 'Notificação oficial para comunicação de pendências ou irregularidades',
      documentType: 'NOTIFICATION',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 50px 40px;">
  <!-- Cabeçalho -->
  <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #dc2626;">
    {{#if municipalityLogo}}
    <img src="{{municipalityLogo}}" alt="Brasão" style="max-width: 120px; margin-bottom: 15px;">
    {{/if}}
    <h2 style="font-size: 16pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;">{{municipalityName}}</h2>
    <p style="font-size: 12pt; color: #64748b; margin: 5px 0;">{{departmentName}}</p>
  </div>

  <!-- Título -->
  <div style="text-align: center; margin-bottom: 50px; padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626;">
    <h1 style="font-size: 26pt; color: #dc2626; margin: 0; font-weight: bold;">
      NOTIFICAÇÃO
    </h1>
    <p style="font-size: 16pt; color: #991b1b; margin: 10px 0 0 0;">
      Nº {{notificationNumber}}
    </p>
  </div>

  <!-- Destinatário -->
  <div style="margin-bottom: 40px;">
    <p style="font-size: 12pt; margin: 5px 0;"><strong>Destinatário:</strong> {{citizenName}}</p>
    <p style="font-size: 12pt; margin: 5px 0;"><strong>CPF/CNPJ:</strong> {{citizenCpf}}</p>
    <p style="font-size: 12pt; margin: 5px 0;"><strong>Endereço:</strong> {{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</p>
    {{#if protocolNumber}}
    <p style="font-size: 12pt; margin: 5px 0;"><strong>Protocolo Ref.:</strong> {{protocolNumber}}</p>
    {{/if}}
  </div>

  <!-- Corpo da Notificação -->
  <div style="text-align: justify; line-height: 1.8; font-size: 12pt; margin-bottom: 40px;">
    <p style="margin-bottom: 25px;">
      Pelo presente, a <strong>{{municipalityName}}</strong>, através do(a) <strong>{{departmentName}}</strong>,
      no uso de suas atribuições legais,
    </p>

    <p style="text-align: center; font-size: 16pt; margin: 30px 0; font-weight: bold; color: #dc2626;">
      NOTIFICA
    </p>

    <p style="margin-bottom: 25px;">
      O(A) destinatário(a) acima identificado(a) sobre o seguinte:
    </p>

    <!-- Assunto -->
    <div style="padding: 20px; background-color: #fef3c7; border-left: 5px solid #eab308; margin-bottom: 30px;">
      <h3 style="font-size: 13pt; color: #92400e; margin-bottom: 10px;">Assunto:</h3>
      <p style="margin: 0; font-size: 11pt; line-height: 1.6;">{{notificationSubject}}</p>
    </div>

    <!-- Descrição -->
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;">Descrição:</h3>
      <p style="font-size: 11pt; line-height: 1.8;">{{notificationDescription}}</p>
    </div>

    {{#if requirements}}
    <!-- Exigências -->
    <div style="margin-bottom: 30px; padding: 20px; background-color: #fef2f2; border: 2px solid #fca5a5;">
      <h3 style="font-size: 13pt; color: #dc2626; margin-bottom: 15px;">Providências Necessárias:</h3>
      <p style="font-size: 11pt; line-height: 1.6; margin: 0;">{{requirements}}</p>
    </div>
    {{/if}}

    {{#if deadline}}
    <!-- Prazo -->
    <div style="margin-bottom: 30px; padding: 15px; background-color: #fee2e2; border-left: 5px solid #dc2626;">
      <p style="margin: 0; font-size: 12pt; font-weight: bold;">
        ⏰ Prazo para Regularização: <span style="color: #dc2626;">{{deadline}}</span>
      </p>
    </div>
    {{/if}}

    <!-- Advertências -->
    <div style="margin-top: 30px; padding: 20px; background-color: #fefce8; border: 1px solid #eab308;">
      <p style="font-size: 10pt; color: #713f12; line-height: 1.6; margin: 0;">
        <strong>IMPORTANTE:</strong> O não cumprimento das determinações desta notificação no prazo estabelecido
        poderá acarretar sanções administrativas previstas na legislação municipal vigente, incluindo multas e
        outras penalidades cabíveis.
      </p>
    </div>

    {{#if legalBasis}}
    <p style="margin-top: 30px; font-size: 10pt; color: #64748b;">
      <strong>Fundamentação Legal:</strong> {{legalBasis}}
    </p>
    {{/if}}
  </div>

  <!-- Dados da Notificação -->
  <div style="margin-bottom: 60px; padding: 15px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px;"><strong>Data de Emissão:</strong> {{generatedAtDate}}</td>
        <td style="padding: 5px;"><strong>Notificação Nº:</strong> {{notificationNumber}}</td>
      </tr>
      <tr>
        <td style="padding: 5px;"><strong>Responsável:</strong> {{issuerName}}</td>
        <td style="padding: 5px;"><strong>Matrícula:</strong> {{issuerRegistration}}</td>
      </tr>
    </table>
  </div>

  <!-- Assinatura -->
  <div style="margin-top: 80px; text-align: center;">
    <div style="border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;">
      <p style="font-size: 12pt; margin: 5px 0;"><strong>{{issuerName}}</strong></p>
      <p style="font-size: 11pt; color: #64748b; margin: 0;">{{issuerRole}}</p>
      <p style="font-size: 10pt; color: #64748b; margin: 0;">{{departmentName}}</p>
    </div>
  </div>

  <!-- Rodapé -->
  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;">
    <p style="margin: 0;">Documento gerado eletronicamente em {{generatedAt}}</p>
    <p style="margin: 5px 0 0 0;">Código de autenticação: {{notificationNumber}}</p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'notificationNumber', description: 'Número da notificação', example: 'NOT-2026/00123' },
        { name: 'citizenName', description: 'Nome do destinatário', example: 'João da Silva' },
        { name: 'notificationSubject', description: 'Assunto da notificação', example: 'Irregularidade em construção' },
        { name: 'notificationDescription', description: 'Descrição detalhada', example: 'Foi constatado...' },
        { name: 'requirements', description: 'Providências necessárias', example: 'Regularizar a situação em 30 dias' },
        { name: 'deadline', description: 'Prazo para regularização', example: '30 dias corridos' },
        { name: 'legalBasis', description: 'Base legal', example: 'Lei Municipal nº 1234/2020' },
        { name: 'issuerName', description: 'Nome do emissor', example: 'Maria Santos' },
        { name: 'issuerRole', description: 'Cargo do emissor', example: 'Fiscal Municipal' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${notificacaoTemplate.name}`);

  // ============================================================================
  // TEMPLATE 6: PARECER TÉCNICO
  // ============================================================================

  const parecerTemplate = await prisma.documentTemplate.upsert({
    where: { code: 'PARECER_TECNICO' },
    update: {},
    create: {
      name: 'Parecer Técnico',
      code: 'PARECER_TECNICO',
      description: 'Parecer técnico para análise de solicitações',
      documentType: 'CUSTOM',
      outputFormat: 'PDF',
      isGlobal: true,
      createdBy,

      htmlTemplate: `
<div style="padding: 50px 40px;">
  <!-- Cabeçalho -->
  <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
    {{#if municipalityLogo}}
    <img src="{{municipalityLogo}}" alt="Brasão" style="max-width: 100px; margin-bottom: 15px;">
    {{/if}}
    <h2 style="font-size: 15pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;">{{municipalityName}}</h2>
    <p style="font-size: 11pt; color: #64748b; margin: 5px 0;">{{departmentName}}</p>
  </div>

  <!-- Título -->
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="font-size: 24pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;">
      PARECER TÉCNICO
    </h1>
    <p style="font-size: 14pt; color: #64748b; margin: 0;">
      Nº {{technicalOpinionNumber}}
    </p>
  </div>

  <!-- Dados do Processo -->
  <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;">Dados do Processo</h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px 0; width: 180px;"><strong>Protocolo:</strong></td>
        <td style="padding: 5px 0;">{{protocolNumber}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Interessado:</strong></td>
        <td style="padding: 5px 0;">{{citizenName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Assunto:</strong></td>
        <td style="padding: 5px 0;">{{serviceName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Data de Abertura:</strong></td>
        <td style="padding: 5px 0;">{{protocolCreatedAtFull}}</td>
      </tr>
    </table>
  </div>

  <!-- Corpo do Parecer -->
  <div style="text-align: justify; line-height: 1.8; font-size: 11pt;">
    <!-- Histórico -->
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      1. HISTÓRICO
    </h3>
    <p style="margin-bottom: 20px;">{{opinionHistory}}</p>

    <!-- Análise Técnica -->
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      2. ANÁLISE TÉCNICA
    </h3>
    <p style="margin-bottom: 20px;">{{technicalAnalysis}}</p>

    {{#if legalAnalysis}}
    <!-- Análise Legal -->
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      3. FUNDAMENTAÇÃO LEGAL
    </h3>
    <p style="margin-bottom: 20px;">{{legalAnalysis}}</p>
    {{/if}}

    {{#if requirements}}
    <!-- Exigências/Recomendações -->
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      4. EXIGÊNCIAS/RECOMENDAÇÕES
    </h3>
    <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #eab308; margin-bottom: 20px;">
      <p style="margin: 0;">{{requirements}}</p>
    </div>
    {{/if}}

    <!-- Conclusão -->
    <h3 style="font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
      {{#if requirements}}5{{else}}4{{/if}}. CONCLUSÃO
    </h3>
    <div style="padding: 20px; background-color: {{conclusionBackgroundColor}}; border: 2px solid {{conclusionBorderColor}}; margin-bottom: 20px;">
      <p style="text-align: center; font-size: 14pt; font-weight: bold; color: {{conclusionColor}}; margin: 0;">
        {{conclusion}}
      </p>
    </div>

    {{#if observations}}
    <p style="margin-top: 20px; font-size: 10pt; color: #64748b;">
      <strong>Observações:</strong> {{observations}}
    </p>
    {{/if}}
  </div>

  <!-- Dados do Responsável -->
  <div style="margin-top: 60px; margin-bottom: 40px; padding: 15px; background-color: #f1f5f9; border: 1px solid #cbd5e1;">
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 5px;"><strong>Responsável Técnico:</strong> {{technicalResponsible}}</td>
        <td style="padding: 5px;"><strong>Registro:</strong> {{technicalRegistration}}</td>
      </tr>
      <tr>
        <td style="padding: 5px;"><strong>Data do Parecer:</strong> {{generatedAtDate}}</td>
        <td style="padding: 5px;"><strong>Parecer Nº:</strong> {{technicalOpinionNumber}}</td>
      </tr>
    </table>
  </div>

  <!-- Assinatura -->
  <div style="margin-top: 80px; text-align: center;">
    <div style="border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;">
      <p style="font-size: 12pt; margin: 5px 0;"><strong>{{technicalResponsible}}</strong></p>
      <p style="font-size: 11pt; color: #64748b; margin: 0;">{{technicalRole}}</p>
      <p style="font-size: 10pt; color: #64748b; margin: 0;">Registro: {{technicalRegistration}}</p>
    </div>
  </div>

  <!-- Rodapé -->
  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;">
    <p style="margin: 0;">Documento gerado eletronicamente em {{generatedAt}}</p>
    <p style="margin: 5px 0 0 0;">Código de autenticação: {{technicalOpinionNumber}}</p>
  </div>
</div>
      `,

      cssStyles: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
        }
      `,

      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },

      availableVariables: [
        { name: 'technicalOpinionNumber', description: 'Número do parecer', example: 'PT-2026/00123' },
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'opinionHistory', description: 'Histórico do processo', example: 'O interessado solicitou...' },
        { name: 'technicalAnalysis', description: 'Análise técnica', example: 'Após vistoria realizada...' },
        { name: 'legalAnalysis', description: 'Fundamentação legal', example: 'De acordo com a Lei...' },
        { name: 'requirements', description: 'Exigências/Recomendações', example: 'Recomenda-se...' },
        { name: 'conclusion', description: 'Conclusão do parecer', example: 'FAVORÁVEL' },
        { name: 'conclusionColor', description: 'Cor da conclusão', example: '#16a34a' },
        { name: 'conclusionBackgroundColor', description: 'Cor de fundo da conclusão', example: '#f0fdf4' },
        { name: 'conclusionBorderColor', description: 'Cor da borda da conclusão', example: '#16a34a' },
        { name: 'technicalResponsible', description: 'Nome do responsável técnico', example: 'Eng. Carlos Santos' },
        { name: 'technicalRegistration', description: 'Registro profissional', example: 'CREA 12345/SP' },
        { name: 'technicalRole', description: 'Cargo do responsável', example: 'Engenheiro Civil' }
      ] as any
    }
  });

  console.log(`   ✓ Template criado: ${parecerTemplate.name}`);

  const workflowSummary = await seedWorkflowDocumentTemplates({
    prisma,
    createdBy,
  });

  console.log(
    `✅ Seed de templates concluido: 6 templates base + ` +
      `${workflowSummary.templatesCreated} criado(s) e ` +
      `${workflowSummary.templatesUpdated} atualizado(s) por servico/workflow.`
  );
}

export default seedDocumentTemplates;

// Executar se chamado diretamente
if (require.main === module) {
  seedDocumentTemplates()
    .then(() => {
      console.log('✅ Seed concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no seed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
