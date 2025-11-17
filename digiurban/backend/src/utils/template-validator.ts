/**
 * ============================================================================
 * TEMPLATE VALIDATOR - Validação de Templates de Serviços
 * ============================================================================
 *
 * Garante que todos os templates estão no formato correto antes de serem
 * inseridos no banco de dados.
 *
 * @author DigiUrban Team
 * @version 1.0
 */

interface TemplateField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface TemplateSchema {
  fields: TemplateField[];
}

interface Template {
  code: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  moduleType?: string;
  moduleEntity?: string;
  estimatedTime: string;
  defaultFields: TemplateSchema;
  requiredDocs: {
    documents: string[];
  };
  fieldMapping?: Record<string, string>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class TemplateValidator {
  private static VALID_CATEGORIES = [
    'Educação',
    'Saúde',
    'Assistência Social',
    'Habitação',
    'Obras Públicas',
    'Serviços Públicos',
    'Cultura',
    'Esporte',
    'Turismo',
    'Meio Ambiente',
    'Agricultura',
    'Planejamento Urbano',
    'Segurança',
  ];

  private static VALID_MODULE_TYPES = [
    'education',
    'health',
    'housing',
    'social',
    'culture',
    'sports',
    'environment',
    'security',
    'urban_planning',
    'agriculture',
    'tourism',
    'public_works',
    'public_services',
    'custom',
  ];

  private static VALID_FIELD_TYPES = [
    'text',
    'number',
    'email',
    'phone',
    'date',
    'datetime',
    'boolean',
    'select',
    'textarea',
    'file',
  ];

  /**
   * Valida um template individual
   */
  static validateTemplate(template: Template): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validar campos obrigatórios
    if (!template.code) {
      errors.push('Campo "code" é obrigatório');
    } else if (!/^[A-Z]+_[A-Z_]+_\d{3}$/.test(template.code)) {
      errors.push(`Código "${template.code}" inválido. Formato: CAT_NOME_001`);
    }

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Campo "name" é obrigatório');
    }

    if (!template.category) {
      errors.push('Campo "category" é obrigatório');
    } else if (!this.VALID_CATEGORIES.includes(template.category)) {
      errors.push(
        `Categoria "${template.category}" inválida. Categorias válidas: ${this.VALID_CATEGORIES.join(', ')}`
      );
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Campo "description" é obrigatório');
    }

    if (!template.estimatedTime || template.estimatedTime.trim().length === 0) {
      errors.push('Campo "estimatedTime" é obrigatório');
    }

    // 2. Validar moduleType (opcional, mas se presente deve ser válido)
    if (template.moduleType && !this.VALID_MODULE_TYPES.includes(template.moduleType)) {
      errors.push(
        `moduleType "${template.moduleType}" inválido. Tipos válidos: ${this.VALID_MODULE_TYPES.join(', ')}`
      );
    }

    // 3. Validar defaultFields
    if (!template.defaultFields) {
      errors.push('Campo "defaultFields" é obrigatório');
    } else {
      if (!template.defaultFields.fields || !Array.isArray(template.defaultFields.fields)) {
        errors.push('defaultFields.fields deve ser um array');
      } else if (template.defaultFields.fields.length === 0) {
        warnings.push('Template não possui campos no formulário (fields vazio)');
      } else {
        // Validar cada field
        template.defaultFields.fields.forEach((field, index) => {
          const fieldErrors = this.validateField(field, index);
          errors.push(...fieldErrors);
        });
      }
    }

    // 4. Validar requiredDocs
    if (!template.requiredDocs) {
      errors.push('Campo "requiredDocs" é obrigatório');
    } else if (!Array.isArray(template.requiredDocs.documents)) {
      errors.push('requiredDocs.documents deve ser um array');
    }

    // 5. Validar icon (warning se não tiver)
    if (!template.icon) {
      warnings.push('Template não possui ícone definido');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
        };
  }

  /**
   * Valida um field individual
   */
  private static validateField(field: TemplateField, index: number): string[] {
    const errors: string[] = [];

    if (!field.id) {
      errors.push(`Field[${index}]: "id" é obrigatório`);
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.id)) {
      errors.push(
        `Field[${index}]: "id" inválido "${field.id}". Use apenas letras, números e underscore`
      );
    }

    if (!field.label || field.label.trim().length === 0) {
      errors.push(`Field[${index}]: "label" é obrigatório`);
    }

    if (!field.type) {
      errors.push(`Field[${index}]: "type" é obrigatório`);
    } else if (!this.VALID_FIELD_TYPES.includes(field.type)) {
      errors.push(
        `Field[${index}]: type "${field.type}" inválido. Tipos válidos: ${this.VALID_FIELD_TYPES.join(', ')}`
      );
    }

    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      errors.push(`Field[${index}]: tipo "select" requer array "options" com pelo menos 1 item`);
    }

    if (typeof field.required !== 'boolean') {
      errors.push(`Field[${index}]: "required" deve ser boolean (true/false)`);
    }

    return errors;
  }

  /**
   * Valida um array de templates
   */
  static validateTemplates(templates: Template[]): {
    valid: boolean;
    totalTemplates: number;
    validTemplates: number;
    invalidTemplates: number;
    results: Array<{ template: string; validation: ValidationResult }>;
  } {
    const results: Array<{ template: string; validation: ValidationResult }> = [];
    let validCount = 0;

    templates.forEach((template) => {
      const validation = this.validateTemplate(template);
      results.push({
        template: template.code || 'UNKNOWN',
        validation
        });

      if (validation.valid) {
        validCount++;
      }
    });

    return {
      valid: validCount === templates.length,
      totalTemplates: templates.length,
      validTemplates: validCount,
      invalidTemplates: templates.length - validCount,
      results
        };
  }

  /**
   * Valida códigos únicos (não pode haver duplicatas)
   */
  static validateUniqueCodes(templates: Template[]): {
    valid: boolean;
    duplicates: string[];
  } {
    const codes = templates.map((t) => t.code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);

    return {
      valid: duplicates.length === 0,
      duplicates: [...new Set(duplicates)]
        };
  }

  /**
   * Relatório completo de validação
   */
  static generateReport(templates: Template[]): string {
    const validation = this.validateTemplates(templates);
    const uniqueCheck = this.validateUniqueCodes(templates);

    let report = '═══════════════════════════════════════════════════════════\n';
    report += '         RELATÓRIO DE VALIDAÇÃO DE TEMPLATES\n';
    report += '═══════════════════════════════════════════════════════════\n\n';

    report += `Total de Templates: ${validation.totalTemplates}\n`;
    report += `✅ Válidos: ${validation.validTemplates}\n`;
    report += `❌ Inválidos: ${validation.invalidTemplates}\n\n`;

    // Verificar códigos únicos
    if (!uniqueCheck.valid) {
      report += '⚠️  CÓDIGOS DUPLICADOS ENCONTRADOS:\n';
      uniqueCheck.duplicates.forEach((code) => {
        report += `   - ${code}\n`;
      });
      report += '\n';
    }

    // Erros por template
    const invalidTemplates = validation.results.filter((r) => !r.validation.valid);
    if (invalidTemplates.length > 0) {
      report += '❌ TEMPLATES COM ERROS:\n\n';
      invalidTemplates.forEach((result) => {
        report += `   Template: ${result.template}\n`;
        result.validation.errors.forEach((error) => {
          report += `      ❌ ${error}\n`;
        });
        if (result.validation.warnings.length > 0) {
          result.validation.warnings.forEach((warning) => {
            report += `      ⚠️  ${warning}\n`;
          });
        }
        report += '\n';
      });
    }

    // Warnings
    const templatesWithWarnings = validation.results.filter(
      (r) => r.validation.warnings.length > 0 && r.validation.valid
    );
    if (templatesWithWarnings.length > 0) {
      report += '⚠️  TEMPLATES COM AVISOS:\n\n';
      templatesWithWarnings.forEach((result) => {
        report += `   Template: ${result.template}\n`;
        result.validation.warnings.forEach((warning) => {
          report += `      ⚠️  ${warning}\n`;
        });
        report += '\n';
      });
    }

    // Status final
    report += '═══════════════════════════════════════════════════════════\n';
    if (validation.valid && uniqueCheck.valid) {
      report += '✅ TODOS OS TEMPLATES SÃO VÁLIDOS!\n';
    } else {
      report += '❌ VALIDAÇÃO FALHOU - CORRIJA OS ERROS ACIMA\n';
    }
    report += '═══════════════════════════════════════════════════════════\n';

    return report;
  }
}
