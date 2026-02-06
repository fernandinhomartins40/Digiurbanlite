-- Script SQL direto para inserir templates de documentos
-- Executar: psql -d digiurban -f insert-templates-direct.sql

-- Buscar primeiro SUPER_ADMIN disponível
DO $$
DECLARE
  v_creator_id text;
BEGIN
  -- Obter ID de um SUPER_ADMIN
  SELECT id INTO v_creator_id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum SUPER_ADMIN encontrado. Crie um usuário SUPER_ADMIN primeiro.';
  END IF;

  -- TEMPLATE 1: CERTIDÃO DE PROTOCOLO
  INSERT INTO document_templates (
    id, name, code, description, "documentType", "outputFormat",
    "serviceIds", "isGlobal", "htmlTemplate", "cssStyles",
    "pageSize", orientation, margins, "availableVariables",
    "isActive", version, "createdAt", "updatedAt", "createdBy"
  ) VALUES (
    gen_random_uuid()::text,
    'Certidão de Protocolo',
    'CERTIDAO_PROTOCOLO',
    'Certidão/comprovante de abertura de protocolo',
    'PROTOCOL_CERTIFICATE',
    'PDF',
    '[]'::jsonb,
    true,
    E'<div style="padding: 60px 40px;">\n  <div style="text-align: center; margin-bottom: 50px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">\n    <h1 style="font-size: 28pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;">CERTIDÃO DE PROTOCOLO</h1>\n    <p style="font-size: 16pt; color: #64748b; margin: 0;">Nº {{protocolNumber}}</p>\n  </div>\n  <div style="text-align: justify; line-height: 2; font-size: 12pt; margin-top: 40px;">\n    <p style="margin-bottom: 20px;">Certificamos que o(a) cidadão(ã) <strong>{{citizenName}}</strong>, portador(a) do CPF <strong>{{citizenCpf}}</strong>, solicitou o serviço <strong>{{serviceName}}</strong> através do protocolo de número <strong>{{protocolNumber}}</strong>, em <strong>{{protocolCreatedAtFull}}</strong>.</p>\n  </div>\n</div>',
    E'@page { size: A4; margin: 0; }\nbody { font-family: ''Times New Roman'', Times, serif; }',
    'A4',
    'portrait',
    '{"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}'::jsonb,
    '[{"name": "protocolNumber", "description": "Número do protocolo", "example": "2026/00123"}, {"name": "citizenName", "description": "Nome completo do cidadão", "example": "João da Silva"}]'::jsonb,
    true,
    1,
    NOW(),
    NOW(),
    v_creator_id
  ) ON CONFLICT (code) DO UPDATE SET
    "updatedAt" = NOW();

  -- TEMPLATE 2: RELATÓRIO DE CONCLUSÃO
  INSERT INTO document_templates (
    id, name, code, description, "documentType", "outputFormat",
    "serviceIds", "isGlobal", "htmlTemplate", "cssStyles",
    "pageSize", orientation, margins, "availableVariables",
    "isActive", version, "createdAt", "updatedAt", "createdBy"
  ) VALUES (
    gen_random_uuid()::text,
    'Relatório de Conclusão',
    'RELATORIO_CONCLUSAO',
    'Relatório completo de conclusão do protocolo com histórico e dados',
    'COMPLETION_REPORT',
    'PDF',
    '[]'::jsonb,
    true,
    E'<div style="padding: 40px;">\n  <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">\n    <h1 style="font-size: 24pt; color: #1e3a8a; margin-bottom: 5px;">RELATÓRIO DE CONCLUSÃO</h1>\n    <h2 style="font-size: 16pt; color: #64748b; margin: 0;">Protocolo {{protocolNumber}}</h2>\n  </div>\n</div>',
    E'@page { size: A4; margin: 0; }\nbody { font-family: Arial, Helvetica, sans-serif; }',
    'A4',
    'portrait',
    '{"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}'::jsonb,
    '[{"name": "protocolNumber", "description": "Número do protocolo", "example": "2026/00123"}]'::jsonb,
    true,
    1,
    NOW(),
    NOW(),
    v_creator_id
  ) ON CONFLICT (code) DO UPDATE SET
    "updatedAt" = NOW();

  RAISE NOTICE 'Templates inseridos com sucesso!';
END $$;
