/**
 * ============================================================================
 * SEEDS: Templates de Documentos Padrão
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDocumentTemplates() {
  console.log('🌱 Seeding document templates...');

  // Obter um usuário SUPER_ADMIN para ser o criador
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    console.error('❌ Nenhum SUPER_ADMIN encontrado. Execute o seed de usuários primeiro.');
    return;
  }

  const createdBy = superAdmin.id;

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

  console.log(`✅ ${2} templates de documentos criados com sucesso!`);
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
