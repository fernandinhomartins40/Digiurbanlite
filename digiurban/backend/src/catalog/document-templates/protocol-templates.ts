/**
 * Modelos de documento do PROTOCOLO no catálogo da plataforma (HTML com
 * variáveis {{...}}). Aplicados a todo município por applyDocumentTemplateCatalog
 * (regra "só acrescenta"). Extraídos do antigo prisma/seeds/document-templates.seed.ts.
 * Gerado uma vez; editar aqui muda o modelo nos municípios que NÃO editaram o deles.
 */

export interface CatalogProtocolTemplate {
  name: string;
  code: string;
  description?: string;
  documentType: 'PROTOCOL_CERTIFICATE' | 'COMPLETION_REPORT' | 'RECEIPT' | 'AUTHORIZATION' | 'NOTIFICATION' | 'CUSTOM';
  outputFormat?: 'PDF' | 'DOCX' | 'HTML';
  isGlobal?: boolean;
  htmlTemplate: string;
  headerHtml?: string;
  footerHtml?: string;
  cssStyles?: string;
  pageSize?: string;
  orientation?: string;
  margins?: unknown;
  availableVariables?: unknown;
  inputSchema?: unknown;
  requiresSignature?: boolean;
  signatureFields?: unknown;
  allowedStageTypes?: unknown;
}

export const PROTOCOL_TEMPLATES: CatalogProtocolTemplate[] = [
  {
    "name": "Certidão de Protocolo",
    "code": "CERTIDAO_PROTOCOLO",
    "description": "Certidão/comprovante de abertura de protocolo",
    "documentType": "PROTOCOL_CERTIFICATE",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 60px 40px;\">\n  <!-- Cabeçalho -->\n  <div style=\"text-align: center; margin-bottom: 50px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;\">\n    <h1 style=\"font-size: 28pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;\">\n      CERTIDÃO DE PROTOCOLO\n    </h1>\n    <p style=\"font-size: 16pt; color: #64748b; margin: 0;\">\n      Nº {{protocolNumber}}\n    </p>\n  </div>\n\n  <!-- Corpo -->\n  <div style=\"text-align: justify; line-height: 2; font-size: 12pt; margin-top: 40px;\">\n    <p style=\"margin-bottom: 20px;\">\n      Certificamos que o(a) cidadão(ã) <strong>{{citizenName}}</strong>,\n      portador(a) do CPF <strong>{{citizenCpf}}</strong>, residente em\n      <strong>{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</strong>,\n      solicitou o serviço <strong>{{serviceName}}</strong> através do protocolo de número\n      <strong>{{protocolNumber}}</strong>, em <strong>{{protocolCreatedAtFull}}</strong>.\n    </p>\n\n    <p style=\"margin-bottom: 20px;\">\n      O protocolo encontra-se atualmente com status: <strong>{{protocolStatus}}</strong>.\n    </p>\n\n    {{#if protocolDescription}}\n    <p style=\"margin-bottom: 20px;\">\n      <strong>Descrição da solicitação:</strong><br>\n      {{protocolDescription}}\n    </p>\n    {{/if}}\n\n    <p style=\"margin-top: 40px; margin-bottom: 20px;\">\n      Esta certidão é válida para fins de comprovação de abertura de protocolo e\n      acompanhamento do andamento da solicitação.\n    </p>\n  </div>\n\n  <!-- Dados do Serviço -->\n  <div style=\"margin-top: 50px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb;\">\n    <h3 style=\"font-size: 14pt; color: #1e3a8a; margin-bottom: 15px;\">Dados do Serviço</h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px 0; width: 180px;\"><strong>Serviço:</strong></td>\n        <td style=\"padding: 5px 0;\">{{serviceName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Departamento:</strong></td>\n        <td style=\"padding: 5px 0;\">{{departmentName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Data de Abertura:</strong></td>\n        <td style=\"padding: 5px 0;\">{{protocolCreatedAtFull}}</td>\n      </tr>\n      {{#if protocolDueDate}}\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Prazo Estimado:</strong></td>\n        <td style=\"padding: 5px 0;\">{{protocolDueDate}}</td>\n      </tr>\n      {{/if}}\n    </table>\n  </div>\n\n  <!-- Rodapé -->\n  <div style=\"margin-top: 80px; text-align: right;\">\n    <p style=\"font-size: 10pt; color: #64748b; margin-bottom: 5px;\">\n      {{generatedAtDate}}\n    </p>\n    <div style=\"margin-top: 50px; border-top: 2px solid #334155; padding-top: 10px; width: 300px; float: right;\">\n      <p style=\"font-size: 11pt; text-align: center; margin: 0;\">\n        <strong>{{departmentName}}</strong>\n      </p>\n    </div>\n  </div>\n\n  <!-- Autenticidade -->\n  <div style=\"clear: both; margin-top: 100px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;\">\n    <p style=\"margin: 0;\">\n      Documento gerado eletronicamente em {{generatedAt}}\n    </p>\n    <p style=\"margin: 5px 0 0 0;\">\n      Este documento possui validade jurídica e pode ser autenticado através do código: {{protocolNumber}}\n    </p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: 'Times New Roman', Times, serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "protocolNumber",
        "description": "Número do protocolo",
        "example": "2026/00123"
      },
      {
        "name": "citizenName",
        "description": "Nome completo do cidadão",
        "example": "João da Silva"
      },
      {
        "name": "citizenCpf",
        "description": "CPF formatado",
        "example": "123.456.789-00"
      },
      {
        "name": "serviceName",
        "description": "Nome do serviço",
        "example": "Alvará de Funcionamento"
      },
      {
        "name": "departmentName",
        "description": "Nome do departamento",
        "example": "Secretaria de Obras"
      },
      {
        "name": "protocolStatus",
        "description": "Status do protocolo",
        "example": "EM_PROGRESSO"
      },
      {
        "name": "protocolCreatedAt",
        "description": "Data de criação",
        "example": "12/01/2026"
      },
      {
        "name": "generatedAt",
        "description": "Data/hora de geração",
        "example": "12/01/2026 14:30"
      }
    ],
    "requiresSignature": true
  },
  {
    "name": "Relatório de Conclusão",
    "code": "RELATORIO_CONCLUSAO",
    "description": "Relatório completo de conclusão do protocolo com histórico e dados",
    "documentType": "COMPLETION_REPORT",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 40px;\">\n  <!-- Cabeçalho -->\n  <div style=\"text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;\">\n    <h1 style=\"font-size: 24pt; color: #1e3a8a; margin-bottom: 5px;\">RELATÓRIO DE CONCLUSÃO</h1>\n    <h2 style=\"font-size: 16pt; color: #64748b; margin: 0;\">Protocolo {{protocolNumber}}</h2>\n  </div>\n\n  <!-- 1. DADOS DO SOLICITANTE -->\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      1. DADOS DO SOLICITANTE\n    </h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 8px; width: 150px; background-color: #f8fafc;\"><strong>Nome:</strong></td>\n        <td style=\"padding: 8px;\">{{citizenName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>CPF:</strong></td>\n        <td style=\"padding: 8px;\">{{citizenCpf}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Email:</strong></td>\n        <td style=\"padding: 8px;\">{{citizenEmail}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Telefone:</strong></td>\n        <td style=\"padding: 8px;\">{{citizenPhone}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Endereço:</strong></td>\n        <td style=\"padding: 8px;\">{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}} - {{citizenZipCode}}</td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- 2. DADOS DO SERVIÇO -->\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      2. DADOS DO SERVIÇO\n    </h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 8px; width: 150px; background-color: #f8fafc;\"><strong>Serviço:</strong></td>\n        <td style=\"padding: 8px;\">{{serviceName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Departamento:</strong></td>\n        <td style=\"padding: 8px;\">{{departmentName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Data de Abertura:</strong></td>\n        <td style=\"padding: 8px;\">{{protocolCreatedAtFull}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Data de Conclusão:</strong></td>\n        <td style=\"padding: 8px;\">{{protocolConcludedAtFull}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 8px; background-color: #f8fafc;\"><strong>Status Final:</strong></td>\n        <td style=\"padding: 8px;\"><strong>{{protocolStatus}}</strong></td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- 3. DADOS FORNECIDOS -->\n  {{#if hasDataFields}}\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      3. DADOS FORNECIDOS\n    </h3>\n    <table style=\"width: 100%; font-size: 11pt; border-collapse: collapse;\">\n      {{#each dataFields}}\n      <tr style=\"border-bottom: 1px solid #e2e8f0;\">\n        <td style=\"padding: 8px; width: 40%; background-color: #f8fafc;\"><strong>{{label}}:</strong></td>\n        <td style=\"padding: 8px;\">{{value}}</td>\n      </tr>\n      {{/each}}\n    </table>\n  </div>\n  {{/if}}\n\n  <!-- 4. DOCUMENTOS APROVADOS -->\n  {{#if hasDocuments}}\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      4. DOCUMENTOS APROVADOS\n    </h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <thead>\n        <tr style=\"background-color: #f1f5f9;\">\n          <th style=\"padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;\">Documento</th>\n          <th style=\"padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;\">Data de Aprovação</th>\n        </tr>\n      </thead>\n      <tbody>\n        {{#each documents}}\n        <tr style=\"border-bottom: 1px solid #e2e8f0;\">\n          <td style=\"padding: 8px;\">{{type}}</td>\n          <td style=\"padding: 8px;\">{{approvedAt}}</td>\n        </tr>\n        {{/each}}\n      </tbody>\n    </table>\n  </div>\n  {{/if}}\n\n  <!-- 5. HISTÓRICO DE ETAPAS -->\n  {{#if hasStages}}\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      5. HISTÓRICO DE ETAPAS\n    </h3>\n    <ol style=\"margin-top: 10px; font-size: 11pt; line-height: 1.8;\">\n      {{#each stages}}\n      <li style=\"margin-bottom: 10px;\">\n        <strong>{{name}}</strong>\n        {{#if isCompleted}}\n        <span style=\"color: #16a34a;\"> - Concluída em {{completedAt}}</span>\n        {{else if isInProgress}}\n        <span style=\"color: #eab308;\"> - Em andamento</span>\n        {{else}}\n        <span style=\"color: #64748b;\"> - Pendente</span>\n        {{/if}}\n        {{#if notes}}\n        <br><span style=\"font-size: 10pt; color: #64748b;\">Observações: {{notes}}</span>\n        {{/if}}\n      </li>\n      {{/each}}\n    </ol>\n  </div>\n  {{/if}}\n\n  <!-- 6. OBSERVAÇÕES FINAIS -->\n  {{#if finalNotes}}\n  <div style=\"margin-bottom: 30px;\">\n    <h3 style=\"font-size: 16pt; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      6. OBSERVAÇÕES FINAIS\n    </h3>\n    <p style=\"text-align: justify; font-size: 11pt; line-height: 1.8; padding: 15px; background-color: #fef3c7; border-left: 4px solid #eab308;\">\n      {{finalNotes}}\n    </p>\n  </div>\n  {{/if}}\n\n  <!-- Rodapé -->\n  <div style=\"margin-top: 60px; padding-top: 20px; border-top: 2px solid #cbd5e1;\">\n    <p style=\"text-align: center; font-size: 10pt; color: #64748b;\">\n      Documento gerado em {{generatedAt}}\n    </p>\n    <p style=\"text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 10px;\">\n      Este documento foi gerado eletronicamente e possui validade jurídica.<br>\n      Código de autenticação: {{protocolNumber}}\n    </p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: Arial, Helvetica, sans-serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "protocolNumber",
        "description": "Número do protocolo",
        "example": "2026/00123"
      },
      {
        "name": "citizenName",
        "description": "Nome completo",
        "example": "João da Silva"
      },
      {
        "name": "dataFields",
        "description": "Array de campos aprovados",
        "example": "[{label, value}]"
      },
      {
        "name": "documents",
        "description": "Array de documentos aprovados",
        "example": "[{type, approvedAt}]"
      },
      {
        "name": "stages",
        "description": "Array de etapas",
        "example": "[{name, status, completedAt}]"
      },
      {
        "name": "finalNotes",
        "description": "Observações finais",
        "example": "Protocolo concluído com sucesso"
      }
    ],
    "requiresSignature": true
  },
  {
    "name": "Recibo de Atendimento",
    "code": "RECIBO_ATENDIMENTO",
    "description": "Recibo comprovando o atendimento e recebimento de documentos",
    "documentType": "RECEIPT",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 60px 40px;\">\n  <!-- Cabeçalho com Brasão/Logo -->\n  <div style=\"text-align: center; margin-bottom: 40px;\">\n    {{#if municipalityLogo}}\n    <img src=\"{{municipalityLogo}}\" alt=\"Brasão\" style=\"max-width: 100px; margin-bottom: 20px;\">\n    {{/if}}\n    <h2 style=\"font-size: 14pt; color: #1e3a8a; margin: 5px 0;\">{{municipalityName}}</h2>\n    <p style=\"font-size: 11pt; color: #64748b; margin: 0;\">{{departmentName}}</p>\n    <p style=\"font-size: 10pt; color: #64748b; margin: 5px 0;\">{{municipalityAddress}}</p>\n  </div>\n\n  <!-- Título -->\n  <div style=\"text-align: center; margin-bottom: 40px; padding: 20px; background-color: #f8fafc; border: 2px solid #2563eb;\">\n    <h1 style=\"font-size: 24pt; color: #1e3a8a; margin: 0; font-weight: bold;\">\n      RECIBO DE ATENDIMENTO\n    </h1>\n    <p style=\"font-size: 14pt; color: #64748b; margin: 10px 0 0 0;\">\n      Nº {{protocolNumber}}\n    </p>\n  </div>\n\n  <!-- Corpo -->\n  <div style=\"line-height: 2; font-size: 12pt; margin-top: 40px;\">\n    <p style=\"margin-bottom: 30px; text-align: justify;\">\n      Declaramos para os devidos fins que recebemos em <strong>{{generatedAtDate}}</strong>,\n      do(a) Sr(a). <strong>{{citizenName}}</strong>, portador(a) do CPF <strong>{{citizenCpf}}</strong>,\n      residente em <strong>{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</strong>,\n      a solicitação de serviço referente a <strong>{{serviceName}}</strong>.\n    </p>\n\n    <p style=\"margin-bottom: 30px; text-align: justify;\">\n      Foi gerado o protocolo de número <strong>{{protocolNumber}}</strong> para acompanhamento\n      da solicitação.\n    </p>\n\n    {{#if receivedDocuments}}\n    <p style=\"margin-bottom: 15px;\"><strong>Documentos Recebidos:</strong></p>\n    <ul style=\"margin-left: 30px; margin-bottom: 30px; line-height: 1.8;\">\n      {{#each receivedDocuments}}\n      <li>{{this}}</li>\n      {{/each}}\n    </ul>\n    {{/if}}\n\n    <p style=\"margin-bottom: 30px; text-align: justify;\">\n      O atendimento foi realizado por <strong>{{attendantName}}</strong> em\n      <strong>{{protocolCreatedAtFull}}</strong>.\n    </p>\n  </div>\n\n  <!-- Dados de Contato -->\n  <div style=\"margin-top: 40px; padding: 20px; background-color: #f1f5f9; border-left: 4px solid #0ea5e9;\">\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;\">Acompanhamento</h3>\n    <p style=\"font-size: 11pt; margin: 5px 0;\">\n      <strong>Protocolo:</strong> {{protocolNumber}}\n    </p>\n    <p style=\"font-size: 11pt; margin: 5px 0;\">\n      <strong>Portal do Cidadão:</strong> {{citizenPortalUrl}}\n    </p>\n    <p style=\"font-size: 11pt; margin: 5px 0;\">\n      <strong>Telefone:</strong> {{municipalityPhone}}\n    </p>\n  </div>\n\n  <!-- Assinatura -->\n  <div style=\"margin-top: 80px;\">\n    <div style=\"text-align: center;\">\n      <div style=\"border-top: 2px solid #334155; padding-top: 10px; width: 350px; margin: 0 auto;\">\n        <p style=\"font-size: 11pt; margin: 5px 0;\"><strong>{{attendantName}}</strong></p>\n        <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">{{attendantRole}}</p>\n        <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">{{departmentName}}</p>\n      </div>\n    </div>\n  </div>\n\n  <!-- Rodapé -->\n  <div style=\"margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;\">\n    <p style=\"margin: 0;\">Documento gerado eletronicamente em {{generatedAt}}</p>\n    <p style=\"margin: 5px 0 0 0;\">Autenticidade verificável através do código: {{protocolNumber}}</p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: 'Times New Roman', Times, serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "protocolNumber",
        "description": "Número do protocolo",
        "example": "2026/00123"
      },
      {
        "name": "citizenName",
        "description": "Nome do cidadão",
        "example": "João da Silva"
      },
      {
        "name": "citizenCpf",
        "description": "CPF formatado",
        "example": "123.456.789-00"
      },
      {
        "name": "serviceName",
        "description": "Nome do serviço",
        "example": "Alvará de Funcionamento"
      },
      {
        "name": "attendantName",
        "description": "Nome do atendente",
        "example": "Maria Santos"
      },
      {
        "name": "attendantRole",
        "description": "Cargo do atendente",
        "example": "Atendente"
      },
      {
        "name": "receivedDocuments",
        "description": "Array de documentos recebidos",
        "example": "[\"RG\", \"CPF\", \"Comprovante de Residência\"]"
      },
      {
        "name": "municipalityName",
        "description": "Nome do município",
        "example": "Prefeitura Municipal de São Paulo"
      },
      {
        "name": "municipalityLogo",
        "description": "URL do logo/brasão",
        "example": "/uploads/brasao.png"
      }
    ],
    "requiresSignature": true
  },
  {
    "name": "Autorização/Alvará",
    "code": "AUTORIZACAO_ALVARA",
    "description": "Documento oficial de autorização ou concessão de alvará",
    "documentType": "AUTHORIZATION",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 50px 40px;\">\n  <!-- Cabeçalho Oficial -->\n  <div style=\"text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #16a34a;\">\n    {{#if municipalityLogo}}\n    <img src=\"{{municipalityLogo}}\" alt=\"Brasão\" style=\"max-width: 120px; margin-bottom: 15px;\">\n    {{/if}}\n    <h2 style=\"font-size: 16pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;\">{{municipalityName}}</h2>\n    <p style=\"font-size: 12pt; color: #64748b; margin: 5px 0;\">{{departmentName}}</p>\n    <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">CNPJ: {{municipalityCnpj}}</p>\n  </div>\n\n  <!-- Título -->\n  <div style=\"text-align: center; margin-bottom: 50px;\">\n    <h1 style=\"font-size: 28pt; color: #16a34a; margin-bottom: 10px; font-weight: bold;\">\n      {{authorizationType}}\n    </h1>\n    <p style=\"font-size: 18pt; color: #64748b; margin: 0;\">\n      Nº {{authorizationNumber}}\n    </p>\n  </div>\n\n  <!-- Dados do Autorizado -->\n  <div style=\"margin-bottom: 40px; padding: 25px; background-color: #f0fdf4; border-left: 5px solid #16a34a;\">\n    <h3 style=\"font-size: 14pt; color: #15803d; margin-bottom: 15px;\">Dados do Titular</h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px 0; width: 150px;\"><strong>Nome/Razão Social:</strong></td>\n        <td style=\"padding: 5px 0;\">{{citizenName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>CPF/CNPJ:</strong></td>\n        <td style=\"padding: 5px 0;\">{{citizenCpf}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Endereço:</strong></td>\n        <td style=\"padding: 5px 0;\">{{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</td>\n      </tr>\n      {{#if businessActivity}}\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Atividade:</strong></td>\n        <td style=\"padding: 5px 0;\">{{businessActivity}}</td>\n      </tr>\n      {{/if}}\n    </table>\n  </div>\n\n  <!-- Corpo da Autorização -->\n  <div style=\"text-align: justify; line-height: 2; font-size: 12pt; margin-bottom: 40px;\">\n    <p style=\"margin-bottom: 25px;\">\n      A <strong>{{municipalityName}}</strong>, no uso de suas atribuições legais e tendo em vista\n      o que consta no processo/protocolo <strong>{{protocolNumber}}</strong>, e considerando o\n      cumprimento de todas as exigências legais e técnicas aplicáveis,\n    </p>\n\n    <p style=\"text-align: center; font-size: 16pt; margin: 40px 0; font-weight: bold; color: #16a34a;\">\n      AUTORIZA\n    </p>\n\n    <p style=\"margin-bottom: 25px;\">\n      O(A) titular acima identificado(a) a exercer a atividade de <strong>{{serviceName}}</strong>,\n      conforme as condições e especificações constantes no processo.\n    </p>\n\n    {{#if conditions}}\n    <p style=\"margin-bottom: 15px;\"><strong>Condições e Observações:</strong></p>\n    <div style=\"padding: 20px; background-color: #fef3c7; border-left: 4px solid #eab308; margin-bottom: 25px;\">\n      <p style=\"margin: 0; font-size: 11pt; line-height: 1.6;\">{{conditions}}</p>\n    </div>\n    {{/if}}\n\n    {{#if validityPeriod}}\n    <p style=\"margin-bottom: 25px;\">\n      <strong>Validade:</strong> {{validityPeriod}}\n    </p>\n    {{/if}}\n  </div>\n\n  <!-- Dados da Emissão -->\n  <div style=\"margin-bottom: 60px; padding: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1;\">\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px; width: 50%;\"><strong>Protocolo:</strong> {{protocolNumber}}</td>\n        <td style=\"padding: 5px;\"><strong>Data de Emissão:</strong> {{generatedAtDate}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px;\"><strong>Responsável:</strong> {{approverName}}</td>\n        <td style=\"padding: 5px;\"><strong>Matrícula:</strong> {{approverRegistration}}</td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- Assinatura Digital -->\n  <div style=\"margin-top: 80px; text-align: center;\">\n    <div style=\"border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;\">\n      <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>{{approverName}}</strong></p>\n      <p style=\"font-size: 11pt; color: #64748b; margin: 0;\">{{approverRole}}</p>\n      <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">{{departmentName}}</p>\n      {{#if digitalSignature}}\n      <p style=\"font-size: 9pt; color: #16a34a; margin-top: 10px;\">\n        ✓ Documento assinado digitalmente\n      </p>\n      {{/if}}\n    </div>\n  </div>\n\n  <!-- Rodapé com Autenticidade -->\n  <div style=\"margin-top: 80px; padding: 20px; background-color: #f1f5f9; border-top: 2px solid #2563eb;\">\n    <p style=\"text-align: center; font-size: 9pt; color: #64748b; margin: 0;\">\n      Este documento foi gerado eletronicamente em {{generatedAt}} e possui validade jurídica.\n    </p>\n    <p style=\"text-align: center; font-size: 9pt; color: #64748b; margin: 5px 0 0 0;\">\n      Código de autenticação: <strong>{{authorizationNumber}}</strong> | Protocolo: <strong>{{protocolNumber}}</strong>\n    </p>\n    <p style=\"text-align: center; font-size: 8pt; color: #94a3b8; margin: 5px 0 0 0;\">\n      Verifique a autenticidade em: {{municipalityWebsite}}/validacao\n    </p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: 'Times New Roman', Times, serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "authorizationType",
        "description": "Tipo de autorização",
        "example": "ALVARÁ DE FUNCIONAMENTO"
      },
      {
        "name": "authorizationNumber",
        "description": "Número da autorização",
        "example": "2026/00123"
      },
      {
        "name": "protocolNumber",
        "description": "Número do protocolo",
        "example": "2026/00123"
      },
      {
        "name": "citizenName",
        "description": "Nome/Razão Social",
        "example": "Empresa XYZ Ltda"
      },
      {
        "name": "citizenCpf",
        "description": "CPF/CNPJ",
        "example": "12.345.678/0001-90"
      },
      {
        "name": "serviceName",
        "description": "Nome do serviço/atividade",
        "example": "Comércio Varejista"
      },
      {
        "name": "businessActivity",
        "description": "Atividade empresarial",
        "example": "Venda de produtos alimentícios"
      },
      {
        "name": "conditions",
        "description": "Condições e observações",
        "example": "Válido por 12 meses"
      },
      {
        "name": "validityPeriod",
        "description": "Período de validade",
        "example": "12 meses a partir da data de emissão"
      },
      {
        "name": "approverName",
        "description": "Nome do aprovador",
        "example": "João Silva"
      },
      {
        "name": "approverRole",
        "description": "Cargo do aprovador",
        "example": "Secretário de Obras"
      },
      {
        "name": "municipalityName",
        "description": "Nome do município",
        "example": "Prefeitura Municipal"
      }
    ],
    "requiresSignature": true
  },
  {
    "name": "Notificação Oficial",
    "code": "NOTIFICACAO_OFICIAL",
    "description": "Notificação oficial para comunicação de pendências ou irregularidades",
    "documentType": "NOTIFICATION",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 50px 40px;\">\n  <!-- Cabeçalho -->\n  <div style=\"text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #dc2626;\">\n    {{#if municipalityLogo}}\n    <img src=\"{{municipalityLogo}}\" alt=\"Brasão\" style=\"max-width: 120px; margin-bottom: 15px;\">\n    {{/if}}\n    <h2 style=\"font-size: 16pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;\">{{municipalityName}}</h2>\n    <p style=\"font-size: 12pt; color: #64748b; margin: 5px 0;\">{{departmentName}}</p>\n  </div>\n\n  <!-- Título -->\n  <div style=\"text-align: center; margin-bottom: 50px; padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626;\">\n    <h1 style=\"font-size: 26pt; color: #dc2626; margin: 0; font-weight: bold;\">\n      NOTIFICAÇÃO\n    </h1>\n    <p style=\"font-size: 16pt; color: #991b1b; margin: 10px 0 0 0;\">\n      Nº {{notificationNumber}}\n    </p>\n  </div>\n\n  <!-- Destinatário -->\n  <div style=\"margin-bottom: 40px;\">\n    <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>Destinatário:</strong> {{citizenName}}</p>\n    <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>CPF/CNPJ:</strong> {{citizenCpf}}</p>\n    <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>Endereço:</strong> {{citizenAddress}}, {{citizenNeighborhood}}, {{citizenCity}}/{{citizenState}}</p>\n    {{#if protocolNumber}}\n    <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>Protocolo Ref.:</strong> {{protocolNumber}}</p>\n    {{/if}}\n  </div>\n\n  <!-- Corpo da Notificação -->\n  <div style=\"text-align: justify; line-height: 1.8; font-size: 12pt; margin-bottom: 40px;\">\n    <p style=\"margin-bottom: 25px;\">\n      Pelo presente, a <strong>{{municipalityName}}</strong>, através do(a) <strong>{{departmentName}}</strong>,\n      no uso de suas atribuições legais,\n    </p>\n\n    <p style=\"text-align: center; font-size: 16pt; margin: 30px 0; font-weight: bold; color: #dc2626;\">\n      NOTIFICA\n    </p>\n\n    <p style=\"margin-bottom: 25px;\">\n      O(A) destinatário(a) acima identificado(a) sobre o seguinte:\n    </p>\n\n    <!-- Assunto -->\n    <div style=\"padding: 20px; background-color: #fef3c7; border-left: 5px solid #eab308; margin-bottom: 30px;\">\n      <h3 style=\"font-size: 13pt; color: #92400e; margin-bottom: 10px;\">Assunto:</h3>\n      <p style=\"margin: 0; font-size: 11pt; line-height: 1.6;\">{{notificationSubject}}</p>\n    </div>\n\n    <!-- Descrição -->\n    <div style=\"margin-bottom: 30px;\">\n      <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;\">Descrição:</h3>\n      <p style=\"font-size: 11pt; line-height: 1.8;\">{{notificationDescription}}</p>\n    </div>\n\n    {{#if requirements}}\n    <!-- Exigências -->\n    <div style=\"margin-bottom: 30px; padding: 20px; background-color: #fef2f2; border: 2px solid #fca5a5;\">\n      <h3 style=\"font-size: 13pt; color: #dc2626; margin-bottom: 15px;\">Providências Necessárias:</h3>\n      <p style=\"font-size: 11pt; line-height: 1.6; margin: 0;\">{{requirements}}</p>\n    </div>\n    {{/if}}\n\n    {{#if deadline}}\n    <!-- Prazo -->\n    <div style=\"margin-bottom: 30px; padding: 15px; background-color: #fee2e2; border-left: 5px solid #dc2626;\">\n      <p style=\"margin: 0; font-size: 12pt; font-weight: bold;\">\n        ⏰ Prazo para Regularização: <span style=\"color: #dc2626;\">{{deadline}}</span>\n      </p>\n    </div>\n    {{/if}}\n\n    <!-- Advertências -->\n    <div style=\"margin-top: 30px; padding: 20px; background-color: #fefce8; border: 1px solid #eab308;\">\n      <p style=\"font-size: 10pt; color: #713f12; line-height: 1.6; margin: 0;\">\n        <strong>IMPORTANTE:</strong> O não cumprimento das determinações desta notificação no prazo estabelecido\n        poderá acarretar sanções administrativas previstas na legislação municipal vigente, incluindo multas e\n        outras penalidades cabíveis.\n      </p>\n    </div>\n\n    {{#if legalBasis}}\n    <p style=\"margin-top: 30px; font-size: 10pt; color: #64748b;\">\n      <strong>Fundamentação Legal:</strong> {{legalBasis}}\n    </p>\n    {{/if}}\n  </div>\n\n  <!-- Dados da Notificação -->\n  <div style=\"margin-bottom: 60px; padding: 15px; background-color: #f8fafc; border: 1px solid #cbd5e1;\">\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px;\"><strong>Data de Emissão:</strong> {{generatedAtDate}}</td>\n        <td style=\"padding: 5px;\"><strong>Notificação Nº:</strong> {{notificationNumber}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px;\"><strong>Responsável:</strong> {{issuerName}}</td>\n        <td style=\"padding: 5px;\"><strong>Matrícula:</strong> {{issuerRegistration}}</td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- Assinatura -->\n  <div style=\"margin-top: 80px; text-align: center;\">\n    <div style=\"border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;\">\n      <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>{{issuerName}}</strong></p>\n      <p style=\"font-size: 11pt; color: #64748b; margin: 0;\">{{issuerRole}}</p>\n      <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">{{departmentName}}</p>\n    </div>\n  </div>\n\n  <!-- Rodapé -->\n  <div style=\"margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;\">\n    <p style=\"margin: 0;\">Documento gerado eletronicamente em {{generatedAt}}</p>\n    <p style=\"margin: 5px 0 0 0;\">Código de autenticação: {{notificationNumber}}</p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: 'Times New Roman', Times, serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "notificationNumber",
        "description": "Número da notificação",
        "example": "NOT-2026/00123"
      },
      {
        "name": "citizenName",
        "description": "Nome do destinatário",
        "example": "João da Silva"
      },
      {
        "name": "notificationSubject",
        "description": "Assunto da notificação",
        "example": "Irregularidade em construção"
      },
      {
        "name": "notificationDescription",
        "description": "Descrição detalhada",
        "example": "Foi constatado..."
      },
      {
        "name": "requirements",
        "description": "Providências necessárias",
        "example": "Regularizar a situação em 30 dias"
      },
      {
        "name": "deadline",
        "description": "Prazo para regularização",
        "example": "30 dias corridos"
      },
      {
        "name": "legalBasis",
        "description": "Base legal",
        "example": "Lei Municipal nº 1234/2020"
      },
      {
        "name": "issuerName",
        "description": "Nome do emissor",
        "example": "Maria Santos"
      },
      {
        "name": "issuerRole",
        "description": "Cargo do emissor",
        "example": "Fiscal Municipal"
      }
    ],
    "requiresSignature": true
  },
  {
    "name": "Parecer Técnico",
    "code": "PARECER_TECNICO",
    "description": "Parecer técnico para análise de solicitações",
    "documentType": "CUSTOM",
    "outputFormat": "PDF",
    "isGlobal": true,
    "htmlTemplate": "\n<div style=\"padding: 50px 40px;\">\n  <!-- Cabeçalho -->\n  <div style=\"text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;\">\n    {{#if municipalityLogo}}\n    <img src=\"{{municipalityLogo}}\" alt=\"Brasão\" style=\"max-width: 100px; margin-bottom: 15px;\">\n    {{/if}}\n    <h2 style=\"font-size: 15pt; color: #1e3a8a; margin: 5px 0; font-weight: bold;\">{{municipalityName}}</h2>\n    <p style=\"font-size: 11pt; color: #64748b; margin: 5px 0;\">{{departmentName}}</p>\n  </div>\n\n  <!-- Título -->\n  <div style=\"text-align: center; margin-bottom: 40px;\">\n    <h1 style=\"font-size: 24pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;\">\n      PARECER TÉCNICO\n    </h1>\n    <p style=\"font-size: 14pt; color: #64748b; margin: 0;\">\n      Nº {{technicalOpinionNumber}}\n    </p>\n  </div>\n\n  <!-- Dados do Processo -->\n  <div style=\"margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb;\">\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-bottom: 15px;\">Dados do Processo</h3>\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px 0; width: 180px;\"><strong>Protocolo:</strong></td>\n        <td style=\"padding: 5px 0;\">{{protocolNumber}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Interessado:</strong></td>\n        <td style=\"padding: 5px 0;\">{{citizenName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Assunto:</strong></td>\n        <td style=\"padding: 5px 0;\">{{serviceName}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px 0;\"><strong>Data de Abertura:</strong></td>\n        <td style=\"padding: 5px 0;\">{{protocolCreatedAtFull}}</td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- Corpo do Parecer -->\n  <div style=\"text-align: justify; line-height: 1.8; font-size: 11pt;\">\n    <!-- Histórico -->\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      1. HISTÓRICO\n    </h3>\n    <p style=\"margin-bottom: 20px;\">{{opinionHistory}}</p>\n\n    <!-- Análise Técnica -->\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      2. ANÁLISE TÉCNICA\n    </h3>\n    <p style=\"margin-bottom: 20px;\">{{technicalAnalysis}}</p>\n\n    {{#if legalAnalysis}}\n    <!-- Análise Legal -->\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      3. FUNDAMENTAÇÃO LEGAL\n    </h3>\n    <p style=\"margin-bottom: 20px;\">{{legalAnalysis}}</p>\n    {{/if}}\n\n    {{#if requirements}}\n    <!-- Exigências/Recomendações -->\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      4. EXIGÊNCIAS/RECOMENDAÇÕES\n    </h3>\n    <div style=\"padding: 15px; background-color: #fef3c7; border-left: 4px solid #eab308; margin-bottom: 20px;\">\n      <p style=\"margin: 0;\">{{requirements}}</p>\n    </div>\n    {{/if}}\n\n    <!-- Conclusão -->\n    <h3 style=\"font-size: 13pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;\">\n      {{#if requirements}}5{{else}}4{{/if}}. CONCLUSÃO\n    </h3>\n    <div style=\"padding: 20px; background-color: {{conclusionBackgroundColor}}; border: 2px solid {{conclusionBorderColor}}; margin-bottom: 20px;\">\n      <p style=\"text-align: center; font-size: 14pt; font-weight: bold; color: {{conclusionColor}}; margin: 0;\">\n        {{conclusion}}\n      </p>\n    </div>\n\n    {{#if observations}}\n    <p style=\"margin-top: 20px; font-size: 10pt; color: #64748b;\">\n      <strong>Observações:</strong> {{observations}}\n    </p>\n    {{/if}}\n  </div>\n\n  <!-- Dados do Responsável -->\n  <div style=\"margin-top: 60px; margin-bottom: 40px; padding: 15px; background-color: #f1f5f9; border: 1px solid #cbd5e1;\">\n    <table style=\"width: 100%; font-size: 11pt;\">\n      <tr>\n        <td style=\"padding: 5px;\"><strong>Responsável Técnico:</strong> {{technicalResponsible}}</td>\n        <td style=\"padding: 5px;\"><strong>Registro:</strong> {{technicalRegistration}}</td>\n      </tr>\n      <tr>\n        <td style=\"padding: 5px;\"><strong>Data do Parecer:</strong> {{generatedAtDate}}</td>\n        <td style=\"padding: 5px;\"><strong>Parecer Nº:</strong> {{technicalOpinionNumber}}</td>\n      </tr>\n    </table>\n  </div>\n\n  <!-- Assinatura -->\n  <div style=\"margin-top: 80px; text-align: center;\">\n    <div style=\"border-top: 2px solid #334155; padding-top: 15px; width: 400px; margin: 0 auto;\">\n      <p style=\"font-size: 12pt; margin: 5px 0;\"><strong>{{technicalResponsible}}</strong></p>\n      <p style=\"font-size: 11pt; color: #64748b; margin: 0;\">{{technicalRole}}</p>\n      <p style=\"font-size: 10pt; color: #64748b; margin: 0;\">Registro: {{technicalRegistration}}</p>\n    </div>\n  </div>\n\n  <!-- Rodapé -->\n  <div style=\"margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center;\">\n    <p style=\"margin: 0;\">Documento gerado eletronicamente em {{generatedAt}}</p>\n    <p style=\"margin: 5px 0 0 0;\">Código de autenticação: {{technicalOpinionNumber}}</p>\n  </div>\n</div>\n      ",
    "cssStyles": "\n        @page {\n          size: A4;\n          margin: 0;\n        }\n        body {\n          font-family: Arial, Helvetica, sans-serif;\n        }\n      ",
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    },
    "availableVariables": [
      {
        "name": "technicalOpinionNumber",
        "description": "Número do parecer",
        "example": "PT-2026/00123"
      },
      {
        "name": "protocolNumber",
        "description": "Número do protocolo",
        "example": "2026/00123"
      },
      {
        "name": "opinionHistory",
        "description": "Histórico do processo",
        "example": "O interessado solicitou..."
      },
      {
        "name": "technicalAnalysis",
        "description": "Análise técnica",
        "example": "Após vistoria realizada..."
      },
      {
        "name": "legalAnalysis",
        "description": "Fundamentação legal",
        "example": "De acordo com a Lei..."
      },
      {
        "name": "requirements",
        "description": "Exigências/Recomendações",
        "example": "Recomenda-se..."
      },
      {
        "name": "conclusion",
        "description": "Conclusão do parecer",
        "example": "FAVORÁVEL"
      },
      {
        "name": "conclusionColor",
        "description": "Cor da conclusão",
        "example": "#16a34a"
      },
      {
        "name": "conclusionBackgroundColor",
        "description": "Cor de fundo da conclusão",
        "example": "#f0fdf4"
      },
      {
        "name": "conclusionBorderColor",
        "description": "Cor da borda da conclusão",
        "example": "#16a34a"
      },
      {
        "name": "technicalResponsible",
        "description": "Nome do responsável técnico",
        "example": "Eng. Carlos Santos"
      },
      {
        "name": "technicalRegistration",
        "description": "Registro profissional",
        "example": "CREA 12345/SP"
      },
      {
        "name": "technicalRole",
        "description": "Cargo do responsável",
        "example": "Engenheiro Civil"
      }
    ],
    "requiresSignature": true
  }
];
