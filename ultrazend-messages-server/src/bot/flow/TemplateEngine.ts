/**
 * TemplateEngine
 * Motor de templates para renderizar variáveis do estado em strings
 * Suporta: {{variable}}, {{object.property}}, {{array[0]}}
 */

import { FlowState } from '../types';

export class TemplateEngine {
  /**
   * Renderiza string com templates substituindo variáveis do estado
   * Ex: "Olá {{name}}, seu protocolo é {{protocol.number}}"
   */
  render(template: string, state: FlowState): string {
    if (typeof template !== 'string') return String(template);

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.resolve(path.trim(), state);
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Resolve caminho no estado
   * Ex: "user.profile.name" => state.user.profile.name
   * Ex: "items[0].name" => state.items[0].name
   */
  resolve(path: string, state: FlowState): any {
    try {
      // Remove espaços
      path = path.trim();

      // Se não tem . ou [, retorna direto
      if (!path.includes('.') && !path.includes('[')) {
        return state[path];
      }

      // Divide por . e processa [índice]
      const keys = path.split('.');
      let value: any = state;

      for (const key of keys) {
        if (value === undefined || value === null) {
          return undefined;
        }

        // Processa array[index]
        if (key.includes('[')) {
          const match = key.match(/^([^\[]+)\[(\d+)\]$/);
          if (match) {
            const [, arrayKey, index] = match;
            value = value[arrayKey]?.[parseInt(index)];
          } else {
            value = value[key];
          }
        } else {
          value = value[key];
        }
      }

      return value;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Renderiza objeto recursivamente substituindo templates
   */
  renderObject(obj: any, state: FlowState): any {
    if (typeof obj === 'string') {
      return this.render(obj, state);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.renderObject(item, state));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.renderObject(value, state);
      }
      return result;
    }

    return obj;
  }

  /**
   * Formata valores para exibição
   */
  format(value: any, format?: string): string {
    if (value === undefined || value === null) {
      return '';
    }

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'datetime':
        return new Date(value).toLocaleString('pt-BR');
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(value);
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'capitalize':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      default:
        return String(value);
    }
  }

  /**
   * Helper para formatar review de dados
   */
  formatReview(state: FlowState, fields?: string[]): string {
    const lines: string[] = [];

    const dataToReview = fields
      ? fields.reduce((acc, field) => {
          acc[field] = this.resolve(field, state);
          return acc;
        }, {} as any)
      : state;

    for (const [key, value] of Object.entries(dataToReview)) {
      if (value !== undefined && value !== null) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

        if (typeof value === 'object' && !Array.isArray(value)) {
          lines.push(`**${label}:**`);
          for (const [subKey, subValue] of Object.entries(value)) {
            lines.push(`  - ${subKey}: ${subValue}`);
          }
        } else if (Array.isArray(value)) {
          lines.push(`**${label}:** ${value.length} item(s)`);
        } else {
          lines.push(`**${label}:** ${value}`);
        }
      }
    }

    return lines.join('\n');
  }
}
