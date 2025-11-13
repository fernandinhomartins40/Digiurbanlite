// Script para criar configs de todas as secretarias
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretarias = [
  { id: 'agricultura', name: 'Secretaria de Agricultura', color: '#10B981', departmentId: 'agricultura' },
  { id: 'assistencia-social', name: 'Secretaria de Assistência Social', color: '#EF4444', departmentId: 'assistencia-social' },
  { id: 'cultura', name: 'Secretaria de Cultura', color: '#8B5CF6', departmentId: 'cultura' },
  { id: 'educacao', name: 'Secretaria de Educação', color: '#3B82F6', departmentId: 'educacao' },
  { id: 'esportes', name: 'Secretaria de Esportes', color: '#F59E0B', departmentId: 'esportes' },
  { id: 'habitacao', name: 'Secretaria de Habitação', color: '#06B6D4', departmentId: 'habitacao' },
  { id: 'meio-ambiente', name: 'Secretaria de Meio Ambiente', color: '#22C55E', departmentId: 'meio-ambiente' },
  { id: 'obras-publicas', name: 'Secretaria de Obras Públicas', color: '#F97316', departmentId: 'obras-publicas' },
  { id: 'planejamento-urbano', name: 'Secretaria de Planejamento Urbano', color: '#6366F1', departmentId: 'planejamento-urbano' },
  { id: 'saude', name: 'Secretaria de Saúde', color: '#EF4444', departmentId: 'saude' },
  { id: 'seguranca', name: 'Secretaria de Segurança', color: '#DC2626', departmentId: 'seguranca' },
  { id: 'servicos-publicos', name: 'Secretaria de Serviços Públicos', color: '#8B5CF6', departmentId: 'servicos-publicos' },
  { id: 'turismo', name: 'Secretaria de Turismo', color: '#EC4899', departmentId: 'turismo' }
];

const configTemplate = (sec: any) => `import { SecretariaConfig } from '../../schemas/secretaria.schema';

export const ${sec.id.replace(/-/g, '')}Config: SecretariaConfig = {
  id: '${sec.id}',
  name: '${sec.name}',
  slug: '${sec.id}',
  departmentId: '${sec.departmentId}',
  icon: 'Building',
  color: '${sec.color}',
  description: 'Gestão de ${sec.name}',

  modules: [
    {
      id: 'atendimentos',
      name: 'Atendimentos',
      moduleType: 'ATENDIMENTO_${sec.id.toUpperCase().replace(/-/g, '_')}',
      icon: 'ClipboardList',
      description: 'Atendimentos da ${sec.name}',

      fields: [
        {
          name: 'citizenName',
          label: 'Nome do Cidadão',
          type: 'string',
          required: true,
          display: { showInList: true, showInDetail: true, showInForm: true, order: 1 }
        },
        {
          name: 'citizenCpf',
          label: 'CPF',
          type: 'cpf',
          required: true,
          display: { showInList: true, showInDetail: true, showInForm: true, order: 2 }
        },
        {
          name: 'requestDate',
          label: 'Data da Solicitação',
          type: 'date',
          required: true,
          display: { showInList: true, showInDetail: true, showInForm: true, order: 3 }
        },
        {
          name: 'description',
          label: 'Descrição',
          type: 'text',
          required: true,
          display: { showInList: false, showInDetail: true, showInForm: true, order: 4 }
        }
      ],

      display: {
        listColumns: ['citizenName', 'citizenCpf', 'requestDate'],
        searchFields: ['citizenName', 'citizenCpf'],
        sortableFields: ['citizenName', 'requestDate'],
        filterFields: [],
        titleTemplate: '{citizenName}'
      },

      documents: {
        allowedTypes: ['pdf', 'jpg', 'png'],
        maxSize: 5,
        required: false,
        categories: ['Documentos']
      },

      approval: {
        requiredRole: 'MANAGER',
        autoApprove: false,
        notifyOnApproval: true,
        notifyOnRejection: true
      },

      notifications: {
        onCreate: { subject: 'Atendimento Solicitado', template: 'atendimento-criado' },
        onUpdate: { subject: 'Atendimento Atualizado', template: 'atendimento-atualizado' },
        onApprove: { subject: 'Atendimento Aprovado', template: 'atendimento-aprovado' },
        onReject: { subject: 'Atendimento Rejeitado', template: 'atendimento-rejeitado' }
      },

      dashboard: {
        charts: [],
        metrics: [],
        kpis: []
      }
    }
  ],

  settings: {
    enableNotifications: true,
    enableApproval: true,
    enableDocuments: true,
    enableHistory: true,
    enableExport: true,
    enableBulkActions: true
  }
};
`;

async function createConfigs() {
  const outputDir = path.join(__dirname, 'secretarias');
  
  for (const sec of secretarias) {
    const filename = `${sec.id}.config.ts`;
    const filepath = path.join(outputDir, filename);
    const content = configTemplate(sec);
    
    await fs.writeFile(filepath, content, 'utf-8');
    console.log(`✓ Created: ${filename}`);
  }
  
  console.log(`\n✅ Created ${secretarias.length} config files!`);
}

createConfigs().catch(console.error);
