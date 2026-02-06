/**
 * Script para inserir templates diretamente no PostgreSQL
 * sem usar Prisma Client (evita problemas de cache/schema)
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/digiurban';

async function insertTemplates() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('🔗 Conectado ao PostgreSQL');

    // 1. Buscar SUPER_ADMIN
    const adminResult = await client.query(`
      SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1
    `);

    if (adminResult.rows.length === 0) {
      console.error('❌ Nenhum SUPER_ADMIN encontrado!');
      console.log('💡 Dica: Crie um usuário SUPER_ADMIN primeiro ou execute o seed completo');
      process.exit(1);
    }

    const createdBy = adminResult.rows[0].id;
    console.log(`✅ SUPER_ADMIN encontrado: ${createdBy}`);

    // 2. Inserir Template 1: Certidão de Protocolo
    await client.query(`
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
        $1,
        $2,
        'A4',
        'portrait',
        '{"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}'::jsonb,
        $3,
        true,
        1,
        NOW(),
        NOW(),
        $4
      ) ON CONFLICT (code) DO UPDATE SET
        "updatedAt" = NOW(),
        "htmlTemplate" = EXCLUDED."htmlTemplate",
        "cssStyles" = EXCLUDED."cssStyles",
        "availableVariables" = EXCLUDED."availableVariables"
    `, [
      // HTML Template
      `<div style="padding: 60px 40px;">
  <div style="text-align: center; margin-bottom: 50px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
    <h1 style="font-size: 28pt; color: #1e3a8a; margin-bottom: 10px; font-weight: bold;">
      CERTIDÃO DE PROTOCOLO
    </h1>
    <p style="font-size: 16pt; color: #64748b; margin: 0;">
      Nº {{protocolNumber}}
    </p>
  </div>
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
  </div>
</div>`,
      // CSS Styles
      `@page {
  size: A4;
  margin: 0;
}
body {
  font-family: 'Times New Roman', Times, serif;
}`,
      // Available Variables
      JSON.stringify([
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome completo do cidadão', example: 'João da Silva' },
        { name: 'citizenCpf', description: 'CPF formatado', example: '123.456.789-00' },
        { name: 'citizenAddress', description: 'Endereço', example: 'Rua das Flores, 123' },
        { name: 'citizenNeighborhood', description: 'Bairro', example: 'Centro' },
        { name: 'citizenCity', description: 'Cidade', example: 'São Paulo' },
        { name: 'citizenState', description: 'Estado', example: 'SP' },
        { name: 'serviceName', description: 'Nome do serviço', example: 'Alvará de Funcionamento' },
        { name: 'protocolCreatedAtFull', description: 'Data de criação completa', example: '12/01/2026 14:30' },
        { name: 'protocolStatus', description: 'Status do protocolo', example: 'EM PROGRESSO' }
      ]),
      createdBy
    ]);

    console.log('   ✓ Template criado: Certidão de Protocolo');

    // 3. Inserir Template 2: Relatório de Conclusão
    await client.query(`
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
        $1,
        $2,
        'A4',
        'portrait',
        '{"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}'::jsonb,
        $3,
        true,
        1,
        NOW(),
        NOW(),
        $4
      ) ON CONFLICT (code) DO UPDATE SET
        "updatedAt" = NOW(),
        "htmlTemplate" = EXCLUDED."htmlTemplate",
        "cssStyles" = EXCLUDED."cssStyles",
        "availableVariables" = EXCLUDED."availableVariables"
    `, [
      // HTML Template
      `<div style="padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
    <h1 style="font-size: 24pt; color: #1e3a8a; margin-bottom: 5px;">RELATÓRIO DE CONCLUSÃO</h1>
    <h2 style="font-size: 16pt; color: #64748b; margin: 0;">Protocolo {{protocolNumber}}</h2>
  </div>
  <div style="margin-bottom: 30px;">
    <h3 style="font-size: 16pt; color: #1e3a8a; margin-bottom: 15px;">1. DADOS DO SOLICITANTE</h3>
    <table style="width: 100%; font-size: 11pt;">
      <tr>
        <td style="padding: 8px; width: 150px; background-color: #f8fafc;"><strong>Nome:</strong></td>
        <td style="padding: 8px;">{{citizenName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px; background-color: #f8fafc;"><strong>CPF:</strong></td>
        <td style="padding: 8px;">{{citizenCpf}}</td>
      </tr>
    </table>
  </div>
</div>`,
      // CSS Styles
      `@page {
  size: A4;
  margin: 0;
}
body {
  font-family: Arial, Helvetica, sans-serif;
}`,
      // Available Variables
      JSON.stringify([
        { name: 'protocolNumber', description: 'Número do protocolo', example: '2026/00123' },
        { name: 'citizenName', description: 'Nome completo', example: 'João da Silva' },
        { name: 'citizenCpf', description: 'CPF formatado', example: '123.456.789-00' }
      ]),
      createdBy
    ]);

    console.log('   ✓ Template criado: Relatório de Conclusão');

    // 4. Verificar quantos templates existem
    const countResult = await client.query('SELECT COUNT(*) FROM document_templates');
    const count = countResult.rows[0].count;

    console.log(`\n✅ Total de templates no banco: ${count}`);
    console.log('🎉 Templates inseridos com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro ao inserir templates:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

insertTemplates();
