/**
 * ============================================================================
 * MIGRATE SERVICE SCHEMAS
 * ============================================================================
 * Script para migrar schemas de serviços do formato antigo para o novo
 * formato estruturado (ServiceFormSchema).
 *
 * EXECUTAR: npx tsx src/scripts/migrate-service-schemas.ts
 */

import { prisma } from '../lib/prisma';
import {
  ServiceFormSchema,
  ServiceFormField,
  LinkedCitizensConfig,
  ServiceFormFieldType,
} from '../types/service-schema.types';

interface LegacyFormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  enabled?: boolean;
  category?: string;
  options?: any[];
  placeholder?: string;
  description?: string;
  validation?: any;
  [key: string]: any;
}

interface LegacyFormSchema {
  fields?: LegacyFormField[];
  [key: string]: any;
}

/**
 * Normaliza o tipo de campo do formato antigo para o novo
 */
function normalizeFieldType(oldType: string): ServiceFormFieldType {
  const typeMap: Record<string, ServiceFormFieldType> = {
    text: 'text',
    textarea: 'textarea',
    select: 'select',
    'select-table': 'select-table',
    date: 'date',
    datetime: 'datetime',
    checkbox: 'checkbox',
    radio: 'radio',
    number: 'number',
    email: 'email',
    phone: 'phone',
    cpf: 'cpf',
    cep: 'cep',
    file: 'file',
    multiselect: 'multiselect',
  };

  return typeMap[oldType] || 'text';
}

/**
 * Extrai campos do cidadão de um schema antigo
 */
function extractCitizenFields(legacySchema: any): string[] {
  const citizenFields: string[] = [];

  // Se houver formFieldsConfig
  if (legacySchema.formFieldsConfig && Array.isArray(legacySchema.formFieldsConfig)) {
    for (const field of legacySchema.formFieldsConfig) {
      if (field.category === 'citizen' || isCitizenField(field.id)) {
        citizenFields.push(field.id);
      }
    }
  }

  // Se houver formSchema.fields
  if (legacySchema.formSchema?.fields && Array.isArray(legacySchema.formSchema.fields)) {
    for (const field of legacySchema.formSchema.fields) {
      if (field.category === 'citizen' || isCitizenField(field.id)) {
        if (!citizenFields.includes(field.id)) {
          citizenFields.push(field.id);
        }
      }
    }
  }

  return citizenFields;
}

/**
 * Verifica se um campo é do cidadão baseado no ID
 */
function isCitizenField(fieldId: string): boolean {
  const citizenFieldIds = [
    'cpf',
    'name',
    'nome',
    'email',
    'phone',
    'telefone',
    'birthDate',
    'dataNascimento',
    'rg',
    'address',
    'endereco',
    'cep',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cidade',
    'uf',
    'motherName',
    'nomeMae',
    'maritalStatus',
    'estadoCivil',
    'occupation',
    'profissao',
    'phoneSecondary',
    'telefone2',
  ];

  return citizenFieldIds.some((id) =>
    fieldId.toLowerCase().includes(id.toLowerCase())
  );
}

/**
 * Normaliza campos do formato antigo para o novo
 */
function normalizeFields(
  legacySchema: any,
  citizenFieldIds: string[]
): ServiceFormField[] {
  const fields: ServiceFormField[] = [];
  let processedFields = new Set<string>();

  // Prioridade 1: formFieldsConfig (mais recente)
  if (legacySchema.formFieldsConfig && Array.isArray(legacySchema.formFieldsConfig)) {
    for (const oldField of legacySchema.formFieldsConfig) {
      // Pular campos do cidadão (já estão em citizenFields)
      if (citizenFieldIds.includes(oldField.id)) {
        continue;
      }

      const newField: ServiceFormField = {
        id: oldField.id,
        label: oldField.label || oldField.id,
        type: normalizeFieldType(oldField.type || 'text'),
        required: oldField.required || false,
        enabled: oldField.enabled !== false, // default true
        category: oldField.category as any || 'additional',
        placeholder: oldField.placeholder,
        description: oldField.description,
        options: oldField.options,
        validation: oldField.validation,
        order: oldField.order,
        width: oldField.width,
        fullWidth: oldField.fullWidth,
        defaultValue: oldField.defaultValue,
        metadata: oldField.metadata,
      };

      // Se tem dataSource, adicionar
      if (oldField.dataSource) {
        newField.dataSource = oldField.dataSource;
      }

      fields.push(newField);
      processedFields.add(oldField.id);
    }
  }

  // Prioridade 2: formSchema.fields (mais antigo, apenas campos que não foram processados)
  if (legacySchema.formSchema?.fields && Array.isArray(legacySchema.formSchema.fields)) {
    for (const oldField of legacySchema.formSchema.fields) {
      // Pular se já processado
      if (processedFields.has(oldField.id)) {
        continue;
      }

      // Pular campos do cidadão
      if (citizenFieldIds.includes(oldField.id)) {
        continue;
      }

      const newField: ServiceFormField = {
        id: oldField.id,
        label: oldField.label || oldField.id,
        type: normalizeFieldType(oldField.type || 'text'),
        required: oldField.required || false,
        enabled: oldField.enabled !== false,
        category: oldField.category as any || 'additional',
        placeholder: oldField.placeholder,
        description: oldField.description,
        options: oldField.options,
        validation: oldField.validation,
      };

      if (oldField.dataSource) {
        newField.dataSource = oldField.dataSource;
      }

      fields.push(newField);
      processedFields.add(oldField.id);
    }
  }

  return fields;
}

/**
 * Normaliza linkedCitizensConfig
 */
function normalizeLinkedCitizensConfig(legacyConfig: any): LinkedCitizensConfig | undefined {
  if (!legacyConfig) {
    return undefined;
  }

  // Se já está no formato correto
  if (legacyConfig.enabled !== undefined && legacyConfig.links) {
    return legacyConfig as LinkedCitizensConfig;
  }

  // Se é um array de links (formato antigo)
  if (Array.isArray(legacyConfig)) {
    return {
      enabled: true,
      links: legacyConfig,
    };
  }

  return undefined;
}

/**
 * Migra um serviço do formato antigo para o novo
 */
async function migrateService(service: any): Promise<{
  success: boolean;
  changes: string[];
  warnings: string[];
}> {
  const changes: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Extrair campos do cidadão
    const citizenFields = extractCitizenFields({
      formSchema: service.formSchema,
      formFieldsConfig: service.formFieldsConfig,
    });

    if (citizenFields.length > 0) {
      changes.push(`Extracted ${citizenFields.length} citizen fields`);
    }

    // 2. Normalizar campos
    const fields = normalizeFields(
      {
        formSchema: service.formSchema,
        formFieldsConfig: service.formFieldsConfig,
      },
      citizenFields
    );

    changes.push(`Normalized ${fields.length} custom fields`);

    // 3. Normalizar linkedCitizensConfig
    let linkedCitizensConfig: LinkedCitizensConfig | undefined;

    if (service.linkedCitizensConfig) {
      linkedCitizensConfig = normalizeLinkedCitizensConfig(service.linkedCitizensConfig);
      if (linkedCitizensConfig) {
        changes.push(
          `Migrated linkedCitizensConfig with ${linkedCitizensConfig.links?.length || 0} link types`
        );
      }
    }

    // 4. Construir novo schema
    const newSchema: ServiceFormSchema = {
      version: '1.0',
      citizenFields,
      fields,
      linkedCitizensConfig,
      submission: {
        autoProcessCitizenLinks: linkedCitizensConfig?.enabled || false,
        validateFamilyComposition: linkedCitizensConfig?.enabled || false,
      },
    };

    // 5. Atualizar no banco
    await prisma.serviceSimplified.update({
      where: { id: service.id },
      data: {
        formSchemaStructured: newSchema as any,
      },
    });

    changes.push('Schema migrated successfully');

    return {
      success: true,
      changes,
      warnings,
    };
  } catch (error: any) {
    warnings.push(`Migration failed: ${error.message}`);
    return {
      success: false,
      changes,
      warnings,
    };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Starting service schema migration...\n');

  try {
    // Buscar todos os serviços
    const services = await prisma.serviceSimplified.findMany({
      select: {
        id: true,
        name: true,
        formSchema: true,
        formFieldsConfig: true,
        linkedCitizensConfig: true,
        formSchemaStructured: true,
      },
    });

    console.log(`📦 Found ${services.length} services to migrate\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const service of services) {
      // Pular se já tem formSchemaStructured
      if (service.formSchemaStructured) {
        console.log(`⏭️  Skipping "${service.name}" - already migrated`);
        skipCount++;
        continue;
      }

      console.log(`\n🔄 Migrating "${service.name}"...`);

      const result = await migrateService(service);

      if (result.success) {
        console.log('✅ Success!');
        result.changes.forEach((change) => console.log(`   - ${change}`));
        successCount++;
      } else {
        console.log('❌ Failed!');
        result.warnings.forEach((warning) => console.log(`   - ${warning}`));
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${services.length}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!\n');
    } else {
      console.log('⚠️  Migration completed with errors. Please review the logs.\n');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main();
